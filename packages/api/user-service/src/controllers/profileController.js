const { User, JobSeekerProfile } = require('../models');
const { sanitizers } = require('../utils/validation');

class ProfileController {
  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            model: JobSeekerProfile,
            as: 'jobSeekerProfile',
          },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'USER_NOT_FOUND',
        });
      }

      // Check if profile is public or user owns it
      const isOwner = req.user && req.user.id === user.id;
      const isAdmin = req.user && req.user.role === 'admin';
      const isPublic = user.jobSeekerProfile?.is_public;

      if (!isOwner && !isAdmin && !isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Profile is private',
          error: 'PRIVATE_PROFILE',
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: 'GET_PROFILE_FAILED',
      });
    }
  }

  /**
   * Update job seeker profile
   */
  async updateJobSeekerProfile(req, res) {
    try {
      const {
        firstName,
        lastName,
        phone,
        location,
        bio,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        yearsExperience,
        salaryExpectation,
        skills,
        education,
        experience,
        certifications,
        languages,
        availability,
        jobPreferences,
        isPublic,
      } = req.body;

      // Find or create profile
      let profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        profile = await JobSeekerProfile.create({
          user_id: req.user.id,
        });
      }

      // Sanitize and prepare update data
      const updateData = {};
      
      if (firstName !== undefined) updateData.first_name = sanitizers.sanitizeString(firstName);
      if (lastName !== undefined) updateData.last_name = sanitizers.sanitizeString(lastName);
      if (phone !== undefined) updateData.phone = sanitizers.sanitizePhone(phone);
      if (location !== undefined) updateData.location = sanitizers.sanitizeString(location);
      if (bio !== undefined) updateData.bio = sanitizers.sanitizeString(bio);
      if (linkedinUrl !== undefined) updateData.linkedin_url = sanitizers.sanitizeUrl(linkedinUrl);
      if (githubUrl !== undefined) updateData.github_url = sanitizers.sanitizeUrl(githubUrl);
      if (portfolioUrl !== undefined) updateData.portfolio_url = sanitizers.sanitizeUrl(portfolioUrl);
      if (yearsExperience !== undefined) updateData.years_experience = yearsExperience;
      if (salaryExpectation !== undefined) updateData.salary_expectation = salaryExpectation;
      if (skills !== undefined) updateData.skills = skills;
      if (education !== undefined) updateData.education = education;
      if (experience !== undefined) updateData.experience = experience;
      if (certifications !== undefined) updateData.certifications = certifications;
      if (languages !== undefined) updateData.languages = languages;
      if (availability !== undefined) updateData.availability = availability;
      if (jobPreferences !== undefined) updateData.job_preferences = jobPreferences;
      if (isPublic !== undefined) updateData.is_public = isPublic;

      // Update profile
      await profile.update(updateData);

      // Reload with fresh data
      await profile.reload();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          profile: profile.toJSON(),
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: 'UPDATE_PROFILE_FAILED',
      });
    }
  }

  /**
   * Add skill to profile
   */
  async addSkill(req, res) {
    try {
      const { name, level = 'intermediate' } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Skill name is required',
          error: 'SKILL_NAME_REQUIRED',
        });
      }

      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      await profile.addSkill({ name: sanitizers.sanitizeString(name), level });

      res.json({
        success: true,
        message: 'Skill added successfully',
        data: {
          skills: profile.skills,
        },
      });
    } catch (error) {
      console.error('Add skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add skill',
        error: 'ADD_SKILL_FAILED',
      });
    }
  }

  /**
   * Remove skill from profile
   */
  async removeSkill(req, res) {
    try {
      const { skillName } = req.params;

      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      await profile.removeSkill(skillName);

      res.json({
        success: true,
        message: 'Skill removed successfully',
        data: {
          skills: profile.skills,
        },
      });
    } catch (error) {
      console.error('Remove skill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove skill',
        error: 'REMOVE_SKILL_FAILED',
      });
    }
  }

  /**
   * Upload resume
   */
  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Resume file is required',
          error: 'FILE_REQUIRED',
        });
      }

      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      // In a real application, you would upload to cloud storage (AWS S3, etc.)
      // For now, we'll store the file path
      const resumeUrl = `/uploads/resumes/${req.file.filename}`;

      await profile.update({ resume_url: resumeUrl });

      res.json({
        success: true,
        message: 'Resume uploaded successfully',
        data: {
          resumeUrl,
        },
      });
    } catch (error) {
      console.error('Upload resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload resume',
        error: 'UPLOAD_RESUME_FAILED',
      });
    }
  }

  /**
   * Search profiles (public profiles only)
   */
  async searchProfiles(req, res) {
    try {
      const {
        search,
        skills,
        location,
        yearsExperience,
        availability,
        page = 1,
        limit = 20,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { is_public: true };
      const userWhere = { is_active: true };

      // Build search conditions
      if (location) {
        where.location = { [require('sequelize').Op.iLike]: `%${location}%` };
      }

      if (yearsExperience) {
        where.years_experience = { [require('sequelize').Op.gte]: parseInt(yearsExperience) };
      }

      if (availability) {
        where.availability = availability;
      }

      if (skills) {
        const skillsArray = Array.isArray(skills) ? skills : [skills];
        where.skills = {
          [require('sequelize').Op.contains]: skillsArray.map(skill => ({ name: skill }))
        };
      }

      if (search) {
        const searchConditions = {
          [require('sequelize').Op.or]: [
            { first_name: { [require('sequelize').Op.iLike]: `%${search}%` } },
            { last_name: { [require('sequelize').Op.iLike]: `%${search}%` } },
            { bio: { [require('sequelize').Op.iLike]: `%${search}%` } },
          ],
        };
        Object.assign(where, searchConditions);
      }

      const { count, rows: profiles } = await JobSeekerProfile.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhere,
            attributes: ['id', 'email', 'role', 'created_at'],
          },
        ],
        limit: parseInt(limit),
        offset,
        order: [['updated_at', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          profiles,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      console.error('Search profiles error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search profiles',
        error: 'SEARCH_PROFILES_FAILED',
      });
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(req, res) {
    try {
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const stats = {
        profileCompletion: profile.profile_completion_percentage,
        skillsCount: (profile.skills || []).length,
        experienceCount: (profile.experience || []).length,
        educationCount: (profile.education || []).length,
        certificationsCount: (profile.certifications || []).length,
        languagesCount: (profile.languages || []).length,
        isPublic: profile.is_public,
        hasResume: !!profile.resume_url,
        lastUpdated: profile.updated_at,
        profileStrength: this.calculateProfileStrength(profile),
        recommendations: this.getProfileRecommendations(profile),
      };

      res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Get profile stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile statistics',
        error: 'GET_PROFILE_STATS_FAILED',
      });
    }
  }

  /**
   * Add work experience
   */
  async addExperience(req, res) {
    try {
      const experienceData = req.body;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const experience = {
        id: Date.now().toString(),
        ...experienceData,
        added_at: new Date().toISOString(),
      };

      const experiences = [...(profile.experience || []), experience];
      await profile.update({ experience: experiences });

      res.json({
        success: true,
        message: 'Experience added successfully',
        data: {
          experience,
          experiences: profile.experience,
        },
      });
    } catch (error) {
      console.error('Add experience error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add experience',
        error: 'ADD_EXPERIENCE_FAILED',
      });
    }
  }

  /**
   * Update work experience
   */
  async updateExperience(req, res) {
    try {
      const { experienceId } = req.params;
      const experienceData = req.body;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const experiences = [...(profile.experience || [])];
      const experienceIndex = experiences.findIndex(exp => exp.id === experienceId);
      
      if (experienceIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Experience not found',
          error: 'EXPERIENCE_NOT_FOUND',
        });
      }

      experiences[experienceIndex] = {
        ...experiences[experienceIndex],
        ...experienceData,
        updated_at: new Date().toISOString(),
      };

      await profile.update({ experience: experiences });

      res.json({
        success: true,
        message: 'Experience updated successfully',
        data: {
          experience: experiences[experienceIndex],
          experiences: profile.experience,
        },
      });
    } catch (error) {
      console.error('Update experience error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update experience',
        error: 'UPDATE_EXPERIENCE_FAILED',
      });
    }
  }

  /**
   * Remove work experience
   */
  async removeExperience(req, res) {
    try {
      const { experienceId } = req.params;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const experiences = (profile.experience || []).filter(exp => exp.id !== experienceId);
      await profile.update({ experience: experiences });

      res.json({
        success: true,
        message: 'Experience removed successfully',
        data: {
          experiences: profile.experience,
        },
      });
    } catch (error) {
      console.error('Remove experience error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove experience',
        error: 'REMOVE_EXPERIENCE_FAILED',
      });
    }
  }

  /**
   * Add education
   */
  async addEducation(req, res) {
    try {
      const educationData = req.body;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const education = {
        id: Date.now().toString(),
        ...educationData,
        added_at: new Date().toISOString(),
      };

      const educations = [...(profile.education || []), education];
      await profile.update({ education: educations });

      res.json({
        success: true,
        message: 'Education added successfully',
        data: {
          education,
          educations: profile.education,
        },
      });
    } catch (error) {
      console.error('Add education error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add education',
        error: 'ADD_EDUCATION_FAILED',
      });
    }
  }

  /**
   * Update education
   */
  async updateEducation(req, res) {
    try {
      const { educationId } = req.params;
      const educationData = req.body;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const educations = [...(profile.education || [])];
      const educationIndex = educations.findIndex(edu => edu.id === educationId);
      
      if (educationIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Education not found',
          error: 'EDUCATION_NOT_FOUND',
        });
      }

      educations[educationIndex] = {
        ...educations[educationIndex],
        ...educationData,
        updated_at: new Date().toISOString(),
      };

      await profile.update({ education: educations });

      res.json({
        success: true,
        message: 'Education updated successfully',
        data: {
          education: educations[educationIndex],
          educations: profile.education,
        },
      });
    } catch (error) {
      console.error('Update education error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update education',
        error: 'UPDATE_EDUCATION_FAILED',
      });
    }
  }

  /**
   * Remove education
   */
  async removeEducation(req, res) {
    try {
      const { educationId } = req.params;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const educations = (profile.education || []).filter(edu => edu.id !== educationId);
      await profile.update({ education: educations });

      res.json({
        success: true,
        message: 'Education removed successfully',
        data: {
          educations: profile.education,
        },
      });
    } catch (error) {
      console.error('Remove education error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove education',
        error: 'REMOVE_EDUCATION_FAILED',
      });
    }
  }

  /**
   * Update job preferences
   */
  async updateJobPreferences(req, res) {
    try {
      const preferences = req.body;
      
      const profile = await JobSeekerProfile.findOne({
        where: { user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found',
          error: 'PROFILE_NOT_FOUND',
        });
      }

      const currentPreferences = profile.job_preferences || {};
      const updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        updated_at: new Date().toISOString(),
      };

      await profile.update({ job_preferences: updatedPreferences });

      res.json({
        success: true,
        message: 'Job preferences updated successfully',
        data: {
          job_preferences: profile.job_preferences,
        },
      });
    } catch (error) {
      console.error('Update job preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update job preferences',
        error: 'UPDATE_JOB_PREFERENCES_FAILED',
      });
    }
  }

  /**
   * Calculate profile strength score
   */
  calculateProfileStrength(profile) {
    let score = 0;
    const maxScore = 100;

    // Basic info (20 points)
    if (profile.first_name && profile.last_name) score += 5;
    if (profile.phone) score += 3;
    if (profile.location) score += 4;
    if (profile.bio && profile.bio.length > 50) score += 8;

    // Professional info (30 points)
    if (profile.skills && profile.skills.length >= 5) score += 10;
    if (profile.experience && profile.experience.length >= 1) score += 10;
    if (profile.years_experience > 0) score += 5;
    if (profile.salary_expectation) score += 5;

    // Education (15 points)
    if (profile.education && profile.education.length >= 1) score += 15;

    // Links and portfolio (20 points)
    if (profile.resume_url) score += 8;
    if (profile.linkedin_url) score += 4;
    if (profile.github_url) score += 4;
    if (profile.portfolio_url) score += 4;

    // Job preferences (15 points)
    if (profile.job_preferences && Object.keys(profile.job_preferences).length > 0) score += 10;
    if (profile.availability) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Get profile improvement recommendations
   */
  getProfileRecommendations(profile) {
    const recommendations = [];

    if (!profile.first_name || !profile.last_name) {
      recommendations.push({
        type: 'basic_info',
        priority: 'high',
        message: 'Add your full name to make your profile more professional',
        action: 'Add name',
      });
    }

    if (!profile.bio || profile.bio.length < 50) {
      recommendations.push({
        type: 'bio',
        priority: 'high',
        message: 'Write a compelling bio to showcase your personality and goals',
        action: 'Write bio',
      });
    }

    if (!profile.skills || profile.skills.length < 5) {
      recommendations.push({
        type: 'skills',
        priority: 'high',
        message: 'Add more skills to improve your job matching',
        action: 'Add skills',
      });
    }

    if (!profile.resume_url) {
      recommendations.push({
        type: 'resume',
        priority: 'high',
        message: 'Upload your resume to increase application success',
        action: 'Upload resume',
      });
    }

    if (!profile.experience || profile.experience.length === 0) {
      recommendations.push({
        type: 'experience',
        priority: 'medium',
        message: 'Add work experience to showcase your background',
        action: 'Add experience',
      });
    }

    if (!profile.linkedin_url) {
      recommendations.push({
        type: 'linkedin',
        priority: 'medium',
        message: 'Connect your LinkedIn profile for better networking',
        action: 'Add LinkedIn',
      });
    }

    if (!profile.job_preferences || Object.keys(profile.job_preferences).length === 0) {
      recommendations.push({
        type: 'preferences',
        priority: 'medium',
        message: 'Set job preferences for better recommendations',
        action: 'Set preferences',
      });
    }

    return recommendations;
  }
}

module.exports = new ProfileController();
