const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { nanoid, customAlphabet } = require("nanoid");
const { numbers: ndNumbers } = require("nanoid-dictionary");
const {
  InvalidPayloadError,
  DatabaseError,
  UnAuthorizedError,
  InternalServerError,
} = require("./errors");
const yup = require("yup");
const { TransactionTypeEnum, SeerbitEventType } = require("./constants");

exports.isObjectId = (id) => {
  try {
    return id && ObjectId.isValid(new ObjectId(id));
  } catch (error) {}
  return false;
};

exports.toObjectId = (id) => {
  return mongoose.Types.ObjectId(id);
};

/**
 * @template {{}} T
 * @param {T} values
 * @param {{allowEmptyArray: boolean}} options
 * @returns
 */
exports.removeEmptyProperties = function removeEmptyProperties(
  values,
  options = {}
) {
  const { allowEmptyArray } = options;
  const newTarget = Array.isArray(values)
    ? []
    : exports.isObject(values)
    ? {}
    : values;

  if (typeof newTarget === "object") {
    for (const key in values) {
      const value = values[key];
      if (
        (Array.isArray(value) && (allowEmptyArray || value.length)) ||
        (exports.isObject(value) && Object.entries(value).length !== 0)
      ) {
        newTarget[key] = removeEmptyProperties(value) || value;
      } else if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !Array.isArray(value) &&
        !exports.isObject(value)
      ) {
        newTarget[key] = removeEmptyProperties(value);
      }
    }
  }
  return newTarget;
};

exports.paginationAggregate = async function paginationAggregate(
  Model,
  queryParams = {},
  options = {}
) {
  const { stagesBefore = [], stagesAfter = [], sort } = options;
  const paginate = !!parseInt(queryParams?.paginate || 1);
  const page = parseInt(queryParams?.page || 1);
  const limit = parseInt(queryParams?.limit || 20);
  const skip = (page - 1) * limit;

  const results = {
    total_filtered_data:
      (
        await Model.aggregate([
          ...stagesBefore,
          ...stagesAfter,
          { $count: "total_filtered_data" },
        ])
      )[0]?.total_filtered_data || 0,
  };

  results.page_count = Math.ceil(results.total_filtered_data / limit);

  if (page * limit < results.total_filtered_data) {
    results.next_page = page + 1;
  }

  if (skip > 0) {
    results.previous_page = page - 1;
  }

  results.page_data = await Model.aggregate([
    ...stagesBefore,
    ...(paginate
      ? [{ $sort: { _id: -1, ...sort } }, { $skip: skip }, { $limit: limit }]
      : []),
    ...stagesAfter,
  ]);

  return results;
};

const getUserInfoFromDoc = (doc) => {
  const user = { ...doc.toObject({ virtuals: true, minimize: false }) };
  delete user.auth.password;
  delete user.__t;
  delete user.__v;
  delete user._id;
  return user;
};
exports.getUserInfoFromDoc = getUserInfoFromDoc;

exports.getAdmIinnfoFromDoc = (doc) => {
  const admin = { ...doc.toObject({ virtuals: true, minimize: false }) };
  delete admin.password;
  delete admin.__t;
  delete admin.__v;
  return admin;
};
exports.generateRandomNumber = function generateRandomNumber(count = 15) {
  return customAlphabet(ndNumbers, count)();
};

exports.handleError = (error) => {
  // console.log(error);

  if (error instanceof yup.ValidationError) {
    console.log("reach here2");
    // console.log(error);
    const errorMessages = error.errors.join(", "); // Join all validation errors
    console.log("Yup validation errors:", errorMessages);
    throw new InvalidPayloadError(
      `Validation failed: ${errorMessages || "Invalid input"}`,
      {
        cause: error.errors,
      }
    );
  }
  if (error.name === "MongoServerError" || error.name === "ValidationError") {
    throw handleMongoDBError(error);
  }
  if (error instanceof InvalidPayloadError) {
    throw error;
  }
  if (error instanceof UnAuthorizedError) {
    throw error;
  }

  throw new InternalServerError(undefined, { cause: error });
};

const handleMongoDBError = (error) => {
  // MongoDB duplicate key error (E11000)
  if (
    error.code === 11000 ||
    (error.name === "MongoServerError" && error.message.includes("E11000"))
  ) {
    const fieldMatch = error.message.match(/dup key: { :?(.*?)}/);
    const field = fieldMatch ? fieldMatch[1].trim() : "unknown field";
    const userFriendlyMessage = `this ${field} already exists.`;
    return new InvalidPayloadError(userFriendlyMessage, { status: 400 });
  }
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors)
      .map((err) => err.message)
      .join(", ");
    return new InvalidPayloadError(`Validation failed: ${errors}`, {
      status: 400,
    });
  }
  // Default to generic database error
  return new DatabaseError(`Database operation failed: ${error.message}`);
};

exports.generateTid = function generateTid(
  type,
  year = new Date().getFullYear()
) {
  return {
    [TransactionTypeEnum.TRANSFER]: "TRF",
    [TransactionTypeEnum.WALLET_TOP_UP]: "WLTP",
    [TransactionTypeEnum.INVESTMENT]: "INVM",
    [SeerbitEventType.GENERATE_VIRTUAL_ACCOUNT]: "GVA",
  }[type].concat("-", year, "-", customAlphabet(ndNumbers, 10)());
};
