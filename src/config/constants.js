exports.System = {
  ID: "SYSTEM",
};

exports.CollectionEnum = {
  ADMIN: "Admin",
  CREATOR: "Creator",
  RECRUITER: "Recruiter",
  JOB: "Job",
  WAITLIST: "Waitlist",
  NOTIFICATION: "Notification",
};

exports.NotificationTypeEnum = {
  INFO: "INFO",
  ALERT: "ALERT",
  WARNING: "WARNING",
  JOB_APPLICATION: "JOB_APPLICATION",
  JOB_STATUS_UPDATE: "JOB_STATUS_UPDATE",
  NEW_JOB_POSTED: "NEW_JOB_POSTED",
  GENERAL: "GENERAL",
  JOB_CLOSED: "JOB_CLOSED",
};

exports.ProviderEnum = {
  GOOGLE: "GOOGLE",
  EMAIL: "EMAIL",
};
exports.TemplateType = {
  WRITER: "WRITER",
  VIDEOGRAPHER: "VIDEOGRAPHER",
  PHOTOGRAPHER: "PHOTOGRAPHER",
  DESIGNER: "DESIGNER",
  DEVELOPER: "DEVELOPER",
  SOCIAL_MEDIA_MANAGER: "SOCIAL_MEDIA_MANAGER",
};

exports.ApplicantStatus = {
  PENDING: "PENDING",
  SHORTLISTED: "SHORTLISTED",
  NOT_QUALIFIED: "NOT_QUALIFIED",
  SELECTED: "SELECTED",
};

exports.JobAvailability = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
};

exports.recruiterStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
};

exports.ErrorMessageEnum = {
  WRONG_CREDENTIALS: "Oops! Invalid Crendentials",
  LOW_ACL: "UnAuthourized to perform this operation",
  UNKNOWN_TOKEN: "Oops! Token Expired ",
  WRONG_OTP: "Oops! Invalid O.T.P",
  UNAUTHORIZED: "Unauthorize Action",
  VERIFYKYC: "KYC yet to be verified",
  USER_NOT_FOUND: "invalid request",
  WALLET_FOUND: "This user already has wallet information",
  INVALID_SOCIAL_PLATFORM: "Invalid social media platform",
  CLICK_UPDATE_FAILED: "Failed to update social clicks",
  INVALID_CREDENTIALS: "invalid credentials",
  ACCOUNT_VERIFIED: "account already verified",
};
exports.AdminActionTypeEnum = {
  REGISTER_ADMIN: "REGISTER_NEW_ADMIN",
  ADD_ASSET: "ADD_ASSET",
  MEDIA_UPLOAD: "MEDIA_UPLOAD",
  ASSET_CRUD: "ASSET_CRUD",
};

exports.GenderTypeEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
};

exports.AddressTypeEnum = {
  OPERATION_BASE: "Operational Base",
  BRANCH: "BRANCH",
  HQ: "Head Quarters",
};

exports.AccountStatusEnum = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  SUSPENDED: "SUSPENDED",
};

exports.ApprovalStatusEnum = {
  APPROVED: "APPROVED",
  PENDING: "PENDING",
  DECLINED: "DECLINED",
};
exports.InvestMentLevelEnum = {
  HIGH_NETWORTH: "HIGH_NETWORTH",
  EVERY_DAY: "EVERY_DAY",
  SOPHISTICATED: "SOPHISTICATED",
};

exports.SmsTypeEnum = {
  ADMIN_INVITATION: "ADMIN_INVITATION",
  WELCOME: "WELCOME",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};
exports.PushNotificationTypeEnum = {
  SINGLE: "SINGLE",
  CATEGORY: "CATEGORY",
  MULTIPLE: "MULTIPLE",
};

exports.ProfileSectionEnum = {
  AUTH: "AUTH",
  ASSESSMENT: "ASSESSMENT",
  BIO_DATA: "BIO_DATA",
  KYC: "KYC",
  SECURITY: "SECURITY",
  NEXT_OF_KIN: "NEXT_OF_KIN",
  MARKET_UPDATE: "MARKET_UPDATE",
  RESUME: "RESUME",
  PROFILE: "PROFILE",
  PORTFOLIO: "PORTFOLIO",
};

exports.CloudinaryFolder = {
  PROPERTY: "Property",
  PROFILEPIC: "Profile",
};

exports.PaystackEventType = {
  CHARGE_SUCCESS: "charge.success",
  TRANSFER_FAILED: "transfer.failed",
  TRANSFER_SUCCESS: "transfer.success",
  TRANSFER_REVERSED: "transfer.reversed",
  CUSTOMER_IDENTIFICATION_FAILED: "customer.identification.failed",
  CUSTOMER_IDENTIFICATION_SUCCESS: "customer.identification.success",
  DVA_ASSIGNED_SUCCESS: "dva.assigned.success",
  DVA_ASSIGNED_FAILED: "dva.assigned.failed",
};

exports.TransactionStatusEnum = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
  ABANDONED: "ABANDONED",
};

exports.TransactionModeEnum = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};

exports.TransactionTypeEnum = {
  TRANSFER: "TRANSFER",
  WALLET_TOP_UP: "WALLET_TOP_UP",
  INVESTMENT: "INVESTMENT",
};

exports.CurrencyTypeEnum = {
  NGN: "NGN",
};

exports.BankAccountTypeEnum = {
  PERSONAL: "PERSONAL",
  BUSINESS: "BUSINESS",
};
exports.FeedBackStatusEnum = {
  PENDING: "PENDING",
  RESOLVED: "RESOLVED",
  PROCESSING: "PROCESSING",
};

exports.AuthTypeEnum = {
  EMAIL: "EMAIL",
  PHONE: "PHONE",
};

exports.OtpTypeEnum = {
  REGISTRATION: "REGISTRATION",
  LOGIN: "LOGIN",
};

exports.SeerbitEventType = {
  GENERATE_VIRTUAL_ACCOUNT: "GENERATE_VIRTUAL_ACCOUNT",
};

exports.MailTypeEnum = {
  WELCOME: "WELCOME",
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  PASSWORD_RESET: "PASSWORD_RESET",
  GENERAL_TOKEN: "GENERAL_TOKEN",
  TRANSACTION_PIN: "TRANSACTION_PIN",
  ADMIN_PASSWORD: "ADMIN_PASSWORD",
  SEND_EMAIL: "SEND_EMAIL",
  HOST_INVITATION: "HOST_INVITATION",
  SEND_TO_WAITLIST: "SEND_TO_WAITLIST",
  NEWSLETTER: "NEWSLETTER",
  DISQUALIFIED_CREATOR: "DISQUALIFIED_CREATOR",
  VALIDATE_RECRUITER: "VALIDATE_RECRUITER",
};

exports.RecipientTypeEnum = {
  ALL: "ALL",
  ALL_CREATORS: "ALL_CREATORS",
  ALL_RECRUITERS: "ALL_RECRUITERS",
};
