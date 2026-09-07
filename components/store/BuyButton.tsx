"use client";

import { useState } from "react";

export default function BuyButton({
  productId,
  label,
  className,
}: {
  productId: string;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout failed. Please try again.");
        setLoading(false);
        return;
      }
      // Full navigation, not router.push — Stripe Checkout is a different origin.
      window.location.href = data.url;
    } catch {
      setError("Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 h-12 px-6 rounded-full bg-rose-500 hover:bg-rose-400 disabled:opacity-60 disabled:hover:bg-rose-500 text-white text-sm font-semibold transition-[background-color] duration-150"
      >
        {loading ? "Opening checkout…" : label}
      </button>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </div>
  );
}
