/**
 * Password Reset Flow Test Script
 * Tests both Creator and Recruiter flows against the production API.
 *
 * Usage:
 *   node test-password-reset.js
 *
 * For the full end-to-end OTP test, set these env vars:
 *   CREATOR_TEST_EMAIL=<email of an existing creator account>
 *   RECRUITER_TEST_EMAIL=<email of an existing recruiter account>
 *
 * The OTP step is interactive: the script pauses and asks you to enter the OTP
 * sent to the email so you can complete the full flow.
 */

const readline = require("readline");

const BASE = "https://api.portgig.com/api/v1";

// ─── Colours ──────────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};
const pass = `${c.green}✓ PASS${c.reset}`;
const fail = `${c.red}✗ FAIL${c.reset}`;
const skip = `${c.yellow}– SKIP${c.reset}`;

// ─── Counters ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function assert(label, actual, expected, detail = "") {
  const ok = typeof expected === "function" ? expected(actual) : actual === expected;
  if (ok) {
    console.log(`  ${pass}  ${label}`);
    passed++;
  } else {
    console.log(`  ${fail}  ${label}`);
    if (detail) console.log(`         ${c.yellow}${detail}${c.reset}`);
    console.log(`         expected: ${JSON.stringify(expected)}`);
    console.log(`         received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

function header(title) {
  console.log(`\n${c.bold}${c.cyan}══ ${title} ══${c.reset}`);
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

async function testValidation(userType) {
  const path = `/${userType}/request-password-reset`;
  const resetPath = `/${userType}/reset-password`;

  header(`${userType.toUpperCase()} — Validation tests`);

  // 1. Missing type field
  let r = await request("PUT", path, { email: "test@example.com" });
  assert("Missing 'type' → 400", r.status, 400);

  // 2. Missing email field
  r = await request("PUT", path, { type: "EMAIL" });
  assert("Missing 'email' → 400", r.status, 400);

  // 3. Invalid email format
  r = await request("PUT", path, { type: "EMAIL", email: "not-an-email" });
  assert("Invalid email format → 400", r.status, 400);

  // 4. Non-existent email
  r = await request("PUT", path, { type: "EMAIL", email: "definitely.not.a.real.user.xyzzy@portgig.com" });
  assert("Non-existent email → 400", r.status, 400);
  assert("Non-existent email → message present", typeof r.data.message, "string");

  // 5. reset-password — missing all fields
  r = await request("PUT", resetPath, {});
  assert("reset: missing all fields → 400", r.status, 400);

  // 6. reset-password — missing token
  r = await request("PUT", resetPath, { email: "test@portgig.com", password: "Test@1234!" });
  assert("reset: missing token → 400", r.status, 400);

  // 7. reset-password — missing password
  r = await request("PUT", resetPath, { email: "test@portgig.com", token: "123456" });
  assert("reset: missing password → 400", r.status, 400);

  // 8. reset-password — weak password (no uppercase/special char)
  r = await request("PUT", resetPath, { email: "test@portgig.com", password: "weakpassword", token: "123456" });
  assert("reset: weak password → 400", r.status, 400);

  // 9. reset-password — wrong token for real-looking email
  r = await request("PUT", resetPath, { email: "definitely.not.a.real.user.xyzzy@portgig.com", password: "Test@12345!", token: "000000" });
  assert("reset: wrong email+token → 400", r.status, 400);
}

async function testEndToEnd(userType, email) {
  if (!email) {
    console.log(`  ${skip}  No test email provided for ${userType} — skipping E2E`);
    skipped++;
    return;
  }

  const requestPath = `/${userType}/request-password-reset`;
  const resetPath = `/${userType}/reset-password`;

  header(`${userType.toUpperCase()} — End-to-End flow (${email})`);

  // Step 1 — Request OTP
  console.log(`\n  ${c.cyan}Step 1: Requesting OTP...${c.reset}`);
  const r1 = await request("PUT", requestPath, { type: "EMAIL", email });
  assert("Request OTP → 200", r1.status, 200);
  assert("Response has message", typeof r1.data.message, "string");
  if (r1.status !== 200) {
    console.log(`  ${c.red}Cannot continue E2E — OTP request failed: ${r1.data.message}${c.reset}`);
    return;
  }
  console.log(`  ${c.green}  OTP email sent to ${email}${c.reset}`);

  // Step 2 — Enter OTP
  const otp = await prompt(`\n  ${c.yellow}Enter the 6-digit OTP you received at ${email}: ${c.reset}`);
  if (!otp || otp.length !== 6 || isNaN(Number(otp))) {
    console.log(`  ${fail}  OTP format invalid — must be exactly 6 digits`);
    failed++;
    return;
  }
  assert("OTP is 6 digits", otp.length === 6, true);

  // Step 3 — Wrong token test (same user, deliberate wrong token)
  console.log(`\n  ${c.cyan}Step 3a: Testing wrong token rejection...${c.reset}`);
  const r2 = await request("PUT", resetPath, { email, password: "Test@12345!", token: "000000" });
  assert("Wrong token → 400", r2.status, 400);

  // Step 4 — Reset password with correct OTP
  console.log(`\n  ${c.cyan}Step 3b: Resetting password with correct OTP...${c.reset}`);
  const newPassword = "TestReset@9876!";
  const r3 = await request("PUT", resetPath, { email, password: newPassword, token: otp });
  assert("Reset password → 200", r3.status, 200);
  assert("Reset response message", typeof r3.data.message, "string");
  if (r3.status === 200) {
    console.log(`  ${c.green}  Password reset successful!${c.reset}`);
  } else {
    console.log(`  ${c.red}  Reset failed: ${r3.data.message}${c.reset}`);
    return;
  }

  // Step 5 — Confirm OTP can't be reused
  console.log(`\n  ${c.cyan}Step 4: Verifying OTP cannot be reused...${c.reset}`);
  const r4 = await request("PUT", resetPath, { email, password: "AnotherPass@111!", token: otp });
  assert("Reusing OTP → 400 (token expired/invalid)", r4.status, 400);

  // Step 6 — Confirm same password can't be reused
  console.log(`\n  ${c.cyan}Step 5: Requesting another OTP to test password reuse...${c.reset}`);
  const r5 = await request("PUT", requestPath, { type: "EMAIL", email });
  if (r5.status === 200) {
    const otp2 = await prompt(`  Enter the new OTP sent to ${email}: `);
    if (otp2 && otp2.length === 6) {
      const r6 = await request("PUT", resetPath, { email, password: newPassword, token: otp2 });
      assert("Reuse same password → 400", r6.status, 400);
      assert("Reuse message mentions password", r6.data.message, (m) => typeof m === "string");
    } else {
      console.log(`  ${skip}  Skipping password-reuse test (no OTP entered)`);
      skipped++;
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n${c.bold}${c.cyan}╔══════════════════════════════════════════════════╗`);
  console.log(`║      Portgig Password Reset — API Test Suite     ║`);
  console.log(`╚══════════════════════════════════════════════════╝${c.reset}`);
  console.log(`  Target: ${c.yellow}${BASE}${c.reset}`);

  const creatorEmail = process.env.CREATOR_TEST_EMAIL || null;
  const recruiterEmail = process.env.RECRUITER_TEST_EMAIL || null;

  // ── Validation tests (no real account needed) ─────────────────────────────
  await testValidation("creator");
  await testValidation("recruiter");

  // ── End-to-end tests (real account + OTP required) ────────────────────────
  if (!creatorEmail && !recruiterEmail) {
    console.log(`\n${c.yellow}ℹ  E2E tests skipped.`);
    console.log(`   To run full end-to-end tests, re-run with real account emails:`);
    console.log(`   CREATOR_TEST_EMAIL=you@example.com RECRUITER_TEST_EMAIL=hr@example.com node test-password-reset.js${c.reset}`);
  } else {
    await testEndToEnd("creator", creatorEmail);
    await testEndToEnd("recruiter", recruiterEmail);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = passed + failed + skipped;
  console.log(`\n${c.bold}──────────────────────────────────────────────────`);
  console.log(`  Results: ${total} tests`);
  console.log(`  ${c.green}${passed} passed${c.reset}  |  ${c.red}${failed} failed${c.reset}  |  ${c.yellow}${skipped} skipped${c.reset}`);
  console.log(`──────────────────────────────────────────────────${c.reset}\n`);

  process.exit(failed > 0 ? 1 : 0);
})();
