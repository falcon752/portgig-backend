const mongoose = require("mongoose");
const {
  CollectionEnum,
  ProviderEnum,
  TemplateType,
} = require("../config/constants");

const Schema = mongoose.Schema;

const BIO_DATA_FIELD = {
  full_name: { type: String, trim: true },
  user_name: { type: String, trim: true, unique: true },
};

const educationField = new Schema(
  {
    course: { type: String },
    school: { type: String },
    started: { type: Date },
    ended: {
      type: Date,
      validate: {
        validator: function (value) {
          return !this.started || value > this.started;
        },
        message: "End date must be after start date",
      },
    },
  },
  { _id: false, id: false }
);

const experienceField = new Schema(
  {
    job_title: { type: String },
    location: { type: String },
    contribution: { type: String },
    ended: { type: Date },
  },
  { _id: false, id: false }
);

const socialLinks = {
  linkedin: { type: String },
  twitter: { type: String },
  instagram: { type: String },
  tiktok: { type: String },
};

const portfolioField = new Schema(
  {
    template_type: {
      type: String,
      enum: Object.values(TemplateType),
      uppercase: true,
    },
    display_name: { type: String, trim: true },
    job_titles: [{ type: String, trim: true }],
    location: { type: String, trim: true },
    about_me: { type: String, trim: true },
    mission: { type: String, trim: true },
    head_shot: {
      type: String,
      validate: {
        validator: function (value) {
          return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
        },
        message:
          "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
      },
    },
    files: [
      {
        image: {
          type: String,
          validate: {
            validator: function (value) {
              return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
            },
            message:
              "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
          },
        },
        title: { type: String, trim: true },
        link: { type: String, trim: true },
      },
    ],
    fonts: {
      heading_font: { type: String, trim: true },
      body_font: { type: String, trim: true },
      colors: {
        primary: { type: String, trim: true },
        accent: { type: String, trim: true },
        background: { type: String, trim: true },
        text: { type: String, trim: true },
      },
    },
    other_services: [{ type: String, trim: true }],
    what_you_get_working_with_me: { type: String, trim: true },
    social: {
      linkedin: { type: String, trim: true },
      medium: { type: String, trim: true },
      google_drive_link: { type: String, trim: true },
      pinterest_or_behance_link: { type: String, trim: true },
    },
    template_specific: {
      writer: {
        case_study: { type: String, trim: true },
      },
      videographer: {
        types: [{ type: String, trim: true }],
        videography_skills: [{ type: String, trim: true }],
        video_editing_skills: [{ type: String, trim: true }],
        jobs_open_to: { type: String, trim: true },
      },
      developer: {
        cta: { type: String, trim: true },
        services: [
          {
            name: { type: String, trim: true },
            description: { type: String, trim: true },
          },
        ],
        skills: [{ type: String, trim: true }],
        availability: { type: String, trim: true },
      },
      photographer: {
        latest_work: [
          {
            image: {
              type: String,
              validate: {
                validator: function (value) {
                  return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
                },
                message:
                  "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
              },
            },
            title: { type: String, trim: true },
            link: { type: String, trim: true },
          },
        ],
        jobs_open_to: [{ type: String, trim: true }],
      },
      social_media_manager: {
        describe_experience_years: { type: String, trim: true },
        my_approach_to_strategy_content: { type: String, trim: true },
        skills: [{ type: String, trim: true }],
        case_study: [
          {
            brand_name: { type: String, trim: true },
            contribution: { type: String, trim: true },
            before: {
              type: String,
              validate: {
                validator: function (value) {
                  return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
                },
                message:
                  "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
              },
            },
            after: {
              type: String,
              validate: {
                validator: function (value) {
                  return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
                },
                message:
                  "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
              },
            },
          },
        ],
        graphic_design: [
          {
            type: String,
            trim: true,
            validate: {
              validator: function (value) {
                return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
              },
              message:
                "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
            },
          },
        ],
        video_editing: [{ type: String, trim: true }],
        tools: [{ type: String, trim: true }],
      },
      designer: {
        skills: [
          {
            image: {
              type: String,
              validate: {
                validator: function (value) {
                  return /\.(jpg|jpeg|png|pdf|doc|docx)$/i.test(value);
                },
                message:
                  "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)",
              },
            },
            name: { type: String, trim: true },
          },
        ],
        tools: [{ type: String, trim: true }],
      },
    },
  },
  { _id: false, id: false }
);

const cvField = {
  why_work_with_me: { type: String },
  experience: { type: String },
  industry: { type: String },
  category: { type: String },
  job_title: { type: String },
  full_name: { type: String },
  email: {
    type: String,
  },
  location: { type: String },
  phone_number: { type: String },
  education: [educationField],
  experience: [experienceField],
  brief: { type: String },
  skills: [{ type: String }],
  other_skills: [{ type: String }],
  certifications: [{ type: String }],
  links: { ...socialLinks },
};

const AUTH_FILED = {
  device: { type: Schema.Types.Object },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    trim: true,
  },
  password: { type: String, trim: true },
  device_id: { type: String },
  token: {
    value: String,
    issued_at: { type: Date, default: () => Date.now() },
    expires_at: { type: Date },
  },
  provider: {
    type: String,
    enum: Object.values(ProviderEnum),
    uppercase: true,
    default: ProviderEnum.EMAIL,
  },
  validation_token: {
    value: String,
    issued_at: { type: Date },
    expires_at: { type: Date },
  },
};

const RATING = {
  value: { type: Number, min: 1, max: 5, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruiter",
    required: false,
  },
  comment: { type: String, required: false },
  created_at: { type: Date, default: Date.now },
};

const PROFILE = {
  full_name: { type: String, trim: true },
  email: { type: String, trim: true },
  bio: { type: String, trim: true },
  phone_number: { type: String },
  years_of_experience: { type: String },
  field: { type: String, trim: true },
  industry: { type: String, trim: true },
  location: {
    type: {
      state: { type: String, trim: true },
      lga: { type: String, trim: true },
    },
    default: null,
  },
  profile_picture: {
    type: String,
    default: "",
  },
  ...socialLinks,
};

const CreatorSchema = new Schema(
  {
    auth: { ...AUTH_FILED },
    bio_data: { ...BIO_DATA_FIELD },
    ratings: [new Schema(RATING, { _id: false })],
    rating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },
    profile: { ...PROFILE },
    // bio: { type: String, trim: true },
    resume: { ...cvField },
    portfolio: portfolioField,
    profile_views: {
      number: { type: Number, default: 0 },
      last_viewed: { type: Date, default: null },
      view_history: [
        {
          viewed_at: { type: Date, default: Date.now },
          view_by: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "recipient_role",
          },
          recipient_role: {
            type: String,
            enum: ["recruiters", "creators"],
            default: "recruiters",
          },
        },
      ],
    },
    social_clicks: {
      linkedin: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      instagram: { type: Number, default: 0 },
      tiktok: { type: Number, default: 0 },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const CreatorModel = mongoose.model(CollectionEnum.CREATOR, CreatorSchema);

module.exports = {
  CreatorModel,
};
