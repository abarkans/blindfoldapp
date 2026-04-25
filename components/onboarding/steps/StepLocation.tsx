"use client";

import { useState, useEffect, useRef } from "react";
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
  isLast?: boolean;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

type Status = "idle" | "requesting" | "granted" | "denied" | "fallback";

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const a = data.address ?? {};
    return a.city || a.town || a.village || a.county || data.display_name?.split(",")[0] || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

export default function StepLocation({ defaultValues, onNext, onBack, loading, isLast }: StepLocationProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [lat, setLat] = useState<number | null>(defaultValues?.lat ?? null);
  const [lng, setLng] = useState<number | null>(defaultValues?.lng ?? null);
  const [locationLabel, setLocationLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(
    defaultValues?.preferred_radius ? defaultValues.preferred_radius / 1000 : 10
  );
  const [cityInput, setCityInput] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [cityError, setCityError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus city input when switching to manual entry.
  // The longer delay lets the Framer Motion animation settle before focusing,
  // which is needed for the keyboard to appear on some Android browsers.
  // On iOS Safari, autoFocus on the input handles it via the user-gesture chain.
  useEffect(() => {
    if (status === "fallback" || status === "denied") {
      const t = setTimeout(() => cityInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = cityInput.trim();
    if (trimmed.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } }
        );
        const results: NominatimResult[] = await res.json();
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 350);
  }, [cityInput]);

  function handleAllowLocation() {
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        const label = await reverseGeocode(latitude, longitude);
        setLocationLabel(label);
        setStatus("granted");
      },
      () => {
        setStatus("denied");
      },
      { timeout: 10000 }
    );
  }

  function selectSuggestion(result: NominatimResult) {
    const parsedLat = parseFloat(result.lat);
    const parsedLng = parseFloat(result.lon);
    setLat(parsedLat);
    setLng(parsedLng);
    // Use the first meaningful part of display_name as label
    const label = result.display_name.split(",").slice(0, 2).join(",").trim();
    setLocationLabel(label);
    setCityInput("");
    setSuggestions([]);
    setCityError("");
    setStatus("granted");
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
              className="h-8 flex items-center justify-center text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer"
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
              <p className="text-xs text-white/40 mt-0.5">{locationLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => { setStatus("fallback"); setLat(null); setLng(null); setLocationLabel(""); }}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            {suggestionsLoading && (
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
            <input
              ref={cityInputRef}
              type="text"
              placeholder="Search city or town…"
              value={cityInput}
              onChange={(e) => { setCityInput(e.target.value); setCityError(""); }}
              className="w-full pl-9 pr-9 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-pink-500/60 transition-colors"
              style={{ fontSize: "16px" }}
            />
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-white/30 shrink-0" />
                    <span className="text-sm text-white/70 truncate">
                      {s.display_name.split(",").slice(0, 3).join(",")}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {cityError && <p className="text-xs text-red-400">{cityError}</p>}
        </motion.div>
      )}

      {/* Radius slider — always shown */}
      <div className="flex flex-col gap-2">
        <Slider
          label="Search Radius"
          value={radiusKm}
          onChange={setRadiusKm}
          min={1}
          max={50}
          step={1}
          formatValue={(v) => `${v} km`}
        />
        <div className="flex justify-between text-[10px] text-white/25 px-1">
          <span>Walking distance</span>
          <span>Long drive / Countryside</span>
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
          {isLast ? "Finish Setup" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
