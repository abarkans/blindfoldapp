"use client";

import { useState } from "react";

export default function DownloadButton({
  purchaseId,
  fileId,
  label = "Download",
}: {
  purchaseId: string;
  fileId: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/store/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId, fileId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Download failed. Please try again.");
        setLoading(false);
        return;
      }
      // The presigned URL carries Content-Disposition: attachment, so assigning
      // location starts the download without navigating away from this page.
      window.location.href = data.url;
      setLoading(false);
    } catch {
      setError("Download failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full bg-rose-500 hover:bg-rose-400 disabled:opacity-60 disabled:hover:bg-rose-500 text-white text-sm font-semibold transition-[background-color] duration-150"
      >
        {loading ? "Preparing…" : label}
      </button>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
