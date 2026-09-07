"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * "Is someone signed in?" for marketing pages, without paying for an auth
 * round trip on the server.
 *
 * proxy.ts deliberately skips supabase.auth.getUser() on public routes to keep
 * their TTFB low, so the nav cannot learn this during SSR. Instead:
 *
 *   1. `initial` comes from the onboarding_complete cookie, which a Server
 *      Component can read for free. That is what renders on the first paint,
 *      so a signed-in visitor does not see "Get started" flash first.
 *   2. On mount we confirm against the real session. A stale cookie (signed out
 *      elsewhere, expired refresh token) corrects itself here, and a session
 *      with no cookie yet writes one for next time.
 *
 * The cookie is a UI hint only — it grants nothing. Every protected route still
 * checks the session server-side, so forging it changes which button is drawn
 * and nothing else.
 */
export function useLoggedIn(initial = false): boolean {
  const [isLoggedIn, setIsLoggedIn] = useState(initial);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        return;
      }
      if (!session) {
        setIsLoggedIn(false);
        return;
      }

      if (document.cookie.includes("onboarding_complete=1")) {
        setIsLoggedIn(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .single();

      if (profile?.onboarding_complete) {
        const secure = location.protocol === "https:" ? "; secure" : "";
        document.cookie = `onboarding_complete=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${secure}`;
        setIsLoggedIn(true);
      }
    })();
  }, []);

  return isLoggedIn;
}

/** Cookie name a Server Component reads to seed `initial`. */
export const LOGGED_IN_HINT_COOKIE = "onboarding_complete";
