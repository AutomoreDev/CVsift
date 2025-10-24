# CV-Sift Matching System V2 - Research & Development

**Status:** 🔬 R&D ONLY - Completely Isolated from Production

## ⚠️ CRITICAL: Isolation Policy

**THIS FOLDER IS FOR RESEARCH AND DEVELOPMENT ONLY**

- ❌ **NOT deployed to production**
- ❌ **NOT accessible to customers**
- ❌ **NOT integrated with live system**
- ✅ **Fully isolated sandbox environment**
- ✅ **Safe for experimental development**
- ✅ **Testing ground for enhancements**

## Overview

This folder contains experimental enhancements to the CV matching system. All code here undergoes rigorous testing before any production integration. Enhancements are only promoted to production after:

1. ✅ Passing comprehensive testing phase
2. ✅ Internal validation and approval
3. ✅ Version control documentation
4. ✅ Customer notification as system upgrades

**Changes in V2 DO NOT affect the live production system until explicitly promoted.**

## Architecture

```
v2/
├── README.md (this file)
├── advancedMatcherV2.js (orchestrator - combines all v2 modules)
├── semanticMatcher.js (✅ COMPLETE - universal skill matching)
├── careerPatternDetector.js (🚧 TODO - freelancer, job-hopper detection)
├── confidenceScorer.js (🚧 TODO - data quality scoring)
└── qualitativeAnalyzer.js (🚧 TODO - Claude deep-dive for shortlist)
```

## Key Enhancements Over V1

### 1. Semantic Skill Matching (✅ Complete)
- **Zero AI cost** - Pre-computed skill hierarchies
- **Universal coverage** - Tech, Finance, Healthcare, Arts, Construction, Hospitality, Legal, Education, etc.
- **Transferable skill detection** - Recognizes that Vue → React is easier than Vue → Java
- **Proficiency estimation** - Analyzes experience descriptions to estimate skill level

**Example:**
- CV has "Django" → Knows "Python" (implied)
- CV has "Vue" → Can learn "React" quickly (transferable)
- CV has "Xero" → Likely knows "QuickBooks" (related)

### 2. Career Pattern Detection (🚧 Planned)
Prevents false negatives by detecting:
- **Freelancers/Consultants** - Multiple short projects are normal, not job-hopping
- **Career Changers** - Recent pivot to target industry (don't over-penalize)
- **Portfolio Careers** - Multiple part-time roles simultaneously
- **Contract Industries** - Entertainment, events, construction have natural short cycles

### 3. Confidence Scoring (🚧 Planned)
- Reports uncertainty when CV data is incomplete
- Flags ambiguous matches for manual review
- Tracks parsing quality to ensure accurate extraction

### 4. Qualitative Analysis (🚧 Planned)
- **Cost-optimized** - Only for top candidates recruiter shortlists
- Uses Claude with prompt caching for deep insights
- Analyzes soft skills, culture fit, communication quality from CV writing

## Research & Development Workflow

### Phase 1: Development & Internal Testing (V2 Folder - Isolated)
- Develop enhancements in isolated V2 environment
- Unit testing with sample CVs and job specs
- Internal validation and debugging
- Performance benchmarking
- Cost analysis
- **Status:** No customer impact, fully sandboxed

### Phase 2: Controlled Testing Phase (Internal Only)
- Side-by-side comparison with V1 production data
- Accuracy validation against known good matches
- Edge case testing (freelancers, career changers, etc.)
- Regression testing to ensure no degradation
- Internal team review and approval
- **Status:** Still isolated, not customer-facing

### Phase 3: Production Integration (Version Control)
**Only after passing all tests:**
- Merge approved enhancements into production codebase
- Update version numbers (e.g., v1.5.0 → v1.6.0)
- Document changes in CHANGELOG
- Create git release tag
- Deploy to production with rollback plan
- **Status:** Live, but customers not yet notified

### Phase 4: Customer Communication
**After successful production deployment:**
- Prepare customer-facing release notes
- Highlight improvements and new features
- Send system upgrade notifications via email/dashboard
- Update documentation and help center
- Provide support for any questions
- **Status:** Customers informed of enhancements

### Phase 5: Monitoring & Iteration
- Monitor production metrics post-upgrade
- Gather customer feedback
- Track match quality improvements
- Address any issues immediately
- Plan next iteration of enhancements

## Rollback Strategy

If any enhancement causes issues in production:
1. Immediate rollback to previous version
2. Investigate root cause in isolated V2 environment
3. Fix and re-test before re-deployment
4. Communicate with affected customers if necessary

## Production Integration Process

### How V2 Enhancements Reach Customers

**V2 does NOT create separate API endpoints.** Instead, proven enhancements are merged directly into the production codebase.

**Current Production (V1):**
```javascript
// functions/advancedMatcher.js
// functions/skillNormalizer.js
// functions/dataNormalizer.js
```

**After V2 Enhancement Approval:**
1. Extract proven V2 code (e.g., semantic matching logic)
2. Integrate into production files (e.g., enhance `advancedMatcher.js`)
3. Update version: `v1.5.0` → `v1.6.0`
4. Deploy with no API changes (transparent to customers)
5. Customers automatically benefit from improvements

**Example Integration:**
```javascript
// Before (V1 Production)
function calculateAdvancedSkillsMatch(cvSkills, requiredSkills) {
  // Basic matching logic
}

// After (V2 Enhancement Integrated)
function calculateAdvancedSkillsMatch(cvSkills, requiredSkills) {
  // Enhanced with semantic matching from V2
  // Includes transferable skill detection
  // Proficiency estimation
}
```

**Customer Experience:**
- Same API calls work as before
- No code changes required
- Better match accuracy automatically
- Notified via upgrade announcement

## Cost Analysis

### V1 Costs
- CV Parsing: ~$0.15 per CV (Claude Sonnet 4.5)
- Matching: $0 (algorithmic only)
- **Total per 1000 CVs:** $150

### V2 Costs
- CV Parsing: ~$0.15 per CV (unchanged)
- Matching: $0 (enhanced algorithmic, no AI)
- Qualitative Analysis: ~$0.02 per shortlisted candidate (Haiku with caching)
- **Total per 1000 CVs:** $150 + ~$0.40 (assuming 20 shortlisted)
- **Savings:** No cost increase for bulk matching

## Development Roadmap

- [x] Create V2 folder structure
- [x] Build semantic skill matcher (universal, multi-industry)
- [ ] Build career pattern detector
- [ ] Build confidence scoring system
- [ ] Build qualitative analyzer (Claude deep-dive)
- [ ] Create advancedMatcherV2.js orchestrator
- [ ] Add versioned API endpoints
- [ ] Build comparison testing suite
- [ ] Run pilot with test CVs
- [ ] Gather feedback and iterate
- [ ] Production rollout

## Notes for Future Development

### When resuming work on V2:
1. Complete `careerPatternDetector.js` - Handle edge cases like freelancers
2. Complete `confidenceScorer.js` - Report match certainty
3. Complete `qualitativeAnalyzer.js` - Deep-dive analysis for shortlist
4. Build `advancedMatcherV2.js` - Orchestrate all modules
5. Add version flag to cvMatcher.js API endpoints
6. Test thoroughly before any production exposure

### Important Principles:
- **Zero AI cost for bulk matching** - Keep matching algorithmic
- **AI only for deep analysis** - Use Claude for shortlisted candidates
- **Maintain V1 compatibility** - Don't break existing integrations
- **Gradual rollout** - A/B test before full migration

---

## ⚠️ Final Reminder: Isolation Guarantee

**This V2 folder is a research sandbox:**
- ✅ Completely isolated from production
- ✅ Safe to experiment and develop
- ✅ No impact on live customers
- ✅ Only affects production after explicit approval and integration
- ✅ All enhancements go through rigorous testing before customer exposure
- ✅ Customers are notified of upgrades after deployment

**Deployment Safety:**
Running `firebase deploy` will NOT deploy V2 code to production. V2 remains isolated until explicitly merged into production files.

---

**Last Updated:** 2025-10-24
**Status:** R&D Environment - Foundation complete, modules in progress
**Production Impact:** NONE - Fully isolated from production until approved
**Customer Visibility:** NONE - Research phase only
