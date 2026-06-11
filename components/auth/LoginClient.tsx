"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PublicPageShell from "@/components/ui/PublicPageShell";
import CaptchaWidget, { type TurnstileInstance } from "@/components/auth/CaptchaWidget";
import CapacitorBackButton from "@/components/ui/CapacitorBackButton"
import CapacitorOAuthHandler from "@/components/auth/CapacitorOAuthHandler";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteParam = searchParams.get("invite");
  const ph = usePostHog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    ph?.capture("login_page_viewed");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaActive, setCaptchaActive] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  function resetCaptcha() {
    setCaptchaToken("");
    turnstileRef.current?.reset();
  }

  async function onSubmit(values: LoginFormData) {
    if (!captchaToken) {
      setError("Security check still loading. Please try again in a moment.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
      options: { captchaToken },
    });

    if (signInError) {
      setError(
        /captcha/i.test(signInError.message)
          ? "Security check expired. Please try again."
          : signInError.message
      );
      setLoading(false);
      resetCaptcha();
      return;
    }

    router.replace(inviteParam ? `/partner-invite?token=${encodeURIComponent(inviteParam)}` : "/dashboard");
  }

  async function handleGoogle() {
    const supabase = createClient();
    if ((window as any).Capacitor) {
      const { Browser } = await import('@capacitor/browser')
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.blindfolddate.app://login-callback',
          skipBrowserRedirect: true,
        },
      })
      if (data.url) await Browser.open({ url: data.url })
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: inviteParam
            ? `${window.location.origin}/auth/callback?next=/partner-invite&invite=${encodeURIComponent(inviteParam)}`
            : `${window.location.origin}/auth/callback`,
        },
      });
    }
  }

  return (
    <PublicPageShell>
    <CapacitorOAuthHandler />
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <CapacitorBackButton />
        {/* Logo */}
        <Link href="/" prefetch={true} className="flex flex-col items-center gap-3 mb-8 group">
          <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
          <div className="text-center">
            <p className="text-white/40 text-sm">Your dates, handled</p>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white/[0.035] border border-white/16 rounded-3xl p-6 backdrop-blur-xl shadow-[0_28px_80px_rgba(0,0,0,0.45)]" onFocus={() => setCaptchaActive(true)} onPointerDown={() => setCaptchaActive(true)}>
          <h2 className="text-lg font-bold text-white mb-5">Welcome back</h2>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full mb-5 bg-white text-gray-900 hover:bg-gray-50 border-transparent hover:border-transparent"
            onClick={handleGoogle}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 border-t border-white/16" />
            <span className="text-xs text-white/30">or sign in with email</span>
            <div className="flex-1 border-t border-white/16" />
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
              {/invalid|credentials|password|not found/i.test(error)
                ? "Incorrect email or password."
                : error}
              {/invalid|credentials|password|not found/i.test(error) && (
                <span className="block mt-1 text-xs text-red-300/70">
                  <Link href="/forgot-password" className="underline hover:text-red-200">Reset password</Link>
                  {" · "}
                  <Link href="/register" className="underline hover:text-red-200">Create account</Link>
                </span>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register("password")}
              />
              <div className="flex justify-end mt-1.5">
                <Link href="/forgot-password" className="text-xs text-white/40 hover:text-white/70 transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
              Sign In
            </Button>
          </form>

          {captchaActive && (
            <div className="mt-5">
              <CaptchaWidget
                ref={turnstileRef}
                onToken={setCaptchaToken}
                onClear={() => setCaptchaToken("")}
              />
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          No account?{" "}
          <Link href="/register" className="text-rose-400 hover:text-rose-300 font-semibold">
            Create one
          </Link>
        </p>
      </div>
    </div>
    </PublicPageShell>
  );
}
