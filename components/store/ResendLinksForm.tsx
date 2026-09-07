"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestDownloadLinks } from "@/app/actions/store-resend";

const schema = z.object({
  email: z.string().email("Invalid email address").max(254),
});
type FormData = z.infer<typeof schema>;

export default function ResendLinksForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormData) {
    setLoading(true);
    setError("");
    try {
      await requestDownloadLinks(values.email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    // Deliberately says nothing about whether that address has bought anything.
    return (
      <p className="text-sm leading-relaxed text-white/60">
        If we have a purchase under that address, your download links are on their way.
        They replace any older links we sent.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          className="flex-1 h-11 px-4 rounded-full bg-white/[0.04] border border-white/12 text-white placeholder:text-white/30 text-sm outline-none focus:border-white/25 transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-rose-500 hover:bg-rose-400 disabled:opacity-60 disabled:hover:bg-rose-500 text-white text-sm font-semibold transition-[background-color] duration-150"
        >
          {loading ? "Sending…" : "Email my links"}
        </button>
      </div>
      {(errors.email || error) && (
        <p className="mt-3 text-sm text-rose-300">{errors.email?.message ?? error}</p>
      )}
    </form>
  );
}
