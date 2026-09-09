// One definition for the primary section CTAs on the landing page — the buttons
// that close the Memories, Pricing and Printables sections. They had drifted
// into three different sizes (py-4 + text-xl, py-4 md:py-5 + md:px-20, and
// h-14 + text-base), which reads as sloppiness when you scroll past them in a
// row.
//
// Fixed height rather than vertical padding so the size cannot shift with the
// font, and full width on mobile where a centred pill looks stranded.
//
// Not for the hero or the final CTA: those are deliberately larger.
export const LANDING_CTA =
  "inline-flex w-full sm:w-auto items-center justify-center gap-2 h-14 md:h-16 px-10 rounded-full bg-rose-500 hover:bg-rose-400 text-white text-base md:text-lg font-bold shadow-lg shadow-rose-500/20 transition-[background-color] duration-150";
