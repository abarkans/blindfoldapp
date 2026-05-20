"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, CheckCircle } from "lucide-react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PublicPageShell from "@/components/ui/PublicPageShell";
import PublicNav from "@/components/ui/PublicNav";
import { submitContact } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(254),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
type FormData = z.infer<typeof schema>;

export default function ContactClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const messageLength = watch("message")?.length ?? 0;

  async function onSubmit(values: FormData) {
    setLoading(true);
    setError("");
    const result = await submitContact(values);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  return (
    <PublicPageShell>
      <PublicNav showCta={false} />
    <div className="min-h-dvh flex items-center justify-center pb-4 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm"
      >

        <div className="bg-[#030303]/88 border border-white/16 rounded-3xl p-6 backdrop-blur-xl shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="text-white font-semibold">Message sent!</p>
              <p className="text-white/50 text-sm">We&apos;ll get back to you as soon as possible.</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Get in touch</h2>
              <p className="text-sm text-white/45 mb-5">Have a question or feedback? We&apos;d love to hear from you.</p>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <Input
                  label="Name"
                  type="text"
                  placeholder="Your name"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register("name")}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register("email")}
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white/70">Message</label>
                    <span className={cn("text-xs", messageLength > 1800 ? "text-amber-400" : "text-white/30")}>
                      {messageLength}/2000
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 text-white/40">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <textarea
                      placeholder="What's on your mind?"
                      rows={5}
                      className={cn(
                        "w-full rounded-2xl bg-white/[0.06] border border-white/18 text-white placeholder-white/30 px-4 py-3 pl-10 text-base resize-none",
                        "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 transition-all",
                        errors.message && "border-red-400 focus:border-red-400 focus:ring-red-400/30",
                      )}
                      {...register("message")}
                    />
                  </div>
                  {errors.message && (
                    <p className="text-xs text-red-400 mt-0.5">{errors.message.message}</p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
                  Send message
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">
          <Link href="/" className="text-rose-400 hover:text-rose-300 font-semibold">
            Back to home
          </Link>
        </p>
      </motion.div>
    </div>
    </PublicPageShell>
  );
}
