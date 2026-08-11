import Image from "next/image";
import Link from "next/link";

export default function BlogPromoBanner() {
  return (
    <div className="w-full relative overflow-hidden border border-white/10 bg-black rounded-3xl flex flex-col md:flex-row items-center">
      <div
        className="absolute inset-0 opacity-35 blur-2xl"
        style={{ background: "radial-gradient(circle at 20% 20%, #8b5cf6, transparent 55%), radial-gradient(circle at 80% 60%, #fb7185, transparent 50%), radial-gradient(circle at 40% 90%, #c026d3, transparent 45%)" }}
      />
      <div className="relative flex-1 p-8 md:p-12">
        <p className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
          Your next date. <span className="text-rose-400">Planned free.</span>
        </p>
        <p className="text-white/50 text-base mb-6 max-w-md">
          Tell us your interests once. We find a real venue nearby and plan everything. You just show up.
        </p>
        <div className="inline-flex flex-col items-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-3 rounded-full transition-colors"
          >
            Get started FREE now
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>
          <p className="text-xs text-white/60 mt-3">No card required.</p>
        </div>
      </div>
      <div className="relative hidden md:block w-[280px] shrink-0 self-stretch">
        <Image
          src="/couple_banner.png"
          alt=""
          fill
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
