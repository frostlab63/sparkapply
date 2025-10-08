const Interview = require("../models/Interview");
const Application = require("../models/Application");
const ApplicationNote = require("../models/ApplicationNote");
const InterviewSchedulingService = require("../services/interviewSchedulingService");
const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const moment = require("moment");

const scheduleInterviewWithConflictDetection = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const result = await InterviewSchedulingService.scheduleInterview(req.body);
    
    if (!result.success) {
      return res.status(409).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ success: false, error: "Failed to schedule interview" });
  }
};

const getAvailableTimeSlots = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      date, 
      duration = 60, 
      timeZone = "America/New_York",
      businessHoursOnly = true 
    } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, error: "Date parameter is required" });
    }

    const targetDate = moment(date);
    const timeSlots = [];

    const startHour = businessHoursOnly ? 9 : 0;
    const endHour = businessHoursOnly ? 17 : 23;

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeSlot = targetDate.clone().hour(hour).minute(minute);
        
        if (timeSlot.isBefore(moment())) continue;
        
        const conflicts = await InterviewSchedulingService.checkSchedulingConflicts(
          userId, 
          timeSlot.toDate(), 
          parseInt(duration)
        );
        
        timeSlots.push({
          time: timeSlot.toDate(),
          formatted: timeSlot.format("h:mm A"),
          available: conflicts.length === 0,
          conflicts: conflicts.length > 0 ? conflicts : undefined
        });
      }
    }

    res.json({
      success: true,
      data: {
        date: targetDate.format("YYYY-MM-DD"),
        timeSlots: timeSlots.filter(slot => slot.available),
        allSlots: timeSlots,
        duration: parseInt(duration),
        timeZone
      }
    });
  } catch (error) {
    console.error("Error getting available time slots:", error);
    res.status(500).json({ success: false, error: "Failed to get available time slots" });
  }
};

const getUpcomingInterviewsWithPreparation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const result = await InterviewSchedulingService.getUpcomingInterviews(userId, parseInt(days));
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching upcoming interviews:", error);
    res.status(500).json({ success: false, error: "Failed to fetch upcoming interviews" });
  }
};

const updateInterviewStatusWithAutomation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { status, feedback, rescheduleDate, rescheduleReason } = req.body;

    if (status === "rescheduled" && rescheduleDate) {
      const interview = await Interview.findByPk(id, {
        include: [{ model: Application }]
      });

      if (!interview) {
        return res.status(404).json({ success: false, error: "Interview not found" });
      }

      const conflicts = await InterviewSchedulingService.checkSchedulingConflicts(
        interview.Application.userId,
        rescheduleDate,
        interview.duration
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          error: "Scheduling conflict with new date",
          conflicts,
          suggestions: await InterviewSchedulingService.suggestAlternativeTimes(
            interview.Application.userId,
            rescheduleDate,
            interview.duration
          )
        });
      }

      await Interview.update({
        scheduledDate: new Date(rescheduleDate),
        status: "scheduled",
        notes: (interview.notes || "") + `\n\nRescheduled: ${rescheduleReason || "No reason provided"}`,
        updatedAt: new Date()
      }, { where: { id } });

      await ApplicationNote.create({
        applicationId: interview.applicationId,
        userId: interview.Application.userId,
        type: "general",
        title: "Interview Rescheduled",
        content: `Interview rescheduled from ${moment(interview.scheduledDate).format("MMMM Do YYYY, h:mm a")} 
                 to ${moment(rescheduleDate).format("MMMM Do YYYY, h:mm a")}.\n\nReason: ${rescheduleReason || "Not specified"}`,
        priority: "medium"
      });

      const updatedInterview = await Interview.findByPk(id, {
        include: [{ model: Application }]
      });

      return res.json({ success: true, data: updatedInterview, message: "Interview rescheduled successfully" });
    }

    const result = await InterviewSchedulingService.updateInterviewStatus(id, status, feedback);
    
    res.json(result);
  } catch (error) {
    console.error("Error updating interview status:", error);
    res.status(500).json({ success: false, error: "Failed to update interview status" });
  }
};

const getInterviewPreparationChecklist = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findByPk(id, {
      include: [{ model: Application }]
    });

    if (!interview) {
      return res.status(404).json({ success: false, error: "Interview not found" });
    }

    const checklist = InterviewSchedulingService.getPreparationChecklist(interview);
    const hoursUntilInterview = moment(interview.scheduledDate).diff(moment(), "hours");
    
    const recommendations = [];
    
    if (hoursUntilInterview <= 24) {
      recommendations.push({
        priority: "high",
        message: "Interview is within 24 hours - focus on final preparation",
        actions: [
          "Review your prepared answers one more time",
          "Confirm logistics (time, location, contact info)",
          "Prepare your interview outfit",
          "Get a good night's sleep"
        ]
      });
    } else if (hoursUntilInterview <= 72) {
      recommendations.push({
        priority: "medium",
        message: "Interview is in 2-3 days - intensive preparation time",
        actions: [
          "Complete company research",
          "Practice mock interviews",
          "Prepare specific examples and stories",
          "Research your interviewers"
        ]
      });
    } else {
      recommendations.push({
        priority: "low",
        message: "You have time for thorough preparation",
        actions: [
          "Start with company research",
          "Review the job description thoroughly",
          "Begin collecting examples for STAR method",
          "Schedule practice sessions"
        ]
      });
    }

    res.json({
      success: true,
      data: {
        interview: {
          id: interview.id,
          company: interview.Application.company,
          jobTitle: interview.Application.jobTitle,
          type: interview.type,
          scheduledDate: interview.scheduledDate,
          location: interview.location,
          duration: interview.duration
        },
        checklist,
        recommendations,
        timeUntilInterview: {
          hours: hoursUntilInterview,
          formatted: moment(interview.scheduledDate).fromNow(),
          preparationStatus: InterviewSchedulingService.calculatePreparationStatus(hoursUntilInterview)
        }
      }
    });
  } catch (error) {
    console.error("Error getting preparation checklist:", error);
    res.status(500).json({ success: false, error: "Failed to get preparation checklist" });
  }
};

const getInterviewAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = 90 } = req.query;

    const analytics = await InterviewSchedulingService.getInterviewAnalytics(userId, parseInt(timeframe));
    
    const insights = [];
    
    if (analytics.data.successRate < 70) {
      insights.push({
        type: "warning",
        category: "success_rate",
        message: "Your interview completion rate could be improved",
        suggestion: "Consider better preparation or scheduling practices"
      });
    }
    
    if (analytics.data.cancelledInterviews > analytics.data.completedInterviews) {
      insights.push({
        type: "warning",
        category: "cancellations",
        message: "High cancellation rate detected",
        suggestion: "Review your scheduling process and availability"
      });
    }
    
    if (analytics.data.totalInterviews > 0) {
      const mostCommonType = Object.entries(analytics.data.typeBreakdown)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostCommonType) {
        insights.push({
          type: "info",
          category: "interview_types",
          message: `Most common interview type: ${mostCommonType[0]} (${mostCommonType[1]} interviews)`,
          suggestion: "Focus preparation on this interview type"
        });
      }
    }

    res.json({
      success: true,
      data: {
        ...analytics.data,
        insights,
        timeframe: parseInt(timeframe)
      }
    });
  } catch (error) {
    console.error("Error getting interview analytics:", error);
    res.status(500).json({ success: false, error: "Failed to get interview analytics" });
  }
};

const bulkRescheduleInterviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { interviewIds, reason, newDates } = req.body;

    if (!interviewIds || !Array.isArray(interviewIds) || interviewIds.length === 0) {
      return res.status(400).json({ success: false, error: "Interview IDs array is required" });
    }

    const results = [];

    for (let i = 0; i < interviewIds.length; i++) {
      const interviewId = interviewIds[i];
      const newDate = newDates && newDates[i] ? newDates[i] : null;

      try {
        const interview = await Interview.findOne({
          where: { id: interviewId },
          include: [{
            model: Application,
        as: 'application',
            where: { userId }
          }]
        });

        if (!interview) {
          results.push({ interviewId, success: false, error: "Interview not found" });
          continue;
        }

        if (newDate) {
          const conflicts = await InterviewSchedulingService.checkSchedulingConflicts(
            userId,
            newDate,
            interview.duration
          );

          if (conflicts.length > 0) {
            results.push({ interviewId, success: false, error: "Scheduling conflict", conflicts });
            continue;
          }

          await Interview.update({
            scheduledDate: new Date(newDate),
            status: "scheduled",
            notes: (interview.notes || "") + `\n\nBulk rescheduled: ${reason || "No reason provided"}`,
            updatedAt: new Date()
          }, { where: { id: interviewId } });

          results.push({ interviewId, success: true, oldDate: interview.scheduledDate, newDate: newDate, message: "Rescheduled successfully" });
        } else {
          await Interview.update({
            status: "rescheduled",
            notes: (interview.notes || "") + `\n\nMarked for rescheduling: ${reason || "No reason provided"}`,
            updatedAt: new Date()
          }, { where: { id: interviewId } });

          results.push({ interviewId, success: true, message: "Marked for rescheduling" });
        }
      } catch (error) {
        results.push({ interviewId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalProcessed: results.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    console.error("Error in bulk reschedule:", error);
    res.status(500).json({ success: false, error: "Failed to reschedule interviews" });
  }
};

const getInterviewCalendar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      month = moment().month() + 1, 
      year = moment().year(),
      view = "month" 
    } = req.query;

    let startDate, endDate;

    if (view === "month") {
      startDate = moment().year(year).month(month - 1).startOf("month").toDate();
      endDate = moment().year(year).month(month - 1).endOf("month").toDate();
    } else if (view === "week") {
      startDate = moment().startOf("week").toDate();
      endDate = moment().endOf("week").toDate();
    } else {
      startDate = moment().startOf("day").toDate();
      endDate = moment().endOf("day").toDate();
    }

    const interviews = await Interview.findAll({
      include: [{
        model: Application,
        as: 'application',
        where: { userId },
        attributes: ["company", "jobTitle"]
      }],
      where: {
        scheduledDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [["scheduledDate", "ASC"]]
    });

    const calendar = {};
    interviews.forEach(interview => {
      const date = moment(interview.scheduledDate).format("YYYY-MM-DD");
      if (!calendar[date]) {
        calendar[date] = [];
      }
      calendar[date].push(interview);
    });

    res.json({
      success: true,
      data: {
        calendar,
        summary: {
          totalInterviews: interviews.length,
          startDate,
          endDate,
          view
        }
      }
    });
  } catch (error) {
    console.error("Error getting interview calendar:", error);
    res.status(500).json({ success: false, error: "Failed to get interview calendar" });
  }
};

module.exports = {
  scheduleInterviewWithConflictDetection,
  getAvailableTimeSlots,
  getUpcomingInterviewsWithPreparation,
  updateInterviewStatusWithAutomation,
  getInterviewPreparationChecklist,
  getInterviewAnalytics,
  bulkRescheduleInterviews,
  getInterviewCalendar
};
