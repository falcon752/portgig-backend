const {
  AuthenticationError,
} = require("./errors");
const { verifyJws } = require("./jwt-token-provider");
const logger = require("./logging").getLogger("PORTGIG");

/**
 *
 * @param {{allowRoutes: string[]}} options
 */
function auth(options) {
  const { allowRoutes = [] } = options || {};
  return function (req, res, next) {
    console.log(req.path, "Path");
    console.log(allowRoutes.includes(req.path))
    if (allowRoutes.includes(req.path)) {
      next();
    } else {
      const jws = req.get("Authorization")?.split(" ")?.[1];
      const jwt = jws && verifyJws(jws);

      if (jwt) {
        req.userId = jwt.sub;
        // req.userPortal = jwt.aud || jwt.audience;
        next();
      } else {
        const authError = new AuthenticationError();
        res.status(authError.status).json(authError.toObject());
      }
    }
  };
}

exports.auth = auth;
