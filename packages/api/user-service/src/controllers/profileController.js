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
}

module.exports = new ProfileController();
