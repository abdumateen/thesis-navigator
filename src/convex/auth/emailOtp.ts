"use node";

import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

function generateOtp(): string {
  const random: RandomReader = {
    read(bytes: Uint8Array) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(random, "0123456789", 6);
}

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15,
  async generateVerificationToken() {
    return generateOtp();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = process.env.EMAIL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "EMAIL_API_KEY is not configured. Set it in the Convex dashboard " +
          "(or via `npx convex env set`) to enable email sign-in.",
      );
    }

    const url = process.env.EMAIL_API_URL ?? provider.from ?? "";
    if (!url) {
      throw new Error(
        "EMAIL_API_URL is not configured. Set it to your transactional " +
          "email provider's send endpoint.",
      );
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: email,
        subject: "Your Thesis Navigator verification code",
        text: `Your verification code is ${token}. It expires in 15 minutes.`,
        html: `<p>Your verification code is <strong>${token}</strong>.</p><p>It expires in 15 minutes.</p>`,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send verification email (HTTP ${response.status})`,
      );
    }
  },
});
