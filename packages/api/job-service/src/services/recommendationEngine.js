/**
 * Advanced Recommendation Engine
 * Implements machine learning-based job recommendations with collaborative filtering
 * and content-based filtering approaches
 */

const { Op } = require('sequelize');
const { Job, JobMatch, Application, Company } = require('../models');
const logger = require('../utils/logger');

class RecommendationEngine {
  constructor() {
    this.userItemMatrix = new Map(); // User-Job interaction matrix
    this.itemFeatures = new Map();   // Job feature vectors
    this.userProfiles = new Map();   // User preference profiles
    
    // Recommendation weights
    this.weights = {
      collaborative: 0.4,
      content_based: 0.3,
      popularity: 0.2,
      diversity: 0.1
    };
    
    // Learning parameters
    this.learningRate = 0.01;
    this.regularization = 0.001;
    this.factors = 50; // Number of latent factors for matrix factorization
  }

  /**
   * Generate personalized job recommendations
   * @param {number} userId - User ID
   * @param {Object} userProfile - User profile data
   * @param {Object} options - Recommendation options
   * @returns {Array} Recommended jobs
   */
  async generateRecommendations(userId, userProfile, options = {}) {
    try {
      logger.info(`Generating recommendations for user ${userId}`);
      
      const {
        limit = 20,
        diversityFactor = 0.3,
        includeExploration = true,
        excludeApplied = true,
        minScore = 0.1
      } = options;

      // Get user interaction history
      const userHistory = await this.getUserInteractionHistory(userId);
      
      // Update user profile in memory
      this.updateUserProfile(userId, userProfile, userHistory);

      // Get candidate jobs
      const candidateJobs = await this.getCandidateJobs(userId, excludeApplied);
      
      if (candidateJobs.length === 0) {
        return [];
      }

      // Generate recommendations using different approaches
      const collaborativeRecs = await this.generateCollaborativeRecommendations(userId, candidateJobs);
      const contentBasedRecs = await this.generateContentBasedRecommendations(userId, userProfile, candidateJobs);
      const popularityRecs = await this.generatePopularityBasedRecommendations(candidateJobs);
      
      // Combine recommendations
      const combinedRecs = this.combineRecommendations({
        collaborative: collaborativeRecs,
        contentBased: contentBasedRecs,
        popularity: popularityRecs
      });

      // Apply diversity and exploration
      let finalRecs = this.applyDiversification(combinedRecs, diversityFactor);
      
      if (includeExploration) {
        finalRecs = this.addExplorationItems(finalRecs, candidateJobs, 0.2);
      }

      // Filter by minimum score and limit
      finalRecs = finalRecs
        .filter(rec => rec.score >= minScore)
        .slice(0, limit);

      // Log recommendation for learning
      await this.logRecommendations(userId, finalRecs);

      logger.info(`Generated ${finalRecs.length} recommendations for user ${userId}`);
      return finalRecs;

    } catch (error) {
      logger.error(`Error generating recommendations for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user interaction history
   * @param {number} userId - User ID
   * @returns {Object} User interaction history
   */
  async getUserInteractionHistory(userId) {
    const [applications, matches] = await Promise.all([
      Application.findAll({
        where: { user_id: userId },
        include: [{ association: 'job' }],
        order: [['created_at', 'DESC']]
      }),
      JobMatch.findAll({
        where: { user_id: userId },
        include: [{ association: 'job' }],
        order: [['created_at', 'DESC']]
      })
    ]);

    return {
      applications: applications.map(app => ({
        job_id: app.job_id,
        action: 'applied',
        timestamp: app.created_at,
        job: app.job
      })),
      interactions: matches.map(match => ({
        job_id: match.job_id,
        action: match.user_action || 'viewed',
        score: match.compatibility_score,
        timestamp: match.action_date || match.created_at,
        job: match.job
      }))
    };
  }

  /**
   * Update user profile in memory for faster access
   * @param {number} userId - User ID
   * @param {Object} userProfile - User profile
   * @param {Object} userHistory - User interaction history
   */
  updateUserProfile(userId, userProfile, userHistory) {
    const profile = {
      ...userProfile,
      preferences: this.extractUserPreferences(userHistory),
      interaction_count: userHistory.applications.length + userHistory.interactions.length,
      last_activity: new Date()
    };

    this.userProfiles.set(userId, profile);
  }

  /**
   * Extract user preferences from interaction history
   * @param {Object} userHistory - User interaction history
   * @returns {Object} Extracted preferences
   */
  extractUserPreferences(userHistory) {
    const preferences = {
      preferred_companies: {},
      preferred_skills: {},
      preferred_locations: {},
      preferred_experience_levels: {},
      preferred_remote_types: {},
      salary_preferences: { min: 0, max: 0 }
    };

    const allInteractions = [
      ...userHistory.applications,
      ...userHistory.interactions.filter(i => ['liked', 'saved', 'applied'].includes(i.action))
    ];

    for (const interaction of allInteractions) {
      const job = interaction.job;
      if (!job) continue;

      // Company preferences
      if (job.company_name) {
        preferences.preferred_companies[job.company_name] = 
          (preferences.preferred_companies[job.company_name] || 0) + 1;
      }

      // Skill preferences
      if (job.skills) {
        job.skills.forEach(skill => {
          preferences.preferred_skills[skill] = 
            (preferences.preferred_skills[skill] || 0) + 1;
        });
      }

      // Location preferences
      if (job.location) {
        preferences.preferred_locations[job.location] = 
          (preferences.preferred_locations[job.location] || 0) + 1;
      }

      // Experience level preferences
      if (job.experience_level) {
        preferences.preferred_experience_levels[job.experience_level] = 
          (preferences.preferred_experience_levels[job.experience_level] || 0) + 1;
      }

      // Remote type preferences
      if (job.remote_type) {
        preferences.preferred_remote_types[job.remote_type] = 
          (preferences.preferred_remote_types[job.remote_type] || 0) + 1;
      }

      // Salary preferences
      if (job.salary_min && job.salary_max) {
        const avgSalary = (job.salary_min + job.salary_max) / 2;
        if (preferences.salary_preferences.min === 0 || avgSalary < preferences.salary_preferences.min) {
          preferences.salary_preferences.min = job.salary_min;
        }
        if (avgSalary > preferences.salary_preferences.max) {
          preferences.salary_preferences.max = job.salary_max;
        }
      }
    }

    return preferences;
  }

  /**
   * Generate collaborative filtering recommendations
   * @param {number} userId - User ID
   * @param {Array} candidateJobs - Candidate jobs
   * @returns {Array} Collaborative recommendations
   */
  async generateCollaborativeRecommendations(userId, candidateJobs) {
    try {
      // Find similar users based on interaction patterns
      const similarUsers = await this.findSimilarUsers(userId);
      
      if (similarUsers.length === 0) {
        return candidateJobs.map(job => ({ job, score: 0.5, reason: 'No similar users found' }));
      }

      const recommendations = [];

      for (const job of candidateJobs) {
        let score = 0;
        let totalWeight = 0;

        // Calculate weighted score based on similar users' interactions
        for (const similarUser of similarUsers) {
          const userInteraction = await this.getUserJobInteraction(similarUser.user_id, job.id);
          
          if (userInteraction) {
            const weight = similarUser.similarity;
            score += userInteraction.score * weight;
            totalWeight += weight;
          }
        }

        const finalScore = totalWeight > 0 ? score / totalWeight : 0.3;
        
        recommendations.push({
          job,
          score: finalScore,
          reason: `Based on ${similarUsers.length} similar users`,
          type: 'collaborative'
        });
      }

      return recommendations.sort((a, b) => b.score - a.score);

    } catch (error) {
      logger.error('Error generating collaborative recommendations:', error);
      return [];
    }
  }

  /**
   * Find users with similar interaction patterns
   * @param {number} userId - Target user ID
   * @returns {Array} Similar users with similarity scores
   */
  async findSimilarUsers(userId, limit = 50) {
    try {
      // Get user's interaction vector
      const userInteractions = await this.getUserInteractionVector(userId);
      
      if (Object.keys(userInteractions).length === 0) {
        return [];
      }

      // Get other users' interactions
      const otherUsers = await JobMatch.findAll({
        where: {
          user_id: { [Op.ne]: userId },
          user_action: { [Op.in]: ['liked', 'saved', 'applied'] }
        },
        attributes: ['user_id'],
        group: ['user_id'],
        having: sequelize.literal('COUNT(*) >= 3') // Users with at least 3 interactions
      });

      const similarities = [];

      for (const user of otherUsers) {
        const otherUserInteractions = await this.getUserInteractionVector(user.user_id);
        const similarity = this.calculateCosineSimilarity(userInteractions, otherUserInteractions);
        
        if (similarity > 0.1) { // Minimum similarity threshold
          similarities.push({
            user_id: user.user_id,
            similarity
          });
        }
      }

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get user interaction vector for similarity calculation
   * @param {number} userId - User ID
   * @returns {Object} Interaction vector
   */
  async getUserInteractionVector(userId) {
    const interactions = await JobMatch.findAll({
      where: { 
        user_id: userId,
        user_action: { [Op.in]: ['liked', 'saved', 'applied', 'disliked'] }
      }
    });

    const vector = {};
    
    for (const interaction of interactions) {
      const score = this.getInteractionScore(interaction.user_action);
      vector[interaction.job_id] = score;
    }

    return vector;
  }

  /**
   * Get numerical score for interaction type
   * @param {string} action - User action
   * @returns {number} Interaction score
   */
  getInteractionScore(action) {
    const scores = {
      'applied': 1.0,
      'liked': 0.8,
      'saved': 0.6,
      'viewed': 0.3,
      'disliked': -0.5,
      'ignored': -0.2
    };
    
    return scores[action] || 0;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Object} vectorA - First vector
   * @param {Object} vectorB - Second vector
   * @returns {number} Cosine similarity
   */
  calculateCosineSimilarity(vectorA, vectorB) {
    const keysA = Object.keys(vectorA);
    const keysB = Object.keys(vectorB);
    const commonKeys = keysA.filter(key => keysB.includes(key));

    if (commonKeys.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const key of commonKeys) {
      dotProduct += vectorA[key] * vectorB[key];
    }

    for (const key of keysA) {
      normA += vectorA[key] * vectorA[key];
    }

    for (const key of keysB) {
      normB += vectorB[key] * vectorB[key];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate content-based recommendations
   * @param {number} userId - User ID
   * @param {Object} userProfile - User profile
   * @param {Array} candidateJobs - Candidate jobs
   * @returns {Array} Content-based recommendations
   */
  async generateContentBasedRecommendations(userId, userProfile, candidateJobs) {
    const recommendations = [];

    for (const job of candidateJobs) {
      const score = this.calculateContentSimilarity(userProfile, job);
      
      recommendations.push({
        job,
        score,
        reason: 'Based on your profile and preferences',
        type: 'content_based'
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate content similarity between user profile and job
   * @param {Object} userProfile - User profile
   * @param {Object} job - Job data
   * @returns {number} Content similarity score
   */
  calculateContentSimilarity(userProfile, job) {
    let score = 0;
    let factors = 0;

    // Skills similarity
    const skillsSimilarity = this.calculateSkillsSimilarity(userProfile.skills || [], job.skills || []);
    score += skillsSimilarity * 0.4;
    factors++;

    // Experience level match
    if (userProfile.experience_level && job.experience_level) {
      const expMatch = userProfile.experience_level === job.experience_level ? 1 : 0.5;
      score += expMatch * 0.2;
      factors++;
    }

    // Location preference
    if (userProfile.location && job.location) {
      const locationMatch = userProfile.location.toLowerCase().includes(job.location.toLowerCase()) ||
                           job.location.toLowerCase().includes(userProfile.location.toLowerCase()) ? 1 : 0.3;
      score += locationMatch * 0.2;
      factors++;
    }

    // Remote work preference
    if (userProfile.remote_preference && job.remote_type) {
      const remoteMatch = userProfile.remote_preference === job.remote_type ? 1 : 0.5;
      score += remoteMatch * 0.2;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate skills similarity using Jaccard similarity
   * @param {Array} userSkills - User skills
   * @param {Array} jobSkills - Job skills
   * @returns {number} Skills similarity
   */
  calculateSkillsSimilarity(userSkills, jobSkills) {
    if (userSkills.length === 0 || jobSkills.length === 0) return 0.3;

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const jobSkillsLower = jobSkills.map(s => s.toLowerCase());

    const intersection = userSkillsLower.filter(skill => 
      jobSkillsLower.some(jobSkill => 
        skill.includes(jobSkill) || jobSkill.includes(skill)
      )
    );

    const union = [...new Set([...userSkillsLower, ...jobSkillsLower])];

    return intersection.length / union.length;
  }

  /**
   * Generate popularity-based recommendations
   * @param {Array} candidateJobs - Candidate jobs
   * @returns {Array} Popularity-based recommendations
   */
  async generatePopularityBasedRecommendations(candidateJobs) {
    const recommendations = [];

    for (const job of candidateJobs) {
      // Calculate popularity score based on views, applications, and recency
      const popularityScore = this.calculatePopularityScore(job);
      
      recommendations.push({
        job,
        score: popularityScore,
        reason: 'Popular job with high engagement',
        type: 'popularity'
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate popularity score for a job
   * @param {Object} job - Job data
   * @returns {number} Popularity score
   */
  calculatePopularityScore(job) {
    const now = new Date();
    const postedDate = new Date(job.posted_date);
    const daysSincePosted = (now - postedDate) / (1000 * 60 * 60 * 24);

    // Recency factor (newer jobs get higher score)
    const recencyFactor = Math.max(0.1, 1 - (daysSincePosted / 30));

    // Engagement factor
    const viewCount = job.view_count || 0;
    const applicationCount = job.application_count || 0;
    const engagementScore = Math.min(1, (viewCount * 0.1 + applicationCount * 2) / 100);

    // Company factor
    const companyFactor = job.company?.is_verified ? 1.2 : 1.0;

    return (recencyFactor * 0.4 + engagementScore * 0.4 + 0.2) * companyFactor;
  }

  /**
   * Combine recommendations from different approaches
   * @param {Object} recommendations - Recommendations from different approaches
   * @returns {Array} Combined recommendations
   */
  combineRecommendations(recommendations) {
    const jobScores = new Map();

    // Combine scores from different approaches
    for (const [approach, recs] of Object.entries(recommendations)) {
      const weight = this.weights[approach === 'contentBased' ? 'content_based' : approach] || 0;
      
      for (const rec of recs) {
        const jobId = rec.job.id;
        const currentScore = jobScores.get(jobId) || { job: rec.job, totalScore: 0, reasons: [] };
        
        currentScore.totalScore += rec.score * weight;
        currentScore.reasons.push(rec.reason);
        
        jobScores.set(jobId, currentScore);
      }
    }

    // Convert to array and sort
    return Array.from(jobScores.values())
      .map(item => ({
        job: item.job,
        score: item.totalScore,
        reason: item.reasons.join('; '),
        type: 'combined'
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Apply diversification to recommendations
   * @param {Array} recommendations - Sorted recommendations
   * @param {number} diversityFactor - Diversity factor (0-1)
   * @returns {Array} Diversified recommendations
   */
  applyDiversification(recommendations, diversityFactor) {
    if (diversityFactor === 0 || recommendations.length <= 1) {
      return recommendations;
    }

    const diversified = [];
    const used = new Set();
    const categories = new Set();
    const companies = new Set();

    for (const rec of recommendations) {
      if (used.has(rec.job.id)) continue;

      const jobCategories = rec.job.categories || [];
      const company = rec.job.company_name;

      // Check diversity constraints
      const categoryOverlap = jobCategories.some(cat => categories.has(cat));
      const companyOverlap = companies.has(company);

      // Apply diversity penalty
      let diversityPenalty = 0;
      if (categoryOverlap) diversityPenalty += 0.2;
      if (companyOverlap) diversityPenalty += 0.1;

      const adjustedScore = rec.score * (1 - diversityPenalty * diversityFactor);

      diversified.push({
        ...rec,
        score: adjustedScore,
        originalScore: rec.score
      });

      used.add(rec.job.id);
      jobCategories.forEach(cat => categories.add(cat));
      if (company) companies.add(company);
    }

    return diversified.sort((a, b) => b.score - a.score);
  }

  /**
   * Add exploration items to recommendations
   * @param {Array} recommendations - Current recommendations
   * @param {Array} candidateJobs - All candidate jobs
   * @param {number} explorationRatio - Ratio of exploration items
   * @returns {Array} Recommendations with exploration items
   */
  addExplorationItems(recommendations, candidateJobs, explorationRatio) {
    const numExploration = Math.floor(recommendations.length * explorationRatio);
    
    if (numExploration === 0) return recommendations;

    const recommendedJobIds = new Set(recommendations.map(rec => rec.job.id));
    const explorationCandidates = candidateJobs.filter(job => !recommendedJobIds.has(job.id));

    // Randomly select exploration items
    const explorationItems = [];
    for (let i = 0; i < Math.min(numExploration, explorationCandidates.length); i++) {
      const randomIndex = Math.floor(Math.random() * explorationCandidates.length);
      const job = explorationCandidates.splice(randomIndex, 1)[0];
      
      explorationItems.push({
        job,
        score: 0.4 + Math.random() * 0.3, // Random score between 0.4-0.7
        reason: 'Explore new opportunities',
        type: 'exploration'
      });
    }

    // Insert exploration items at random positions
    const combined = [...recommendations];
    for (const item of explorationItems) {
      const insertIndex = Math.floor(Math.random() * (combined.length + 1));
      combined.splice(insertIndex, 0, item);
    }

    return combined;
  }

  /**
   * Get candidate jobs for recommendations
   * @param {number} userId - User ID
   * @param {boolean} excludeApplied - Exclude applied jobs
   * @returns {Array} Candidate jobs
   */
  async getCandidateJobs(userId, excludeApplied = true) {
    const whereClause = {
      is_active: true,
      expires_date: { [Op.gt]: new Date() }
    };

    if (excludeApplied) {
      const appliedJobIds = await Application.findAll({
        where: { user_id: userId },
        attributes: ['job_id']
      }).then(apps => apps.map(app => app.job_id));

      if (appliedJobIds.length > 0) {
        whereClause.id = { [Op.notIn]: appliedJobIds };
      }
    }

    return await Job.findAll({
      where: whereClause,
      include: [{ association: 'company', required: false }],
      order: [['posted_date', 'DESC']],
      limit: 1000 // Reasonable limit for candidate pool
    });
  }

  /**
   * Get user-job interaction data
   * @param {number} userId - User ID
   * @param {number} jobId - Job ID
   * @returns {Object|null} Interaction data
   */
  async getUserJobInteraction(userId, jobId) {
    const match = await JobMatch.findOne({
      where: { user_id: userId, job_id: jobId }
    });

    if (!match) return null;

    return {
      score: this.getInteractionScore(match.user_action || 'viewed'),
      action: match.user_action,
      timestamp: match.action_date || match.created_at
    };
  }

  /**
   * Log recommendations for learning and analytics
   * @param {number} userId - User ID
   * @param {Array} recommendations - Generated recommendations
   */
  async logRecommendations(userId, recommendations) {
    try {
      // This would typically log to a separate recommendations table
      // For now, we'll just log the count
      logger.info(`Logged ${recommendations.length} recommendations for user ${userId}`);
      
      // In a production system, you might:
      // 1. Store recommendations in a cache for quick access
      // 2. Log recommendation events for A/B testing
      // 3. Track recommendation performance metrics
      
    } catch (error) {
      logger.error('Error logging recommendations:', error);
    }
  }

  /**
   * Learn from user feedback on recommendations
   * @param {number} userId - User ID
   * @param {number} jobId - Job ID
   * @param {string} feedback - User feedback (liked, disliked, applied, etc.)
   */
  async learnFromFeedback(userId, jobId, feedback) {
    try {
      // Update user-item interaction matrix
      const interactionScore = this.getInteractionScore(feedback);
      
      // This would update the recommendation model
      // For now, we'll just log the feedback
      logger.info(`Learning from feedback: User ${userId}, Job ${jobId}, Feedback: ${feedback}, Score: ${interactionScore}`);
      
      // In a production system, you might:
      // 1. Update matrix factorization models
      // 2. Retrain content-based models
      // 3. Update user preference profiles
      // 4. Adjust recommendation weights based on performance
      
    } catch (error) {
      logger.error('Error learning from feedback:', error);
    }
  }

  /**
   * Get recommendation performance metrics
   * @param {number} userId - User ID (optional, for user-specific metrics)
   * @returns {Object} Performance metrics
   */
  async getPerformanceMetrics(userId = null) {
    try {
      const whereClause = userId ? { user_id: userId } : {};
      
      const matches = await JobMatch.findAll({
        where: {
          ...whereClause,
          shown_to_user: true
        }
      });

      const metrics = {
        total_shown: matches.length,
        total_interactions: 0,
        click_through_rate: 0,
        application_rate: 0,
        avg_compatibility_score: 0,
        feedback_distribution: {}
      };

      if (matches.length === 0) return metrics;

      let totalScore = 0;
      let interactionCount = 0;
      let applicationCount = 0;

      for (const match of matches) {
        totalScore += match.compatibility_score;
        
        if (match.user_action) {
          interactionCount++;
          
          if (match.user_action === 'applied') {
            applicationCount++;
          }
          
          metrics.feedback_distribution[match.user_action] = 
            (metrics.feedback_distribution[match.user_action] || 0) + 1;
        }
      }

      metrics.total_interactions = interactionCount;
      metrics.click_through_rate = interactionCount / matches.length;
      metrics.application_rate = applicationCount / matches.length;
      metrics.avg_compatibility_score = totalScore / matches.length;

      return metrics;

    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      return {};
    }
  }
}

module.exports = RecommendationEngine;
