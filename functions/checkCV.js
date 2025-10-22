/**
 * Debug script to check CV status
 */

const admin = require("firebase-admin");

// Initialize without credentials (will use environment/application default)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkCV() {
  try {
    // Find all .pages CVs
    const cvsSnapshot = await db.collection("cvs")
        .where("status", "==", "processing")
        .get();

    if (cvsSnapshot.empty) {
      console.log("No CVs in processing status");

      // Check for .pages files
      const pagesSnapshot = await db.collection("cvs")
          .orderBy("uploadedAt", "desc")
          .limit(10)
          .get();

      console.log("\n=== Recent CVs ===");
      pagesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.fileName && data.fileName.toLowerCase().includes("pages")) {
          console.log(`\nFile: ${data.fileName}`);
          console.log(`Status: ${data.status}`);
          console.log(`Parsed: ${data.parsed}`);
          console.log(`Type: ${data.fileType}`);
        }
      });
      return;
    }

    console.log(`Found ${cvsSnapshot.size} CVs in processing status\n`);

    cvsSnapshot.docs.forEach((cvDoc) => {
      const cvData = cvDoc.data();

      console.log("\n=== CV Document ===");
      console.log("ID:", cvDoc.id);
      console.log("File Name:", cvData.fileName);
      console.log("File Type:", cvData.fileType);
      console.log("Status:", cvData.status);
      console.log("Parsed:", cvData.parsed);
      console.log("Error Message:", cvData.errorMessage || "No error");
      console.log("Uploaded At:", cvData.uploadedAt?.toDate());
      console.log("Parsed At:", cvData.parsedAt?.toDate() || "Not parsed");
      console.log("Storage Path:", cvData.storagePath);

      if (cvData.metadata) {
        console.log("\n=== Metadata ===");
        console.log(JSON.stringify(cvData.metadata, null, 2));
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }

  process.exit(0);
}

checkCV();
