import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-accent-500 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900 font-heading">Terms of Service</h1>
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
              Welcome to CVSift. These Terms of Service ("Terms") govern your use of our CV parsing and job matching platform.
              By accessing or using CVSift, you agree to be bound by these Terms. If you disagree with any part of these terms,
              you may not access the service.
            </p>
          </section>

          {/* 1. Service Description */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">1. Service Description</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              CVSift is an AI-powered CV parsing and job matching platform provided by Automore (Pty) Ltd. Our service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Automated CV parsing and data extraction</li>
              <li>Job specification creation and management</li>
              <li>AI-powered candidate-to-job matching</li>
              <li>Team collaboration features</li>
              <li>Advanced analytics and reporting</li>
              <li>API access (Enterprise plans)</li>
            </ul>
          </section>

          {/* 2. Account Registration */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">2. Account Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              To use CVSift, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Be at least 18 years old or have parental/guardian consent</li>
              <li>Not share your account credentials with others</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          {/* 3. Subscription Plans and Billing */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">3. Subscription Plans and Billing</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Free Plan:</strong> Includes limited features with no payment required.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Paid Plans:</strong> Subscription fees are billed monthly or annually in South African Rand (ZAR).
              Payment is processed through our secure payment provider, PayFast.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Enterprise Plans:</strong> Usage-based billing for CV uploads (R1.20 each), chatbot messages (R0.35 each),
              and API calls (R0.10 each). Invoices are issued monthly.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>Cancellation:</strong> You may cancel your subscription at any time. No refunds are provided for partial months.
            </p>
          </section>

          {/* 4. Data Usage and Privacy */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">4. Data Usage and Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Your use of CVSift is also governed by our Privacy Policy. Key points:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>You retain ownership of all CVs and data you upload</li>
              <li>We use AI processing to extract information from CVs</li>
              <li>We implement AES-256-GCM encryption for all personally identifiable information (PII)</li>
              <li>We do not sell or share your data with third parties for marketing purposes</li>
              <li>Enterprise accounts have full control over their sub-master accounts</li>
              <li><strong>You are solely responsible for obtaining necessary consent from candidates to process their personal data</strong></li>
              <li><strong>You warrant that you have the legal right to upload and process all candidate CVs</strong></li>
              <li><strong>You agree to comply with all applicable data protection laws (POPIA, GDPR, etc.)</strong></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3 bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
              <strong>Important:</strong> CVSift acts as a data processor on your behalf. You (the user) are the data controller responsible for ensuring you have lawful basis to process candidate personal information. Automore (Pty) Ltd is not liable for your failure to obtain proper consent or comply with data protection regulations.
            </p>
          </section>

          {/* 5. Acceptable Use */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">5. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree NOT to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Upload malicious code or attempt to compromise the platform</li>
              <li>Abuse, harass, or discriminate against any individual</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the service for unauthorized commercial purposes</li>
              <li>Share or resell access to the platform without authorization</li>
              <li>Scrape or data mine the platform</li>
            </ul>
          </section>

          {/* 6. Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">6. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The CVSift platform, including all software, designs, text, graphics, and other content, is owned by
              Automore (Pty) Ltd and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You are granted a limited, non-exclusive, non-transferable license to use CVSift for your internal business purposes.
            </p>
          </section>

          {/* 7. Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">7. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              CVSift is provided "as is" without warranties of any kind. To the fullest extent permitted by law:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li><strong>We are not responsible for hiring decisions made using our platform</strong></li>
              <li><strong>AI parsing results may contain errors or inaccuracies - you must verify all information</strong></li>
              <li><strong>Match scores are algorithmic recommendations only - not definitive hiring advice</strong></li>
              <li>Our total liability shall not exceed the amount you paid in the last 12 months</li>
              <li><strong>We are not liable for any regulatory fines you incur due to improper data handling or lack of candidate consent</strong></li>
              <li><strong>We are not liable for discrimination claims arising from your use of the platform</strong></li>
              <li><strong>You indemnify Automore (Pty) Ltd against any claims arising from your violation of data protection laws</strong></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <strong>Disclaimer:</strong> CVSift provides matching technology only. The final hiring decision is solely your responsibility. We are not liable for discrimination, wrongful termination, or any employment-related claims arising from candidates processed through the platform. You must ensure compliance with all employment laws in your jurisdiction.
            </p>
          </section>

          {/* 8. Indemnification */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">8. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              You agree to indemnify, defend, and hold harmless Automore (Pty) Ltd, its officers, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses arising from:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your violation of these Terms of Service</li>
              <li>Your violation of any data protection laws (POPIA, GDPR, etc.)</li>
              <li>Your failure to obtain proper consent from candidates to process their personal data</li>
              <li>Any employment discrimination claims arising from your use of CVSift</li>
              <li>Your hiring decisions based on CVSift match scores or recommendations</li>
              <li>Any breach of confidentiality or unauthorized disclosure of candidate data</li>
              <li>Any content you upload to the platform</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              This indemnification obligation survives termination of your account and these Terms.
            </p>
          </section>

          {/* 9. Termination */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We reserve the right to suspend or terminate your account if you:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate these Terms of Service</li>
              <li>Fail to pay applicable fees</li>
              <li>Engage in fraudulent or illegal activity</li>
              <li>Upload content that violates data protection laws</li>
              <li>Process candidate data without proper consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">
              Upon termination, your right to use CVSift will immediately cease. You may download your data within 30 days of termination, after which it will be permanently deleted.
            </p>
          </section>

          {/* 10. Changes to Terms */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. We will notify you of significant changes via email or platform notification.
              Continued use of CVSift after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* 11. Governing Law */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of South Africa. Any disputes shall be resolved in the courts of South Africa.
            </p>
          </section>

          {/* Contact */}
          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-secondary-900 mb-4 font-heading">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-2">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="text-gray-700">
              <p><strong>Automore (Pty) Ltd</strong></p>
              <p>Email: <a href="mailto:emma@automore.co.za" className="text-accent-500 hover:text-accent-600">emma@automore.co.za</a></p>
              <p>Website: <a href="https://www.automore.co.za" target="_blank" rel="noopener noreferrer" className="text-accent-500 hover:text-accent-600">www.automore.co.za</a></p>
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

export default TermsOfService;
