"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Download, Upload, CheckCircle2, Users, X } from "lucide-react";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import { createClient } from "@/lib/supabase/client";
import { savePhoto, getPhotosForDate, type DatePhoto } from "@/app/actions/photo";

interface PhotoChallengeProps {
  dateIdeaId: string;
  profileId: string;
  myUserId: string;
  dateName: string;
  planType: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

// Canvas: draw photo + branded overlay, return JPEG blob (EXIF stripped via re-encode)
async function buildMemoryCard(file: File, dateName: string): Promise<Blob> {
  const SIZE = 1080;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // Crop to square, center
  const scale = Math.max(SIZE / bitmap.width, SIZE / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
  bitmap.close();

  // Bottom gradient bar
  const grad = ctx.createLinearGradient(0, SIZE - 180, 0, SIZE);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, SIZE - 180, SIZE, 180);

  // Logo
  await new Promise<void>((resolve) => {
    const logo = new window.Image();
    logo.onload = () => {
      ctx.drawImage(logo, 32, SIZE - 110, 72, 72);
      resolve();
    };
    logo.onerror = () => resolve();
    logo.src = "/icon.png";
  });

  // Date name
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(dateName.slice(0, 28), 120, SIZE - 62);

  // blindfolddate.com watermark
  ctx.fillStyle = "rgba(255,255,255,0.38)";
  ctx.font = "22px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("blindfolddate.com", 120, SIZE - 30);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
      "image/jpeg",
      0.88
    );
  });
}

type UploadState = "idle" | "processing" | "uploading" | "done" | "error";

export default function PhotoChallenge({
  dateIdeaId,
  profileId,
  myUserId,
  dateName,
  planType,
  onComplete,
  onSkip,
}: PhotoChallengeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [photos, setPhotos] = useState<DatePhoto[]>([]);
  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

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

  // Realtime: listen for partner photo uploads
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
        () => fetchPhotos()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dateIdeaId, profileId, fetchPhotos]);

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
    setUploadState("uploading");
    setUploadError("");

    try {
      const res = await fetch("/api/photo/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateIdeaId }),
      });

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

      if (onComplete) {
        onComplete();
      } else {
        setUploadState("done");
        await fetchPhotos();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
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

  function handleDownload() {
    if (!preview && !pendingBlob) return;
    const src = preview ?? URL.createObjectURL(pendingBlob!);
    const a = document.createElement("a");
    a.href = src;
    a.download = `blindfolddate-${dateName.replace(/\s+/g, "-")}.jpg`;
    a.click();
    if (!preview) URL.revokeObjectURL(src);
  }

  const isPaid = planType === "subscription";
  const isInline = !!onComplete || !!onSkip;

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

      <AnimatePresence mode="wait">
        {preview ? (
          /* Preview + confirm/discard */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative rounded-2xl overflow-hidden mb-3 aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Memory card preview" className="w-full h-full object-cover" />
            </div>
            {uploadError && (
              <p className="text-xs text-red-400 mb-2 text-center">{uploadError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full border border-white/16 bg-white/[0.04] text-xs font-semibold text-white/70 hover:bg-white/[0.08] transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Save
              </button>
              <button
                onClick={handleUpload}
                disabled={uploadState === "uploading"}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full bg-rose-500 text-xs font-semibold text-white hover:bg-rose-400 transition-all disabled:opacity-60 active:scale-[0.98]"
              >
                {uploadState === "uploading" ? (
                  <>
                    <motion.div
                      className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {isInline ? "Done — finish date" : "Share with partner"}
                  </>
                )}
              </button>
              <button
                onClick={handleDiscard}
                className="w-10 h-10 rounded-full border border-white/16 bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-all"
                aria-label="Discard"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </motion.div>
        ) : uploadState === "processing" ? (
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
        ) : alreadyUploaded && !isInline ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/70">Your memory is saved</span>
          </motion.div>
        ) : (
          <motion.div key="capture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {uploadError && (
              <p className="text-xs text-red-400 mb-2 text-center">{uploadError}</p>
            )}
            {!isPaid && !isInline && (
              <p className="text-xs text-amber-400/80 mb-3 text-center">
                Gallery viewing requires Plus — you can still capture and save locally.
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
                {onSkip && (
                  <Button variant="ghost" size="lg" className="w-full mt-1" onClick={() => setSkipDialogOpen(true)}>
                    Skip
                  </Button>
                )}
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

      {onSkip && (
        <Dialog open={skipDialogOpen} onClose={() => setSkipDialogOpen(false)} className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Skip photo?</h3>
          <p className="text-sm text-white/55 mb-6">A photo turns tonight into a memory you can look back on — skip and the moment stays just in your heads.</p>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={() => setSkipDialogOpen(false)} className="w-full">
              Never mind
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} className="w-full">
              Skip anyway
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
