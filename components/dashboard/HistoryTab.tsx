"use client";

import { use, useState } from "react";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Lock, Sparkles, CalendarDays, MapPin, X, ChevronLeft, ChevronRight, Share2, Download } from "lucide-react";
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
  if (idea.type === "venue") {
    const ai = idea.ai as Record<string, unknown> | undefined;
    return (ai?.title as string) ?? (idea.title as string) ?? "Venue date";
  }
  return (idea.title as string) ?? "Date night";
}

function getDateLocation(idea: Record<string, unknown>): string | null {
  if (idea.type === "venue") return (idea.display_name as string) ?? null;
  return null;
}

function PolaroidCard({
  date,
  isPaid,
  index,
}: {
  date: CompletedDateWithPhotos;
  isPaid: boolean;
  index: number;
}) {
  const name = getDateName(date.idea);
  const location = getDateLocation(date.idea);
  const photos = date.photos;
  const hasPhoto = photos.length > 0 && !!photos[0]?.r2_key;
  const canView = isPaid && hasPhoto;
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, y: -3 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
        onClick={() => { if (canView) setLightboxIdx(0); }}
        className={`bg-white rounded-2xl overflow-hidden ${canView ? "cursor-pointer" : "cursor-default"}`}
        style={{
          padding: "8px 8px 24px 8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.45), 0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {/* ── Photo ── */}
        <div className="aspect-[3/4] overflow-hidden relative bg-[#e8e4e0] rounded-xl">
          {hasPhoto ? (
            isPaid ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/photo/view?key=${encodeURIComponent(photos[0].r2_key!)}`}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/photo/view?key=${encodeURIComponent(photos[0].r2_key!)}`}
                  alt={name}
                  className="w-full h-full object-cover blur-md scale-110"
                />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white/80" />
                </div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-7 h-7 text-[#b0a9a3]" />
            </div>
          )}

          {/* Photo count badge */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/55 rounded-full px-1.5 py-0.5 flex items-center gap-0.5 pointer-events-none">
              <Camera className="w-2.5 h-2.5 text-white/80" />
              <span className="text-[9px] font-semibold text-white/90 leading-none">{photos.length}</span>
            </div>
          )}
        </div>

        {/* ── Polaroid label strip ── */}
        <div className="pt-2.5 px-0.5">
          <p className="text-[#1a1215] text-[13px] font-bold leading-tight truncate">{name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <CalendarDays className="w-3 h-3 text-[#9e8e98] shrink-0" />
            <p className="text-[11px] text-[#9e8e98] truncate">{formatDate(date.revealed_at)}</p>
          </div>
          {location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-[#9e8e98] shrink-0" />
              <p className="text-[11px] text-[#9e8e98] truncate">{location}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxIdx(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {lightboxIdx > 0 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}

            {lightboxIdx < photos.length - 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            )}

            <div className="flex flex-col items-stretch w-fit max-w-full md:py-16" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={lightboxIdx}
                initial={{ scale: 0.93, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.93, opacity: 0 }}
                transition={{ duration: 0.18 }}
                drag={photos.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  const swipe = Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 400;
                  if (!swipe) return;
                  if (info.offset.x < 0 && lightboxIdx < photos.length - 1) setLightboxIdx(lightboxIdx + 1);
                  if (info.offset.x > 0 && lightboxIdx > 0) setLightboxIdx(lightboxIdx - 1);
                }}
                src={`/api/photo/view?key=${encodeURIComponent(photos[lightboxIdx].r2_key!)}`}
                alt="Memory photo"
                className="max-w-full rounded-2xl object-contain shadow-2xl touch-pan-y select-none"
                style={{ maxHeight: "calc(100vh - 160px)" }}
              />

              {photos.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === lightboxIdx ? "bg-white" : "bg-white/30"}`}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <Button disabled size="md" className="w-full md:flex-1 gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button disabled variant="outline" size="md" className="w-full md:flex-1 gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
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
        <div className="mb-6 bg-white/[0.035] border border-white/18 rounded-3xl p-4">
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {history.map((date, index) => (
          <PolaroidCard key={date.id} date={date} isPaid={isPaid} index={index} />
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
