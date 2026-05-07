"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LinkButton from "@/components/ui/LinkButton";
import { motion } from "framer-motion";
import { Trash2, AlertCircle, ShieldAlert } from "lucide-react";
import { confirmAccountDeletion } from "@/app/actions/delete-account";

type State = "ready" | "invalid" | "expired" | "login_required";

interface Props {
  state: State;
  token?: string;
  email?: string;
  message?: string;
}

export default function ConfirmDeleteClient({ state, token, email, message }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      await confirmAccountDeletion(token);
      router.push("/?account=deleted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not delete account";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-[#0d0d14]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Link href="/" className="flex flex-col items-center gap-3 mb-8">
          <Image src="/logo.png" alt="BlindfoldDate" width={140} height={36} className="object-contain" />
        </Link>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm text-center">
          {state === "ready" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Confirm account deletion</h1>
              {email && <p className="text-xs text-white/40 mb-3">{email}</p>}
              <p className="text-sm text-white/55 mb-6 leading-relaxed">
                This will permanently remove your account, all your data, dates, and progress.
                <strong className="text-white/80"> This cannot be undone.</strong>
              </p>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-sm text-red-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-colors active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {submitting ? "Deleting…" : "Yes, delete my account"}
                </button>
                <LinkButton href="/dashboard" variant="outline" className="w-full">
                  Cancel
                </LinkButton>
              </div>
            </>
          )}

          {state === "expired" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Link expired</h1>
              <p className="text-sm text-white/55 mb-6 leading-relaxed">{message}</p>
              <LinkButton href="/dashboard?tab=settings" variant="outline" className="w-full">
                Back to Settings
              </LinkButton>
            </>
          )}

          {state === "invalid" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-white/60" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Invalid link</h1>
              <p className="text-sm text-white/55 mb-6 leading-relaxed">{message}</p>
              <LinkButton href="/dashboard" variant="outline" className="w-full">
                Go to dashboard
              </LinkButton>
            </>
          )}

          {state === "login_required" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-white/60" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Sign in required</h1>
              <p className="text-sm text-white/55 mb-6 leading-relaxed">{message}</p>
              <LinkButton href="/login" variant="outline" className="w-full">
                Sign in
              </LinkButton>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
