# EEA Reference Data Upload Instructions

## 📋 Overview

This script uploads the EEA reference data (sector targets and EAP targets) to your Firestore database.

---

## 🔑 Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **cvsift-3dff8**
3. Click the gear icon ⚙️ → **Project Settings**
4. Navigate to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Click **Generate Key** in the confirmation dialog
7. A JSON file will download (e.g., `cvsift-3dff8-firebase-adminsdk-xxxxx.json`)
8. **Rename** this file to `serviceAccountKey.json`
9. **Move** it to the `firestore-seed/` directory

**⚠️ Important Security Note:**
- This file contains sensitive credentials
- NEVER commit it to Git (it's already in .gitignore)
- Keep it secure and don't share it

---

## 📦 Step 2: Install Dependencies

Open terminal and navigate to the `firestore-seed` directory:

```bash
cd /Users/arnovanheerden/Desktop/CV-Sift/cvsift/firestore-seed
npm install firebase-admin
```

---

## 🚀 Step 3: Run the Upload Script

```bash
node uploadData.js
```

You should see output like this:

```
🚀 Starting EEA reference data upload...

📊 Found 24 sector targets
📊 Found 136 EAP targets

📤 Uploading sector targets...
✅ Uploaded 24 sector targets

📤 Uploading EAP targets...
   Uploaded batch 1 (136 documents)
✅ Uploaded 136 EAP targets

🔍 Verifying upload...
   sectorTargets collection: 24 documents
   eapTargets collection: 136 documents

✨ Reference data upload complete!
```

---

## ✅ Step 4: Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/cvsift-3dff8/firestore)
2. Navigate to **Firestore Database**
3. Check for two new collections:
   - `sectorTargets` (should have 24 documents)
   - `eapTargets` (should have 136 documents)

---

## 🎯 What Gets Uploaded

### Sector Targets (24 documents)
Target percentages for designated groups across 4 economic sectors:
- Financial and Insurance Activities
- Information Technology
- Professional, Scientific and Technical Activities
- Manufacturing

Each sector has 6 occupational levels with specific targets.

### EAP Targets (136 documents)
Economically Active Population targets for:
- National level (8 demographics)
- 9 Provincial levels (8 demographics each)

Demographics covered: African Male/Female, Coloured Male/Female, Indian Male/Female, White Male/Female

---

## 🔧 Troubleshooting

### Error: "serviceAccountKey.json not found"
**Solution**: Make sure you downloaded the service account key and placed it in the `firestore-seed/` directory with the exact name `serviceAccountKey.json`

### Error: "Permission denied"
**Solution**: Make sure the service account has the correct permissions. Go to Firebase Console → Project Settings → Service Accounts and verify the service account has "Firebase Admin SDK" role.

### Error: "Module not found: firebase-admin"
**Solution**: Run `npm install firebase-admin` in the `firestore-seed/` directory

### Warning: "Collections already contain data"
This means data was already uploaded. The script will wait 5 seconds before continuing. If you want to start fresh:
1. Go to Firebase Console → Firestore Database
2. Delete the `sectorTargets` and `eapTargets` collections
3. Run the script again

---

## 🧹 Cleanup (Optional)

After uploading, you can optionally delete the service account key:

```bash
rm serviceAccountKey.json
```

However, you might want to keep it for future data updates or testing.

---

## ✨ You're Done!

The EEA feature is now fully set up with:
- ✅ Firestore security rules deployed
- ✅ Reference data uploaded

Next steps:
1. Open your application at https://cvsift-3dff8.web.app
2. Log in with your master account (emma@automore.co.za)
3. Click the "EEA" button in the dashboard
4. Create a company profile
5. Import employees
6. View compliance dashboard and generate reports!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Verify Firestore security rules are deployed
3. Confirm reference data was uploaded successfully
4. Review the [EEA_DEPLOYMENT_GUIDE.md](../EEA_DEPLOYMENT_GUIDE.md)
