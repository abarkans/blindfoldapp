import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function PublicNav({ showCta = true }: { showCta?: boolean }) {
  return (
    <>
    {/* Spacer pushes content below fixed island — height matches top-4 + py-3 + logo */}
    <div style={{ height: "112px" }} aria-hidden="true" />
    <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-10 pointer-events-none">
      <nav className="relative flex items-center justify-between px-6 md:px-8 py-3 max-w-[1440px] mx-auto rounded-full pointer-events-auto bg-black/90 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_40px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.055] to-transparent pointer-events-none" />
        <Link href="/" className="relative flex items-center group">
          <Image
            src="/logo.png"
            alt="BlindfoldDate"
            width={180}
            height={44}
            className="object-contain group-hover:opacity-75 transition-opacity"
          />
        </Link>
        {showCta && (
          <Link
            href="/register"
            className="relative inline-flex items-center gap-2 text-sm text-white font-semibold bg-rose-500 hover:bg-rose-400 px-5 h-10 rounded-full transition-[background-color] duration-150"
          >
            Get started free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </nav>
    </header>
    </>
  );
}
