const Interview = require('../models/Interview');
const Application = require('../models/Application');
const ApplicationNote = require('../models/ApplicationNote');
const { Op, sequelize } = require("sequelize");
const moment = require('moment');

class InterviewSchedulingService {

  static async scheduleInterview(interviewData) {
    try {
      console.log("1. scheduleInterview: Starting with data:", interviewData);

      const {
        applicationId,
        type,
        scheduled_date,
        duration = 60,
        location,
        interviewers,
        notes,
        preparationTime = 30,
        userId
      } = interviewData;

      console.log("2. scheduleInterview: Calling checkSchedulingConflicts");
      const conflicts = await this.checkSchedulingConflicts(userId, scheduled_date, duration);
      console.log("3. scheduleInterview: checkSchedulingConflicts returned", conflicts);

      if (conflicts.length > 0) {
        console.log("4. scheduleInterview: Conflicts found");
        return {
          success: false,
          error: "Scheduling conflict detected",
          conflicts,
          suggestions: await this.suggestAlternativeTimes(userId, scheduled_date, duration)
        };
      }

      console.log("5. scheduleInterview: Creating interview");
      const interview = await Interview.create({
        applicationId,
        type,
        scheduledDate: new Date(scheduled_date),
        duration,
        location,
        interviewers: JSON.stringify(interviewers || []),
        notes,
        status: "scheduled",
        preparationTime,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("6. scheduleInterview: Interview created", interview);

      console.log("7. scheduleInterview: Updating application status");
      await Application.update(
        { 
          status: "interview_scheduled",
          lastUpdated: new Date()
        },
        { where: { id: applicationId } }
      );
      console.log("8. scheduleInterview: Application status updated");

      console.log("9. scheduleInterview: Creating application note");
      await ApplicationNote.create({
        applicationId,
        userId: interviewData.userId,
        type: "interview_prep",
        title: `${type} Interview Scheduled`,
        content: `Interview scheduled for ${moment(scheduled_date).format("MMMM Do YYYY, h:mm a")}. \n                 Duration: ${duration} minutes. \n                 Location: ${location || "TBD"}\n                 \n                 Preparation checklist:\n                 - Research the company and role\n                 - Prepare STAR method examples\n                 - Review technical concepts (if applicable)\n                 - Prepare questions for the interviewer\n                 - Plan arrival time and route`,
        priority: "high",
        reminderDate: moment(scheduled_date).subtract(1, "day").toDate()
      });
      console.log("10. scheduleInterview: Application note created");

      return {
        success: true,
        data: interview,
        message: "Interview scheduled successfully",
        preparationDeadline: moment(scheduled_date).subtract(preparationTime, "minutes").toDate()
      };
    } catch (error) {
      console.error("Error in scheduleInterview:", error);
      throw error;
    }
  }

  static async checkSchedulingConflicts(userId, scheduled_date, duration) {
    try {
      const startTime = moment(scheduled_date);
      const endTime = moment(scheduled_date).add(duration, 'minutes');

      const conflicts = await Interview.findAll({
        include: [{
          model: Application,
          as: 'application',
          where: { userId }
        }],
        where: {
          status: ['scheduled', 'confirmed'],
          [Op.or]: [
            {
              scheduled_date: {
                [Op.between]: [startTime.toDate(), endTime.toDate()]
              }
            },
            {
                [Op.and]: [
                    {
                        scheduled_date: {
                            [Op.lte]: startTime.toDate()
                        }
                    },
                    sequelize.literal(`("Interview"."scheduled_date" + "Interview"."duration" * interval '1 minute') > '${startTime.toISOString()}'`) 
                ]
            }
          ]
        }
      });

      return conflicts.map(conflict => ({
        interviewId: conflict.id,
        company: conflict.application ? conflict.application.company : 'N/A',
        jobTitle: conflict.application ? conflict.application.jobTitle : 'N/A',
        scheduledDate: conflict.scheduled_date,
        duration: conflict.duration,
        type: conflict.type
      }));
    } catch (error) {
      console.error('Error checking conflicts:', error);
      return [];
    }
  }

  static async getUpcomingInterviews(userId, days) {
    return { success: true, data: [], summary: {} };
  }

  static async getInterviewAnalytics(userId, timeframe) {
    return { success: true, data: {} };
  }

  static async suggestAlternativeTimes(userId, scheduled_date, duration) {
    return [];
  }

  static async updateInterviewStatus(id, status, feedback) {
    return { success: true, data: {} };
  }
}

module.exports = InterviewSchedulingService;
