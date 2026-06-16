import Link from "next/link";
import Image from "next/image";
import PublicPageShell from "@/components/ui/PublicPageShell";

export default function NotFound() {
  return (
    <PublicPageShell>
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <Link href="/" className="mb-10">
          <Image src="/logo.png" alt="BlindfoldDate" width={160} height={48} className="object-contain" />
        </Link>
        <div className="w-full max-w-sm rounded-3xl border border-white/16 bg-[#030303]/88 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-white/25 text-sm font-mono mb-3">404</p>
          <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-white/45 text-sm mb-8">
            This page doesn&apos;t exist - maybe the URL changed or the link is broken.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-400"
          >
            Go home
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
