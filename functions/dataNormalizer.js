/* eslint-disable max-len */
/* eslint-disable valid-jsdoc */
/**
 * Comprehensive Data Normalization System
 * Normalizes all CV data including locations, phone numbers, job titles,
 * education levels, and more for intelligent matching
 */

// ============================================================================
// LOCATION NORMALIZATION
// ============================================================================

/**
 * Location synonym mapping
 * Maps country codes, city codes, and common variations
 */
const LOCATION_SYNONYMS = {
  // Countries
  "South Africa": [
    "south africa", "sa", "rsa", "republic of south africa", "s.a.",
    "south african", "suid-afrika", "suid afrika",
  ],
  "United States": [
    "united states", "usa", "us", "u.s.a", "u.s.", "united states of america",
    "america", "states",
  ],
  "United Kingdom": [
    "united kingdom", "uk", "u.k.", "great britain", "britain", "england",
    "gb", "gbr",
  ],
  "United Arab Emirates": [
    "united arab emirates", "uae", "u.a.e.", "emirates",
  ],
  "Australia": ["australia", "aus", "au", "aussie"],
  "Canada": ["canada", "can", "ca"],
  "Germany": ["germany", "de", "deutschland", "ger"],
  "France": ["france", "fr", "fra"],
  "Netherlands": ["netherlands", "nl", "holland", "nld"],
  "India": ["india", "in", "ind", "bharat"],
  "China": ["china", "cn", "chn", "prc"],
  "Japan": ["japan", "jp", "jpn"],
  "Brazil": ["brazil", "br", "bra", "brasil"],
  "Nigeria": ["nigeria", "ng", "nga"],
  "Kenya": ["kenya", "ke", "ken"],
  "Egypt": ["egypt", "eg", "egy"],

  // South African Cities
  "Cape Town": [
    "cape town", "cpt", "kaapstad", "mother city", "ct", "capetown",
  ],
  "Johannesburg": [
    "johannesburg", "jburg", "jhb", "joburg", "jo'burg", "jozi", "egoli",
  ],
  "Pretoria": [
    "pretoria", "pta", "tshwane", "jacaranda city",
  ],
  "Durban": ["durban", "dbn", "ethekwini"],
  "Port Elizabeth": [
    "port elizabeth", "pe", "gqeberha", "the bay", "nelson mandela bay",
  ],
  "Bloemfontein": ["bloemfontein", "bloem", "mangaung"],
  "East London": ["east london", "el", "buffalo city"],
  "Polokwane": ["polokwane", "pietersburg"],
  "Nelspruit": ["nelspruit", "mbombela"],
  "Kimberley": ["kimberley", "sol plaatje"],

  // South African Provinces
  "Western Cape": ["western cape", "wc", "wes-kaap"],
  "Gauteng": ["gauteng", "gp", "gauteng province"],
  "KwaZulu-Natal": ["kwazulu-natal", "kzn", "kwazulu natal"],
  "Eastern Cape": ["eastern cape", "ec", "oos-kaap"],
  "Mpumalanga": ["mpumalanga", "mp"],
  "Limpopo": ["limpopo", "lp"],
  "North West": ["north west", "nw", "noordwes"],
  "Free State": ["free state", "fs", "vrystaat"],
  "Northern Cape": ["northern cape", "nc", "noord-kaap"],

  // Major US Cities
  "New York": ["new york", "ny", "nyc", "new york city", "manhattan"],
  "Los Angeles": ["los angeles", "la", "l.a.", "los angeles ca"],
  "San Francisco": ["san francisco", "sf", "san fran", "bay area"],
  "Chicago": ["chicago", "chi", "chicago il"],
  "Houston": ["houston", "hou", "houston tx"],
  "Boston": ["boston", "bos", "boston ma"],
  "Seattle": ["seattle", "sea", "seattle wa"],
  "Miami": ["miami", "mia", "miami fl"],

  // Major UK Cities
  "London": ["london", "ldn", "greater london"],
  "Manchester": ["manchester", "man", "manc"],
  "Birmingham": ["birmingham", "bham"],
  "Edinburgh": ["edinburgh", "edi"],
  "Glasgow": ["glasgow", "gla"],

  // Major Australian Cities
  "Sydney": ["sydney", "syd"],
  "Melbourne": ["melbourne", "mel"],
  "Brisbane": ["brisbane", "bne"],
  "Perth": ["perth", "per"],
};

/**
 * Normalize a location string to its canonical form
 */
function normalizeLocation(location) {
  if (!location || typeof location !== "string") {
    return location;
  }

  const lowerLoc = location.toLowerCase().trim();

  // Check against all location synonyms
  for (const [canonical, synonyms] of Object.entries(LOCATION_SYNONYMS)) {
    if (synonyms.includes(lowerLoc)) {
      return canonical;
    }
    if (canonical.toLowerCase() === lowerLoc) {
      return canonical;
    }
  }

  // Return original with proper capitalization if no match
  return location.trim();
}

/**
 * Check if two locations match (with 85% threshold)
 */
function locationsMatch(loc1, loc2, threshold = 85) {
  if (!loc1 || !loc2) return false;

  const normalized1 = normalizeLocation(loc1);
  const normalized2 = normalizeLocation(loc2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one contains the other (e.g., "Cape Town, South Africa" contains "Cape Town")
  const lower1 = normalized1.toLowerCase();
  const lower2 = normalized2.toLowerCase();

  if (lower1.includes(lower2) || lower2.includes(lower1)) {
    return true;
  }

  // Fuzzy match with threshold
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= threshold;
}

// ============================================================================
// PHONE NUMBER NORMALIZATION
// ============================================================================

/**
 * Country calling codes
 */
const COUNTRY_CODES = {
  "27": "ZA", // South Africa
  "1": "US", // USA/Canada
  "44": "UK", // United Kingdom
  "61": "AU", // Australia
  "91": "IN", // India
  "86": "CN", // China
  "81": "JP", // Japan
  "49": "DE", // Germany
  "33": "FR", // France
  "971": "AE", // UAE
};

/**
 * Normalize phone number to international format
 * Examples:
 * - "0767909139" → "+27767909139" (if SA context)
 * - "+27 76 790 9139" → "+27767909139"
 * - "(021) 555-1234" → "+27215551234"
 */
function normalizePhoneNumber(phone, defaultCountryCode = "27") {
  if (!phone || typeof phone !== "string") {
    return phone;
  }

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with country code
  if (cleaned.startsWith("0")) {
    cleaned = defaultCountryCode + cleaned.substring(1);
  }

  // If doesn't start with +, add it
  if (!phone.startsWith("+")) {
    // Check if it already has a country code
    let hasCode = false;
    for (const code of Object.keys(COUNTRY_CODES)) {
      if (cleaned.startsWith(code)) {
        hasCode = true;
        break;
      }
    }

    if (!hasCode) {
      cleaned = defaultCountryCode + cleaned;
    }
  }

  return "+" + cleaned;
}

/**
 * Check if two phone numbers match
 */
function phoneNumbersMatch(phone1, phone2, defaultCountryCode = "27") {
  if (!phone1 || !phone2) return false;

  const normalized1 = normalizePhoneNumber(phone1, defaultCountryCode);
  const normalized2 = normalizePhoneNumber(phone2, defaultCountryCode);

  // Extract just the digits
  const digits1 = normalized1.replace(/\D/g, "");
  const digits2 = normalized2.replace(/\D/g, "");

  // Match if last 9 digits are the same (covers local variations)
  const lastDigits1 = digits1.slice(-9);
  const lastDigits2 = digits2.slice(-9);

  return lastDigits1 === lastDigits2;
}

// ============================================================================
// JOB TITLE NORMALIZATION
// ============================================================================

/**
 * Job title synonym mapping
 */
const JOB_TITLE_SYNONYMS = {
  // Software Engineering
  "Software Engineer": [
    "software engineer", "software developer", "developer", "software dev",
    "engineer", "swe", "programmer", "coder",
  ],
  "Senior Software Engineer": [
    "senior software engineer", "senior developer", "senior engineer",
    "sr software engineer", "sr engineer", "senior dev",
  ],
  "Lead Software Engineer": [
    "lead software engineer", "lead developer", "lead engineer",
    "engineering lead", "tech lead", "technical lead",
  ],
  "Frontend Developer": [
    "frontend developer", "front-end developer", "front end developer",
    "fe developer", "ui developer", "web developer",
  ],
  "Backend Developer": [
    "backend developer", "back-end developer", "back end developer",
    "be developer", "server developer",
  ],
  "Full Stack Developer": [
    "full stack developer", "fullstack developer", "full-stack developer",
    "full stack engineer", "fullstack engineer",
  ],
  "DevOps Engineer": [
    "devops engineer", "dev ops engineer", "site reliability engineer",
    "sre", "platform engineer", "infrastructure engineer",
  ],

  // Data & Analytics
  "Data Scientist": [
    "data scientist", "ds", "machine learning engineer", "ml engineer",
  ],
  "Data Analyst": [
    "data analyst", "business analyst", "ba", "analytics specialist",
  ],
  "Data Engineer": [
    "data engineer", "big data engineer", "etl developer",
  ],

  // Design
  "UI/UX Designer": [
    "ui/ux designer", "ux designer", "ui designer", "product designer",
    "user experience designer", "interaction designer",
  ],
  "Graphic Designer": [
    "graphic designer", "visual designer", "graphics designer",
  ],

  // Management
  "Project Manager": [
    "project manager", "pm", "program manager", "delivery manager",
  ],
  "Product Manager": [
    "product manager", "product owner", "po", "product lead",
  ],
  "Engineering Manager": [
    "engineering manager", "em", "development manager", "dev manager",
  ],
  "Chief Technology Officer": [
    "chief technology officer", "cto", "head of technology",
    "vp of engineering",
  ],

  // Marketing & Sales
  "Digital Marketing Manager": [
    "digital marketing manager", "online marketing manager",
    "digital marketer", "marketing manager",
  ],
  "Sales Manager": [
    "sales manager", "account manager", "business development manager",
    "bdm", "sales lead",
  ],

  // Finance & Accounting
  "Accountant": [
    "accountant", "certified accountant", "ca", "chartered accountant",
  ],
  "Financial Analyst": [
    "financial analyst", "finance analyst", "investment analyst",
  ],

  // Human Resources
  "HR Manager": [
    "hr manager", "human resources manager", "people manager",
    "talent manager",
  ],
  "Recruiter": [
    "recruiter", "talent acquisition specialist", "ta specialist",
    "hiring manager",
  ],
};

/**
 * Normalize job title to canonical form
 */
function normalizeJobTitle(title) {
  if (!title || typeof title !== "string") {
    return title;
  }

  const lowerTitle = title.toLowerCase().trim();

  // Check against all job title synonyms
  for (const [canonical, synonyms] of Object.entries(JOB_TITLE_SYNONYMS)) {
    if (synonyms.includes(lowerTitle)) {
      return canonical;
    }
    if (canonical.toLowerCase() === lowerTitle) {
      return canonical;
    }
  }

  // Return original with proper capitalization
  return title.trim();
}

/**
 * Check if two job titles match (with 85% threshold)
 */
function jobTitlesMatch(title1, title2, threshold = 85) {
  if (!title1 || !title2) return false;

  const normalized1 = normalizeJobTitle(title1);
  const normalized2 = normalizeJobTitle(title2);

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return true;
  }

  // Check if one contains the other
  const lower1 = normalized1.toLowerCase();
  const lower2 = normalized2.toLowerCase();

  if (lower1.includes(lower2) || lower2.includes(lower1)) {
    return true;
  }

  // Fuzzy match with threshold
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= threshold;
}

// ============================================================================
// EDUCATION LEVEL NORMALIZATION
// ============================================================================

/**
 * Education level synonym mapping
 */
const EDUCATION_SYNONYMS = {
  "High School": [
    "high school", "secondary school", "matric", "matriculation",
    "grade 12", "high school diploma", "hs diploma",
  ],
  "Associate Degree": [
    "associate degree", "associate's degree", "aa", "as", "2-year degree",
  ],
  "Bachelor's Degree": [
    "bachelor's degree", "bachelor", "bachelors", "ba", "bs", "bsc", "bcom",
    "beng", "undergraduate degree", "4-year degree", "honours degree",
    "b.sc", "b.com", "b.eng", "b.a.",
  ],
  "Master's Degree": [
    "master's degree", "master", "masters", "ma", "ms", "msc", "mba", "mcom",
    "meng", "graduate degree", "postgraduate degree", "m.sc", "m.com",
    "m.eng", "m.a.",
  ],
  "Doctorate": [
    "doctorate", "doctoral degree", "phd", "ph.d", "ph.d.", "doctor",
    "doctoral", "dphil", "edd", "doctorate degree",
  ],
  "Diploma": [
    "diploma", "national diploma", "nd", "higher certificate",
  ],
  "Certificate": [
    "certificate", "certification", "professional certificate",
  ],
};

/**
 * Normalize education level
 */
function normalizeEducation(education) {
  if (!education || typeof education !== "string") {
    return education;
  }

  const lowerEdu = education.toLowerCase().trim();

  for (const [canonical, synonyms] of Object.entries(EDUCATION_SYNONYMS)) {
    if (synonyms.includes(lowerEdu)) {
      return canonical;
    }
    if (canonical.toLowerCase() === lowerEdu) {
      return canonical;
    }
  }

  return education.trim();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  if (s1.includes(s2) || s2.includes(s1)) {
    return 90;
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Normalize all data in a CV metadata object
 */
function normalizeCV(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return metadata;
  }

  const normalized = {...metadata};

  // Normalize location
  if (normalized.location) {
    normalized.location = normalizeLocation(normalized.location);
  }

  // Normalize phone
  if (normalized.phone) {
    normalized.phone = normalizePhoneNumber(normalized.phone);
  }

  // Normalize skills (import from skillNormalizer)
  if (normalized.skills && Array.isArray(normalized.skills)) {
    const {normalizeSkills} = require("./skillNormalizer");
    normalized.skills = normalizeSkills(normalized.skills);
  }

  // Normalize education
  if (normalized.education) {
    if (Array.isArray(normalized.education)) {
      normalized.education = normalized.education.map((edu) => {
        if (typeof edu === "string") {
          return normalizeEducation(edu);
        }
        if (edu.degree) {
          return {
            ...edu,
            degree: normalizeEducation(edu.degree),
          };
        }
        return edu;
      });
    } else if (typeof normalized.education === "string") {
      normalized.education = normalizeEducation(normalized.education);
    }
  }

  // Normalize experience job titles
  if (normalized.experience && Array.isArray(normalized.experience)) {
    normalized.experience = normalized.experience.map((exp) => {
      if (exp.title) {
        return {
          ...exp,
          title: normalizeJobTitle(exp.title),
        };
      }
      return exp;
    });
  }

  return normalized;
}

module.exports = {
  // Location
  normalizeLocation,
  locationsMatch,
  LOCATION_SYNONYMS,

  // Phone
  normalizePhoneNumber,
  phoneNumbersMatch,

  // Job Titles
  normalizeJobTitle,
  jobTitlesMatch,
  JOB_TITLE_SYNONYMS,

  // Education
  normalizeEducation,
  EDUCATION_SYNONYMS,

  // Utilities
  calculateSimilarity,
  levenshteinDistance,

  // Complete normalization
  normalizeCV,
};
