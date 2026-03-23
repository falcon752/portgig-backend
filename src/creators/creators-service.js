const { CreatorModel } = require("./creators-model");
const logger = require("../config/logging").getLogger("CREATOR:SERVICE");
const yup = require("yup");
const jwtTokenProvider = require("../config/jwt-token-provider");
const bcryptjs = require("bcryptjs");
const mongoose = require("mongoose");
const {
  generateValidationToken,
  generateToken,
  isValidToken,
} = require("../config/otp-token-provider");

const {
  loginValidationSchema,
  registerationValidationSchema,
  registerationOtpValidationSchema,
  yupObjectId,
  authDataValidationSchema,
  profileDataValidationSchema,
  resumeDataValidationSchema,
  portfolioDataValidationSchema,
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
const { RecruiterModel } = require("../recruiters/recruiters-model");

exports.register = async function register(payload) {
  try {
    const {
      full_name,
      state,
      email,
      password,
      industry,
      user_name,
      field,
      lga,
      years_of_experience,
      phone_number,
    } = registerationValidationSchema.validateSync(payload);

    if (await CreatorModel.exists({ "auth.email": email })) {
      throw new InvalidPayloadError("Email already exists");
    }

    const token = generateToken();

    const creator = await CreatorModel.create({
      bio_data: { full_name, user_name },
      auth: {
        email,
        password: bcryptjs.hashSync(password),
        validation_token: token,
      },
      profile: {
        location: { lga, state },
        industry,
        field,
        years_of_experience,
        phone_number,
      },
    });

    await mail(MailTypeEnum.WELCOME, {
      email: creator?.auth?.email,
      name: `${creator?.bio_data?.user_name}`,
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

    const creator = await CreatorModel.findOne({ "auth.email": email });
    if (!creator) {
      throw new InvalidPayloadError("Oops Invalid Credential ! ! !");
    }
    console.log(creator);

    if (
      creator.auth.validation_token === null ||
      !creator.auth.validation_token?.value
    ) {
      throw new InvalidPayloadError(
        "Token not found Or account already verified"
      );
    }
    if (!isValidToken(creator.auth.validation_token)) {
      throw new InvalidPayloadError("Invalid Token");
    }
    if (parseInt(creator.auth.validation_token.value) !== parseInt(token)) {
      throw new InvalidPayloadError("Invalid Registration Token");
    }
    creator.auth.validation_token = null;
    // creator.account_status = {
    //   status: AccountStatusEnum.ACTIVE,
    //   comment: "Otp Verified",
    // };

    await creator.save();

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
    const creator = await CreatorModel.findOne({ "auth.email": email });

    if (!creator) {
      throw new InvalidPayloadError("Invalid Credentials");
    }
    if (creator.auth.provider == ProviderEnum.GOOGLE) {
      throw new InvalidPayloadError(
        "This account exists. Please sign in google."
      );
    }
    if (isValidToken(creator?.auth?.validation_token)) {
      throw new InvalidPayloadError("Account is yet to be token validated");
    }

    if (!bcryptjs.compareSync(password, creator?.auth?.password)) {
      throw new InvalidPayloadError("Invalid Credentials");
    }

    creator.auth.device_id = device_id;
    creator.device = device;
    await creator.save();
    const profile = createProfile(creator);

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
 * Creates a copy of the creator's profile object, removing sensitive information.
 * @param {Object} creator - The creator object.
 * @returns {Object} - The creator's profile object without sensitive information.
 */
function createProfile(creator) {
  const profile = { ...creator.toObject({ virtuals: true, minimize: false }) };
  delete profile.auth.password;
  delete profile.__t;
  delete profile.__v;
  return profile;
}

/**
 * Generates an access token using the creator's ID.
 * @param {string} creatorId - The creator ID.
 * @returns {string} - The generated access token.
 */
function generateAccessToken(creatorId) {
  return jwtTokenProvider.signJwt(creatorId);
}

/**
 * Generates a refresh token using the creator's ID.
 * @param {string} creatorId - The creator ID.
 * @returns {string} - The generated refresh token.
 */
function generateRefreshToken(creatorId) {
  return jwtTokenProvider.signRefreshJwt(creatorId);
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
        const creator = await CreatorModel.findOne({
          "auth.email": payload.email,
        });
        if (!creator) {
          throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
        }
        console.log(creator);

        if (!creator.auth.validation_token.value) {
          throw new InvalidPayloadError(ErrorMessageEnum.ACCOUNT_VERIFIED);
        }

        const token = generateValidationToken();
        creator.auth.validation_token = token;
        await creator.save();

        await mail(MailTypeEnum.GENERAL_TOKEN, {
          email: creator?.auth?.email,
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

        const creator = await CreatorModel.findOne({
          "auth.email": email,
        });
        if (!creator) {
          throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
        }
        const token = isValidToken(creator.auth.token)
          ? creator.auth.token
          : generateValidationToken();
        creator.auth.token = token;
        await creator.save();

        // await mail(MailTypeEnum.PASSWORD_RESET, {
        //   name: `${creator?.bio_data?.user_name}`,
        //   otp: token?.value,
        //   email: creator?.auth?.email,
        // });
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
          .required("Password is required")
          .min(8, "Password must be at least 8 characters long")
          .matches(
            /[a-z]/,
            "Password must contain at least one lowercase letter"
          )
          .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
          )
          .matches(/[0-9]/, "Password must contain at least one number")
          .matches(
            /[!@#\$%\^&\*_\-]/,
            "Password must contain at least one special character"
          )
          .required(),
        token: yup.string().label("Token").trim().required(),
      })
      .validateSync(payload);
    const { email, password, token } = payload;
    const creator = await CreatorModel.findOne({
      "auth.email": email,
    });

    if (!creator) {
      throw new InvalidPayloadError(ErrorMessageEnum.INVALID_CREDENTIALS);
    }

    if (!isValidToken(creator?.auth?.token)) {
      throw new InvalidPayloadError("Token Expired");
    }
    if (parseInt(creator.auth.token.value) !== parseInt(token)) {
      throw new InvalidPayloadError("Invalid Token");
    }

    if (bcryptjs.compareSync(password, creator.auth.password)) {
      throw new InvalidPayloadError("Already Used this Password!.");
    }

    creator.auth.token = null;
    creator.auth.password = bcryptjs.hashSync(password);
    await creator.save();
    await mail(MailTypeEnum.SEND_TO_WAITLIST, {
      email: creator.auth.email,
      subject: "Password Reset Successful",
      content: `Hi ${creator?.bio_data?.user_name || "there"},<br><br>Your password has been reset successfully. If you did not make this change, please contact support immediately at ${process.env.SUPPORT_MAIL}.`,
    });
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
          .required("Password is required")
          .min(8, "Password must be at least 8 characters long")
          .matches(
            /[a-z]/,
            "Password must contain at least one lowercase letter"
          )
          .matches(
            /[A-Z]/,
            "Password must contain at least one uppercase letter"
          )
          .matches(/[0-9]/, "Password must contain at least one number")
          .matches(
            /[!@#\$%\^&\*_\-]/,
            "Password must contain at least one special character"
          )
          .required(),
      })
      .validateSync(payload);
    const { old_password, new_password } = payload;
    const creator = await CreatorModel.findById(userId);
    if (!creator)
      throw new InvalidPayloadError(ErrorMessageEnum.USER_NOT_FOUND);

    if (!bcryptjs.compareSync(old_password, creator?.auth?.password)) {
      throw new InvalidPayloadError("Invalid Credential (wrong Old Password)");
    }
    if (bcryptjs.compareSync(new_password, creator?.auth?.password)) {
      throw new InvalidPayloadError("Already Used this Password!.");
    }
    creator.auth.password = bcryptjs.hashSync(new_password);
    await creator.save();
    return {
      message: "Password Updated Successfully",
      status: 200,
    };
  } catch (error) {
    console.log("reach here");
    logger.error(`Error in updatePassword: ${error.message}`);
    handleError(error);
  }
};

exports.refreshAccessToken = async function refreshAccessToken(
  creatorId,
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
    const creator = await CreatorModel.findById(creatorId);
    if (!!creator.device_id) {
      creator.device_id = device_id;
    }
    await creator.save();

    return {
      status: 200,
      refresh_token: jwtTokenProvider.signRefreshJwt(creatorId.toString()),
      access_token: jwtTokenProvider.signJwt(creatorId.toString()),
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

exports.getUserProfile = async function getUserProfile(userId) {
  try {
    yupObjectId().required().validateSync(userId);

    const creator = await CreatorModel.findById(userId)
      .populate({
        path: "ratings.user",
        select: "bio_data.full_name bio_data.user_name profile.full_name",
        options: { lean: true },
      })
      .populate({
        path: "profile_views.view_history.view_by",
        select: "bio_data.full_name bio_data.user_name profile.full_name",
        options: { lean: true },
      })
      .lean({ virtuals: true });

    if (!creator) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    // attach easy-to-use names
    const nameFrom = (u) =>
      u?.profile?.full_name ||
      u?.bio_data?.full_name ||
      u?.bio_data?.user_name ||
      u?.full_name ||
      u?.user_name ||
      "Unknown";

    const ratings = (creator.ratings || []).map((r) => ({
      value: r.value,
      comment: r.comment,
      created_at: r.created_at,
      user_id: r.user?._id || null,
      user_name: r.user ? nameFrom(r.user) : null,
    }));

    const viewHistory = (creator.profile_views?.view_history || []).map(
      (v) => ({
        viewed_at: v.viewed_at,
        recipient_role: v.recipient_role,
        viewer_id: v.view_by?._id || null,
        viewer_name: v.view_by ? nameFrom(v.view_by) : null,
      })
    );

    // optional: keep original objects if you still need them
    const data = {
      ...creator,
      ratings,
      profile_views: {
        number: creator.profile_views?.number ?? 0,
        last_viewed: creator.profile_views?.last_viewed ?? null,
        view_history: viewHistory,
      },
    };

    return { message: "Success", data };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getUserById = async function getUserById(userId) {
  try {
    yupObjectId().required().validateSync(userId);

    const creator = await CreatorModel.findById(userId);

    if (!creator) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return {
      message: "Success",
      data: getUserInfoFromDoc(creator),
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
    const { profile, bio_data, resume_info, portfolio } = payload;
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

    const user = await CreatorModel.findById(userId);
    if (!user) throw new InvalidPayloadError("User Not Found");

    switch (section) {
      case ProfileSectionEnum.PROFILE: {
        // console.log(profile);
        profileDataValidationSchema.validateSync(profile);
        // if (profile?.bio) {
        //   user.bio = profile?.bio;
        //   delete profile.bio;
        // }
        user.profile = {
          ...user.profile,
          ...Object.fromEntries(
            Object.entries(profile || {}).filter(
              ([_, value]) => value !== undefined
            )
          ),
        };
        break;
      }
      case ProfileSectionEnum.RESUME: {
        // console.log(resume_info);
        resumeDataValidationSchema.validateSync(resume_info);
        user.resume = {
          ...user.resume,
          ...Object.fromEntries(
            Object.entries(resume_info || {}).filter(
              ([_, value]) => value !== undefined
            )
          ),
        };
        break;
      }
      case ProfileSectionEnum.PORTFOLIO: {
        portfolioDataValidationSchema.validateSync(portfolio);
        if (!user.portfolio) {
          user.portfolio = {};
        }
        if (
          portfolio.template_type &&
          portfolio.template_type !== user.portfolio.template_type
        ) {
          // Reset template-specific fields if template_type changes
          user.portfolio.template_specific = {};
          user.portfolio.template_type = portfolio.template_type;
        }

        const commonFields = Object.fromEntries(
          Object.entries(portfolio).filter(
            ([key, value]) => key !== "template_specific" && value !== undefined
          )
        );
        user.portfolio = { ...user.portfolio, ...commonFields };

        if (portfolio.template_specific) {
          const templateType =
            user.portfolio.template_type || portfolio.template_type;
          if (!templateType) {
            throw new InvalidPayloadError("Template type must be specified");
          }
          // Ensure template_specific is an object
          user.portfolio.template_specific =
            user.portfolio.template_specific || {};
          // Merge template-specific fields for the given template type
          user.portfolio.template_specific[templateType.toLowerCase()] = {
            ...(user.portfolio.template_specific[templateType.toLowerCase()] ||
              {}),
            ...portfolio.template_specific,
          };
        }

        // console.log(portfolio);
        // portfolioDataValidationSchema.validateSync(portfolio);
        // user.portfolio = {
        //   ...user.portfolio,
        //   ...Object.fromEntries(
        //     Object.entries(portfolio || {}).filter(
        //       ([_, value]) => value !== undefined
        //     )
        //   ),
        // };
        break;
      }
      default:
        throw new InvalidPayloadError("Unknown Section cannot be updated");
    }
    await user.save();
    return { message: `Profile Updated Successfully ! `, status: 200 };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

// creator.service.js

exports.incrementProfileViews = async function (queryParams = {}) {
  try {
    const { userId, viewerId, recipientRole = "recruiter" } = queryParams;
    // Validate userId and viewerId
    yupObjectId().required().validateSync(userId);
    yupObjectId().required().validateSync(viewerId);
    console.log(
      `Incrementing profile views for userId: ${userId}, viewerId: ${viewerId}`
    );

    // Check if viewer has viewed this profile before
    const creator = await CreatorModel.findOne({
      _id: userId,
      "profile_views.view_history": {
        $elemMatch: { view_by: viewerId },
      },
    });

    let updatedCreator;
    if (creator) {
      // If viewer exists, update the viewed_at timestamp
      const updateQuery = {
        $set: {
          "profile_views.view_history.$[elem].viewed_at": new Date(),
          "profile_views.last_viewed": new Date(),
        },
      };
      updatedCreator = await CreatorModel.findByIdAndUpdate(
        userId,
        updateQuery,
        {
          new: true,
          arrayFilters: [{ "elem.view_by": viewerId }],
        }
      );
    } else {
      // If new viewer, increment view count and add to view history
      const updateQuery = {
        $inc: { "profile_views.number": 1 },
        $push: {
          "profile_views.view_history": {
            view_by: viewerId,
            recipient_role: `${recipientRole}s`,
            viewed_at: new Date(),
          },
        },
        $set: { "profile_views.last_viewed": new Date() },
      };
      updatedCreator = await CreatorModel.findByIdAndUpdate(
        userId,
        updateQuery,
        { new: true }
      );
    }

    if (!updatedCreator) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return {
      message: "Profile views updated",
      // data: getUserInfoFromDoc(updatedCreator),
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.incrementSocialClick = async function (queryParams) {
  try {
    const { userId, platform } = queryParams;
    yupObjectId().required().validateSync(userId);

    // Validate platform
    const validPlatforms = ["linkedin", "twitter", "instagram", "tiktok"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      throw new InvalidPayloadError(ErrorMessageEnum.INVALID_SOCIAL_PLATFORM);
    }

    const updateField = `social_clicks.${platform.toLowerCase()}`;

    const updatedCreator = await CreatorModel.findByIdAndUpdate(
      userId,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!updatedCreator) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return {
      message: `${platform} clicks updated`,
      // data: getUserInfoFromDoc(updatedCreator),
    };
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

    const creator = await CreatorModel.findById(userId);
    if (!creator) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    const recruiter = await RecruiterModel.findById(query.recruiterId);
    if (!recruiter) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    recruiter.ratings.push({
      value,
      comment,
      user: userId,
    });

    // Calculate the new average rating
    const totalRatings = recruiter.ratings.length;
    const sumOfRatings = recruiter.ratings.reduce(
      (acc, rating) => acc + rating.value,
      0
    );

    // Calculate average with one decimal precision
    recruiter.rating = (sumOfRatings / totalRatings).toFixed(1);

    await recruiter.save();

    return {
      message: "rating added succesfully",
      status: 200,
      recruiter,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getRecruiter = async function getRecruiter(userId, queryParams = {}) {
  try {
    const creator = await CreatorModel.findById(userId);
    if (!creator) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    const { recruiterId } = queryParams;

    const recruiterReview = await paginationAggregate(
      RecruiterModel,
      queryParams,
      {
        stagesBefore: [
          ...(recruiterId
            ? [
                {
                  $match: {
                    _id: new mongoose.Types.ObjectId(recruiterId),
                  },
                },
              ]
            : []),
          {
            $lookup: {
              from: "creators",
              localField: "ratings.user",
              foreignField: "_id",
              as: "rating_users",
            },
          },
          {
            $project: {
              full_name: "$bio_data.full_name",
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
            },
          },
          {
            $unset: "rating_users",
          },
        ],
      }
    );

    return {
      message: "success",
      data: recruiterReview,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getCreator = async function getCreator(userId, queryParams = {}) {
  try {
    const creator = await CreatorModel.findById(userId);
    if (!creator) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

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
            from: "creators",
            localField: "ratings.user",
            foreignField: "_id",
            as: "rating_users",
          },
        },
        {
          $project: {
            bio_data: 1,
            bio: 1,
            profile: 1,
            resume: 1,
            portfolio: 1,
            rating: 1,
            profile_views: 1,
            social_clicks: 1,
            created_at: 1,
            updated_at: 1,
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

function toObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
  }
  return new mongoose.Types.ObjectId(id);
}

/**
 * Get a single creator with enriched ratings and view history.
 * @param {string} requesterId - id of the user making the call (for auth check)
 * @param {string} creatorId - id of the creator to fetch
 */
exports.getCreatorByUsernameAgg = async function getCreatorByUsernameAgg(username) {
  try {
    // Validate username
    if (!username) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    // Basic auth guard: Check if creator exists by username
    const creator = await CreatorModel.findOne({ "bio_data.user_name": username }).select("_id").lean();
    if (!creator) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    const _creatorId = toObjectId(creator._id);

    const pipeline = [
      { $match: { _id: _creatorId } },
      // Prep arrays for lookups
      {
        $addFields: {
          rating_user_ids: {
            $filter: {
              input: "$ratings.user",
              as: "ru",
              cond: { $ne: ["$$ru", null] },
            },
          },
          viewer_creator_ids: {
            $map: {
              input: { $ifNull: ["$profile_views.view_history", []] },
              as: "vh",
              in: {
                $cond: [
                  { $eq: ["$$vh.recipient_role", "creators"] },
                  "$$vh.view_by",
                  null,
                ],
              },
            },
          },
          viewer_recruiter_ids: {
            $map: {
              input: { $ifNull: ["$profile_views.view_history", []] },
              as: "vh",
              in: {
                $cond: [
                  { $eq: ["$$vh.recipient_role", "recruiters"] },
                  "$$vh.view_by",
                  null,
                ],
              },
            },
          },
        },
      },
      // Strip nulls from viewer arrays
      {
        $addFields: {
          viewer_creator_ids: {
            $filter: {
              input: "$viewer_creator_ids",
              as: "id",
              cond: { $ne: ["$$id", null] },
            },
          },
          viewer_recruiter_ids: {
            $filter: {
              input: "$viewer_recruiter_ids",
              as: "id",
              cond: { $ne: ["$$id", null] },
            },
          },
        },
      },
      // Rater names (ratings.user -> recruiters collection)
      {
        $lookup: {
          from: "recruiters",
          localField: "rating_user_ids",
          foreignField: "_id",
          as: "rating_recruiters",
        },
      },
      // Profile viewers from recruiters
      {
        $lookup: {
          from: "recruiters",
          localField: "viewer_recruiter_ids",
          foreignField: "_id",
          as: "view_recruiters",
        },
      },
      // Profile viewers from creators
      {
        $lookup: {
          from: "creators",
          localField: "viewer_creator_ids",
          foreignField: "_id",
          as: "view_creators",
        },
      },
      // Final shape
      {
        $project: {
          bio_data: 1,
          bio: 1,
          profile: 1,
          resume: 1,
          portfolio: 1,
          rating: 1,
          social_clicks: 1,
          created_at: 1,
          updated_at: 1,
          ratings: {
            $map: {
              input: { $ifNull: ["$ratings", []] },
              as: "r",
              in: {
                value: "$$r.value",
                comment: "$$r.comment",
                created_at: "$$r.created_at",
                user: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          "$rating_recruiters",
                          {
                            $indexOfArray: [
                              "$rating_recruiters._id",
                              "$$r.user",
                            ],
                          },
                        ],
                      },
                    },
                    in: {
                      user_id: { $ifNull: ["$$matched._id", null] },
                      username: {
                        $ifNull: ["$$matched.bio_data.full_name", "Unknown"],
                      },
                    },
                  },
                },
              },
            },
          },
          profile_views: {
            number: { $ifNull: ["$profile_views.number", 0] },
            last_viewed: { $ifNull: ["$profile_views.last_viewed", null] },
            view_history: {
              $map: {
                input: { $ifNull: ["$profile_views.view_history", []] },
                as: "vh",
                in: {
                  viewed_at: "$$vh.viewed_at",
                  recipient_role: "$$vh.recipient_role",
                  viewer: {
                    $cond: [
                      { $eq: ["$$vh.recipient_role", "recruiters"] },
                      {
                        $let: {
                          vars: {
                            matched: {
                              $arrayElemAt: [
                                "$view_recruiters",
                                {
                                  $indexOfArray: [
                                    "$view_recruiters._id",
                                    "$$vh.view_by",
                                  ],
                                },
                              ],
                            },
                          },
                          in: {
                            viewer_id: { $ifNull: ["$$matched._id", null] },
                            viewer_name: {
                              $ifNull: [
                                "$$matched.bio_data.full_name",
                                "Unknown",
                              ],
                            },
                          },
                        },
                      },
                      {
                        $let: {
                          vars: {
                            matched: {
                              $arrayElemAt: [
                                "$view_creators",
                                {
                                  $indexOfArray: [
                                    "$view_creators._id",
                                    "$$vh.view_by",
                                  ],
                                },
                              ],
                            },
                          },
                          in: {
                            viewer_id: { $ifNull: ["$$matched._id", null] },
                            viewer_name: {
                              $ifNull: [
                                "$$matched.bio_data.full_name",
                                {
                                  $ifNull: [
                                    "$$matched.bio_data.user_name",
                                    "Unknown",
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      { $limit: 1 },
    ];

    const result = await CreatorModel.aggregate(pipeline).exec();
    if (!result.length) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return { message: "success", data: result[0] };
  } catch (error) {
    logger.error(`Error in getCreatorByUsernameAgg: ${error.message}`, { error });
    throw error; // Let the route handler deal with the error
  }
};

exports.getCreatorByIdAgg = async function getCreatorByIdAgg(creatorId) {
  try {
    // Validate creatorId
    if (!creatorId) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    // Basic auth guard: Check if creator exists
    const creator = await CreatorModel.findById(creatorId).select("_id").lean();
    if (!creator) {
      throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);
    }

    const _creatorId = toObjectId(creatorId);

    const pipeline = [
      { $match: { _id: _creatorId } },
      // Prep arrays for lookups
      {
        $addFields: {
          rating_user_ids: {
            $filter: {
              input: "$ratings.user",
              as: "ru",
              cond: { $ne: ["$$ru", null] },
            },
          },
          viewer_creator_ids: {
            $map: {
              input: { $ifNull: ["$profile_views.view_history", []] },
              as: "vh",
              in: {
                $cond: [
                  { $eq: ["$$vh.recipient_role", "creators"] },
                  "$$vh.view_by",
                  null,
                ],
              },
            },
          },
          viewer_recruiter_ids: {
            $map: {
              input: { $ifNull: ["$profile_views.view_history", []] },
              as: "vh",
              in: {
                $cond: [
                  { $eq: ["$$vh.recipient_role", "recruiters"] },
                  "$$vh.view_by",
                  null,
                ],
              },
            },
          },
        },
      },
      // Strip nulls from viewer arrays
      {
        $addFields: {
          viewer_creator_ids: {
            $filter: {
              input: "$viewer_creator_ids",
              as: "id",
              cond: { $ne: ["$$id", null] },
            },
          },
          viewer_recruiter_ids: {
            $filter: {
              input: "$viewer_recruiter_ids",
              as: "id",
              cond: { $ne: ["$$id", null] },
            },
          },
        },
      },
      // Rater names (ratings.user -> recruiters collection)
      {
        $lookup: {
          from: "recruiters",
          localField: "rating_user_ids",
          foreignField: "_id",
          as: "rating_recruiters",
        },
      },
      // Profile viewers from recruiters
      {
        $lookup: {
          from: "recruiters",
          localField: "viewer_recruiter_ids",
          foreignField: "_id",
          as: "view_recruiters",
        },
      },
      // Profile viewers from creators
      {
        $lookup: {
          from: "creators",
          localField: "viewer_creator_ids",
          foreignField: "_id",
          as: "view_creators",
        },
      },
      // Final shape
      {
        $project: {
          bio_data: 1,
          bio: 1,
          profile: 1,
          resume: 1,
          portfolio: 1,
          rating: 1,
          social_clicks: 1,
          created_at: 1,
          updated_at: 1,
          ratings: {
            $map: {
              input: { $ifNull: ["$ratings", []] },
              as: "r",
              in: {
                value: "$$r.value",
                comment: "$$r.comment",
                created_at: "$$r.created_at",
                user: {
                  $let: {
                    vars: {
                      matched: {
                        $arrayElemAt: [
                          "$rating_recruiters",
                          {
                            $indexOfArray: [
                              "$rating_recruiters._id",
                              "$$r.user",
                            ],
                          },
                        ],
                      },
                    },
                    in: {
                      user_id: { $ifNull: ["$$matched._id", null] },
                      username: {
                        $ifNull: ["$$matched.bio_data.full_name", "Unknown"],
                      },
                    },
                  },
                },
              },
            },
          },
          profile_views: {
            number: { $ifNull: ["$profile_views.number", 0] },
            last_viewed: { $ifNull: ["$profile_views.last_viewed", null] },
            view_history: {
              $map: {
                input: { $ifNull: ["$profile_views.view_history", []] },
                as: "vh",
                in: {
                  viewed_at: "$$vh.viewed_at",
                  recipient_role: "$$vh.recipient_role",
                  viewer: {
                    $cond: [
                      { $eq: ["$$vh.recipient_role", "recruiters"] },
                      {
                        $let: {
                          vars: {
                            matched: {
                              $arrayElemAt: [
                                "$view_recruiters",
                                {
                                  $indexOfArray: [
                                    "$view_recruiters._id",
                                    "$$vh.view_by",
                                  ],
                                },
                              ],
                            },
                          },
                          in: {
                            viewer_id: { $ifNull: ["$$matched._id", null] },
                            viewer_name: {
                              $ifNull: [
                                "$$matched.bio_data.full_name",
                                "Unknown",
                              ],
                            },
                          },
                        },
                      },
                      {
                        $let: {
                          vars: {
                            matched: {
                              $arrayElemAt: [
                                "$view_creators",
                                {
                                  $indexOfArray: [
                                    "$view_creators._id",
                                    "$$vh.view_by",
                                  ],
                                },
                              ],
                            },
                          },
                          in: {
                            viewer_id: { $ifNull: ["$$matched._id", null] },
                            viewer_name: {
                              $ifNull: [
                                "$$matched.bio_data.full_name",
                                {
                                  $ifNull: [
                                    "$$matched.bio_data.user_name",
                                    "Unknown",
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      { $limit: 1 },
    ];

    const result = await CreatorModel.aggregate(pipeline).exec();
    if (!result.length) {
      throw new UnAuthorizedError(ErrorMessageEnum.USER_NOT_FOUND);
    }

    return { message: "success", data: result[0] };
  } catch (error) {
    logger.error(`Error in getCreatorByIdAgg: ${error.message}`, { error });
    throw error; // Let the route handler deal with the error
  }
};
