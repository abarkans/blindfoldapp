import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/onboarding", "/api/", "/account", "/unsubscribe", "/partner-invite"],
      },
    ],
    sitemap: "https://blindfolddate.com/sitemap.xml",
  };
}
