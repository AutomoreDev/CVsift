const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const pdfParse = require("pdf-parse");
const AdmZip = require("adm-zip");
const xml2js = require("xml2js");
const {CV_PARSER_PROMPT} = require("./cvParserPrompts");
const {logCVUpload, logCVDelete, logCVUpdate} = require("./activityLogs");
const {logApiCall} = require("./apiLogger");

/**
 * Get team CVs for team members
 * Uses Admin SDK to bypass security rules
 * @param {object} request - The request object
 * @return {Promise<object>} - CVs data
 */
exports.getTeamCVs = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

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

    // Fetch owner's CVs using Admin SDK (bypasses security rules)
    const cvsSnapshot = await db.collection("cvs")
        .where("userId", "==", teamOwnerId)
        .orderBy("uploadedAt", "desc")
        .get();

    const cvs = cvsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Log API call for billing
    await logApiCall(userId, "getTeamCVs", "GET_TEAM_CVS");

    return {
      success: true,
      cvs: cvs,
      teamOwnerId: teamOwnerId,
    };
  } catch (error) {
    console.error("Error fetching team CVs:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to fetch team CVs",
    );
  }
});

/**
 * Get a single CV for team members
 * Team members need to use Admin SDK to access owner's CVs
 */
exports.getTeamCV = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;
    const {cvId} = request.data;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    if (!cvId) {
      throw new HttpsError("invalid-argument", "CV ID is required");
    }

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

    // Fetch the CV using Admin SDK
    const cvDoc = await db.collection("cvs").doc(cvId).get();

    if (!cvDoc.exists) {
      throw new HttpsError("not-found", "CV not found");
    }

    const cvData = cvDoc.data();

    // Verify this CV belongs to the team owner
    if (cvData.userId !== teamOwnerId) {
      throw new HttpsError(
          "permission-denied",
          "CV does not belong to your team owner",
      );
    }

    // Log API call for billing
    await logApiCall(userId, "getTeamCV", "GET_TEAM_CV");

    return {
      success: true,
      cv: {
        id: cvDoc.id,
        ...cvData,
      },
    };
  } catch (error) {
    console.error("Error fetching team CV:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to fetch CV",
    );
  }
});

/**
 * Extract text from Apple Pages file
 * Pages files are ZIP archives containing XML
 * @param {Buffer} fileBuffer - The Pages file buffer
 * @return {Promise<string>} - Extracted text content
 */
async function extractTextFromPages(fileBuffer) {
  try {
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    console.log("Pages file contains entries:", zipEntries.map((e) => e.entryName));

    // Look for content files - modern Pages files use different structures
    let contentEntry = null;
    let contentType = null;

    // First try to find index.xml (older format)
    for (const entry of zipEntries) {
      if (entry.entryName === "index.xml" || entry.entryName.endsWith("/index.xml")) {
        contentEntry = entry;
        contentType = "xml";
        break;
      }
    }

    // If no index.xml, try to find QuickLook/Preview.pdf (modern format)
    if (!contentEntry) {
      for (const entry of zipEntries) {
        if (entry.entryName.includes("QuickLook/Preview.pdf") ||
            entry.entryName.includes("preview.pdf")) {
          contentEntry = entry;
          contentType = "pdf";
          console.log("Using QuickLook PDF preview for text extraction");
          break;
        }
      }
    }

    // If no PDF preview, check for preview-web.jpg and provide helpful error
    if (!contentEntry) {
      const hasPreviewImages = zipEntries.some((e) =>
        e.entryName.includes("preview.jpg") ||
        e.entryName.includes("preview-web.jpg"),
      );

      const hasIwaFiles = zipEntries.some((e) => e.entryName.includes(".iwa"));

      if (hasIwaFiles && hasPreviewImages) {
        console.error("Modern Pages format detected (.iwa files with image previews)");
        console.log("This format requires OCR or PDF export to extract text");
        throw new Error(
            "Modern Pages format detected. " +
          "Please export your CV as PDF from Pages (File > Export To > PDF) and upload the PDF instead. " +
          "Alternatively, save as Pages '09 format for compatibility.",
        );
      }

      throw new Error("Modern Pages format not fully supported. Please export as PDF.");
    }

    if (!contentEntry) {
      throw new Error("No readable content found in Pages file");
    }

    // Extract content based on type
    if (contentType === "pdf") {
      // Extract PDF and parse it
      const pdfBuffer = contentEntry.getData();
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } else if (contentType === "xml") {
      // Parse XML (older format)
      const xmlContent = contentEntry.getData().toString("utf8");

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      let text = "";
      const extractTextFromNode = (node) => {
        if (typeof node === "string") {
          text += node + " ";
        } else if (Array.isArray(node)) {
          node.forEach(extractTextFromNode);
        } else if (typeof node === "object") {
          Object.values(node).forEach(extractTextFromNode);
        }
      };

      extractTextFromNode(result);
      return text.trim();
    }

    throw new Error("Unsupported Pages file structure");
  } catch (error) {
    console.error("Error extracting text from Pages file:", error);
    console.error("Error details:", error.message);
    throw new Error(`Failed to extract text from Pages file: ${error.message}`);
  }
}

/**
 * Cloud Function to parse CV using Claude AI
 * Triggered when a new CV document is created in Firestore
 */
exports.parseCVWithClaude = onDocumentCreated("cvs/{cvId}",
    async (event) => {
      const snap = event.data;
      if (!snap) {
        console.log("No data associated with the event");
        return;
      }
      const cvData = snap.data();
      const cvId = event.params.cvId;

      try {
        // Check if already parsed
        if (cvData.parsed) {
          console.log(`CV ${cvId} already parsed, skipping`);
          return null;
        }

        // Use shared parsing logic with plan-based model selection
        await parseCV(cvId, cvData);

        // Log CV upload activity
        try {
          // Use uploadedBy if available (team member), otherwise userId (owner)
          const actualUploaderId = cvData.uploadedBy || cvData.userId;
          const teamOwnerId = cvData.userId; // This is always the owner (team owner for team member uploads)

          await logCVUpload(
              actualUploaderId,
              teamOwnerId,
              cvId,
              cvData.fileName || "Unnamed CV",
          );
        } catch (logError) {
          console.error("Error logging CV upload:", logError);
          // Don't fail the parsing if logging fails
        }

        return null;
      } catch (error) {
        console.error(`Error in parseCVWithClaude trigger for ${cvId}:`, error);

        // Check for specific error types for better error messages
        let errorMessage = error.message;
        if (error.message.includes("Pages format")) {
          errorMessage = `Pages format error: ${error.message}. Please export your Pages document as PDF and try again.`;
        } else if (error.message.includes("not recognized")) {
          errorMessage = "File format not recognized. Please upload a PDF, Word document, or export Pages as PDF.";
        }

        // Update document with error status
        await snap.ref.update({
          status: "error",
          errorMessage: errorMessage,
          parsedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Log failed API call (still counts for billing)
        await logApiCall(cvData.userId, "parseCVWithClaude", "CV_PARSE_FAILED");

        return null;
      }
    });

/**
 * Shared parsing logic that can be called by both trigger and retry
 */
async function parseCV(cvId, cvData) {
  try {
    console.log(`Starting CV parsing for document: ${cvId}`);

    // Get the file from Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(cvData.storagePath);

    // Download file
    const [fileBuffer] = await file.download();
    console.log(`Downloaded file: ${cvData.fileName}`);

    // Extract text from PDF/DOC/PAGES
    let cvText = "";
    if (cvData.fileType === "application/pdf") {
      const pdfData = await pdfParse(fileBuffer);
      cvText = pdfData.text;
    } else if (cvData.fileType === "application/vnd.apple.pages" ||
               cvData.fileType === "application/x-iwork-pages-sffpages" ||
               cvData.fileName.toLowerCase().endsWith(".pages")) {
      // Extract text from Pages file
      cvText = await extractTextFromPages(fileBuffer);
    } else {
      // For Word documents, convert buffer to text (basic extraction)
      cvText = fileBuffer.toString("utf8");
    }

    console.log(`Extracted text length: ${cvText.length} characters`);

    // Get user plan to determine which model to use
    const userDoc = await admin.firestore().collection("users").doc(cvData.userId).get();
    const userPlan = userDoc.exists ? userDoc.data().plan : "free";

    // Select model based on plan
    // Free, Starter, Basic -> Haiku 4.5 ($1/$5 - 3x cheaper)
    // Professional, Business, Enterprise -> Sonnet 4.5 ($3/$15 - more powerful)
    const isPremiumPlan = ["professional", "business", "enterprise"].includes(userPlan?.toLowerCase());
    const model = isPremiumPlan ? "claude-sonnet-4-5-20250929" : "claude-haiku-4-5";

    // Initialize Claude AI
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Parse CV with Claude using enhanced prompt
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${CV_PARSER_PROMPT}

CV Text:
${cvText.substring(0, 15000)}`,
        },
      ],
    });

    const parsedContent = message.content[0].text;
    console.log("Claude response:", parsedContent);

    // Parse JSON from Claude's response
    const jsonMatch = parsedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from Claude response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Update Firestore with parsed data
    await admin.firestore().collection("cvs").doc(cvId).update({
      metadata: parsedData,
      parsed: true,
      status: "completed",
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      errorMessage: admin.firestore.FieldValue.delete(),
    });

    // Log successful API call
    await logApiCall(cvData.userId, "parseCVWithClaude", "CV_PARSE");

    console.log(`Successfully parsed CV: ${cvId}`);
    return {success: true};
  } catch (error) {
    console.error(`Error parsing CV ${cvId}:`, error);

    // Update status to error
    await admin.firestore().collection("cvs").doc(cvId).update({
      status: "error",
      errorMessage: error.message || "Failed to parse CV",
      parsed: false,
    });

    throw error;
  }
}

/**
 * Manually trigger CV parsing for a specific document
 * Useful for reprocessing CVs
 */
exports.retryParsing = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "User must be authenticated",
    );
  }

  const cvId = request.data.cvId;
  if (!cvId) {
    throw new HttpsError(
        "invalid-argument",
        "CV ID is required",
    );
  }

  try {
    const cvRef = admin.firestore().collection("cvs").doc(cvId);
    const cvDoc = await cvRef.get();

    if (!cvDoc.exists) {
      throw new HttpsError("not-found", "CV not found");
    }

    const cvData = cvDoc.data();

    // Check if user owns this CV
    if (cvData.userId !== request.auth.uid) {
      throw new HttpsError(
          "permission-denied",
          "You don't have permission to access this CV",
      );
    }

    // Reset parsing status
    await cvRef.update({
      parsed: false,
      status: "processing",
      errorMessage: admin.firestore.FieldValue.delete(),
    });

    // Actually parse the CV
    await parseCV(cvId, cvData);

    // Log API call for billing
    await logApiCall(request.auth.uid, "retryParsing", "RETRY_PARSING");

    return {success: true, message: "CV reprocessed successfully"};
  } catch (error) {
    console.error("Error triggering retry:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Delete a CV with audit logging
 */
exports.deleteCV = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {cvId} = request.data;
  if (!cvId) {
    throw new HttpsError("invalid-argument", "CV ID is required");
  }

  try {
    const db = admin.firestore();
    const cvRef = db.collection("cvs").doc(cvId);
    const cvDoc = await cvRef.get();

    if (!cvDoc.exists) {
      throw new HttpsError("not-found", "CV not found");
    }

    const cvData = cvDoc.data();
    const userId = request.auth.uid;

    // Check permissions - user must own the CV or be accessing via team
    let teamOwnerId = cvData.userId;
    let isTeamMember = false;

    // Check if user is team member accessing team owner's CV
    if (cvData.userId !== userId) {
      const teamMemberSnapshot = await db.collection("teamMembers")
          .where("userId", "==", userId)
          .where("teamOwnerId", "==", cvData.userId)
          .limit(1)
          .get();

      if (teamMemberSnapshot.empty) {
        throw new HttpsError(
            "permission-denied",
            "You don't have permission to delete this CV",
        );
      }

      isTeamMember = true;
      teamOwnerId = cvData.userId;
    }

    // Delete from Storage if exists
    if (cvData.storagePath) {
      try {
        await admin.storage().bucket().file(cvData.storagePath).delete();
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
        // Continue with Firestore deletion even if storage fails
      }
    }

    // Delete from Firestore
    await cvRef.delete();

    // Log API call for billing
    await logApiCall(userId, "deleteCV", "DELETE_CV");

    // Log deletion activity
    try {
      await logCVDelete(
          userId,
          teamOwnerId,
          cvId,
          cvData.data?.name || cvData.fileName || "Unnamed CV",
      );
    } catch (logError) {
      console.error("Error logging CV deletion:", logError);
      // Don't fail the deletion if logging fails
    }

    return {
      success: true,
      message: "CV deleted successfully",
      wasTeamMemberAction: isTeamMember,
    };
  } catch (error) {
    console.error("Error deleting CV:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to delete CV: ${error.message}`);
  }
});

/**
 * Update CV custom fields with audit logging
 */
exports.updateCVFields = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const {cvId, customFields} = request.data;
  if (!cvId || !customFields) {
    throw new HttpsError("invalid-argument", "CV ID and custom fields are required");
  }

  try {
    const db = admin.firestore();
    const cvRef = db.collection("cvs").doc(cvId);
    const cvDoc = await cvRef.get();

    if (!cvDoc.exists) {
      throw new HttpsError("not-found", "CV not found");
    }

    const cvData = cvDoc.data();
    const userId = request.auth.uid;

    // Check permissions
    let teamOwnerId = cvData.userId;
    let isTeamMember = false;

    if (cvData.userId !== userId) {
      const teamMemberSnapshot = await db.collection("teamMembers")
          .where("userId", "==", userId)
          .where("teamOwnerId", "==", cvData.userId)
          .limit(1)
          .get();

      if (teamMemberSnapshot.empty) {
        throw new HttpsError(
            "permission-denied",
            "You don't have permission to update this CV",
        );
      }

      isTeamMember = true;
      teamOwnerId = cvData.userId;
    }

    // Update custom fields
    await cvRef.update({
      customFields: customFields,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log API call for billing
    await logApiCall(userId, "updateCVFields", "UPDATE_CV_FIELDS");

    // Log update activity
    try {
      await logCVUpdate(
          userId,
          teamOwnerId,
          cvId,
          cvData.data?.name || cvData.fileName || "Unnamed CV",
          "custom fields updated",
      );
    } catch (logError) {
      console.error("Error logging CV update:", logError);
    }

    return {
      success: true,
      message: "CV updated successfully",
      wasTeamMemberAction: isTeamMember,
    };
  } catch (error) {
    console.error("Error updating CV:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError("internal", `Failed to update CV: ${error.message}`);
  }
});
