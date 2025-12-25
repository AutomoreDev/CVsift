const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {encryptCVMetadata, decryptCVMetadata} = require("./encryption");
const Anthropic = require("@anthropic-ai/sdk");
const pdfParse = require("pdf-parse");
const {CV_PARSER_PROMPT} = require("./cvParserPrompts");

/**
 * Save CV Builder Data with Encryption
 * Encrypts PII fields before saving to Firestore
 */
exports.saveCVBuilderData = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {cvData, templateId, accentColor} = request.data;

    if (!cvData || !templateId) {
      throw new HttpsError("invalid-argument", "CV data and template ID are required");
    }

    const db = admin.firestore();

    // Extract PII fields that need encryption
    const personalInfoToEncrypt = {
      name: cvData.personalInfo.fullName,
      email: cvData.personalInfo.email,
      phone: cvData.personalInfo.phone,
      location: cvData.personalInfo.location,
      visaStatus: cvData.personalInfo.visaStatus,
      linkedin: cvData.personalInfo.linkedin,
      github: cvData.personalInfo.github,
      portfolio: cvData.personalInfo.website,
    };

    // Encrypt PII fields
    const encryptedPersonalInfo = await encryptCVMetadata(personalInfoToEncrypt);

    // Prepare document to save
    const cvBuilderDoc = {
      userId,
      templateId,
      accentColor: accentColor || "#3B82F6",
      personalInfo: {
        ...encryptedPersonalInfo,
        profileImage: cvData.personalInfo.profileImage, // Store URL, already in Firebase Storage
      },
      summary: cvData.summary || "",
      experience: cvData.experience || [],
      education: cvData.education || [],
      skills: cvData.skills || [],
      certifications: cvData.certifications || [],
      languages: cvData.languages || [],
      portfolio: cvData.portfolio || [],
      awards: cvData.awards || [],
      interests: cvData.interests || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save or update the CV Builder document
    // Use userId as document ID to ensure one draft per user
    const cvBuilderRef = db.collection("cvBuilders").doc(userId);
    await cvBuilderRef.set(cvBuilderDoc, {merge: true});

    return {
      success: true,
      message: "CV Builder data saved successfully",
      cvBuilderId: userId,
    };
  } catch (error) {
    console.error("Error saving CV Builder data:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to save CV Builder data",
    );
  }
});

/**
 * Get CV Builder Data with Decryption
 * Retrieves and decrypts CV Builder data for the authenticated user
 */
exports.getCVBuilderData = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const db = admin.firestore();

    // Fetch the CV Builder document
    const cvBuilderDoc = await db.collection("cvBuilders").doc(userId).get();

    if (!cvBuilderDoc.exists) {
      return {
        success: true,
        data: null,
        message: "No saved CV Builder data found",
      };
    }

    const cvBuilderData = cvBuilderDoc.data();

    // Decrypt PII fields
    if (cvBuilderData.personalInfo && cvBuilderData.personalInfo._encrypted) {
      const decryptedPersonalInfo = await decryptCVMetadata(cvBuilderData.personalInfo);

      // Map decrypted fields back to expected format
      cvBuilderData.personalInfo = {
        fullName: decryptedPersonalInfo.name || "",
        email: decryptedPersonalInfo.email || "",
        phone: decryptedPersonalInfo.phone || "",
        location: decryptedPersonalInfo.location || "",
        visaStatus: decryptedPersonalInfo.visaStatus || "",
        linkedin: decryptedPersonalInfo.linkedin || "",
        github: decryptedPersonalInfo.github || "",
        website: decryptedPersonalInfo.portfolio || "",
        profileImage: cvBuilderData.personalInfo.profileImage || null,
      };
    }

    return {
      success: true,
      data: cvBuilderData,
    };
  } catch (error) {
    console.error("Error fetching CV Builder data:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to fetch CV Builder data",
    );
  }
});

/**
 * Delete CV Builder Data
 * Deletes the CV Builder draft for the authenticated user
 */
exports.deleteCVBuilderData = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const db = admin.firestore();

    // Delete the CV Builder document
    await db.collection("cvBuilders").doc(userId).delete();

    return {
      success: true,
      message: "CV Builder data deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting CV Builder data:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to delete CV Builder data",
    );
  }
});

/**
 * Parse CV for Builder
 * Parses an uploaded CV and returns structured data for the CV Builder form
 */
exports.parseCVForBuilder = onCall(async (request) => {
  try {
    const userId = request.auth?.uid;

    if (!userId) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const {fileUrl, storagePath, fileName} = request.data;

    if (!fileName) {
      throw new HttpsError("invalid-argument", "File name is required");
    }

    console.log(`Parsing CV for builder: ${fileName} by user ${userId}`);

    // Download file from storage
    const bucket = admin.storage().bucket();

    // Use storage path if provided, otherwise extract from URL
    let filePath;
    if (storagePath) {
      filePath = storagePath;
    } else if (fileUrl) {
      // Extract the storage path from the URL
      // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?alt=media&token={token}
      if (fileUrl.includes("firebasestorage.googleapis.com")) {
        // Extract path from Firebase Storage download URL
        const urlParts = fileUrl.split("/o/")[1];
        filePath = decodeURIComponent(urlParts.split("?")[0]);
      } else {
        // Direct storage path
        filePath = fileUrl.replace(`https://storage.googleapis.com/${bucket.name}/`, "");
      }
    } else {
      throw new HttpsError("invalid-argument", "File URL or storage path is required");
    }

    console.log(`Storage path: ${filePath}`);
    const fileRef = bucket.file(filePath);

    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      throw new HttpsError("not-found", `File not found at path: ${filePath}`);
    }

    console.log(`File exists, downloading...`);
    const [fileBuffer] = await fileRef.download();
    console.log(`Downloaded file: ${fileName}, size: ${fileBuffer.length} bytes`);

    // Extract text from PDF/DOC
    let cvText = "";
    const fileType = fileName.toLowerCase();

    if (fileType.endsWith(".pdf")) {
      const pdfData = await pdfParse(fileBuffer);
      cvText = pdfData.text;
    } else {
      // For Word documents, basic text extraction
      cvText = fileBuffer.toString("utf8");
    }

    console.log(`Extracted text length: ${cvText.length} characters`);

    // Get user plan
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userPlan = userDoc.exists ? userDoc.data().plan : "free";

    // Select model based on plan
    const isPremiumPlan = ["professional", "business", "enterprise"].includes(userPlan?.toLowerCase());
    const model = isPremiumPlan ? "claude-sonnet-4-5-20250929" : "claude-haiku-4-5";

    // Initialize Claude AI
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Parse CV with Claude
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `${CV_PARSER_PROMPT}

CV Text:
${cvText.substring(0, 50000)}`,
        },
      ],
    });

    const parsedContent = message.content[0].text;
    console.log("Claude response received");

    // Parse JSON from Claude's response
    const jsonMatch = parsedContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new HttpsError("internal", "Could not extract JSON from Claude response");
    }

    const metadata = JSON.parse(jsonMatch[0]);

    // Return the parsed metadata (don't encrypt as it's temporary for UI)
    return {
      success: true,
      metadata: metadata,
      message: "CV parsed successfully",
    };
  } catch (error) {
    console.error("Error parsing CV for builder:", error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
        "internal",
        error.message || "Failed to parse CV",
    );
  }
});
