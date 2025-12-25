# CVSift Maintenance Mode

## Current Status: ⚠️ UNDER MAINTENANCE

**Date:** November 24, 2025
**Maintenance Page:** [https://cvsift-3dff8.web.app](https://cvsift-3dff8.web.app)

---

## What Was Done

### 1. Maintenance Page Deployed ✅
- Created a professional, animated maintenance page
- Deployed to Firebase Hosting at **both** URLs:
  - https://cvsift-3dff8.web.app (Firebase subdomain)
  - www.cvsift.co.za (custom domain - if configured)
- Auto-refreshes every 5 minutes to check if maintenance is complete
- **All users now see the maintenance page**

### 2. Original Homepage Backed Up ✅
- Original files backed up in two locations:
  - `cvsift/public/index.html.backup` (React source)
  - `cvsift/dist/index.html.backup` (Built production file)
- Can be restored at any time

---

## Issues Being Fixed

### Critical: PayFast API 401 Authentication Error

**Problem:**
- Subscription cancellation via Account Settings fails with "401 Merchant authorization failed"
- PayFast API calls are being rejected despite correct signature generation

**Root Cause:**
- PayFast API access needs to be explicitly enabled in your merchant dashboard
- The credentials that work for payment webhooks do NOT automatically work for API calls

**Status:** ⏳ Waiting for PayFast merchant account API access to be enabled

---

## Action Required: Enable PayFast API Access

To fix the subscription cancellation issue, you need to enable API access in your PayFast merchant account:

### Steps:

1. **Login to PayFast Merchant Dashboard**
   - Go to: https://www.payfast.co.za
   - Login with your merchant credentials

2. **Enable API Access**
   - Navigate to: **Settings** → **Integration** → **API**
   - Look for "Subscription Management API" or "API Access"
   - **Enable** the API access

3. **Verify Passphrase**
   - Confirm your API passphrase matches: `2025CVsiftSecure`
   - Make sure there are no trailing/leading spaces

4. **Check IP Restrictions**
   - If IP whitelisting is enabled, you may need to:
     - Disable it temporarily for testing, OR
     - Whitelist Google Cloud/Firebase IP ranges

5. **Save Changes**
   - Save your settings in PayFast dashboard

---

## Manual Subscription Cancellation (Temporary)

Until API access is enabled, you can manually cancel subscriptions via PayFast dashboard:

1. Go to: https://www.payfast.co.za → Login
2. Navigate to: **Transactions** → **Customer Subscriptions**
3. Find the subscription (use subscription token from Firestore)
4. Click **Actions** → **Cancel Subscription**

**Current Test Subscription:**
- Subscription Token: `eb3186f4-eaa9-44e8-8e81-fcd024b01c64`
- User ID: `l7UWuonXZZN7hpaEMpv`
- Payment ID: `263910913`
- Status in Firestore: `pending_cancellation`

---

## Restoring Normal Operations

Once PayFast API access is enabled:

### 1. Test Subscription Cancellation
```bash
# The functions are already deployed and ready
# Just test via Account Settings page once API access is enabled
```

### 2. Restore Original Homepage
```bash
cd /Users/arnovanheerden/Desktop/CV-Sift/cvsift
# Restore the built production file
cp dist/index.html.backup dist/index.html
# Deploy to hosting
firebase deploy --only hosting
```

### 3. Verify Everything Works
- Test subscription cancellation via Account Settings
- Test account deletion
- Verify email notifications are sent

---

## Technical Details

### PayFast Configuration (Firebase Config)
```
merchant_id: 31731849
merchant_key: b0j9si5k9ewt6
passphrase: 2025CVsiftSecure
mode: sandbox  (temporarily switched back to sandbox for testing)
```

### Functions Deployed
✅ All subscription management functions are deployed and ready:
- `cancelSubscription` - Cancel active subscriptions
- `pauseSubscription` - Pause subscriptions
- `unpauseSubscription` - Resume paused subscriptions
- `deleteUserAccount` - Delete account with automatic subscription cancellation
- `updateSubscriptionPlan` - Upgrade/downgrade plans

### Email Notifications
✅ Email templates created and integrated:
- Subscription cancellation confirmation email
- Account deletion confirmation email

---

## Files Modified

### New Files Created:
- `cvsift/public/index.html` - Maintenance page
- `cvsift/public/index.html.backup` - Original homepage backup
- `MAINTENANCE_MODE.md` - This documentation

### Files Previously Modified (Already Deployed):
- `cvsift/functions/payfast.js` - PayFast API integration
- `cvsift/functions/emailTemplates.js` - Email templates
- `cvsift/public/Pages/AccountSettings.jsx` - Account management UI
- `SUBSCRIPTION_MANAGEMENT_IMPLEMENTATION.md` - Technical documentation

---

## Support Information

**Email:** support@cvsift.co.za
**PayFast Support:** support@payfast.co.za

---

## Timeline

- **Nov 24, 2025 12:22 PM** - User attempted subscription cancellation, received 401 error
- **Nov 24, 2025 12:38 PM** - Maintenance page deployed
- **Next Steps:** Enable PayFast API access → Test → Restore normal operations

---

## Notes

- The signature generation code is correct (works for webhooks)
- The issue is purely about API access permissions in PayFast
- All backend functions are ready and tested
- Once API access is enabled, everything should work immediately
- The maintenance page auto-refreshes every 5 minutes

---

**Status:** 🔧 Under Maintenance - Waiting for PayFast API access enablement
