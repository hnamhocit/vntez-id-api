/**
 * Định nghĩa Cloudflare Workers Bindings & Hono Context Variables
 */
export interface Bindings {
  // Environment identifier
  ENVIRONMENT?: string;

  // Domain & Client Origins
  NEXT_PUBLIC_SITE_URL: string;
  NEXT_PUBLIC_WEB_URL?: string;
  ALLOWED_ORIGINS?: string;

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;

  // JWT & Security Secrets
  VNTEZ_JWT_SECRET: string;
  VNTEZ_JWT_PRIVATE_KEY?: string;
  VNTEZ_JWT_PUBLIC_KEY?: string;

  // Cloudflare Storage Bindings (Optional)
  OAUTH_CACHE?: KVNamespace;
}

export interface Variables {
  requestId: string;
  startTime: number;
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatar?: string | null;
  };
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}
