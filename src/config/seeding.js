require("dotenv").config();
const mongoose = require("mongoose");
const { CollectionEnum } = require("../config/constants"); // Adjust path to your constants file
const { CreatorModel } = require("../creators/creators-model"); // Adjust path to your CreatorModel file

// MongoDB connection
const DATABASE_URL =
  "mongodb+srv://portgigcom:agWtZoEASCs2VugC@cluster0.nxdlncw.mongodb.net/portgig?retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seeding function to update profile_views
const seedProfileViews = async () => {
  try {
    // Update all creators' profile_views to the new structure
    const result = await CreatorModel.updateMany(
      {}, // Match all documents
      [
        {
          $set: {
            profile_views: {
              number: { $ifNull: ["$profile_views", 0] }, // Preserve existing number or default to 0
              last_viewed: null,
              view_history: [
                {
                  viewed_at: new Date(),
                  view_by: new mongoose.Types.ObjectId(
                    "68373e79de996b88e43c2a54"
                  ),
                  recipient_role: "recruiters",
                },
              ],
            },
          },
        },
      ]
    );

    console.log(
      `Updated ${result.modifiedCount} creator documents successfully`
    );
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run the seeding script
const runSeed = async () => {
  try {
    await connectDB();
    await seedProfileViews();
    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();
