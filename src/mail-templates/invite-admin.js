module.exports = function InviteAdmin(email, password, appName, logo) {
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

      .desktop_hide,
      .desktop_hide table {
        mso-hide: all;
        display: none;
        max-height: 0px;
        overflow: hidden;
      }

      @media (max-width: 520px) {
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

        .mobile_hide {
          display: none;
        }

        .stack .column {
          width: 100%;
          display: block;
        }

        .mobile_hide {
          min-height: 0;
          max-height: 0;
          max-width: 0;
          overflow: hidden;
          font-size: 0px;
        }

        .desktop_hide,
        .desktop_hide table {
          display: table !important;
          max-height: none !important;
        }
      }
    </style>
  </head>

  <body
    style="
      background-color: #ffffff;
      margin: 0;
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
        background-color: #ffffff;
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
                              cellpadding="0"
                              cellspacing="0"
                              class="divider_block"
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
                                    padding-top: 20px;
                                    padding-right: 10px;
                                    padding-bottom: 20px;
                                    padding-left: 10px;
                                  "
                                >
                                  <div align="center">
                                    <table
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="
                                        mso-table-lspace: 0pt;
                                        mso-table-rspace: 0pt;
                                      "
                                      width="50%"
                                    >
                                      <tr>
                                        <td
                                          class="divider_inner"
                                          style="
                                            font-size: 1px;
                                            line-height: 1px;
                                            border-top: 1px solid #bbbbbb;
                                          "
                                        >
                                          <span> </span>
                                        </td>
                                      </tr>
                                    </table>
                                  </div>
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
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #262525;
                                      font-size: 23px;
                                      font-family: Work Sans, Work Sans,
                                        Work Sans, sans-serif;
                                      line-height: 120%;
                                      text-align: center;
                                      direction: ltr;
                                      font-weight: 700;
                                      letter-spacing: normal;
                                      margin-top: 0;
                                      margin-bottom: 0;
                                    "
                                  >
                                    <span class="tinyMce-placeholder"
                                      >Admin Account Invitation
                                    </span>
                                  </h1>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="0"
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
                                <td
                                  style="
                                    padding-top: 20px;
                                    padding-right: 35px;
                                    padding-bottom: 20px;
                                    padding-left: 35px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #000000;
                                      font-size: 14px;
                                      font-family: Work Sans, Work Sans,
                                        Work Sans, sans-serif;
                                      font-weight: 400;
                                      font-size: 17px;
                                      line-height: 150%;
                                      text-align: left;
                                      direction: ltr;
                                      letter-spacing: 0px;
                                      mso-line-height-alt: 21px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Hey ${email}, your account has been
                                      created successfully on
                                      <strong>${appName} , </strong>copy the
                                      password bellow to proceed. 
                                    </p>
                                  </div>
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
                                <td
                                  style="
                                    width: 100%;
                                    text-align: center;
                                    padding-top: 5px;
                                    padding-bottom: 5px;
                                  "
                                >
                                  <h1
                                    style="
                                      margin: 0;
                                      color: #555555;
                                      font-size: 23px;
                                      font-family: Work Sans, Work Sans,
                                        Work Sans, sans-serif;
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
                                      >${password}</span
                                    >
                                  </h1>
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
                            ></table>
                            <table
                              border="0"
                              cellpadding="0"
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
                                <td
                                  style="
                                    padding-top: 20px;
                                    padding-right: 35px;
                                    padding-bottom: 20px;
                                    padding-left: 35px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #000000;
                                      font-size: 14px;
                                      font-family: Work Sans, Work Sans,
                                        Work Sans, sans-serif;
                                      font-weight: 400;
                                      font-size: 17px;
                                      line-height: 150%;
                                      text-align: left;
                                      direction: ltr;
                                      letter-spacing: 0px;
                                      mso-line-height-alt: 21px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      Note that once you've logged in you can
                                      change your password
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            </table>
                            <table
                              border="0"
                              cellpadding="0"
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
                                <td
                                  style="
                                    padding-top: 40px;
                                    padding-right: 35px;
                                    padding-bottom: 10px;
                                    padding-left: 35px;
                                  "
                                >
                                  <div
                                    style="
                                      color: #9e9e9e;
                                      font-size: 14px;
                                      font-family: Work Sans, Work Sans,
                                        Work Sans, sans-serif;
                                      font-weight: 400;
                                      line-height: 200%;
                                      text-align: left;
                                      direction: ltr;
                                      letter-spacing: 0px;
                                      mso-line-height-alt: 28px;
                                    "
                                  >
                                    <p style="margin: 0">
                                      © ${new Date().getFullYear()}
                                      <strong>${appName}</strong>. All Rights
                                      Reserved. 
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
