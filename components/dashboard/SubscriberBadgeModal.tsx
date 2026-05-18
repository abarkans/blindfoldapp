"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import confetti, { type CreateTypes } from "canvas-confetti";

let _fire: CreateTypes | null = null;
function getFire(): CreateTypes {
  if (_fire) return _fire;
  if (typeof document === "undefined") return confetti as unknown as CreateTypes;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;width:100%;height:100%;z-index:9999";
  document.body.appendChild(canvas);
  _fire = confetti.create(canvas, { resize: true, useWorker: true });
  return _fire;
}

interface SubscriberBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function BadgeCard() {
  const [rotation, setRotation] = useState(0);
  const pointerStartX = useRef(0);

  function handlePointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX;
  }

  function handlePointerUp(e: React.PointerEvent) {
    const dx = e.clientX - pointerStartX.current;
    const dir = dx >= 0 ? 1 : -1;
    const spins = Math.abs(dx) < 30 ? 1 : Math.max(1, Math.round(Math.abs(dx) / 80));
    setRotation((r) => r + dir * spins * 360);
  }

  return (
    <div style={{ perspective: 800 }} className="pointer-events-auto">
      <div
        className="cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `rotateY(${rotation}deg)`,
          transition: "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          willChange: "transform",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <Image
          src="/badges/Subscriber.png"
          alt="Subscriber"
          width={240}
          height={240}
          unoptimized
          className="w-56 h-56 md:w-64 md:h-64 object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function SubscriberBadgeModal({ isOpen, onClose }: SubscriberBadgeModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fire = getFire();
    fire({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      ticks: 120,
      scalar: 0.9,
      colors: ["#f97316", "#f59e0b", "#ec4899", "#a855f7", "#ffffff"],
    });
    const t = setTimeout(() => {
      fire({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.2, y: 0.6 },
        ticks: 120,
        scalar: 0.9,
        colors: ["#f97316", "#f59e0b", "#ffffff"],
      });
      fire({
        particleCount: 40,
        spread: 50,
        origin: { x: 0.8, y: 0.6 },
        ticks: 120,
        scalar: 0.9,
        colors: ["#ec4899", "#a855f7", "#ffffff"],
      });
    }, 350);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-[#030303]/90 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 pointer-events-none"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="pointer-events-auto absolute top-8 right-6 w-10 h-10 rounded-full bg-white/[0.075] border border-white/15 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            {/* Badge label */}
            <motion.p
              className="pointer-events-auto text-xs font-semibold text-amber-400 uppercase tracking-widest mb-5"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
            >
              Badge Unlocked!
            </motion.p>

            <BadgeCard />

            {/* Title + description */}
            <motion.div
              className="pointer-events-auto text-center mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <p className="text-xl font-bold text-white mb-1">Subscriber</p>
              <p className="text-sm text-white/55">You joined Blindfold Plus. Welcome!</p>
              <p className="text-xs text-white/40 mt-4">Swipe to flip ✦</p>
            </motion.div>

            {/* CTA */}
            <motion.button
              className="pointer-events-auto mt-8 px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-colors active:scale-[0.98]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onClose}
            >
              Awesome!
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
