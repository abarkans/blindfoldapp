import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog/page/${page}`;
}

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-16 pt-6 border-t border-white/10 flex items-center justify-center gap-2">
      <Link
        href={pageHref(currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={`flex items-center justify-center w-9 h-9 rounded-full text-sm transition-colors ${
          currentPage <= 1
            ? "text-white/15 pointer-events-none"
            : "text-white/50 hover:text-white hover:bg-white/5"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {pages.map((page) => (
        <Link
          key={page}
          href={pageHref(page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors ${
            page === currentPage
              ? "bg-rose-500 text-white"
              : "text-white/50 hover:text-white hover:bg-white/5"
          }`}
        >
          {page}
        </Link>
      ))}

      <Link
        href={pageHref(currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={`flex items-center justify-center w-9 h-9 rounded-full text-sm transition-colors ${
          currentPage >= totalPages
            ? "text-white/15 pointer-events-none"
            : "text-white/50 hover:text-white hover:bg-white/5"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}
