import sharp from "sharp";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const targets = [
  { src: "public/features/feat-1.jpg", width: 1200 },
  { src: "public/features/feat-2.jpg", width: 800 },
  { src: "public/features/feat-3.jpg", width: 800 },
  { src: "public/features/feat-4.jpg", width: 800 },
  { src: "public/features/feat-5.jpg", width: 1200 },
  { src: "public/features/feat-6.jpg", width: 1200 },
  { src: "public/blog/post_01.png", width: 1200 },
  { src: "public/blog/post_02.png", width: 1200 },
  { src: "public/blog/post_03.png", width: 1200 },
];

for (const t of targets) {
  const srcPath = path.join(root, t.src);
  if (!fs.existsSync(srcPath)) {
    console.log(`SKIP (not found): ${t.src}`);
    continue;
  }
  const before = fs.statSync(srcPath).size;

  // Output path — always .jpg
  const destRel = t.src.replace(/\.(jpg|jpeg|png)$/i, ".jpg");
  const destPath = path.join(root, destRel);

  // Write to temp first (avoid write-lock on same file)
  const tmpPath = path.join(os.tmpdir(), "opt_" + Date.now() + "_" + path.basename(destPath));

  await sharp(srcPath)
    .resize(t.width, null, { withoutEnlargement: true })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(tmpPath);

  const after = fs.statSync(tmpPath).size;

  // Rename (atomic on same volume; cross-volume = copy+delete)
  try {
    fs.renameSync(tmpPath, destPath);
  } catch {
    fs.copyFileSync(tmpPath, destPath);
    fs.unlinkSync(tmpPath);
  }

  // Remove original PNG if extension changed
  if (destRel !== t.src && fs.existsSync(srcPath)) {
    fs.unlinkSync(srcPath);
  }

  const label = destRel !== t.src ? `${t.src} -> ${destRel}` : path.basename(t.src);
  console.log(`${label}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB (${Math.round((1 - after / before) * 100)}% saved)`);
}
