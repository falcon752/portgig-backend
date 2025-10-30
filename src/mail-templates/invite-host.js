module.exports = function InviteHost(
  email,
  host,
  inviteEndpoint,
  token,
  appName,
  logo
) {
  const inviteLink = `${inviteEndpoint}?email=${encodeURIComponent(
    email
  )}&host=${encodeURIComponent(host)}&token=${encodeURIComponent(token)}`;

  return `<!DOCTYPE html>
    <html
      lang="en"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:v="urn:schemas-microsoft-com:vml"
    >
      <head>
        <title></title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
          }
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
          }
          p {
            line-height: inherit;
          }
          .row-content {
            width: 100% !important;
          }
          .stack .column {
            width: 100%;
            display: block;
          }
        </style>
      </head>
      <body style="background-color: #ffffff; margin: 0; padding: 0;">
        <table
          border="0"
          cellpadding="0"
          cellspacing="0"
          style="background-color: #ffffff; width: 100%;"
        >
          <tbody>
            <tr>
              <td>
                <table
                  align="center"
                  border="0"
                  cellpadding="0"
                  cellspacing="0"
                  style="width: 500px; color: #000000;"
                >
                  <tbody>
                    <tr>
                      <td style="padding: 25px 0; text-align: center;">
                        <img
                          src="${logo}"
                          alt="${appName} Logo"
                          style="width: 170px; height: auto; border: 0;"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <h1 style="font-family: 'Work Sans', sans-serif; font-size: 23px; font-weight: 700; margin: 0;">
                          Co-host Invitation
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 35px; text-align: left; font-family: 'Work Sans', sans-serif; font-size: 17px; line-height: 1.5;">
                        <p>
                          Hey ${email},<br /><br />
                          You have been invited by <strong>${host}</strong> to join as a co-host on <strong>${appName}</strong>. Click the button below to accept the invitation and complete the setup:
                        </p>
                        <p style="text-align: center; margin: 20px 0;">
                          <a
                            href="${inviteLink}"
                            style="
                              background-color: #007bff;
                              color: #ffffff;
                              text-decoration: none;
                              padding: 10px 20px;
                              border-radius: 5px;
                              font-family: 'Work Sans', sans-serif;
                              font-size: 16px;
                            "
                          >
                            Accept Invitation
                          </a>
                        </p>
                        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                        <p style="word-wrap: break-word; color: #007bff;">
                          <a href="${inviteLink}" style="color: #007bff;">${inviteLink}</a>
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 35px; text-align: center; font-family: 'Work Sans', sans-serif; font-size: 14px; color: #9e9e9e;">
                        <p>
                          © ${new Date().getFullYear()} ${appName}. All Rights Reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>`;
};
