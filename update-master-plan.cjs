/**
 * Script to manually update master account to Enterprise plan
 * Run this once after logging in with emma@automore.co.za
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'cvsift-3dff8.firebasestorage.app'
});

const db = admin.firestore();

async function updateMasterAccount() {
  try {
    const masterEmail = 'emma@automore.co.za';

    // Find user by email
    const userRecord = await admin.auth().getUserByEmail(masterEmail);
    const userId = userRecord.uid;

    console.log('Found user:', userId, masterEmail);

    // Update user document in Firestore
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      role: 'master',
      plan: 'enterprise',
      cvUploadLimit: -1,
      cvUploadsThisMonth: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ Successfully updated master account to Enterprise plan');
    console.log('   - Role: master');
    console.log('   - Plan: enterprise');
    console.log('   - Upload Limit: Unlimited (-1)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating master account:', error.message);
    process.exit(1);
  }
}

updateMasterAccount();
