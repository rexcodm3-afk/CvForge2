import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { Resend } from "resend";

loadEnv({ path: ".env.local" });

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("RESEND_API_KEY is not set.");
  process.exit(1);
}

const resend = new Resend(apiKey);
const verificationCode = "123456";

async function main() {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: ["delivered@resend.dev"],
    subject: "Your CVForge verification code",
    html: `
      <h1>Verify your email</h1>
      <p>Your verification code is:</p>
      <p><strong>${verificationCode}</strong></p>
    `,
  });

  if (error) {
    console.error("Failed to send verification email:", error);
    process.exitCode = 1;
    return;
  }

  console.log("Verification email sent. Response ID:", data?.id);
}

main().catch((error) => {
  console.error("Failed to send verification email:", error);
  process.exitCode = 1;
});
