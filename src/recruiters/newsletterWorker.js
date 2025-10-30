const pLimit = require("p-limit").default;
const mail = require("../config/email");
const { workerData, parentPort } = require("worker_threads");
const { MailTypeEnum } = require("../config/constants");

async function sendEmails({ emails, newsletterConfig }) {
  const limit = pLimit(5);

  const sendEmailPromises = emails.map((email) =>
    limit(async () => {
      try {
        await mail(MailTypeEnum.NEWSLETTER, {
          ...newsletterConfig,
          email,
        });
        console.log(
          `[NEWSLETTER] - ${new Date().toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
          })} -- Newsletter sent to ${email}`
        );
        return { email, status: "fulfilled" };
      } catch (error) {
        console.error(
          `[NEWSLETTER] - error: ${new Date().toLocaleString("en-US", {
            timeZone: "Africa/Lagos",
          })} -- Failed to send newsletter to ${email}: ${error.message}`,
          {
            error: error.toObject?.() || {
              message: error.message,
              name: error.name,
              status: error.status || 500,
              cause: error.cause?.message || null,
            },
          }
        );
        return { email, status: "rejected", error: error.message };
      }
    })
  );

  const results = await Promise.allSettled(sendEmailPromises);
  const successfulEmails = results
    .filter((r) => r.value.status === "fulfilled")
    .map((r) => r.value.email);
  const failedEmails = results
    .filter((r) => r.value.status === "rejected")
    .map((r) => ({
      email: r.value.email,
      error: r.value.error,
    }));

  console.log(
    `[NEWSLETTER] - ${new Date().toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
    })} -- Newsletter sending completed: ${
      successfulEmails.length
    } succeeded, ${failedEmails.length} failed`
  );
}

sendEmails(workerData).catch((error) => {
  console.error(`[NEWSLETTER] - Worker error: ${error.message}`, {
    error: {
      message: error.message,
      name: error.name,
      status: 500,
      cause: error.cause?.message || null,
    },
  });
  process.exit(1);
});
