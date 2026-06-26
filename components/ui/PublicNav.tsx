import Link from "next/link";
import Image from "next/image";

export default function PublicNav({ showCta = true }: { showCta?: boolean }) {
  return (
    <>
      {/* Spacer pushes content below fixed island — height matches top-4 + py-3 + logo */}
      <div style={{ height: "112px" }} aria-hidden="true" />
      <header className="fixed top-4 left-0 right-0 z-50 px-4 md:px-10 pointer-events-none">
        <nav className="liquid-glass relative flex items-center justify-between px-4 md:px-5 py-3 max-w-[1440px] mx-auto rounded-full pointer-events-auto">
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
              Get started
            </Link>
          )}
        </nav>
      </header>
    </>
  );
}
