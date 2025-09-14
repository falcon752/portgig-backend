const nodemailer = require("nodemailer");
const { nanoid } = require("nanoid");
const { MailTypeEnum } = require("../config/constants");

const { InvalidPayloadError } = require("./errors");
const registrationMail = require("../mail-templates/welcome-email");
const generalToken = require("../mail-templates/general-token");
const passwordReset = require("../mail-templates/password-reset");
const sendWaitlist = require("../mail-templates/send-waitlist");
const contactUsTemplate = require("../mail-templates/contact_us_template");
const newsletterTemplate = require("../mail-templates/newsletter");
const sendDisqualificationMessage = require("../mail-templates/send-disqualification-message");
const accountValidatedTemplate = require("../mail-templates/recruiter-status-validate");

module.exports = async function mail(type, config) {
  const { email } = config;
  const mailOptions = {
    from: process.env.MAIL_FROM || "",
    to: email,
  };
  switch (type) {
    case MailTypeEnum.ADMIN_INVITATION:
      {
      }
      break;

    case MailTypeEnum.SEND_TO_WAITLIST:
      {
        mailOptions.html = sendWaitlist(
          config?.subject,
          config?.content,
          // process.env.SUPPORT_MAIL,
          process.env.LOGO,
          process.env.PROJECT_NAME
        );
        mailOptions.subject = config.subject;
      }
      break;
    case MailTypeEnum.NEWSLETTER:
      mailOptions.html = newsletterTemplate(
        config,
        process.env.SUPPORT_MAIL,
        process.env.LOGO,
        process.env.PROJECT_NAME
      );
      mailOptions.subject = config?.topic || "Mansior Newsletter";
      break;

    case MailTypeEnum.WELCOME:
      {
        mailOptions.html = registrationMail(
          config?.name,
          config?.otp,
          process.env.SUPPORT_MAIL,
          process.env.LOGO,
          process.env.PROJECT_NAME
        );
        mailOptions.subject = config.subject;
      }
      break;
    case MailTypeEnum.PASSWORD_RESET:
      {
        mailOptions.html = passwordReset(
          config?.name,
          config?.otp,
          process.env.LOGO,
          process.env.PROJECT_NAME,
          process.env.SUPPORT_MAIL
        );
        mailOptions.subject = "Password Reset O.T.P";
      }
      break;
    case MailTypeEnum.EMAIL_VERIFICATION:
      {
        mailOptions.html = manualEmail(
          config?.message,
          process.env.SUPPORT_MAIL,
          process.env.LOGO
        );
        mailOptions.subject = config.subject;
      }
      break;

    case MailTypeEnum.GENERAL_TOKEN:
      {
        mailOptions.html = generalToken(
          config?.email,
          config?.otp,
          process.env.SUPPORT_MAIL,
          process.env.LOGO,
          process.env.PROJECT_NAME
        );
        mailOptions.subject = "Action Authorization Token";
      }
      break;
    case MailTypeEnum.SEND_EMAIL: {
      mailOptions.html = contactUsTemplate(
        config?.userEmail,
        config?.body,
        config?.fullname,
        process.env.LOGO,
        process.env.PROJECT_NAME
      );
      mailOptions.subject = "Contact Mansior";
    }
    case MailTypeEnum.DISQUALIFIED_CREATOR:
      {
        mailOptions.html = sendDisqualificationMessage(
          config?.subject,
          config?.content,
          process.env.LOGO,
          process.env.PROJECT_NAME
        );
        mailOptions.subject = "Job Application Update";
      }
      break;
    case MailTypeEnum.VALIDATE_RECRUITER:
      {
        mailOptions.html = accountValidatedTemplate(
          config?.email,
          config?.username,
          config?.status,
          process.env.LOGO,
          process.env.PROJECT_NAME
        );
        mailOptions.subject = "Portgig | Verification Complete";
      }
      break;
    default:
      throw new InvalidPayloadError("Mail Type Not known");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: 465,
    maxConnections: 100,
    maxMessages: "infinity",
    connectionTimeout: 300000,
    debug: true,
    pool: true,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
  });

  try {
    console.log("Sending Email");
    // console.log(mailOptions)
    const verifyServer = await transporter.verify();
    console.log("Server Status");
    console.log(verifyServer);
    const send = await transporter.sendMail(mailOptions);
    console.log("Mail Sent");
    console.log(send);
  } catch (error) {
    console.log(error);
  }
};
