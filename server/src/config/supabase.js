import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const getStorageBucket = (category = "general") =>
  category === "profiles"
    ? process.env.SUPABASE_PROFILE_BUCKET || "profile-images"
    : process.env.SUPABASE_STORAGE_BUCKET || "property-images";
