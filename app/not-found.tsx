import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-[#0d0d14] px-6 text-center">
      <Link href="/" className="mb-10">
        <Image src="/logo.png" alt="BlindfoldDate" width={100} height={30} className="object-contain" />
      </Link>
      <p className="text-white/20 text-sm font-mono mb-3">404</p>
      <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
      <p className="text-white/45 text-sm mb-8 max-w-xs">
        This page doesn&apos;t exist — maybe the URL changed or the link is broken.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 transition-colors text-white text-sm font-medium"
      >
        Go home
      </Link>
    </div>
  );
}
