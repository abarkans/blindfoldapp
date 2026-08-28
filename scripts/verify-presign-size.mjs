// Verifies that R2 actually ENFORCES the signed content-length on a presigned
// PUT. This is the one assumption in the F4 fix that cannot be confirmed by
// reading the SDK source — it depends on R2's SigV4 implementation.
//
//   node --env-file=.env.local scratchpad/verify-presign-size.mjs
//
// PASS = test 1 uploads, test 2 is rejected (403).
// FAIL = test 2 returns 200 → signed content-length is NOT enforced by R2,
//        layer 1 is cosmetic, and the orphan reaper is doing all the work.
//
// Writes one object under photos/_verify/ and deletes it on the way out.

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;
const KEY = `photos/_verify/${Date.now()}.jpg`;
const DECLARED = 100;

async function sign(size) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      ContentType: "image/jpeg",
      ContentLength: size,
    }),
    { expiresIn: 60, signableHeaders: new Set(["content-length", "content-type"]) }
  );
}

let failed = false;
try {
  // Test 1 — honest client: body size == declared size. Must succeed.
  const okUrl = await sign(DECLARED);
  const ok = await fetch(okUrl, {
    method: "PUT",
    body: new Uint8Array(DECLARED),
    headers: { "Content-Type": "image/jpeg" },
  });
  console.log(`test 1 (matching size)  -> ${ok.status} ${ok.ok ? "OK" : "UNEXPECTED"}`);
  if (!ok.ok) {
    console.log(await ok.text());
    console.log("\n>>> FAIL: legitimate uploads are being rejected. Do not ship layer 1.");
    failed = true;
  }

  // Test 2 — attacker: signed for 100 bytes, sends 5 MB. Must be rejected.
  const badUrl = await sign(DECLARED);
  const bad = await fetch(badUrl, {
    method: "PUT",
    body: new Uint8Array(5 * 1024 * 1024),
    headers: { "Content-Type": "image/jpeg" },
  });
  console.log(`test 2 (oversized body) -> ${bad.status} ${bad.ok ? "ACCEPTED" : "REJECTED"}`);

  if (bad.ok) {
    console.log("\n>>> FAIL: R2 accepted a 5 MB body against a 100-byte signature.");
    console.log(">>> Signed content-length is NOT enforced. Layer 1 gives no protection.");
    console.log(">>> Switch to a presigned POST policy with content-length-range,");
    console.log(">>> and treat the orphan reaper (layer 2) as the primary control.");
    failed = true;
  } else {
    console.log("\n>>> PASS: R2 enforces the signed content-length. Layer 1 holds.");
  }
} finally {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY })).catch(() => {});
  console.log(`cleaned up ${KEY}`);
}

process.exit(failed ? 1 : 0);
