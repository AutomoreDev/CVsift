/**
 * Employment Equity Act (EEA) Type Definitions
 * Type definitions for EEA compliance tracking system
 */

/**
 * @typedef {'TOP_MANAGEMENT' | 'SENIOR_MANAGEMENT' | 'PROFESSIONALLY_QUALIFIED_MID_MANAGEMENT' | 'SKILLED_TECHNICAL' | 'SEMI_SKILLED' | 'UNSKILLED'} OccupationalLevel
 */

/**
 * @typedef {'ACCOMMODATION_FOOD_SERVICE' | 'ADMINISTRATIVE_SUPPORT' | 'AGRICULTURE_FORESTRY_FISHING' | 'ARTS_ENTERTAINMENT_RECREATION' | 'CONSTRUCTION' | 'EDUCATION' | 'ELECTRICITY_GAS_STEAM' | 'FINANCIAL_INSURANCE' | 'HEALTH_SOCIAL_WORK' | 'INFORMATION_COMMUNICATION' | 'MANUFACTURING' | 'MINING_QUARRYING' | 'PROFESSIONAL_SCIENTIFIC_TECHNICAL' | 'PUBLIC_ADMINISTRATION_DEFENCE' | 'REAL_ESTATE' | 'TRANSPORTATION_STORAGE' | 'WATER_SEWERAGE_WASTE' | 'WHOLESALE_RETAIL_TRADE'} EconomicSector
 */

/**
 * @typedef {'AFRICAN' | 'COLOURED' | 'INDIAN' | 'WHITE'} Race
 */

/**
 * @typedef {'MALE' | 'FEMALE'} Gender
 */

/**
 * @typedef {'NATIONAL' | 'PROVINCIAL'} EAPType
 */

/**
 * @typedef {'COMMUNICATION' | 'HEARING' | 'INTELLECTUAL' | 'MENTAL_EMOTIONAL' | 'PHYSICAL' | 'SIGHT' | 'OTHER'} DisabilityType
 */

/**
 * @typedef {'ACTIVE' | 'TERMINATED' | 'SUSPENDED'} EmployeeStatus
 */

/**
 * @typedef {'COMPLIANT' | 'NEAR_COMPLIANT' | 'NON_COMPLIANT'} ComplianceStatus
 */

/**
 * Company Profile
 * @typedef {Object} Company
 * @property {string} id - Firestore document ID
 * @property {string} name - Company display name
 * @property {string} dtiRegistrationName - DTI registered name
 * @property {string} dtiRegistrationNumber - DTI registration number
 * @property {string} payeSarsNumber - PAYE/SARS number
 * @property {string} [uifReferenceNumber] - UIF reference number
 * @property {string} [eeReferenceNumber] - EE reference number
 * @property {EconomicSector} sector - Economic sector
 * @property {EAPType} eapType - EAP type (National or Provincial)
 * @property {string} [province] - Province (if PROVINCIAL)
 * @property {Object} eeReportingPeriod - Reporting period
 * @property {Date} eeReportingPeriod.from - Start date
 * @property {Date} eeReportingPeriod.to - End date
 * @property {Object} eePlanDuration - Plan duration
 * @property {Date} eePlanDuration.from - Start date
 * @property {Date} eePlanDuration.to - End date
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 * @property {string} ownerId - Firebase Auth UID
 */

/**
 * Employee Record
 * @typedef {Object} Employee
 * @property {string} id - Firestore document ID
 * @property {string} companyId - Reference to company
 * @property {string} employeeNumber - Employee number
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} [initials] - Initials
 * @property {Gender} gender - Gender
 * @property {Race} race - Race
 * @property {string} nationality - Nationality
 * @property {boolean} isForeignNational - Is foreign national
 * @property {string} [idNumber] - SA ID number
 * @property {string} [passportNumber] - Passport number
 * @property {boolean} hasDisability - Has disability
 * @property {DisabilityType} [disabilityType] - Disability type
 * @property {Date} employmentDate - Employment start date
 * @property {string} position - Job position/title
 * @property {OccupationalLevel} occupationalLevel - Occupational level
 * @property {number} annualFixedIncome - Annual fixed income
 * @property {number} [annualVariableIncome] - Annual variable income
 * @property {EmployeeStatus} status - Employment status
 * @property {Date} [terminationDate] - Termination date
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Demographics Breakdown
 * @typedef {Object} Demographics
 * @property {number} AM - African Male count
 * @property {number} AF - African Female count
 * @property {number} CM - Coloured Male count
 * @property {number} CF - Coloured Female count
 * @property {number} IM - Indian Male count
 * @property {number} IF - Indian Female count
 * @property {number} WM - White Male count
 * @property {number} WF - White Female count
 * @property {number} foreignMale - Foreign Male count
 * @property {number} foreignFemale - Foreign Female count
 */

/**
 * Compliance for Single Occupational Level
 * @typedef {Object} LevelCompliance
 * @property {OccupationalLevel} level - Occupational level
 * @property {number} totalEmployees - Total employees at this level
 * @property {number} designated - Designated group count
 * @property {number} currentPercentage - Current designated %
 * @property {number} targetPercentage - Target designated %
 * @property {number} gap - Gap to target (percentage points)
 * @property {number} gapCount - Number of hires needed
 * @property {ComplianceStatus} status - Compliance status
 * @property {Demographics} demographics - Demographics breakdown
 */

/**
 * Overall Compliance Report
 * @typedef {Object} ComplianceReport
 * @property {string} companyId - Company ID
 * @property {string} companyName - Company name
 * @property {Date} reportDate - Report generation date
 * @property {LevelCompliance[]} levels - Compliance by level
 * @property {Object} disabilityCompliance - Disability compliance
 * @property {number} disabilityCompliance.current - Current % with disabilities
 * @property {number} disabilityCompliance.target - Target % (3%)
 * @property {number} disabilityCompliance.gap - Gap to target
 * @property {ComplianceStatus} disabilityCompliance.status - Compliance status
 * @property {ComplianceStatus} overallStatus - Overall compliance status
 */

/**
 * Sector Target (Reference Data)
 * @typedef {Object} SectorTarget
 * @property {string} id - Firestore document ID
 * @property {EconomicSector} sector - Economic sector
 * @property {OccupationalLevel} occupationalLevel - Occupational level
 * @property {number} maleTarget - Male designated target (0-1)
 * @property {number} femaleTarget - Female designated target (0-1)
 * @property {number} totalTarget - Combined target (0-1)
 */

/**
 * EAP Target (Reference Data)
 * @typedef {Object} EAPTarget
 * @property {string} id - Firestore document ID
 * @property {string} eapType - EAP type (NATIONAL or province name)
 * @property {string} demographic - Demographic code (AM, AF, CM, CF, IM, IF, WM, WF)
 * @property {number} target - Target percentage (0-1)
 */

/**
 * Compliance Snapshot (Historical Tracking)
 * @typedef {Object} ComplianceSnapshot
 * @property {string} id - Firestore document ID
 * @property {string} companyId - Company ID
 * @property {Date} snapshotDate - Snapshot date
 * @property {OccupationalLevel} occupationalLevel - Occupational level
 * @property {Demographics} demographics - Demographics breakdown
 * @property {number} currentPercentage - Current designated %
 * @property {number} targetPercentage - Target designated %
 * @property {number} gap - Gap to target
 * @property {ComplianceStatus} status - Compliance status
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * Hiring Impact Prediction
 * @typedef {Object} HiringImpact
 * @property {OccupationalLevel} level - Occupational level
 * @property {Race} race - Race of hypothetical hire
 * @property {Gender} gender - Gender of hypothetical hire
 * @property {boolean} hasDisability - Has disability
 * @property {number} newTotal - New total employees
 * @property {number} newDesignated - New designated count
 * @property {number} newPercentage - New designated %
 * @property {number} newGap - New gap to target
 * @property {ComplianceStatus} newStatus - New compliance status
 * @property {number} improvement - Improvement in gap (percentage points)
 */

// Export empty object to make this a module
export {};
