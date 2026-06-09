"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, Users, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { savePhoto, skipPhoto, getPhotosForDate, type DatePhoto } from "@/app/actions/photo";

interface PhotoChallengeProps {
  dateIdeaId: string;
  profileId: string;
  myUserId: string;
  dateName: string;
  planType: string;
  onComplete?: () => void;
  onSkip?: () => void;
  onXpEarned?: (amount: number) => void;
  autoOpen?: boolean;
}

// Canvas: draw photo + branded overlay, return JPEG blob (EXIF stripped via re-encode)
async function buildMemoryCard(file: File, dateName: string): Promise<Blob> {
  const W = 1080;
  const H = 1440; // 3:4 portrait
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Cover-crop to 2:3, center
  const scale = Math.max(W / bitmap.width, H / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (W - w) / 2, (H - h) / 2, w, h);
  bitmap.close();

  // Bottom gradient bar
  const grad = ctx.createLinearGradient(0, H - 180, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - 180, W, 180);

  // Logo
  await new Promise<void>((resolve) => {
    const logo = new window.Image();
    logo.onload = () => {
      ctx.drawImage(logo, 32, H - 110, 72, 72);
      resolve();
    };
    logo.onerror = () => resolve();
    logo.src = "/icon.png";
  });

  // Date name
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(dateName.slice(0, 28), 120, H - 62);

  // blindfolddate.com watermark
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = "22px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("blindfolddate.com", 120, H - 30);

  const tryEncode = (quality: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
        "image/jpeg",
        quality
      )
    );

  let blob = await tryEncode(0.88);
  if (blob.size > 3 * 1024 * 1024) blob = await tryEncode(0.72);
  if (blob.size > 3 * 1024 * 1024) blob = await tryEncode(0.55);
  return blob;
}

type UploadState = "idle" | "processing" | "uploading" | "skipping" | "done" | "error";

export default function PhotoChallenge({
  dateIdeaId,
  profileId,
  myUserId,
  dateName,
  planType,
  onComplete,
  onSkip,
  onXpEarned,
  autoOpen,
}: PhotoChallengeProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoOpenFiredRef = useRef(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [photos, setPhotos] = useState<DatePhoto[]>([]);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);
  const [xpToast, setXpToast] = useState(0);
  const xpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myPhoto = photos.find((p) => p.uploader_user_id === myUserId);
  const partnerPhoto = photos.find((p) => p.uploader_user_id !== myUserId);
  const alreadyUploaded = !!myPhoto;

  const fetchPhotos = useCallback(async () => {
    const result = await getPhotosForDate(dateIdeaId);
    setPhotos(result);
  }, [dateIdeaId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // When parent signals autoOpen, click the file input on first real mount.
  // autoOpenFiredRef guards against React StrictMode's double-invoke firing twice.
  useEffect(() => {
    if (autoOpen && !alreadyUploaded && !autoOpenFiredRef.current) {
      autoOpenFiredRef.current = true;
      fileInputRef.current?.click();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (xpTimerRef.current) clearTimeout(xpTimerRef.current); }, []);

  // Realtime: listen for partner photo uploads and trigger refresh when date completes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`date-photos-${dateIdeaId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "date_photos",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          fetchPhotos();
          router.refresh();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dateIdeaId, profileId, fetchPhotos, router]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploadState("processing");
    setUploadError("");

    try {
      const blob = await buildMemoryCard(file, dateName);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setPendingBlob(blob);
      setUploadState("idle");
    } catch {
      setUploadError("Couldn't process image. Try again.");
      setUploadState("error");
    }
  }

  async function handleUpload() {
    if (!pendingBlob) return;

    if (pendingBlob.size > 5 * 1024 * 1024) {
      setUploadError("Image too large to upload. Try a different photo.");
      setUploadState("error");
      return;
    }

    setUploadState("uploading");
    setUploadError("");

    try {
      const res = await fetch("/api/photo/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateIdeaId }),
      });

      if (res.status === 409) {
        // Photo already in DB (previous upload succeeded but threw on complete step).
        await fetchPhotos();
        setUploadState("done");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to get upload URL");
      }

      const { uploadUrl, key } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: pendingBlob,
        headers: { "Content-Type": "image/jpeg" },
      });

      const result = await savePhoto(dateIdeaId, key);
      if (result.error) throw new Error(result.error);

      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      setPendingBlob(null);
      setUploadState("done");
      if ((result.xpGained ?? 0) > 0) {
        setXpToast(result.xpGained!);
        if (xpTimerRef.current) clearTimeout(xpTimerRef.current);
        xpTimerRef.current = setTimeout(() => setXpToast(0), 3000);
        onXpEarned?.(result.xpGained!);
      }
      await fetchPhotos();
      if (result.completed) onComplete?.();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    }
  }

  async function handleSkip() {
    setSkipDialogOpen(false);
    setUploadState("skipping");
    setUploadError("");

    try {
      const result = await skipPhoto(dateIdeaId);
      if (result.error) {
        setUploadError(result.error);
        setUploadState("error");
        return;
      }

      setUploadState("done");
      await fetchPhotos();
      if (result.completed) onComplete?.();
    } catch {
      setUploadError("Something went wrong.");
      setUploadState("error");
    }
  }

  function handleDiscard() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPendingBlob(null);
    setUploadState("idle");
    setUploadError("");
  }

  function handleRetake() {
    handleDiscard();
    fileInputRef.current?.click();
  }

  const isPaid = planType === "subscription";
  const isInline = !!onComplete;

  return (
    <div className={isInline ? "mt-4" : "mt-4 rounded-3xl border border-white/16 bg-white/[0.035] p-5"}>
      {isInline ? null : (
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Memory Challenge</p>
            <p className="text-xs text-white/50">Capture tonight</p>
          </div>
        </div>
      )}

      {/* Partner upload status — only show in standalone mode */}
      {!isInline && (
        <div className="flex gap-3 mb-4">
          <div className={`flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2 ${myPhoto ? "border-emerald-500/30 bg-emerald-500/8" : "border-white/10 bg-white/[0.025]"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${myPhoto ? "bg-emerald-400" : "bg-white/25"}`} />
            <span className="text-xs text-white/70">You</span>
            {myPhoto && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
          </div>
          <div className={`flex-1 flex items-center gap-2 rounded-2xl border px-3 py-2 ${partnerPhoto ? "border-emerald-500/30 bg-emerald-500/8" : "border-white/10 bg-white/[0.025]"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${partnerPhoto ? "bg-emerald-400" : "bg-white/25"}`} />
            <Users className="w-3 h-3 text-white/40" />
            <span className="text-xs text-white/70">Partner</span>
            {partnerPhoto && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
          </div>
        </div>
      )}

      {preview && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-start pt-10"
          >
            <div className="w-full max-w-sm px-3">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleDiscard}
                  disabled={uploadState === "uploading"}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-40"
                  aria-label="Discard photo"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              {/* Photo — strict 3:4 */}
              <div className="rounded-3xl overflow-hidden aspect-[3/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Memory card preview" className="w-full h-full object-cover" />
              </div>

              {/* CTAs immediately below photo */}
              <div className="pt-4 pb-2 flex flex-col gap-2">
                {uploadError && (
                  <p className="text-xs text-red-400 mb-1 text-center">{uploadError}</p>
                )}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleUpload}
                  loading={uploadState === "uploading"}
                  disabled={uploadState === "uploading"}
                >
                  Looks good
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full"
                  onClick={handleRetake}
                  disabled={uploadState === "uploading"}
                >
                  Retake photo
                </Button>
              </div>
            </div>
          </motion.div>,
          document.body
        )}

      {xpToast > 0 && (
        <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 mb-2">
          <span className="text-sm font-bold text-emerald-300">+{xpToast} XP</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {uploadState === "processing" ? (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 h-12"
          >
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-rose-500/40 border-t-rose-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm text-white/55">Building memory card…</span>
          </motion.div>
        ) : uploadState === "skipping" ? (
          <motion.div key="skipping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 h-12"
          >
            <motion.div
              className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm text-white/55">Saving…</span>
          </motion.div>
        ) : alreadyUploaded && !isInline ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/70">Your memory is saved</span>
          </motion.div>
        ) : alreadyUploaded && isInline ? (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25"
          >
            <motion.div
              className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
            />
            <span className="text-sm text-amber-300">Waiting for partner…</span>
          </motion.div>
        ) : (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {uploadError && (
              <p className="text-xs text-red-400 mb-2 text-center">{uploadError}</p>
            )}
            {!isPaid && !isInline && (
              <p className="text-xs text-amber-400/80 mb-3 text-center">
                Gallery viewing requires Plus. You can still capture and save locally.
              </p>
            )}
            {isInline ? (
              <>
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                  Capture the memory
                </Button>
                <Button variant="ghost" size="lg" className="w-full mt-1" onClick={() => onSkip ? onSkip() : setSkipDialogOpen(true)}>
                  Skip
                </Button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] text-sm font-medium text-white/60 hover:border-rose-500/40 hover:text-white/80 hover:bg-white/[0.04] transition-all active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                Capture the memory
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />

      <Dialog open={skipDialogOpen} onClose={() => setSkipDialogOpen(false)} className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <Camera className="w-5 h-5 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">Skip photo?</h3>
        <p className="text-sm text-white/55 mb-6">A photo turns tonight into a memory you can look back on. Skip and the moment stays just in your heads.</p>
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={() => setSkipDialogOpen(false)} className="w-full">
            Never mind
          </Button>
          <Button type="button" variant="ghost" onClick={handleSkip} className="w-full">
            Skip anyway
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
