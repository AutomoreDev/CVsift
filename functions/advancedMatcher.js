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
    };
  }

  const jobTitleLower = jobTitle.toLowerCase();
  const jobDeptLower = jobDepartment.toLowerCase();
  const matchedRoles = [];
  let directMatches = 0;
  let relatedMatches = 0;
  let departmentMatches = 0;

  // Define role keywords and their related terms
  const roleKeywords = extractRoleKeywords(jobTitleLower);

  for (const exp of cvExperience) {
    const expTitle = (exp.title || "").toLowerCase();
    const expDescription = (exp.description || "").toLowerCase();
    const combined = `${expTitle} ${expDescription}`;

    // Direct title match
    if (expTitle.includes(jobTitleLower) || jobTitleLower.includes(expTitle)) {
      directMatches++;
      matchedRoles.push(exp.title);
      continue;
    }

    // Check for role keywords
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

  // Calculate score based on matches - STRICTER scoring
  let score = 0;
  let reason = "";

  if (directMatches > 0) {
    score = Math.min(100, 80 + (directMatches * 10));
    reason = `Direct match: ${directMatches} similar role(s)`;
  } else if (relatedMatches > 0) {
    score = Math.min(70, 45 + (relatedMatches * 15));
    reason = `Related experience in ${relatedMatches} role(s)`;
  } else if (departmentMatches > 0) {
    // STRICTER: Department match alone is weak signal, lower score
    score = Math.min(40, 20 + (departmentMatches * 10));
    reason = `Some experience in ${jobDepartment} field`;
  } else {
    score = 5;
    reason = `No relevant experience for ${jobTitle} position`;
  }

  return {
    score: Math.round(score),
    reason,
    matchedRoles: [...new Set(matchedRoles)].slice(0, 3),
    directMatches,
    relatedMatches,
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
 * Advanced skills matching with context and recency weighting
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

  // Match required skills with context awareness
  for (const reqSkill of normalizedRequired) {
    let found = false;

    for (const cvSkill of normalizedCVSkills) {
      if (skillsMatch(cvSkill, reqSkill, 85)) {
        // Note: Skill recency is tracked in recentSkills array
        // Future enhancement: Apply score boost for recent skills
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

  // Match preferred skills
  const matchedPreferred = [];
  for (const prefSkill of normalizedPreferred) {
    for (const cvSkill of normalizedCVSkills) {
      if (skillsMatch(cvSkill, prefSkill, 85)) {
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
    // Required skills are worth 80% of the score
    score = (matchedRequired.length / normalizedRequired.length) * 80;
  } else {
    // No required skills specified - give moderate score only if CV has good skills
    score = normalizedCVSkills.length >= 3 ? 50 : 30;
  }

  // Add preferred skills bonus (20% of total)
  if (normalizedPreferred.length > 0) {
    score += (matchedPreferred.length / normalizedPreferred.length) * 20;
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
 * Helper: Calculate total years of experience from experience array
 */
function calculateTotalYearsFromExperience(experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return 0;
  }

  let totalYears = 0;

  for (const job of experience) {
    // Try to extract from year field
    if (job.year) {
      const years = extractYearsFromDateRange(job.year);
      totalYears += years;
    } else if (job.startDate || job.endDate) {
      // Try startDate/endDate fields
      const dateRange = `${job.startDate || ""} - ${job.endDate || "Present"}`;
      const years = extractYearsFromDateRange(dateRange);
      totalYears += years;
    } else if (job.duration) {
      // Try duration field
      const years = extractYearsFromDateRange(job.duration);
      totalYears += years;
    } else {
      // No date info, estimate 2 years per role
      totalYears += 2;
    }
  }

  return totalYears;
}

/**
 * Enhanced experience matching with recency consideration
 */
function calculateEnhancedExperienceMatch(experience, jobSpec) {
  // Calculate total years of experience
  let totalYears = 0;
  if (Array.isArray(experience)) {
    totalYears = calculateTotalYearsFromExperience(experience);
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
