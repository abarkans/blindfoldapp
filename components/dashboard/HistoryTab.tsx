"use client";

import { use, useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Lock, Gem, CalendarDays, MapPin, X, ChevronLeft, ChevronRight, Share2, Download } from "lucide-react";
import type { CompletedDateWithPhotos } from "@/app/actions/photo";
import type { Theme } from "@/lib/types";

interface HistoryTabProps {
  historyPromise: Promise<CompletedDateWithPhotos[]>;
  planType: string;
  onOpenPlanSettings: () => void;
  theme: Theme;
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

const FAKE_GRADIENTS = [
  "from-rose-300 via-amber-200 to-orange-300",
  "from-violet-300 via-pink-200 to-rose-300",
  "from-emerald-200 via-cyan-300 to-indigo-300",
  "from-amber-300 via-orange-200 to-red-300",
  "from-purple-300 via-indigo-200 to-blue-300",
];

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
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState("");

  const fileNameBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "memory";

  async function fetchPhotoFile(key: string): Promise<File> {
    const res = await fetch(`/api/photo/view?key=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error("Couldn't load photo");
    const blob = await res.blob();
    return new File([blob], `${fileNameBase}.jpg`, { type: "image/jpeg" });
  }

  async function handleShare(key: string) {
    setActionError("");
    setSharing(true);
    try {
      const file = await fetchPhotoFile(key);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
      } else if (navigator.share) {
        await navigator.share({ title: name, url: window.location.href });
      } else {
        throw new Error("Sharing isn't supported on this device");
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setActionError(err.message || "Couldn't share photo");
      }
    } finally {
      setSharing(false);
    }
  }

  async function handleDownload(key: string) {
    setActionError("");
    setDownloading(true);
    try {
      const file = await fetchPhotoFile(key);
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't download photo");
    } finally {
      setDownloading(false);
    }
  }

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
          {!isPaid ? (
            <div className="w-full h-full relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${FAKE_GRADIENTS[index % FAKE_GRADIENTS.length]}`}
                style={{ filter: "blur(18px)", transform: "scale(1.4)" }}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white/90 drop-shadow" />
              </div>
            </div>
          ) : hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/photo/view?key=${encodeURIComponent(photos[0].r2_key!)}`}
              alt={name}
              className="w-full h-full object-cover"
            />
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

              {actionError && (
                <p className="text-xs text-red-400 text-center mt-3">{actionError}</p>
              )}
              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <Button
                  size="md"
                  className="w-full md:flex-1 gap-2"
                  loading={sharing}
                  disabled={downloading}
                  onClick={(e) => { e.stopPropagation(); handleShare(photos[lightboxIdx].r2_key!); }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full md:flex-1 gap-2"
                  loading={downloading}
                  disabled={sharing}
                  onClick={(e) => { e.stopPropagation(); handleDownload(photos[lightboxIdx].r2_key!); }}
                >
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
  theme,
}: {
  history: CompletedDateWithPhotos[];
  isPaid: boolean;
  onOpenPlanSettings: () => void;
  theme: Theme;
}) {
  const [inCapacitor, setInCapacitor] = useState(false);
  useEffect(() => { if ((window as any).Capacitor) setInCapacitor(true) }, []);
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--fg)/0.05)] border border-[rgb(var(--fg)/0.1)] flex items-center justify-center mb-4">
          <CalendarDays className={`w-7 h-7 ${theme === "dark" ? "text-[#383838]" : "text-[#d6d6d6]"}`} />
        </div>
        <p className="text-[rgb(var(--fg)/0.6)] text-sm">No completed dates yet.</p>
        <p className="text-[rgb(var(--fg)/0.35)] text-xs mt-1">Finish a date to start your scrapbook.</p>
      </div>
    );
  }

  return (
    <div>
      {!isPaid && history.length > 0 && (
        <div className="mb-6 bg-[rgb(var(--fg)/0.035)] border border-[rgb(var(--fg)/0.18)] rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gem className="w-4 h-4 text-[rgb(var(--fg)/0.65)]" />
            <p className="text-xs font-semibold text-[rgb(var(--fg))] uppercase tracking-widest">Plus</p>
          </div>
          <p className="text-sm font-semibold text-[rgb(var(--fg))] mb-1">Unlock your Date Scrapbook</p>
          <p className="text-xs text-[rgb(var(--fg)/0.55)] leading-relaxed mb-3">
            Photos are captured. To view them upgrade by visiting blindfolddate.com from your account.
          </p>
          {inCapacitor ? (
            <p className="text-xs text-[rgb(var(--fg)/0.5)] text-center leading-relaxed">
              To upgrade to Plus, visit blindfolddate.com from your account.
            </p>
          ) : (
            <button
              onClick={onOpenPlanSettings}
              className="w-full py-2.5 rounded-full bg-rose-500 text-white font-semibold text-sm hover:bg-rose-400 transition-all active:scale-[0.98]"
            >
              Upgrade to Plus
            </button>
          )}
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
  theme,
}: HistoryTabProps) {
  const history = use(historyPromise);
  const isPaid = planType === "subscription";

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-[rgb(var(--fg))]">Your scrapbook</h2>
        <p className="text-[rgb(var(--fg)/0.55)] text-sm mt-1">Every date you&apos;ve completed.</p>
      </div>
      <HistoryContent
        history={history}
        isPaid={isPaid}
        onOpenPlanSettings={onOpenPlanSettings}
        theme={theme}
      />
    </div>
  );
}
