module.exports = function registrationMail(
  name,
  token,
  supportEmail,
  logo,
  appName
) {
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
    <!--[if mso
      ]><xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch
          ><o:AllowPNG /></o:OfficeDocumentSettings></xml
    ><![endif]-->
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

      @media (max-width: 520px) {
        .icons-inner {
          text-align: center;
        }

        .icons-inner td {
          margin: 0 auto;
        }

        .row-content {
          width: 100% !important;
        }

        .image_block img.big {
          width: auto !important;
        }

        .column .border {
          display: none;
        }

        table {
          table-layout: fixed !important;
        }

        .stack .column {
          width: 100%;
          display: block;
        }
      }
    </style>
  </head>

  <body
    style="
      margin: 0;
      background-color: #d6e8f2;
      padding: 0;
      -webkit-text-size-adjust: none;
      text-size-adjust: none;
    "
  >
    <table
      border="0"
      cellpadding="0"
      cellspacing="0"
      class="nl-container"
      role="presentation"
      style="
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        background-color: #d6e8f2;
        background-image: none;
        background-position: top left;
        background-size: auto;
        background-repeat: no-repeat;
      "
      width="100%"
    >
      <tbody>
        <tr>
          <td>
            <table
              align="center"
              border="0"
              cellpadding="0"
              cellspacing="0"
              class="row row-1"
              role="presentation"
              style="mso-table-lspace: 0pt; mso-table-rspace: 0pt"
              width="100%"
            >
              <tbody>
                <tr>
                  <td>
                    <table
                      align="center"
                      border="0"
                      cellpadding="0"
                      cellspacing="0"
                      class="row-content stack"
                      role="presentation"
                      style="
                        mso-table-lspace: 0pt;
                        mso-table-rspace: 0pt;
                        background-color: #d6e8f2;
                        color: #000000;
                        width: 500px;
                      "
                      width="500"
                    >
                      <tbody>
                        <tr>
                          <td
                            class="column column-1"
                            style="
                              mso-table-lspace: 0pt;
                              mso-table-rspace: 0pt;
                              font-weight: 400;
                              text-align: left;
                              vertical-align: top;
                              padding-top: 5px;
                              padding-bottom: 5px;
                              border-top: 0px;
                              border-right: 0px;
                              border-bottom: 0px;
                              border-left: 0px;
                            "
                            width="100%"
                          >
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="heading_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                              width="100%"
                            >
                              <tr>
                                <td style="width: 100%; text-align: center">
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #00517f;
                                      font-size: 35px;
                                      font-family: 'Ubuntu', Tahoma, Verdana,
                                        Segoe, sans-serif;
                                      line-height: 200%;
                                      text-align: center;
                                      direction: ltr;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                    "
                                  >
                                    <span class="tinyMce-placeholder"
                                      >Dear Member, ${name} !</span
                                    >
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="heading_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                              width="100%"
                            >
                              <tr>
                                <td style="width: 100%; text-align: center">
                                  <h3
                                    style="
                                      margin: 0;
                                      color: #00517f;
                                      font-size: 16px;
                                      font-family: 'Ubuntu', Tahoma, Verdana,
                                        Segoe, sans-serif;
                                      line-height: 200%;
                                      text-align: center;
                                      direction: ltr;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                    "
                                  >
                                    <span class="tinyMce-placeholder"
                                      >Welcome to
                                      <strong>${appName}</strong></span
                                    >
                                  </h3>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="heading_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                              width="100%"
                            >
                              <tr>
                                <td style="width: 100%; text-align: center">
                                  <h3
                                    style="
                                      margin: 0;
                                      color: #00517f;
                                      font-size: 16px;
                                      font-family: 'Ubuntu', Tahoma, Verdana,
                                        Segoe, sans-serif;
                                      line-height: 180%;
                                      text-align: center;
                                      direction: ltr;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                    "
                                  >
                                    <span class="tinyMce-placeholder"
                                      >We are so happy to have you here!</span
                                    >
                                  </h3>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="0"
                              cellspacing="0"
                              class="image_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                              width="100%"
                            >
                              <tr>
                                <td
                                  style="
                                    width: 100%;
                                    padding-top: 25px;
                                    padding-right: 0px;
                                    padding-left: 0px;
                                  "
                                >
                                  <div
                                    style="
                                      flex-direction: row;
                                      line-height: 10px;
                                      align-items: center;
                                      justify-content: center;
                                    "
                                    align="center"
                                  >
                                    <div
                                      style="
                                  
                                        border-radius: 8px;
                                        align-items: center;
                                        justify-content: center;
                                        align-self: center;
                                        width: 80px;
                                        padding: 8px;
                                        box-shadow: #fafafa;
                                      "
                                    >
                                      <img
                                        src="${logo}"
                                        style="
                                          display: block;
                                          height: auto;
                                          border: 0;
                                          width: 170px;
                                          max-width: 100%;
                                        "
                                        width="170"
                                      />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              class="button_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                              "
                              width="100%"
                            >
                              <tr>
                                <td>
                                  <div align="center">
                                    <h4
                                      style="
                                        margin: 0;
                                        color: #00517f;
                                        font-size: 20px;
                                        font-family: 'Ubuntu', Tahoma, Verdana,
                                          Segoe, sans-serif;
                                        line-height: 150%;
                                        text-align: center;
                                        direction: ltr;
                                        font-weight: 500;
                                        letter-spacing: normal;
                                        margin-top: 0;
                                        margin-bottom: 0;
                                      "
                                    >
                                      We are glad to welcome you on board.
                                      Thinking of what next? Verification
                                      process is next. Kindly verify with the
                                      Token below to proceed.
                                    </h4>
                                    <h1
                                      style="
                                        margin: 0;
                                        color: #00517f;
                                        font-size: 35px;
                                        font-family: 'Ubuntu', Tahoma, Verdana,
                                          Segoe, sans-serif;
                                        line-height: 200%;
                                        text-align: center;
                                        direction: ltr;
                                        font-weight: 700;
                                        letter-spacing: normal;
                                        margin-top: 0;
                                        margin-bottom: 0;
                                      "
                                    >
                                      <span class="tinyMce-placeholder"
                                        >${token}
                                      </span>
                                    </h1>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="10"
                              cellspacing="0"
                              class="paragraph_block"
                              role="presentation"
                              style="
                                mso-table-lspace: 0pt;
                                mso-table-rspace: 0pt;
                                word-break: break-word;
                              "
                              width="100%"
                            >
                              <tr>
                                <td>
                                  <div
                                    style="
                                      color: #000000;
                                      font-size: 14px;
                                      font-family: 'Ubuntu', Tahoma, Verdana,
                                        Segoe, sans-serif;
                                      font-weight: 400;
                                      line-height: 120%;
                                      text-align: center;
                                      direction: ltr;
                                      letter-spacing: 0px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Questions? Email us at
                                      <a
                                        href="mailto:${supportEmail}"
                                        rel="noopener"
                                        style="
                                          text-decoration: underline;
                                          color: #0068a5;
                                        "
                                        target="_blank"
                                        title="${supportEmail}"
                                        >${supportEmail}</a
                                      >
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- End -->
  </body>
</html>
`;
};
