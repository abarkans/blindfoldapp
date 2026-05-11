"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import PublicPageShell from "@/components/ui/PublicPageShell";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <PublicPageShell>
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <Link href="/" className="mb-10">
          <Image src="/logo.png" alt="BlindfoldDate" width={100} height={30} className="object-contain" />
        </Link>
        <div className="w-full max-w-sm rounded-3xl border border-white/16 bg-[#030303]/88 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-white/25 text-sm font-mono mb-3">500</p>
          <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-white/45 text-sm mb-8">
            An unexpected error occurred. Try again or go back home.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="h-11 flex-1 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-semibold text-white/60 transition-colors hover:border-white/28 hover:text-white"
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
