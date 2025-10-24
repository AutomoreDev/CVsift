import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500">Last updated: October 2025</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 lg:p-12">

          {/* Introduction */}
          <section className="mb-8">
            <p className="text-gray-700 leading-relaxed">
              At CVSift, operated by Automore (Pty) Ltd, we take your privacy seriously. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use our CV parsing and job matching platform.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">1.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Account Information:</strong> Name, email address, company name, phone number</li>
              <li><strong>CV Data:</strong> CVs and resumes you upload (PDF, DOCX, Pages formats)</li>
              <li><strong>Job Specifications:</strong> Job titles, requirements, skills, and other hiring criteria</li>
              <li><strong>Payment Information:</strong> Billing details processed securely through PayFast</li>
              <li><strong>Custom Fields:</strong> Any additional candidate information you choose to track</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">1.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on platform</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Cookies:</strong> Authentication tokens and session management</li>
              <li><strong>Log Data:</strong> Access times, error logs, performance metrics</li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide and maintain the CVSift service</li>
              <li>Parse CVs using AI to extract candidate information</li>
              <li>Match candidates to job specifications</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service updates, security alerts, and administrative messages</li>
              <li>Improve our platform based on usage patterns</li>
              <li>Provide customer support</li>
              <li>Detect and prevent fraud or security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 3. AI Processing and Data Extraction */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. AI Processing and Data Extraction</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Claude AI Integration:</strong> We use Anthropic's Claude AI to parse CVs and extract structured information.
              When you upload a CV:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>The CV is sent to Anthropic's API for processing</li>
              <li>AI extracts candidate details (name, email, skills, experience, education)</li>
              <li>Extracted data is stored in our secure Firebase database</li>
              <li>Original CV files are stored in Firebase Storage</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Anthropic's data processing is governed by their privacy policy. They do not use customer data to train models.
            </p>
          </section>

          {/* 4. Data Sharing and Disclosure */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>We do NOT sell your data.</strong> We may share information with:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Providers</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Google Firebase:</strong> Database, authentication, and file storage</li>
              <li><strong>Anthropic:</strong> AI-powered CV parsing</li>
              <li><strong>PayFast:</strong> Payment processing</li>
              <li><strong>Google AdSense:</strong> Advertising for free plan users (POPIA compliant)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Team Collaboration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you invite team members, they will have access to CVs and data within your account based on their assigned permissions.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Enterprise/Master Accounts</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Master accounts have administrative access to their sub-master accounts and usage data for billing purposes.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed">
              We may disclose information if required by law, court order, or government regulation.
            </p>
          </section>

          {/* 5. Data Security */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>HTTPS encryption for all data transmission</li>
              <li>Firebase Authentication with secure password hashing</li>
              <li>Role-based access control</li>
              <li>Regular security audits and updates</li>
              <li>Firestore security rules to prevent unauthorized access</li>
              <li>Cloud Function authentication checks</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* 6. Data Retention */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We retain your data as follows:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Active Accounts:</strong> Data retained as long as your account is active</li>
              <li><strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer for compliance purposes</li>
              <li><strong>Backups:</strong> Backup data retained for up to 90 days</li>
            </ul>
          </section>

          {/* 7. Your Rights (POPIA Compliance) */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Your Rights (POPIA Compliance)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under South Africa's Protection of Personal Information Act (POPIA), you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              To exercise these rights, contact us at emma@automore.co.za
            </p>
          </section>

          {/* 8. Cookies and Tracking */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use cookies and similar technologies for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Authentication:</strong> Keep you logged in securely</li>
              <li><strong>Preferences:</strong> Remember your settings</li>
              <li><strong>Analytics:</strong> Understand how you use our platform</li>
              <li><strong>Advertising:</strong> Show relevant ads to free plan users (with consent)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can control cookies through your browser settings. Disabling cookies may affect platform functionality.
            </p>
          </section>

          {/* 9. Third-Party Links */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Third-Party Links</h2>
            <p className="text-gray-700 leading-relaxed">
              Our platform may contain links to third-party websites (e.g., Automore, payment providers). We are not responsible
              for the privacy practices of these external sites. Please review their privacy policies.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              CVSift is not intended for individuals under 18 years of age. We do not knowingly collect personal information
              from children. If we discover we have collected data from a child, we will delete it immediately.
            </p>
          </section>

          {/* 11. Changes to Privacy Policy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or
              platform notification. The "Last Updated" date at the top will reflect the most recent revision.
            </p>
          </section>

          {/* 12. International Data Transfers */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">12. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be transferred to and stored on servers located outside South Africa (e.g., Google Cloud, Firebase).
              We ensure these transfers comply with POPIA and include appropriate safeguards.
            </p>
          </section>

          {/* Contact */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              If you have questions about this Privacy Policy or wish to exercise your rights:
            </p>
            <div className="text-gray-700">
              <p><strong>Data Protection Officer</strong></p>
              <p><strong>Automore (Pty) Ltd</strong></p>
              <p>Email: <a href="mailto:emma@automore.co.za" className="text-orange-500 hover:text-orange-600">emma@automore.co.za</a></p>
              <p>Website: <a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">www.automore.co.za</a></p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">© 2025 CVSift by Automore. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
