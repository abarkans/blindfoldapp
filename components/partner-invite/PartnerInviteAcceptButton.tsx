"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptPartnerInvite } from "@/app/actions/partner-invite";
import Button from "@/components/ui/Button";

export default function PartnerInviteAcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, startTransition] = useTransition();

  function accept() {
    setError("");
    startTransition(async () => {
      const result = await acceptPartnerInvite(token);
      if (result.error) {
        setError(result.error);
        return;
      }
      setAccepted(true);
      setTimeout(() => router.replace("/dashboard?tab=date"), 700);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {accepted ? (
        <p className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
          Connected. Taking you to the dashboard...
        </p>
      ) : (
        <Button size="lg" className="w-full" loading={pending} onClick={accept}>
          Accept invitation
        </Button>
      )}
    </div>
  );
}
