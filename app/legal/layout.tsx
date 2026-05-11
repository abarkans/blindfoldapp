import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import PublicPageShell from "@/components/ui/PublicPageShell";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicPageShell>
    <div className="min-h-dvh px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="BlindfoldDate" width={96} height={28} className="object-contain" />
          </Link>
        </div>
      </div>

      <article>
      <div className="prose prose-invert prose-sm max-w-none
        [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-1
        [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-2
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white/80 [&_h3]:mt-5 [&_h3]:mb-1.5
        [&_p]:text-white/55 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3
        [&_ul]:text-white/55 [&_ul]:text-sm [&_ul]:leading-relaxed [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc
        [&_li]:mb-1
        [&_a]:text-rose-400 [&_a]:underline [&_a]:hover:text-rose-300
        [&_strong]:text-white/80 [&_strong]:font-semibold
        [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
        [&_th]:text-left [&_th]:text-white/60 [&_th]:font-medium [&_th]:border-b [&_th]:border-white/10 [&_th]:pb-2 [&_th]:pr-4
        [&_td]:text-white/45 [&_td]:border-b [&_td]:border-white/5 [&_td]:py-2 [&_td]:pr-4
        [&_hr]:border-white/10 [&_hr]:my-8">
        {children}
      </div>
      </article>

      <div className="mt-8 pt-6 border-t border-white/16 flex gap-6 text-xs text-white/35">
        <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
        <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
      </div>
    </div>
    </PublicPageShell>
  );
}
