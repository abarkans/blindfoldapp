"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ArrowLeft, Navigation, AlertCircle } from "lucide-react";
import Slider from "@/components/ui/Slider";
import Button from "@/components/ui/Button";

export interface LocationFormData {
  lat: number;
  lng: number;
  preferred_radius: number; // meters
}

interface StepLocationProps {
  defaultValues?: Partial<LocationFormData>;
  onNext: (data: LocationFormData) => void;
  onBack: () => void;
  loading?: boolean;
}

type Status = "idle" | "requesting" | "granted" | "denied" | "fallback";

export default function StepLocation({ defaultValues, onNext, onBack, loading }: StepLocationProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [lat, setLat] = useState<number | null>(defaultValues?.lat ?? null);
  const [lng, setLng] = useState<number | null>(defaultValues?.lng ?? null);
  const [radiusKm, setRadiusKm] = useState(
    defaultValues?.preferred_radius ? defaultValues.preferred_radius / 1000 : 10
  );
  const [cityInput, setCityInput] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState("");

  function handleAllowLocation() {
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setStatus("granted");
      },
      () => {
        setStatus("denied");
      },
      { timeout: 10000 }
    );
  }

  async function handleCitySearch() {
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    setCityLoading(true);
    setCityError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await res.json();
      if (!results.length) {
        setCityError("Location not found. Try a different city or zip code.");
        return;
      }
      setLat(parseFloat(results[0].lat));
      setLng(parseFloat(results[0].lon));
      setStatus("granted");
    } catch {
      setCityError("Could not look up that location. Check your connection.");
    } finally {
      setCityLoading(false);
    }
  }

  function handleSubmit() {
    if (lat === null || lng === null) return;
    onNext({ lat, lng, preferred_radius: radiusKm * 1000 });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Where are you based?</h2>
        <p className="text-white/50 text-sm">
          We&apos;ll use this to suggest real venues near you.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-br from-pink-500/10 to-rose-500/5 border border-pink-500/20 rounded-3xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Blindfold uses your location to find <span className="text-white font-medium">real, highly-rated venues</span> near you — restaurants, parks, galleries and more.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={handleAllowLocation}>
              <MapPin className="w-4 h-4 mr-2" />
              Allow Location Access
            </Button>
            <button
              type="button"
              onClick={() => setStatus("fallback")}
              className="text-xs text-white/35 hover:text-white/60 transition-colors text-center"
            >
              Enter city manually instead
            </button>
          </motion.div>
        )}

        {status === "requesting" && (
          <motion.div
            key="requesting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-pink-500/30 border-t-pink-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-sm text-white/50">Waiting for your browser…</p>
          </motion.div>
        )}

        {status === "denied" && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white/80">Location access denied</p>
              <p className="text-xs text-white/40 mt-0.5">No worries — search for your city below.</p>
            </div>
          </motion.div>
        )}

        {status === "granted" && lat !== null && (
          <motion.div
            key="granted"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Location set!</p>
              <p className="text-xs text-white/40 mt-0.5">
                {lat.toFixed(4)}, {lng!.toFixed(4)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setStatus("fallback"); setLat(null); setLng(null); }}
              className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Change
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual city search — shown when denied or fallback */}
      {(status === "denied" || status === "fallback") && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder="City name or zip code…"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCitySearch()}
                className="w-full pl-9 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-pink-500/60 transition-colors"
              />
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleCitySearch}
              loading={cityLoading}
              className="px-4 shrink-0"
            >
              Go
            </Button>
          </div>
          {cityError && (
            <p className="text-xs text-red-400">{cityError}</p>
          )}
        </motion.div>
      )}

      {/* Radius slider — always shown */}
      <div className="flex flex-col gap-2">
        <Slider
          label="Search Radius"
          value={radiusKm}
          onChange={setRadiusKm}
          min={1}
          max={30}
          step={1}
          formatValue={(v) => `${v} km`}
        />
        <div className="flex justify-between text-[10px] text-white/25 px-1">
          <span>Walking distance</span>
          <span>Driving / Public transport</span>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="secondary" size="lg" className="w-14 shrink-0 px-0" onClick={onBack} aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          disabled={lat === null}
          loading={loading}
          onClick={handleSubmit}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
