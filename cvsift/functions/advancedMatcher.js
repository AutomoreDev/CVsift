/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/**
 * ADVANCED CV MATCHING ALGORITHM
 *
 * Key Improvements:
 * 1. Context-aware skill matching with semantic similarity
 * 2. Career progression analysis
 * 3. Industry alignment scoring
 * 4. Skill recency weighting (newer skills weighted higher)
 * 5. Over-qualification detection with nuanced scoring
 * 6. Cultural fit indicators
 * 7. Growth potential assessment
 * 8. Detailed match explanations
 */

const {normalizeSkills, skillsMatch} = require("./skillNormalizer");
const {locationsMatch} = require("./dataNormalizer");

// Industry taxonomy and related industries (expanded)
const INDUSTRY_RELATIONSHIPS = {
  "Software Engineering": [
    "Web Development", "Mobile Development", "Cloud Computing", "DevOps",
    "SaaS", "Technology", "Fintech", "E-commerce",
  ],
  "Data Science": [
    "Machine Learning", "AI", "Analytics", "Business Intelligence",
    "Research", "Statistics", "Big Data",
  ],
  "Finance": [
    "Banking", "Investment", "Accounting", "Insurance", "Fintech",
    "Wealth Management", "Financial Services", "Tax", "Audit", "Bookkeeping",
  ],
  "Marketing": [
    "Digital Marketing", "Advertising", "Brand Management", "PR",
    "Social Media", "Content Marketing", "Growth Marketing",
  ],
  "Healthcare": [
    "Medicine", "Nursing", "Pharmaceuticals", "Medical Research",
    "Healthcare IT", "Biotech", "Health Insurance",
  ],
  "Entertainment": [
    "Performing Arts", "Theatre", "Dance", "Music", "Film", "Television",
    "Media Production", "Broadcasting", "Events", "Arts",
  ],
  "Hospitality": [
    "Hotels", "Restaurants", "Tourism", "Food Service", "Catering",
    "Event Management", "Travel",
  ],
  "Education": [
    "Teaching", "Training", "Academic Research", "EdTech", "Tutoring",
    "Curriculum Development", "University", "Schools",
  ],
  "Construction": [
    "Building", "Engineering", "Architecture", "Civil Engineering",
    "Project Management", "Real Estate Development",
  ],
  "Retail": [
    "Sales", "E-commerce", "Customer Service", "Store Management",
    "Supply Chain", "Merchandising",
  ],
  "Manufacturing": [
    "Production", "Operations", "Quality Control", "Supply Chain",
    "Industrial Engineering", "Logistics",
  ],
};

/**
 * INDUSTRY ADJACENCY MATRIX
 * Maps industries/roles to related industries with similarity scores (0-100)
 * Higher score = more transferable skills and easier career transition
 */
const INDUSTRY_ADJACENCY = {
  // Technology & Data
  "Data Analyst": {
    // Highly adjacent (80-100): Very similar roles, easy transition
    "Business Analyst": 95,
    "Data Scientist": 90,
    "Business Intelligence Analyst": 95,
    "Financial Analyst": 85,
    "Market Research Analyst": 80,

    // Moderately adjacent (50-79): Related skills, possible transition
    "Software Developer": 70,
    "Product Analyst": 75,
    "Operations Analyst": 70,
    "Quantitative Analyst": 75,
    "Research Analyst": 65,

    // Weakly adjacent (30-49): Some transferable skills
    "Project Manager": 45,
    "Accountant": 40,
    "Marketing Analyst": 50,

    // Distant (10-29): Few transferable skills
    "Sales Manager": 20,
    "HR Manager": 15,

    // Unrelated (<10): No meaningful overlap
    "Chef": 5,
    "Dancer": 5,
    "Journalist": 10,
  },

  "Software Developer": {
    // Highly adjacent
    "Software Engineer": 100,
    "Full Stack Developer": 95,
    "Backend Developer": 90,
    "Frontend Developer": 90,
    "Mobile Developer": 85,
    "DevOps Engineer": 80,
    "Senior Software Engineer": 90,
    "Junior Software Developer": 95,

    // Moderately adjacent
    "Data Scientist": 70,
    "Data Engineer": 75,
    "System Administrator": 65,
    "QA Engineer": 60,
    "Product Manager": 55,
    "Technical Lead": 80,

    // Weakly adjacent
    "Business Analyst": 40,
    "IT Support": 35,
    "Project Manager": 45,

    // Distant
    "Data Analyst": 45,
    "Graphic Designer": 25,
    "Marketing Manager": 20,

    // Unrelated
    "Chef": 5,
    "Teacher": 10,
    "Journalist": 10,
  },

  "Software Engineer": {
    // Highly adjacent - exact synonyms and variants
    "Software Developer": 100,
    "Senior Software Engineer": 95,
    "Junior Software Engineer": 95,
    "Full Stack Engineer": 95,
    "Backend Engineer": 90,
    "Frontend Engineer": 90,
    "Mobile Engineer": 85,
    "DevOps Engineer": 80,
    "Staff Engineer": 90,

    // Moderately adjacent
    "Data Engineer": 75,
    "Data Scientist": 70,
    "System Administrator": 65,
    "QA Engineer": 60,
    "Technical Lead": 80,
    "Engineering Manager": 70,

    // Weakly adjacent
    "Product Manager": 50,
    "Business Analyst": 40,
    "Project Manager": 45,
    "IT Support": 35,

    // Distant
    "Data Analyst": 45,
    "Graphic Designer": 25,
    "Marketing Manager": 20,

    // Unrelated
    "Chef": 5,
    "Teacher": 10,
    "Journalist": 10,
  },

  "Financial Analyst": {
    // Highly adjacent
    "Investment Analyst": 95,
    "Equity Research Analyst": 95,
    "Credit Analyst": 90,
    "Risk Analyst": 85,
    "Portfolio Manager": 80,

    // Moderately adjacent
    "Data Analyst": 75,
    "Business Analyst": 70,
    "Accountant": 65,
    "Auditor": 60,
    "Management Consultant": 55,

    // Weakly adjacent
    "Operations Analyst": 50,
    "Product Manager": 40,
    "Sales Analyst": 45,

    // Distant
    "Software Developer": 25,
    "Marketing Analyst": 35,

    // Unrelated
    "Chef": 5,
    "Journalist": 10,
    "Teacher": 10,
  },

  "Business Analyst": {
    // Highly adjacent
    "Product Manager": 85,
    "Project Manager": 80,
    "Management Consultant": 85,
    "Operations Analyst": 90,
    "Strategy Analyst": 85,

    // Moderately adjacent
    "Data Analyst": 80,
    "Financial Analyst": 70,
    "Business Intelligence Analyst": 75,
    "Process Improvement Analyst": 70,

    // Weakly adjacent
    "Software Developer": 50,
    "Marketing Manager": 45,
    "Sales Operations": 50,

    // Distant
    "HR Manager": 30,
    "Accountant": 35,

    // Unrelated
    "Chef": 5,
    "Teacher": 10,
  },

  "Systems Analyst": {
    // Highly adjacent
    "Lead Systems Analyst": 95,
    "Senior Systems Analyst": 95,
    "IT Systems Analyst": 95,
    "Business Systems Analyst": 90,
    "Applications Analyst": 85,
    "Systems Administrator": 80,
    "IT Analyst": 85,

    // Moderately adjacent
    "Business Analyst": 80,
    "Data Analyst": 75,
    "Technical Analyst": 80,
    "Solutions Architect": 70,
    "IT Consultant": 70,
    "Infrastructure Analyst": 75,
    "Network Analyst": 65,

    // Weakly adjacent
    "Software Developer": 55,
    "Database Administrator": 50,
    "Project Manager": 50,
    "QA Engineer": 50,
    "DevOps Engineer": 45,

    // Distant
    "Product Manager": 35,
    "Technical Support Engineer": 40,
    "IT Support": 35,

    // Unrelated
    "Marketing Manager": 15,
    "Accountant": 15,
    "Chef": 5,
  },

  "Marketing Manager": {
    // Highly adjacent
    "Digital Marketing Manager": 95,
    "Brand Manager": 90,
    "Product Marketing Manager": 85,
    "Content Marketing Manager": 85,
    "Growth Marketing Manager": 90,

    // Moderately adjacent
    "Social Media Manager": 75,
    "Communications Manager": 70,
    "PR Manager": 70,
    "Sales Manager": 60,
    "Business Development Manager": 65,

    // Weakly adjacent
    "Product Manager": 50,
    "Marketing Analyst": 55,
    "Graphic Designer": 40,

    // Distant
    "Data Analyst": 30,
    "Software Developer": 20,
    "Financial Analyst": 25,

    // Unrelated
    "Chef": 5,
    "Accountant": 10,
  },

  "Project Manager": {
    // Highly adjacent
    "Program Manager": 95,
    "Product Manager": 85,
    "Scrum Master": 80,
    "Agile Coach": 75,
    "Delivery Manager": 90,

    // Moderately adjacent
    "Business Analyst": 70,
    "Operations Manager": 65,
    "Technical Lead": 60,
    "Account Manager": 55,

    // Weakly adjacent
    "Software Developer": 45,
    "Data Analyst": 40,
    "Marketing Manager": 50,

    // Distant
    "HR Manager": 35,
    "Financial Analyst": 30,

    // Unrelated
    "Chef": 5,
    "Dancer": 5,
  },

  "Chef": {
    // Highly adjacent
    "Executive Chef": 100,
    "Sous Chef": 95,
    "Line Cook": 85,
    "Pastry Chef": 80,
    "Kitchen Manager": 90,

    // Moderately adjacent
    "Restaurant Manager": 70,
    "Food Service Manager": 75,
    "Catering Manager": 70,
    "Culinary Instructor": 60,

    // Weakly adjacent
    "Nutritionist": 40,
    "Hotel Manager": 35,
    "Event Coordinator": 30,

    // Distant
    "Waiter": 25,
    "Bartender": 20,

    // Unrelated
    "Software Developer": 5,
    "Data Analyst": 5,
    "Accountant": 5,
    "Teacher": 10,
  },

  "Teacher": {
    // Highly adjacent
    "Educator": 100,
    "Instructor": 95,
    "Professor": 90,
    "Tutor": 85,
    "Curriculum Developer": 80,

    // Moderately adjacent
    "Training Specialist": 75,
    "Education Consultant": 70,
    "Learning & Development Manager": 65,
    "Academic Advisor": 60,

    // Weakly adjacent
    "HR Training Coordinator": 50,
    "Technical Writer": 40,
    "Content Creator": 45,

    // Distant
    "Project Manager": 30,
    "Social Worker": 35,

    // Unrelated
    "Software Developer": 10,
    "Data Analyst": 10,
    "Chef": 5,
  },

  "Journalist": {
    // Highly adjacent
    "Reporter": 100,
    "Writer": 90,
    "Content Writer": 85,
    "Editor": 80,
    "Copywriter": 75,

    // Moderately adjacent
    "Communications Specialist": 70,
    "PR Specialist": 70,
    "Content Strategist": 65,
    "Social Media Manager": 60,
    "Marketing Writer": 65,

    // Weakly adjacent
    "Technical Writer": 50,
    "Blogger": 55,
    "Marketing Manager": 40,

    // Distant
    "Graphic Designer": 30,
    "Teacher": 25,

    // Unrelated
    "Software Developer": 10,
    "Data Analyst": 10,
    "Chef": 5,
    "Accountant": 5,
  },

  "Accountant": {
    // Highly adjacent
    "Senior Accountant": 100,
    "Staff Accountant": 95,
    "Tax Accountant": 90,
    "Cost Accountant": 85,
    "Management Accountant": 90,

    // Moderately adjacent
    "Auditor": 80,
    "Financial Analyst": 70,
    "Bookkeeper": 65,
    "Payroll Specialist": 60,
    "Finance Manager": 75,

    // Weakly adjacent
    "Business Analyst": 45,
    "Compliance Officer": 50,
    "Budget Analyst": 55,

    // Distant
    "Data Analyst": 35,
    "Operations Manager": 30,

    // Unrelated
    "Software Developer": 10,
    "Chef": 5,
    "Teacher": 10,
  },

  // Healthcare & Medical
  "Nurse": {
    // Highly adjacent
    "Registered Nurse": 100,
    "Clinical Nurse": 95,
    "ICU Nurse": 90,
    "Emergency Room Nurse": 90,
    "Pediatric Nurse": 85,
    "Surgical Nurse": 85,

    // Moderately adjacent
    "Nurse Practitioner": 75,
    "Healthcare Administrator": 60,
    "Medical Assistant": 55,
    "Patient Care Coordinator": 65,
    "Clinical Coordinator": 70,

    // Weakly adjacent
    "Pharmacist": 40,
    "Physical Therapist": 35,
    "Medical Technician": 45,

    // Distant
    "Doctor": 30,
    "Social Worker": 25,
    "Health Insurance Specialist": 20,

    // Unrelated
    "Software Developer": 5,
    "Accountant": 5,
    "Chef": 5,
  },

  "Doctor": {
    // Highly adjacent
    "Physician": 100,
    "Medical Doctor": 100,
    "Specialist": 90,
    "Surgeon": 85,
    "General Practitioner": 95,

    // Moderately adjacent
    "Medical Researcher": 70,
    "Clinical Director": 75,
    "Healthcare Administrator": 55,
    "Medical Consultant": 80,

    // Weakly adjacent
    "Pharmacist": 45,
    "Nurse Practitioner": 40,
    "Medical Professor": 50,

    // Distant
    "Nurse": 30,
    "Therapist": 25,
    "Healthcare IT Specialist": 15,

    // Unrelated
    "Software Developer": 10,
    "Teacher": 15,
    "Accountant": 5,
  },

  // Sales & Business Development
  "Sales Manager": {
    // Highly adjacent
    "Sales Director": 95,
    "Business Development Manager": 90,
    "Account Manager": 85,
    "Regional Sales Manager": 95,
    "Sales Team Lead": 90,

    // Moderately adjacent
    "Account Executive": 80,
    "Customer Success Manager": 70,
    "Territory Manager": 75,
    "Inside Sales Manager": 80,
    "Sales Operations Manager": 70,

    // Weakly adjacent
    "Marketing Manager": 50,
    "Product Manager": 45,
    "Retail Manager": 40,
    "Business Analyst": 35,

    // Distant
    "Customer Service Manager": 30,
    "HR Manager": 20,
    "Operations Manager": 25,

    // Unrelated
    "Software Developer": 10,
    "Chef": 5,
    "Accountant": 10,
  },

  // Design & Creative
  "Graphic Designer": {
    // Highly adjacent
    "Visual Designer": 95,
    "Brand Designer": 90,
    "Creative Designer": 90,
    "Digital Designer": 85,
    "Art Director": 80,

    // Moderately adjacent
    "UI Designer": 75,
    "UX Designer": 70,
    "Web Designer": 75,
    "Illustrator": 70,
    "Motion Graphics Designer": 65,

    // Weakly adjacent
    "Marketing Coordinator": 40,
    "Content Creator": 45,
    "Photographer": 50,
    "Video Editor": 45,

    // Distant
    "Frontend Developer": 30,
    "Product Designer": 35,
    "Marketing Manager": 25,

    // Unrelated
    "Software Developer": 15,
    "Accountant": 5,
    "Chef": 5,
  },

  "UX Designer": {
    // Highly adjacent
    "UI/UX Designer": 100,
    "Product Designer": 95,
    "User Experience Researcher": 90,
    "Interaction Designer": 90,
    "UI Designer": 85,

    // Moderately adjacent
    "UX Researcher": 80,
    "Product Manager": 70,
    "Frontend Developer": 65,
    "Graphic Designer": 60,
    "Web Designer": 70,

    // Weakly adjacent
    "Business Analyst": 45,
    "Marketing Manager": 40,
    "Software Developer": 50,

    // Distant
    "Data Analyst": 30,
    "Project Manager": 35,
    "Content Strategist": 30,

    // Unrelated
    "Accountant": 5,
    "Chef": 5,
    "Nurse": 5,
  },

  // HR & Recruitment
  "HR Manager": {
    // Highly adjacent
    "Human Resources Manager": 100,
    "People Operations Manager": 95,
    "HR Director": 95,
    "Talent Manager": 85,
    "Employee Relations Manager": 90,

    // Moderately adjacent
    "Recruiter": 75,
    "HR Business Partner": 80,
    "Compensation & Benefits Manager": 70,
    "Training & Development Manager": 65,
    "Organizational Development Specialist": 70,

    // Weakly adjacent
    "Office Manager": 50,
    "Operations Manager": 45,
    "Project Manager": 40,
    "Learning & Development Specialist": 55,

    // Distant
    "Business Analyst": 30,
    "Marketing Manager": 25,
    "Sales Manager": 20,

    // Unrelated
    "Software Developer": 10,
    "Chef": 5,
    "Accountant": 10,
  },

  "Recruiter": {
    // Highly adjacent
    "Technical Recruiter": 95,
    "Talent Acquisition Specialist": 95,
    "Recruitment Consultant": 90,
    "Headhunter": 85,
    "Sourcing Specialist": 80,

    // Moderately adjacent
    "HR Manager": 70,
    "HR Coordinator": 65,
    "Talent Manager": 75,
    "Account Manager": 55,
    "Business Development Representative": 50,

    // Weakly adjacent
    "Sales Representative": 45,
    "Customer Success Manager": 40,
    "Office Manager": 35,

    // Distant
    "Marketing Coordinator": 25,
    "Project Coordinator": 30,
    "Operations Coordinator": 25,

    // Unrelated
    "Software Developer": 15,
    "Accountant": 10,
    "Chef": 5,
  },

  // Customer Service & Support
  "Customer Service Manager": {
    // Highly adjacent
    "Customer Support Manager": 100,
    "Customer Experience Manager": 95,
    "Client Services Manager": 90,
    "Contact Center Manager": 90,
    "Service Desk Manager": 85,

    // Moderately adjacent
    "Customer Success Manager": 80,
    "Operations Manager": 65,
    "Account Manager": 70,
    "Team Lead": 75,
    "Quality Assurance Manager": 60,

    // Weakly adjacent
    "Sales Manager": 50,
    "Office Manager": 45,
    "HR Manager": 35,
    "Retail Manager": 50,

    // Distant
    "Project Manager": 30,
    "Marketing Manager": 25,
    "Business Analyst": 30,

    // Unrelated
    "Software Developer": 15,
    "Accountant": 10,
    "Chef": 10,
  },

  // Operations & Logistics
  "Operations Manager": {
    // Highly adjacent
    "Operations Director": 95,
    "General Manager": 85,
    "Process Manager": 90,
    "Logistics Manager": 80,
    "Supply Chain Manager": 75,

    // Moderately adjacent
    "Project Manager": 70,
    "Plant Manager": 75,
    "Production Manager": 70,
    "Warehouse Manager": 65,
    "Business Analyst": 60,

    // Weakly adjacent
    "Account Manager": 50,
    "Sales Manager": 45,
    "Customer Service Manager": 50,
    "Quality Manager": 55,

    // Distant
    "HR Manager": 35,
    "Marketing Manager": 30,
    "Financial Analyst": 35,

    // Unrelated
    "Software Developer": 20,
    "Graphic Designer": 10,
    "Chef": 10,
  },

  // Construction & Engineering
  "Civil Engineer": {
    // Highly adjacent
    "Structural Engineer": 90,
    "Construction Engineer": 85,
    "Project Engineer": 80,
    "Site Engineer": 85,
    "Design Engineer": 75,

    // Moderately adjacent
    "Project Manager": 65,
    "Construction Manager": 70,
    "Architect": 60,
    "Surveyor": 55,
    "Engineering Manager": 75,

    // Weakly adjacent
    "Mechanical Engineer": 45,
    "Electrical Engineer": 40,
    "Urban Planner": 50,

    // Distant
    "Operations Manager": 30,
    "Business Analyst": 25,
    "Technical Writer": 20,

    // Unrelated
    "Software Developer": 15,
    "Marketing Manager": 10,
    "Chef": 5,
  },

  // Legal
  "Lawyer": {
    // Highly adjacent
    "Attorney": 100,
    "Legal Counsel": 95,
    "Corporate Lawyer": 90,
    "Legal Advisor": 95,
    "Partner": 85,

    // Moderately adjacent
    "Paralegal": 70,
    "Legal Consultant": 80,
    "Compliance Officer": 65,
    "Contract Manager": 70,
    "Legal Analyst": 75,

    // Weakly adjacent
    "Risk Manager": 50,
    "Business Analyst": 40,
    "Policy Analyst": 45,

    // Distant
    "HR Manager": 30,
    "Project Manager": 25,
    "Accountant": 30,

    // Unrelated
    "Software Developer": 10,
    "Graphic Designer": 5,
    "Chef": 5,
  },

  // Real Estate
  "Real Estate Agent": {
    // Highly adjacent
    "Real Estate Broker": 95,
    "Property Agent": 95,
    "Real Estate Consultant": 90,
    "Leasing Agent": 85,
    "Real Estate Advisor": 90,

    // Moderately adjacent
    "Property Manager": 75,
    "Sales Agent": 70,
    "Account Manager": 65,
    "Business Development Manager": 60,
    "Mortgage Broker": 55,

    // Weakly adjacent
    "Sales Manager": 50,
    "Customer Success Manager": 45,
    "Marketing Coordinator": 40,

    // Distant
    "Project Manager": 30,
    "Operations Manager": 25,
    "HR Manager": 20,

    // Unrelated
    "Software Developer": 10,
    "Accountant": 15,
    "Chef": 5,
  },

  // Retail & Store Management
  "Retail Manager": {
    // Highly adjacent
    "Store Manager": 100,
    "Assistant Store Manager": 90,
    "Retail Operations Manager": 95,
    "District Manager": 85,
    "Shop Manager": 95,

    // Moderately adjacent
    "Sales Manager": 75,
    "Customer Service Manager": 70,
    "Operations Manager": 65,
    "Merchandise Manager": 70,
    "Inventory Manager": 60,

    // Weakly adjacent
    "Account Manager": 50,
    "Business Development Manager": 45,
    "Marketing Manager": 40,

    // Distant
    "Project Manager": 35,
    "HR Manager": 30,
    "Restaurant Manager": 35,

    // Unrelated
    "Software Developer": 10,
    "Accountant": 15,
    "Graphic Designer": 10,
  },

  // Quality Assurance (Software)
  "QA Engineer": {
    // Highly adjacent
    "Quality Assurance Engineer": 100,
    "Test Engineer": 95,
    "QA Analyst": 90,
    "Automation Engineer": 85,
    "Software Tester": 90,

    // Moderately adjacent
    "Software Developer": 70,
    "DevOps Engineer": 65,
    "Business Analyst": 60,
    "Technical Support Engineer": 55,
    "Product Manager": 50,

    // Weakly adjacent
    "Data Analyst": 45,
    "Project Manager": 45,
    "Systems Analyst": 50,

    // Distant
    "IT Support": 35,
    "Database Administrator": 30,
    "Network Engineer": 30,

    // Unrelated
    "Marketing Manager": 10,
    "HR Manager": 10,
    "Chef": 5,
  },

  // Data Science & ML
  "Data Scientist": {
    // Highly adjacent
    "Machine Learning Engineer": 90,
    "Data Engineer": 85,
    "Research Scientist": 80,
    "AI Engineer": 85,
    "Quantitative Analyst": 75,

    // Moderately adjacent
    "Data Analyst": 80,
    "Business Intelligence Analyst": 75,
    "Software Developer": 70,
    "Statistician": 75,
    "Analytics Manager": 70,

    // Weakly adjacent
    "Product Manager": 50,
    "Business Analyst": 55,
    "Research Analyst": 60,

    // Distant
    "Financial Analyst": 40,
    "Project Manager": 35,
    "Operations Analyst": 40,

    // Unrelated
    "Marketing Manager": 20,
    "HR Manager": 15,
    "Chef": 5,
  },

  // Product Management
  "Product Manager": {
    // Highly adjacent
    "Senior Product Manager": 100,
    "Product Owner": 90,
    "Technical Product Manager": 85,
    "Product Lead": 95,
    "Associate Product Manager": 90,

    // Moderately adjacent
    "Project Manager": 80,
    "Business Analyst": 75,
    "Product Designer": 70,
    "Program Manager": 80,
    "Product Marketing Manager": 75,

    // Weakly adjacent
    "Software Developer": 55,
    "UX Designer": 60,
    "Marketing Manager": 50,
    "Operations Manager": 50,

    // Distant
    "Data Analyst": 45,
    "Sales Manager": 40,
    "Customer Success Manager": 45,

    // Unrelated
    "Graphic Designer": 25,
    "Accountant": 20,
    "Chef": 5,
  },

  // Social Work & Counseling
  "Social Worker": {
    // Highly adjacent
    "Case Manager": 90,
    "Clinical Social Worker": 95,
    "Counselor": 80,
    "Therapist": 75,
    "Family Support Worker": 85,

    // Moderately adjacent
    "Community Outreach Coordinator": 70,
    "Mental Health Specialist": 75,
    "Program Coordinator": 65,
    "Nonprofit Program Manager": 60,
    "Healthcare Advocate": 65,

    // Weakly adjacent
    "HR Coordinator": 40,
    "Teacher": 35,
    "Nurse": 40,

    // Distant
    "Project Manager": 30,
    "Office Manager": 25,
    "Customer Service Representative": 25,

    // Unrelated
    "Software Developer": 10,
    "Accountant": 10,
    "Chef": 5,
  },
};

/**
 * Get adjacency score between two job titles
 * Returns 0-100 score indicating how related the roles are
 */
function getIndustryAdjacencyScore(candidateTitle, targetTitle) {
  if (!candidateTitle || !targetTitle) return 0;

  const candidateLower = candidateTitle.toLowerCase().trim();
  const targetLower = targetTitle.toLowerCase().trim();

  // Exact match = 100
  if (candidateLower === targetLower) return 100;

  // Strip common seniority prefixes for better matching
  const seniorityPrefixes = [
    "senior", "sr", "lead", "principal", "staff", "junior", "jr",
    "associate", "entry level", "mid-level", "chief", "head of", "vp", "vice president",
  ];

  let candidateCore = candidateLower;
  let targetCore = targetLower;

  for (const prefix of seniorityPrefixes) {
    candidateCore = candidateCore.replace(new RegExp(`^${prefix}\\s+`, "i"), "").trim();
    targetCore = targetCore.replace(new RegExp(`^${prefix}\\s+`, "i"), "").trim();
  }

  // If cores match exactly after stripping seniority, high score (different seniority levels)
  if (candidateCore === targetCore && candidateCore !== candidateLower) {
    return 95; // Same role, different seniority level
  }

  // Check if target title has adjacency data
  for (const [baseTitle, adjacencies] of Object.entries(INDUSTRY_ADJACENCY)) {
    const baseLower = baseTitle.toLowerCase();

    // If target matches this base title
    if (targetLower.includes(baseLower) || baseLower.includes(targetLower)) {
      // Look for candidate title in adjacencies
      for (const [adjTitle, score] of Object.entries(adjacencies)) {
        const adjLower = adjTitle.toLowerCase();
        if (candidateLower.includes(adjLower) || adjLower.includes(candidateLower)) {
          return score;
        }
      }
    }

    // Also check with core titles (stripped of seniority)
    if (targetCore.includes(baseLower) || baseLower.includes(targetCore)) {
      for (const [adjTitle, score] of Object.entries(adjacencies)) {
        const adjLower = adjTitle.toLowerCase();
        if (candidateCore.includes(adjLower) || adjLower.includes(candidateCore)) {
          // Slightly lower score if we had to strip seniority to match
          return Math.max(score - 5, 85);
        }
      }
    }
  }

  // No adjacency data found - try reverse lookup
  for (const [baseTitle, adjacencies] of Object.entries(INDUSTRY_ADJACENCY)) {
    const baseLower = baseTitle.toLowerCase();

    // If candidate matches this base title
    if (candidateLower.includes(baseLower) || baseLower.includes(candidateLower)) {
      // Look for target title in adjacencies
      for (const [adjTitle, score] of Object.entries(adjacencies)) {
        const adjLower = adjTitle.toLowerCase();
        if (targetLower.includes(adjLower) || adjLower.includes(targetLower)) {
          return score;
        }
      }
    }

    // Also check with core titles (stripped of seniority)
    if (candidateCore.includes(baseLower) || baseLower.includes(candidateCore)) {
      for (const [adjTitle, score] of Object.entries(adjacencies)) {
        const adjLower = adjTitle.toLowerCase();
        if (targetCore.includes(adjLower) || adjLower.includes(targetCore)) {
          // Slightly lower score if we had to strip seniority to match
          return Math.max(score - 5, 85);
        }
      }
    }
  }

  // No match found - return low score for unrelated roles
  return 10;
}

// Skill categories for context-aware matching
const SKILL_CATEGORIES = {
  programming: [
    "JavaScript", "Python", "Java", "C#", "Go", "Rust", "PHP", "Ruby",
    "TypeScript", "Swift", "Kotlin", "C++",
  ],
  frontend: [
    "React", "Vue", "Angular", "HTML", "CSS", "JavaScript", "TypeScript",
    "Next.js", "Svelte", "UI/UX",
  ],
  backend: [
    "Node.js", "Django", "Flask", "Express", "Spring", "Laravel",
    "Ruby on Rails", ".NET", "API Development",
  ],
  database: [
    "SQL Server", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle",
    "Cassandra", "DynamoDB",
  ],
  cloud: [
    "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform",
    "Cloud Architecture",
  ],
  data: [
    "Python", "R", "SQL", "Pandas", "NumPy", "Tableau", "Power BI",
    "Machine Learning", "Data Analysis",
  ],
  design: [
    "Figma", "Adobe Photoshop", "Adobe Illustrator", "Sketch", "UI/UX",
    "Prototyping", "Design Systems",
  ],
  management: [
    "Project Management", "Agile", "Scrum", "Leadership", "Team Management",
    "Stakeholder Management",
  ],
};

/**
 * Helper: Parse skills from string or array
 */
function parseSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    // Split by comma and trim each skill
    return skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [];
}

/**
 * Calculate advanced match score with detailed analysis
 */
function calculateAdvancedMatch(cvData, jobSpec) {
  const breakdown = {};
  const strengths = [];
  const gaps = [];
  const insights = [];

  // Parse skills from string or array format
  const requiredSkillsArray = parseSkills(jobSpec.requiredSkills);
  const preferredSkillsArray = parseSkills(jobSpec.preferredSkills);
  const cvSkillsArray = cvData.metadata?.skills || [];

  // DEBUG: Log job spec and CV data
  console.log("=== MATCHING DEBUG ===");
  console.log("Job Spec:", {
    title: jobSpec.title,
    department: jobSpec.department,
    industry: jobSpec.industry,
    requiredSkills: requiredSkillsArray,
    preferredSkills: preferredSkillsArray,
    education: jobSpec.education,
  });
  console.log("CV Data:", {
    name: cvData.metadata?.name,
    experience: cvData.metadata?.experience?.map((e) => ({title: e.title, company: e.company})),
    skills: cvSkillsArray,
    education: cvData.metadata?.education,
  });

  // 0. Job Title/Role Relevance Check (25%) - NEW! Critical filter
  const titleScore = calculateJobTitleMatch(
      cvData.metadata?.experience || [],
      jobSpec.title || "",
      jobSpec.department || jobSpec.industry || "",
  );
  breakdown.title = titleScore;
  console.log("Title Score:", titleScore);

  if (titleScore.score > 70) {
    strengths.push(`Relevant role experience: ${titleScore.reason}`);
  } else if (titleScore.score < 30) {
    gaps.push(`No relevant experience for "${jobSpec.title}" role`);
  }

  // 1. Advanced Skills Match (25%) - Context-aware with recency weighting
  const skillsScore = calculateAdvancedSkillsMatch(
      cvSkillsArray,
      cvData.metadata?.experience || [],
      requiredSkillsArray,
      preferredSkillsArray,
  );
  breakdown.skills = skillsScore;
  console.log("Skills Score:", skillsScore);

  if (skillsScore.score > 80) {
    strengths.push(`Excellent skills match: ${skillsScore.topMatches.slice(0, 3).join(", ")}`);
  } else if (skillsScore.score > 60) {
    strengths.push(`Good skills match with ${skillsScore.matchedRequired} required skills`);
  } else if (skillsScore.missingRequired.length > 0) {
    gaps.push(`Missing ${skillsScore.missingRequired.length} required skills: ${skillsScore.missingRequired.slice(0, 3).join(", ")}`);
  }

  // Add skill-specific insights
  if (skillsScore.hasRecentExperience) {
    insights.push("Recent hands-on experience with key technologies");
  }
  if (skillsScore.relatedSkills.length > 0) {
    insights.push(`Has ${skillsScore.relatedSkills.length} related skills that could transfer well`);
  }

  // 2. Career Progression Analysis (15%)
  const careerScore = analyzeCareerProgression(
      cvData.metadata?.experience || [],
      jobSpec,
  );
  breakdown.career = careerScore;

  if (careerScore.score > 80) {
    strengths.push(careerScore.reason);
  } else if (careerScore.score < 50) {
    gaps.push(careerScore.reason);
  }

  if (careerScore.isPromotion) {
    insights.push("This role represents a natural career progression");
  }
  if (careerScore.overqualified) {
    insights.push("Candidate may be overqualified - assess retention risk");
  }

  // 3. Experience Match (15%) - Enhanced with recency
  const experienceScore = calculateEnhancedExperienceMatch(
      cvData.metadata?.experience || [],
      jobSpec,
  );
  breakdown.experience = experienceScore;

  if (experienceScore.score === 100) {
    strengths.push(`Perfect experience match: ${experienceScore.totalYears} years`);
  } else if (experienceScore.score < 50) {
    gaps.push(experienceScore.reason);
  }

  // 4. Industry/Department Alignment (10%)
  const industryScore = calculateIndustryAlignment(
      cvData.metadata?.experience || [],
      jobSpec.industry || jobSpec.department || "",
  );
  breakdown.industry = industryScore;

  if (industryScore.score > 70) {
    strengths.push(`Strong industry alignment: ${industryScore.matchedIndustries.join(", ")}`);
  } else if (industryScore.score < 40) {
    gaps.push("Limited experience in target industry");
  }

  // 5. Location Match (5%)
  const locationScore = calculateLocationMatch(
      cvData.metadata?.location || "",
      jobSpec.location || "",
      jobSpec.locationType || "onsite",
  );
  breakdown.location = locationScore;

  // 6. Education Match (5%)
  const educationScore = calculateEducationMatch(
      cvData.metadata?.education || "",
      jobSpec.education || "",
  );
  breakdown.education = educationScore;

  // Calculate overall score with weighted average
  const overallScore = Math.round(
      titleScore.score * 0.25 +
    skillsScore.score * 0.25 +
    careerScore.score * 0.15 +
    experienceScore.score * 0.15 +
    industryScore.score * 0.10 +
    educationScore.score * 0.05 +
    locationScore.score * 0.05,
  );

  // Calculate CV completeness penalty
  let completenessMultiplier = 1.0;
  const missingFields = [];

  if (!cvData.metadata?.skills || cvData.metadata.skills.length === 0) {
    missingFields.push("skills");
    completenessMultiplier *= 0.85; // 15% penalty
  }
  if (!cvData.metadata?.experience || cvData.metadata.experience.length === 0) {
    missingFields.push("experience");
    completenessMultiplier *= 0.80; // 20% penalty
  }
  if (!cvData.metadata?.education || cvData.metadata.education === "") {
    missingFields.push("education");
    completenessMultiplier *= 0.90; // 10% penalty
  }
  if (!cvData.metadata?.location || cvData.metadata.location.trim() === "") {
    missingFields.push("location");
    completenessMultiplier *= 0.92; // 8% penalty
  }

  // Apply completeness penalty
  let finalScore = Math.round(overallScore * completenessMultiplier);

  // Add gap about missing fields
  if (missingFields.length > 0) {
    gaps.push(`Incomplete CV: missing ${missingFields.join(", ")}`);
    insights.push(`CV completeness: ${Math.round(completenessMultiplier * 100)}%`);
  }

  // CRITICAL: Relevance threshold - if title match is very poor, cap overall score
  if (titleScore.score < 20 && finalScore > 40) {
    finalScore = Math.min(40, finalScore);
    insights.push("Score capped due to irrelevant work experience");
  }

  // ADDITIONAL: If both title AND skills are poor matches, cap score more aggressively
  if (titleScore.score < 30 && skillsScore.score < 30 && finalScore > 35) {
    finalScore = Math.min(35, finalScore);
    insights.push("Score capped - candidate lacks both relevant experience and skills");
  }

  // ADDITIONAL: If industry is completely unmatched along with poor title, cap score
  if (titleScore.score < 25 && industryScore.score < 35 && finalScore > 40) {
    finalScore = Math.min(40, finalScore);
    insights.push("Score capped - no relevant industry experience");
  }

  // Generate match quality assessment
  let matchQuality = "Poor";
  if (finalScore >= 85) matchQuality = "Excellent";
  else if (finalScore >= 70) matchQuality = "Very Good";
  else if (finalScore >= 60) matchQuality = "Good";
  else if (finalScore >= 45) matchQuality = "Fair";

  console.log("Final Score:", finalScore, "| Before caps:", overallScore, "| Completeness:", completenessMultiplier);
  console.log("=== END MATCHING DEBUG ===\n");

  return {
    overallScore: finalScore,
    matchQuality,
    breakdown,
    strengths: strengths.slice(0, 5),
    gaps: gaps.slice(0, 5),
    insights: insights.slice(0, 5),
    recommendation: generateRecommendation(finalScore, skillsScore, careerScore),
  };
}

/**
 * Calculate job title/role relevance match - CRITICAL for filtering irrelevant CVs
 */
function calculateJobTitleMatch(cvExperience, jobTitle, jobDepartment) {
  if (!jobTitle || !Array.isArray(cvExperience) || cvExperience.length === 0) {
    return {
      score: 50,
      reason: "Insufficient information to assess role relevance",
      matchedRoles: [],
      adjacencyScores: {},
    };
  }

  const jobTitleLower = jobTitle.toLowerCase();
  const jobDeptLower = jobDepartment.toLowerCase();
  const matchedRoles = [];
  const adjacencyScores = {}; // NEW: Track adjacency for each role
  let directMatches = 0;
  let relatedMatches = 0;
  let departmentMatches = 0;
  let maxAdjacencyScore = 0; // NEW: Track highest adjacency

  // Define role keywords and their related terms
  const roleKeywords = extractRoleKeywords(jobTitleLower);

  for (const exp of cvExperience) {
    const expTitle = (exp.title || "").toLowerCase();
    const expDescription = (exp.description || "").toLowerCase();
    const combined = `${expTitle} ${expDescription}`;

    // NEW: Calculate industry adjacency score for this role
    const adjacency = getIndustryAdjacencyScore(exp.title, jobTitle);
    if (adjacency > 0) {
      adjacencyScores[exp.title || "Unknown"] = adjacency;
      maxAdjacencyScore = Math.max(maxAdjacencyScore, adjacency);
    }

    // Direct title match (100 adjacency or exact match)
    if (adjacency === 100 || expTitle.includes(jobTitleLower) || jobTitleLower.includes(expTitle)) {
      directMatches++;
      matchedRoles.push(exp.title);
      continue;
    }

    // Highly adjacent roles (80-99) count as strong matches
    if (adjacency >= 80) {
      directMatches++;
      matchedRoles.push(exp.title);
      continue;
    }

    // Moderately adjacent roles (50-79) count as related matches
    if (adjacency >= 50) {
      relatedMatches++;
      matchedRoles.push(exp.title);
      continue;
    }

    // Check for role keywords (for roles not in adjacency matrix)
    let keywordMatches = 0;
    for (const keyword of roleKeywords) {
      if (combined.includes(keyword)) {
        keywordMatches++;
      }
    }

    if (keywordMatches >= Math.ceil(roleKeywords.length * 0.6)) {
      relatedMatches++;
      matchedRoles.push(exp.title);
    }

    // Department/industry alignment - STRICTER: Must be in job title or description, not just company
    if (jobDeptLower && combined.includes(jobDeptLower)) {
      departmentMatches++;
    }
  }

  // Calculate score based on matches - ENHANCED with adjacency
  let score = 0;
  let reason = "";

  if (directMatches > 0) {
    // Direct match or highly adjacent
    score = Math.min(100, 80 + (directMatches * 10));
    if (maxAdjacencyScore === 100) {
      reason = `Exact role match: ${directMatches} similar position(s)`;
    } else if (maxAdjacencyScore >= 80) {
      reason = `Highly relevant experience: ${matchedRoles[0]}`;
    } else {
      reason = `Direct match: ${directMatches} similar role(s)`;
    }
  } else if (relatedMatches > 0) {
    // Moderately adjacent or keyword matches
    score = Math.min(70, 45 + (relatedMatches * 15));
    if (maxAdjacencyScore >= 50) {
      reason = `Related experience (${maxAdjacencyScore}% similarity): ${matchedRoles[0]}`;
    } else {
      reason = `Related experience in ${relatedMatches} role(s)`;
    }
  } else if (maxAdjacencyScore >= 30) {
    // Weakly adjacent - some transferable skills
    score = Math.max(25, maxAdjacencyScore * 0.5); // 30-49 adjacency → 15-25 score
    const adjacentRole = Object.keys(adjacencyScores).find(
        (role) => adjacencyScores[role] === maxAdjacencyScore,
    ) || "previous role";
    reason = `Some transferable skills from ${adjacentRole}`;
  } else if (departmentMatches > 0) {
    // STRICTER: Department match alone is weak signal, lower score
    score = Math.min(40, 20 + (departmentMatches * 10));
    reason = `Some experience in ${jobDepartment} field`;
  } else {
    // Very low or no adjacency - unrelated role
    score = Math.max(5, maxAdjacencyScore * 0.5); // 10-29 adjacency → 5-15 score
    if (maxAdjacencyScore > 0) {
      reason = `Distant field (${maxAdjacencyScore}% similarity) - limited transferability`;
    } else {
      reason = `No relevant experience for ${jobTitle} position`;
    }
  }

  return {
    score: Math.round(score),
    reason,
    matchedRoles: [...new Set(matchedRoles)].slice(0, 3),
    directMatches,
    relatedMatches,
    adjacencyScores, // NEW: Include detailed adjacency data
    maxAdjacencyScore, // NEW: Highest adjacency found
  };
}

/**
 * Extract meaningful keywords from job title for matching
 */
function extractRoleKeywords(jobTitle) {
  const keywords = [];

  // Remove common noise words
  const noiseWords = ["the", "a", "an", "and", "or", "of", "to", "in", "for", "with"];
  const words = jobTitle.split(/\s+/).filter((w) => !noiseWords.includes(w));

  // Add the main words
  keywords.push(...words);

  // Add role-specific synonyms and related terms
  const roleSynonyms = {
    "developer": ["engineer", "programmer", "coder", "development"],
    "engineer": ["developer", "engineering"],
    "manager": ["management", "lead", "supervisor", "director"],
    "designer": ["design", "creative", "ux", "ui"],
    "analyst": ["analysis", "analytics", "data"],
    "accountant": ["accounting", "finance", "bookkeeping", "tax"],
    "dancer": ["dance", "performer", "choreographer", "dancing", "performance"],
    "teacher": ["teaching", "instructor", "educator", "tutor"],
    "nurse": ["nursing", "healthcare", "medical"],
    "chef": ["cook", "culinary", "kitchen", "food"],
    "sales": ["salesperson", "account executive", "business development"],
    "marketing": ["marketer", "brand", "campaign"],
  };

  for (const word of words) {
    if (roleSynonyms[word]) {
      keywords.push(...roleSynonyms[word]);
    }
  }

  return [...new Set(keywords)];
}

/**
 * Calculate years of experience for a specific skill based on job history
 */
function calculateSkillProficiency(skill, cvExperience) {
  if (!Array.isArray(cvExperience) || cvExperience.length === 0) {
    return {years: 0, proficiency: "beginner"};
  }

  const skillLower = skill.toLowerCase();
  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  // Check each job for mentions of this skill
  for (const job of cvExperience) {
    const title = (job.title || "").toLowerCase();
    const description = (job.description || "").toLowerCase();
    const company = (job.company || "").toLowerCase();

    // Check if skill is mentioned in title, description, or company
    if (title.includes(skillLower) || description.includes(skillLower) || company.includes(skillLower)) {
      // Extract duration for this job
      const duration = job.duration || `${job.startDate || ""} - ${job.endDate || ""}`;
      const yearMatches = duration.match(/\b(19|20)\d{2}\b/g);

      if (yearMatches && yearMatches.length > 0) {
        const startYear = parseInt(yearMatches[0]);
        const isOngoing = duration.toLowerCase().includes("present") ||
                         duration.toLowerCase().includes("current");
        const endYear = isOngoing ? currentYear :
                       (yearMatches.length >= 2 ? parseInt(yearMatches[yearMatches.length - 1]) : startYear);

        totalYears += Math.max(0, endYear - startYear);
      }
    }
  }

  // Determine proficiency level
  let proficiency = "beginner";
  if (totalYears >= 5) {
    proficiency = "expert";
  } else if (totalYears >= 2) {
    proficiency = "intermediate";
  } else if (totalYears >= 0.5) {
    proficiency = "beginner";
  }

  return {years: totalYears, proficiency};
}

/**
 * Advanced skills matching with context and recency weighting
 * NOW WITH PROFICIENCY SCORING
 */
function calculateAdvancedSkillsMatch(cvSkills, cvExperience, requiredSkills, preferredSkills) {
  const normalizedCVSkills = normalizeSkills(cvSkills);
  const normalizedRequired = normalizeSkills(requiredSkills);
  const normalizedPreferred = normalizeSkills(preferredSkills);

  // Extract skills from recent experience (last 3 years)
  const recentSkills = extractRecentSkills(cvExperience);

  const matchedRequired = [];
  const missingRequired = [];
  const topMatches = [];
  const relatedSkills = [];
  const skillProficiencies = {}; // NEW: Track proficiency per skill

  // Match required skills with context awareness AND proficiency
  for (const reqSkill of normalizedRequired) {
    let found = false;

    for (const cvSkill of normalizedCVSkills) {
      if (skillsMatch(cvSkill, reqSkill, 85)) {
        // NEW: Calculate proficiency for this skill
        const proficiency = calculateSkillProficiency(reqSkill, cvExperience);
        skillProficiencies[reqSkill] = proficiency;

        matchedRequired.push(reqSkill);
        topMatches.push(cvSkill);
        found = true;
        break;
      }
    }

    if (!found) {
      missingRequired.push(reqSkill);
      // Check for related skills
      const related = findRelatedSkills(reqSkill, normalizedCVSkills);
      if (related.length > 0) {
        relatedSkills.push(...related);
      }
    }
  }

  // Match preferred skills with proficiency tracking
  const matchedPreferred = [];
  for (const prefSkill of normalizedPreferred) {
    for (const cvSkill of normalizedCVSkills) {
      if (skillsMatch(cvSkill, prefSkill, 85)) {
        // NEW: Calculate proficiency for preferred skills too
        const proficiency = calculateSkillProficiency(prefSkill, cvExperience);
        skillProficiencies[prefSkill] = proficiency;

        matchedPreferred.push(prefSkill);
        break;
      }
    }
  }

  // Calculate base score - STRICT: Penalize empty CV skills heavily
  let score = 0;

  // If CV has no skills at all, give very low score
  if (normalizedCVSkills.length === 0) {
    return {
      score: 10,
      matchedRequired: 0,
      totalRequired: normalizedRequired.length,
      matchedPreferred: 0,
      totalPreferred: normalizedPreferred.length,
      topMatches: [],
      missingRequired: normalizedRequired.slice(0, 5),
      relatedSkills: [],
      hasRecentExperience: false,
    };
  }

  if (normalizedRequired.length > 0) {
    // NEW: Calculate weighted score based on proficiency
    // Each matched skill contributes based on proficiency level
    let weightedScore = 0;

    for (const skill of matchedRequired) {
      const prof = skillProficiencies[skill];
      if (prof) {
        // Proficiency multiplier:
        // - Beginner (0-2 years): 0.7x
        // - Intermediate (2-5 years): 0.9x
        // - Expert (5+ years): 1.0x
        let multiplier = 0.7; // beginner default
        if (prof.proficiency === "expert") {
          multiplier = 1.0;
        } else if (prof.proficiency === "intermediate") {
          multiplier = 0.9;
        }

        weightedScore += multiplier;
      } else {
        // No proficiency data, assume beginner
        weightedScore += 0.7;
      }
    }

    // Convert to percentage: weighted / total possible * 80
    score = (weightedScore / normalizedRequired.length) * 80;
  } else {
    // No required skills specified - give moderate score only if CV has good skills
    score = normalizedCVSkills.length >= 3 ? 50 : 30;
  }

  // Add preferred skills bonus (20% of total) - also weighted by proficiency
  if (normalizedPreferred.length > 0) {
    let weightedPreferred = 0;

    for (const skill of matchedPreferred) {
      const prof = skillProficiencies[skill];
      if (prof) {
        let multiplier = 0.7;
        if (prof.proficiency === "expert") {
          multiplier = 1.0;
        } else if (prof.proficiency === "intermediate") {
          multiplier = 0.9;
        }
        weightedPreferred += multiplier;
      } else {
        weightedPreferred += 0.7;
      }
    }

    score += (weightedPreferred / normalizedPreferred.length) * 20;
  } else {
    // No preferred skills specified - small bonus if CV has many skills
    score += normalizedCVSkills.length >= 5 ? 10 : 5;
  }

  // Cap at 100
  score = Math.min(100, score);

  return {
    score: Math.round(score),
    matchedRequired: matchedRequired.length,
    totalRequired: normalizedRequired.length,
    matchedPreferred: matchedPreferred.length,
    totalPreferred: normalizedPreferred.length,
    topMatches: topMatches.slice(0, 5),
    missingRequired: missingRequired.slice(0, 5),
    relatedSkills: [...new Set(relatedSkills)].slice(0, 3),
    hasRecentExperience: recentSkills.length > 0,
    skillProficiencies, // NEW: Include proficiency data in response
  };
}

/**
 * Analyze career progression and trajectory
 */
function analyzeCareerProgression(experience, jobSpec) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return {
      score: 50,
      reason: "No work experience provided",
      isPromotion: false,
      overqualified: false,
    };
  }

  // Define seniority levels
  const seniorityLevels = {
    "junior": 1,
    "associate": 2,
    "mid-level": 3,
    "senior": 4,
    "lead": 5,
    "principal": 6,
    "staff": 6,
    "manager": 5,
    "director": 7,
    "vp": 8,
    "head": 7,
    "chief": 9,
    "cto": 9,
    "ceo": 10,
  };

  // Detect current level from most recent role
  const latestRole = experience[0];
  const latestTitle = (latestRole?.title || "").toLowerCase();

  let currentLevel = 3; // default to mid-level
  // Sort entries to ensure consistent iteration order
  for (const [keyword, level] of Object.entries(seniorityLevels).sort((a, b) => b[1] - a[1])) {
    if (latestTitle.includes(keyword)) {
      currentLevel = level;
      break;
    }
  }

  // Detect target level from job spec
  const targetTitle = (jobSpec.title || "").toLowerCase();
  let targetLevel = 3;
  // Sort entries to ensure consistent iteration order
  for (const [keyword, level] of Object.entries(seniorityLevels).sort((a, b) => b[1] - a[1])) {
    if (targetTitle.includes(keyword)) {
      targetLevel = level;
      break;
    }
  }

  // Analyze progression
  let score = 70; // baseline
  let reason = "Standard career fit";
  let isPromotion = false;
  let overqualified = false;

  if (currentLevel === targetLevel) {
    score = 90;
    reason = "Lateral move - matching seniority level";
  } else if (targetLevel === currentLevel + 1) {
    score = 95;
    reason = "Natural promotion opportunity";
    isPromotion = true;
  } else if (targetLevel === currentLevel + 2) {
    score = 75;
    reason = "Stretch role - significant step up";
    isPromotion = true;
  } else if (currentLevel > targetLevel + 1) {
    score = 60;
    reason = "Overqualified - may have retention concerns";
    overqualified = true;
  } else if (currentLevel < targetLevel - 2) {
    score = 40;
    reason = "Under-experienced for target seniority";
  }

  return {
    score,
    reason,
    isPromotion,
    overqualified,
    currentLevel,
    targetLevel,
  };
}

/**
 * Helper: Extract years from a date range string
 */
function extractYearsFromDateRange(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return 0;

  const str = dateStr.toLowerCase();

  // Check for "present", "current", "now"
  const isOngoing = str.includes("present") || str.includes("current") || str.includes("now");

  // Extract year numbers (4 digits)
  const yearMatches = dateStr.match(/\b(19|20)\d{2}\b/g);

  if (!yearMatches || yearMatches.length === 0) {
    // No years found, estimate 2 years
    return 2;
  }

  const years = yearMatches.map((y) => parseInt(y));
  const startYear = Math.min(...years);
  const endYear = isOngoing ? new Date().getFullYear() : Math.max(...years);

  return Math.max(0, endYear - startYear);
}

/**
 * Helper: Check if a job title is relevant to the target job spec
 */
function isRelevantExperience(jobTitle, targetTitle) {
  if (!jobTitle || !targetTitle) return false;

  const normalizeTitle = (title) => title.toLowerCase().trim();
  const job = normalizeTitle(jobTitle);
  const target = normalizeTitle(targetTitle);

  // Extract key role keywords
  const roleKeywords = [
    "developer", "engineer", "designer", "manager", "analyst", "consultant",
    "architect", "lead", "director", "coordinator", "specialist", "administrator",
    "technician", "sales", "marketing", "accountant", "clerk", "assistant",
    "chef", "waiter", "driver", "receptionist", "officer", "supervisor",
    "representative", "agent", "associate", "executive", "programmer",
  ];

  // Find the primary role in the target
  let primaryRole = "";
  for (const keyword of roleKeywords) {
    if (target.includes(keyword)) {
      primaryRole = keyword;
      break;
    }
  }

  // If we found a primary role, check if the job title contains it
  if (primaryRole && job.includes(primaryRole)) {
    return true;
  }

  // Check for direct substring match (e.g., "Software" in both)
  const targetWords = target.split(/\s+/).filter((w) => w.length > 3);
  const jobWords = job.split(/\s+/).filter((w) => w.length > 3);

  // If any significant word matches, consider it relevant
  for (const targetWord of targetWords) {
    if (jobWords.some((jobWord) => jobWord.includes(targetWord) || targetWord.includes(jobWord))) {
      return true;
    }
  }

  return false;
}

/**
 * Helper: Calculate total years of experience from experience array
 * Only counts experience relevant to the job spec title
 */
function calculateTotalYearsFromExperience(experience, targetTitle) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return 0;
  }

  // Filter to only relevant experience if targetTitle is provided
  let relevantExperience = experience;
  if (targetTitle) {
    relevantExperience = experience.filter((exp) =>
      isRelevantExperience(exp.title || exp.position || "", targetTitle),
    );
  }

  // If no relevant experience found, return 0
  if (relevantExperience.length === 0) {
    return 0;
  }

  // Calculate total years from earliest start to latest end (not summing overlapping jobs)
  let earliestYear = null;
  let latestYear = null;
  const currentYear = new Date().getFullYear();

  for (const job of relevantExperience) {
    let dateStr = "";

    // Get date string from various possible fields
    if (job.duration) {
      dateStr = job.duration;
    } else if (job.year) {
      dateStr = job.year;
    } else if (job.startDate || job.endDate) {
      dateStr = `${job.startDate || ""} - ${job.endDate || "Present"}`;
    }

    if (!dateStr) continue;

    const str = dateStr.toLowerCase();
    const isOngoing = str.includes("present") || str.includes("current") || str.includes("now");
    const yearMatches = dateStr.match(/\b(19|20)\d{2}\b/g);

    if (yearMatches && yearMatches.length > 0) {
      const years = yearMatches.map((y) => parseInt(y));
      const startYear = Math.min(...years);
      const endYear = isOngoing ? currentYear : Math.max(...years);

      // Update earliest and latest
      if (earliestYear === null || startYear < earliestYear) {
        earliestYear = startYear;
      }
      if (latestYear === null || endYear > latestYear) {
        latestYear = endYear;
      }
    }
  }

  // Return total years from earliest to latest
  if (earliestYear !== null && latestYear !== null) {
    return Math.max(0, latestYear - earliestYear);
  }

  // Fallback: estimate based on number of relevant positions
  return relevantExperience.length * 2;
}

/**
 * Enhanced experience matching with recency consideration
 */
function calculateEnhancedExperienceMatch(experience, jobSpec) {
  // Calculate total years of relevant experience
  let totalYears = 0;
  if (Array.isArray(experience)) {
    totalYears = calculateTotalYearsFromExperience(experience, jobSpec.title);
  } else {
    totalYears = parseInt(experience) || 0;
  }

  const min = parseInt(jobSpec.minExperience) || 0;
  const max = parseInt(jobSpec.maxExperience) || 999;

  let score = 0;
  let reason = "";

  if (totalYears >= min && totalYears <= max) {
    score = 100;
    reason = "Experience within desired range";
  } else if (totalYears < min) {
    const diff = min - totalYears;
    if (diff <= 1) {
      score = 85; // Close enough
      reason = "Slightly below minimum experience";
    } else {
      score = Math.max(0, 100 - diff * 15);
      reason = `${diff} year(s) below minimum`;
    }
  } else {
    // Over-experienced - IMPROVED: More nuanced penalties
    const diff = totalYears - max;
    if (diff <= 1) {
      score = 95; // Minimal over-qualification
      reason = "Slightly more experienced than required";
    } else if (diff <= 3) {
      score = 85; // Moderate over-qualification
      reason = "Moderately over-experienced";
    } else if (diff <= 5) {
      score = 70; // Significant over-qualification
      reason = "Significantly over-experienced - retention risk";
    } else {
      score = Math.max(50, 70 - (diff - 5) * 5);
      reason = "Highly over-qualified - high retention risk";
    }
  }

  return {
    score: Math.round(score),
    totalYears,
    requiredRange: `${min}-${max}`,
    reason,
    overQualified: totalYears > max + 2,
  };
}

/**
 * Infer industry from job title when industry field is not specified
 */
function inferIndustryFromTitle(title) {
  if (!title) return null;

  const titleLower = title.toLowerCase();

  // Technology & Software
  if (titleLower.match(/developer|engineer|programmer|software|devops|architect|frontend|backend|full.?stack|tech|it|data.?scientist|analyst.*data/i)) {
    return "Technology";
  }

  // Finance & Banking
  if (titleLower.match(/financial.*analyst|accountant|auditor|banker|finance|investment|trading|wealth.*management|cfa|cpa/i)) {
    return "Finance";
  }

  // Healthcare & Medical
  if (titleLower.match(/doctor|nurse|physician|surgeon|therapist|medical|healthcare|hospital|clinic|pharmacist/i)) {
    return "Healthcare";
  }

  // Hospitality & Food Service
  if (titleLower.match(/chef|cook|waiter|waitress|bartender|sommelier|restaurant|hotel|hospitality|catering/i)) {
    return "Hospitality";
  }

  // Sales & Marketing
  if (titleLower.match(/sales|marketing|business.*development|account.*executive|sdr|bdr|brand.*manager/i)) {
    return "Sales & Marketing";
  }

  // Education & Teaching
  if (titleLower.match(/teacher|professor|instructor|lecturer|tutor|educator|principal|academic/i)) {
    return "Education";
  }

  // Construction & Engineering (Civil/Mechanical)
  if (titleLower.match(/civil.*engineer|mechanical|construction|architect(?!.*software)|builder|contractor|surveyor/i)) {
    return "Construction";
  }

  // Legal
  if (titleLower.match(/lawyer|attorney|legal|counsel|paralegal|judge/i)) {
    return "Legal";
  }

  // Human Resources
  if (titleLower.match(/hr|human.*resources|recruiter|talent.*acquisition|people.*operations/i)) {
    return "Human Resources";
  }

  // Design & Creative
  if (titleLower.match(/designer(?!.*software)|ui.*ux|graphic|creative|art.*director|illustrator/i)) {
    return "Design";
  }

  // Manufacturing & Operations
  if (titleLower.match(/manufacturing|production|operations.*manager|supply.*chain|logistics|warehouse/i)) {
    return "Manufacturing";
  }

  // Customer Service & Support
  if (titleLower.match(/customer.*service|support|helpdesk|service.*desk|client.*success/i)) {
    return "Customer Service";
  }

  return null;
}

/**
 * Calculate industry alignment score
 */
function calculateIndustryAlignment(experience, targetIndustry) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return {
      score: 30,
      reason: "No work experience provided",
      matchedIndustries: [],
    };
  }

  // NEW: Infer industry from experience titles if not specified
  if (!targetIndustry && experience.length > 0) {
    // Infer from the most recent job title
    const recentTitle = experience[0]?.title || "";
    targetIndustry = inferIndustryFromTitle(recentTitle);

    if (!targetIndustry) {
      return {
        score: 60,
        reason: "Industry could not be determined",
        matchedIndustries: [],
      };
    }
  }

  if (!targetIndustry) {
    return {
      score: 60,
      reason: "No industry specified",
      matchedIndustries: [],
    };
  }

  const targetLower = targetIndustry.toLowerCase();
  const matchedIndustries = [];
  let directMatches = 0;
  let relatedMatches = 0;

  // Check each experience entry
  for (const exp of experience) {
    const company = (exp.company || "").toLowerCase();
    const description = (exp.description || "").toLowerCase();
    const title = (exp.title || "").toLowerCase();

    // STRICTER: Prioritize title and description over company name
    const titleAndDesc = `${title} ${description}`;

    // Direct match - STRICTER: check title/description first
    if (titleAndDesc.includes(targetLower)) {
      directMatches++;
      matchedIndustries.push(exp.company);
    } else if (company.includes(targetLower)) {
      // Company match only - weaker signal
      relatedMatches++;
      matchedIndustries.push(exp.company);
    } else {
      // Check for related industries - STRICTER: must be in title/description, not just company
      const relatedIndustries = INDUSTRY_RELATIONSHIPS[targetIndustry] || [];
      for (const related of relatedIndustries) {
        const relatedLower = related.toLowerCase();
        if (titleAndDesc.includes(relatedLower)) {
          relatedMatches++;
          matchedIndustries.push(exp.company);
          break;
        }
      }
    }
  }

  // Calculate score - MUCH STRICTER: No matches means very low score
  let score = 10; // baseline for no matches (reduced from 20)
  if (directMatches > 0) {
    score = Math.min(100, 70 + (directMatches * 15));
  } else if (relatedMatches > 0) {
    // STRICTER: Related matches get lower scores
    score = Math.min(60, 35 + (relatedMatches * 10));
  }

  let reason = "";
  if (directMatches > 0) {
    reason = `${directMatches} role(s) in target industry`;
  } else if (relatedMatches > 0) {
    reason = `${relatedMatches} role(s) in related industries`;
  } else {
    reason = "No experience in target or related industries";
  }

  return {
    score: Math.round(score),
    reason,
    matchedIndustries: [...new Set(matchedIndustries)].slice(0, 3),
    directMatches,
    relatedMatches,
  };
}

/**
 * Helper: Extract skills from recent experience
 */
function extractRecentSkills(experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return [];
  }

  const recentSkills = [];

  for (const exp of experience.slice(0, 2)) { // Last 2 roles
    const duration = exp.duration || "";

    // Check if role is recent (current or ongoing)
    if (duration.includes("Present") || duration.includes("Current")) {
      // Extract skills from description
      const description = (exp.description || "").toLowerCase();
      // This is a simple extraction - in production, use NLP
      // Sort keys to ensure consistent iteration order
      for (const category of Object.keys(SKILL_CATEGORIES).sort().map((k) => SKILL_CATEGORIES[k])) {
        for (const skill of category) {
          if (description.includes(skill.toLowerCase())) {
            recentSkills.push(skill);
          }
        }
      }
    }
  }

  return [...new Set(recentSkills)];
}

/**
 * Helper: Find related skills in CV
 */
function findRelatedSkills(targetSkill, cvSkills) {
  const related = [];
  const targetLower = targetSkill.toLowerCase();

  // Check which category the target skill belongs to - Sort keys for consistency
  for (const skills of Object.keys(SKILL_CATEGORIES).sort().map((k) => SKILL_CATEGORIES[k])) {
    const categorySkills = skills.map((s) => s.toLowerCase());
    if (categorySkills.includes(targetLower)) {
      // Found the category, now check if CV has other skills from same category
      for (const cvSkill of cvSkills) {
        if (categorySkills.includes(cvSkill.toLowerCase()) &&
            cvSkill.toLowerCase() !== targetLower) {
          related.push(cvSkill);
        }
      }
      break;
    }
  }

  return related;
}

/**
 * Helper: Calculate location match - CONDITIONAL scoring
 * Only applies strict location matching for onsite roles
 */
function calculateLocationMatch(cvLocation, jobLocation, locationType) {
  // Normalize location type
  const locationTypeLower = (locationType || "onsite").toLowerCase();

  // Remote work - location doesn't matter, perfect score
  if (locationTypeLower === "remote") {
    return {score: 100, reason: "Remote work - location irrelevant"};
  }

  // Hybrid work - location somewhat matters, but not critical
  if (locationTypeLower === "hybrid") {
    // If locations match, great; if not, still okay for hybrid
    if (cvLocation && jobLocation) {
      const cvLoc = cvLocation.toLowerCase();
      const jobLoc = jobLocation.toLowerCase();

      if (cvLoc.includes(jobLoc) || jobLoc.includes(cvLoc)) {
        return {score: 100, reason: "Hybrid + location match - ideal"};
      }
    }
    return {score: 80, reason: "Hybrid work - location flexible"};
  }

  // ONSITE ONLY: Now we care about location matching
  // If no location specified in job, can't evaluate
  if (!jobLocation) {
    return {score: 70, reason: "No location requirement specified"};
  }

  // Check if CV has location info - penalty for missing location on ONSITE roles
  if (!cvLocation || cvLocation.trim() === "") {
    return {score: 30, reason: "No location information in CV (onsite role)"};
  }

  // Check for exact location match
  if (locationsMatch(cvLocation, jobLocation, 85)) {
    return {score: 100, reason: "Location match (onsite role)"};
  }

  // Check for country match at least
  const cvCountry = extractCountry(cvLocation);
  const jobCountry = extractCountry(jobLocation);
  if (cvCountry && jobCountry && cvCountry === jobCountry) {
    return {score: 50, reason: "Same country, different city (onsite role)"};
  }

  // Different country for onsite role - significant concern
  return {score: 20, reason: "Location mismatch for onsite role"};
}

/**
 * Helper: Extract country from location string
 */
function extractCountry(location) {
  const locationLower = location.toLowerCase();
  const countries = {
    "south africa": "ZA",
    "germany": "DE",
    "united kingdom": "GB",
    "uk": "GB",
    "united states": "US",
    "usa": "US",
    "canada": "CA",
    "australia": "AU",
    "france": "FR",
    "spain": "ES",
    "italy": "IT",
    "netherlands": "NL",
    "belgium": "BE",
    "switzerland": "CH",
    "austria": "AT",
    "poland": "PL",
    "ireland": "IE",
    "india": "IN",
    "china": "CN",
    "japan": "JP",
  };

  // Sort by country name length (longest first) to match more specific names first
  // Then alphabetically for consistency
  const sortedCountries = Object.entries(countries).sort((a, b) => {
    const lenDiff = b[0].length - a[0].length;
    return lenDiff !== 0 ? lenDiff : a[0].localeCompare(b[0]);
  });

  for (const [country, code] of sortedCountries) {
    if (locationLower.includes(country)) {
      return code;
    }
  }

  return null;
}

/**
 * Helper: Calculate education match - STRICTER version
 */
function calculateEducationMatch(cvEducation, requiredEducation) {
  // If no education requirement, give moderate score
  if (!requiredEducation) {
    return {score: 70, reason: "No education requirement specified"};
  }

  const educationLevels = {
    "high school": 1,
    "associate degree": 2,
    "bachelor's degree": 3,
    "bachelor": 3,
    "bcom": 3,
    "bsc": 3,
    "ba": 3,
    "master's degree": 4,
    "master": 4,
    "mba": 4,
    "msc": 4,
    "ma": 4,
    "doctorate": 5,
    "phd": 5,
  };

  let cvEducationStr = cvEducation;
  if (Array.isArray(cvEducation)) {
    cvEducationStr = cvEducation.length > 0 ? cvEducation[0] : "";
  }
  if (typeof cvEducationStr === "object" && cvEducationStr.degree) {
    cvEducationStr = cvEducationStr.degree;
  }
  cvEducationStr = String(cvEducationStr || "").toLowerCase();

  // Try to find education level from CV - Sort by length for specificity, then alphabetically
  let cvLevel = 0;
  const sortedEducationLevels = Object.entries(educationLevels).sort((a, b) => {
    const lenDiff = b[0].length - a[0].length;
    return lenDiff !== 0 ? lenDiff : a[0].localeCompare(b[0]);
  });

  for (const [degreeType, level] of sortedEducationLevels) {
    if (cvEducationStr.includes(degreeType)) {
      cvLevel = Math.max(cvLevel, level);
    }
  }

  // Get required level
  const reqLower = (requiredEducation || "").toLowerCase();
  let reqLevel = 0;
  for (const [degreeType, level] of sortedEducationLevels) {
    if (reqLower.includes(degreeType)) {
      reqLevel = Math.max(reqLevel, level);
    }
  }

  // If we couldn't determine required level, give moderate score
  if (reqLevel === 0) {
    return {score: 60, reason: "Could not determine education requirement"};
  }

  // Calculate score based on comparison - STRICTER for missing education
  let score = 0;
  let reason = "";

  if (cvLevel === 0) {
    // No education provided - very low score, especially if education is required
    score = reqLevel > 0 ? 15 : 40;
    reason = "No education information provided";
  } else if (cvLevel >= reqLevel) {
    score = 100;
    reason = "Meets or exceeds education requirement";
  } else if (cvLevel === reqLevel - 1) {
    score = 65;
    reason = "One level below required education";
  } else if (cvLevel === reqLevel - 2) {
    score = 35;
    reason = "Two levels below required education";
  } else {
    score = 15;
    reason = "Does not meet education requirement";
  }

  return {
    score,
    reason,
    cvLevel: cvEducation,
    requiredLevel: requiredEducation,
  };
}

/**
 * Generate hiring recommendation
 */
function generateRecommendation(overallScore, skillsScore, careerScore) {
  if (overallScore >= 85) {
    return "Highly Recommended - Strong match across all criteria. Prioritize for interview.";
  } else if (overallScore >= 70) {
    return "Recommended - Good match with minor gaps. Worth interviewing.";
  } else if (overallScore >= 60) {
    if (skillsScore.score >= 75) {
      return "Consider - Strong skills but gaps elsewhere. May succeed with support.";
    } else {
      return "Consider - Fair match. Assess carefully during interview.";
    }
  } else if (overallScore >= 45) {
    if (careerScore.isPromotion) {
      return "Potential - Below threshold but shows growth potential. Consider for development role.";
    } else {
      return "Below Threshold - Significant gaps. Not recommended unless exceptional circumstances.";
    }
  } else {
    return "Not Recommended - Poor match. Unlikely to succeed in this role.";
  }
}

module.exports = {
  calculateAdvancedMatch,
  calculateJobTitleMatch,
  calculateAdvancedSkillsMatch,
  analyzeCareerProgression,
  calculateEnhancedExperienceMatch,
  calculateIndustryAlignment,
  calculateLocationMatch,
  calculateEducationMatch,
};
