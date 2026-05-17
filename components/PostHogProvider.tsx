"use client";

import { useEffect, Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PostHog } from "posthog-js";
import type { PostHogProvider as PHProviderType } from "posthog-js/react";

// Type-only — no runtime cost. Real modules loaded lazily via dynamic import below.

function PageViewTracker({ ph }: { ph: PostHog }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    ph.capture("$pageview", { $current_url: window.location.pathname });
  }, [pathname, searchParams, ph]);

  return null;
}

type PHProviderComponent = typeof PHProviderType;

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState<{ Provider: PHProviderComponent; ph: PostHog } | null>(null);

  useEffect(() => {
    const init = async () => {
      const [{ default: posthog }, { PostHogProvider: PHProvider }] = await Promise.all([
        import("posthog-js"),
        import("posthog-js/react"),
      ]);

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        ui_host: "https://eu.posthog.com",
        persistence: "memory",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        loaded: (instance) => {
          if (process.env.NODE_ENV === "production") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (instance as any).set_config({ disable_toolbar: true });
          }
        },
      });

      setReady({ Provider: PHProvider, ph: posthog });
    };

    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(init);
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(init, 1000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <>{children}</>;

  const { Provider, ph } = ready;
  return (
    <Provider client={ph}>
      <Suspense fallback={null}>
        <PageViewTracker ph={ph} />
      </Suspense>
      {children}
    </Provider>
  );
}
