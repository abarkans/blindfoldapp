import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient } from "@/lib/supabase/admin";
import { r2, R2_BUCKET } from "@/lib/r2";
import type { StoreFile } from "@/lib/store/products";
import type { Database } from "@/lib/types";

export type StorePurchase = Database["public"]["Tables"]["store_purchases"]["Row"];

const DOWNLOAD_URL_TTL_SECONDS = 300;

export async function getPurchaseById(id: string): Promise<StorePurchase | null> {
  const { data } = await createAdminClient()
    .from("store_purchases")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data ?? null;
}

export async function getPurchaseByClaimHash(hash: string): Promise<StorePurchase | null> {
  const { data } = await createAdminClient()
    .from("store_purchases")
    .select("*")
    .eq("claim_token_hash", hash)
    .maybeSingle();
  return data ?? null;
}

export async function getPurchaseBySessionId(sessionId: string): Promise<StorePurchase | null> {
  const { data } = await createAdminClient()
    .from("store_purchases")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Everything a signed-in visitor owns: rows linked to their user ID, plus rows
 * bought as a guest under the same address. The email match is what lets someone
 * who bought before registering still see the file after signing up.
 */
export async function getPurchasesForAccount(
  userId: string,
  email: string | null | undefined,
): Promise<StorePurchase[]> {
  // Two .eq() queries merged client-side rather than one .or(): a PostgREST
  // `or` filter is a string grammar where commas, dots and parentheses are
  // syntax, so interpolating an email address into it puts user-controlled text
  // inside a parser. This is an entitlement lookup — not the place for that.
  const admin = createAdminClient();
  const byUser = admin.from("store_purchases").select("*").eq("user_id", userId);
  const byEmail = email
    ? admin.from("store_purchases").select("*").eq("email", email.trim().toLowerCase())
    : null;

  const [userRows, emailRows] = await Promise.all([byUser, byEmail]);

  const merged = new Map<string, StorePurchase>();
  for (const row of userRows.data ?? []) merged.set(row.id, row);
  for (const row of emailRows?.data ?? []) merged.set(row.id, row);

  return [...merged.values()].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
  );
}

/**
 * Presigned R2 GET for the deliverable.
 *
 * Signed URL rather than streaming the object through the function (the
 * approach /api/photo/view takes for thumbnails): a multi-MB PDF proxied through
 * compute costs CPU and memory for nothing, and R2 serves it directly just as
 * safely. ResponseContentDisposition forces a download instead of an inline
 * PDF viewer, and preserves the product's real filename rather than the R2 key.
 *
 * The URL is a bearer credential for its TTL — 5 minutes is enough to start a
 * download on a slow connection and short enough that a copied link is dead
 * before it can be shared usefully.
 */
export async function presignDownloadUrl(file: StoreFile): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: file.r2Key,
      ResponseContentType: file.contentType,
      ResponseContentDisposition: `attachment; filename="${file.fileName}"`,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS }
  );
}

/** Best-effort download telemetry. Never blocks the download on a failed write. */
export async function recordDownload(purchase: StorePurchase): Promise<void> {
  const { error } = await createAdminClient()
    .from("store_purchases")
    .update({
      download_count: purchase.download_count + 1,
      last_downloaded_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);
  if (error) console.error(`[store/download] counter update failed purchase=${purchase.id}`);
}
