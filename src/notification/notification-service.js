const logger = require("../config/logging").getLogger("NOTIFICATION:SERVICE");
const { UnAuthorizedError } = require("../config/errors");
const { NotificationModel } = require("./notification-model");
const { verifyGetNotificationSchema } = require("../config/validation-schemas");
const { CollectionEnum, ErrorMessageEnum } = require("../config/constants");
const { CreatorModel } = require("../creators/creators-model");
const { RecruiterModel } = require("../recruiters/recruiters-model");
const { paginationAggregate, handleError } = require("../config/utils");

// exports.createActivity = async function createActivity(userId, payload) {
//   try {
//     const { description, recipent, property, other_details, role } =
//       verifyActivitySchema.validateSync(payload);
//     yupObjectId().required().validateSync(recipent);

//     let user = {};
//     if (role === WalletUsers.USER) {
//       user = await UserModel.findById(userId);
//     } else if (role === WalletUsers.HOST) {
//       user = await HostModel.findById(userId);
//     }
//     if (!user) throw new UnAuthorizedError(ErrorMessage.UNAUTHORIZED);

//     const activity = await NotificationModel.create({
//       from: role,
//       description,
//       recipient: recipent,
//       recipient_role: role,
//       activity_type: ActivityTypeEnum.ARTIFICIAL,
//       property: property,
//       other_details,
//       // session, // Ensure activity is logged in the session
//     });

//     return {
//       message: "activity is successful added",
//       data: activity,
//     };
//   } catch (error) {
//     logger.error(error?.message);
//     handleError(error);
//   }
// };

exports.getNotifications = async function getActivities(
  userId,
  queryParams = {}
) {
  try {
    const { role } = verifyGetNotificationSchema.validateSync(queryParams);
    // yupObjectId().required().validateSync(recipent);
    console.log(role)

    const user =
      role === CollectionEnum.CREATOR
        ? await CreatorModel.findById(userId)
        : await RecruiterModel.findById(userId);

    if (!user) throw new UnAuthorizedError(ErrorMessageEnum.UNAUTHORIZED);

    const notifications = await paginationAggregate(
      NotificationModel,
      queryParams,
      {
        stagesBefore: [
          { $match: { recipient: user?._id } },
        //   {
        //     $lookup: {
        //       from: "properties",
        //       localField: "property",
        //       foreignField: "_id",
        //       as: "property",
        //     },
        //   },
        //   { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
        //   {
        //     $project: {
        //       from: 1,
        //       description: 1,
        //       recipient: 1,
        //       notification_type: 1,
        //       other_details: 1,
        //       recipient_role: 1,
        //       created_at: 1,
        //       updated_at: 1,
        //     },
        //   },
        ],
      }
    );

    return {
      message: "successful",
      data: notifications,
    };
  } catch (error) {
    logger.error(error?.message);
    handleError(error);
  }
};
