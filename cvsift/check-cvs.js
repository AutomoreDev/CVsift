// Quick diagnostic script to check CV data
// Run this in the browser console on the Analytics page

console.log('=== CV DATA DIAGNOSTIC ===');
console.log('Checking Firestore for CVs...');

// This will run in the browser where Firebase is already initialized
const checkCVs = async () => {
  try {
    const { db } = window; // Access Firebase from window
    const { collection, query, where, getDocs } = window.firebaseFirestore;

    // Get current user
    const currentUser = window.firebase?.auth?.currentUser;
    if (!currentUser) {
      console.error('❌ No user logged in');
      return;
    }

    console.log('✅ User ID:', currentUser.uid);

    // Query CVs
    const cvsQuery = query(
      collection(db, 'cvs'),
      where('userId', '==', currentUser.uid)
    );

    const cvsSnapshot = await getDocs(cvsQuery);
    console.log('📊 Total CVs found:', cvsSnapshot.docs.length);

    if (cvsSnapshot.docs.length === 0) {
      console.log('⚠️  No CVs found for this user');
      console.log('👉 Try uploading a CV first');
      return;
    }

    // Analyze each CV
    cvsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- CV ${index + 1} ---`);
      console.log('ID:', doc.id);
      console.log('File Name:', data.fileName);
      console.log('Status:', data.status);
      console.log('Parsed:', data.parsed);
      console.log('Upload Date:', data.uploadedAt?.toDate?.());

      if (data.metadata) {
        console.log('✅ Metadata exists');
        console.log('  - Name:', data.metadata.name);
        console.log('  - Email:', data.metadata.email);
        console.log('  - Phone:', data.metadata.phone);
        console.log('  - Location:', data.metadata.location);
        console.log('  - Skills:', data.metadata.skills?.length || 0, 'skills');
        console.log('  - Experience:', data.metadata.experience?.length || 0, 'positions');
        console.log('  - Education:', data.metadata.education?.length || 0, 'degrees');

        if (data.metadata.skills?.length > 0) {
          console.log('  - Top Skills:', data.metadata.skills.slice(0, 5));
        }
      } else {
        console.log('❌ No metadata - CV may still be processing');
      }

      if (data.status === 'error') {
        console.log('❌ Error:', data.errorMessage);
      }
    });

    console.log('\n=== END DIAGNOSTIC ===');

  } catch (error) {
    console.error('❌ Error checking CVs:', error);
  }
};

// Run the check
checkCVs();
