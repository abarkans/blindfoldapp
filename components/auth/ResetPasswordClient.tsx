"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PasswordStrength from "@/components/ui/PasswordStrength";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (updateError) {
      const isExpired = /session|expired|missing|invalid/i.test(updateError.message);
      if (isExpired) {
        setSessionExpired(true);
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/dashboard"), 2000);
  }

  if (sessionExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <Link href="/" className="flex flex-col items-center gap-3 mb-8">
            <Image src="/logo.png" alt="BlindfoldDate" width={180} height={44} className="object-contain" />
          </Link>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-white font-semibold mb-2">Reset link expired</p>
            <p className="text-white/50 text-sm mb-5">
              This link can only be used once and may have expired. Request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="block w-full text-center py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-rose-600 to-violet-600 text-white"
            >
              Request new reset link
            </Link>
          </div>
          <p className="text-center text-white/30 text-sm mt-6">
            <Link href="/login" className="text-rose-400 hover:text-rose-300 font-semibold">Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logo.png"
            alt="BlindfoldDate"
            width={180}
            height={44}
            className="object-contain"
          />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-semibold">Password updated!</p>
              <p className="text-white/50 text-sm">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Set new password</h2>
              <p className="text-sm text-white/45 mb-5">Choose a strong password for your account.</p>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <Input
                    label="New password"
                    type="password"
                    placeholder="At least 8 characters"
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message}
                    {...register("password")}
                  />
                  <PasswordStrength password={watch("password") ?? ""} />
                </div>
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat password"
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.confirm?.message}
                  {...register("confirm")}
                />
                <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                  Update password
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
      </div>
    </div>
  );
}
