# Master Account Setup Guide

## Overview

A master account has been configured for CV-Sift with full access to all SaaS features, users, and CVs. This account has elevated permissions and bypasses normal user restrictions.

## Master Account Credentials

**⚠️ IMPORTANT: These credentials are stored securely in the backend `.env` file and are never exposed to the frontend.**

```
Email: emma@automore.co.za
Password: Automore@26841397
```

## How It Works

### 1. Credential Storage

Master account credentials are stored in `/functions/.env`:

```bash
MASTER_ACCOUNT_EMAIL=emma@automore.co.za
MASTER_ACCOUNT_PASSWORD=Automore@26841397
```

These environment variables are:
- **Never committed to version control** (`.env` is in `.gitignore`)
- **Only accessible by backend Cloud Functions**
- **Not exposed to the frontend application**

### 2. Automatic Initialization

When the master account user signs in:

1. User authenticates with Firebase using `emma@automore.co.za` and the password
2. AuthContext automatically calls the `initializeMasterAccount` Cloud Function
3. The function checks if the authenticated user's email matches `MASTER_ACCOUNT_EMAIL`
4. If matched, the user's Firestore document is upgraded with:
   - `role: 'master'`
   - `plan: 'enterprise'`
   - `cvUploadLimit: -1` (unlimited)

### 3. Permissions & Access

The master account has the following special permissions:

#### Firestore Access
- **Read all users**: Can view any user's profile and data
- **Update any user**: Can modify any user's settings (except can't make others master)
- **Read all CVs**: Can access any CV uploaded by any user
- **Full CRUD on CVs**: Create, read, update, delete any CV

#### Cloud Functions
The master account has access to special Cloud Functions:

1. **`initializeMasterAccount()`**
   - Automatically called on login
   - Upgrades account to master if email matches

2. **`checkMasterStatus()`**
   - Check if current user is a master account
   - Returns: `{ isMaster: boolean, role: string }`

3. **`getAllUsers()`**
   - Retrieve all users in the system
   - Returns: `{ success: true, users: [], count: number }`

4. **`getAllCVs()`**
   - Retrieve all CVs in the system
   - Returns: `{ success: true, cvs: [], count: number }`

5. **`updateAnyUser(targetUserId, updates)`**
   - Update any user's data
   - Cannot change other users to master role

### 4. Security Rules

Firestore security rules have been updated to support master account access:

```javascript
function isMaster() {
  return request.auth != null &&
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'master';
}
```

**Key Security Features:**
- Master status is verified on every request
- Regular users cannot access other users' data
- Master cannot change other users to master role (prevents privilege escalation)
- All master actions are logged in Cloud Functions

## Usage Instructions

### First-Time Setup

1. **Sign up** using the master account email and password:
   - Go to the Sign-Up page
   - Enter email: `emma@automore.co.za`
   - Enter password: `Automore@26841397`
   - Complete registration

2. **Sign in** and the account will automatically be upgraded to master status

3. **Verify master status** by checking the Firestore database:
   - Collection: `users`
   - Find document with email `emma@automore.co.za`
   - Confirm `role: 'master'`

### Using Master Account Features

#### Example: Get All Users

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getAllUsers = httpsCallable(functions, 'getAllUsers');

try {
  const result = await getAllUsers();
  console.log('Total users:', result.data.count);
  console.log('Users:', result.data.users);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### Example: Get All CVs

```javascript
const getAllCVs = httpsCallable(functions, 'getAllCVs');

try {
  const result = await getAllCVs();
  console.log('Total CVs:', result.data.count);
  console.log('CVs:', result.data.cvs);
} catch (error) {
  console.error('Error:', error.message);
}
```

#### Example: Update Any User

```javascript
const updateAnyUser = httpsCallable(functions, 'updateAnyUser');

try {
  const result = await updateAnyUser({
    targetUserId: 'user-uid-here',
    updates: {
      plan: 'pro',
      cvUploadLimit: 100
    }
  });
  console.log('Update result:', result.data);
} catch (error) {
  console.error('Error:', error.message);
}
```

## Deployment

### Deploy Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

This will deploy:
- `initializeMasterAccount`
- `checkMasterStatus`
- `getAllUsers`
- `getAllCVs`
- `updateAnyUser`

### Deploy Firestore Security Rules

```bash
firebase deploy --only firestore:rules
```

This will deploy the updated security rules that enable master account access.

## File Changes Summary

### Backend Files
- ✅ `/functions/.env` - Added master credentials
- ✅ `/functions/.env.example` - Added example credentials
- ✅ `/functions/masterAccount.js` - New file with master functions
- ✅ `/functions/index.js` - Exports master account functions

### Frontend Files
- ✅ `/public/context/AuthContext.jsx` - Added automatic master initialization
- ✅ `firestore.rules` - Added master access rules

## Security Considerations

### ✅ Implemented
1. **Backend-only credentials**: Master credentials stored in backend `.env`
2. **Role-based validation**: Every request validates master role
3. **Privilege escalation prevention**: Cannot make other users master
4. **Audit logging**: All master actions logged in Cloud Functions
5. **Automatic initialization**: No manual database modifications required

### 🔒 Recommended Enhancements
1. **Two-Factor Authentication (2FA)**: Add 2FA requirement for master account
2. **IP Whitelisting**: Restrict master account access to specific IPs
3. **Session Expiry**: Implement shorter session timeouts for master account
4. **Activity Monitoring**: Add real-time alerts for unusual master activity
5. **Secrets Manager**: Move from `.env` to Firebase Secret Manager (more secure)

## Troubleshooting

### Master account not upgrading after login

1. Check backend logs:
   ```bash
   firebase functions:log
   ```

2. Verify `.env` file exists in `/functions/` directory

3. Ensure environment variables are loaded:
   ```bash
   cd functions
   cat .env
   ```

4. Manually call the function:
   ```javascript
   const initializeMaster = httpsCallable(functions, 'initializeMasterAccount');
   const result = await initializeMaster();
   console.log(result.data);
   ```

### Permission denied errors

1. Check Firestore rules are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Verify user document has `role: 'master'` in Firestore

3. Check user is authenticated before making requests

## Testing

### Test Master Account Creation

1. Sign up with master email and password
2. Check Firestore console for `role: 'master'`
3. Verify unlimited upload limit (`cvUploadLimit: -1`)

### Test Master Permissions

```javascript
// Test getting all users
const users = await getAllUsers();
console.assert(users.data.success === true, 'Should get all users');

// Test getting all CVs
const cvs = await getAllCVs();
console.assert(cvs.data.success === true, 'Should get all CVs');

// Test updating a user
const update = await updateAnyUser({
  targetUserId: 'test-user-id',
  updates: { plan: 'pro' }
});
console.assert(update.data.success === true, 'Should update user');
```

## Environment Variables Reference

### Required Variables in `/functions/.env`

```bash
# Existing variables...
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...
ANTHROPIC_API_KEY=...

# New master account variables
MASTER_ACCOUNT_EMAIL=emma@automore.co.za
MASTER_ACCOUNT_PASSWORD=Automore@26841397
```

## Support

For issues or questions about the master account:
1. Check Firebase Functions logs for errors
2. Verify environment variables are set correctly
3. Ensure Firestore rules are deployed
4. Check that functions are deployed successfully

## Next Steps

To enhance the master account functionality:

1. **Create Admin Dashboard**: Build a dedicated UI for master account features
2. **Add Audit Logging**: Track all master account actions in a separate collection
3. **Implement Sub-Accounts**: Allow master to create and manage sub-accounts
4. **Add Reporting**: Create analytics dashboard for master to view system metrics
5. **Set Up Alerts**: Implement notifications for important system events

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
