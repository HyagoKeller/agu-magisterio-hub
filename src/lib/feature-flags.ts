/**
 * Feature flags lidas em build-time via Vite (`import.meta.env`).
 * Configure no `.env` do servidor (ver `.env.example`).
 */
export const GOVBR_ENABLED =
  String(import.meta.env.VITE_GOVBR_ENABLED ?? "").toLowerCase() === "true";
