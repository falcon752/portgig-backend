const { RecruiterModel } = require("./recruiters-model");
const logger = require("../config/logging").getLogger("RECRUITER:SERVICE");
const yup = require("yup");
const jwtTokenProvider = require("../config/jwt-token-provider");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const {
  generateValidationToken,
  generateToken,
  isValidToken,
} = require("../config/otp-token-provider");
const Worker = require("worker_threads").Worker;
const path = require("path");

const {
  loginValidationSchema,
  registerationOtpValidationSchema,
  yupObjectId,
  recruiterRegisterationValidationSchema,
  profileDataValidationSchema,
  recruiterProfileDataValidationSchema,
  newsletterRecipientSchema,
  newsletterConfigSchema,
} = require("../config/validation-schemas");

const mail = require("../config/email");

const {
  MailTypeEnum,
  AccountStatusEnum,
  ErrorMessageEnum,
  ProfileSectionEnum,
  ApprovalStatusEnum,
  AuthTypeEnum,
  OtpTypeEnum,
  ProviderEnum,
  ApplicantStatus,
  CollectionEnum,
  RecipientTypeEnum,
  JobAvailability,
} = require("../config/constants");

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
const { CreatorModel } = require("../creators/creators-model");
const { JobModel } = require("../job/job-model");
const adminEmail = process.env.ADMIN_EMAIL

exports.register = async function register(payload) {
  try {
    const {
      full_name,
      // location,
      email,
      password,
      industry,
      // user_name,
      about_us,
      company_name,
    } = recruiterRegisterationValidationSchema.validateSync(payload);

    if (await RecruiterModel.exists({ "auth.email": email })) {
      throw new InvalidPayloadError("Email already exists");
    }

    const token = generateToken();

    const recruiter = await RecruiterModel.create({
      bio_data: {
        full_name,
        // user_name
      },
      auth: {
        email,
        password: bcryptjs.hashSync(password),
        validation_token: token,
      },
      // location,
      industry,
      company_info: { company_name, about_us },
    });

    await mail(MailTypeEnum.WELCOME, {
      email: recruiter?.auth?.email,
      name: `${recruiter?.bio_data?.full_name}`,
      otp: token.value,
    });

    return {
      message:
        "Kindly verify your account with token sent to your registration email",
      status: 201,
      token: token?.value,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.validateRegistrationOtp = async function validateRegistrationOtp(
  payload
) {
  try {
    const { token, email } = payload;
    registerationOtpValidationSchema.validateSync(payload);

    const recruiter = await RecruiterModel.findOne({ "auth.email": email });
    if (!recruiter) {
      throw new InvalidPayloadError("Oops Invalid Credential ! ! !");
    }
    console.log(recruiter);
    if (
      recruiter.auth.validation_token === null ||
      !recruiter.auth.validation_token?.value
    ) {
      throw new InvalidPayloadError(
        "Token not found Or account already verified"
      );
    }
    if (!isValidToken(recruiter.auth.validation_token)) {
      throw new InvalidPayloadError("Invalid Token");
    }
    if (parseInt(recruiter.auth.validation_token.value) !== parseInt(token)) {
      throw new InvalidPayloadError("Invalid Registration Token");
    }
    recruiter.auth.validation_token = null;
    // recruiter.account_status = {
    //   status: AccountStatusEnum.ACTIVE,
    //   comment: "Otp Verified",
    // };

    await recruiter.save();

    return { message: "Account Verified Successfully" };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.login = async function login(payload, device) {
  try {
    const { email, password, device_id } = loginValidationSchema.validateSync(
      payload,
      { stripUnknown: true }
    );
    const recruiter = await RecruiterModel.findOne({ "auth.email": email });

    if (!recruiter) {
      throw new InvalidPayloadError("Invalid Credentials");
    }
    if (recruiter.auth.provider == ProviderEnum.GOOGLE) {
      throw new InvalidPayloadError(
        "This account exists. Please sign in with google."
      );
    }
    if (isValidToken(recruiter?.auth?.validation_token)) {
      throw new InvalidPayloadError("Account is yet to be token validated");
    }

    if (!bcryptjs.compareSync(password, recruiter?.auth?.password)) {
      throw new InvalidPayloadError("Invalid Credentials");
    }

    recruiter.auth.device_id = device_id;
    recruiter.device = device;
    await recruiter.save();
    const profile = createProfile(recruiter);

    return {
      message: "Success",
      status: 200,
      access_token: generateAccessToken(profile.id.toString()),
      refresh_token: generateRefreshToken(profile.id.toString()),
      profile,
    };
  } catch (error) {
    handleError(error);
  }
};

/**
 * Creates a copy of the recruiter's profile object, removing sensitive information.
 * @param {Object} recruiter - The recruiter object.
 * @returns {Object} - The recruiter's profile object without sensitive information.
 */
function createProfile(recruiter) {
  const profile = {
    ...recruiter.toObject({ virtuals: true, minimize: false }),
  };
  delete profile.auth.password;
  delete profile.__t;
  delete profile.__v;
  return profile;
}

/**
 * Generates an access token using the recruiter's ID.
 * @param {string} recruiterId - The recruiter ID.
 * @returns {string} - The generated access token.
 */
function generateAccessToken(recruiterId) {
  return jwtTokenProvider.signJwt(recruiterId);
}

/**
 * Generates a refresh token using the recruiter's ID.
 * @param {string} recruiterId - The recruiter ID.
 * @returns {string} - The generated refresh token.
 */
function generateRefreshToken(recruiterId) {
  return jwtTokenProvider.signRefreshJwt(recruiterId);
}

exports.resendOtp = async function resendOtp(payload) {
  try {
    yup
      .object({
        s_type: yup
          .string()
          .label("Source Type")
          .oneOf(Object.values(AuthTypeEnum))
          .required(),
        type: yup
          .string()
          .label("OTP Type")
          .oneOf(Object.values(OtpTypeEnum))
          .required(),
      })
      .validateSync(payload);
    const { type, s_type } = payload;

    const sourceType = s_type || AuthTypeEnum.EMAIL;
    switch (sourceType) {
      case AuthTypeEnum.EMAIL: {
        yup
          .object({
            email: yup.string().email().label("Email").trim().required(),
          })
          .validateSync(payload);
        const recruiter = await RecruiterModel.findOne({
          "auth.email": payload.email,
        });
        if (!recruiter) {
          throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
        }
        console.log(recruiter);

        if (!recruiter.auth.validation_token.value) {
          throw new InvalidPayloadError(ErrorMessageEnum.ACCOUNT_VERIFIED);
        }

        const token = generateValidationToken();
        recruiter.auth.validation_token = token;
        await recruiter.save();

        await mail(MailTypeEnum.GENERAL_TOKEN, {
          email: recruiter?.auth?.email,
          otp: token?.value,
        });
        return {
          message: "Token Sent to your email" + " " + payload.email,
          status: 200,
          token: token.value,
        };
      }

      case AuthTypeEnum.PHONE:
        {
          yup
            .object({
              phone_number: yup
                .string()
                .email()
                .label("Phone Number")
                .trim()
                .required(),
            })
            .validateSync(payload);
          if (type === OtpTypeEnum.REGISTRATION) {
          }
          if (type === OtpTypeEnum.LOGIN) {
          }
        }
        break;

      default:
        throw new InvalidPayloadError("Unknown Type");
    }
  } catch (error) {
    logger.error(error?.message);
    if (error instanceof yup.ValidationError) {
      throw new InvalidPayloadError(error.errors[0], {
        cause: error,
      });
    }
    if (error instanceof InvalidPayloadError) {
      throw error;
    }
    throw new InternalServerError(undefined, { cause: error });
  }
};

exports.requestPasswordReset = async function requestPasswordReset(payload) {
  try {
    const { email, type } = payload;
    yup
      .object({
        type: yup.string().label("Type").required(),
      })
      .validateSync(payload);
    switch (type) {
      case "EMAIL": {
        yup
          .object({
            email: yup
              .string()
              .email("Invalid email")
              .label("Email")
              .required(),
          })
          .validateSync(payload);

        const recruiter = await RecruiterModel.findOne({
          "auth.email": email,
        });
        if (!recruiter) {
          throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
        }
        const token = isValidToken(recruiter.auth.token)
          ? recruiter.auth.token
          : generateValidationToken();
        recruiter.auth.token = token;
        await recruiter.save();

        await mail(MailTypeEnum.PASSWORD_RESET, {
          name: `${recruiter?.bio_data?.user_name}`,
          otp: token?.value,
          email: recruiter?.auth?.email,
        });
        return { message: "O.T.P Sent to " + payload?.email, status: 200 };
      }

      case "PHONE": {
        yup
          .object({
            phone_number: yup.string().label("Phone Number").required(),
          })
          .validateSync(payload);
        throw new InvalidPayloadError(
          "We are not sending O.T.P via Phone Number for now "
        );
      }

      default:
        throw new InvalidPayloadError("Unknown Type Passed");
    }
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.resetPassword = async function resetPassword(payload) {
  try {
    yup
      .object({
        email: yup.string().label("Email").trim().required(),
        password: yup
          .string()
          .trim()
          .label("Password")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/,
            "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number and one special character"
          )
          .required(),
        token: yup.string().label("Token").trim().required(),
      })
      .validateSync(payload);
    const { email, password, token } = payload;
    const recruiter = await RecruiterModel.findOne({
      "auth.email": email,
    });

    if (!recruiter) {
      throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
    }

    if (!isValidToken(recruiter?.auth?.token)) {
      throw new InvalidPayloadError("Token Expired");
    }
    if (parseInt(recruiter.auth.token.value) !== parseInt(token)) {
      throw new InvalidPayloadError("Invalid Token");
    }

    if (bcryptjs.compareSync(password, recruiter.auth.password)) {
      throw new InvalidPayloadError("Already Used this Password!.");
    }

    recruiter.auth.token = null;
    recruiter.auth.password = bcryptjs.hashSync(password);
    await recruiter.save();
    // @TODO send mail to the recruiter
    return {
      message: "Password Reset Successfully",
      status: 200,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.updatePassword = async function updatePassword(userId, payload) {
  try {
    yup
      .object({
        old_password: yup.string().label("Old Password").trim().required(),
        new_password: yup
          .string()
          .trim()
          .label("Password")
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_\-])(?=.{8,})/,
            "Oops!, password must be at least 8 characters long and must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          )
          .required(),
      })
      .validateSync(payload);
    const { old_password, new_password } = payload;
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter)
      throw new InvalidPayloadError(ErrorMessageEnum.USER_NOT_FOUND);

    if (!bcryptjs.compareSync(old_password, recruiter?.auth?.password)) {
      throw new InvalidPayloadError("Invalid Credential (wrong Old Password)");
    }
    if (bcryptjs.compareSync(new_password, recruiter?.auth?.password)) {
      throw new InvalidPayloadError("Already Used this Password!.");
    }
    recruiter.auth.password = bcryptjs.hashSync(new_password);
    await recruiter.save();
    return {
      message: "Password Updated Successfully",
      status: 200,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.refreshAccessToken = async function refreshAccessToken(
  recruiterId,
  queryParams = {}
) {
  try {
    yup
      .object({
        refresh_token: yup.string().label("Referesh Token ").required(),
        device_id: yup.string().label("Device Id ").optional(),
      })
      .validateSync(queryParams);
    const { refresh_token } = queryParams;
    const jwt = jwtTokenProvider.verifyRefreshJws(refresh_token);
    if (!jwt) {
      throw new UnAuthorizedError("Invalid Refresh Token");
    }
    const recruiter = await RecruiterModel.findById(recruiterId);
    if (!!recruiter.device_id) {
      recruiter.device_id = device_id;
    }
    await recruiter.save();

    return {
      status: 200,
      refresh_token: jwtTokenProvider.signRefreshJwt(recruiterId.toString()),
      access_token: jwtTokenProvider.signJwt(recruiterId.toString()),
    };
  } catch (error) {
    logger.error(error?.message);
    if (error instanceof yup.ValidationError) {
      throw new InvalidPayloadError(error.errors[0], {
        cause: error,
      });
    }
    if (error instanceof InvalidPayloadError) {
      throw error;
    }
    if (error instanceof UnAuthorizedError) {
      throw error;
    }
    throw new InternalServerError(undefined, { cause: error });
  }
};

exports.getUserById = async function getUserById(userId) {
  try {
    yupObjectId().required().validateSync(userId);

    const recruiter = await RecruiterModel.findById(userId);

    if (!recruiter) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return {
      message: "Success",
      data: getUserInfoFromDoc(recruiter),
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.updateProfileBySection = async function updateProfileBySection(
  userId,
  payload,
  queryParams
) {
  try {
    const { profile, bio_data, resume_info } = payload;
    const { section } = queryParams;
    yup
      .object({
        section: yup
          .string()
          .label("Profile Section")
          .oneOf(
            Object.values(ProfileSectionEnum),
            "Section Type has to be one of the available profile section"
          )
          .required(),
      })
      .validateSync({ section });

    const user = await RecruiterModel.findById(userId);
    if (!user) throw new InvalidPayloadError("User Not Found");

    switch (section) {
      case ProfileSectionEnum.PROFILE: {
        const { full_name } =
          recruiterProfileDataValidationSchema.validateSync(profile);
        if (full_name) {
          user.bio_data.full_name = full_name;
        }
        // exclude fullname from user profile
        delete profile.full_name;
        user.profile = { ...user.profile, ...profile };
        break;
      }
      case ProfileSectionEnum.RESUME: {
        // resumeDataValidationSchema.validateSync(resume_info);
        // user.resume = { ...user.resume, ...resume_info };
        // break;
      }

      default:
        throw new InvalidPayloadError("Unknow Section cannot be updated");
    }
    await user.save();
    return { message: `Profile Updated Successfully ! `, status: 200 };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.addRating = async (payload, query, userId) => {
  try {
    const { value, comment } = yup
      .object({
        value: yup.string().label("value").required(),
        comment: yup.string().label("comment").required(),
      })
      .validateSync(payload, {
        stripUnknown: true,
      });

    const creator = await CreatorModel.findById(query.creatorId);
    if (!creator) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    creator.ratings.push({
      value,
      comment,
      user: userId,
    });

    // Calculate the new average rating
    const totalRatings = creator.ratings.length;
    const sumOfRatings = creator.ratings.reduce(
      (acc, rating) => acc + rating.value,
      0
    );

    // Calculate average with one decimal precision
    creator.rating = (sumOfRatings / totalRatings).toFixed(1);

    await creator.save();

    return {
      message: "rating added succesfully",
      status: 200,
      creator,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getCreator = async function getCreator(userId, queryParams = {}) {
  try {
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    const { creatorId } = queryParams;

    const creatorReview = await paginationAggregate(CreatorModel, queryParams, {
      stagesBefore: [
        ...(creatorId
          ? [
              {
                $match: {
                  _id: new mongoose.Types.ObjectId(creatorId),
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "recruiters",
            localField: "ratings.user",
            foreignField: "_id",
            as: "rating_users",
          },
        },
        {
          $project: {
            // full_name: "$bio_data.full_name",
            // last_name: "$bio_data.last_name",
            rating: 1,
            ratings: {
              $map: {
                input: "$ratings",
                as: "rating",
                in: {
                  value: "$$rating.value",
                  comment: "$$rating.comment",
                  created_at: "$$rating.created_at",
                  user: {
                    $let: {
                      vars: {
                        matched_user: {
                          $arrayElemAt: [
                            "$rating_users",
                            {
                              $indexOfArray: [
                                "$rating_users._id",
                                "$$rating.user",
                              ],
                            },
                          ],
                        },
                      },
                      in: {
                        username: {
                          $concat: ["$$matched_user.bio_data.full_name"],
                        },
                        user_id: "$$matched_user._id",
                      },
                    },
                  },
                },
              },
            },
            _id: 1,
            profile: 1,
            resume: 1,
            portfolio: 1,
            bio_data: 1,
            social_clicks: 1,
            profile_views: 1,
            created_at: 1,
            updated_at: 1,
          },
        },
        {
          $unset: "rating_users",
        },
      ],
    });

    return {
      message: "success",
      data: creatorReview,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getRecruiterDashboard = async function getRecruiterDashboard(userId) {
  try {
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    // Aggregation pipeline for jobs and applicants
    const pipeline = [
      // Match jobs by recruiter_id
      {
        $match: {
          recruiter_id: new mongoose.Types.ObjectId(userId),
        },
      },
      // Lookup creator details for applicants
      {
        $lookup: {
          from: "creators",
          localField: "applicants.creator_id",
          foreignField: "_id",
          as: "applicant_details",
        },
      },
      // Unwind applicants for processing, exclude jobs with no applicants
      {
        $unwind: {
          path: "$applicants",
          preserveNullAndEmptyArrays: false, // Only process jobs with applicants
        },
      },
      // Project relevant fields
      {
        $project: {
          title: 1,
          applicant_status: "$applicants.status",
          applicant_id: "$applicants.creator_id",
          application_date: "$applicants.application_date", // Use applicants.application_date
          applicant_info: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$applicant_details",
                  as: "creator",
                  cond: { $eq: ["$$creator._id", "$applicants.creator_id"] },
                },
              },
              0,
            ],
          },
        },
      },
      // Group to collect dashboard data
      {
        $group: {
          _id: null,
          job_titles: { $addToSet: "$title" },
          total_applicants: { $sum: 1 },
          shortlisted_applicants: {
            $push: {
              $cond: {
                if: { $eq: ["$applicant_status", ApplicantStatus.SHORTLISTED] },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicant_info.bio_data",
                    profile: "$applicant_info.profile",
                    resume: "$applicant_info.resume",
                    portfolio: "$applicant_info.portfolio",
                    rating: "$applicant_info.rating",
                    profile_views: "$applicant_info.profile_views",
                    social_clicks: "$applicant_info.social_clicks",
                  },
                  application_date: "$application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          selected_applicants: {
            $push: {
              $cond: {
                if: { $eq: ["$applicant_status", ApplicantStatus.SELECTED] },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicant_info.bio_data",
                    profile: "$applicant_info.profile",
                    resume: "$applicant_info.resume",
                    portfolio: "$applicant_info.portfolio",
                    rating: "$applicant_info.rating",
                    profile_views: "$applicant_info.profile_views",
                    social_clicks: "$applicant_info.social_clicks",
                  },
                  application_date: "$application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          not_qualified_applicants: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$applicant_status", ApplicantStatus.NOT_QUALIFIED],
                },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicant_info.bio_data",
                    profile: "$applicant_info.profile",
                    resume: "$applicant_info.resume",
                    portfolio: "$applicant_info.portfolio",
                    rating: "$applicant_info.rating",
                    profile_views: "$applicant_info.profile_views",
                    social_clicks: "$applicant_info.social_clicks",
                  },
                  application_date: "$application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          applicant_details: {
            $push: {
              job_title: "$title",
              applicant_info: {
                bio_data: "$applicant_info.bio_data",
                profile: "$applicant_info.profile",
                resume: "$applicant_info.resume",
                portfolio: "$applicant_info.portfolio",
                rating: "$applicant_info.rating",
                profile_views: "$applicant_info.profile_views",
                social_clicks: "$applicant_info.social_clicks",
              },
              application_date: "$application_date",
            },
          },
          latest_application: {
            $max: {
              application_date: "$application_date",
              job_title: "$title",
              applicant_info: {
                bio_data: "$applicant_info.bio_data",
                profile: "$applicant_info.profile",
                resume: "$applicant_info.resume",
                portfolio: "$applicant_info.portfolio",
                rating: "$applicant_info.rating",
                profile_views: "$applicant_info.profile_views",
                social_clicks: "$applicant_info.social_clicks",
              },
            },
          },
        },
      },
      // Lookup all job titles to include jobs without applicants
      {
        $lookup: {
          from: "jobs",
          let: { recruiter_id: new mongoose.Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$recruiter_id", "$$recruiter_id"] },
              },
            },
            {
              $project: {
                title: 1,
              },
            },
          ],
          as: "all_jobs",
        },
      },
      // Project final output
      {
        $project: {
          _id: 0,
          job_titles: { $setUnion: ["$job_titles", "$all_jobs.title"] },
          total_jobs_posted: { $size: "$all_jobs" },
          total_applicants: 1,
          shortlisted_applicants: 1,
          selected_applicants: 1,
          not_qualified_applicants: 1,
          applicant_details: 1,
          latest_application: {
            $cond: {
              if: { $eq: ["$latest_application", null] },
              then: null,
              else: {
                job_title: "$latest_application.job_title",
                applicant_info: {
                  bio_data: "$latest_application.applicant_info.bio_data",
                  profile: "$latest_application.applicant_info.profile",
                  resume: "$latest_application.applicant_info.resume",
                  portfolio: "$latest_application.applicant_info.portfolio",
                  rating: "$latest_application.applicant_info.rating",
                  profile_views:
                    "$latest_application.applicant_info.profile_views",
                  social_clicks:
                    "$latest_application.applicant_info.social_clicks",
                },
                application_date: "$latest_application.application_date",
              },
            },
          },
        },
      },
    ];

    const [dashboardData] = await JobModel.aggregate(pipeline);

    if (!dashboardData) {
      // Fetch job titles for empty case
      const jobs = await JobModel.find({ recruiter_id: userId }).select(
        "title"
      );
      return {
        status: 200,
        message: "No jobs found for recruiter",
        data: {
          total_jobs_posted: jobs.length,
          total_applicants: 0,
          job_titles: jobs.map((job) => job.title),
          shortlisted_applicants: [],
          selected_applicants: [],
          not_qualified_applicants: [],
          applicant_details: [],
          latest_application: null,
        },
      };
    }

    return {
      status: 200,
      message: "Recruiter dashboard data retrieved successfully",
      data: {
        total_jobs_posted: dashboardData.total_jobs_posted || 0,
        total_applicants: dashboardData.total_applicants || 0,
        job_titles: dashboardData.job_titles || [],
        shortlisted_applicants: dashboardData.shortlisted_applicants || [],
        selected_applicants: dashboardData.selected_applicants || [],
        not_qualified_applicants: dashboardData.not_qualified_applicants || [],
        applicant_details: dashboardData.applicant_details || [],
        latest_application: dashboardData.latest_application || null,
      },
    };
  } catch (error) {
    logger.error(
      `Error fetching recruiter dashboard: ${error.message}\n${error.stack}`
    );
    throw new InternalServerError("Failed to fetch recruiter dashboard");
  }
};

exports.getAllUsers = async function getAllUsers(userId, queryParams = {}) {
  try {
    const { limit = 20, page = 1 } = queryParams;
    const skip = (page - 1) * limit;

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter || recruiter.auth.email !== adminEmail) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    // Fetch creators with populated ratings.user and profile_views.view_history.view_by
    const creatorsPromise = CreatorModel.find()
      .select("-auth.password -auth.token -auth.validation_token")
      .populate({
        path: "ratings.user",
        select: "bio_data.full_name bio_data.user_name",
        model: "Recruiter",
      })
      .populate({
        path: "profile_views.view_history.view_by",
        select: "bio_data.full_name bio_data.user_name",
        model: "Creator",
        match: { "profile_views.view_history.recipient_role": "creators" },
      })
      .populate({
        path: "profile_views.view_history.view_by",
        select: "bio_data.full_name company_info.company_name",
        model: "Recruiter",
        match: { "profile_views.view_history.recipient_role": "recruiters" },
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Fetch recruiters with populated ratings.user
    const recruitersPromise = RecruiterModel.find()
      .select("-auth.password -auth.token -auth.validation_token")
      .populate({
        path: "ratings.user",
        select: "bio_data.full_name bio_data.user_name",
        model: "Creator",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const [creators, recruiters] = await Promise.all([
      creatorsPromise,
      recruitersPromise,
    ]);

    return {
      status: 200,
      message: "Users fetched successfully",
      data: {
        creators,
        recruiters,
        totalCreators: await CreatorModel.countDocuments(),
        totalRecruiters: await RecruiterModel.countDocuments(),
      },
    };
  } catch (error) {
    logger.error(`Error fetching all users: ${error.message}\n${error.stack}`);
    handleError(error);
  }
};

exports.getUserTypeById = async function getUserTypeById(userId, queryParams) {
  try {
    const { userTypeId, userType } = queryParams;
    await yupObjectId().required().validate(userTypeId);
    await yup
      .string()
      .required()
      .oneOf(["creator", "recruiter"])
      .validate(userType);

    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter || recruiter.auth.email !== adminEmail) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    let user;
    if (userType === "creator") {
      user = await CreatorModel.findById(userTypeId)
        .select("-auth.password -auth.token -auth.validation_token")
        .populate({
          path: "ratings.user",
          select: "bio_data.full_name bio_data.user_name",
          model: "Recruiter",
        })
        .populate({
          path: "profile_views.view_history.view_by",
          select: "bio_data.full_name bio_data.user_name",
          model: "Creator",
          match: { "profile_views.view_history.recipient_role": "creators" },
        })
        .populate({
          path: "profile_views.view_history.view_by",
          select: "bio_data.full_name company_info.company_name",
          model: "Recruiter",
          match: { "profile_views.view_history.recipient_role": "recruiters" },
        })
        .lean();
    } else {
      user = await RecruiterModel.findById(userTypeId)
        .select("-auth.password -auth.token -auth.validation_token")
        .populate({
          path: "ratings.user",
          select: "bio_data.full_name bio_data.user_name",
          model: "Creator",
        })
        .lean();
    }

    if (!user) {
      throw new InvalidPayloadError(`${userType} not found`);
    }

    return {
      status: 200,
      message: `${userType} fetched successfully`,
      data: user,
    };
  } catch (error) {
    logger.error(`Error fetching user by ID: ${error.message}\n${error.stack}`);
    handleError(error);
  }
};

exports.getAdminJobsDashboard = async function getAdminJobsDashboard(
  userId,
  queryParams = {}
) {
  try {
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter || recruiter.auth.email !== adminEmail) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }
    const {
      job_id,
      status,
      title,
      work_mode,
      experience,
      industry,
      limit = 10,
      page = 1,
    } = queryParams;
    const skip = (page - 1) * limit;

    // Validate inputs
    if (job_id) {
      await yupObjectId().required().validate(job_id);
    }
    if (status) {
      await yup
        .string()
        .required()
        .oneOf(Object.values(JobAvailability))
        .validate(status.toUpperCase());
    }

    // Build match stage for filtering
    const matchStage = {};
    if (job_id) {
      matchStage._id = new mongoose.Types.ObjectId(job_id);
    }
    if (status) {
      matchStage.status = status.toUpperCase();
    }
    if (title) {
      matchStage.title = { $regex: title, $options: "i" };
    }
    if (work_mode) {
      matchStage.work_mode = work_mode.toLowerCase();
    }
    if (experience) {
      matchStage.experience = experience.toLowerCase();
    }
    if (industry) {
      matchStage.industry = industry.toLowerCase();
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "creators",
          localField: "applicants.creator_id",
          foreignField: "_id",
          as: "applicant_details",
        },
      },
      {
        $lookup: {
          from: "recruiters",
          localField: "recruiter_id",
          foreignField: "_id",
          as: "recruiter_info",
        },
      },
      {
        $unwind: {
          path: "$recruiter_info",
          preserveNullAndEmptyArrays: true,
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
                views: "$$applicant.views",
                application_date: "$$applicant.application_date",
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
                portfolio: {
                  $arrayElemAt: [
                    "$applicant_details.portfolio",
                    {
                      $indexOfArray: [
                        "$applicant_details._id",
                        "$$applicant.creator_id",
                      ],
                    },
                  ],
                },
                profile_views: {
                  $arrayElemAt: [
                    "$applicant_details.profile_views",
                    {
                      $indexOfArray: [
                        "$applicant_details._id",
                        "$$applicant.creator_id",
                      ],
                    },
                  ],
                },
                social_clicks: {
                  $arrayElemAt: [
                    "$applicant_details.social_clicks",
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
                  cond: {
                    $eq: ["$$applicant.status", ApplicantStatus.PENDING],
                  },
                },
              },
            },
            selected: {
              $size: {
                $filter: {
                  input: "$applicants",
                  as: "applicant",
                  cond: {
                    $eq: ["$$applicant.status", ApplicantStatus.SELECTED],
                  },
                },
              },
            },
            shortlisted: {
              $size: {
                $filter: {
                  input: "$applicants",
                  as: "applicant",
                  cond: {
                    $eq: ["$$applicant.status", ApplicantStatus.SHORTLISTED],
                  },
                },
              },
            },
            not_qualified: {
              $size: {
                $filter: {
                  input: "$applicants",
                  as: "applicant",
                  cond: {
                    $eq: ["$$applicant.status", ApplicantStatus.NOT_QUALIFIED],
                  },
                },
              },
            },
          },
          recruiter: {
            full_name: "$recruiter_info.bio_data.full_name",
            user_name: "$recruiter_info.bio_data.user_name",
            company_name: "$recruiter_info.company_info.company_name",
            location: "$recruiter_info.profile.location",
          },
        },
      },
      // Unwind applicants for dashboard aggregation
      {
        $unwind: {
          path: "$applicants",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Group to collect dashboard data
      {
        $group: {
          _id: null,
          jobs: {
            $push: {
              _id: "$_id",
              title: "$title",
              description: "$description",
              salary_range: "$salary_range",
              deadline: "$deadline",
              work_mode: "$work_mode",
              location: "$location",
              skills: "$skills",
              status: "$status",
              created_at: "$created_at",
              updated_at: "$updated_at",
              recruiter: "$recruiter",
              applicants: "$applicants",
              applicant_status_counts: "$applicant_status_counts",
            },
          },
          job_titles: { $addToSet: "$title" },
          total_applicants: {
            $sum: { $cond: [{ $ifNull: ["$applicants", false] }, 1, 0] },
          },
          shortlisted_applicants: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$applicants.status", ApplicantStatus.SHORTLISTED],
                },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicants.bio_data",
                    profile: "$applicants.profile",
                    resume: "$applicants.resume",
                    portfolio: "$applicants.portfolio",
                    rating: "$applicants.rating",
                    profile_views: "$applicants.profile_views",
                    social_clicks: "$applicants.social_clicks",
                  },
                  application_date: "$applicants.application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          selected_applicants: {
            $push: {
              $cond: {
                if: { $eq: ["$applicants.status", ApplicantStatus.SELECTED] },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicants.bio_data",
                    profile: "$applicants.profile",
                    resume: "$applicants.resume",
                    portfolio: "$applicants.portfolio",
                    rating: "$applicants.rating",
                    profile_views: "$applicants.profile_views",
                    social_clicks: "$applicants.social_clicks",
                  },
                  application_date: "$applicants.application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          not_qualified_applicants: {
            $push: {
              $cond: {
                if: {
                  $eq: ["$applicants.status", ApplicantStatus.NOT_QUALIFIED],
                },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicants.bio_data",
                    profile: "$applicants.profile",
                    resume: "$applicants.resume",
                    portfolio: "$applicants.portfolio",
                    rating: "$applicants.rating",
                    profile_views: "$applicants.profile_views",
                    social_clicks: "$applicants.social_clicks",
                  },
                  application_date: "$applicants.application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          applicant_details: {
            $push: {
              $cond: {
                if: { $ifNull: ["$applicants", false] },
                then: {
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicants.bio_data",
                    profile: "$applicants.profile",
                    resume: "$applicants.resume",
                    portfolio: "$applicants.portfolio",
                    rating: "$applicants.rating",
                    profile_views: "$applicants.profile_views",
                    social_clicks: "$applicants.social_clicks",
                  },
                  application_date: "$applicants.application_date",
                },
                else: "$$REMOVE",
              },
            },
          },
          latest_application: {
            $max: {
              $cond: {
                if: { $ifNull: ["$applicants", false] },
                then: {
                  application_date: "$applicants.application_date",
                  job_title: "$title",
                  applicant_info: {
                    bio_data: "$applicants.bio_data",
                    profile: "$applicants.profile",
                    resume: "$applicants.resume",
                    portfolio: "$applicants.portfolio",
                    rating: "$applicants.rating",
                    profile_views: "$applicants.profile_views",
                    social_clicks: "$applicants.social_clicks",
                  },
                },
                else: null,
              },
            },
          },
        },
      },
      // Lookup all job titles to include jobs without applicants
      {
        $lookup: {
          from: "jobs",
          pipeline: [{ $match: matchStage }, { $project: { title: 1 } }],
          as: "all_jobs",
        },
      },
      // Project final output
      {
        $project: {
          _id: 0,
          jobs: 1,
          job_titles: { $setUnion: ["$job_titles", "$all_jobs.title"] },
          total_jobs_posted: { $size: "$all_jobs" },
          total_applicants: 1,
          shortlisted_applicants: 1,
          selected_applicants: 1,
          not_qualified_applicants: 1,
          applicant_details: 1,
          latest_application: {
            $cond: {
              if: { $eq: ["$latest_application", null] },
              then: null,
              else: {
                job_title: "$latest_application.job_title",
                applicant_info: {
                  bio_data: "$latest_application.applicant_info.bio_data",
                  profile: "$latest_application.applicant_info.profile",
                  resume: "$latest_application.applicant_info.resume",
                  portfolio: "$latest_application.applicant_info.portfolio",
                  rating: "$latest_application.applicant_info.rating",
                  profile_views:
                    "$latest_application.applicant_info.profile_views",
                  social_clicks:
                    "$latest_application.applicant_info.social_clicks",
                },
                application_date: "$latest_application.application_date",
              },
            },
          },
          applicant_status_counts: {
            $arrayElemAt: ["$jobs.applicant_status_counts", 0],
          },
        },
      },
      // Apply pagination
      {
        $skip: job_id ? 0 : skip,
      },
      {
        $limit: job_id ? 1 : parseInt(limit),
      },
    ];

    const [dashboardData] = await JobModel.aggregate(pipeline);

    // Handle case where no jobs are found
    if (!dashboardData || !dashboardData.jobs) {
      const jobs = await JobModel.find(matchStage).select("title").lean();
      return {
        status: 200,
        message: "No jobs found",
        data: {
          jobs: [],
          total_jobs_posted: jobs.length,
          job_titles: jobs.map((job) => job.title),
          total_applicants: 0,
          shortlisted_applicants: [],
          selected_applicants: [],
          not_qualified_applicants: [],
          applicant_details: [],
          applicant_status_counts: {
            pending: 0,
            selected: 0,
            shortlisted: 0,
            not_qualified: 0,
          },
          latest_application: null,
        },
      };
    }

    // If fetching a specific job, return only that job
    if (job_id) {
      const job = dashboardData.jobs.find((j) => j._id.toString() === job_id);
      if (!job) {
        throw new InvalidPayloadError("Job not found");
      }
      return {
        status: 200,
        message: "Job fetched successfully",
        data: {
          jobs: job,
          total_jobs_posted: dashboardData.total_jobs_posted,
          job_titles: dashboardData.job_titles,
          total_applicants: dashboardData.total_applicants,
          shortlisted_applicants: dashboardData.shortlisted_applicants,
          selected_applicants: dashboardData.selected_applicants,
          not_qualified_applicants: dashboardData.not_qualified_applicants,
          applicant_details: dashboardData.applicant_details,
          applicant_status_counts: dashboardData.applicant_status_counts,
          latest_application: dashboardData.latest_application,
        },
      };
    }

    return {
      status: 200,
      message: matchStage.status
        ? `Jobs with status ${status} fetched successfully`
        : "Jobs and dashboard data retrieved successfully",
      data: {
        jobs: dashboardData.jobs,
        total_jobs_posted: dashboardData.total_jobs_posted,
        job_titles: dashboardData.job_titles,
        total_applicants: dashboardData.total_applicants,
        shortlisted_applicants: dashboardData.shortlisted_applicants,
        selected_applicants: dashboardData.selected_applicants,
        not_qualified_applicants: dashboardData.not_qualified_applicants,
        applicant_details: dashboardData.applicant_details,
        applicant_status_counts: dashboardData.applicant_status_counts,
        latest_application: dashboardData.latest_application,
      },
    };
  } catch (error) {
    logger.error(
      `Error fetching admin jobs dashboard: ${error.message}\n${error.stack}`
    );
    handleError(error);
  }
};

async function getNewsletterRecipients(recipientType, specificEmails = []) {
  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let emails = [];

    // If specific emails are provided, use them directly
    if (specificEmails.length > 0) {
      return specificEmails;
    }

    switch (recipientType) {
      case RecipientTypeEnum.ALL:
        const [creatorEmails, recruitersEmail /*, cohostEmails*/] =
          await Promise.all([
            CreatorModel.aggregate([{ $project: { email: "$auth.email" } }]),
            RecruiterModel.aggregate([{ $project: { email: "$auth.email" } }]),
          ]);
        emails = [...creatorEmails, ...recruitersEmail /*, ...cohostEmails*/];
        break;

      case RecipientTypeEnum.ALL_CREATORS:
        emails = await CreatorModel.aggregate([
          { $project: { email: "$auth.email" } },
        ]);
        break;

      case RecipientTypeEnum.ALL_RECRUITERS:
        emails = await RecruiterModel.aggregate([
          { $project: { email: "$auth.email" } },
        ]);
        break;
      default:
        throw new InvalidPayloadError(
          `Invalid recipient type: ${recipientType}`,
          { status: 400 }
        );
    }

    // Return array of emails instead of a joined string
    const emailArray = emails
      .map((doc) => doc.email)
      .filter((email) => email && typeof email === "string"); // Ensure valid emails
    // if (emailArray.length === 0) {
    //   throw new InvalidPayloadError(
    //     `No valid emails found for recipient type: ${recipientType}`,
    //     { status: 400 }
    //   );
    // }
    return emailArray;
  } catch (error) {
    logger.error(
      `[NEWSLETTER_RECIPIENTS] - error: ${new Date().toLocaleString("en-US", {
        timeZone: "Africa/Lagos",
      })} -- ${error.message}`,
      {
        error: error.toObject?.() || {
          message: error.message,
          name: error.name,
          status: error.status,
          cause: error.cause,
        },
      }
    );
    throw error instanceof InvalidPayloadError
      ? error
      : new InternalServerError(
          `Failed to fetch recipients: ${error.message}`,
          { cause: error }
        );
  }
}

exports.sendNewsletter = async function sendNewsletter(userId, payload) {
  try {
    console.log("Sending newsletter with payload:", payload);
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter || recruiter.auth.email !== adminEmail) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    // Validate payload
    const { recipientType, specificEmails } =
      newsletterRecipientSchema.validateSync(payload.newsletterRecipient);
    newsletterConfigSchema.validateSync(payload.newsletterConfig);

    // Get recipient emails
    const emails = await getNewsletterRecipients(recipientType, specificEmails);
    console.log(`Emails to queue: ${emails.length} recipients`);

    if (emails.length === 0) {
      return {
        message: "No recipients found for newsletter",
        data: {
          recipientType,
          specificEmails,
          emailsQueued: 0,
        },
      };
    }

    const worker = new Worker(path.join(__dirname, "newsletterWorker.js"), {
      workerData: { emails, newsletterConfig: payload.newsletterConfig },
    });

    worker.on("error", (error) => {
      logger.error(
        `[NEWSLETTER] - error: ${new Date().toLocaleString("en-US", {
          timeZone: "Africa/Lagos",
        })} -- Worker error: ${error.message}`,
        {
          error: {
            message: error.message,
            name: error.name,
            status: 500,
            cause: error.cause?.message || null,
          },
        }
      );
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        logger.error(`[NEWSLETTER] - Worker exited with code ${code}`);
      } else {
        logger.info(
          `[NEWSLETTER] - ${new Date().toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
          })} -- Worker completed email sending`
        );
      }
    });

    // Return immediate response
    return {
      message: "Newsletter queued for sending",
      data: {
        recipientType,
        specificEmails,
        emailsQueued: emails.length,
      },
    };
  } catch (error) {
    logger.error(
      `[NEWSLETTER] - error: ${new Date().toLocaleString("en-US", {
        timeZone: "Africa/Lagos",
      })} -- ${error.message}`,
      {
        error: error.toObject?.() || {
          message: error.message,
          name: error.name,
          status: error.status || 500,
          cause: error.cause?.message || null,
        },
      }
    );
    handleError(error);
  }
};

exports.deleteAccount = async function deleteAccount(userId, queryParams) {
  try {
    const { userType, userTypeId } = queryParams;
    await yupObjectId().required().validate(userTypeId);
    await yup
      .string()
      .required()
      .oneOf(["creator", "recruiter"])
      .validate(userType);
    const recruiter = await RecruiterModel.findById(userId);
    if (!recruiter || recruiter.auth.email !== adminEmail) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    if (userType === "creator") {
      const creator = await CreatorModel.findById(userTypeId);
      if (!creator) {
        throw new InvalidPayloadError("Creator not found");
      }
      await CreatorModel.deleteOne({ _id: userTypeId });
    } else if (userType === "recruiter") {
      const recruiter = await RecruiterModel.findById(userTypeId);
      if (!recruiter) {
        throw new InvalidPayloadError("Recruiter not found");
      }
      await RecruiterModel.deleteOne({ _id: userTypeId });
    }

    return {
      success: true,
      message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} account deleted successfully`,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};
