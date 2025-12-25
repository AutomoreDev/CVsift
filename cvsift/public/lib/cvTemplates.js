/**
 * CV Builder Template Definitions
 * Defines available CV templates with their layouts and styling
 */

export const CV_TEMPLATES = {
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and modern layout perfect for corporate roles',
    thumbnail: '/templates/professional-thumb.svg',
    layout: 'single-column',
    sections: ['header', 'summary', 'experience', 'education', 'skills', 'certifications'],
    defaultColor: '#3B82F6',
    fonts: {
      heading: 'Poppins',
      body: 'Work Sans'
    }
  },

  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Two-column design with sidebar for a contemporary look',
    thumbnail: '/templates/modern-thumb.svg',
    layout: 'two-column',
    sections: ['header', 'summary', 'experience', 'education', 'skills', 'languages', 'interests'],
    defaultColor: '#8B5CF6',
    fonts: {
      heading: 'Poppins',
      body: 'Work Sans'
    }
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with focus on content',
    thumbnail: '/templates/minimal-thumb.svg',
    layout: 'single-column',
    sections: ['header', 'experience', 'education', 'skills'],
    defaultColor: '#2C3E50',
    fonts: {
      heading: 'Poppins',
      body: 'Work Sans'
    }
  },

  creative: {
    id: 'creative',
    name: 'Creative',
    description: 'Bold design for creative professionals',
    thumbnail: '/templates/creative-thumb.svg',
    layout: 'asymmetric',
    sections: ['header', 'portfolio', 'experience', 'skills', 'education', 'awards'],
    defaultColor: '#EC4899',
    fonts: {
      heading: 'Poppins',
      body: 'Work Sans'
    }
  }
};

/**
 * Default form structure for CV Builder
 */
export const DEFAULT_CV_DATA = {
  // Personal Information
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    visaStatus: '',
    linkedin: '',
    website: '',
    github: '',
    profileImage: null // Will store Firebase Storage URL or base64
  },

  // Professional Summary
  summary: '',

  // Work Experience
  experience: [
    {
      id: Date.now(),
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    }
  ],

  // Education
  education: [
    {
      id: Date.now() + 1,
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: ''
    }
  ],

  // Skills
  skills: [
    {
      id: Date.now() + 2,
      category: '',
      items: []
    }
  ],

  // Certifications
  certifications: [
    {
      id: Date.now() + 3,
      name: '',
      issuer: '',
      date: '',
      url: ''
    }
  ],

  // Languages
  languages: [
    {
      id: Date.now() + 4,
      language: '',
      proficiency: 'Native' // Native, Fluent, Professional, Limited
    }
  ],

  // Projects/Portfolio (for creative template)
  portfolio: [
    {
      id: Date.now() + 5,
      title: '',
      description: '',
      url: '',
      technologies: []
    }
  ],

  // Awards & Achievements
  awards: [
    {
      id: Date.now() + 6,
      title: '',
      issuer: '',
      date: '',
      description: ''
    }
  ],

  // Interests/Hobbies
  interests: []
};

/**
 * Language proficiency levels
 */
export const LANGUAGE_PROFICIENCY = [
  'Native',
  'Fluent',
  'Professional',
  'Intermediate',
  'Basic'
];

/**
 * Predefined color options for templates
 */
export const COLOR_PRESETS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Navy', value: '#1E40AF' }
];

/**
 * Section display configuration
 */
export const SECTION_CONFIG = {
  header: {
    label: 'Header',
    icon: 'User',
    required: true,
    description: 'Personal information and contact details'
  },
  summary: {
    label: 'Professional Summary',
    icon: 'FileText',
    required: false,
    description: 'Brief overview of your professional background'
  },
  experience: {
    label: 'Work Experience',
    icon: 'Briefcase',
    required: true,
    description: 'Your employment history and achievements'
  },
  education: {
    label: 'Education',
    icon: 'GraduationCap',
    required: true,
    description: 'Academic qualifications and degrees'
  },
  skills: {
    label: 'Skills',
    icon: 'Zap',
    required: true,
    description: 'Technical and professional skills'
  },
  certifications: {
    label: 'Certifications',
    icon: 'Award',
    required: false,
    description: 'Professional certifications and licenses'
  },
  languages: {
    label: 'Languages',
    icon: 'Globe',
    required: false,
    description: 'Language proficiencies'
  },
  portfolio: {
    label: 'Projects/Portfolio',
    icon: 'Folder',
    required: false,
    description: 'Personal or professional projects'
  },
  awards: {
    label: 'Awards & Achievements',
    icon: 'Trophy',
    required: false,
    description: 'Recognition and accomplishments'
  },
  interests: {
    label: 'Interests',
    icon: 'Heart',
    required: false,
    description: 'Hobbies and personal interests'
  }
};

/**
 * Get template by ID
 */
export function getTemplateById(templateId) {
  return CV_TEMPLATES[templateId] || CV_TEMPLATES.professional;
}

/**
 * Get all available templates as array
 */
export function getAllTemplates() {
  return Object.values(CV_TEMPLATES);
}

/**
 * Validate CV data structure
 */
export function validateCVData(data) {
  const errors = [];

  // Personal info validation
  if (!data.personalInfo?.fullName?.trim()) {
    errors.push('Full name is required');
  }

  if (!data.personalInfo?.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.personalInfo.email)) {
    errors.push('Invalid email format');
  }

  if (!data.personalInfo?.phone?.trim()) {
    errors.push('Phone number is required');
  }

  // Experience validation
  if (!data.experience || data.experience.length === 0) {
    errors.push('At least one work experience is required');
  } else {
    data.experience.forEach((exp, index) => {
      if (!exp.jobTitle?.trim()) {
        errors.push(`Experience ${index + 1}: Job title is required`);
      }
      if (!exp.company?.trim()) {
        errors.push(`Experience ${index + 1}: Company is required`);
      }
      if (!exp.startDate) {
        errors.push(`Experience ${index + 1}: Start date is required`);
      }
    });
  }

  // Education validation
  if (!data.education || data.education.length === 0) {
    errors.push('At least one education entry is required');
  } else {
    data.education.forEach((edu, index) => {
      if (!edu.degree?.trim()) {
        errors.push(`Education ${index + 1}: Degree is required`);
      }
      if (!edu.institution?.trim()) {
        errors.push(`Education ${index + 1}: Institution is required`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
