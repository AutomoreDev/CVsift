/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/**
 * SEMANTIC SKILL MATCHING SYSTEM (ZERO-COST ALGORITHMIC APPROACH)
 *
 * Universal skill matching across ALL industries and departments
 * NO AI CALLS during matching - keeps costs down for bulk processing
 *
 * Covers: Tech, Finance, Healthcare, Creative, Construction, Hospitality,
 * Entertainment, Legal, Education, Sales, Marketing, HR, and more
 */

/**
 * Comprehensive multi-industry skill hierarchy database
 * Pre-computed to avoid runtime AI costs
 */
const SKILL_HIERARCHIES = {
  // ============================================================================
  // TECHNOLOGY & SOFTWARE
  // ============================================================================
  "React": {implies: ["JavaScript", "HTML", "CSS"], related: ["Vue", "Angular"], transferableFrom: ["Vue", "Angular"], category: "tech"},
  "Python": {implies: ["Programming", "Logic"], related: ["Java", "C#", "Ruby"], transferableFrom: ["Java", "Ruby"], category: "tech"},
  "JavaScript": {implies: ["Programming", "Web Development"], related: ["TypeScript", "Python"], transferableFrom: ["TypeScript"], category: "tech"},
  "SQL": {implies: ["Database", "Data Querying"], related: ["PostgreSQL", "MySQL"], transferableFrom: ["NoSQL"], category: "tech"},
  "AWS": {implies: ["Cloud Computing"], related: ["Azure", "Google Cloud"], transferableFrom: ["Azure", "Google Cloud"], category: "tech"},
  "Docker": {implies: ["Containerization", "DevOps"], related: ["Kubernetes", "Podman"], transferableFrom: ["Kubernetes"], category: "tech"},

  // ============================================================================
  // PROJECT MANAGEMENT & OPERATIONS
  // ============================================================================
  "Agile": {implies: ["Project Management", "Scrum"], related: ["Waterfall", "Lean", "Kanban"], transferableFrom: ["Scrum", "Kanban"], category: "project-mgmt"},
  "Scrum": {implies: ["Agile", "Sprint Planning"], related: ["Kanban", "SAFe"], transferableFrom: ["Agile", "Kanban"], category: "project-mgmt"},
  "PMP": {implies: ["Project Management", "PMBOK"], related: ["Prince2", "Agile Certified"], transferableFrom: ["Prince2"], category: "project-mgmt"},
  "Prince2": {implies: ["Project Management"], related: ["PMP", "Agile"], transferableFrom: ["PMP"], category: "project-mgmt"},
  "Jira": {implies: ["Project Tracking", "Agile Tools"], related: ["Asana", "Monday.com", "Trello"], transferableFrom: ["Asana", "Monday.com"], category: "project-mgmt"},
  "Microsoft Project": {implies: ["Project Planning", "Gantt Charts"], related: ["Primavera", "Smartsheet"], transferableFrom: ["Primavera"], category: "project-mgmt"},
  "Six Sigma": {implies: ["Process Improvement", "Quality Management"], related: ["Lean", "Kaizen"], transferableFrom: ["Lean"], category: "project-mgmt"},
  "Lean Management": {implies: ["Process Optimization", "Waste Reduction"], related: ["Six Sigma", "Kaizen"], transferableFrom: ["Six Sigma"], category: "project-mgmt"},

  // ============================================================================
  // FINANCE & ACCOUNTING
  // ============================================================================
  "IFRS": {implies: ["Accounting Standards", "Financial Reporting"], related: ["GAAP", "Financial Accounting"], transferableFrom: ["GAAP"], category: "finance"},
  "GAAP": {implies: ["Accounting Standards", "Financial Reporting"], related: ["IFRS"], transferableFrom: ["IFRS"], category: "finance"},
  "Financial Modeling": {implies: ["Excel", "Finance", "Forecasting"], related: ["Valuation", "FP&A"], transferableFrom: ["Excel Analysis"], category: "finance"},
  "Xero": {implies: ["Accounting Software", "Bookkeeping"], related: ["QuickBooks", "Sage"], transferableFrom: ["QuickBooks", "MYOB"], category: "finance"},
  "QuickBooks": {implies: ["Accounting Software", "Bookkeeping"], related: ["Xero", "Sage", "FreshBooks"], transferableFrom: ["Xero", "Sage"], category: "finance"},
  "Sage": {implies: ["Accounting Software", "ERP"], related: ["Xero", "QuickBooks", "SAP"], transferableFrom: ["Xero", "QuickBooks"], category: "finance"},
  "SAP": {implies: ["ERP", "Financial Management"], related: ["Oracle ERP", "Microsoft Dynamics"], transferableFrom: ["Oracle ERP"], category: "finance"},
  "Tax Preparation": {implies: ["Tax Law", "Compliance"], related: ["Tax Planning", "IRS Regulations"], transferableFrom: ["Bookkeeping"], category: "finance"},
  "Payroll Processing": {implies: ["Payroll Systems", "Compliance"], related: ["HR Administration", "Payspace"], transferableFrom: ["HR Administration"], category: "finance"},
  "Payspace": {implies: ["Payroll Software", "HRIS"], related: ["Sage Payroll", "ADP"], transferableFrom: ["Sage Payroll"], category: "finance"},
  "Bloomberg Terminal": {implies: ["Financial Data Analysis", "Trading"], related: ["Reuters Eikon", "FactSet"], transferableFrom: ["Reuters Eikon"], category: "finance"},
  "CFA": {implies: ["Investment Analysis", "Portfolio Management"], related: ["CPA", "FRM"], transferableFrom: [], category: "finance"},
  "CPA": {implies: ["Accounting", "Auditing", "Tax"], related: ["CA", "ACCA"], transferableFrom: ["CA"], category: "finance"},

  // ============================================================================
  // PERFORMING ARTS & ENTERTAINMENT
  // ============================================================================
  "Ballet": {implies: ["Dance Technique", "Performance", "Flexibility"], related: ["Contemporary Dance", "Jazz"], transferableFrom: ["Contemporary Dance"], category: "performing-arts"},
  "Contemporary Dance": {implies: ["Dance Technique", "Improvisation"], related: ["Ballet", "Modern Dance"], transferableFrom: ["Ballet", "Jazz"], category: "performing-arts"},
  "Choreography": {implies: ["Dance", "Creative Direction", "Movement Design"], related: ["Dance Instruction", "Performance Direction"], transferableFrom: ["Dance Performance"], category: "performing-arts"},
  "Theatre Performance": {implies: ["Acting", "Stage Presence", "Voice Projection"], related: ["Film Acting", "Musical Theatre"], transferableFrom: ["Film Acting"], category: "performing-arts"},
  "Musical Theatre": {implies: ["Acting", "Singing", "Dance"], related: ["Theatre", "Opera"], transferableFrom: ["Theatre"], category: "performing-arts"},
  "Voice Training": {implies: ["Vocal Technique", "Performance"], related: ["Singing", "Public Speaking"], transferableFrom: ["Singing"], category: "performing-arts"},
  "Stage Management": {implies: ["Production Management", "Coordination"], related: ["Event Management", "Theatre Operations"], transferableFrom: ["Event Management"], category: "performing-arts"},
  "Lighting Design": {implies: ["Technical Theatre", "Design"], related: ["Sound Design", "Set Design"], transferableFrom: ["Set Design"], category: "performing-arts"},

  // ============================================================================
  // ARCHITECTURE & CONSTRUCTION
  // ============================================================================
  "AutoCAD": {implies: ["CAD", "Technical Drawing"], related: ["Revit", "SketchUp", "ArchiCAD"], transferableFrom: ["Revit", "Microstation"], category: "architecture"},
  "Revit": {implies: ["BIM", "Architectural Design", "CAD"], related: ["AutoCAD", "ArchiCAD"], transferableFrom: ["ArchiCAD"], category: "architecture"},
  "BIM": {implies: ["Building Information Modeling", "3D Design"], related: ["CAD", "Revit"], transferableFrom: ["CAD"], category: "architecture"},
  "SketchUp": {implies: ["3D Modeling", "Design Visualization"], related: ["Revit", "Rhino"], transferableFrom: ["AutoCAD"], category: "architecture"},
  "Quantity Surveying": {implies: ["Cost Estimation", "BOQ", "Contract Management"], related: ["Cost Planning", "Estimating"], transferableFrom: ["Cost Estimation"], category: "construction"},
  "CostX": {implies: ["Quantity Surveying Software", "Cost Estimation"], related: ["Buildsoft", "Candy"], transferableFrom: ["Buildsoft"], category: "construction"},
  "Construction Management": {implies: ["Project Management", "Site Management"], related: ["Project Coordination", "Site Supervision"], transferableFrom: ["Project Management"], category: "construction"},
  "Structural Engineering": {implies: ["Civil Engineering", "Structural Analysis"], related: ["Civil Engineering", "Structural Design"], transferableFrom: ["Civil Engineering"], category: "construction"},
  "SANS 10400": {implies: ["Building Regulations (South Africa)", "Compliance"], related: ["Building Codes", "Construction Standards"], transferableFrom: [], category: "construction"},

  // ============================================================================
  // HEALTHCARE & MEDICAL
  // ============================================================================
  "Patient Care": {implies: ["Healthcare", "Clinical Skills"], related: ["Nursing", "Medical Assistance"], transferableFrom: ["Nursing"], category: "healthcare"},
  "Nursing": {implies: ["Patient Care", "Clinical Skills", "Medical Knowledge"], related: ["Clinical Nursing", "ICU"], transferableFrom: ["Medical Assistant"], category: "healthcare"},
  "Pharmacology": {implies: ["Medicine", "Drug Knowledge"], related: ["Clinical Pharmacy", "Medication Management"], transferableFrom: ["Pharmacy Technician"], category: "healthcare"},
  "Medical Coding": {implies: ["ICD-10", "CPT", "Healthcare Administration"], related: ["Medical Billing", "Healthcare IT"], transferableFrom: ["Medical Billing"], category: "healthcare"},
  "Radiography": {implies: ["Medical Imaging", "X-Ray Technology"], related: ["CT Scanning", "MRI"], transferableFrom: ["CT Scanning"], category: "healthcare"},
  "Phlebotomy": {implies: ["Blood Collection", "Clinical Skills"], related: ["Laboratory Techniques"], transferableFrom: ["Medical Assistant"], category: "healthcare"},

  // ============================================================================
  // MARKETING & ADVERTISING
  // ============================================================================
  "Digital Marketing": {implies: ["Marketing Strategy", "Online Advertising"], related: ["Social Media Marketing", "Content Marketing"], transferableFrom: ["Social Media Marketing"], category: "marketing"},
  "SEO": {implies: ["Search Engine Optimization", "Digital Marketing"], related: ["SEM", "Content Marketing"], transferableFrom: ["SEM"], category: "marketing"},
  "Google Ads": {implies: ["PPC", "Digital Advertising"], related: ["Facebook Ads", "LinkedIn Ads"], transferableFrom: ["Facebook Ads"], category: "marketing"},
  "Social Media Marketing": {implies: ["Digital Marketing", "Content Creation"], related: ["Influencer Marketing", "Community Management"], transferableFrom: ["Content Marketing"], category: "marketing"},
  "Content Marketing": {implies: ["Copywriting", "Marketing Strategy"], related: ["Blogging", "SEO"], transferableFrom: ["Copywriting"], category: "marketing"},
  "Adobe Photoshop": {implies: ["Graphic Design", "Image Editing"], related: ["Adobe Illustrator", "GIMP"], transferableFrom: ["Adobe Illustrator"], category: "marketing"},
  "Adobe Illustrator": {implies: ["Graphic Design", "Vector Graphics"], related: ["Adobe Photoshop", "CorelDRAW"], transferableFrom: ["CorelDRAW"], category: "marketing"},
  "Figma": {implies: ["UI/UX Design", "Design Tools"], related: ["Sketch", "Adobe XD"], transferableFrom: ["Sketch", "Adobe XD"], category: "marketing"},
  "Canva": {implies: ["Graphic Design", "Visual Content"], related: ["Adobe Spark"], transferableFrom: ["Adobe Spark"], category: "marketing"},

  // ============================================================================
  // SALES & BUSINESS DEVELOPMENT
  // ============================================================================
  "B2B Sales": {implies: ["Sales", "Negotiation", "Client Relations"], related: ["B2C Sales", "Enterprise Sales"], transferableFrom: ["B2C Sales"], category: "sales"},
  "CRM": {implies: ["Customer Relationship Management", "Sales Tools"], related: ["Salesforce", "HubSpot"], transferableFrom: ["Salesforce"], category: "sales"},
  "Salesforce": {implies: ["CRM", "Sales Automation"], related: ["HubSpot", "Zoho CRM"], transferableFrom: ["HubSpot"], category: "sales"},
  "HubSpot": {implies: ["CRM", "Inbound Marketing"], related: ["Salesforce", "Pipedrive"], transferableFrom: ["Salesforce"], category: "sales"},
  "Lead Generation": {implies: ["Sales Prospecting", "Marketing"], related: ["Cold Calling", "Outbound Sales"], transferableFrom: ["Cold Calling"], category: "sales"},
  "Negotiation": {implies: ["Sales", "Communication"], related: ["Closing", "Deal Making"], transferableFrom: ["Sales"], category: "sales"},

  // ============================================================================
  // HUMAN RESOURCES
  // ============================================================================
  "Recruitment": {implies: ["HR", "Talent Acquisition"], related: ["Interviewing", "Candidate Screening"], transferableFrom: ["Interviewing"], category: "hr"},
  "Performance Management": {implies: ["HR", "Employee Development"], related: ["Performance Reviews", "Coaching"], transferableFrom: ["Coaching"], category: "hr"},
  "Employee Relations": {implies: ["HR", "Conflict Resolution"], related: ["Labor Law", "Employee Engagement"], transferableFrom: ["Conflict Resolution"], category: "hr"},
  "Workday": {implies: ["HRIS", "HR Software"], related: ["SAP SuccessFactors", "Oracle HCM"], transferableFrom: ["SAP SuccessFactors"], category: "hr"},
  "SHRM-CP": {implies: ["HR Certification", "HR Knowledge"], related: ["CIPD", "PHR"], transferableFrom: ["PHR"], category: "hr"},

  // ============================================================================
  // HOSPITALITY & TOURISM
  // ============================================================================
  "Hotel Management": {implies: ["Hospitality", "Operations Management"], related: ["Restaurant Management", "Event Management"], transferableFrom: ["Restaurant Management"], category: "hospitality"},
  "Front Desk Operations": {implies: ["Customer Service", "Hotel Operations"], related: ["Guest Relations", "Reception"], transferableFrom: ["Customer Service"], category: "hospitality"},
  "Food &amp; Beverage Management": {implies: ["Hospitality", "Operations"], related: ["Restaurant Management", "Catering"], transferableFrom: ["Restaurant Management"], category: "hospitality"},
  "Event Planning": {implies: ["Event Management", "Coordination"], related: ["Wedding Planning", "Conference Management"], transferableFrom: ["Project Management"], category: "hospitality"},
  "Sommelier": {implies: ["Wine Knowledge", "Hospitality"], related: ["Bartending", "F&amp;B Service"], transferableFrom: ["Bartending"], category: "hospitality"},
  "Opera PMS": {implies: ["Hotel Software", "Property Management"], related: ["Fidelio", "Guestline"], transferableFrom: ["Fidelio"], category: "hospitality"},

  // ============================================================================
  // EDUCATION & TRAINING
  // ============================================================================
  "Curriculum Development": {implies: ["Education", "Instructional Design"], related: ["Training Development", "Course Design"], transferableFrom: ["Instructional Design"], category: "education"},
  "Classroom Management": {implies: ["Teaching", "Behavior Management"], related: ["Student Engagement", "Discipline"], transferableFrom: ["Teaching"], category: "education"},
  "Online Teaching": {implies: ["E-Learning", "Teaching", "Technology"], related: ["Virtual Classroom", "Zoom Teaching"], transferableFrom: ["Traditional Teaching"], category: "education"},
  "TEFL": {implies: ["English Teaching", "ESL"], related: ["TESOL", "CELTA"], transferableFrom: ["TESOL"], category: "education"},
  "Special Education": {implies: ["Teaching", "Differentiated Instruction"], related: ["Inclusive Education", "Learning Support"], transferableFrom: ["Teaching"], category: "education"},

  // ============================================================================
  // LEGAL & COMPLIANCE
  // ============================================================================
  "Contract Law": {implies: ["Legal Knowledge", "Contracts"], related: ["Corporate Law", "Commercial Law"], transferableFrom: ["Corporate Law"], category: "legal"},
  "Legal Research": {implies: ["Legal Knowledge", "Research"], related: ["Case Law", "Statutory Analysis"], transferableFrom: ["Research"], category: "legal"},
  "Compliance": {implies: ["Regulatory Knowledge", "Risk Management"], related: ["Audit", "Legal Compliance"], transferableFrom: ["Audit"], category: "legal"},
  "Litigation": {implies: ["Legal Practice", "Court Procedures"], related: ["Dispute Resolution", "Trial Law"], transferableFrom: ["Mediation"], category: "legal"},
  "Paralegal": {implies: ["Legal Support", "Legal Research"], related: ["Legal Assistant", "Case Management"], transferableFrom: ["Legal Assistant"], category: "legal"},

  // ============================================================================
  // CUSTOMER SERVICE & SUPPORT
  // ============================================================================
  "Customer Service": {implies: ["Communication", "Problem Solving"], related: ["Client Relations", "Support"], transferableFrom: ["Reception"], category: "customer-service"},
  "Call Center": {implies: ["Customer Service", "Phone Communication"], related: ["Telemarketing", "Help Desk"], transferableFrom: ["Help Desk"], category: "customer-service"},
  "Technical Support": {implies: ["Customer Service", "IT Knowledge"], related: ["Help Desk", "IT Support"], transferableFrom: ["Help Desk"], category: "customer-service"},
  "Zendesk": {implies: ["Customer Support Software", "Ticketing"], related: ["Freshdesk", "Intercom"], transferableFrom: ["Freshdesk"], category: "customer-service"},

  // ============================================================================
  // SOFT SKILLS (Universal across industries)
  // ============================================================================
  "Leadership": {implies: ["Management", "Team Building"], related: ["Management", "Team Leadership"], transferableFrom: ["Team Coordination"], category: "soft-skills"},
  "Communication": {implies: ["Interpersonal Skills"], related: ["Presentation", "Writing"], transferableFrom: ["Public Speaking"], category: "soft-skills"},
  "Problem Solving": {implies: ["Critical Thinking", "Analysis"], related: ["Analytical Skills", "Decision Making"], transferableFrom: ["Critical Thinking"], category: "soft-skills"},
  "Time Management": {implies: ["Organization", "Prioritization"], related: ["Project Management", "Planning"], transferableFrom: ["Organization"], category: "soft-skills"},
  "Teamwork": {implies: ["Collaboration", "Interpersonal Skills"], related: ["Team Building", "Cooperation"], transferableFrom: ["Collaboration"], category: "soft-skills"},
};

/**
 * Calculate semantic skill match using pre-computed hierarchies
 * ZERO AI COST - Pure algorithmic matching
 */
function calculateSemanticSkillMatch(cvSkills, requiredSkill) {
  const normalizedRequired = requiredSkill.toLowerCase().trim();

  // Phase 1: Exact match
  for (const cvSkill of cvSkills) {
    if (cvSkill.toLowerCase().trim() === normalizedRequired) {
      return {
        match: true,
        confidence: 100,
        type: "exact",
        cvSkill,
        explanation: `Exact match: ${cvSkill}`,
      };
    }
  }

  // Phase 2: Check if CV has a skill that IMPLIES the required skill
  for (const cvSkill of cvSkills) {
    const hierarchy = SKILL_HIERARCHIES[cvSkill];
    if (hierarchy &amp;&amp; hierarchy.implies) {
      for (const implied of hierarchy.implies) {
        if (implied.toLowerCase().trim() === normalizedRequired) {
          return {
            match: true,
            confidence: 85,
            type: "implied",
            cvSkill,
            explanation: `Has ${cvSkill} which requires ${requiredSkill}`,
          };
        }
      }
    }
  }

  // Phase 3: Check if required skill hierarchy shows CV has transferable skill
  const requiredHierarchy = SKILL_HIERARCHIES[requiredSkill];
  if (requiredHierarchy) {
    // Check transferable skills - HIGH confidence
    if (requiredHierarchy.transferableFrom) {
      for (const cvSkill of cvSkills) {
        if (requiredHierarchy.transferableFrom.some((t) => t.toLowerCase() === cvSkill.toLowerCase())) {
          return {
            match: true,
            confidence: 75,
            type: "transferable",
            cvSkill,
            explanation: `Has ${cvSkill}, which transfers well to ${requiredSkill}`,
          };
        }
      }
    }

    // Check related skills - MEDIUM confidence
    if (requiredHierarchy.related) {
      for (const cvSkill of cvSkills) {
        if (requiredHierarchy.related.some((r) => r.toLowerCase() === cvSkill.toLowerCase())) {
          return {
            match: true,
            confidence: 60,
            type: "related",
            cvSkill,
            explanation: `Has ${cvSkill}, similar to ${requiredSkill}`,
          };
        }
      }
    }

    // Check if CV has foundational skills
    if (requiredHierarchy.implies) {
      for (const implied of requiredHierarchy.implies) {
        for (const cvSkill of cvSkills) {
          if (cvSkill.toLowerCase().trim() === implied.toLowerCase().trim()) {
            return {
              match: true,
              confidence: 40,
              type: "foundational",
              cvSkill,
              explanation: `Has ${cvSkill}, foundational for ${requiredSkill}`,
            };
          }
        }
      }
    }
  }

  return {match: false, confidence: 0, type: "none"};
}

/**
 * Detect skill proficiency level from experience descriptions
 */
function detectSkillProficiency(skill, experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return {level: "unknown", indicators: []};
  }

  const skillLower = skill.toLowerCase();
  const indicators = [];
  let mentionCount = 0;
  let recentUse = false;
  let advancedUsage = false;

  const advancedKeywords = [
    "led", "managed", "architected", "designed", "expert", "advanced",
    "senior", "principal", "head", "director", "specialized", "certified",
  ];

  for (const exp of experience) {
    const description = (exp.description || "").toLowerCase();
    const title = (exp.title || "").toLowerCase();

    if (description.includes(skillLower) || title.includes(skillLower)) {
      mentionCount++;

      // Check if recent
      const duration = exp.duration || exp.year || "";
      if (duration.toLowerCase().includes("present") ||
          duration.toLowerCase().includes("current") ||
          duration.includes("2023") ||
          duration.includes("2024") ||
          duration.includes("2025")) {
        recentUse = true;
      }

      // Check for advanced usage
      for (const keyword of advancedKeywords) {
        if (description.includes(keyword)) {
          advancedUsage = true;
          indicators.push(keyword);
        }
      }
    }
  }

  let level = "beginner";
  if (mentionCount === 0) {
    level = "unknown";
  } else if (advancedUsage) {
    level = "expert";
  } else if (mentionCount >= 2 || recentUse) {
    level = "intermediate";
  }

  return {
    level,
    mentionCount,
    recentUse,
    advancedUsage,
    indicators: [...new Set(indicators)],
  };
}

/**
 * Enhanced skill matching with semantic understanding
 * NO AI CALLS - Pure algorithmic, cost-free
 */
function enhancedSkillMatch(cvSkills, cvExperience, requiredSkills, preferredSkills) {
  const results = {
    required: {matched: [], missing: [], partial: []},
    preferred: {matched: [], missing: []},
    semanticInsights: [],
    proficiencyAnalysis: {},
  };

  // Match required skills
  for (const reqSkill of requiredSkills) {
    const semanticMatch = calculateSemanticSkillMatch(cvSkills, reqSkill);

    // Detect proficiency
    let proficiency = null;
    if (semanticMatch.match) {
      proficiency = detectSkillProficiency(reqSkill, cvExperience);
      results.proficiencyAnalysis[reqSkill] = proficiency;
    }

    if (semanticMatch.match &amp;&amp; semanticMatch.confidence >= 70) {
      results.required.matched.push({
        skill: reqSkill,
        confidence: semanticMatch.confidence,
        type: semanticMatch.type,
        cvSkill: semanticMatch.cvSkill,
        proficiency: proficiency?.level || "unknown",
      });
      results.semanticInsights.push(semanticMatch.explanation);
    } else if (semanticMatch.match &amp;&amp; semanticMatch.confidence >= 40) {
      results.required.partial.push({
        skill: reqSkill,
        confidence: semanticMatch.confidence,
        type: semanticMatch.type,
        cvSkill: semanticMatch.cvSkill,
        proficiency: proficiency?.level || "unknown",
      });
      results.semanticInsights.push(semanticMatch.explanation);
    } else {
      results.required.missing.push(reqSkill);
    }
  }

  // Match preferred skills
  for (const prefSkill of preferredSkills) {
    const semanticMatch = calculateSemanticSkillMatch(cvSkills, prefSkill);

    if (semanticMatch.match &amp;&amp; semanticMatch.confidence >= 60) {
      results.preferred.matched.push({
        skill: prefSkill,
        confidence: semanticMatch.confidence,
        cvSkill: semanticMatch.cvSkill,
      });
    } else {
      results.preferred.missing.push(prefSkill);
    }
  }

  return results;
}

/**
 * Calculate enhanced skill score
 */
function calculateEnhancedSkillScore(matchResults, requiredSkills, preferredSkills) {
  let score = 0;

  if (requiredSkills.length > 0) {
    const fullMatches = matchResults.required.matched.length;
    const partialMatches = matchResults.required.partial.length;

    let partialCredit = 0;
    for (const partial of matchResults.required.partial) {
      partialCredit += partial.confidence / 100;
    }

    const totalRequired = requiredSkills.length;
    score = ((fullMatches + partialCredit) / totalRequired) * 80;
  } else {
    score = 50;
  }

  if (preferredSkills.length > 0) {
    const matchedPreferred = matchResults.preferred.matched.length;
    score += (matchedPreferred / preferredSkills.length) * 20;
  } else {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

module.exports = {
  enhancedSkillMatch,
  calculateEnhancedSkillScore,
  calculateSemanticSkillMatch,
  detectSkillProficiency,
  SKILL_HIERARCHIES,
};
