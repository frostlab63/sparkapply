const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "job_id",
    },
    jobTitle: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "job_title",
    },
    company: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jobUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "job_url",
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "applied",
        "under_review",
        "phone_screening",
        "interview_scheduled",
        "interviewed",
        "technical_assessment",
        "final_interview",
        "offer_received",
        "offer_accepted",
        "offer_declined",
        "rejected",
        "withdrawn"
      ),
      allowNull: false,
      defaultValue: "draft",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high"),
      allowNull: false,
      defaultValue: "medium",
    },
    appliedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "applied_date",
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_updated",
    },
    expectedSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "expected_salary",
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    workType: {
      type: DataTypes.ENUM("remote", "hybrid", "onsite"),
      allowNull: true,
      field: "work_type",
    },
    jobDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "job_description",
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "contact_person",
    },
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "contact_email",
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "contact_phone",
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referralSource: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "referral_source",
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "follow_up_date",
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_archived",
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    customFields: {
      type: DataTypes.JSON,
      allowNull: true,
      field: "custom_fields",
    },
  },
  {
    tableName: "applications",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["priority"],
      },
      {
        fields: ["applied_date"],
      },
    ],
  }
);

module.exports = Application;

