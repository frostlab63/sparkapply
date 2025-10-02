/**
 * Comprehensive Application Tracking Service
 * Manages the complete application lifecycle from submission to hiring decision
 */

const { Op } = require('sequelize');
const { Application, ApplicationStatusLog, Job, Company } = require('../models');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

class ApplicationTrackingService {
  constructor() {
    this.statusFlow = {
      'submitted': ['under_review', 'rejected'],
      'under_review': ['screening', 'rejected'],
      'screening': ['phone_interview', 'rejected'],
      'phone_interview': ['technical_interview', 'on_site_interview', 'rejected'],
      'technical_interview': ['on_site_interview', 'final_interview', 'rejected'],
      'on_site_interview': ['final_interview', 'offer_pending', 'rejected'],
      'final_interview': ['offer_pending', 'rejected'],
      'offer_pending': ['offer_extended', 'rejected'],
      'offer_extended': ['offer_accepted', 'offer_declined', 'offer_expired'],
      'offer_accepted': ['hired'],
      'offer_declined': [],
      'offer_expired': [],
      'rejected': [],
      'hired': [],
      'withdrawn': []
    };

    this.statusCategories = {
      'active': ['submitted', 'under_review', 'screening', 'phone_interview', 'technical_interview', 'on_site_interview', 'final_interview'],
      'pending': ['offer_pending', 'offer_extended'],
      'completed': ['offer_accepted', 'hired'],
      'closed': ['offer_declined', 'offer_expired', 'rejected', 'withdrawn']
    };

    this.notificationSettings = {
      'status_change': true,
      'interview_scheduled': true,
      'offer_received': true,
      'deadline_reminder': true
    };
  }

  /**
   * Submit a new job application
   * @param {Object} applicationData - Application data
   * @returns {Object} Created application
   */
  async submitApplication(applicationData) {
    try {
      const {
        user_id,
        job_id,
        cover_letter,
        resume_url,
        additional_documents = [],
        source = 'direct'
      } = applicationData;

      logger.info(`Submitting application for user ${user_id} to job ${job_id}`);

      // Check if user already applied to this job
      const existingApplication = await Application.findOne({
        where: { user_id, job_id }
      });

      if (existingApplication) {
        throw new Error('User has already applied to this job');
      }

      // Verify job exists and is active
      const job = await Job.findByPk(job_id, {
        include: [{ association: 'company' }]
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (!job.is_active) {
        throw new Error('Job is no longer active');
      }

      if (job.expires_date && new Date(job.expires_date) < new Date()) {
        throw new Error('Job application deadline has passed');
      }

      // Create application
      const application = await Application.create({
        user_id,
        job_id,
        status: 'submitted',
        cover_letter,
        resume_url,
        additional_documents,
        source,
        applied_date: new Date(),
        application_data: {
          ip_address: applicationData.ip_address,
          user_agent: applicationData.user_agent,
          referrer: applicationData.referrer
        }
      });

      // Log initial status
      await this.logStatusChange(application.id, null, 'submitted', 'Application submitted by candidate');

      // Update job application count
      await job.increment('application_count');

      // Send confirmation email to candidate
      await this.sendApplicationConfirmation(application, job);

      // Notify employer
      await this.notifyEmployerNewApplication(application, job);

      logger.info(`Application ${application.id} submitted successfully`);

      return await Application.findByPk(application.id, {
        include: [
          { association: 'job', include: ['company'] },
          { association: 'status_logs', order: [['created_at', 'DESC']] }
        ]
      });

    } catch (error) {
      logger.error('Error submitting application:', error);
      throw error;
    }
  }

  /**
   * Update application status
   * @param {number} applicationId - Application ID
   * @param {string} newStatus - New status
   * @param {Object} updateData - Additional update data
   * @returns {Object} Updated application
   */
  async updateApplicationStatus(applicationId, newStatus, updateData = {}) {
    try {
      const {
        updated_by,
        notes,
        interview_date,
        interview_type,
        interview_location,
        offer_details,
        rejection_reason,
        next_steps
      } = updateData;

      logger.info(`Updating application ${applicationId} status to ${newStatus}`);

      const application = await Application.findByPk(applicationId, {
        include: [
          { association: 'job', include: ['company'] },
          { association: 'user' }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const currentStatus = application.status;

      // Validate status transition
      if (!this.isValidStatusTransition(currentStatus, newStatus)) {
        throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      }

      // Prepare update data
      const updateFields = { status: newStatus };

      // Handle status-specific updates
      switch (newStatus) {
        case 'phone_interview':
        case 'technical_interview':
        case 'on_site_interview':
        case 'final_interview':
          if (interview_date) {
            updateFields.interview_date = new Date(interview_date);
            updateFields.interview_type = interview_type;
            updateFields.interview_location = interview_location;
          }
          break;

        case 'offer_extended':
          if (offer_details) {
            updateFields.offer_details = offer_details;
            updateFields.offer_deadline = offer_details.deadline ? new Date(offer_details.deadline) : null;
          }
          break;

        case 'rejected':
          if (rejection_reason) {
            updateFields.rejection_reason = rejection_reason;
          }
          updateFields.rejected_date = new Date();
          break;

        case 'hired':
          updateFields.hired_date = new Date();
          break;

        case 'withdrawn':
          updateFields.withdrawn_date = new Date();
          break;
      }

      // Update application
      await application.update(updateFields);

      // Log status change
      await this.logStatusChange(
        applicationId,
        currentStatus,
        newStatus,
        notes || `Status updated to ${newStatus}`,
        updated_by
      );

      // Send notifications
      await this.sendStatusChangeNotification(application, currentStatus, newStatus, updateData);

      // Handle automated actions
      await this.handleAutomatedActions(application, newStatus, updateData);

      logger.info(`Application ${applicationId} status updated to ${newStatus}`);

      return await Application.findByPk(applicationId, {
        include: [
          { association: 'job', include: ['company'] },
          { association: 'user' },
          { association: 'status_logs', order: [['created_at', 'DESC']] }
        ]
      });

    } catch (error) {
      logger.error(`Error updating application ${applicationId} status:`, error);
      throw error;
    }
  }

  /**
   * Withdraw application
   * @param {number} applicationId - Application ID
   * @param {number} userId - User ID (for authorization)
   * @param {string} reason - Withdrawal reason
   * @returns {Object} Updated application
   */
  async withdrawApplication(applicationId, userId, reason = '') {
    try {
      logger.info(`User ${userId} withdrawing application ${applicationId}`);

      const application = await Application.findByPk(applicationId);

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.user_id !== userId) {
        throw new Error('Unauthorized to withdraw this application');
      }

      if (this.statusCategories.closed.includes(application.status)) {
        throw new Error('Cannot withdraw application in current status');
      }

      return await this.updateApplicationStatus(applicationId, 'withdrawn', {
        updated_by: userId,
        notes: reason || 'Application withdrawn by candidate'
      });

    } catch (error) {
      logger.error(`Error withdrawing application ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Get applications for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} User applications
   */
  async getUserApplications(userId, options = {}) {
    try {
      const {
        status,
        limit = 50,
        offset = 0,
        sortBy = 'applied_date',
        sortOrder = 'DESC',
        includeWithdrawn = false
      } = options;

      const whereClause = { user_id: userId };

      if (status) {
        if (Array.isArray(status)) {
          whereClause.status = { [Op.in]: status };
        } else {
          whereClause.status = status;
        }
      }

      if (!includeWithdrawn) {
        whereClause.status = { [Op.ne]: 'withdrawn' };
      }

      const applications = await Application.findAll({
        where: whereClause,
        include: [
          {
            association: 'job',
            include: [
              { association: 'company', required: false }
            ]
          },
          {
            association: 'status_logs',
            limit: 5,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset
      });

      // Add application statistics
      const stats = await this.getUserApplicationStats(userId);

      return {
        applications,
        stats,
        pagination: {
          limit,
          offset,
          total: await Application.count({ where: whereClause })
        }
      };

    } catch (error) {
      logger.error(`Error getting applications for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get applications for a job (employer view)
   * @param {number} jobId - Job ID
   * @param {Object} options - Query options
   * @returns {Array} Job applications
   */
  async getJobApplications(jobId, options = {}) {
    try {
      const {
        status,
        limit = 50,
        offset = 0,
        sortBy = 'applied_date',
        sortOrder = 'DESC'
      } = options;

      const whereClause = { job_id: jobId };

      if (status) {
        if (Array.isArray(status)) {
          whereClause.status = { [Op.in]: status };
        } else {
          whereClause.status = status;
        }
      }

      const applications = await Application.findAll({
        where: whereClause,
        include: [
          {
            association: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url']
          },
          {
            association: 'status_logs',
            limit: 3,
            order: [['created_at', 'DESC']]
          }
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset
      });

      // Add job application statistics
      const stats = await this.getJobApplicationStats(jobId);

      return {
        applications,
        stats,
        pagination: {
          limit,
          offset,
          total: await Application.count({ where: whereClause })
        }
      };

    } catch (error) {
      logger.error(`Error getting applications for job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get application analytics for a user
   * @param {number} userId - User ID
   * @returns {Object} Application analytics
   */
  async getUserApplicationStats(userId) {
    try {
      const applications = await Application.findAll({
        where: { user_id: userId },
        attributes: ['status', 'applied_date', 'source']
      });

      const stats = {
        total: applications.length,
        by_status: {},
        by_month: {},
        by_source: {},
        success_rate: 0,
        avg_response_time: 0,
        active_applications: 0
      };

      const now = new Date();
      let totalResponseTime = 0;
      let responseCount = 0;

      for (const app of applications) {
        // Status distribution
        stats.by_status[app.status] = (stats.by_status[app.status] || 0) + 1;

        // Monthly distribution
        const month = app.applied_date.toISOString().substring(0, 7);
        stats.by_month[month] = (stats.by_month[month] || 0) + 1;

        // Source distribution
        stats.by_source[app.source] = (stats.by_source[app.source] || 0) + 1;

        // Active applications
        if (this.statusCategories.active.includes(app.status) || 
            this.statusCategories.pending.includes(app.status)) {
          stats.active_applications++;
        }

        // Response time calculation (simplified)
        if (!this.statusCategories.active.includes(app.status) && app.status !== 'submitted') {
          const responseTime = (now - app.applied_date) / (1000 * 60 * 60 * 24); // days
          totalResponseTime += responseTime;
          responseCount++;
        }
      }

      // Calculate success rate (offers / total applications)
      const successfulStatuses = ['offer_extended', 'offer_accepted', 'hired'];
      const successfulApps = Object.keys(stats.by_status)
        .filter(status => successfulStatuses.includes(status))
        .reduce((sum, status) => sum + stats.by_status[status], 0);

      stats.success_rate = applications.length > 0 ? (successfulApps / applications.length) * 100 : 0;
      stats.avg_response_time = responseCount > 0 ? totalResponseTime / responseCount : 0;

      return stats;

    } catch (error) {
      logger.error(`Error getting user application stats for ${userId}:`, error);
      return {};
    }
  }

  /**
   * Get application analytics for a job
   * @param {number} jobId - Job ID
   * @returns {Object} Job application analytics
   */
  async getJobApplicationStats(jobId) {
    try {
      const applications = await Application.findAll({
        where: { job_id: jobId },
        attributes: ['status', 'applied_date', 'source']
      });

      const stats = {
        total: applications.length,
        by_status: {},
        by_source: {},
        conversion_funnel: {},
        avg_time_to_hire: 0,
        quality_score: 0
      };

      // Calculate conversion funnel
      const funnelStages = [
        'submitted',
        'under_review',
        'screening',
        'phone_interview',
        'technical_interview',
        'on_site_interview',
        'final_interview',
        'offer_extended',
        'hired'
      ];

      for (const stage of funnelStages) {
        stats.conversion_funnel[stage] = applications.filter(app => 
          this.hasReachedStage(app.status, stage)
        ).length;
      }

      // Other statistics
      for (const app of applications) {
        stats.by_status[app.status] = (stats.by_status[app.status] || 0) + 1;
        stats.by_source[app.source] = (stats.by_source[app.source] || 0) + 1;
      }

      return stats;

    } catch (error) {
      logger.error(`Error getting job application stats for ${jobId}:`, error);
      return {};
    }
  }

  /**
   * Log status change
   * @param {number} applicationId - Application ID
   * @param {string} fromStatus - Previous status
   * @param {string} toStatus - New status
   * @param {string} notes - Change notes
   * @param {number} changedBy - User ID who made the change
   */
  async logStatusChange(applicationId, fromStatus, toStatus, notes = '', changedBy = null) {
    try {
      await ApplicationStatusLog.create({
        application_id: applicationId,
        from_status: fromStatus,
        to_status: toStatus,
        notes,
        changed_by: changedBy,
        changed_at: new Date()
      });

      logger.debug(`Status change logged for application ${applicationId}: ${fromStatus} -> ${toStatus}`);

    } catch (error) {
      logger.error(`Error logging status change for application ${applicationId}:`, error);
    }
  }

  /**
   * Check if status transition is valid
   * @param {string} fromStatus - Current status
   * @param {string} toStatus - Target status
   * @returns {boolean} Is valid transition
   */
  isValidStatusTransition(fromStatus, toStatus) {
    if (!fromStatus || !toStatus) return false;
    
    const allowedTransitions = this.statusFlow[fromStatus] || [];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * Check if application has reached a specific stage
   * @param {string} currentStatus - Current application status
   * @param {string} targetStage - Target stage to check
   * @returns {boolean} Has reached stage
   */
  hasReachedStage(currentStatus, targetStage) {
    const stageOrder = [
      'submitted', 'under_review', 'screening', 'phone_interview',
      'technical_interview', 'on_site_interview', 'final_interview',
      'offer_pending', 'offer_extended', 'offer_accepted', 'hired'
    ];

    const currentIndex = stageOrder.indexOf(currentStatus);
    const targetIndex = stageOrder.indexOf(targetStage);

    return currentIndex >= targetIndex;
  }

  /**
   * Send application confirmation email
   * @param {Object} application - Application data
   * @param {Object} job - Job data
   */
  async sendApplicationConfirmation(application, job) {
    try {
      if (!emailService) return;

      const emailData = {
        to: application.user.email,
        subject: `Application Confirmation - ${job.title}`,
        template: 'application_confirmation',
        data: {
          user_name: `${application.user.first_name} ${application.user.last_name}`,
          job_title: job.title,
          company_name: job.company?.name || 'Company',
          application_id: application.id,
          applied_date: application.applied_date
        }
      };

      await emailService.sendEmail(emailData);
      logger.info(`Application confirmation sent for application ${application.id}`);

    } catch (error) {
      logger.error(`Error sending application confirmation for ${application.id}:`, error);
    }
  }

  /**
   * Notify employer of new application
   * @param {Object} application - Application data
   * @param {Object} job - Job data
   */
  async notifyEmployerNewApplication(application, job) {
    try {
      if (!emailService || !job.company?.contact_email) return;

      const emailData = {
        to: job.company.contact_email,
        subject: `New Application - ${job.title}`,
        template: 'new_application_employer',
        data: {
          job_title: job.title,
          candidate_name: `${application.user.first_name} ${application.user.last_name}`,
          application_id: application.id,
          applied_date: application.applied_date,
          dashboard_url: `${process.env.FRONTEND_URL}/employer/applications/${application.id}`
        }
      };

      await emailService.sendEmail(emailData);
      logger.info(`Employer notification sent for application ${application.id}`);

    } catch (error) {
      logger.error(`Error sending employer notification for ${application.id}:`, error);
    }
  }

  /**
   * Send status change notification
   * @param {Object} application - Application data
   * @param {string} fromStatus - Previous status
   * @param {string} toStatus - New status
   * @param {Object} updateData - Additional update data
   */
  async sendStatusChangeNotification(application, fromStatus, toStatus, updateData) {
    try {
      if (!emailService) return;

      const emailData = {
        to: application.user.email,
        subject: `Application Update - ${application.job.title}`,
        template: 'application_status_change',
        data: {
          user_name: `${application.user.first_name} ${application.user.last_name}`,
          job_title: application.job.title,
          company_name: application.job.company?.name || 'Company',
          from_status: fromStatus,
          to_status: toStatus,
          interview_date: updateData.interview_date,
          interview_type: updateData.interview_type,
          interview_location: updateData.interview_location,
          offer_details: updateData.offer_details,
          next_steps: updateData.next_steps
        }
      };

      await emailService.sendEmail(emailData);
      logger.info(`Status change notification sent for application ${application.id}`);

    } catch (error) {
      logger.error(`Error sending status change notification for ${application.id}:`, error);
    }
  }

  /**
   * Handle automated actions based on status changes
   * @param {Object} application - Application data
   * @param {string} newStatus - New status
   * @param {Object} updateData - Update data
   */
  async handleAutomatedActions(application, newStatus, updateData) {
    try {
      switch (newStatus) {
        case 'offer_extended':
          // Schedule offer expiration reminder
          if (updateData.offer_details?.deadline) {
            await this.scheduleOfferReminder(application.id, updateData.offer_details.deadline);
          }
          break;

        case 'hired':
          // Update job status if needed
          await this.handleSuccessfulHire(application);
          break;

        case 'rejected':
          // Send feedback request (optional)
          await this.requestApplicationFeedback(application);
          break;
      }

    } catch (error) {
      logger.error(`Error handling automated actions for application ${application.id}:`, error);
    }
  }

  /**
   * Schedule offer expiration reminder
   * @param {number} applicationId - Application ID
   * @param {Date} deadline - Offer deadline
   */
  async scheduleOfferReminder(applicationId, deadline) {
    // This would integrate with a job scheduler like Bull or Agenda
    logger.info(`Scheduling offer reminder for application ${applicationId} at ${deadline}`);
  }

  /**
   * Handle successful hire
   * @param {Object} application - Application data
   */
  async handleSuccessfulHire(application) {
    try {
      // Update job if it should be closed after hiring
      const job = await Job.findByPk(application.job_id);
      
      if (job && job.auto_close_on_hire) {
        await job.update({ is_active: false });
        logger.info(`Job ${job.id} automatically closed after successful hire`);
      }

    } catch (error) {
      logger.error(`Error handling successful hire for application ${application.id}:`, error);
    }
  }

  /**
   * Request application feedback
   * @param {Object} application - Application data
   */
  async requestApplicationFeedback(application) {
    // This could send a feedback request email to the candidate
    logger.info(`Feedback request could be sent for application ${application.id}`);
  }

  /**
   * Get application timeline
   * @param {number} applicationId - Application ID
   * @returns {Array} Application timeline
   */
  async getApplicationTimeline(applicationId) {
    try {
      const statusLogs = await ApplicationStatusLog.findAll({
        where: { application_id: applicationId },
        order: [['changed_at', 'ASC']],
        include: [
          {
            association: 'changed_by_user',
            attributes: ['id', 'first_name', 'last_name'],
            required: false
          }
        ]
      });

      return statusLogs.map(log => ({
        id: log.id,
        from_status: log.from_status,
        to_status: log.to_status,
        notes: log.notes,
        changed_at: log.changed_at,
        changed_by: log.changed_by_user ? {
          id: log.changed_by_user.id,
          name: `${log.changed_by_user.first_name} ${log.changed_by_user.last_name}`
        } : null
      }));

    } catch (error) {
      logger.error(`Error getting timeline for application ${applicationId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update application statuses
   * @param {Array} updates - Array of update objects
   * @returns {Array} Update results
   */
  async bulkUpdateApplications(updates) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateApplicationStatus(
          update.application_id,
          update.status,
          update.data || {}
        );
        results.push({ success: true, application_id: update.application_id, result });
      } catch (error) {
        results.push({ 
          success: false, 
          application_id: update.application_id, 
          error: error.message 
        });
      }
    }

    return results;
  }
}

module.exports = ApplicationTrackingService;
