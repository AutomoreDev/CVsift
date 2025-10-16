const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const pdfParse = require("pdf-parse");
const AdmZip = require("adm-zip");
const xml2js = require("xml2js");
const {CV_PARSER_PROMPT} = require("./cvParserPrompts");

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

    // Look for index.xml which contains the content
    const indexEntry = zipEntries.find((entry) =>
      entry.entryName === "index.xml" ||
      entry.entryName.endsWith("/index.xml"),
    );

    if (!indexEntry) {
      throw new Error("index.xml not found in Pages file");
    }

    const xmlContent = indexEntry.getData().toString("utf8");

    // Parse XML
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);

    // Extract text from XML structure
    // Pages files have complex XML, so we'll extract all text nodes
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
  } catch (error) {
    console.error("Error extracting text from Pages file:", error);
    throw new Error("Failed to extract text from Pages file");
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

      console.log(`Starting CV parsing for document: ${cvId}`);

      try {
      // Check if already parsed
        if (cvData.parsed) {
          console.log(`CV ${cvId} already parsed, skipping`);
          return null;
        }

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

        // Initialize Claude AI
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        // Parse CV with Claude using enhanced prompt
        const message = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
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

        // Parse Claude's response
        let parsedData;
        try {
          const responseText = message.content[0].text;
          // Remove markdown code blocks if present
          const jsonText = responseText
              .replace(/```json\n?/g, "")
              .replace(/```\n?/g, "")
              .trim();
          parsedData = JSON.parse(jsonText);
        } catch (parseError) {
          console.error("Error parsing Claude response:", parseError);
          console.log("Raw response:", message.content[0].text);
          throw new Error("Failed to parse Claude response as JSON");
        }

        console.log("Parsed CV data:", parsedData);

        // Update Firestore document
        await snap.ref.update({
          metadata: {
            name: parsedData.name || null,
            email: parsedData.email || null,
            phone: parsedData.phone || null,
            location: parsedData.location || null,
            gender: parsedData.gender || null,
            age: parsedData.age || null,
            race: parsedData.race || null,
            skills: parsedData.skills || [],
            experience: parsedData.experience || [],
            education: parsedData.education || [],
            summary: parsedData.summary || null,
          },
          parsed: true,
          status: "completed",
          parsedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Successfully parsed CV ${cvId}`);
        return null;
      } catch (error) {
        console.error(`Error parsing CV ${cvId}:`, error);

        // Update document with error status
        await snap.ref.update({
          status: "error",
          errorMessage: error.message,
          parsedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return null;
      }
    });

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

    return {success: true, message: "CV reprocessing initiated"};
  } catch (error) {
    console.error("Error triggering retry:", error);
    throw new HttpsError("internal", error.message);
  }
});
