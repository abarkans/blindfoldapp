import { NextResponse } from "next/server";
import { safeLogValue } from "@/lib/log";

// Receives Content-Security-Policy-Report-Only violation reports from
// browsers. Used to investigate which Turbopack runtime chunks still
// require 'unsafe-eval' so we can patch / replace them and eventually
// drop unsafe-eval from the enforced CSP.
//
// The report-uri spec sends "application/csp-report" with a small JSON
// envelope: { "csp-report": { ... } }. We log a flattened single-line
// JSON payload (Vercel-log greppable, easy to forward to Sentry/PostHog
// later via the same pattern as [ai-fallback]).
//
// In-memory throttle dedupes by directive+blockedUri so a single
// flooding chunk doesn't produce millions of log lines. The cache is
// per-instance and resets on cold start, which is fine — the goal is
// "did we ever see this violation in a reasonable window", not exact
// counting.

type CspReport = {
  "document-uri"?: string;
  "violated-directive"?: string;
  "effective-directive"?: string;
  "blocked-uri"?: string;
  "source-file"?: string;
  "line-number"?: number;
  "column-number"?: number;
  "script-sample"?: string;
};

const seen = new Map<string, number>();
const THROTTLE_MS = 60 * 1000; // 1 min

function shouldEmit(key: string): boolean {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < THROTTLE_MS) return false;
  seen.set(key, now);
  // Cap map growth.
  if (seen.size > 500) {
    const cutoff = now - THROTTLE_MS;
    for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
  }
  return true;
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }, { status: 204 });
  }

  const report =
    body && typeof body === "object" && "csp-report" in body
      ? ((body as { "csp-report": CspReport })["csp-report"])
      : null;

  if (!report) return NextResponse.json({ ok: true }, { status: 204 });

  const directive = report["effective-directive"] ?? report["violated-directive"] ?? "unknown";
  const blockedUri = report["blocked-uri"] ?? "unknown";
  const sourceFile = report["source-file"] ?? "unknown";
  const key = `${directive}|${blockedUri}|${sourceFile}`;

  if (shouldEmit(key)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[csp-report] ${JSON.stringify({
        directive: safeLogValue(directive),
        blockedUri: safeLogValue(blockedUri),
        sourceFile: safeLogValue(sourceFile),
        line: report["line-number"],
        column: report["column-number"],
        sample: safeLogValue(report["script-sample"] ?? ""),
        documentUri: safeLogValue(report["document-uri"] ?? ""),
      })}`,
    );
  }

  return NextResponse.json({ ok: true }, { status: 204 });
}
