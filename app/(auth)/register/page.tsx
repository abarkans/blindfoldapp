"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, Heart, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isDisposableEmail } from "@/lib/utils/disposable-emails";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormData) {
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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase returns an empty identities array when the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      setError("User already registered");
      setLoading(false);
      return;
    }

    // Don't redirect yet — Supabase requires email confirmation before the
    // session is active. Show a holding screen; the auth callback handles
    // the final redirect once the user clicks the confirmation link.
    setEmailSent(values.email);
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-white/50 text-sm mb-1">
            We sent a confirmation link to
          </p>
          <p className="text-white font-semibold text-sm mb-6">{emailSent}</p>
          <p className="text-white/30 text-xs">
            Click the link in the email to activate your account and start your mystery journey.
            The link expires in 24 hours.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="flex flex-col items-center gap-3 mb-8 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-500/40 group-hover:brightness-110 transition-all">
            <Heart className="w-7 h-7 text-white fill-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">BlindfoldDate</h1>
            <p className="text-white/40 text-sm">Start your mystery journey</p>
          </div>
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-5">Create account</h2>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full mb-5"
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
            <div className="flex-1 border-t border-white/10" />
            <span className="text-xs text-white/30">or sign up with email</span>
            <div className="flex-1 border-t border-white/10" />
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
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirm?.message}
              {...register("confirm")}
            />
            <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-rose-400 hover:text-rose-300 font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
