"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getClientAndUser } from "@/lib/supabase/get-client-and-user";
import { getCoupleAccess } from "@/lib/partner-invites";
import { revalidatePath } from "next/cache";

export interface DatePhoto {
  id: string;
  date_idea_id: string;
  profile_id: string;
  uploader_user_id: string;
  r2_key: string;
  created_at: string;
}

export async function savePhoto(
  dateIdeaId: string,
  r2Key: string
): Promise<{ error?: string }> {
  const { user } = await getClientAndUser();
  if (!user) return { error: "Unauthorized" };

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { error } = await admin.from("date_photos").insert({
    date_idea_id: dateIdeaId,
    profile_id: access.profileId,
    uploader_user_id: user.id,
    r2_key: r2Key,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return {};
}

export async function getPhotosForDate(dateIdeaId: string): Promise<DatePhoto[]> {
  const { user } = await getClientAndUser();
  if (!user) return [];

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data } = await admin
    .from("date_photos")
    .select("id, date_idea_id, profile_id, uploader_user_id, r2_key, created_at")
    .eq("date_idea_id", dateIdeaId)
    .eq("profile_id", access.profileId)
    .order("created_at", { ascending: true });

  return (data ?? []) as DatePhoto[];
}

export interface CompletedDateWithPhotos {
  id: string;
  idea: Record<string, unknown>;
  revealed_at: string | null;
  photos: DatePhoto[];
}

export async function getDateHistory(): Promise<CompletedDateWithPhotos[]> {
  const { user } = await getClientAndUser();
  if (!user) return [];

  const admin = createAdminClient();
  const access = await getCoupleAccess(admin, user.id);

  const { data: ideas } = await admin
    .from("date_ideas")
    .select("id, idea, revealed_at")
    .eq("user_id", access.profileId)
    .eq("status", "completed")
    .order("revealed_at", { ascending: false });

  if (!ideas?.length) return [];

  const ideaIds = ideas.map((i) => i.id);
  const { data: photos } = await admin
    .from("date_photos")
    .select("id, date_idea_id, profile_id, uploader_user_id, r2_key, created_at")
    .in("date_idea_id", ideaIds)
    .eq("profile_id", access.profileId);

  const photosByDate = new Map<string, DatePhoto[]>();
  for (const p of photos ?? []) {
    const list = photosByDate.get(p.date_idea_id) ?? [];
    list.push(p as DatePhoto);
    photosByDate.set(p.date_idea_id, list);
  }

  return ideas.map((idea) => ({
    id: idea.id,
    idea: idea.idea as Record<string, unknown>,
    revealed_at: idea.revealed_at,
    photos: photosByDate.get(idea.id) ?? [],
  }));
}
