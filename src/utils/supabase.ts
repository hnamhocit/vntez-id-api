import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Bindings } from "../types/bindings";

/**
 * Khởi tạo Supabase Admin Client scoped theo request environment bindings
 */
export function getSupabaseAdmin(env: Bindings): SupabaseClient {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
