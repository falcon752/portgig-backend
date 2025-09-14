const { JobModel } = require("./job-model");
const { RecruiterModel } = require("../recruiters/recruiters-model");
const { CreatorModel } = require("../creators/creators-model");
const logger = require("../config/logging").getLogger("JOB:SERVICE");
const yup = require("yup");
const mongoose = require("mongoose");

const {
  yupObjectId,
  jobCreateValidationSchema,
  validateCloseJobContent,
} = require("../config/validation-schemas");

const mail = require("../config/email");

// const {} = require("../config/constants");

const {
  paginationAggregate,
  handleError,
  getUserInfoFromDoc,
} = require("../config/utils");

const {
  UnAuthorizedError,
  InvalidPayloadError,
  InternalServerError,
} = require("../config/errors");
const {
  JobAvailability,
  ApplicantStatus,
  MailTypeEnum,
  CollectionEnum,
  NotificationTypeEnum,
} = require("../config/constants");
const { NotificationModel } = require("../notification/notification-model");

exports.createJob = async function createJob(userId, payload) {
  try {
    const {
      title,
      description,
      salary_range,
      deadline,
      work_mode,
      location,
      technical,
      soft,
      // responsibilities,
      // requirements,
      // others,
      experience,
      // industry,
    } = jobCreateValidationSchema.validateSync(payload);
    yupObjectId().required().validateSync(userId);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new InvalidPayloadError("recruiter not found");

    const job = await JobModel.create({
      title: title.toLowerCase(),
      description,
      salary_range,
      deadline,
      work_mode: work_mode.toLowerCase(),
      location: location.toLowerCase(),
      skills: {
        technical,
        soft,
        // responsibilities,
        // requirements,
        // others,
      },
      recruiter_id: userId,
      experience: experience.toLowerCase(),
      // industry: industry.toLowerCase(),
    });

    return {
      status: 200,
      message: "Job created successfully",
      data: job,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.closeJob = async function closeJob(userId, query, payload) {
  try {
    const { job_id } = query;
    yupObjectId().required().validateSync(userId);
    const { reason } = validateCloseJobContent.validateSync(payload);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new InvalidPayloadError("recruiter not found");

    const job = await JobModel.findOneAndUpdate(
      { _id: job_id, recruiter_id: userId },
      { status: JobAvailability.CLOSED },
      { new: true }
    );
    if (!job) throw new InvalidPayloadError("job not found");

    const disqualifiedApplicants = job.applicants.filter(
      (applicant) => applicant.status === ApplicantStatus.NOT_QUALIFIED
    );

    // const emailsPromises = [];
    const notificationPromises = [];

    for (const applicant of disqualifiedApplicants) {
      const creator = await CreatorModel.findById(applicant.creator_id);
      if (creator && creator.auth && creator.auth.email) {
        // const emailContent = `Dear ${
        //   creator.bio_data.full_name || "Creator"
        // },Thank you for applying for the ${
        //   job.title
        // } position. After careful consideration, we have decided to move forward with other candidates for this role.\n Reason: ${reason}`;

        // emailsPromises.push({
        //   email: creator.auth.email,
        //   subject: `Update on Your Application for ${job.title}`,
        //   content: emailContent,
        // });

        notificationPromises.push({
          from: CollectionEnum.RECRUITER,
          recipient: creator._id,
          recipient_role: CollectionEnum.CREATOR,
          description: `Your application for the ${job.title} position has been closed. Reason: ${reason}`,
          notification_type: NotificationTypeEnum.JOB_CLOSED,
        });
      }
    }

    notificationPromises.push({
      from: CollectionEnum.RECRUITER,
      recipient: job.recruiter_id,
      recipient_role: CollectionEnum.RECRUITER,
      description: `You have successfully closed the job posting for ${job.title}.`,
      notification_type: NotificationTypeEnum.JOB_CLOSED,
    });

    await Promise.all([
      // ...emailsPromises.map((email) =>
      //   mail(MailTypeEnum.DISQUALIFIED_CREATOR, email)
      // ),
      NotificationModel.insertMany(notificationPromises),
    ]);

    return {
      status: 200,
      message: "Job closed successfully",
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};
exports.getJobs = async function getJobs(userId, queryParams) {
  try {
    const { job_id, status, title, work_mode, experience, industry } =
      queryParams;
    yupObjectId().required().validateSync(userId);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new InvalidPayloadError("recruiter not found");

    const matchStage = {
      recruiter_id: new mongoose.Types.ObjectId(userId),
    };

    if (job_id) {
      matchStage._id = new mongoose.Types.ObjectId(job_id);
    }
    if (status) {
      matchStage.status = status.toUpperCase();
    }
    if (experience) {
      matchStage.experience = experience.toLowerCase();
    }
    if (industry) {
      matchStage.industry = industry.toLowerCase();
    }
    if (title) {
      matchStage.title = { $regex: title, $options: "i" };
    }
    if (work_mode) {
      matchStage.work_mode = work_mode;
    }

    // Increment view count for each applicant when recruiter views the job
    if (job_id) {
      await JobModel.updateMany(
        {
          _id: new mongoose.Types.ObjectId(job_id),
          recruiter_id: new mongoose.Types.ObjectId(userId),
          "applicants.creator_id": { $exists: true },
        },
        {
          $inc: { "applicants.$[].views": 1 },
        }
      );
    }

    const jobs = await paginationAggregate(JobModel, queryParams, {
      stagesBefore: [{ $match: matchStage }],
      stagesAfter: [
        {
          $lookup: {
            from: "creators",
            localField: "applicants.creator_id",
            foreignField: "_id",
            as: "applicant_details",
          },
        },
        {
          $addFields: {
            applicants: {
              $map: {
                input: "$applicants",
                as: "applicant",
                in: {
                  id: "$$applicant.creator_id",
                  status: "$$applicant.status",
                  cover_letter: "$$applicant.cover_letter",
                  // resume: "$$applicant.resume",
                  views: "$$applicant.views",
                  user_name: {
                    $arrayElemAt: [
                      "$applicant_details.bio_data.user_name",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  full_name: {
                    $arrayElemAt: [
                      "$applicant_details.bio_data.full_name",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  email: {
                    $arrayElemAt: [
                      "$applicant_details.auth.email",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  rating: {
                    $arrayElemAt: [
                      "$applicant_details.rating",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  niche: {
                    $arrayElemAt: [
                      "$applicant_details.niche",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  profile: {
                    $arrayElemAt: [
                      "$applicant_details.profile",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                  resume: {
                    $arrayElemAt: [
                      "$applicant_details.resume",
                      {
                        $indexOfArray: [
                          "$applicant_details._id",
                          "$$applicant.creator_id",
                        ],
                      },
                    ],
                  },
                },
              },
            },
            applicant_status_counts: {
              pending: {
                $size: {
                  $filter: {
                    input: "$applicants",
                    as: "applicant",
                    cond: { $eq: ["$$applicant.status", "PENDING"] },
                  },
                },
              },
              selected: {
                $size: {
                  $filter: {
                    input: "$applicants",
                    as: "applicant",
                    cond: { $eq: ["$$applicant.status", "SELECTED"] },
                  },
                },
              },
              shortlisted: {
                $size: {
                  $filter: {
                    input: "$applicants",
                    as: "applicant",
                    cond: { $eq: ["$$applicant.status", "SHORTLISTED"] },
                  },
                },
              },
              not_qualified: {
                $size: {
                  $filter: {
                    input: "$applicants",
                    as: "applicant",
                    cond: { $eq: ["$$applicant.status", "NOT_QUALIFIED"] },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            applicant_details: 0,
          },
        },
      ],
    });

    return {
      status: 200,
      message: "Job fetched successfully",
      data: jobs,
    };
  } catch (error) {
    logger.error(`Error fetching jobs: ${error.message}\n${error.stack}`);
    handleError(error);
  }
};

exports.creatorGetJobs = async function creatorGetJobs(userId, queryParams) {
  try {
    const { job_id, title, work_mode, creatorJob, experience, industry } =
      queryParams;
    yupObjectId().required().validateSync(userId);

    const creator = await CreatorModel.findById(userId);
    if (!creator) throw new InvalidPayloadError("recruiter not found");

    const matchStage = {
      status: JobAvailability.ACTIVE,
    };

    if (job_id) {
      matchStage._id = new mongoose.Types.ObjectId(job_id);
    }

    if (title) {
      matchStage.title = { $regex: title, $options: "i" };
    }

    if (work_mode) {
      matchStage.work_mode = work_mode;
    }

    if (experience) {
      matchStage.experience = experience.toLowerCase();
    }
    if (industry) {
      matchStage.industry = industry.toLowerCase();
    }

    if (creatorJob != null) {
      matchStage["applicants.creator_id"] = new mongoose.Types.ObjectId(userId);
    }

    const jobs = await paginationAggregate(JobModel, queryParams, {
      stagesBefore: [{ $match: matchStage }],
      stagesAfter: [
        {
          $lookup: {
            from: "recruiters",
            localField: "recruiter_id",
            foreignField: "_id",
            as: "recruiter_info",
          },
        },
        { $unwind: "$recruiter_info" },
        {
          $addFields: {
            recruiter: {
              user_name: "$recruiter_info.bio_data.user_name",
              full_name: "$recruiter_info.bio_data.full_name",
              company_name: "$recruiter_info.company_info.company_name",
              about_us: "$recruiter_info.company_info.about_us",
              rating: "$recruiter_info.rating",
              ratings: "$recruiter_info.ratings",
              location: "$recruiter_info.profile.location",
            },
            application_info: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$applicants",
                    as: "applicant",
                    cond: {
                      $eq: [
                        "$$applicant.creator_id",
                        new mongoose.Types.ObjectId(userId),
                      ],
                    },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $addFields: {
            application_status: "$application_info.status",
            application_date: "$application_info.application_date",
            application_views: "$application_info.views",
          },
        },
        {
          $project: {
            recruiter_info: 0,
            applicants: 0,
            application_info: 0,
          },
        },
      ],
    });

    return {
      status: 200,
      message: "Job fetched successfully",
      data: jobs,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.removejob = async function removeJob(userId, query) {
  try {
    const { job_id } = query;
    yupObjectId().required().validateSync(userId);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new InvalidPayloadError("recruiter not found");

    const job = await JobModel.findOneAndDelete({
      _id: job_id,
      recruiter_id: userId,
    });
    if (!job) throw new InvalidPayloadError("job not found");

    return {
      status: 200,
      message: "Job deleted successfully",
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.applyJob = async function applyJob(userId, query, payload) {
  try {
    const { cover_letter } = payload;
    const { job_id } = query;
    yupObjectId().required().validateSync(userId);

    const creator = await CreatorModel.findById(userId);
    if (!creator) throw new InvalidPayloadError("creator not found");

    const job = await JobModel.findOneAndUpdate(
      {
        _id: job_id,
        status: JobAvailability.ACTIVE,
        "applicants.creator_id": { $ne: [userId] },
      },
      {
        $addToSet: {
          applicants: {
            creator_id: userId,
            status: ApplicantStatus.PENDING,
            cover_letter: cover_letter,
            // resume: resume,
          },
        },
      },
      {
        new: true,
      }
    );

    if (!job) {
      const existingJob = await JobModel.findOne({
        _id: job_id,
        status: JobAvailability.ACTIVE,
      });

      if (existingJob) {
        throw new InvalidPayloadError("User has already applied to this job");
      }
      throw new InvalidPayloadError("Job not found or not active");
    }
    await NotificationModel.create({
      from: CollectionEnum.CREATOR,
      recipient: job.recruiter_id,
      recipient_role: CollectionEnum.RECRUITER,
      description: `${creator.bio_data.full_name} has applied for the ${job.title} position.`,
      notification_type: NotificationTypeEnum.JOB_APPLICATION,
    });
    return {
      status: 200,
      message: "Job applied successfully",
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.updateApplicantStatus = async function updateApplicantStatus(
  userId,
  query,
  payload
) {
  try {
    const { job_id, creator_id } = query;
    const { status } = payload;

    // Validate inputs
    await yup
      .object({
        job_id: yupObjectId().required("Job ID is required"),
        creator_id: yupObjectId().required("Creator ID is required"),
        status: yup
          .string()
          .oneOf(
            Object.values(ApplicantStatus),
            "Status must be one of PENDING, SHORTLISTED, NOT_QUALIFIED"
          )
          .required("Status is required"),
      })
      .validate({ job_id, creator_id, status }, { abortEarly: false });

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new InvalidPayloadError("Recruiter not found");

    const job = await JobModel.findOne({
      _id: job_id,
      recruiter_id: userId,
    });
    if (!job)
      throw new InvalidPayloadError("Job not found or not owned by recruiter");

    const applicant = job.applicants.find(
      (applicant) => applicant.creator_id.toString() === creator_id
    );
    if (!applicant)
      throw new InvalidPayloadError("Creator has not applied to this job");

    const updatedJob = await JobModel.findOneAndUpdate(
      {
        _id: job_id,
        "applicants.creator_id": creator_id,
      },
      {
        $set: { "applicants.$.status": status.toUpperCase() },
      },
      { new: true }
    );

    if (!updatedJob)
      throw new InternalServerError("Failed to update applicant status");

    if (
      status === ApplicantStatus.SHORTLISTED ||
      status === ApplicantStatus.SELECTED
    ) {
      await NotificationModel.create({
        from: CollectionEnum.RECRUITER,
        recipient: creator_id,
        recipient_role: CollectionEnum.CREATOR,
        description: `You have been ${status.toLowerCase()} for this ${
          updatedJob?.title
        }.`,
        notification_type: NotificationTypeEnum.JOB_STATUS_UPDATE,
      });
    }

    return {
      status: 200,
      message: "Applicant status updated successfully",
    };
  } catch (error) {
    logger.error(
      `Error updating applicant status: ${error.message}\n${error.stack}`
    );
    handleError(error);
  }
};
