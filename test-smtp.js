require("dotenv").config({ path: "./.env.local" });
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
});

console.log("MAIL_HOST :", process.env.MAIL_HOST);
console.log("MAIL_FROM :", process.env.MAIL_FROM);
console.log("MAIL_USER :", process.env.MAIL_USERNAME);
console.log("MAIL_PASS :", process.env.MAIL_PASSWORD ? "(set)" : "(MISSING)");
console.log("");

transporter.verify((error) => {
  if (error) {
    console.log("✗ SMTP VERIFY FAILED:", error.message);
    console.log("  code:", error.code);
    console.log("  responseCode:", error.responseCode);
    process.exit(1);
  } else {
    console.log("✓ SMTP connection verified — server is ready");
    transporter.sendMail(
      {
        from: process.env.MAIL_FROM,
        to: "falconstudio295@gmail.com",
        subject: "Portgig SMTP Test",
        text: "If you received this, the email service is working correctly.",
      },
      (err, info) => {
        if (err) {
          console.log("✗ SEND FAILED:", err.message);
          process.exit(1);
        } else {
          console.log("✓ Test email sent! messageId:", info.messageId);
          console.log("  response:", info.response);
        }
      }
    );
  }
});
