# EEA Compliance Feature - Setup Guide

This guide will help you set up and deploy the Employment Equity Act (EEA) compliance feature for CVSift.

## Overview

The EEA Compliance feature helps South African companies track and manage their BBEEE employment equity compliance in real-time. It's available for **Professional**, **Business**, **Enterprise** plans, and the **Master** account.

## What Has Been Implemented

### ✅ Core Files Created

1. **Type Definitions**: `public/lib/eea/types.js`
2. **Constants**: `public/lib/eea/constants.js`
3. **Compliance Engine**: `public/lib/eea/complianceEngine.js`
4. **Custom Hook**: `public/hooks/useEEA.js`
5. **Components**:
   - `public/components/eea/ComplianceOverview.jsx`
   - `public/components/eea/ComplianceLevelCard.jsx`
   - `public/components/eea/DisabilityCompliance.jsx`
   - `public/components/eea/EEADashboard.jsx`
6. **Page**: `public/Pages/EEA.jsx`
7. **Route**: Added to `public/App.jsx`
8. **Navigation**: Added EEA button to `public/Pages/Dashboard.jsx`
9. **Plan Configuration**: Updated `public/config/planConfig.js`

### 📊 Reference Data Files

- `firestore-seed/sectorTargets.json` - Sector-specific EEA targets
- `firestore-seed/eapTargets.json` - Economic Active Population targets
- `firestore-seed/eea-security-rules.txt` - Firestore security rules

## Setup Instructions

### Step 1: Install Required Dependencies

The feature uses existing dependencies. If you encounter any issues, ensure these are installed:

```bash
npm install react-router-dom lucide-react firebase
```

### Step 2: Deploy Firestore Security Rules

1. **Option A: Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project: `cvsift-3dff8`
   - Navigate to **Firestore Database** > **Rules**
   - Copy the rules from `firestore-seed/eea-security-rules.txt`
   - Paste them into your existing rules (inside the `match /databases/{database}/documents` block)
   - Click **Publish**

2. **Option B: Firebase CLI**
   ```bash
   # Add rules to your firestore.rules file
   firebase deploy --only firestore:rules
   ```

### Step 3: Populate Reference Data

You need to manually upload the sector targets and EAP targets to Firestore.

#### Option 1: Firebase Console (Recommended for small datasets)

1. Go to Firebase Console > Firestore Database
2. Create a collection called `sectorTargets`
3. For each entry in `sectorTargets.json`, add a new document with:
   - Auto-generated Document ID
   - Fields matching the JSON structure

4. Create a collection called `eapTargets`
5. Repeat the process for entries in `eapTargets.json`

#### Option 2: Node.js Script (Recommended for bulk upload)

Create a file `firestore-seed/uploadData.js`:

```javascript
const admin = require('firebase-admin');
const sectorTargets = require('./sectorTargets.json');
const eapTargets = require('./eapTargets.json');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadData() {
  try {
    // Upload sector targets
    console.log('Uploading sector targets...');
    const batch1 = db.batch();
    sectorTargets.forEach((target) => {
      const docRef = db.collection('sectorTargets').doc();
      batch1.set(docRef, target);
    });
    await batch1.commit();
    console.log(`✅ Uploaded ${sectorTargets.length} sector targets`);

    // Upload EAP targets
    console.log('Uploading EAP targets...');
    const batch2 = db.batch();
    eapTargets.forEach((target) => {
      const docRef = db.collection('eapTargets').doc();
      batch2.set(docRef, target);
    });
    await batch2.commit();
    console.log(`✅ Uploaded ${eapTargets.length} EAP targets`);

    console.log('✅ All data uploaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading data:', error);
    process.exit(1);
  }
}

uploadData();
```

Then run:
```bash
cd firestore-seed
npm install firebase-admin
node uploadData.js
```

### Step 4: Test the Feature

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Test access control**:
   - Log in with a **Free** or **Basic** plan user → Should see upgrade prompt
   - Log in with a **Professional+** plan user → Should see EEA dashboard
   - Log in with **Master** account → Should have full access

4. **Test the dashboard**:
   - Navigate to `/eea` or click the "EEA" button in the navbar
   - If no company setup: Should see "Setup Company Profile" prompt
   - If no employees: Should see "Import Employees" prompt
   - With data: Should see compliance dashboard

## Firestore Collections

The feature creates these collections:

### `companies` Collection
Stores company profile information including:
- Company name and registration details
- Sector and EAP type
- Reporting periods
- Owner ID

### `employees` Collection
Stores employee records including:
- Personal information (name, ID, etc.)
- Demographics (race, gender, nationality)
- Disability status
- Employment details (level, position, dates)
- Remuneration

### `sectorTargets` Collection (Reference Data)
Pre-populated sector-specific targets:
- Economic sector
- Occupational level
- Male/Female/Total targets

### `eapTargets` Collection (Reference Data)
Pre-populated EAP targets:
- National or provincial
- Demographic breakdowns
- Target percentages

### `complianceSnapshots` Collection (Future)
Historical compliance tracking for trend analysis.

## Feature Access

The EEA feature is available for:
- ✅ **Professional Plan** - 600 CVs, EEA Compliance
- ✅ **Business Plan** - 1500 CVs, EEA Compliance
- ✅ **Enterprise Plan** - Unlimited CVs, EEA Compliance
- ✅ **Master Account** - Full access to all features

Users on **Free**, **Starter**, and **Basic** plans will see an upgrade prompt when accessing `/eea`.

## Navigation

The EEA button appears in the Dashboard navbar for users with access:
- Icon: ⚖️ Scale (from Lucide React)
- Location: Between "AI Assistant" and "User Menu"
- Conditional rendering based on plan access

## Next Steps (Phase 2 - Future Enhancements)

The following features are planned but not yet implemented:

1. **Company Setup Component** (`/eea/setup`)
   - Form to create company profile
   - Sector selection
   - Reporting period configuration

2. **Employee Import** (`/eea/import`)
   - Excel/CSV upload
   - Data validation
   - Bulk import functionality

3. **Employee Management** (`/eea/employees`)
   - List view with filtering
   - Add/Edit/Delete employees
   - Export functionality

4. **Hiring Impact Calculator** (`/eea/calculator`)
   - Predictive analysis
   - Scenario planning
   - Recommendations

5. **Report Generation** (`/eea/reports`)
   - EEA2 Form (Workforce Profile)
   - EEA4 Form (Income Differentials)
   - EEA12 Form (Consultation Certificate)
   - EEA13 Form (Plan Submission)
   - PDF/Excel export

6. **Historical Tracking**
   - Monthly snapshots
   - Trend graphs
   - Year-over-year comparisons

## Troubleshooting

### Issue: "Permission denied" error in Firestore

**Solution**: Ensure Firestore security rules are properly deployed. Check that the rules from `eea-security-rules.txt` are in your `firestore.rules` file.

### Issue: No sector targets loading

**Solution**: Verify that `sectorTargets` collection is populated in Firestore. Check the Firebase Console to confirm data exists.

### Issue: EEA button not showing in navbar

**Solution**:
1. Check user's plan: `console.log(userData?.plan)`
2. Verify `canAccessEEA()` function in `planConfig.js`
3. Ensure plan features include `eeaCompliance: true`

### Issue: useEEA hook returns no data

**Solution**:
1. Check Firebase authentication: `console.log(currentUser)`
2. Verify company document exists in `companies` collection
3. Check Firestore security rules allow read access
4. Look for errors in browser console

## Support

For questions or issues:
- Email: support@cvsift.com
- Documentation: [CVSift Docs](https://docs.cvsift.com)

## License

This feature is part of CVSift and subject to the same license terms.

---

**Last Updated**: December 2024
**Version**: 1.0.0
