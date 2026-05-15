"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { checkInToDate } from "@/app/actions/check-in";
import { type UnitSystem } from "@/lib/units";

type CheckInState = "idle" | "locating" | "checking" | "waiting" | "error";

interface CheckInButtonProps {
  partnerName: string;
  partnerCheckedIn: boolean;
  unitSystem?: UnitSystem;
}

export default function CheckInButton({ partnerName, partnerCheckedIn, unitSystem = "metric" }: CheckInButtonProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckInState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isWaiting = state === "waiting";

  async function handleCheckIn() {
    if (state === "checking" || state === "locating" || state === "waiting") return;
    setErrorMsg("");
    setState("locating");

    if (!navigator.geolocation) {
      setErrorMsg("Your browser doesn't support location services.");
      setState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setState("checking");
        try {
          const result = await checkInToDate({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });

          if (result.status === "waiting") {
            setState("waiting");
            router.refresh();
            return;
          }

          if (result.status === "too_far") {
            const meters = result.distanceMeters;
            const display =
              unitSystem === "imperial"
                ? `${(meters / 1000 * 0.621371).toFixed(1)} mi`
                : meters >= 1000
                ? `${(meters / 1000).toFixed(1)} km`
                : `${meters} m`;
            setErrorMsg(`Not quite there yet — you're ${display} away. Move closer and try again.`);
            setState("error");
            return;
          }

          if (result.status === "no_venue") {
            setErrorMsg("Check-in is only available for venue dates.");
            setState("error");
            return;
          }

          if (result.status === "error") {
            setErrorMsg(result.error);
            setState("error");
            return;
          }
        } catch {
          setErrorMsg("Something went wrong. Please try again.");
          setState("error");
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Enable location access in your browser settings, then try again.");
        } else if (err.code === err.TIMEOUT) {
          setErrorMsg("Location timed out. Move to a better signal area and retry.");
        } else {
          setErrorMsg("Couldn't get your location. Please try again.");
        }
        setState("error");
      },
      { timeout: 15000, maximumAge: 30000 }
    );
  }

  if (isWaiting) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2.5 h-14 rounded-full bg-amber-500/15 border border-amber-500/30">
          <motion.div
            className="w-3.5 h-3.5 rounded-full border-2 border-amber-400/40 border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
          <span className="text-sm font-semibold text-amber-300">
            Waiting for {partnerName}
          </span>
        </div>
        <p className="text-center text-[10px] text-white/30">
          They&apos;ll get a nudge to check in too
        </p>
      </div>
    );
  }

  if (state === "checking") {
    return (
      <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-rose-500/20 border border-rose-500/30">
        <motion.div
          className="w-3.5 h-3.5 rounded-full border-2 border-rose-400/40 border-t-rose-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-sm font-semibold text-rose-300">Verifying location…</span>
      </div>
    );
  }

  if (state === "locating") {
    return (
      <div className="flex items-center justify-center gap-2 h-14 rounded-full bg-white/[0.06] border border-white/16">
        <motion.div
          className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
        />
        <span className="text-sm font-semibold text-white/60">Getting location…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {partnerCheckedIn && state !== "error" && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300 font-medium">
            {partnerName} is already there — your turn!
          </p>
        </div>
      )}

      {state === "error" && errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{errorMsg}</p>
        </div>
      )}

      <Button onClick={handleCheckIn} size="lg" className="w-full gap-2">
        <MapPin className="w-5 h-5" />
        Check In
      </Button>
    </div>
  );
}
