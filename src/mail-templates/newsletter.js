// #2c3e50
module.exports = function newsletter(config, supportMail, logo, projectName) {
  const {
    topic = "",
    description = "",
    date = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    mainImage = "",
    content = "",
    ctaLink = "#",
    ctaText = "Discover Now",
    sections = [],
    socialLinks = {
      twitter: process.env.TWITTER_URL,
      facebook: process.env.FB_URL,
      instagram: process.env.INSTAGRAM_URL,
      linkedin: process.env.LINKEDIN_URL,
      tikTok: process.env.TIKTOK_URL,
      linkedinIcon:
        process.env.LINKEDIN_ICON_URL ||
        "https://cdn-icons-png.flaticon.com/512/174/174857.png",
      tikTokIcon:
        process.env.TIKTOK_ICON_URL ||
        "https://cdn-icons-png.flaticon.com/512/3046/3046127.png",
    },
  } = config;

  // Log social media URLs for debugging
  console.log("Social Links:", {
    twitter: socialLinks.twitter,
    facebook: socialLinks.facebook,
    instagram: socialLinks.instagram,
    linkedin: socialLinks.linkedin,
    tikTok: socialLinks.tikTok,
    linkedinIcon: socialLinks.linkedinIcon,
    tikTokIcon: socialLinks.tikTokIcon,
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${projectName} Update</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          background-color: #f0f2f5;
          color: #333333;
        }
        .container {
          max-width: 700px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }
        .header img.logo {
          max-width: 180px;
          height: auto;
        }
        .header h1 {
          color: rgb(61, 50, 50);
          font-size: 28px;
          margin: 20px 0 10px;
          font-weight: 700;
        }
        .header .date {
          color: rgb(104, 106, 107);
          font-size: 14px;
          opacity: 0.8;
        }
        .main-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }
        .content {
          padding: 40px;
        }
        .content h2 {
          font-size: 24px;
          color: #2c3e50;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .content p.description {
          font-size: 16px;
          line-height: 1.7;
          color: #555555;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 40px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        .section img {
          width: 100%;
          max-height: 200px;
          object-fit: cover;
          border-radius: 6px;
          margin-bottom: 15px;
        }
        .section h3 {
          font-size: 20px;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        .section p {
          font-size: 15px;
          line-height: 1.6;
          color: #555555;
        }
        .cta-button {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: #ffffff;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .cta-button:hover {
          background: linear-gradient(135deg, #2980b9 0%, #2471a3 100%);
          transform: translateY(-2px);
        }
        .footer {
          background-color: #f9fafb;
          padding: 30px 40px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer p {
          font-size: 14px;
          color: #666666;
          margin: 10px 0;
          line-height: 1.5;
        }
        .footer a {
          color: #3498db;
          text-decoration: none;
          font-weight: 500;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          text-decoration: none;
        }
        .social-links img {
          width: 28px;
          height: 28px;
          vertical-align: middle;
          transition: opacity 0.2s ease;
        }
        .social-links a:hover img {
          opacity: 0.7;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            margin: 20px 10px;
          }
          .header {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 22px;
          }
          .content {
            padding: 20px;
          }
          .content h2 {
            font-size: 20px;
          }
          .section {
            padding: 15px;
          }
          .section h3 {
            font-size: 18px;
          }
          .cta-button {
            font-size: 14px;
            padding: 12px 24px;
          }
          .footer {
            padding: 20px;
          }
          .footer p {
            font-size: 12px;
          }
          .social-links a {
            margin: 0 8px;
          }
          .social-links img {
            width: 24px;
            height: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logo}" alt="${projectName} Logo" class="logo">
          ${topic ? `<h1>${topic}</h1>` : ""}
          ${date ? `<p class="date">${date}</p>` : ""}
        </div>
        ${
          mainImage
            ? `<img src="${mainImage}" alt="Main Image" class="main-image">`
            : ""
        }
        <div class="content">
          ${description ? `<p class="description">${description}</p>` : ""}
          ${content ? `<div>${content}</div>` : ""}
          ${sections
            .map(
              (section, index) => `
            <div class="section">
              ${
                section.image
                  ? `<img src="${section.image}" alt="Section Image ${
                      index + 1
                    }">`
                  : ""
              }
              ${section.title ? `<h3>${section.title}</h3>` : ""}
              ${section.content ? `<p>${section.content}</p>` : ""}
            </div>
          `
            )
            .join("")}
          ${
            ctaLink && ctaText
              ? `<a href="${ctaLink}" class="cta-button">${ctaText}</a>`
              : ""
          }
        </div>
        <div class="footer">
          <p>You're receiving this email as a valued member of ${projectName}.</p>
          <p>
            Have questions? Contact us at 
            <a href="mailto:${supportMail}">${supportMail}</a>
          </p>
          <div class="social-links">
            ${
              socialLinks.twitter
                ? `<a href="${socialLinks.twitter}"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter"></a>`
                : ""
            }
            ${
              socialLinks.facebook
                ? `<a href="${socialLinks.facebook}"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook"></a>`
                : ""
            }
            ${
              socialLinks.instagram
                ? `<a href="${socialLinks.instagram}"><img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" alt="Instagram"></a>`
                : ""
            }
            ${
              socialLinks.linkedin
                ? `<a href="${socialLinks.linkedin}"><img src="${socialLinks.linkedinIcon}" alt="LinkedIn"></a>`
                : ""
            }
            ${
              socialLinks.tikTok
                ? `<a href="${socialLinks.tikTok}"><img src="${socialLinks.tikTokIcon}" alt="TikTok"></a>`
                : ""
            }
          </div>
          <p>© ${new Date().getFullYear()} ${projectName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
