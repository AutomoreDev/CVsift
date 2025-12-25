/**
 * Email templates for CVSift
 */

/**
 * Team invitation email template
 * @param {string} invitedByName - Name of person sending invite
 * @param {string} role - Role being offered (member/admin)
 * @param {string} acceptUrl - URL to accept invitation
 * @return {object} - Email subject and HTML body
 */
exports.teamInvitationEmail = (invitedByName, role, acceptUrl) => {
  const roleDescription = role === "admin" ?
    "an Admin with full management permissions" :
    "a Member with access to view and manage CVs";

  return {
    subject: `${invitedByName} invited you to join their CVSift team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - CVSift</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                CVSift
              </h1>
              <p style="margin: 8px 0 0; color: #fff7ed; font-size: 14px; font-weight: 500;">
                CV Management Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Invitation Message -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 12px 24px; background-color: #fef3c7; border-radius: 100px; margin-bottom: 24px;">
                  <span style="color: #92400e; font-size: 14px; font-weight: 600;">🎉 You've been invited!</span>
                </div>

                <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
                  Join ${invitedByName}'s Team
                </h2>

                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  You've been invited to join as <strong style="color: #f97316;">${roleDescription}</strong> on CVSift.
                </p>
              </div>

              <!-- Benefits -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                  What you'll be able to do:
                </h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>View and search CV database</li>
                  <li>Upload new CVs to the library</li>
                  <li>Match candidates to job specifications</li>
                  <li>Access advanced analytics and insights</li>
                  ${role === "admin" ? "<li><strong>Manage team members and settings</strong></li>" : ""}
                </ul>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${acceptUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3); transition: all 0.2s;">
                  Accept Invitation
                </a>
              </div>

              <!-- Alternative Link -->
              <div style="text-align: center; margin-bottom: 32px;">
                <p style="margin: 0 0 8px; color: #9ca3af; font-size: 13px;">
                  Button not working? Copy and paste this link:
                </p>
                <p style="margin: 0; color: #6b7280; font-size: 12px; word-break: break-all;">
                  ${acceptUrl}
                </p>
              </div>

              <!-- Expiry Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  ⏰ <strong>This invitation expires in 7 days.</strong> Accept soon to join the team!
                </p>
              </div>

              <!-- Footer Info -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                  This invitation was sent by <strong>${invitedByName}</strong> through CVSift.<br>
                  If you didn't expect this email, you can safely ignore it.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                © 2025 CVSift. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                CV Management & Recruitment Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
You've been invited to join ${invitedByName}'s team on CVSift!

You've been invited as ${roleDescription}.

What you'll be able to do:
- View and search CV database
- Upload new CVs to the library
- Match candidates to job specifications
- Access advanced analytics and insights
${role === "admin" ? "- Manage team members and settings" : ""}

Accept your invitation by clicking this link:
${acceptUrl}

⏰ This invitation expires in 7 days. Accept soon to join the team!

If you didn't expect this email, you can safely ignore it.

---
CVSift - CV Management & Recruitment Platform
© 2025 CVSift. All rights reserved.
    `.trim(),
  };
};

/**
 * Subscription cancellation confirmation email template
 * @param {string} userName - Name of the user
 * @param {string} userEmail - Email of the user
 * @param {string} plan - Plan that was cancelled
 * @return {object} - Email subject and HTML body
 */
exports.subscriptionCancelledEmail = (userName, userEmail, plan) => {
  return {
    subject: "Subscription Cancelled - CVSift",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled - CVSift</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                CVSift
              </h1>
              <p style="margin: 8px 0 0; color: #fff7ed; font-size: 14px; font-weight: 500;">
                CV Management Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Cancellation Notice -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 12px 24px; background-color: #fee2e2; border-radius: 100px; margin-bottom: 24px;">
                  <span style="color: #991b1b; font-size: 14px; font-weight: 600;">✓ Subscription Cancelled</span>
                </div>

                <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
                  Your ${plan} Subscription Has Been Cancelled
                </h2>

                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Hi ${userName}, we've successfully cancelled your subscription.
                </p>
              </div>

              <!-- Important Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px; color: #92400e; font-size: 16px; font-weight: 600;">
                  ✓ No Future Charges
                </h3>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  Your subscription has been cancelled with PayFast. You will not be charged again.
                </p>
              </div>

              <!-- What's Next -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                  What happens now:
                </h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>You'll continue to have access until the end of your current billing period</li>
                  <li>No future charges will be made to your payment method</li>
                  <li>Your account data remains accessible</li>
                  <li>You can reactivate anytime by subscribing again</li>
                </ul>
              </div>

              <!-- Feedback -->
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; color: #6b7280; font-size: 15px;">
                  We're sorry to see you go! If you have any feedback or issues, please let us know.
                </p>
                <a href="mailto:support@cvsift.co.za" style="color: #f97316; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Contact Support
                </a>
              </div>

              <!-- Footer Info -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                  Need to reactivate? Visit your account settings anytime.<br>
                  If you have questions, we're here to help!
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                © 2025 CVSift. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                CV Management & Recruitment Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Your ${plan} Subscription Has Been Cancelled

Hi ${userName},

We've successfully cancelled your subscription with PayFast. You will not be charged again.

What happens now:
- You'll continue to have access until the end of your current billing period
- No future charges will be made to your payment method
- Your account data remains accessible
- You can reactivate anytime by subscribing again

We're sorry to see you go! If you have any feedback or issues, please contact us at support@cvsift.co.za

Need to reactivate? Visit your account settings anytime.

---
CVSift - CV Management & Recruitment Platform
© 2025 CVSift. All rights reserved.
    `.trim(),
  };
};

/**
 * Account deletion confirmation email template
 * @param {string} userName - Name of the user
 * @param {string} userEmail - Email of the user
 * @return {object} - Email subject and HTML body
 */
exports.accountDeletedEmail = (userName, userEmail) => {
  return {
    subject: "Account Deleted - CVSift",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Deleted - CVSift</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                CVSift
              </h1>
              <p style="margin: 8px 0 0; color: #fef2f2; font-size: 14px; font-weight: 500;">
                CV Management Platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">

              <!-- Deletion Notice -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; padding: 12px 24px; background-color: #fee2e2; border-radius: 100px; margin-bottom: 24px;">
                  <span style="color: #991b1b; font-size: 14px; font-weight: 600;">✓ Account Deleted</span>
                </div>

                <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">
                  Your Account Has Been Permanently Deleted
                </h2>

                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Hi ${userName}, your CVSift account and all associated data have been permanently removed.
                </p>
              </div>

              <!-- What Was Deleted -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px; color: #991b1b; font-size: 16px; font-weight: 600;">
                  ✓ Deleted Successfully
                </h3>
                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.6;">
                  All subscriptions cancelled, no future charges will occur.
                </p>
              </div>

              <!-- Details -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                  What was permanently deleted:
                </h3>
                <ul style="margin: 0; padding: 0 0 0 20px; color: #6b7280; font-size: 14px; line-height: 1.8;">
                  <li>All CVs and uploaded documents</li>
                  <li>Job specifications and matches</li>
                  <li>Activity logs and usage data</li>
                  <li>All storage files</li>
                  <li>Authentication credentials</li>
                  <li>Active subscriptions (cancelled automatically)</li>
                </ul>
              </div>

              <!-- Return Info -->
              <div style="background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #92400e; font-size: 15px; font-weight: 600;">
                  Want to return?
                </h3>
                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                  You can create a new account anytime at <a href="https://www.cvsift.co.za" style="color: #f97316; text-decoration: none; font-weight: 600;">www.cvsift.co.za</a>
                </p>
              </div>

              <!-- Feedback -->
              <div style="text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 16px; color: #6b7280; font-size: 15px;">
                  We'd love to hear your feedback. What could we have done better?
                </p>
                <a href="mailto:support@cvsift.co.za" style="color: #f97316; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Send Feedback
                </a>
              </div>

              <!-- Footer Info -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6; text-align: center;">
                  This confirmation was sent to ${userEmail}<br>
                  Thank you for using CVSift!
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                © 2025 CVSift. All rights reserved.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                CV Management & Recruitment Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
    text: `
Your Account Has Been Permanently Deleted

Hi ${userName},

Your CVSift account and all associated data have been permanently removed.

What was permanently deleted:
- All CVs and uploaded documents
- Job specifications and matches
- Activity logs and usage data
- All storage files
- Authentication credentials
- Active subscriptions (cancelled automatically)

✓ All subscriptions have been cancelled. No future charges will occur.

Want to return?
You can create a new account anytime at www.cvsift.co.za

We'd love to hear your feedback. What could we have done better?
Contact us at: support@cvsift.co.za

Thank you for using CVSift!

---
CVSift - CV Management & Recruitment Platform
© 2025 CVSift. All rights reserved.
    `.trim(),
  };
};
