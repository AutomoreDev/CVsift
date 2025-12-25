const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Cloud Function to check if a user is the master account
 * and upgrade their role if they match the master credentials
 */
exports.initializeMasterAccount = onCall(
    {region: "us-central1"},
    async (request) => {
      try {
      // Check if user is authenticated
        if (!request.auth) {
          throw new HttpsError(
              "unauthenticated",
              "User must be authenticated to check master status",
          );
        }

        const userId = request.auth.uid;
        const userEmail = request.auth.token.email;

        // Get primary master email from environment
        const primaryMasterEmail = process.env.MASTER_ACCOUNT_EMAIL || process.env.PRIMARY_MASTER_EMAIL;

        if (!primaryMasterEmail) {
          console.error("Master account email not configured in environment");
          return {
            isMaster: false,
            message: "Primary master account not configured",
          };
        }

        // Check if current user's email matches the primary master email
        if (userEmail.toLowerCase() !== primaryMasterEmail.toLowerCase().trim()) {
          return {
            isMaster: false,
            message: "Not primary master account",
          };
        }

        // Get user document
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          throw new HttpsError("not-found", "User document not found");
        }

        const userData = userDoc.data();

        // Check if already a master
        if (userData.role === "master") {
          return {
            isMaster: true,
            message: "Already configured as master account",
            userData: userData,
          };
        }

        // Upgrade user to master role
        await userRef.update({
          role: "master",
          plan: "enterprise", // Master gets enterprise features
          cvUploadLimit: -1, // Unlimited uploads
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Get updated user data
        const updatedUserDoc = await userRef.get();

        return {
          isMaster: true,
          message: "Successfully upgraded to master account",
          userData: updatedUserDoc.data(),
        };
      } catch (error) {
        throw new HttpsError(
            "internal",
            `Failed to initialize master account: ${error.message}`,
        );
      }
    },
);

/**
 * Cloud Function to check if current user is a master account
 */
exports.checkMasterStatus = onCall(
    {region: "us-central1"},
    async (request) => {
      try {
        if (!request.auth) {
          return {isMaster: false};
        }

        const userId = request.auth.uid;
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          return {isMaster: false};
        }

        const userData = userDoc.data();
        return {
          isMaster: userData.role === "master",
          role: userData.role,
        };
      } catch (error) {
        return {isMaster: false};
      }
    },
);

/**
 * Cloud Function for master account to get all users
 * (Full access to all user data)
 */
exports.getAllUsers = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;

    // Verify user is master
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data().role !== "master") {
      throw new HttpsError(
          "permission-denied",
          "Only master accounts can access all users",
      );
    }

    // Get all users
    const usersSnapshot = await db.collection("users").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      users: users,
      count: users.length,
    };
  } catch (error) {
    throw new HttpsError(
        "internal",
        `Failed to get users: ${error.message}`,
    );
  }
});

/**
 * Cloud Function for master account to get all CVs
 * (Full access to all CV data)
 */
exports.getAllCVs = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;

    // Verify user is master
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data().role !== "master") {
      throw new HttpsError(
          "permission-denied",
          "Only master accounts can access all CVs",
      );
    }

    // Get all CVs
    const cvsSnapshot = await db.collection("cvs").get();
    const cvs = [];

    cvsSnapshot.forEach((doc) => {
      cvs.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      cvs: cvs,
      count: cvs.length,
    };
  } catch (error) {
    throw new HttpsError("internal", `Failed to get CVs: ${error.message}`);
  }
});

/**
 * Cloud Function for master account to update any user
 */
exports.updateAnyUser = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const {targetUserId, updates} = request.data;

    if (!targetUserId || !updates) {
      throw new HttpsError(
          "invalid-argument",
          "targetUserId and updates are required",
      );
    }

    // Verify user is master
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data().role !== "master") {
      throw new HttpsError(
          "permission-denied",
          "Only master accounts can update any user",
      );
    }

    // Prevent changing another user to master role
    if (updates.role === "master" && targetUserId !== userId) {
      throw new HttpsError(
          "permission-denied",
          "Cannot change another user to master role",
      );
    }

    // Update target user
    const targetUserRef = db.collection("users").doc(targetUserId);
    await targetUserRef.update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "User updated successfully",
    };
  } catch (error) {
    throw new HttpsError(
        "internal",
        `Failed to update user: ${error.message}`,
    );
  }
});
