const { WaitlistModel } = require("./waitlist-model");
const logger = require("../config/logging").getLogger("WAITLIST:SERVICE");
const yup = require("yup");

const mail = require("../config/email");

const {
  MailTypeEnum,
  AccountStatusEnum,
  ErrorMessageEnum,
  ProfileSectionEnum,
  ApprovalStatusEnum,
  AuthTypeEnum,
  OtpTypeEnum,
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
const { waitlistSchema, sendEmailValidationSchema } = require("../config/validation-schemas");

exports.subscribe = async function subscribe(payload) {
  try {
    yup
      .object({
        email: yup
          .string()
          .email("provide a valid email")
          .label("Email")
          .required(),
      })
      .validateSync(payload);
    const { email } = payload;

    await WaitlistModel.create({ email });

    return {
      message: "subscribed succesfully",
      status: 200,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.getSubscribers = async function getSubscribers(
  userId = "null",
  queryParams
) {
  try {
    // yupObjectId().required().validateSync(userId);
    // const recruiter = await RecruiterModel.findById(userId);
    // if (!recruiter) throw new InvalidPayloadError("recruiter not found");
    const waitlist = await paginationAggregate(WaitlistModel, queryParams, {
      stagesBefore: [],
      stagesAfter: [],
    });

    return {
      status: 200,
      message: "subscribers fetched successfully",
      data: waitlist,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};

exports.sendToWaitlist = async function sendToWaitlist(
  userId = "null",
  payload
) {
  try {
    waitlistSchema.validateSync(payload);
    const subscribers = await WaitlistModel.find(
      {},
      { email: 1, _id: 0 }
    ).lean();
    const emails = subscribers.map((sub) => sub.email);

    await mail(MailTypeEnum.SEND_TO_WAITLIST, {
      email: emails,
      subject: payload.subject,
      content: payload.content,
    });

    return {
      status: 200,
      message: "Emails queued for sending to waitlist successfully",
      data: {
        totalRecipients: emails.length,
      },
    };
  } catch (error) {
    logger.error(`Waitlist send error: ${error?.message}`);
    return handleError(error);
  }
};

exports.deleteFromWaitlist = async function (payload) {
  try {
    yup
      .object({
        email: yup
          .string()
          .email("provide a valid email")
          .label("Email")
          .required(),
      })
      .validateSync(payload);
    const { email } = payload;

    const result = await WaitlistModel.findOneAndDelete({
      email,
    });

    if (!result) {
      return {
        status: 404,
        message: "Email not found in waitlist",
        data: null,
      };
    }

    return {
      status: 200,
      message: "Successfully removed from waitlist",
    };
  } catch (error) {
    logger.error(`Waitlist deletion error: ${error.message}`);
    return handleError(error);
  }
};

exports.sendEmails = async (payload) => {
  try {
    const { user_email, message, name } =
      sendEmailValidationSchema.validateSync(payload, {
        stripUnknown: true,
      });

    await mail(MailTypeEnum.SEND_EMAIL, {
      userEmail: user_email,
      email: process.env.MAIL_FROM,
      body: message,
      fullname: name,
    });

    return {
      message: "Mail Sent Succesfully",
      status: 201,
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
