import { getPriceLevelLabel } from "@/lib/places/search";

export interface DateTeaser {
  vibe: string;
  activity_level: string;
  price: string;
  hook: string;
}

type AIShape = {
  vibe?: string;
  duration?: string;
  budget_range?: string;
  mission?: string;
  preparation?: string;
  tags?: string[];
};

type IdeaShape = {
  type?: string;
  price_level?: string;
  meta?: {
    primary_type_display_name?: string;
    live_music?: boolean;
    serves_dinner?: boolean;
    reservable?: boolean;
  };
  ai?: AIShape | null;
  vibe?: string;
  duration?: string;
  budget_range?: string;
  mission?: string;
  preparation?: string;
  tags?: string[];
};

export function createDateTeaser(idea: unknown): DateTeaser {
  const i = idea as IdeaShape;
  const ai = i.ai ?? i;
  const tags = ai.tags ?? i.tags ?? [];
  const primaryType = i.meta?.primary_type_display_name;

  return {
    vibe: sanitizeHint(ai.vibe || tags.slice(0, 2).join(" & ") || primaryType || "Mystery energy"),
    activity_level: inferActivityLevel(ai, primaryType),
    price: sanitizeHint(ai.budget_range || (i.price_level ? getPriceLevelLabel(i.price_level) : "") || "TBD"),
    hook: buildHook(i, ai),
  };
}

function inferActivityLevel(ai: AIShape, primaryType?: string): string {
  const text = `${primaryType ?? ""} ${(ai.tags ?? []).join(" ")} ${ai.duration ?? ""}`.toLowerCase();
  if (/park|hike|trail|fitness|bowling|arcade|walk|walking|tour|beach/.test(text)) {
    return "Medium (Moving around)";
  }
  if (/dance|climb|sport|gym|adventure/.test(text)) {
    return "High (Active)";
  }
  return "Low (Sitting/Talking)";
}

function buildHook(idea: IdeaShape, ai: AIShape): string {
  if (idea.meta?.live_music) return "Arrive with enough time to catch the atmosphere as it starts.";
  if (idea.meta?.serves_dinner) return "Come hungry, but leave room for one shared decision.";
  if (idea.meta?.reservable) return "Timing matters here, so do not leave the plan too late.";
  if (ai.preparation) return sanitizeHint(ai.preparation);
  if (ai.mission) return sanitizeHint(ai.mission);
  return "There is one small twist waiting once you arrive.";
}

function sanitizeHint(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 140);
}
