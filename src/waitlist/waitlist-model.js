const mongoose = require("mongoose");
const { CollectionEnum } = require("../config/constants");

const Schema = mongoose.Schema;

const WaitlistSchema = new Schema(
  {
    email: {
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const WaitlistModel = mongoose.model(CollectionEnum.WAITLIST, WaitlistSchema);

module.exports = {
  WaitlistModel,
};
