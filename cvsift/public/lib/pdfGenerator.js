/**
 * PDF Generator for CV Builder
 * Generates professional PDF resumes from CV data with customizable templates
 */

import jsPDF from 'jspdf';
import { getTemplateById } from './cvTemplates';

/**
 * Main PDF generation function
 * @param {Object} cvData - CV data from the form
 * @param {string} templateId - Selected template ID
 * @param {string} accentColor - Selected accent color
 * @returns {jsPDF} PDF document
 */
export async function generateCVPDF(cvData, templateId, accentColor) {
  const template = getTemplateById(templateId);

  // Create PDF with A4 dimensions
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Select template-specific generator
  switch (template.layout) {
    case 'single-column':
      generateSingleColumnPDF(doc, cvData, template, accentColor);
      break;
    case 'two-column':
      generateTwoColumnPDF(doc, cvData, template, accentColor);
      break;
    case 'asymmetric':
      generateAsymmetricPDF(doc, cvData, template, accentColor);
      break;
    default:
      generateSingleColumnPDF(doc, cvData, template, accentColor);
  }

  return doc;
}

/**
 * Single column layout (Professional & Minimal templates)
 */
function generateSingleColumnPDF(doc, cvData, template, accentColor) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Convert hex color to RGB for jsPDF
  const rgb = hexToRgb(accentColor);

  // === HEADER SECTION ===
  yPosition = addHeader(doc, cvData, yPosition, margin, contentWidth, rgb);

  // === SUMMARY SECTION ===
  if (cvData.summary && cvData.summary.trim()) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addSummary(doc, cvData.summary, yPosition, margin, contentWidth, rgb);
  }

  // === EXPERIENCE SECTION ===
  if (cvData.experience && cvData.experience.length > 0) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addExperience(doc, cvData.experience, yPosition, margin, contentWidth, rgb);
  }

  // === EDUCATION SECTION ===
  if (cvData.education && cvData.education.length > 0) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addEducation(doc, cvData.education, yPosition, margin, contentWidth, rgb);
  }

  // === SKILLS SECTION ===
  if (cvData.skills && cvData.skills.length > 0) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addSkills(doc, cvData.skills, yPosition, margin, contentWidth, rgb);
  }

  // === CERTIFICATIONS SECTION ===
  if (cvData.certifications && cvData.certifications.length > 0 && cvData.certifications[0].name) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addCertifications(doc, cvData.certifications, yPosition, margin, contentWidth, rgb);
  }

  // === LANGUAGES SECTION ===
  if (cvData.languages && cvData.languages.length > 0 && cvData.languages[0].language) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addLanguages(doc, cvData.languages, yPosition, margin, contentWidth, rgb);
  }

  // === AWARDS SECTION ===
  if (cvData.awards && cvData.awards.length > 0 && cvData.awards[0].title) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    yPosition = addAwards(doc, cvData.awards, yPosition, margin, contentWidth, rgb);
  }

  // === INTERESTS SECTION ===
  if (cvData.interests && cvData.interests.length > 0) {
    yPosition = checkPageBreak(doc, yPosition, pageHeight, margin);
    addInterests(doc, cvData.interests, yPosition, margin, contentWidth, rgb);
  }
}

/**
 * Two column layout (Modern template)
 */
function generateTwoColumnPDF(doc, cvData, template, accentColor) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const sidebarWidth = 65;
  const mainWidth = pageWidth - sidebarWidth - (margin * 2);
  const rgb = hexToRgb(accentColor);

  // Sidebar background
  doc.setFillColor(rgb.r, rgb.g, rgb.b, 0.1);
  doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

  let yMain = margin;
  let ySidebar = margin;

  // Main column - Header
  yMain = addHeaderTwoColumn(doc, cvData, yMain, sidebarWidth + margin, mainWidth, rgb);

  // Main column - Summary
  if (cvData.summary) {
    yMain = addSummary(doc, cvData.summary, yMain, sidebarWidth + margin, mainWidth, rgb);
  }

  // Main column - Experience
  if (cvData.experience && cvData.experience.length > 0) {
    yMain = addExperience(doc, cvData.experience, yMain, sidebarWidth + margin, mainWidth, rgb);
  }

  // Sidebar - Profile Image
  if (cvData.personalInfo.profileImage) {
    ySidebar = addProfileImageSidebar(doc, cvData.personalInfo.profileImage, ySidebar, margin);
  }

  // Sidebar - Contact
  ySidebar = addContactSidebar(doc, cvData.personalInfo, ySidebar, margin, sidebarWidth - margin, rgb);

  // Sidebar - Skills
  if (cvData.skills && cvData.skills.length > 0) {
    ySidebar = addSkillsSidebar(doc, cvData.skills, ySidebar, margin, sidebarWidth - margin, rgb);
  }

  // Sidebar - Languages
  if (cvData.languages && cvData.languages.length > 0) {
    ySidebar = addLanguagesSidebar(doc, cvData.languages, ySidebar, margin, sidebarWidth - margin, rgb);
  }

  // Main column - Education
  if (cvData.education && cvData.education.length > 0) {
    yMain = addEducation(doc, cvData.education, yMain, sidebarWidth + margin, mainWidth, rgb);
  }
}

/**
 * Asymmetric layout (Creative template)
 */
function generateAsymmetricPDF(doc, cvData, template, accentColor) {
  // Similar to two-column but with different proportions
  generateTwoColumnPDF(doc, cvData, template, accentColor);
}

// === HELPER FUNCTIONS ===

/**
 * Add header section with name and title
 */
function addHeader(doc, cvData, y, x, width, rgb) {
  const { personalInfo } = cvData;

  // Profile image (if available)
  if (personalInfo.profileImage) {
    try {
      doc.addImage(personalInfo.profileImage, 'JPEG', x, y, 25, 25);
    } catch (error) {
      console.error('Failed to add profile image:', error);
    }
    y += 30;
  }

  // Name
  doc.setFontSize(24);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text(personalInfo.fullName || 'Your Name', x, y);
  y += 10;

  // Contact information
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');

  const contactInfo = [];
  if (personalInfo.email) contactInfo.push(personalInfo.email);
  if (personalInfo.phone) contactInfo.push(personalInfo.phone);
  if (personalInfo.location) contactInfo.push(personalInfo.location);
  if (personalInfo.visaStatus) contactInfo.push(personalInfo.visaStatus);

  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(' | '), x, y);
    y += 6;
  }

  // Links
  const links = [];
  if (personalInfo.linkedin) links.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.website) links.push(personalInfo.website);
  if (personalInfo.github) links.push(`GitHub: ${personalInfo.github}`);

  if (links.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(rgb.r, rgb.g, rgb.b);
    doc.text(links.join(' | '), x, y);
    y += 8;
  }

  // Divider line
  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + width, y);

  return y + 8;
}

/**
 * Add header for two-column layout
 */
function addHeaderTwoColumn(doc, cvData, y, x, width, rgb) {
  const { personalInfo } = cvData;

  // Name
  doc.setFontSize(22);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text(personalInfo.fullName || 'Your Name', x, y);
  y += 8;

  // Divider
  doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + width, y);

  return y + 8;
}

/**
 * Add professional summary
 */
function addSummary(doc, summary, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('PROFESSIONAL SUMMARY', x, y);
  y += 7;

  // Summary text
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  const lines = doc.splitTextToSize(summary, width);
  doc.text(lines, x, y);

  return y + (lines.length * 5) + 8;
}

/**
 * Add work experience section
 */
function addExperience(doc, experience, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('WORK EXPERIENCE', x, y);
  y += 7;

  experience.forEach((exp, index) => {
    if (!exp.jobTitle) return;

    // Check page break
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    // Job title and company
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(exp.jobTitle, x, y);
    y += 5;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(exp.company + (exp.location ? `, ${exp.location}` : ''), x, y);
    y += 5;

    // Dates
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const dates = exp.current ?
      `${exp.startDate} - Present` :
      `${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ''}`;
    doc.text(dates, x, y);
    y += 6;

    // Description
    if (exp.description) {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(exp.description, width);
      doc.text(lines, x + 3, y);
      y += (lines.length * 4) + 5;
    }

    y += 3;
  });

  return y + 5;
}

/**
 * Add education section
 */
function addEducation(doc, education, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('EDUCATION', x, y);
  y += 7;

  education.forEach((edu) => {
    if (!edu.degree) return;

    // Degree
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(edu.degree, x, y);
    y += 5;

    // Institution
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(edu.institution + (edu.location ? `, ${edu.location}` : ''), x, y);
    y += 5;

    // Dates and GPA
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    let dateText = `${edu.startDate}${edu.endDate ? ` - ${edu.endDate}` : ''}`;
    if (edu.gpa) dateText += ` | GPA: ${edu.gpa}`;
    doc.text(dateText, x, y);
    y += 6;

    // Description
    if (edu.description) {
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lines = doc.splitTextToSize(edu.description, width);
      doc.text(lines, x + 3, y);
      y += (lines.length * 4);
    }

    y += 5;
  });

  return y + 5;
}

/**
 * Add skills section
 */
function addSkills(doc, skills, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('SKILLS', x, y);
  y += 7;

  skills.forEach((skillGroup) => {
    if (!skillGroup.category || !skillGroup.items || skillGroup.items.length === 0) return;

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(skillGroup.category + ':', x, y);

    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    const skillsText = skillGroup.items.join(', ');
    const lines = doc.splitTextToSize(skillsText, width - 35);
    doc.text(lines, x + 35, y);

    y += Math.max(5, lines.length * 5);
  });

  return y + 5;
}

/**
 * Add certifications section
 */
function addCertifications(doc, certifications, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('CERTIFICATIONS', x, y);
  y += 7;

  certifications.forEach((cert) => {
    if (!cert.name) return;

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(cert.name, x, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    const certInfo = [cert.issuer, cert.date].filter(Boolean).join(' | ');
    doc.text(certInfo, x, y);
    y += 6;
  });

  return y + 5;
}

/**
 * Add languages section
 */
function addLanguages(doc, languages, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('LANGUAGES', x, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  languages.forEach((lang) => {
    if (!lang.language) return;
    doc.text(`${lang.language}: ${lang.proficiency}`, x, y);
    y += 5;
  });

  return y + 5;
}

/**
 * Add awards section
 */
function addAwards(doc, awards, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('AWARDS & ACHIEVEMENTS', x, y);
  y += 7;

  awards.forEach((award) => {
    if (!award.title) return;

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text(award.title, x, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    const awardInfo = [award.issuer, award.date].filter(Boolean).join(' | ');
    doc.text(awardInfo, x, y);
    y += 6;
  });

  return y + 5;
}

/**
 * Add interests section
 */
function addInterests(doc, interests, y, x, width, rgb) {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('INTERESTS', x, y);
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');
  const interestsText = interests.join(', ');
  const lines = doc.splitTextToSize(interestsText, width);
  doc.text(lines, x, y);

  return y + (lines.length * 5) + 5;
}

/**
 * Sidebar helpers for two-column layout
 */
function addProfileImageSidebar(doc, imageData, y, x) {
  try {
    doc.addImage(imageData, 'JPEG', x + 7.5, y, 50, 50, undefined, 'FAST', 0);
    return y + 55;
  } catch (error) {
    console.error('Failed to add profile image:', error);
    return y;
  }
}

function addContactSidebar(doc, personalInfo, y, x, width, rgb) {
  doc.setFontSize(12);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('CONTACT', x, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  if (personalInfo.email) {
    const emailLines = doc.splitTextToSize(personalInfo.email, width - 5);
    doc.text(emailLines, x, y);
    y += emailLines.length * 4;
  }

  if (personalInfo.phone) {
    doc.text(personalInfo.phone, x, y);
    y += 4;
  }

  if (personalInfo.location) {
    const locationLines = doc.splitTextToSize(personalInfo.location, width - 5);
    doc.text(locationLines, x, y);
    y += locationLines.length * 4;
  }

  if (personalInfo.visaStatus) {
    const visaLines = doc.splitTextToSize(personalInfo.visaStatus, width - 5);
    doc.text(visaLines, x, y);
    y += visaLines.length * 4;
  }

  return y + 8;
}

function addSkillsSidebar(doc, skills, y, x, width, rgb) {
  doc.setFontSize(12);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('SKILLS', x, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  skills.forEach((skillGroup) => {
    if (!skillGroup.items || skillGroup.items.length === 0) return;

    skillGroup.items.forEach((skill) => {
      doc.text(`• ${skill}`, x, y);
      y += 4;
    });
  });

  return y + 8;
}

function addLanguagesSidebar(doc, languages, y, x, width, rgb) {
  doc.setFontSize(12);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.setFont(undefined, 'bold');
  doc.text('LANGUAGES', x, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont(undefined, 'normal');

  languages.forEach((lang) => {
    if (!lang.language) return;
    doc.text(`${lang.language}`, x, y);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    y += 4;
    doc.text(lang.proficiency, x, y);
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    y += 5;
  });

  return y + 8;
}

/**
 * Utility: Check if we need a page break
 */
function checkPageBreak(doc, y, pageHeight, margin) {
  if (y > pageHeight - 40) {
    doc.addPage();
    return margin;
  }
  return y;
}

/**
 * Utility: Convert hex color to RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 59, g: 130, b: 246 }; // Default blue
}

/**
 * Download generated PDF
 */
export function downloadPDF(doc, fileName = 'resume.pdf') {
  doc.save(fileName);
}

/**
 * Get PDF as blob (for uploading to Firebase Storage)
 */
export function getPDFBlob(doc) {
  return doc.output('blob');
}
