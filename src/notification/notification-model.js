const mongoose = require("mongoose");
const { CollectionEnum, NotificationTypeEnum } = require("../config/constants");

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    from: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    notification_type: {
      type: String,
      enum: Object.values(NotificationTypeEnum),
      required: true,
    },
    other_details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    recipient: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "recipient_role",
    },
    recipient_role: {
      type: String,
      required: true,
      enum: [CollectionEnum.RECRUITER, CollectionEnum.CREATOR],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const NotificationModel = mongoose.model(
  CollectionEnum.NOTIFICATION,
  NotificationSchema
);

module.exports = {
  NotificationModel,
};
