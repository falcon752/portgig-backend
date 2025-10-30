const rateLimit = require("express-rate-limit");

exports.loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes,
  max: 50, // Limit each IP to 30 requests per `window` (here, per 30 minutes)
  standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (request, response, next, options) => {
    if (request.rateLimit.current === request.rateLimit.limit + 1) {
      // onLimitReached code here
      response.status(options.statusCode).send(options.message);
    }
  },
  message: {
    status: 429,
    message: `Too many attempts, kindly try again in 30 minutes `,
  },
});

exports.generalLimiter = rateLimit({
  windowMs: 10 * 60 * 60 * 1000, // 10hrs interval for 3 request ,
  max: 3, // Limit each IP to 3 requests per `window` (here, per 10 hours)
  standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (request, response, next, options) => {
    if (request.rateLimit.current === request.rateLimit.limit + 1) {
      // onLimitReached code here
      response.status(options.statusCode).send(options.message);
    }
  },
  message: {
    status: 429,
    message: `Too many attempts, kindly try again later in 10hrs  `,
  },
});
