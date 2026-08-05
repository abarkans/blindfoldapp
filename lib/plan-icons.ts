import { Calendar, LayoutGrid, Sparkles, MapPin, RefreshCw, Zap, Camera, Wand2, Gift, Tag, Shuffle, Award } from "lucide-react";

// Matched by index to PLANS.find(p => p.id === "subscription").features in lib/plans.ts.
export const PLUS_FEATURE_ICONS = [
  Calendar,
  LayoutGrid,
  Sparkles,
  MapPin,
  RefreshCw,
  Zap,
  Camera,
  Wand2,
];

// Matched by index to PLANS.find(p => p.id === "free").features in lib/plans.ts.
export const FREE_FEATURE_ICONS = [
  Gift,
  Tag,
  Shuffle,
  MapPin,
  RefreshCw,
  Award,
];
