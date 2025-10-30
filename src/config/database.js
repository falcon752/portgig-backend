const mongoose = require("mongoose");
const { nigeriaData, fieldsData } = require("./local_data");
const logger = require("./logging").getLogger("DATABASE");

const DATABASE_URL = process.env.DATABASE_URL;
const ObjectId = mongoose.Types.ObjectId;
mongoose.set("strictQuery", true);
exports.connect = () =>
  mongoose
    .connect(DATABASE_URL, {
      useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    .then(() => {
      logger.info(`🚀 DATABASE CONNECTED: ${DATABASE_URL}`);
    })
    .catch((error) => {
      console.log("unable to connect to db");
      logger.error(error);
      throw error;
    });

exports.isObjectId = (id) => {
  try {
    return id && ObjectId.isValid(new ObjectId(id));
  } catch (error) {}
  return false;
};

exports.getAllStates = function () {
  return Object.keys(nigeriaData);
};

exports.getLGAsByState = function (state) {
  return nigeriaData[state] || null;
};

exports.getAllFields = function () {
  return Object.keys(fieldsData);
};

exports.getIndustriesByField = function (field) {
  return fieldsData[field] || null;
};
