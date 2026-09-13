// Submits URLs to IndexNow (Bing, Yandex, Seznam, Naver, Yep — they share
// submissions). Google does not use IndexNow; use Search Console for Google.
//
//   node scripts/indexnow.mjs <url> [<url> ...]   submit specific pages
//   node scripts/indexnow.mjs --all               submit every URL in the live sitemap
//   add --dry-run to print what would be sent without sending it
//
// Run it after publishing new or changed content (a new blog post, a new page),
// not after every deploy — resubmitting unchanged URLs is noise.
//
// The key is public by design: IndexNow proves domain ownership by fetching
// public/<KEY>.txt from the site. It must be deployed BEFORE submitting, so the
// script checks the live key file first and refuses to send if it is missing.

const HOST = "blindfolddate.com";
const SITE_URL = `https://${HOST}`;
const KEY = "2fe26bbfb4756d703c254cab732be488";
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10_000; // IndexNow per-request limit

const MEANING = {
  200: "OK: URLs submitted.",
  202: "Accepted: URLs received, key validation pending.",
  400: "Bad request: invalid format.",
  403: "Forbidden: key not valid (key file missing or wrong).",
  422: "Unprocessable: URLs don't belong to the host, or key doesn't match.",
  429: "Too many requests: slow down and retry later.",
};

async function sitemapUrls() {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function keyFileIsLive() {
  const res = await fetch(KEY_LOCATION);
  const body = res.ok ? (await res.text()).trim() : "";
  return body === KEY;
}

// Returns an exit code instead of calling process.exit(): exiting while fetch
// sockets are still closing crashes Node on Windows (UV_HANDLE_CLOSING assert).
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const all = args.includes("--all");
  const explicit = args.filter((a) => !a.startsWith("--"));

  if (!all && explicit.length === 0) {
    console.error("usage: node scripts/indexnow.mjs <url> [<url> ...] | --all  [--dry-run]");
    return 1;
  }

  const urls = all ? await sitemapUrls() : explicit;

  // IndexNow rejects the whole request (422) if any URL is on another host.
  const offHost = urls.filter((u) => {
    try {
      return new URL(u).host !== HOST;
    } catch {
      return true;
    }
  });
  if (offHost.length > 0) {
    console.error(`Not on ${HOST} (or not absolute URLs):\n  ${offHost.join("\n  ")}`);
    return 1;
  }
  if (urls.length > MAX_URLS) {
    console.error(`${urls.length} URLs exceeds the IndexNow limit of ${MAX_URLS} per request.`);
    return 1;
  }

  console.log(`${urls.length} URL(s):\n  ${urls.join("\n  ")}`);

  if (dryRun) {
    console.log("\n--dry-run: nothing sent.");
    return 0;
  }

  if (!(await keyFileIsLive())) {
    console.error(`\nKey file not live at ${KEY_LOCATION}. Deploy public/${KEY}.txt first. Nothing sent.`);
    return 1;
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
  });

  console.log(`\nIndexNow responded ${res.status}. ${MEANING[res.status] ?? ""}`);
  if (res.status !== 200 && res.status !== 202) {
    const text = await res.text();
    if (text) console.log(text);
    return 1;
  }
  return 0;
}

try {
  process.exitCode = await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
