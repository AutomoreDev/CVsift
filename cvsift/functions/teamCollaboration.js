/* eslint-disable max-len */
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const {teamInvitationEmail} = require("./emailTemplates");

/**
 * Get invitation data for acceptance page
 */
exports.getInviteData = onCall(async (request) => {
  const {inviteId} = request.data;

  if (!inviteId) {
    throw new HttpsError("invalid-argument", "Invite ID is required");
  }

  try {
    const db = admin.firestore();
    const inviteDoc = await db.collection("teamInvites").doc(inviteId).get();

    if (!inviteDoc.exists) {
      return {
        success: false,
        message: "Invitation not found",
      };
    }

    const inviteData = inviteDoc.data();

    // Check if invite is still pending
    if (inviteData.status !== "pending") {
      return {
        success: false,
        message: "This invitation has already been used",
      };
    }

    // Check if invite has expired
    const now = new Date();
    const expiresAt = inviteData.expiresAt?.toDate();

    if (expiresAt && now > expiresAt) {
      return {
        success: false,
        message: "This invitation has expired",
      };
    }

    // Return public invite data (no sensitive info)
    return {
      success: true,
      invite: {
        email: inviteData.email,
        role: inviteData.role,
        teamOwnerName: inviteData.teamOwnerName,
        invitedBy: inviteData.invitedBy,
      },
    };
  } catch (error) {
    console.error("Error getting invite data:", error);
    throw new HttpsError("internal", "Failed to load invitation");
  }
});

/**
 * Send team invitation email
 */
exports.sendTeamInvite = onCall(async (request) => {
  const {email, role, teamOwnerName} = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  if (!email || !role) {
    throw new HttpsError("invalid-argument", "Email and role are required");
  }

  try {
    const db = admin.firestore();

    // Get user's plan to check team limits
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const userPlan = userData.plan || "free";

    // Check if user has access to team collaboration
    const allowedPlans = ["professional", "business", "enterprise"];
    if (!allowedPlans.includes(userPlan)) {
      throw new HttpsError(
          "permission-denied",
          "Team collaboration is only available for Professional, Business, and Enterprise plans.",
      );
    }

    // Get team size limits
    const teamLimits = {
      professional: 3,
      business: 10,
      enterprise: 999,
    };
    const teamLimit = teamLimits[userPlan] || 1;

    // Count current team members + pending invites
    const membersSnapshot = await db.collection("teamMembers")
        .where("teamOwnerId", "==", userId)
        .get();

    const invitesSnapshot = await db.collection("teamInvites")
        .where("invitedBy", "==", userId)
        .where("status", "==", "pending")
        .get();

    const totalMembers = membersSnapshot.size + invitesSnapshot.size + 1; // +1 for owner

    if (totalMembers >= teamLimit) {
      throw new HttpsError(
          "resource-exhausted",
          `Your ${userPlan} plan supports up to ${teamLimit} team member${teamLimit > 1 ? "s" : ""}. Upgrade to add more.`,
      );
    }

    // Check if user already exists as member or has pending invite
    const existingMember = await db.collection("teamMembers")
        .where("teamOwnerId", "==", userId)
        .where("email", "==", email)
        .get();

    if (!existingMember.empty) {
      throw new HttpsError("already-exists", "This user is already a team member");
    }

    const existingInvite = await db.collection("teamInvites")
        .where("invitedBy", "==", userId)
        .where("email", "==", email)
        .where("status", "==", "pending")
        .get();

    if (!existingInvite.empty) {
      throw new HttpsError("already-exists", "An invitation has already been sent to this email");
    }

    // Create invitation document
    const inviteData = {
      email: email.toLowerCase(),
      role: role,
      invitedBy: userId,
      invitedByEmail: userData.email,
      teamOwnerName: teamOwnerName || userData.displayName || userData.email,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ),
    };

    const inviteRef = await db.collection("teamInvites").add(inviteData);

    // Send invitation email
    try {
      // Create nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Generate accept invitation URL
      const appUrl = process.env.APP_URL || "https://cvsift-3dff8.web.app";
      const acceptUrl = `${appUrl}/accept-invite?inviteId=${inviteRef.id}`;

      // Get email template
      const emailContent = teamInvitationEmail(
          inviteData.teamOwnerName,
          role,
          acceptUrl,
      );

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "CVSift Team <noreply@cvsift.com>",
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      console.log(`Team invitation email sent to ${email} by user ${userId}`);
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the whole operation if email fails - invitation is still created
      // User can manually share the link
    }

    return {
      success: true,
      inviteId: inviteRef.id,
      message: `Invitation sent to ${email}`,
    };
  } catch (error) {
    console.error("Error sending team invite:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to send invitation: ${error.message}`);
  }
});

/**
 * Accept team invitation
 */
exports.acceptTeamInvite = onCall(async (request) => {
  const {inviteId} = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  if (!inviteId) {
    throw new HttpsError("invalid-argument", "Invite ID is required");
  }

  try {
    const db = admin.firestore();

    // Get invitation
    const inviteDoc = await db.collection("teamInvites").doc(inviteId).get();

    if (!inviteDoc.exists) {
      throw new HttpsError("not-found", "Invitation not found");
    }

    const inviteData = inviteDoc.data();

    // Check if invitation is still pending
    if (inviteData.status !== "pending") {
      throw new HttpsError("failed-precondition", "This invitation is no longer valid");
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = inviteData.expiresAt.toDate();
    if (now > expiresAt) {
      await inviteDoc.ref.update({status: "expired"});
      throw new HttpsError("failed-precondition", "This invitation has expired");
    }

    // Get user's email
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();

    // Verify email matches invitation
    const userEmail = userData.email?.toLowerCase()?.trim();
    const inviteEmail = inviteData.email?.toLowerCase()?.trim();

    if (userEmail !== inviteEmail) {
      throw new HttpsError(
          "permission-denied",
          `This invitation was sent to ${inviteData.email}. You are signed in as ${userData.email}. Please sign in with the correct email address.`,
      );
    }

    // Create team member document
    const memberData = {
      userId: userId,
      email: userData.email,
      displayName: userData.displayName || null,
      role: inviteData.role,
      teamOwnerId: inviteData.invitedBy,
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("teamMembers").add(memberData);

    // Update invitation status
    await inviteDoc.ref.update({
      status: "accepted",
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    console.log(`User ${userId} accepted team invitation ${inviteId}`);

    return {
      success: true,
      teamOwnerId: inviteData.invitedBy,
      message: "You have successfully joined the team",
    };
  } catch (error) {
    console.error("Error accepting team invite:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to accept invitation: ${error.message}`);
  }
});

/**
 * Remove team member
 */
exports.removeTeamMember = onCall(async (request) => {
  const {memberId} = request.data;
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  if (!memberId) {
    throw new HttpsError("invalid-argument", "Member ID is required");
  }

  try {
    const db = admin.firestore();

    // Get team member document
    const memberDoc = await db.collection("teamMembers").doc(memberId).get();

    if (!memberDoc.exists) {
      throw new HttpsError("not-found", "Team member not found");
    }

    const memberData = memberDoc.data();

    // Verify that the current user is the team owner
    if (memberData.teamOwnerId !== userId) {
      throw new HttpsError("permission-denied", "Only the team owner can remove members");
    }

    // Delete team member document
    await memberDoc.ref.delete();

    console.log(`Team member ${memberId} removed by user ${userId}`);

    return {
      success: true,
      message: "Team member removed successfully",
    };
  } catch (error) {
    console.error("Error removing team member:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to remove team member: ${error.message}`);
  }
});

/**
 * Get team members for current user
 */
exports.getTeamMembers = onCall(async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const db = admin.firestore();

    // Get team members where user is owner
    const membersSnapshot = await db.collection("teamMembers")
        .where("teamOwnerId", "==", userId)
        .get();

    const members = membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get pending invites
    const invitesSnapshot = await db.collection("teamInvites")
        .where("invitedBy", "==", userId)
        .where("status", "==", "pending")
        .get();

    const pendingInvites = invitesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      members: members,
      pendingInvites: pendingInvites,
    };
  } catch (error) {
    console.error("Error getting team members:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to get team members: ${error.message}`);
  }
});

/**
 * Check if user is part of a team (as member or owner)
 */
exports.checkTeamAccess = onCall(async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const db = admin.firestore();

    // Check if user is a team owner
    const ownedTeamsSnapshot = await db.collection("teamMembers")
        .where("teamOwnerId", "==", userId)
        .limit(1)
        .get();

    if (!ownedTeamsSnapshot.empty) {
      return {
        success: true,
        isTeamOwner: true,
        teamOwnerId: userId,
      };
    }

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (!memberSnapshot.empty) {
      const memberData = memberSnapshot.docs[0].data();

      // Get team owner's plan so member inherits it
      const ownerDoc = await db.collection("users").doc(memberData.teamOwnerId).get();
      const ownerPlan = ownerDoc.exists ? ownerDoc.data().plan : null;

      return {
        success: true,
        isTeamMember: true,
        teamOwnerId: memberData.teamOwnerId,
        role: memberData.role,
        ownerPlan: ownerPlan, // Team member inherits owner's plan
      };
    }

    return {
      success: true,
      isTeamOwner: false,
      isTeamMember: false,
    };
  } catch (error) {
    console.error("Error checking team access:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to check team access: ${error.message}`);
  }
});

/**
 * Get team owner's user data for display purposes
 * Used by team members to display owner's stats on dashboard
 */
exports.getTeamOwnerData = onCall(async (request) => {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  try {
    const db = admin.firestore();

    // Check if user is a team member
    const memberSnapshot = await db.collection("teamMembers")
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (memberSnapshot.empty) {
      throw new HttpsError(
          "permission-denied",
          "User is not a team member",
      );
    }

    const memberData = memberSnapshot.docs[0].data();
    const teamOwnerId = memberData.teamOwnerId;

    // Get team owner's user data
    const ownerDoc = await db.collection("users").doc(teamOwnerId).get();

    if (!ownerDoc.exists) {
      throw new HttpsError("not-found", "Team owner not found");
    }

    const ownerData = ownerDoc.data();

    // Return only the stats data needed for dashboard
    return {
      success: true,
      ownerData: {
        cvUploadsThisMonth: ownerData.cvUploadsThisMonth || 0,
        cvUploadLimit: ownerData.cvUploadLimit || 10,
        cvPackBalance: ownerData.cvPackBalance || 0,
        plan: ownerData.plan || "free",
      },
    };
  } catch (error) {
    console.error("Error getting team owner data:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to get team owner data: ${error.message}`);
  }
});

/**
 * Update team member role (admin <-> member)
 * Only team owner can update roles
 */
exports.updateTeamMemberRole = onCall(async (request) => {
  const userId = request.auth?.uid;
  const {memberId, newRole} = request.data;

  if (!userId) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  if (!memberId || !newRole) {
    throw new HttpsError("invalid-argument", "Member ID and new role are required");
  }

  if (!["admin", "member"].includes(newRole)) {
    throw new HttpsError("invalid-argument", "Role must be either 'admin' or 'member'");
  }

  try {
    const db = admin.firestore();

    // Get the team member document
    const memberDoc = await db.collection("teamMembers").doc(memberId).get();

    if (!memberDoc.exists) {
      throw new HttpsError("not-found", "Team member not found");
    }

    const memberData = memberDoc.data();

    // Verify the current user is the team owner
    if (memberData.teamOwnerId !== userId) {
      throw new HttpsError(
          "permission-denied",
          "Only the team owner can update member roles",
      );
    }

    // Update the role in teamMembers collection
    await db.collection("teamMembers").doc(memberId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update the role in the user's document (teamAccess.role)
    await db.collection("users").doc(memberData.userId).update({
      "teamAccess.role": newRole,
    });

    // Log the activity
    await db.collection("activityLogs").add({
      teamOwnerId: userId,
      userId: memberData.userId,
      action: "role_updated",
      details: {
        oldRole: memberData.role,
        newRole: newRole,
        memberEmail: memberData.email,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: `Member role updated to ${newRole}`,
    };
  } catch (error) {
    console.error("Error updating team member role:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to update member role: ${error.message}`);
  }
});
