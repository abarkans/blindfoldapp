// Single source for the marketing navigation. Shared by the landing page nav
// (components/landing-v4/LandingV4Client.tsx) and the nav on every other public
// page (components/ui/PublicNav.tsx) so the two cannot drift apart — adding a
// section or a product page means editing one array.
//
// Anchors are stored bare ("#plans"). The landing page uses them as-is because
// the sections are on that page; PublicNav routes them through publicNavHref()
// to get "/#plans", which navigates home and then scrolls.
export const NAV_LINKS: { label: string; href: string; scroll?: boolean }[] = [
  { label: "Benefits", href: "#benefits" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#plans" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
  { label: "Store", href: "/store" },
];

/** Rewrite a landing-page anchor into a link that works from any other route. */
export function publicNavHref(href: string): string {
  return href.startsWith("#") ? `/${href}` : href;
}
