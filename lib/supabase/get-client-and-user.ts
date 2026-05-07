import { cache } from "react";
import { createClient } from "./server";

export const getClientAndUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});
