import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { unitSystemForCountry } from "@/lib/units";
import { UNIT_SYSTEM_COOKIE } from "@/lib/get-unit-system";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;


  // First-visit unit-system detection from Vercel geo header.
  // Push into request.cookies immediately so this-request RSCs see it,
  // then write to whatever response we end up returning.
  let pendingUnitCookie: string | null = null;
  if (!request.cookies.get(UNIT_SYSTEM_COOKIE)) {
    const country = request.headers.get("x-vercel-ip-country");
    const system = unitSystemForCountry(country);
    request.cookies.set(UNIT_SYSTEM_COOKIE, system);
    pendingUnitCookie = system;
  }
  const applyUnitCookie = (res: NextResponse) => {
    if (pendingUnitCookie) {
      res.cookies.set(UNIT_SYSTEM_COOKIE, pendingUnitCookie, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return res;
  };

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: calling getUser() here is what triggers the session token refresh.
  // Do not add any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated → protected routes → send to login
  if (!user && (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding"))) {
    return applyUnitCookie(NextResponse.redirect(new URL("/login", request.url)));
  }

  // Authenticated → auth pages → send to dashboard only if onboarding is done.
  // Users with incomplete onboarding can visit /login and /register freely
  // (e.g. to switch accounts or after navigating back from the landing page).
  if (user && (pathname === "/login" || pathname === "/register")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_complete) {
      return applyUnitCookie(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
  }

  return applyUnitCookie(supabaseResponse);
}

export const proxyConfig = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
