"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

export default function PostHogIdentify({ userId }: { userId: string }) {
  const ph = usePostHog();

  useEffect(() => {
    ph?.identify(userId);
    return () => {
      ph?.reset();
    };
  }, [userId, ph]);

  return null;
}
