const nodemailer = require("nodemailer");
const dns = require("dns").promises;
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
    from: `"${process.env.PROJECT_NAME || "Portgig"}" <${process.env.MAIL_FROM || ""}>`,
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
      mailOptions.subject = config?.topic || `${process.env.PROJECT_NAME || "Portgig"} Newsletter`;
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
        mailOptions.subject = config.subject || `Welcome to ${process.env.PROJECT_NAME || "Portgig"} — Verify your account`;
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
        mailOptions.subject = `${process.env.PROJECT_NAME || "Portgig"} — Your password reset code`;
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
      mailOptions.subject = `Contact ${process.env.PROJECT_NAME || "Portgig"}`;
      break;
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

  // Resolve IPv6 address to avoid VPS IPv4 being blocked by Gmail/Zoho
  let smtpHost = process.env.MAIL_HOST;
  try {
    const ipv6records = await dns.resolve6(smtpHost);
    if (ipv6records.length > 0) smtpHost = ipv6records[0];
  } catch (_) { /* fallback to hostname if no AAAA record */ }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.MAIL_PORT || "587", 10),
    maxConnections: 100,
    maxMessages: "infinity",
    connectionTimeout: 300000,
    debug: true,
    pool: true,
    secure: process.env.MAIL_PORT === "465", // true only for port 465
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false, servername: process.env.MAIL_HOST },
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
