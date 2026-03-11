const yup = require("yup");
const {
  AdminTypeEnum,
  GenderTypeEnum,
  InvestMentLevelEnum,
  InvestmentType,
  TemplateType,
  RecipientTypeEnum,
} = require("./constants");
const { isObjectId } = require("./utils");
const dfn = require("date-fns");

function yupObjectId(message) {
  return yup
    .string()
    .test("isObjectId", "${path} should be an ID", (value) =>
      isObjectId(value)
    );
}

exports.yupObjectId = yupObjectId;

function yupMulterFile(message) {
  return yup.mixed().test(
    "isFile",
    // eslint-disable-next-line no-template-curly-in-string
    message || "${path} not a file",
    (value) =>
      (value && typeof value.path === "string") ||
      (value &&
        typeof value === "string" &&
        /^(identifications|passports|qualifications|signatures)\/{1}.+\.{1}.+/.test(
          value || ""
        ))
    // value.includes("res.cloudinary.com"))
  );
}
exports.yupMulterFile = yupMulterFile;

exports.authDataValidationSchema = yup.object({
  email: yup
    .string()
    .trim()
    .label("Email")
    .transform((value, originalValue) => {
      // Use trim() to remove leading and trailing whitespaces, then replace all remaining whitespaces
      return typeof originalValue === "string"
        ? originalValue.trim().replace(/\s/g, "")
        : originalValue;
    })
    .required(),
  phone_number: yup
    .string()
    .label("Phone Number")
    .length(11, "Phone number must be exactly 11 digits (e.g. 08012345678)")
    .transform((value, originalValue) => {
      // Use trim() to remove leading and trailing whitespaces, then replace all remaining whitespaces
      return typeof originalValue === "string"
        ? originalValue.trim().replace(/\s/g, "")
        : originalValue;
    })
    .trim()
    .required("Phone Number"),
});

exports.bioDataValidationSchema = yup.object({
  first_name: yup.string().label("First Name").required(),
  last_name: yup.string().label("Last Name").required(),
  middle_name: yup.string("Must be a string").label().optional(),
  gender: yup
    .string()
    .label("Gender")
    .oneOf(Object.values(GenderTypeEnum), "Invalid Gender Type")
    .optional(),
  date_of_birth: yup
    .date("Invalide Date Type")
    .max(new Date(), "Invalid Date")
    .label("Date Of Birth")
    .optional(),
});

exports.profileDataValidationSchema = yup.object({
  bio: yup.string().label("Bio").optional(),
  full_name: yup.string().label("Full Name").optional(),
  email: yup.string().email().label("Email").optional(),
  phone_number: yup
    .string()
    .label("Phone Number")
    .length(11, "Phone number must be exactly 11 digits (e.g. 08012345678)")
    .transform((value, originalValue) => {
      // Use trim() to remove leading and trailing whitespaces, then replace all remaining whitespaces
      return typeof originalValue === "string"
        ? originalValue.trim().replace(/\s/g, "")
        : originalValue;
    })
    .optional(),
  years_of_experience: yup.string().label("Years of Experience").optional(),
  field: yup.string().label("Field").optional(),
  industry: yup.string().label("Industry").optional(),
  location: yup.object({
    state: yup.string().label("State").optional(),
    lga: yup.string().label("LGA").optional(),
  }),
  twitter: yup.string().trim().label("Twitter").optional(),
  instagram: yup.string().trim().label("Instagram").optional(),
  website: yup.string().trim().label("Website").optional(),
  linkedin: yup.string().trim().label("LinkedIn").optional(),
  profile_picture: yup.string().trim().label("Profile Picture").optional(),
});

exports.recruiterProfileDataValidationSchema = yup.object({
  phone_number: yup.string().label("Phone Number").optional(),
  industry: yup.string().label("Niche/Industry").optional(),
  location: yup.string("Must be a string").label().optional(),
  // about: yup.string().label("About").optional(),
  social_links: yup
    .object({
      twitter: yup.string().trim().label("Twitter").optional(),
      instagram: yup.string().trim().label("Instagram").optional(),
      website: yup.string().trim().label("Website").optional(),
      linkedin: yup.string().trim().label("LinkedIn").optional(),
    })
    .optional(),
  full_name: yup.string().label("Full Name").optional(),
  profile_picture: yup.string().trim().label("Profile Picture").optional(),
});

exports.resumeDataValidationSchema = yup.object({
  brief: yup.string().required(),
  industry: yup.string().optional(),
  location: yup.string().required(),
  category: yup.string().optional(),
  job_title: yup.string().required(),
  full_name: yup.string().required(),
  phone_number: yup.string().required(),
  email: yup.string().email().required(),
  education: yup
    .array()
    .of(
      yup.object({
        course: yup.string().required(),
        school: yup.string().required(),
        started: yup.date().required(),
        ended: yup
          .date()
          .required()
          .min(yup.ref("started"), "End date must be after start date"),
      })
    )
    .required(),
  experience: yup
    .array()
    .of(
      yup.object({
        job_title: yup.string().required(),
        location: yup.string().required(),
        contribution: yup.string().required(),
        started: yup.date().required(),
        ended: yup
          .date()
          .required()
          .min(yup.ref("started"), "End date must be after start date"),
      })
    )
    .min(1, "Must have at least 1 experience entry")
    .max(3, "Max of three experience")
    .optional(),
  links: yup
    .object({
      linkedin: yup.string().optional(),
      twitter: yup.string().optional(),
      instagram: yup.string().optional(),
      tiktok: yup.string().optional(),
    })
    .required(),
  skills: yup.array().of(yup.string()).required(),
  other_skills: yup.array().of(yup.string()).optional(),
  certifications: yup.array().of(yup.string()).required(),
  why_work_with_me: yup.string().optional(),
});

exports.portfolioDataValidationSchema = yup.object({
  template_type: yup
    .string()
    .oneOf(Object.values(TemplateType), "Invalid template type")
    .required(),
  display_name: yup.string().trim().label("Display Name").optional(),
  job_titles: yup
    .array()
    .of(yup.string().trim())
    .label("Job Titles")
    .optional(),
  location: yup.string().trim().label("Location").optional(),
  about_me: yup.string().trim().label("About Me").optional(),
  mission: yup.string().trim().label("Mission").optional(),
  head_shot: yup
    .string()
    .matches(
      /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
      "head_shot must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
    )
    .label("Head Shot")
    .optional(),
  files: yup
    .array()
    .of(
      yup.object({
        image: yup
          .string()
          .matches(
            /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
            "files image must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
          ),
        title: yup.string().trim(),
        link: yup.string().trim(),
      })
    )
    .label("Files")
    .optional(),
  fonts: yup
    .object({
      heading_font: yup.string().trim().label("Heading Font").optional(),
      body_font: yup.string().trim().label("Body Font").optional(),
      colors: yup
        .object({
          accent: yup.string().trim().label("Accent Color").optional(),
          primary: yup.string().trim().label("Primary Color").optional(),
          background: yup.string().trim().label("Background Color").optional(),
          text: yup.string().trim().label("Text Color").optional(),
        })
        .optional(),
    })
    .optional(),
  other_services: yup
    .array()
    .of(yup.string().trim())
    .label("Other Services")
    .optional(),
  what_you_get_working_with_me: yup
    .string()
    .trim()
    .label("What You Get Working With Me")
    .optional(),
  social: yup
    .object({
      linkedin: yup.string().trim().label("LinkedIn").optional(),
      medium: yup.string().trim().label("Medium").optional(),
      google_drive_link: yup
        .string()
        .trim()
        .label("Google Drive Link")
        .optional(),
      pinterest_or_behance_link: yup
        .string()
        .trim()
        .label("Pinterest or Behance Link")
        .optional(),
    })
    .optional(),
  template_specific: yup.lazy((value, { parent }) => {
    const templateType = parent.template_type;
    switch (templateType) {
      case TemplateType.WRITER:
        return yup.object({
          case_study: yup.string().trim().label("Case Study").optional(),
        });
      case TemplateType.VIDEOGRAPHER:
        return yup.object({
          type: yup.array().of(yup.string().trim()).label("Type").optional(),
          videography_skills: yup
            .array()
            .of(yup.string().trim())
            .label("Videography Skills")
            .optional(),
          video_editing_skills: yup
            .array()
            .of(yup.string().trim())
            .label("Video Editing Skills")
            .optional(),
          jobs_open_to: yup.string().trim().label("Jobs Open To").optional(),
        });
      case TemplateType.DEVELOPER:
        return yup.object({
          cta: yup.string().trim().label("CTA").optional(),
          services: yup
            .array()
            .of(
              yup.object({
                name: yup.string().trim().label("Service Name").optional(),
                description: yup
                  .string()
                  .trim()
                  .label("Service Description")
                  .optional(),
              })
            )
            .label("Services")
            .optional(),
          skills: yup
            .array()
            .of(yup.string().trim())
            .label("Skills")
            .optional(),
          availability: yup.string().trim().label("Availability").optional(),
        });
      case TemplateType.PHOTOGRAPHER:
        return yup.object({
          latest_work: yup
            .array()
            .of(
              yup.object({
                image: yup
                  .string()
                  .matches(
                    /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                    "latest_work image must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                  ),
                title: yup.string().trim(),
                link: yup.string().trim(),
              })
            )
            .label("Latest Work")
            .optional(),
          my_services: yup
            .array()
            .of(
              yup.object({
                image: yup
                  .string()
                  .matches(
                    /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                    "my_services File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                  ),
                name: yup.string().trim(),
                link: yup.string().trim(),
              })
            )
            .label("My Services")
            .optional(),
          types_of_photography: yup
            .array()
            .of(
              yup
                .string()
                .matches(
                  /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                  "types_of_photography File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                )
            )
            .label("Types of Photography")
            .optional(),
          jobs_open_to: yup
            .array()
            .of(yup.string().trim())
            .label("Jobs Open To")
            .optional(),
          more_work: yup
            .array()
            .of(
              yup.object({
                name: yup.string().trim(),
                link: yup.string().trim(),
              })
            )
            .label("More Work")
            .optional(),
        });
      case TemplateType.SOCIAL_MEDIA_MANAGER:
        return yup.object({
          describe_experience_years: yup
            .string()
            .trim()
            .label("Experience Years")
            .optional(),
          my_approach_to_strategy_content: yup
            .string()
            .trim()
            .label("Approach to Strategy Content")
            .optional(),
          skills: yup
            .array()
            .of(yup.string().trim())
            .label("Skills")
            .optional(),
          case_study: yup
            .array()
            .of(
              yup.object({
                brand_name: yup.string().trim().label("Brand Name").optional(),
                contribution: yup
                  .string()
                  .trim()
                  .label("Contribution")
                  .optional(),
                before: yup
                  .string()
                  .matches(
                    /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                    "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                  )
                  .label("Before")
                  .optional(),
                after: yup
                  .string()
                  .matches(
                    /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                    "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                  )
                  .label("After")
                  .optional(),
              })
            )
            .label("Case Study")
            .optional(),
          graphic_design: yup
            .array()
            .of(
              yup
                .string()
                .matches(
                  /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                  "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                )
            )
            .label("Graphic Design")
            .optional(),
          video_editing: yup
            .array()
            .of(yup.string().trim())
            .label("Video Editing")
            .optional(),
          tools: yup.array().of(yup.string().trim()).label("Tools").optional(),
        });
      case TemplateType.DESIGNER:
        return yup.object({
          skills: yup
            .array()
            .of(
              yup.object({
                image: yup
                  .string()
                  .matches(
                    /\.(jpg|jpeg|png|pdf|doc|docx)$/i,
                    "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
                  )
                  .label("Skill Image")
                  .optional(),
                name: yup.string().trim().label("Skill Name").optional(),
              })
            )
            .label("Skills")
            .optional(),
          tools: yup.array().of(yup.string().trim()).label("Tools").optional(),
          job_open_to: yup.string().trim().label("Job Open To").optional(),
          why_you_should_work_with_me: yup
            .string()
            .trim()
            .label("Why You Should Work With me")
            .optional(),
          behance: yup.string().trim().label("Behance").optional(),
        });
      default:
        return yup.object().shape({});
    }
  }),
});

exports.nextOfKinDataValidationSchema = yup.object({
  full_name: yup.string().label("Full name").required(),
  email: yup
    .string()
    .email("provide a valid email")
    .transform((value, originalValue) => {
      // Use trim() to remove leading and trailing whitespaces, then replace all remaining whitespaces
      return typeof originalValue === "string"
        ? originalValue.trim().replace(/\s/g, "")
        : originalValue;
    })
    .label("Email")
    .required(),
  phone_number: yup
    .string()
    .trim()
    .transform((value, originalValue) => {
      // Use trim() to remove leading and trailing whitespaces, then replace all remaining whitespaces
      return typeof originalValue === "string"
        ? originalValue.trim().replace(/\s/g, "")
        : originalValue;
    })
    .label("Phone Number")
    .required(),
  address: yup.string().trim().label("Address").required(),
  relationship: yup.string().trim().label("Address").required(),
});

exports.assessmentValidationSchema = yup.object({
  tax_payer: yup.string().label("Tax payer").required(),
  investment_level: yup
    .string()
    .oneOf(Object.values(InvestMentLevelEnum))
    .label("Investment Level")
    .required(),
});

exports.loginValidationSchema = yup.object({
  email: yup.string().email("provide a valid email").label("Email").required(),
  password: yup.string().label("Password").required(),
});

exports.waitlistSchema = yup.object({
  subject: yup.string().label("Subject").required(),
  content: yup.string().label("Content").required(),
});

exports.registerationValidationSchema = yup.object({
  full_name: yup.string().trim().label("Full Name").required(),
  user_name: yup.string().trim().label("User Name").required(),
  years_of_experience: yup
    .string()
    .trim()
    .label("Years of experience")
    .required(),
  industry: yup.string().trim().label("Niche/Industry").required(),
  field: yup.string().trim().label("Field").required(),
  state: yup.string().trim().label("state").required(),
  lga: yup.string().trim().label("lga").required(),
  email: yup.string().email().trim().label("Email").required(),
  password: yup
    .string()
    .trim()
    .label("Password")
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#\$%\^&\*_\-]/,
      "Password must contain at least one special character"
    )
    .required(),
  phone_number: yup.string().trim().label("Phone Number").optional(),
});

exports.recruiterRegisterationValidationSchema = yup.object({
  full_name: yup.string().trim().label("Full Name").required(),
  // user_name: yup.string().trim().label("User Name").required(),
  company_name: yup.string().trim().label("Company Name").required(),
  about_us: yup.string().trim().label("About Us/Company Info").required(),
  industry: yup.string().trim().label("Niche/Industry").required(),
  // location: yup.string().trim().label("location").required(),
  email: yup.string().email().trim().label("Email").required(),
  password: yup
    .string()
    .trim()
    .label("Password")
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[!@#\$%\^&\*_\-]/,
      "Password must contain at least one special character"
    )
    .required(),
});
exports.jobCreateValidationSchema = yup.object({
  title: yup.string().trim().label("Title").required(),
  description: yup.string().trim().label("Description").required(),
  experience: yup.string().trim().label("Experience").required(),
  // industry: yup.string().trim().label("Industry").required(),
  salary_range: yup
    .string()
    .trim()
    .required("Salary range is required")
    .matches(
      /^\d+\/\d+$/,
      "Salary range must be in the format lower-higher numbers"
    )
    .test(
      "is-valid-range",
      "Salary range lower value must be less than or equal to higher value",
      (value) => {
        if (!value) return false;
        const [lower, higher] = value.split("/").map(Number);
        if (isNaN(lower) || isNaN(higher)) return false;
        return lower <= higher;
      }
    )
    .label("Salary range"),
  deadline: yup.date().label("Deadline").required(),
  work_mode: yup.string().trim().label("Work mode").required(),
  location: yup.string().trim().label("location").required(),
  technical: yup
    .array()
    .of(yup.string().trim().label("Technical"))
    .min(1, "At least one technical skill is required")
    .required("Technical field is required"),
  soft: yup
    .array()
    .of(yup.string().trim().label("soft"))
    .min(1, "At least one soft skill is required")
    .required("soft field is required"),
  responsibilities: yup
    .array()
    .of(yup.string().trim().label("Responsibilities"))
    .min(1, "At least one responsibilities skill is required")
    .required("Responsibilities field is required"),
  // requirements: yup
  //   .array()
  //   .of(yup.string().trim().label("Requirements"))
  //   .min(1, "At least one requirements skill is required")
  //   .required("Requirements field is required"),
  // others: yup.string().trim().label("Others").optional(),
});

exports.registerationOtpValidationSchema = yup.object({
  token: yup.string().trim().label("Token").required(),
  email: yup.string().email().trim().label("Email").required(),
});

exports.sendEmailValidationSchema = yup.object({
  user_email: yup.string().email().trim().label("User Email").required(),
  message: yup.string().trim().label("message").required(),
  name: yup.string().trim().label("fullname").required(),
  //subject: yup.string().trim().label("Subject").required(),
});

// exports.adminLoginValidationSchema = yup.object({
//   email: yup.string().label("Email").required(),
//   password: yup.string().label("Password").required(),
// });

// exports.adminRegistrationValidationSchema = yup.object({
//   first_name: yup.string().trim().label("First Name").required(),
//   last_name: yup.string().trim().label("Last Name").required(),
//   email: yup.string().email().label("Email").required(),
//   phone_number: yup.string().trim().label("Phone Number").required(),
//   type: yup
//     .string()
//     .oneOf(Object.values(AdminTypeEnum))
//     .label("Admin Type")
//     .required(),
// });

exports.newsletterConfigSchema = yup
  .object({
    topic: yup.string().max(100).notRequired().default("").label("Topic"),
    description: yup
      .string()
      .max(500)
      .notRequired()
      .default("")
      .label("Description"),
    date: yup
      .string()
      .default(() =>
        new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      )
      .label("Date"),
    mainImage: yup
      .string()
      .url()
      .notRequired()
      .default("")
      .label("Main Image URL"),
    content: yup.string().notRequired().default("").label("Content"),
    ctaLink: yup.string().url().default("#").label("CTA Link"),
    ctaText: yup.string().max(50).default("Discover Now").label("CTA Text"),
    sections: yup
      .array()
      .of(
        yup.object({
          title: yup
            .string()
            .max(100)
            .notRequired()
            .default("")
            .label("Section Title"),
          content: yup
            .string()
            .notRequired()
            .default("")
            .label("Section Content"),
          image: yup
            .string()
            .url()
            .notRequired()
            .default("")
            .label("Section Image URL"),
        })
      )
      .default([])
      .label("Sections"),
    socialLinks: yup
      .object({
        twitter: yup
          .string()
          .url()
          .notRequired()
          .default(
            (parent) => `https://twitter.com/${parent.projectName || ""}`
          )
          .label("Twitter URL"),
        facebook: yup
          .string()
          .url()
          .notRequired()
          .default(
            (parent) => `https://facebook.com/${parent.projectName || ""}`
          )
          .label("Facebook URL"),
        instagram: yup
          .string()
          .url()
          .notRequired()
          .default(
            (parent) => `https://instagram.com/${parent.projectName || ""}`
          )
          .label("Instagram URL"),
      })
      .default((parent) => ({
        twitter: `https://twitter.com/${parent.projectName || ""}`,
        facebook: `https://facebook.com/${parent.projectName || ""}`,
        instagram: `https://instagram.com/${parent.projectName || ""}`,
      }))
      .label("Social Links"),
  })
  .unknown(true);

exports.newsletterRecipientSchema = yup.object({
  recipientType: yup
    .string()
    .oneOf(Object.values(RecipientTypeEnum))
    .required()
    .label("Recipient Type"),
  specificEmails: yup
    .array()
    .of(yup.string().email().label("Email Address"))
    .notRequired()
    .default([])
    .label("Specific Emails"),
});

exports.verifyGetNotificationSchema = yup.object({
  // recipent: yup.string().email().label("Recipent").required(),
  role: yup.string().label("Role").required(),
});

exports.validateCloseJobContent = yup.object({
  reason: yup.string().trim().label("Reason").required(),
});
