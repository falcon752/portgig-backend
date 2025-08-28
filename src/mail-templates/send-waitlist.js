module.exports = function sendWaitlist(subject, content, logo, projectName) {
  return `<!DOCTYPE html>
    <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
      <head>
        <title>Waitlist Update</title>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap" rel="stylesheet">
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
          #MessageViewBody a {
            color: inherit;
            text-decoration: none;
          }
          p {
            line-height: inherit;
          }
          .desktop_hide, .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
          }
          @media (max-width:625px) {
            .desktop_hide table.icons-inner {
              display: inline-block !important;
            }
            .icons-inner {
              text-align: center;
            }
            .icons-inner td {
              margin: 0 auto;
            }
            .row-content {
              width: 100% !important;
            }
            .stack .column {
              width: 100%;
              display: block;
            }
            .mobile_hide {
              display: none;
            }
            .desktop_hide, .desktop_hide table {
              display: table !important;
              max-height: none !important;
            }
          }
        </style>
      </head>
  
      <body style="background-color: #ececec; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
        <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="background-color: #ececec;" width="100%">
          <tbody>
            <tr>
              <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content" role="presentation" style="background-color: #ffffff; width: 605px;" width="605">
                  <tbody>
                    <tr>
                      <td style="text-align: center; padding: 20px 0;">
                        <img src="${logo}" alt="Logo" style="width: 170px; max-width: 100%; height: auto; border: 0;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 30px 15px 30px;">
                        <h1 style="font-family: 'Work Sans', sans-serif; font-size: 24px; color: #333333; margin: 0 0 20px 0; text-align: center;">
                          ${subject}
                        </h1>
                        <div style="background-color: #f9f9f9; padding: 25px; margin: 20px 0; border-radius: 8px;">
                          <div style="font-family: 'Work Sans', sans-serif; font-size: 16px; color: #555555; line-height: 1.6; white-space: pre-wrap;">
                            ${content}
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 30px;">
                        <p style="font-family: 'Work Sans', sans-serif; font-size: 14px; color: #888888; text-align: center;">
                          This email was sent to our valued waitlist members. You can update your preferences anytime.
                        </p>
                        <p style="font-family: 'Work Sans', sans-serif; font-size: 14px; color: #555555; text-align: center; margin-top: 20px;">
                          Thank you for your support,<br />
                          <strong>${projectName}</strong> Team
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
