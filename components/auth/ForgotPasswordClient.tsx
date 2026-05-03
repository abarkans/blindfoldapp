"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import CaptchaWidget, { type TurnstileInstance } from "@/components/auth/CaptchaWidget";

const schema = z.object({
  email: z.string().email("Invalid email"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  function resetCaptcha() {
    setCaptchaToken("");
    turnstileRef.current?.reset();
  }

  async function onSubmit(values: FormData) {
    if (!captchaToken) {
      setError("Security check still loading — please try again in a moment.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      captchaToken,
    });
    if (resetError) {
      setError(
        /captcha/i.test(resetError.message)
          ? "Security check expired — please try again."
          : resetError.message
      );
      setLoading(false);
      resetCaptcha();
      return;
    }
    resetCaptcha();
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="flex flex-col items-center gap-3 mb-8">
          <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-semibold">Check your inbox</p>
              <p className="text-white/50 text-sm">We sent a password reset link to your email address.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Forgot password?</h2>
              <p className="text-sm text-white/45 mb-5">Enter your email and we&apos;ll send a reset link.</p>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
                  {error}
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
                <CaptchaWidget
                  ref={turnstileRef}
                  onToken={setCaptchaToken}
                  onClear={() => setCaptchaToken("")}
                />
                <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          <Link href="/login" className="text-rose-400 hover:text-rose-300 font-semibold">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
