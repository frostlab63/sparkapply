const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Interview = sequelize.define(
  "Interview",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "application_id",
    },
    type: {
      type: DataTypes.ENUM(
        "phone_screening",
        "video_call",
        "in_person",
        "technical",
        "behavioral",
        "panel",
        "final",
        "informal"
      ),
      allowNull: false,
      defaultValue: "video_call",
    },
    round: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    scheduledDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "scheduled_date",
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Duration in minutes",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Physical address or video call link",
    },
    interviewerName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "interviewer_name",
    },
    interviewerTitle: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "interviewer_title",
    },
    interviewerEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "interviewer_email",
    },
    status: {
      type: DataTypes.ENUM(
        "scheduled",
        "confirmed",
        "rescheduled",
        "completed",
        "cancelled",
        "no_show"
      ),
      allowNull: false,
      defaultValue: "scheduled",
    },
    preparationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "preparation_notes",
    },
    questionsAsked: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "questions_asked",
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5,
      },
    },
    outcome: {
      type: DataTypes.ENUM("pending", "passed", "failed", "on_hold"),
      allowNull: false,
      defaultValue: "pending",
    },
    followUpRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "follow_up_required",
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "follow_up_date",
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "reminder_sent",
    },
    calendarEventId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "calendar_event_id",
    },
  },
  {
    tableName: "interviews",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["application_id"],
      },
      {
        fields: ["scheduled_date"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["type"],
      },
    ],
  }
);

module.exports = Interview;

