const mongoose = require("mongoose");
const {
  CollectionEnum,
  JobAvailability,
  ApplicantStatus,
} = require("../config/constants");

const Schema = mongoose.Schema;

const JobSchema = new Schema(
  {
    recruiter_id: {
      type: Schema.Types.ObjectId,
      ref: CollectionEnum.CREATOR,
      required: true,
    },
    applicants: [
      {
        creator_id: {
          type: Schema.Types.ObjectId,
          ref: CollectionEnum.CREATOR,
          required: true,
        },
        status: {
          type: String,
          enum: Object.values(ApplicantStatus),
          default: ApplicantStatus.PENDING,
          uppercase: true,
        },
        application_date: {
          type: Date,
          default: Date.now,
        },
        views: {
          type: Number,
          default: 0,
        },
      },
    ],
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    // experience: { type: String, required: true, trim: true },
    // industry: { type: String, required: true, trim: true },
    salary_range: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          const match = value.match(/^(\d+)\/(\d+)$/);
          if (!match) return false;
          const lower = parseInt(match[1], 10);
          const higher = parseInt(match[2], 10);
          return lower <= higher;
        },
        message: (props) =>
          `${props.value} is not a valid salary range. Use format: lower/higher, where lower ≤ higher.`,
      },
    },
    deadline: { type: Date, required: true },
    work_mode: { type: String, trim: true },
    skills: {
      technical: [{ type: String, trim: true }],
      soft: [{ type: String, trim: true }],
      // responsibilities: [{ type: String, trim: true }],
      // requirements: [{ type: String, trim: true }],
      // others: { type: String, trim: true },
    },
    location: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(JobAvailability),
      uppercase: true,
      default: JobAvailability.ACTIVE,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const JobModel = mongoose.model(CollectionEnum.JOB, JobSchema);

module.exports = {
  JobModel,
};
