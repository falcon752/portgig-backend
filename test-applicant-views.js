require("dotenv").config({ path: "./.env.local" });
const mongoose = require("mongoose");
const { CollectionEnum, ApplicantStatus } = require("./src/config/constants");

const DATABASE_URL = process.env.DATABASE_URL;

// Inline minimal Job model to avoid side-effects from full app bootstrap
const JobSchema = new mongoose.Schema({
  recruiter_id: mongoose.Schema.Types.ObjectId,
  title: String,
  applicants: [
    {
      creator_id: mongoose.Schema.Types.ObjectId,
      status: String,
      views: { type: Number, default: 0 },
      cover_letter: String,
      application_date: Date,
    },
  ],
  status: String,
});
const JobModel =
  mongoose.models[CollectionEnum.JOB] ||
  mongoose.model(CollectionEnum.JOB, JobSchema);

async function run() {
  await mongoose.connect(DATABASE_URL, { useNewUrlParser: true });
  console.log("✅ Connected to MongoDB\n");

  // ── 1. Find any job that has at least one applicant ──────────────────────
  const job = await JobModel.findOne({ "applicants.0": { $exists: true } }).lean();
  if (!job) {
    console.log("⚠️  No jobs with applicants found in DB. Seed one first.");
    process.exit(1);
  }

  const jobId = job._id;
  const jobTitle = job.title;
  const recruiterId = job.recruiter_id;

  console.log(`Job      : "${jobTitle}" (${jobId})`);
  console.log(`Recruiter: ${recruiterId}`);
  console.log(`Applicants: ${job.applicants.length}\n`);

  // ── 2. Capture views BEFORE ───────────────────────────────────────────────
  const before = job.applicants.map((a) => ({
    creator_id: a.creator_id,
    views: a.views ?? 0,
  }));
  console.log("Views BEFORE:");
  before.forEach((a) => console.log(`  ${a.creator_id}: ${a.views}`));

  // ── 3. Simulate exactly what getJobs() now does ───────────────────────────
  //    matchStage built from recruiter_id + title (same as frontend sends)
  const matchStage = {
    recruiter_id: new mongoose.Types.ObjectId(recruiterId),
    title: { $regex: jobTitle, $options: "i" },
  };

  const jobToTrack = await JobModel.findOne(matchStage);
  if (jobToTrack) {
    await JobModel.updateMany(
      { _id: jobToTrack._id },
      { $inc: { "applicants.$[].views": 1 } }
    );
    console.log("\n✅ updateMany executed successfully");
  } else {
    console.log("\n❌ jobToTrack not found — matchStage did not match any job");
    process.exit(1);
  }

  // ── 4. Capture views AFTER ────────────────────────────────────────────────
  const updated = await JobModel.findById(jobId).lean();
  const after = updated.applicants.map((a) => ({
    creator_id: a.creator_id,
    views: a.views ?? 0,
  }));

  console.log("\nViews AFTER:");
  after.forEach((a) => console.log(`  ${a.creator_id}: ${a.views}`));

  // ── 5. Verify each applicant's views incremented by exactly 1 ─────────────
  let allPassed = true;
  before.forEach((b, i) => {
    const expected = b.views + 1;
    const actual = after[i].views;
    const ok = actual === expected;
    if (!ok) allPassed = false;
    console.log(
      `  ${ok ? "✅" : "❌"} ${b.creator_id}: ${b.views} → ${actual} (expected ${expected})`
    );
  });

  console.log(
    `\n${allPassed ? "✅ PASS — all applicant views incremented correctly" : "❌ FAIL — some views did not increment"}`
  );

  // ── 6. Rollback — restore original view counts ───────────────────────────
  for (const b of before) {
    await JobModel.updateOne(
      { _id: jobId, "applicants.creator_id": b.creator_id },
      { $set: { "applicants.$.views": b.views } }
    );
  }
  console.log("↩️  Views rolled back to original values");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
