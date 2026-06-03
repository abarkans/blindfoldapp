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
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

    const init = async () => {
      const [{ default: posthog }, { PostHogProvider: PHProvider }] = await Promise.all([
        import("posthog-js"),
        import("posthog-js/react"),
      ]);

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: "/ingest",
        ui_host: "https://eu.posthog.com",
        persistence: "memory",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: true,
        capture_performance: true,
        session_recording: {
          maskAllInputs: true,
          maskTextSelector: "[data-ph-mask]",
          maskCapturedNetworkRequestFn: (request) => {
            if (request.name?.includes("/api/place-photo")) return null;
            return request;
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ disable_toolbar: true } as any),
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
