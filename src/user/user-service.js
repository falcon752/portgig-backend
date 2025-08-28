const {
  ProviderEnum,
  CollectionEnum,
  AccountStatusEnum,
} = require("../config/constants");
const { AppError, InternalServerError, InvalidPayloadError } = require("../config/errors");
const jwtTokenProvider = require("../config/jwt-token-provider");
const { handleError } = require("../config/utils");
const { CreatorModel } = require("../creators/creators-model");
const { RecruiterModel } = require("../recruiters/recruiters-model");
const axios = require("axios")
const logger = require("../config/logging").getLogger("USER:SERVICE");
const querystring = require("querystring");

exports.googleLogin = async function googleLogin(req) {
  try {
    const { code, state } = req.query;

    if (!code) {
      throw new InvalidPayloadError("Authorization code is missing");
    }
    const data = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    };

    const urlEncodedData = querystring.stringify(data);
    const response = await axios.post(
      process.env.GOOGLE_ACCESS_TOKEN_URL,
      urlEncodedData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const access_token_data = response.data;

    const { access_token, id_token } = access_token_data;

    if (!access_token) {
      throw new InternalServerError("Access token is missing from response");
    }

    const token_info_response = await axios.get(
      process.env.GOOGLE_USERINFO_URL,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userInfo = token_info_response.data;
    const { email, family_name, given_name,name } = userInfo;
    console.log(userInfo, "User Info");

    const decodedState = JSON.parse(decodeURIComponent(state));
    const { role } = decodedState;
    let user;
    if (role === CollectionEnum.RECRUITER) {
      console.log("user");
      user = await RecruiterModel.findOne({ "auth.email": email });
      if (!user) {
        user = await RecruiterModel.create({
          bio_data: {
            full_name: name || `${given_name} ${family_name}` || "no name",
          },
          auth: { email: email, password: "", provider: ProviderEnum.GOOGLE },
        });
      } else {
        if (user.auth.provider == ProviderEnum.EMAIL) {
          throw new InvalidPayloadError(
            "This account exists. Please sign in using email and password."
          );
        }
      }
    } else if (role === CollectionEnum.CREATOR) {
      user = await CreatorModel.findOne({ "auth.email": email });
      if (!user) {
        user = await CreatorModel.create({
          bio_data: {
            full_name: name || `${given_name} ${family_name}` || "no name",
          },
          auth: { email: email, password: "", provider: ProviderEnum.GOOGLE },
        });
      } else {
        if (user.auth.provider == ProviderEnum.EMAIL) {
          throw new InvalidPayloadError(
            "This account exists. Please sign in using email and password."
          );
        }
      }
    } else {
      throw new InvalidPayloadError("Invalid role in state");
    }

    user.auth.validation_token = null;
    await user.save();

    const profile = createProfile(user);
    return {
      message: "Success",
      status: 200,
      access_token: generateAccessToken(profile.id.toString()),
      refresh_token: generateRefreshToken(profile.id.toString()),
      profile,
      role,
    };
  } catch (error) {
    logger.error(error?.message);
    if (!(error instanceof AppError)) {
      throw new InternalServerError("An unexpected error occurred", {
        cause: error,
      });
    }
    if (axios.isAxiosError(error)) {
      console.error(
        "Axios Error:",
        error.response?.data,
        error.response?.status
      );
    }
    handleError(error);
  }
};

/**
 * Creates a copy of the user's profile object, removing sensitive information.
 * @param {Object} user - The user object.
 * @returns {Object} - The user's profile object without sensitive information.
 */
function createProfile(user) {
  const profile = { ...user.toObject({ virtuals: true, minimize: false }) };
  delete profile.auth.password;
  delete profile.__t;
  delete profile.__v;
  return profile;
}

/**
 * Generates an access token using the user's ID.
 * @param {string} userId - The user ID.
 * @returns {string} - The generated access token.
 */
function generateAccessToken(userId) {
  return jwtTokenProvider.signJwt(userId);
}

/**
 * Generates a refresh token using the user's ID.
 * @param {string} userId - The user ID.
 * @returns {string} - The generated refresh token.
 */
function generateRefreshToken(userId) {
  return jwtTokenProvider.signRefreshJwt(userId);
}
