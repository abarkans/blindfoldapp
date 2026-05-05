"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { contactEmail } from "@/lib/email/templates/contact";
import { checkContactRateLimit } from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(254),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export async function submitContact(
  input: unknown,
): Promise<{ success: boolean; error?: string }> {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    await checkContactRateLimit(ip);
  } catch {
    return { success: false, error: "Too many messages. Please try again later." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, message } = parsed.data;

  const to = process.env.CONTACT_TO_EMAIL;
  if (!to) {
    console.error("[contact] CONTACT_TO_EMAIL env var not set");
    return { success: false, error: "Service temporarily unavailable. Please try again later." };
  }

  const { subject, html } = contactEmail({ name, email, message });

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    replyTo: email,
    subject,
    html,
  });

  if (error) {
    console.error(
      `[contact] send failed ip=${safeLogValue(ip)} err=${safeLogValue(error.message)}`,
    );
    return { success: false, error: "Failed to send message. Please try again." };
  }

  console.info(`[contact] sent ip=${safeLogValue(ip)} from=${safeLogValue(email)}`);
  return { success: true };
}
