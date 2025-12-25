/**
 * Employment Equity Act (EEA) Constants
 * Constants and enums for EEA compliance tracking
 */

export const OCCUPATIONAL_LEVELS = [
  { value: 'TOP_MANAGEMENT', label: 'Top Management' },
  { value: 'SENIOR_MANAGEMENT', label: 'Senior Management' },
  { value: 'PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT', label: 'Professionally Qualified & Mid Management' },
  { value: 'SKILLED_TECHNICAL', label: 'Skilled Technical' },
  { value: 'SEMI_SKILLED', label: 'Semi-Skilled' },
  { value: 'UNSKILLED', label: 'Unskilled' },
];

export const ECONOMIC_SECTORS = [
  { value: 'ACCOMMODATION_FOOD_SERVICE', label: 'Accommodation and Food Service Activities' },
  { value: 'ADMINISTRATIVE_SUPPORT', label: 'Administrative and Support Activities' },
  { value: 'AGRICULTURE_FORESTRY_FISHING', label: 'Agriculture, Forestry & Fishing' },
  { value: 'ARTS_ENTERTAINMENT_RECREATION', label: 'Arts, Entertainment and Recreation' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'ELECTRICITY_GAS_STEAM', label: 'Electricity, Gas, Steam and Air Conditioning Supply' },
  { value: 'FINANCIAL_INSURANCE', label: 'Financial and Insurance Activities' },
  { value: 'HEALTH_SOCIAL_WORK', label: 'Human Health and Social Work Activities' },
  { value: 'INFORMATION_COMMUNICATION', label: 'Information and Communication' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'MINING_QUARRYING', label: 'Mining and Quarrying' },
  { value: 'PROFESSIONAL_SCIENTIFIC_TECHNICAL', label: 'Professional, Scientific and Technical Activities' },
  { value: 'PUBLIC_ADMINISTRATION_DEFENCE', label: 'Public Administration and Defence' },
  { value: 'REAL_ESTATE', label: 'Real Estate Activities' },
  { value: 'TRANSPORTATION_STORAGE', label: 'Transportation and Storage' },
  { value: 'WATER_SEWERAGE_WASTE', label: 'Water Supply, Sewerage, Waste Management' },
  { value: 'WHOLESALE_RETAIL_TRADE', label: 'Wholesale and Retail Trade' },
];

export const PROVINCES = [
  { value: 'EASTERN_CAPE', label: 'Eastern Cape' },
  { value: 'FREE_STATE', label: 'Free State' },
  { value: 'GAUTENG', label: 'Gauteng' },
  { value: 'KWAZULU_NATAL', label: 'KwaZulu-Natal' },
  { value: 'LIMPOPO', label: 'Limpopo' },
  { value: 'MPUMALANGA', label: 'Mpumalanga' },
  { value: 'NORTHERN_CAPE', label: 'Northern Cape' },
  { value: 'NORTH_WEST', label: 'North West' },
  { value: 'WESTERN_CAPE', label: 'Western Cape' },
];

export const RACES = [
  { value: 'AFRICAN', label: 'African' },
  { value: 'COLOURED', label: 'Coloured' },
  { value: 'INDIAN', label: 'Indian' },
  { value: 'WHITE', label: 'White' },
];

export const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
];

export const DISABILITY_TYPES = [
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'HEARING', label: 'Hearing' },
  { value: 'INTELLECTUAL', label: 'Intellectual' },
  { value: 'MENTAL_EMOTIONAL', label: 'Mental / Emotional' },
  { value: 'PHYSICAL', label: 'Physical' },
  { value: 'SIGHT', label: 'Sight' },
  { value: 'OTHER', label: 'Other' },
];

export const EMPLOYEE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

export const EAP_TYPES = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'PROVINCIAL', label: 'Provincial' },
];

/**
 * Designated groups for EEA compliance
 * These groups receive preferential treatment under employment equity
 */
export const DESIGNATED_GROUPS = ['AFRICAN', 'COLOURED', 'INDIAN'];

/**
 * Disability target percentage (3% as per EEA)
 */
export const DISABILITY_TARGET = 0.03;

/**
 * Compliance status thresholds
 */
export const COMPLIANCE_THRESHOLDS = {
  COMPLIANT: 0, // At or above target
  NEAR_COMPLIANT: 5, // Within 5% of target
  NON_COMPLIANT: Infinity, // More than 5% below target
};

/**
 * Format occupational level for display
 * @param {string} level - Occupational level constant
 * @returns {string} Formatted label
 */
export function formatOccupationalLevel(level) {
  const found = OCCUPATIONAL_LEVELS.find(l => l.value === level);
  return found ? found.label : level;
}

/**
 * Format economic sector for display
 * @param {string} sector - Economic sector constant
 * @returns {string} Formatted label
 */
export function formatEconomicSector(sector) {
  const found = ECONOMIC_SECTORS.find(s => s.value === sector);
  return found ? found.label : sector;
}

/**
 * Format province for display
 * @param {string} province - Province constant
 * @returns {string} Formatted label
 */
export function formatProvince(province) {
  const found = PROVINCES.find(p => p.value === province);
  return found ? found.label : province;
}

/**
 * Format race for display
 * @param {string} race - Race constant
 * @returns {string} Formatted label
 */
export function formatRace(race) {
  const found = RACES.find(r => r.value === race);
  return found ? found.label : race;
}

/**
 * Format gender for display
 * @param {string} gender - Gender constant
 * @returns {string} Formatted label
 */
export function formatGender(gender) {
  const found = GENDERS.find(g => g.value === gender);
  return found ? found.label : gender;
}

/**
 * Get demographic key for employee
 * @param {Object} employee - Employee object
 * @returns {string} Demographic key (e.g., 'AM', 'CF', 'foreignMale')
 */
export function getDemographicKey(employee) {
  if (employee.isForeignNational) {
    return employee.gender === 'MALE' ? 'foreignMale' : 'foreignFemale';
  }

  const raceCode = employee.race.charAt(0); // A, C, I, W
  const genderCode = employee.gender === 'MALE' ? 'M' : 'F';
  return `${raceCode}${genderCode}`; // AM, AF, CM, CF, IM, IF, WM, WF
}

/**
 * Check if employee is part of designated group
 * Designated groups include:
 * - African, Coloured, Indian (all genders)
 * - White females
 * - People with disabilities (any race/gender)
 *
 * NOT designated:
 * - White males without disabilities
 * - Foreign nationals
 *
 * @param {Object} employee - Employee object
 * @returns {boolean} Is designated group member
 */
export function isDesignatedGroup(employee) {
  // Foreign nationals are never designated
  if (employee.isForeignNational) return false;

  // People with disabilities are ALWAYS designated (regardless of race/gender)
  if (employee.hasDisability) return true;

  // White males (without disability) are NOT designated
  if (employee.race === 'WHITE' && employee.gender === 'MALE') return false;

  // Everyone else is designated (African, Coloured, Indian all genders + White females)
  return true;
}

/**
 * Get compliance status based on gap
 * @param {number} gap - Gap to target (percentage points)
 * @returns {string} Compliance status
 */
export function getComplianceStatus(gap) {
  if (gap <= COMPLIANCE_THRESHOLDS.COMPLIANT) return 'COMPLIANT';
  if (gap <= COMPLIANCE_THRESHOLDS.NEAR_COMPLIANT) return 'NEAR_COMPLIANT';
  return 'NON_COMPLIANT';
}

/**
 * Get status color for UI display
 * @param {string} status - Compliance status
 * @returns {Object} Color classes for Tailwind
 */
export function getStatusColors(status) {
  switch (status) {
    case 'COMPLIANT':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        badge: 'bg-green-100 text-green-800',
      };
    case 'NEAR_COMPLIANT':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        badge: 'bg-yellow-100 text-yellow-800',
      };
    case 'NON_COMPLIANT':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        badge: 'bg-red-100 text-red-800',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-300',
        badge: 'bg-gray-100 text-gray-800',
      };
  }
}
