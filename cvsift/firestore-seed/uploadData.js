/**
 * Upload EEA Reference Data to Firestore
 *
 * This script uploads sectorTargets and eapTargets to Firestore.
 * Run with: node uploadData.js
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
// Make sure you have the service account key file
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');

if (!existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your service account key from:');
  console.error('Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  console.error('Save it as: firestore-seed/serviceAccountKey.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  try {
    console.log('🚀 Starting EEA reference data upload...\n');

    // Load JSON files
    const sectorTargets = JSON.parse(readFileSync(join(__dirname, 'sectorTargets.json'), 'utf8'));
    const eapTargets = JSON.parse(readFileSync(join(__dirname, 'eapTargets.json'), 'utf8'));

    console.log(`📊 Found ${sectorTargets.length} sector targets`);
    console.log(`📊 Found ${eapTargets.length} EAP targets\n`);

    // Check if collections already have data
    const sectorSnapshot = await db.collection('sectorTargets').limit(1).get();
    const eapSnapshot = await db.collection('eapTargets').limit(1).get();

    if (!sectorSnapshot.empty || !eapSnapshot.empty) {
      console.log('⚠️  Warning: Collections already contain data!');
      console.log('This will add MORE documents (not replace existing ones).');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Upload sector targets
    console.log('📤 Uploading sector targets...');
    let sectorCount = 0;
    const batch1 = db.batch();

    for (const target of sectorTargets) {
      const docRef = db.collection('sectorTargets').doc();
      batch1.set(docRef, target);
      sectorCount++;
    }

    await batch1.commit();
    console.log(`✅ Uploaded ${sectorCount} sector targets\n`);

    // Upload EAP targets
    console.log('📤 Uploading EAP targets...');
    let eapCount = 0;

    // Split into batches of 500 (Firestore batch limit)
    const batchSize = 500;
    for (let i = 0; i < eapTargets.length; i += batchSize) {
      const batch = db.batch();
      const chunk = eapTargets.slice(i, i + batchSize);

      for (const target of chunk) {
        const docRef = db.collection('eapTargets').doc();
        batch.set(docRef, target);
        eapCount++;
      }

      await batch.commit();
      console.log(`   Uploaded batch ${Math.floor(i / batchSize) + 1} (${chunk.length} documents)`);
    }

    console.log(`✅ Uploaded ${eapCount} EAP targets\n`);

    // Verify upload
    console.log('🔍 Verifying upload...');
    const finalSectorCount = await db.collection('sectorTargets').count().get();
    const finalEapCount = await db.collection('eapTargets').count().get();

    console.log(`   sectorTargets collection: ${finalSectorCount.data().count} documents`);
    console.log(`   eapTargets collection: ${finalEapCount.data().count} documents\n`);

    console.log('✨ Reference data upload complete!\n');
    console.log('Next steps:');
    console.log('1. Test the EEA feature in your application');
    console.log('2. Create a company profile');
    console.log('3. Import employees');
    console.log('4. View compliance dashboard\n');

  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the upload
uploadData();
