const admin = require('firebase-admin');
const serviceAccount = require('./functions/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkMasterAccount() {
  try {
    const usersSnapshot = await db.collection('users')
      .where('email', '==', 'emma@automore.co.za')
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ Master account not found');
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('\n=== Master Account Status ===');
    console.log('Email:', userData.email);
    console.log('Display Name:', userData.displayName);
    console.log('Role:', userData.role);
    console.log('Plan:', userData.plan);
    console.log('CV Upload Limit:', userData.cvUploadLimit);
    console.log('User ID:', userDoc.id);
    
    if (userData.role === 'master' && userData.plan === 'enterprise') {
      console.log('\n✅ Master account is correctly configured');
    } else {
      console.log('\n⚠️  Master account needs updating');
      console.log('\nFixing now...');
      
      await db.collection('users').doc(userDoc.id).update({
        role: 'master',
        plan: 'enterprise',
        cvUploadLimit: -1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Master account updated successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMasterAccount();
