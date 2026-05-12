"use client";

import { Home, MapPin, Shuffle } from "lucide-react";
import Dialog from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (choice: "outside" | "home" | "auto") => void;
}

export default function LocationPickerModal({ open, onClose, onSelect }: LocationPickerModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="mb-5">
        <h3 className="text-lg font-bold text-white mb-1">Where&apos;s tonight?</h3>
        <p className="text-sm text-white/55">
          Pick a vibe and we&apos;ll plan the rest.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" className="w-full gap-2" onClick={() => onSelect("outside")}>
          <MapPin className="w-4 h-4" />
          Go Somewhere
        </Button>

        <Button type="button" size="lg" className="w-full gap-2" onClick={() => onSelect("home")}>
          <Home className="w-4 h-4" />
          Stay at Home
        </Button>

        <Button type="button" variant="secondary" size="lg" className="w-full gap-2" onClick={() => onSelect("auto")}>
          <Shuffle className="w-4 h-4" />
          Let App Decide
        </Button>

        <Button type="button" variant="ghost" onClick={onClose} className="w-full mt-1">
          Cancel
        </Button>
      </div>
    </Dialog>
  );
}
