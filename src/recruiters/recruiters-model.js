const mongoose = require("mongoose");
const {
  CollectionEnum,
  ProviderEnum,
  recruiterStatus,
} = require("../config/constants");
const { profile } = require("winston");

const Schema = mongoose.Schema;

const BIO_DATA_FIELD = {
  full_name: { type: String, trim: true },
  // user_name: { type: String, trim: true, unique: true, trim: true },
};

const COMPANY_INFO = {
  company_name: { type: String, trim: true },
  about_us: { type: String, trim: true },
};

const AUTH_FILED = {
  device: { type: Schema.Types.Object },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    trim: true,
  },
  // accountId: {
  //   type: String,
  // },
  password: { type: String, trim: true },
  device_id: { type: String },
  provider: {
    type: String,
    enum: Object.values(ProviderEnum),
    uppercase: true,
    default: ProviderEnum.EMAIL,
  },
  token: {
    value: String,
    issued_at: { type: Date, default: () => Date.now() },
    expires_at: { type: Date },
  },
  validation_token: {
    value: String,
    issued_at: { type: Date },
    expires_at: { type: Date },
  },
};

const PROFILE = {
  phone_number: { type: String },
  industry: { type: String },
  location: { type: String },
  social_links: {
    twitter: { type: String, trim: true },
    instagram: { type: String, trim: true },
    website: { type: String, trim: true },
    linkedin: { type: String, trim: true },
  },
  profile_picture: {
    type: String,
    default: "",
  },
};

const RATING = {
  value: { type: Number, min: 1, max: 5, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Creator",
    required: false,
  },
  comment: { type: String, required: false },
  created_at: { type: Date, default: Date.now },
};

const RecruiterSchema = new Schema(
  {
    auth: { ...AUTH_FILED },
    company_info: { ...COMPANY_INFO },
    bio_data: { ...BIO_DATA_FIELD },
    ratings: [new Schema(RATING, { _id: false })],
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },
    profile: { ...PROFILE },
    account_status: {
      type: String,
      enum: Object.values(recruiterStatus),
      uppercase: true,
      default: recruiterStatus.PENDING,
    },
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const RecruiterModel = mongoose.model(
  CollectionEnum.RECRUITER,
  RecruiterSchema
);

module.exports = {
  RecruiterModel,
};
