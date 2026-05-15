"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Lock, Sparkles, CalendarDays, X } from "lucide-react";
import type { CompletedDateWithPhotos } from "@/app/actions/photo";

interface HistoryTabProps {
  historyPromise: Promise<CompletedDateWithPhotos[]>;
  planType: string;
  onOpenPlanSettings: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return "Unknown date";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getDateName(idea: Record<string, unknown>): string {
  if (idea.type === "venue") return (idea.display_name as string) ?? "Venue date";
  return (idea.title as string) ?? "Date night";
}

function PhotoSlot({ r2Key, isPaid }: { r2Key: string | null; isPaid: boolean }) {
  const [error, setError] = useState(false);

  if (!r2Key) {
    return (
      <div className="w-full h-full rounded-2xl bg-white/[0.035] border border-white/10 flex items-center justify-center">
        <Camera className="w-5 h-5 text-white/20" />
      </div>
    );
  }

  if (!isPaid || error) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-white/[0.035] border border-white/10 relative flex items-center justify-center">
        <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03]" />
        <Lock className="w-5 h-5 text-white/40 relative z-10" />
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-white/[0.035] border border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/photo/view?key=${encodeURIComponent(r2Key)}`}
        alt="Memory photo"
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}

function HistoryCard({
  date,
  isPaid,
}: {
  date: CompletedDateWithPhotos;
  isPaid: boolean;
}) {
  const name = getDateName(date.idea);
  const hasPhotos = date.photos.length > 0;
  const photo1 = date.photos[0] ?? null;
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);
  const canOpen = isPaid && !!photo1?.r2_key;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white/[0.035] border border-white/16 rounded-3xl p-3 flex items-center gap-3"
      >
        {/* Thumbnail */}
        <button
          type="button"
          disabled={!canOpen}
          onClick={() => canOpen && setLightboxKey(photo1!.r2_key)}
          className={`w-20 h-20 shrink-0 rounded-2xl overflow-hidden ${canOpen ? "cursor-pointer active:scale-95 transition-transform" : "cursor-default"}`}
        >
          <PhotoSlot r2Key={photo1?.r2_key ?? null} isPaid={isPaid} />
        </button>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          <p className="text-xs text-white/45 mt-0.5">{formatDate(date.revealed_at)}</p>
          {hasPhotos ? (
            <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              {date.photos.length} photo{date.photos.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <p className="text-[11px] text-white/25 mt-1">No photo captured</p>
          )}
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxKey && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightboxKey(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxKey(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.93 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.93 }}
              transition={{ duration: 0.18 }}
              src={`/api/photo/view?key=${encodeURIComponent(lightboxKey)}`}
              alt="Memory photo"
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function HistoryContent({
  history,
  isPaid,
  onOpenPlanSettings,
}: {
  history: CompletedDateWithPhotos[];
  isPaid: boolean;
  onOpenPlanSettings: () => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mb-4">
          <CalendarDays className="w-7 h-7 text-white/25" />
        </div>
        <p className="text-white/60 text-sm">No completed dates yet.</p>
        <p className="text-white/35 text-xs mt-1">Finish a date to start your scrapbook.</p>
      </div>
    );
  }

  const hasAnyPhotos = history.some((d) => d.photos.length > 0);

  return (
    <div>
      {!isPaid && hasAnyPhotos && (
        <div className="mb-4 bg-white/[0.035] border border-white/18 rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-white/65" />
            <p className="text-xs font-semibold text-white uppercase tracking-widest">Plus</p>
          </div>
          <p className="text-sm font-semibold text-white mb-1">Unlock your Date Scrapbook</p>
          <p className="text-xs text-white/55 leading-relaxed mb-3">
            Photos are captured — upgrade to Plus to view them.
          </p>
          <button
            onClick={onOpenPlanSettings}
            className="w-full py-2.5 rounded-full bg-rose-500 text-white font-semibold text-sm hover:bg-rose-400 transition-all active:scale-[0.98]"
          >
            Upgrade to Plus
          </button>
        </div>
      )}

      <div className="space-y-3">
        {history.map((date) => (
          <HistoryCard key={date.id} date={date} isPaid={isPaid} />
        ))}
      </div>
    </div>
  );
}

export default function HistoryTab({
  historyPromise,
  planType,
  onOpenPlanSettings,
}: HistoryTabProps) {
  const history = use(historyPromise);
  const isPaid = planType === "subscription";

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white">Your scrapbook</h2>
        <p className="text-white/55 text-sm mt-1">Every date you&apos;ve completed.</p>
      </div>
      <HistoryContent
        history={history}
        isPaid={isPaid}
        onOpenPlanSettings={onOpenPlanSettings}
      />
    </div>
  );
}
