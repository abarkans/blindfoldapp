"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend, FROM_ADDRESS } from "@/lib/email/resend";
import { storeDownloadLinksEmail } from "@/lib/email/templates/store-download-links";
import { generateClaimToken } from "@/lib/store/claim-token";
import { getStoreProduct } from "@/lib/store/products";
import {
  checkStoreResendRateLimit,
  checkStoreResendTargetRateLimit,
} from "@/lib/rate-limit";
import { safeLogValue } from "@/lib/log";

/**
 * Public recovery for guest buyers: "email me my download links".
 *
 * Always resolves to { ok: true } whatever happens. Whether an address has
 * bought something is private — a different response for "no purchases" would
 * let anyone test who owns what, and the rate-limit branches below would leak
 * the same thing if they surfaced.
 *
 * Claim tokens are ROTATED rather than resent: only their SHA-256 hash is
 * stored (migration 070), so the original plaintext is unrecoverable by design.
 * A side effect worth knowing — a resend invalidates the links in the older
 * email. That is stated in the email copy, and it is the safer direction: an
 * old forwarded link stops working once the buyer asks for a fresh one.
 */
export async function requestDownloadLinks(rawEmail: string): Promise<{ ok: true }> {
  const parsed = z.string().email().max(254).safeParse(rawEmail.trim());
  if (!parsed.success) throw new Error("Invalid email address");
  const email = parsed.data.toLowerCase();

  const h = await headers();
  // Fail closed when no IP header is present: header-less callers share one
  // bucket rather than skipping the limiter. Resend is a paid resource.
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? h.get("x-real-ip")?.trim()
    ?? "unknown";
  await checkStoreResendRateLimit(ip);

  const admin = createAdminClient();
  const { data: purchases } = await admin
    .from("store_purchases")
    .select("id, product_id")
    .eq("email", email);

  if (!purchases?.length) return { ok: true };

  // Keyed on a hash, not the address itself: rate_limits rows are operational
  // data and shouldn't accumulate buyer email addresses.
  const emailHash = createHash("sha256").update(email).digest("hex").slice(0, 32);
  try {
    await checkStoreResendTargetRateLimit(emailHash);
  } catch {
    // Swallowed deliberately. This check runs after the purchase lookup, so
    // surfacing it would distinguish an address that has bought from one that
    // hasn't — exactly what the uniform return above exists to prevent.
    console.warn(`[audit] store-resend: target rate limit hit hash=${emailHash}`);
    return { ok: true };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://blindfolddate.com";
  const items: { productName: string; claimUrl: string }[] = [];

  for (const purchase of purchases) {
    const { raw, hash } = generateClaimToken();
    const { error } = await admin
      .from("store_purchases")
      .update({ claim_token_hash: hash })
      .eq("id", purchase.id);

    if (error) {
      // Skip this one rather than aborting: the other purchases in the same
      // request are still recoverable, and the old link for this row still works.
      console.error(`[audit] store-resend: token rotation failed purchase=${purchase.id}`);
      continue;
    }

    items.push({
      productName: getStoreProduct(purchase.product_id)?.name ?? purchase.product_id,
      claimUrl: `${appUrl}/api/store/claim?token=${raw}`,
    });
  }

  if (!items.length) return { ok: true };

  const { subject, html } = storeDownloadLinksEmail({ items });
  try {
    const { error } = await resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html });
    if (error) {
      console.error(`[audit] store-resend: CRITICAL send failed hash=${emailHash} msg=${safeLogValue(error.message)}`);
    }
  } catch (err) {
    console.error(`[audit] store-resend: CRITICAL send threw hash=${emailHash} err=${safeLogValue(err)}`);
  }

  return { ok: true };
}
