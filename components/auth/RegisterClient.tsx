"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { isDisposableEmail } from "@/lib/utils/disposable-emails";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PasswordStrength from "@/components/ui/PasswordStrength";
import CaptchaWidget, { type TurnstileInstance } from "@/components/auth/CaptchaWidget";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function ConsentText() {
  return (
    <p className="text-xs text-white/35 text-center leading-relaxed mt-5 pt-4 border-t border-white/[0.06]">
      By continuing you confirm you are 18+ and agree to our{" "}
      <Link
        href="/legal/terms"
        target="_blank"
        className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
      >
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link
        href="/legal/privacy"
        target="_blank"
        className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
      >
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const emailStep = searchParams.get("step") === "email";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaActive, setCaptchaActive] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useEffect(() => {
    if (!emailStep) setError("");
  }, [emailStep]);

  function resetCaptcha() {
    setCaptchaToken("");
    turnstileRef.current?.reset();
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormData) {
    if (!captchaToken) {
      setError("Security check still loading — please try again in a moment.");
      return;
    }
    setLoading(true);
    setError("");

    if (isDisposableEmail(values.email)) {
      setError("Disposable email addresses are not allowed. Please use a real email.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding${planParam === "free" || planParam === "subscription" ? `&plan=${planParam}` : ""}`,
        captchaToken,
        // Server-side trigger validate_user_signup() reads these and
        // rejects the insert if either flag is missing or false.
        data: {
          age_confirmed: true,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    });

    if (signUpError) {
      setError(
        /captcha/i.test(signUpError.message)
          ? "Security check expired — please try again."
          : signUpError.message
      );
      setLoading(false);
      resetCaptcha();
      return;
    }

    // Supabase returns an empty identities array when the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      setError("User already registered");
      setLoading(false);
      resetCaptcha();
      return;
    }

    // Don't redirect yet — Supabase requires email confirmation before the
    // session is active. Show a holding screen; the auth callback handles
    // the final redirect once the user clicks the confirmation link.
    resetCaptcha();
    setEmailSent(values.email);
    setLoading(false);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    if (!captchaToken) {
      setError("Security check still loading — please try again in a moment.");
      return;
    }
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email: emailSent, options: { captchaToken } });
    resetCaptcha();
    setResending(false);
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
  }

  async function handleGoogle() {
    setError("");
    const supabase = createClient();
    if ((window as any).Capacitor) {
      const { Browser } = await import('@capacitor/browser');
      // Store plan so CapacitorAuthHandler can read it after OAuth completes.
      // redirectTo must be the bare URL — Supabase validates it exactly and
      // rejects any URL with query params that aren't in the allowed list.
      if (planParam === 'free' || planParam === 'subscription') {
        localStorage.setItem('capacitor_oauth_plan', planParam);
      }
      const { data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.blindfolddate.app://login-callback',
          skipBrowserRedirect: true,
        },
      });
      if (data.url) await Browser.open({ url: data.url });
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding${planParam === "free" || planParam === "subscription" ? `&plan=${planParam}` : ""}` },
      });
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-white/50 text-sm mb-1">We sent a confirmation link to</p>
          <p className="text-white font-semibold text-sm mb-6">{emailSent}</p>
          <p className="text-white/30 text-xs">
            Click the link to activate your account — we&apos;ll get your first date ready.
            The link expires in 24 hours. Check your spam folder if you don&apos;t see it.
          </p>

          {captchaActive && (
            <div className="mt-6">
              <CaptchaWidget
                ref={turnstileRef}
                onToken={setCaptchaToken}
                onClear={() => setCaptchaToken("")}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resending}
              className="text-sm text-white/60 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resending
                ? "Sending…"
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend confirmation email"}
            </button>
            <button
              type="button"
              onClick={() => setEmailSent("")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Wrong email? Edit and try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" prefetch={true} className="flex flex-col items-center gap-3 mb-8 group">
          <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
          <p className="text-white/40 text-sm">Your first date is two minutes away</p>
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm overflow-hidden" onFocus={() => setCaptchaActive(true)} onPointerDown={() => setCaptchaActive(true)}>
            {!emailStep ? (
              <div>
                <h2 className="text-lg font-bold text-white mb-5">Create account</h2>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full mb-4"
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

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 border-t border-white/10" />
                  <span className="text-xs text-white/30">or</span>
                  <div className="flex-1 border-t border-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => router.push(planParam ? `?plan=${planParam}&step=email` : "?step=email", { scroll: false })}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full border border-white/15 text-white/70 text-sm font-medium hover:border-white/25 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Continue with email
                </button>

                <ConsentText />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-white/40 hover:text-white transition-colors shrink-0"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-white">Sign up with email</h2>
                </div>

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
                    {error}
                    {error === "User already registered" && (
                      <> — <Link href="/login" className="underline hover:text-red-300">Sign in</Link></>
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
                      placeholder="Min. 8 characters"
                      icon={<Lock className="w-4 h-4" />}
                      error={errors.password?.message}
                      {...register("password")}
                    />
                    <PasswordStrength password={watch("password") ?? ""} />
                  </div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat password"
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.confirm?.message}
                    {...register("confirm")}
                  />

                  {captchaActive && (
                    <CaptchaWidget
                      ref={turnstileRef}
                      onToken={setCaptchaToken}
                      onClear={() => setCaptchaToken("")}
                    />
                  )}

                  <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                    Create Account
                  </Button>
                </form>

                <ConsentText />
              </div>
            )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-rose-400 hover:text-rose-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
