# Changelog

All notable changes to CV-Sift will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-24

### 🎉 Foundation Release

This is the first production release of CV-Sift, a comprehensive CV matching and management system.

### Added

#### Core Matching System
- Advanced CV matching algorithm with semantic understanding
- Multi-industry skill normalization covering:
  - Technology & Software Development
  - Finance & Accounting (IFRS, GAAP, Xero, QuickBooks, SAP)
  - Healthcare & Medical
  - Performing Arts & Entertainment (Ballet, Dance, Theatre)
  - Architecture & Construction (AutoCAD, Revit, BIM, Quantity Surveying)
  - Hospitality & Tourism
  - Marketing & Advertising
  - Sales & Business Development
  - Human Resources
  - Education & Training
  - Legal & Compliance
  - Customer Service & Support
- Career progression analysis
- Industry alignment scoring
- Over-qualification detection with nuanced scoring
- Location matching with conditional scoring (onsite/hybrid/remote)
- Education level matching and normalization

#### Team Collaboration
- Team member invitations and management
- Role-based access control
- Shared CV access for team members
- Activity logging for team actions
- Team owner data sharing

#### Account Management
- Master account system for administrative access
- Sub-master account management
- Usage tracking and analytics per account
- Subscription management with PayFast integration
- CV upload limits by plan tier
- CV pack purchasing system

#### AI Features
- Claude AI-powered CV parsing
  - Extracts structured data from PDFs, Word docs, and Apple Pages
  - Handles multi-page CVs with certificates
  - Normalizes contact information, skills, education, and experience
- AI Chatbot assistant for user queries (available on Professional+ plans)
- Intelligent skill matching with transferable skill detection

#### Analytics & Reporting
- Advanced analytics dashboard
- Custom report generation
- Match breakdown visualization
- Activity logs with filtering
- Usage statistics and trends

#### Payments & Subscriptions
- PayFast payment integration
- Multiple subscription tiers (Basic, Professional, Business, Enterprise)
- Subscription management (upgrade, downgrade, cancel)
- Webhook handling for payment notifications
- CV pack purchasing for additional capacity

#### User Interface
- Modern, responsive dashboard
- Dark mode support
- Real-time status updates
- Toast notifications for user feedback
- Custom field management for CVs
- Job specification creation and management
- Batch CV matching against job specs
- Version badge display (v1.0.0)

#### Infrastructure
- Firebase Cloud Functions backend
- Firestore database
- Firebase Authentication
- Cloud Storage for CV files
- SMS verification tracking
- Email notifications (password reset, team invites)
- AdSense integration for monetization

### 🔬 Research & Development
- Established isolated V2 folder for future enhancements
- Created semantic skill matcher foundation with universal industry coverage
- Documented R&D workflow: Development → Testing → Production → Customer Notification
- Version tracking system for managing releases

### 📝 Documentation
- Comprehensive V2 R&D README with workflow and rollback strategy
- Version configuration in version.json
- Code documentation and inline comments

### 🔒 Security
- Firebase security rules for data access control
- Team member authorization checks
- Master account access controls
- Payment webhook signature verification

---

## Future Versions

### [1.1.0] - Planned
- Enhanced career pattern detection (freelancer vs job-hopper)
- Confidence scoring for match quality assessment
- Improved CV parsing with additional file format support

### [1.2.0] - Planned
- AI qualitative analysis for shortlisted candidates
- Bulk CV operations improvements
- Advanced filtering and search capabilities

### [2.0.0] - Research Phase (V2 R&D)
- Complete semantic matching system integration
- Multi-pass Claude analysis with caching
- Recruiter feedback loop for continuous improvement
- Advanced edge case handling

---

**Note:** All changes are tracked in version control. Customers are notified of major updates through the dashboard and email.

**Repository:** https://github.com/AutomoreDev/CVsift
