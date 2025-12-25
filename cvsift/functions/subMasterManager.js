const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

/**
 * Check if user is the primary master (emma@automore.co.za)
 */
function isPrimaryMaster(email) {
  const primaryMasterEmail = process.env.PRIMARY_MASTER_EMAIL || "emma@automore.co.za";
  return email.toLowerCase() === primaryMasterEmail.toLowerCase();
}

/**
 * Primary master can add sub-master accounts
 * Sub-masters get full access but cannot create more masters
 */
exports.addSubMaster = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const currentUserEmail = request.auth.token.email;
    const {email, password, displayName} = request.data;

    // Only primary master can add sub-masters
    if (!isPrimaryMaster(currentUserEmail)) {
      throw new HttpsError(
          "permission-denied",
          "Only the primary master can add sub-master accounts",
      );
    }

    // Validate input
    if (!email || !password) {
      throw new HttpsError(
          "invalid-argument",
          "Email and password are required",
      );
    }

    // Validate password strength
    if (password.length < 6) {
      throw new HttpsError(
          "invalid-argument",
          "Password must be at least 6 characters",
      );
    }

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      // User exists, update to sub-master
      await admin.auth().updateUser(userRecord.uid, {
        password: password,
        displayName: displayName || email.split("@")[0],
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Create new user
        userRecord = await admin.auth().createUser({
          email: email,
          password: password,
          displayName: displayName || email.split("@")[0],
          emailVerified: true, // Sub-masters don't need to verify
        });
      } else {
        throw error;
      }
    }

    // Create/update user document in Firestore
    const userRef = db.collection("users").doc(userRecord.uid);
    const userData = {
      email: email,
      displayName: displayName || email.split("@")[0],
      role: "submaster",
      plan: "enterprise", // Sub-masters get enterprise features
      cvUploadLimit: -1, // Unlimited
      cvUploadsThisMonth: 0,
      isActive: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    };

    // Check if document exists and if it has createdAt
    const existingDoc = await userRef.get();
    if (!existingDoc.exists) {
      // New document - set createdAt
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (!existingDoc.data().createdAt) {
      // Existing document but missing createdAt - set it now
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await userRef.set(userData, {merge: true});

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: "submaster",
      master: true, // Full access like master
      canCreateMasters: false, // Cannot create more masters
    });

    return {
      success: true,
      message: `Sub-master account created for ${email}`,
      userId: userRecord.uid,
    };
  } catch (error) {
    console.error("Error adding sub-master:", error);
    throw new HttpsError(
        "internal",
        `Failed to add sub-master: ${error.message}`,
    );
  }
});

/**
 * Primary master can list all sub-master accounts
 */
exports.listSubMasters = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const currentUserEmail = request.auth.token.email;

    // Only primary master can list sub-masters
    if (!isPrimaryMaster(currentUserEmail)) {
      throw new HttpsError(
          "permission-denied",
          "Only the primary master can list sub-master accounts",
      );
    }

    // Get all sub-masters
    const subMastersSnapshot = await db.collection("users")
        .where("role", "==", "submaster")
        .get();

    const subMasters = [];
    subMastersSnapshot.forEach((doc) => {
      const data = doc.data();
      subMasters.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
      });
    });

    return {
      success: true,
      subMasters: subMasters,
      count: subMasters.length,
    };
  } catch (error) {
    console.error("Error listing sub-masters:", error);
    throw new HttpsError(
        "internal",
        `Failed to list sub-masters: ${error.message}`,
    );
  }
});

/**
 * Primary master can disable/enable a sub-master account
 */
exports.toggleSubMasterStatus = onCall(
    {region: "us-central1"},
    async (request) => {
      try {
        if (!request.auth) {
          throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const currentUserEmail = request.auth.token.email;
        const {subMasterId, isActive} = request.data;

        // Only primary master can toggle sub-master status
        if (!isPrimaryMaster(currentUserEmail)) {
          throw new HttpsError(
              "permission-denied",
              "Only the primary master can manage sub-master accounts",
          );
        }

        if (!subMasterId) {
          throw new HttpsError("invalid-argument", "subMasterId is required");
        }

        // Update Firestore
        const userRef = db.collection("users").doc(subMasterId);
        const userDoc = await userRef.get();

        if (!userDoc.exists || userDoc.data().role !== "submaster") {
          throw new HttpsError("not-found", "Sub-master account not found");
        }

        await userRef.update({
          isActive: isActive,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Enable or disable the Firebase Auth account
        await admin.auth().updateUser(subMasterId, {
          disabled: !isActive,
        });

        return {
          success: true,
          message: `Sub-master account ${isActive ? "enabled" : "disabled"}`,
        };
      } catch (error) {
        console.error("Error toggling sub-master status:", error);
        throw new HttpsError(
            "internal",
            `Failed to toggle sub-master status: ${error.message}`,
        );
      }
    },
);

/**
 * Primary master can delete a sub-master account
 */
exports.deleteSubMaster = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const currentUserEmail = request.auth.token.email;
    const {subMasterId} = request.data;

    // Only primary master can delete sub-masters
    if (!isPrimaryMaster(currentUserEmail)) {
      throw new HttpsError(
          "permission-denied",
          "Only the primary master can delete sub-master accounts",
      );
    }

    if (!subMasterId) {
      throw new HttpsError("invalid-argument", "subMasterId is required");
    }

    // Verify it's a sub-master
    const userRef = db.collection("users").doc(subMasterId);
    const userDoc = await userRef.get();

    if (!userDoc.exists || userDoc.data().role !== "submaster") {
      throw new HttpsError("not-found", "Sub-master account not found");
    }

    // Delete from Firestore
    await userRef.delete();

    // Delete from Firebase Auth
    await admin.auth().deleteUser(subMasterId);

    return {
      success: true,
      message: "Sub-master account deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting sub-master:", error);
    throw new HttpsError(
        "internal",
        `Failed to delete sub-master: ${error.message}`,
    );
  }
});

/**
 * Check if current user is primary master
 */
exports.checkPrimaryMaster = onCall({region: "us-central1"}, async (request) => {
  try {
    if (!request.auth) {
      return {isPrimaryMaster: false};
    }

    const userEmail = request.auth.token.email;
    return {
      isPrimaryMaster: isPrimaryMaster(userEmail),
      email: userEmail,
    };
  } catch (error) {
    return {isPrimaryMaster: false};
  }
});
