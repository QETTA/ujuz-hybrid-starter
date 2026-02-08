/**
 * Environment variable typings for `react-native-dotenv`.
 *
 * Only declare variables that are imported from `@env` in client code.
 * Keep `.env.example` as the human-readable reference.
 */

declare module '@env' {
  // Base
  export const API_BASE_URL: string;

  // Supabase
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;

  // Third-party APIs
  export const YOUTUBE_API_KEY: string;
  export const KAKAO_JAVASCRIPT_KEY: string;

  // Mapbox (client-safe)
  export const MAPBOX_PUBLIC_TOKEN: string;
  export const MAPBOX_STYLE_URL: string | undefined;
}
