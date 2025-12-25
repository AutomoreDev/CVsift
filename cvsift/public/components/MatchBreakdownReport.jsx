import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Award, Briefcase, GraduationCap, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { functions } from '../js/firebase-config';
import { httpsCallable } from 'firebase/functions';

/**
 * MatchBreakdownReport Component
 * Displays a detailed analysis of how a CV matches a job specification
 *
 * @param {Object} cv - The CV data
 * @param {Object} jobSpec - The job specification
 * @param {number} matchScore - The overall match score (0-100)
 * @param {Function} onClose - Function to close the report
 */
export default function MatchBreakdownReport({ cv, jobSpec, matchScore, onClose }) {
  const [detailedBreakdown, setDetailedBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!cv || !jobSpec) return null;

  // Fetch detailed match breakdown from backend
  useEffect(() => {
    const fetchDetailedBreakdown = async () => {
      try {
        setLoading(true);

        // Call Firebase Cloud Function using v9+ modular SDK
        const calculateMatchScore = httpsCallable(functions, 'calculateMatchScore');
        const result = await calculateMatchScore({
          cvId: cv.id,
          jobSpecId: jobSpec.id
        });

        console.log('API Response:', result.data);

        // The function returns { breakdown, matchScore, strengths, gaps }
        if (result.data && result.data.breakdown) {
          setDetailedBreakdown(result.data.breakdown);
          console.log('Detailed breakdown fetched:', result.data.breakdown);
        } else {
          console.warn('No breakdown data returned from API');
        }
      } catch (error) {
        console.error('Error fetching detailed breakdown:', error);
        console.error('Error details:', error.message, error.code);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedBreakdown();
  }, [cv, jobSpec]);

  /**
   * Calculate skills match breakdown
   */
  const calculateSkillsMatch = () => {
    const cvSkills = (cv.metadata?.skills || []).map(s => s.toLowerCase());
    const requiredSkills = (jobSpec.requiredSkills || []).map(s => s.toLowerCase());
    const preferredSkills = (jobSpec.preferredSkills || []).map(s => s.toLowerCase());

    const matchedRequired = requiredSkills.filter(skill =>
      cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
    );
    const matchedPreferred = preferredSkills.filter(skill =>
      cvSkills.some(cvSkill => cvSkill.includes(skill) || skill.includes(cvSkill))
    );
    const missingRequired = requiredSkills.filter(skill => !matchedRequired.includes(skill));

    return {
      matchedRequired,
      matchedPreferred,
      missingRequired,
      requiredTotal: requiredSkills.length,
      preferredTotal: preferredSkills.length,
      requiredScore: requiredSkills.length > 0 ? (matchedRequired.length / requiredSkills.length) * 100 : 100
    };
  };

  /**
   * Check if a job title is relevant to the target job spec
   */
  const isRelevantExperience = (jobTitle, targetTitle) => {
    if (!jobTitle || !targetTitle) return false;

    const normalizeTitle = (title) => title.toLowerCase().trim();
    const job = normalizeTitle(jobTitle);
    const target = normalizeTitle(targetTitle);

    // Extract key role keywords from target
    const roleKeywords = [
      'developer', 'engineer', 'designer', 'manager', 'analyst', 'consultant',
      'architect', 'lead', 'director', 'coordinator', 'specialist', 'administrator',
      'technician', 'sales', 'marketing', 'accountant', 'clerk', 'assistant',
      'chef', 'waiter', 'driver', 'receptionist', 'officer', 'supervisor',
      'representative', 'agent', 'associate', 'executive', 'programmer'
    ];

    // Find the primary role in the target
    let primaryRole = '';
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
    const targetWords = target.split(/\s+/).filter(w => w.length > 3);
    const jobWords = job.split(/\s+/).filter(w => w.length > 3);

    // If any significant word matches, consider it relevant
    for (const targetWord of targetWords) {
      if (jobWords.some(jobWord => jobWord.includes(targetWord) || targetWord.includes(jobWord))) {
        return true;
      }
    }

    return false;
  };

  /**
   * Calculate experience match
   * Only counts experience relevant to the job spec title
   */
  const calculateExperienceMatch = () => {
    const cvExperience = cv.metadata?.experience || [];
    const targetTitle = jobSpec.title || '';

    // Filter to only relevant experience
    const relevantExperience = cvExperience.filter(exp =>
      isRelevantExperience(exp.title, targetTitle)
    );

    // Calculate years from earliest start to latest end of RELEVANT positions only
    let earliestYear = null;
    let latestYear = null;
    const currentYear = new Date().getFullYear();

    relevantExperience.forEach(exp => {
      const duration = exp.duration || `${exp.startDate || ''} - ${exp.endDate || ''}`;
      const yearMatches = duration.match(/\b(19|20)\d{2}\b/g);

      if (yearMatches && yearMatches.length > 0) {
        const startYear = parseInt(yearMatches[0]);
        const endYear = yearMatches.length >= 2 ? parseInt(yearMatches[yearMatches.length - 1]) : startYear;

        // Update earliest start year
        if (earliestYear === null || startYear < earliestYear) {
          earliestYear = startYear;
        }

        // Check if currently employed
        if (duration.toLowerCase().includes('present') || duration.toLowerCase().includes('current')) {
          latestYear = currentYear;
        } else {
          // Update latest end year
          if (latestYear === null || endYear > latestYear) {
            latestYear = endYear;
          }
        }
      }
    });

    let totalYears = 0;
    // Calculate years from earliest to latest relevant position
    if (earliestYear !== null && latestYear !== null) {
      totalYears = Math.max(0, latestYear - earliestYear);
    } else if (relevantExperience.length > 0) {
      // Fallback: estimate based on number of relevant positions
      totalYears = relevantExperience.length * 1.5;
    }

    const minRequired = parseInt(jobSpec.minExperience) || 0;
    const maxRequired = parseInt(jobSpec.maxExperience) || 999;

    const meetsRequirement = totalYears >= minRequired && totalYears <= maxRequired;
    const isUnderqualified = totalYears < minRequired;
    const isOverqualified = totalYears > maxRequired;

    return {
      totalYears,
      minRequired,
      maxRequired,
      meetsRequirement,
      isUnderqualified,
      isOverqualified,
      difference: Math.abs(totalYears - minRequired)
    };
  };

  /**
   * Calculate education match
   */
  const calculateEducationMatch = () => {
    const cvEducation = (cv.metadata?.education || [])
      .map(e => (e.degree || '').toLowerCase());
    const requiredEducation = (jobSpec.education || '').toLowerCase();

    if (!requiredEducation) return { matches: true, details: 'No specific requirement' };

    const educationLevels = {
      'phd': 6,
      'doctorate': 6,
      'masters': 5,
      'master': 5,
      'mba': 5,
      'honours': 4,
      'bachelor': 3,
      'degree': 3,
      'diploma': 2,
      'certificate': 1
    };

    const requiredLevel = Object.entries(educationLevels).find(([key]) =>
      requiredEducation.includes(key)
    )?.[1] || 0;

    const cvLevel = Math.max(...cvEducation.map(edu => {
      const level = Object.entries(educationLevels).find(([key]) =>
        edu.includes(key)
      )?.[1] || 0;
      return level;
    }), 0);

    return {
      matches: cvLevel >= requiredLevel,
      cvLevel,
      requiredLevel,
      details: cvLevel >= requiredLevel ? 'Meets requirement' : 'Below requirement'
    };
  };

  /**
   * Calculate location match
   */
  const calculateLocationMatch = () => {
    const cvLocation = (cv.metadata?.location || '').toLowerCase();
    const jobLocation = (jobSpec.location || '').toLowerCase();

    if (!jobLocation || jobSpec.locationType === 'remote') {
      return { matches: true, details: jobSpec.locationType === 'remote' ? 'Remote position' : 'No location requirement' };
    }

    const matches = cvLocation.includes(jobLocation) || jobLocation.includes(cvLocation);
    return {
      matches,
      details: matches ? 'Location matches' : 'Different location'
    };
  };

  const skillsMatch = calculateSkillsMatch();
  const experienceMatch = calculateExperienceMatch();
  const educationMatch = calculateEducationMatch();
  const locationMatch = calculateLocationMatch();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-accent-500 to-accent-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 font-heading">
                <Award size={28} />
                Match Breakdown Report
              </h2>
              <p className="text-accent-100">
                Detailed analysis: {cv.metadata?.name || cv.fileName} → {jobSpec.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="mb-6 bg-blue-50 rounded-xl p-6 border border-blue-200 text-center">
              <div className="animate-pulse">
                <p className="text-blue-600 font-medium">Loading detailed analysis...</p>
                <p className="text-xs text-blue-500 mt-1">Calculating industry adjacency and skill proficiency</p>
              </div>
            </div>
          )}

          {/* Overall Match Score */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-secondary-900 mb-1 font-heading">Overall Match Score</h3>
                <p className="text-sm text-gray-600">Comprehensive fit assessment</p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${
                  matchScore >= 80 ? 'text-green-600' :
                  matchScore >= 60 ? 'text-blue-600' :
                  matchScore >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {matchScore}%
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {matchScore >= 80 ? 'Excellent Match' :
                   matchScore >= 60 ? 'Good Match' :
                   matchScore >= 40 ? 'Fair Match' : 'Poor Match'}
                </p>
              </div>
            </div>
          </div>

          {/* Title/Role Relevance with Adjacency Scoring */}
          {detailedBreakdown?.title && !loading && (
            <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={16} />
                </div>
                Title & Role Relevance
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Role Match Score:</span>
                  <span className={`font-bold text-lg ${
                    detailedBreakdown.title.score >= 80 ? 'text-green-600' :
                    detailedBreakdown.title.score >= 60 ? 'text-blue-600' :
                    detailedBreakdown.title.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {detailedBreakdown.title.score}%
                  </span>
                </div>

                {detailedBreakdown.title.reason && (
                  <div className={`p-4 rounded-lg border-l-4 ${
                    detailedBreakdown.title.score >= 80 ? 'bg-green-50 border-green-500' :
                    detailedBreakdown.title.score >= 60 ? 'bg-blue-50 border-blue-500' :
                    detailedBreakdown.title.score >= 40 ? 'bg-yellow-50 border-yellow-500' :
                    'bg-red-50 border-red-500'
                  }`}>
                    <p className="text-sm font-semibold text-secondary-900 mb-1">Analysis:</p>
                    <p className="text-sm text-gray-700">{detailedBreakdown.title.reason}</p>
                  </div>
                )}

                {detailedBreakdown.title.matchedRoles && detailedBreakdown.title.matchedRoles.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Relevant Experience:</p>
                    <div className="flex flex-wrap gap-2">
                      {detailedBreakdown.title.matchedRoles.map((role, idx) => {
                        const adjacency = detailedBreakdown.title.adjacencyScores?.[role] || 0;
                        return (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-lg text-sm border font-medium ${
                              adjacency >= 80 ? 'bg-green-50 text-green-700 border-green-300' :
                              adjacency >= 50 ? 'bg-blue-50 text-blue-700 border-blue-300' :
                              adjacency >= 30 ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                              'bg-gray-50 text-gray-700 border-gray-300'
                            }`}
                          >
                            {role}
                            {adjacency > 0 && adjacency < 100 && (
                              <span className="ml-1.5 text-xs opacity-75">({adjacency}%)</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Breakdown */}
          <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Award className="text-white" size={16} />
              </div>
              Skills Analysis
            </h3>

            {/* Required Skills */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 font-heading">Required Skills</h4>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  skillsMatch.requiredScore === 100 ? 'bg-green-100 text-green-700' :
                  skillsMatch.requiredScore >= 70 ? 'bg-blue-100 text-blue-700' :
                  skillsMatch.requiredScore >= 40 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {skillsMatch.matchedRequired.length} / {skillsMatch.requiredTotal} matched
                  {detailedBreakdown?.skills?.score && !loading && ` (${Math.round(detailedBreakdown.skills.score)}%)`}
                </span>
              </div>

              {skillsMatch.matchedRequired.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle size={14} /> Matched Required Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsMatch.matchedRequired.map((skill, idx) => {
                      const proficiency = detailedBreakdown?.skills?.skillProficiencies?.[skill];
                      const profLevel = proficiency?.proficiency;
                      const years = proficiency?.years;

                      return (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 rounded-lg text-sm border ${
                            profLevel === 'expert' ? 'bg-green-100 text-green-800 border-green-300' :
                            profLevel === 'intermediate' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                            profLevel === 'beginner' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            'bg-green-50 text-green-700 border-green-200'
                          }`}
                        >
                          {skill}
                          {!loading && years !== undefined && (
                            <span className="ml-1.5 text-xs opacity-75">
                              ({years}y - {profLevel || 'beginner'})
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {skillsMatch.missingRequired.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                    <XCircle size={14} /> Missing Required Skills:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsMatch.missingRequired.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preferred Skills */}
            {skillsMatch.preferredTotal > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-700 font-heading">Preferred Skills</h4>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold">
                    {skillsMatch.matchedPreferred.length} / {skillsMatch.preferredTotal} matched
                  </span>
                </div>
                {skillsMatch.matchedPreferred.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skillsMatch.matchedPreferred.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Experience Breakdown */}
          <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <Briefcase className="text-white" size={16} />
              </div>
              Experience Analysis
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Candidate Experience:</span>
                <span className="font-bold text-secondary-900">{experienceMatch.totalYears} years</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Required Experience:</span>
                <span className="font-bold text-secondary-900">
                  {experienceMatch.minRequired}{experienceMatch.maxRequired < 999 ? ` - ${experienceMatch.maxRequired}` : '+'} years
                </span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                experienceMatch.meetsRequirement ? 'bg-green-50 border border-green-200' :
                experienceMatch.isUnderqualified ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                {experienceMatch.meetsRequirement ? (
                  <>
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-sm font-semibold text-green-700">Meets experience requirement</span>
                  </>
                ) : experienceMatch.isUnderqualified ? (
                  <>
                    <AlertCircle className="text-yellow-600" size={20} />
                    <span className="text-sm font-semibold text-yellow-700">
                      Underqualified by {experienceMatch.difference} years
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-blue-600" size={20} />
                    <span className="text-sm font-semibold text-blue-700">
                      Overqualified by {experienceMatch.totalYears - experienceMatch.maxRequired} years
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Education Breakdown */}
          <div className="mb-6 bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={16} />
              </div>
              Education Analysis
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Required:</span>
                <span className="font-bold text-secondary-900">{jobSpec.education || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Candidate:</span>
                <span className="font-bold text-secondary-900">
                  {cv.metadata?.education?.[0]?.degree || 'Not specified'}
                </span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                educationMatch.matches ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {educationMatch.matches ? (
                  <>
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-sm font-semibold text-green-700">{educationMatch.details}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="text-red-600" size={20} />
                    <span className="text-sm font-semibold text-red-700">{educationMatch.details}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Location Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2 font-heading">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <MapPin className="text-white" size={16} />
              </div>
              Location Analysis
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Job Location:</span>
                <span className="font-bold text-secondary-900">
                  {jobSpec.location || 'Not specified'}
                  {jobSpec.locationType && ` (${jobSpec.locationType})`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">Candidate Location:</span>
                <span className="font-bold text-secondary-900">{cv.metadata?.location || 'Not specified'}</span>
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                locationMatch.matches ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {locationMatch.matches ? (
                  <>
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-sm font-semibold text-green-700">{locationMatch.details}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-yellow-600" size={20} />
                    <span className="text-sm font-semibold text-yellow-700">{locationMatch.details}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
