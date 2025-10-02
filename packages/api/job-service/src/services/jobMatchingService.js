/**
 * Advanced Job Matching Service
 * Implements sophisticated algorithms for matching job seekers with relevant opportunities
 */

const { Op } = require('sequelize');
const { Job, JobMatch, Application } = require('../models');
const logger = require('../utils/logger');

class JobMatchingService {
  constructor() {
    this.matchingWeights = {
      skills: 0.35,
      experience: 0.25,
      location: 0.15,
      salary: 0.15,
      culture: 0.10
    };
    
    this.experienceLevelMapping = {
      'entry': 0,
      'mid': 1,
      'senior': 2,
      'executive': 3
    };
    
    this.skillCategories = {
      'programming': ['python', 'javascript', 'java', 'c++', 'go', 'rust', 'typescript'],
      'web_development': ['react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask'],
      'mobile': ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'],
      'data_science': ['machine learning', 'ai', 'tensorflow', 'pytorch', 'pandas', 'numpy'],
      'devops': ['docker', 'kubernetes', 'aws', 'azure', 'terraform', 'jenkins', 'ci/cd'],
      'database': ['sql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'mysql']
    };
  }

  /**
   * Generate job matches for a user
   * @param {number} userId - User ID
   * @param {Object} userProfile - User profile data
   * @param {Object} options - Matching options
   * @returns {Array} Array of job matches
   */
  async generateJobMatches(userId, userProfile, options = {}) {
    try {
      logger.info(`Generating job matches for user ${userId}`);
      
      const {
        limit = 50,
        minScore = 0.3,
        excludeApplied = true,
        includeExpired = false
      } = options;

      // Get candidate jobs
      const candidateJobs = await this.getCandidateJobs({
        userId,
        excludeApplied,
        includeExpired,
        limit: limit * 3 // Get more candidates to filter
      });

      if (candidateJobs.length === 0) {
        logger.info(`No candidate jobs found for user ${userId}`);
        return [];
      }

      // Calculate compatibility scores
      const jobMatches = [];
      
      for (const job of candidateJobs) {
        const matchScore = await this.calculateCompatibilityScore(userProfile, job);
        
        if (matchScore.overall >= minScore) {
          // Check if match already exists
          const existingMatch = await JobMatch.findOne({
            where: { user_id: userId, job_id: job.id }
          });

          if (!existingMatch) {
            const jobMatch = await JobMatch.create({
              user_id: userId,
              job_id: job.id,
              compatibility_score: matchScore.overall,
              skills_score: matchScore.skills,
              experience_score: matchScore.experience,
              location_score: matchScore.location,
              salary_score: matchScore.salary,
              culture_score: matchScore.culture,
              match_factors: matchScore.factors,
              recommendation_reason: this.generateRecommendationReason(matchScore),
              match_version: '2.0'
            });

            jobMatches.push({
              ...jobMatch.toJSON(),
              job: job.toJSON()
            });
          }
        }
      }

      // Sort by compatibility score
      jobMatches.sort((a, b) => b.compatibility_score - a.compatibility_score);

      logger.info(`Generated ${jobMatches.length} job matches for user ${userId}`);
      return jobMatches.slice(0, limit);

    } catch (error) {
      logger.error(`Error generating job matches for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get candidate jobs for matching
   * @param {Object} params - Query parameters
   * @returns {Array} Array of candidate jobs
   */
  async getCandidateJobs(params) {
    const { userId, excludeApplied, includeExpired, limit } = params;
    
    const whereClause = {
      is_active: true
    };

    if (!includeExpired) {
      whereClause.expires_date = {
        [Op.gt]: new Date()
      };
    }

    let excludeJobIds = [];
    
    if (excludeApplied) {
      const applications = await Application.findAll({
        where: { user_id: userId },
        attributes: ['job_id']
      });
      excludeJobIds = applications.map(app => app.job_id);
    }

    if (excludeJobIds.length > 0) {
      whereClause.id = {
        [Op.notIn]: excludeJobIds
      };
    }

    return await Job.findAll({
      where: whereClause,
      include: [
        {
          association: 'company',
          required: false
        }
      ],
      order: [['posted_date', 'DESC']],
      limit
    });
  }

  /**
   * Calculate compatibility score between user and job
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {Object} Compatibility scores
   */
  async calculateCompatibilityScore(userProfile, job) {
    const scores = {
      skills: await this.calculateSkillsScore(userProfile, job),
      experience: this.calculateExperienceScore(userProfile, job),
      location: this.calculateLocationScore(userProfile, job),
      salary: this.calculateSalaryScore(userProfile, job),
      culture: this.calculateCultureScore(userProfile, job)
    };

    // Calculate weighted overall score
    const overall = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * this.matchingWeights[key]);
    }, 0);

    // Generate detailed factors
    const factors = this.generateMatchFactors(userProfile, job, scores);

    return {
      overall: Math.round(overall * 100) / 100,
      ...scores,
      factors
    };
  }

  /**
   * Calculate skills compatibility score
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Skills score (0-1)
   */
  async calculateSkillsScore(userProfile, job) {
    const userSkills = userProfile.skills || [];
    const jobSkills = job.skills || [];
    
    if (jobSkills.length === 0) return 0.5; // Neutral score if no skills specified
    if (userSkills.length === 0) return 0.2; // Low score if user has no skills

    // Direct skill matches
    const directMatches = jobSkills.filter(jobSkill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase()) ||
        jobSkill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    // Category-based matches
    const categoryMatches = this.calculateCategoryMatches(userSkills, jobSkills);
    
    // Calculate score
    const directScore = directMatches.length / jobSkills.length;
    const categoryScore = categoryMatches / jobSkills.length;
    
    // Weighted combination
    const skillsScore = (directScore * 0.8) + (categoryScore * 0.2);
    
    // Bonus for having more skills than required
    const skillsBonus = userSkills.length > jobSkills.length ? 0.1 : 0;
    
    return Math.min(skillsScore + skillsBonus, 1.0);
  }

  /**
   * Calculate category-based skill matches
   * @param {Array} userSkills - User skills
   * @param {Array} jobSkills - Job skills
   * @returns {number} Number of category matches
   */
  calculateCategoryMatches(userSkills, jobSkills) {
    let matches = 0;
    
    for (const [category, categorySkills] of Object.entries(this.skillCategories)) {
      const userHasCategory = userSkills.some(skill => 
        categorySkills.some(catSkill => 
          skill.toLowerCase().includes(catSkill.toLowerCase())
        )
      );
      
      const jobNeedsCategory = jobSkills.some(skill => 
        categorySkills.some(catSkill => 
          skill.toLowerCase().includes(catSkill.toLowerCase())
        )
      );
      
      if (userHasCategory && jobNeedsCategory) {
        matches++;
      }
    }
    
    return matches;
  }

  /**
   * Calculate experience level compatibility score
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Experience score (0-1)
   */
  calculateExperienceScore(userProfile, job) {
    const userLevel = this.experienceLevelMapping[userProfile.experience_level] || 1;
    const jobLevel = this.experienceLevelMapping[job.experience_level] || 1;
    
    const difference = Math.abs(userLevel - jobLevel);
    
    // Perfect match
    if (difference === 0) return 1.0;
    
    // One level difference
    if (difference === 1) return 0.8;
    
    // Two levels difference
    if (difference === 2) return 0.5;
    
    // Three levels difference
    return 0.2;
  }

  /**
   * Calculate location compatibility score
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Location score (0-1)
   */
  calculateLocationScore(userProfile, job) {
    const userLocation = userProfile.location?.toLowerCase() || '';
    const jobLocation = job.location?.toLowerCase() || '';
    const userRemotePreference = userProfile.remote_preference || 'hybrid';
    const jobRemoteType = job.remote_type || 'on_site';

    // Remote work preferences
    if (jobRemoteType === 'remote') {
      if (userRemotePreference === 'remote') return 1.0;
      if (userRemotePreference === 'hybrid') return 0.9;
      return 0.7; // Still good for on-site preference
    }

    if (jobRemoteType === 'hybrid') {
      if (userRemotePreference === 'hybrid') return 1.0;
      if (userRemotePreference === 'remote') return 0.8;
      if (userRemotePreference === 'on_site') return 0.9;
    }

    // On-site location matching
    if (jobRemoteType === 'on_site') {
      if (userRemotePreference === 'remote') return 0.3;
      
      // Location string matching
      if (userLocation && jobLocation) {
        if (userLocation === jobLocation) return 1.0;
        
        // City matching
        const userCity = userLocation.split(',')[0].trim();
        const jobCity = jobLocation.split(',')[0].trim();
        
        if (userCity === jobCity) return 0.9;
        
        // State/region matching
        if (userLocation.includes(jobLocation) || jobLocation.includes(userLocation)) {
          return 0.6;
        }
      }
      
      return 0.4; // Default for on-site without location match
    }

    return 0.5; // Default neutral score
  }

  /**
   * Calculate salary compatibility score
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Salary score (0-1)
   */
  calculateSalaryScore(userProfile, job) {
    const userMinSalary = userProfile.salary_expectation_min || 0;
    const userMaxSalary = userProfile.salary_expectation_max || Infinity;
    const jobMinSalary = job.salary_min || 0;
    const jobMaxSalary = job.salary_max || 0;

    // If no salary information available
    if (!jobMinSalary && !jobMaxSalary) return 0.5;
    if (!userMinSalary && !userMaxSalary) return 0.5;

    // Calculate overlap
    const jobSalaryRange = jobMaxSalary - jobMinSalary;
    const userSalaryRange = userMaxSalary - userMinSalary;
    
    // Check if ranges overlap
    const overlapStart = Math.max(userMinSalary, jobMinSalary);
    const overlapEnd = Math.min(userMaxSalary, jobMaxSalary);
    
    if (overlapStart <= overlapEnd) {
      const overlapSize = overlapEnd - overlapStart;
      const avgRange = (jobSalaryRange + userSalaryRange) / 2;
      
      if (avgRange === 0) return 1.0; // Both have same single salary
      
      const overlapRatio = overlapSize / avgRange;
      return Math.min(overlapRatio, 1.0);
    }
    
    // No overlap - calculate distance penalty
    const distance = overlapStart - overlapEnd;
    const avgSalary = (userMinSalary + userMaxSalary + jobMinSalary + jobMaxSalary) / 4;
    
    if (avgSalary === 0) return 0.5;
    
    const distanceRatio = distance / avgSalary;
    
    // Exponential decay for distance penalty
    return Math.max(0.1, Math.exp(-distanceRatio));
  }

  /**
   * Calculate culture compatibility score
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Culture score (0-1)
   */
  calculateCultureScore(userProfile, job) {
    // This is a simplified implementation
    // In practice, you'd use more sophisticated culture matching
    
    const userPreferences = userProfile.culture_preferences || [];
    const jobCulture = job.categories || [];
    const companyBenefits = job.company?.benefits || [];
    
    if (userPreferences.length === 0) return 0.5;
    
    let matches = 0;
    let total = userPreferences.length;
    
    for (const preference of userPreferences) {
      const prefLower = preference.toLowerCase();
      
      // Check job categories
      const categoryMatch = jobCulture.some(cat => 
        cat.toLowerCase().includes(prefLower) || 
        prefLower.includes(cat.toLowerCase())
      );
      
      // Check company benefits
      const benefitMatch = companyBenefits.some(benefit => 
        benefit.toLowerCase().includes(prefLower) || 
        prefLower.includes(benefit.toLowerCase())
      );
      
      if (categoryMatch || benefitMatch) {
        matches++;
      }
    }
    
    return matches / total;
  }

  /**
   * Generate detailed match factors
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @param {Object} scores - Calculated scores
   * @returns {Object} Match factors
   */
  generateMatchFactors(userProfile, job, scores) {
    const factors = {
      strengths: [],
      concerns: [],
      skill_matches: [],
      skill_gaps: [],
      location_match: '',
      salary_match: '',
      experience_match: ''
    };

    // Analyze strengths
    if (scores.skills >= 0.8) factors.strengths.push('Excellent skill match');
    if (scores.experience >= 0.8) factors.strengths.push('Perfect experience level');
    if (scores.location >= 0.9) factors.strengths.push('Ideal location match');
    if (scores.salary >= 0.8) factors.strengths.push('Salary expectations aligned');

    // Analyze concerns
    if (scores.skills < 0.5) factors.concerns.push('Limited skill overlap');
    if (scores.experience < 0.5) factors.concerns.push('Experience level mismatch');
    if (scores.location < 0.4) factors.concerns.push('Location preferences not aligned');
    if (scores.salary < 0.4) factors.concerns.push('Salary expectations may not match');

    // Skill analysis
    const userSkills = userProfile.skills || [];
    const jobSkills = job.skills || [];
    
    factors.skill_matches = jobSkills.filter(jobSkill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );
    
    factors.skill_gaps = jobSkills.filter(jobSkill => 
      !userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    // Location analysis
    factors.location_match = this.getLocationMatchDescription(userProfile, job);
    
    // Salary analysis
    factors.salary_match = this.getSalaryMatchDescription(userProfile, job);
    
    // Experience analysis
    factors.experience_match = this.getExperienceMatchDescription(userProfile, job);

    return factors;
  }

  /**
   * Generate recommendation reason
   * @param {Object} matchScore - Match score data
   * @returns {string} Recommendation reason
   */
  generateRecommendationReason(matchScore) {
    const reasons = [];
    
    if (matchScore.skills >= 0.8) {
      reasons.push('strong skill alignment');
    }
    
    if (matchScore.experience >= 0.8) {
      reasons.push('perfect experience match');
    }
    
    if (matchScore.location >= 0.9) {
      reasons.push('ideal location');
    }
    
    if (matchScore.salary >= 0.8) {
      reasons.push('competitive compensation');
    }
    
    if (reasons.length === 0) {
      reasons.push('good overall compatibility');
    }
    
    return `Recommended based on ${reasons.join(', ')}.`;
  }

  /**
   * Get location match description
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {string} Location match description
   */
  getLocationMatchDescription(userProfile, job) {
    const jobRemoteType = job.remote_type || 'on_site';
    const userRemotePreference = userProfile.remote_preference || 'hybrid';
    
    if (jobRemoteType === 'remote') {
      return 'Fully remote position';
    }
    
    if (jobRemoteType === 'hybrid') {
      return 'Hybrid work arrangement available';
    }
    
    return `On-site position in ${job.location || 'specified location'}`;
  }

  /**
   * Get salary match description
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {string} Salary match description
   */
  getSalaryMatchDescription(userProfile, job) {
    const jobMin = job.salary_min;
    const jobMax = job.salary_max;
    
    if (!jobMin && !jobMax) {
      return 'Salary not specified';
    }
    
    if (jobMin && jobMax) {
      return `Salary range: $${jobMin.toLocaleString()} - $${jobMax.toLocaleString()}`;
    }
    
    if (jobMin) {
      return `Starting from $${jobMin.toLocaleString()}`;
    }
    
    return `Up to $${jobMax.toLocaleString()}`;
  }

  /**
   * Get experience match description
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {string} Experience match description
   */
  getExperienceMatchDescription(userProfile, job) {
    const userLevel = userProfile.experience_level || 'mid';
    const jobLevel = job.experience_level || 'mid';
    
    if (userLevel === jobLevel) {
      return `Perfect match for ${jobLevel} level`;
    }
    
    return `Seeking ${jobLevel} level (you have ${userLevel} level)`;
  }

  /**
   * Update match scores for existing matches
   * @param {number} userId - User ID
   * @param {Object} userProfile - Updated user profile
   * @returns {Array} Updated matches
   */
  async updateExistingMatches(userId, userProfile) {
    try {
      const existingMatches = await JobMatch.findAll({
        where: { user_id: userId, is_active: true },
        include: [{ association: 'job', include: ['company'] }]
      });

      const updatedMatches = [];

      for (const match of existingMatches) {
        const newScore = await this.calculateCompatibilityScore(userProfile, match.job);
        
        await match.update({
          compatibility_score: newScore.overall,
          skills_score: newScore.skills,
          experience_score: newScore.experience,
          location_score: newScore.location,
          salary_score: newScore.salary,
          culture_score: newScore.culture,
          match_factors: newScore.factors,
          recommendation_reason: this.generateRecommendationReason(newScore),
          match_version: '2.0'
        });

        updatedMatches.push(match);
      }

      logger.info(`Updated ${updatedMatches.length} existing matches for user ${userId}`);
      return updatedMatches;

    } catch (error) {
      logger.error(`Error updating existing matches for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get match analytics for a user
   * @param {number} userId - User ID
   * @returns {Object} Match analytics
   */
  async getMatchAnalytics(userId) {
    try {
      const matches = await JobMatch.findAll({
        where: { user_id: userId },
        include: [{ association: 'job' }]
      });

      const analytics = {
        total_matches: matches.length,
        avg_compatibility_score: 0,
        top_skills: {},
        location_distribution: {},
        salary_ranges: [],
        experience_levels: {},
        match_quality_distribution: {
          excellent: 0, // >= 0.8
          good: 0,      // 0.6 - 0.79
          fair: 0,      // 0.4 - 0.59
          poor: 0       // < 0.4
        }
      };

      if (matches.length === 0) return analytics;

      // Calculate average compatibility score
      const totalScore = matches.reduce((sum, match) => sum + match.compatibility_score, 0);
      analytics.avg_compatibility_score = totalScore / matches.length;

      // Analyze matches
      for (const match of matches) {
        const job = match.job;
        
        // Quality distribution
        if (match.compatibility_score >= 0.8) analytics.match_quality_distribution.excellent++;
        else if (match.compatibility_score >= 0.6) analytics.match_quality_distribution.good++;
        else if (match.compatibility_score >= 0.4) analytics.match_quality_distribution.fair++;
        else analytics.match_quality_distribution.poor++;

        // Skills analysis
        if (job.skills) {
          job.skills.forEach(skill => {
            analytics.top_skills[skill] = (analytics.top_skills[skill] || 0) + 1;
          });
        }

        // Location distribution
        const location = job.location || 'Unknown';
        analytics.location_distribution[location] = (analytics.location_distribution[location] || 0) + 1;

        // Experience levels
        const expLevel = job.experience_level || 'mid';
        analytics.experience_levels[expLevel] = (analytics.experience_levels[expLevel] || 0) + 1;

        // Salary ranges
        if (job.salary_min && job.salary_max) {
          analytics.salary_ranges.push({
            min: job.salary_min,
            max: job.salary_max,
            job_title: job.title
          });
        }
      }

      return analytics;

    } catch (error) {
      logger.error(`Error getting match analytics for user ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = JobMatchingService;
