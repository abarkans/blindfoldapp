// Upload a purchasable file to R2 under the exact key the store expects.
// The key must match `r2Key` in lib/store/products.ts byte for byte, which is
// why this exists rather than a dashboard drag-and-drop: a stray prefix or a
// renamed file produces a 404 only AFTER someone has paid.
//
// Usage:
//   node scripts/upload-store-asset.mjs ./partner-a.pdf store/long-distance-playbook/partner-a.pdf
//   node scripts/upload-store-asset.mjs ./partner-a.pdf store/long-distance-playbook/partner-a.pdf --overwrite
//
// Key convention is `store/{product id}/{file}.ext` — see lib/store/products.ts.
//
// Refuses to clobber an existing key unless --overwrite is passed: overwriting
// is what silently swaps the file under everyone who already bought it.

import { readFileSync } from "fs";
import { basename, extname } from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const [filePath, key] = process.argv.slice(2);
const overwrite = process.argv.includes("--overwrite");

if (!filePath || !key || key.startsWith("-")) {
  console.error("Usage: node scripts/upload-store-asset.mjs <local-file> <r2-key> [--overwrite]");
  process.exit(1);
}

if (key.startsWith("photos/")) {
  // The daily orphan reaper lists Prefix "photos/" and deletes anything with no
  // matching date_photos row — a store asset parked there would vanish.
  console.error(`Refusing: keys under "photos/" are reaped by the daily cron. Use "store/...".`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()])
);

for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
  if (!env[name]) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
}

const CONTENT_TYPES = {
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
  ".zip": "application/zip",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
const contentType = CONTENT_TYPES[extname(key).toLowerCase()] ?? "application/octet-stream";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const body = readFileSync(filePath);

let exists = false;
try {
  await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  exists = true;
} catch {
  // 404 — key is free.
}

if (exists && !overwrite) {
  console.error(`Key already exists: ${key}\nPass --overwrite to replace it (this changes the file for everyone who already bought it).`);
  process.exit(1);
}

await r2.send(
  new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  })
);

console.log(`Uploaded ${basename(filePath)} → ${env.R2_BUCKET}/${key}`);
console.log(`  ${(body.length / 1024 / 1024).toFixed(2)} MB, ${contentType}${exists ? " (overwrote existing)" : ""}`);
