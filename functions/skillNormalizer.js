/* eslint-disable max-len */
/**
 * Skill Normalization Utility
 * Maps skill variations to their standard/canonical names
 * Enables intelligent matching across CVs and job specifications
 */

/**
 * Comprehensive skill synonym mapping
 * Key: normalized/canonical skill name
 * Value: array of variations/synonyms
 */
const SKILL_SYNONYMS = {
  // Microsoft Office Suite
  "Microsoft Excel": [
    "excel", "ms excel", "microsoft excel", "excel spreadsheet",
    "spreadsheet",
  ],
  "Microsoft Word": ["word", "ms word", "microsoft word", "word processing"],
  "Microsoft PowerPoint": [
    "powerpoint", "ms powerpoint", "microsoft powerpoint", "ppt",
    "presentation software",
  ],
  "Microsoft Office": [
    "office", "ms office", "microsoft office", "office suite",
  ],
  "Microsoft Outlook": [
    "outlook", "ms outlook", "microsoft outlook", "email client",
  ],
  "Microsoft Access": ["access", "ms access", "microsoft access"],

  // Programming Languages
  "JavaScript": ["javascript", "js", "ecmascript", "es6", "es2015"],
  "TypeScript": ["typescript", "ts"],
  "Python": ["python", "python3", "python 3", "py"],
  "Java": ["java", "java se", "java ee"],
  "C#": ["c#", "csharp", "c sharp", "c-sharp"],
  "C++": ["c++", "cpp", "c plus plus"],
  "PHP": ["php", "php7", "php8"],
  "Ruby": ["ruby", "ruby on rails", "ror"],
  "Go": ["go", "golang"],
  "Swift": ["swift", "swift 5"],
  "Kotlin": ["kotlin", "kotlin jvm"],
  "Rust": ["rust", "rust lang"],
  "R": ["r", "r language", "r programming"],

  // Frontend Frameworks/Libraries
  "React": ["react", "reactjs", "react.js", "react js"],
  "Vue": ["vue", "vuejs", "vue.js", "vue js"],
  "Angular": ["angular", "angularjs", "angular 2+"],
  "Next.js": ["nextjs", "next.js", "next js"],
  "Svelte": ["svelte", "sveltejs"],

  // Backend Frameworks
  "Node.js": ["nodejs", "node.js", "node js", "node"],
  "Express": ["express", "expressjs", "express.js"],
  "Django": ["django", "django framework"],
  "Flask": ["flask", "flask framework"],
  "Spring": ["spring", "spring boot", "spring framework"],
  "Laravel": ["laravel", "laravel framework"],
  "Ruby on Rails": ["rails", "ruby on rails", "ror"],

  // Databases
  "SQL Server": ["sql server", "ms sql", "microsoft sql server", "mssql", "sql srv"],
  "MySQL": ["mysql", "my sql"],
  "PostgreSQL": ["postgresql", "postgres", "psql"],
  "MongoDB": ["mongodb", "mongo"],
  "Oracle": ["oracle", "oracle db", "oracle database"],
  "Redis": ["redis", "redis cache"],

  // Cloud Platforms
  "AWS": ["aws", "amazon web services", "amazon aws"],
  "Google Cloud": ["gcp", "google cloud platform", "google cloud", "gc"],
  "Azure": ["azure", "microsoft azure", "ms azure"],
  "Heroku": ["heroku", "heroku platform"],

  // DevOps & Tools
  "Docker": ["docker", "docker container", "containerization"],
  "Kubernetes": ["kubernetes", "k8s", "k8"],
  "Jenkins": ["jenkins", "jenkins ci"],
  "Git": ["git", "version control", "git scm"],
  "GitHub": ["github", "git hub"],
  "GitLab": ["gitlab", "git lab"],
  "CI/CD": ["ci/cd", "cicd", "continuous integration", "continuous deployment"],

  // Project Management
  "Agile": ["agile", "agile methodology", "agile development"],
  "Scrum": ["scrum", "scrum methodology"],
  "Jira": ["jira", "atlassian jira"],
  "Trello": ["trello", "trello board"],

  // Design Tools
  "Figma": ["figma", "figma design"],
  "Adobe Photoshop": ["photoshop", "adobe photoshop", "ps"],
  "Adobe Illustrator": ["illustrator", "adobe illustrator", "ai"],
  "Sketch": ["sketch", "sketch app"],

  // Data & Analytics
  "Power BI": ["power bi", "powerbi", "microsoft power bi"],
  "Tableau": ["tableau", "tableau desktop"],
  "Excel": ["excel", "microsoft excel", "ms excel"],
  "SQL": ["sql", "structured query language"],

  // Testing
  "Jest": ["jest", "jest testing"],
  "Selenium": ["selenium", "selenium webdriver"],
  "Cypress": ["cypress", "cypress.io"],
  "JUnit": ["junit", "junit testing"],
};

/**
 * Normalize a single skill to its canonical form
 * @param {string} skill - The skill to normalize
 * @return {string} - The normalized skill name
 */
function normalizeSkill(skill) {
  if (!skill || typeof skill !== "string") {
    return skill;
  }

  const lowerSkill = skill.toLowerCase().trim();

  // Check if it matches any synonym
  for (const [canonical, synonyms] of Object.entries(SKILL_SYNONYMS)) {
    if (synonyms.includes(lowerSkill)) {
      return canonical;
    }
    // Also check if the skill itself is the canonical name
    if (canonical.toLowerCase() === lowerSkill) {
      return canonical;
    }
  }

  // If no match found, return original skill with proper capitalization
  return skill.trim();
}

/**
 * Normalize an array of skills
 * @param {string[]} skills - Array of skills to normalize
 * @return {string[]} - Array of normalized skills (deduplicated)
 */
function normalizeSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  const normalized = skills.map(normalizeSkill);

  // Remove duplicates while preserving order
  return [...new Set(normalized)];
}

/**
 * Calculate similarity between two skills (0-100%)
 * Used for fuzzy matching when exact match fails
 * @param {string} skill1 - First skill
 * @param {string} skill2 - Second skill
 * @return {number} - Similarity percentage (0-100)
 */
function calculateSimilarity(skill1, skill2) {
  if (!skill1 || !skill2) return 0;

  const s1 = skill1.toLowerCase().trim();
  const s2 = skill2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 100;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 90;
  }

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @return {number} - Edit distance
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
 * Check if a CV skill matches a job requirement skill
 * Uses normalized matching and fuzzy matching with threshold
 * @param {string} cvSkill - Skill from CV
 * @param {string} jobSkill - Required skill from job spec
 * @param {number} threshold - Minimum similarity % for match (default 85)
 * @return {boolean} - True if skills match
 */
function skillsMatch(cvSkill, jobSkill, threshold = 85) {
  const normalizedCV = normalizeSkill(cvSkill);
  const normalizedJob = normalizeSkill(jobSkill);

  // Exact match after normalization
  if (normalizedCV === normalizedJob) {
    return true;
  }

  // Fuzzy match with threshold
  const similarity = calculateSimilarity(normalizedCV, normalizedJob);
  return similarity >= threshold;
}

/**
 * Find all matching skills between CV and job requirements
 * @param {string[]} cvSkills - Skills from CV
 * @param {string[]} jobSkills - Required skills from job spec
 * @param {number} threshold - Minimum similarity % (default 85)
 * @return {Object} - Match results with details
 */
function matchSkills(cvSkills, jobSkills, threshold = 85) {
  const matches = [];
  const missing = [];

  for (const jobSkill of jobSkills) {
    let found = false;
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const cvSkill of cvSkills) {
      const similarity = calculateSimilarity(
          normalizeSkill(cvSkill),
          normalizeSkill(jobSkill),
      );

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = cvSkill;
      }

      if (similarity >= threshold) {
        found = true;
        break;
      }
    }

    if (found || bestSimilarity >= threshold) {
      matches.push({
        required: jobSkill,
        found: bestMatch,
        similarity: bestSimilarity,
      });
    } else {
      missing.push({
        required: jobSkill,
        closestMatch: bestMatch,
        similarity: bestSimilarity,
      });
    }
  }

  return {
    matches,
    missing,
    matchPercentage: Math.round((matches.length / jobSkills.length) * 100),
  };
}

module.exports = {
  normalizeSkill,
  normalizeSkills,
  calculateSimilarity,
  skillsMatch,
  matchSkills,
  SKILL_SYNONYMS,
};
