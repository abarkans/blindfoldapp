"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#0d0d14] px-6 text-center">
      <Link href="/" className="mb-10">
        <Image src="/logo.png" alt="BlindfoldDate" width={100} height={30} className="object-contain" />
      </Link>
      <p className="text-white/20 text-sm font-mono mb-3">500</p>
      <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="text-white/45 text-sm mb-8 max-w-xs">
        An unexpected error occurred. Try again or go back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 transition-colors text-white text-sm font-medium"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-2xl border border-white/10 hover:border-white/20 transition-colors text-white/60 hover:text-white text-sm font-medium"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
