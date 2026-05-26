/**
 * Feature flags lidas em build-time via Vite (`import.meta.env`).
 * Configure no `.env` do servidor (ver `.env.example`).
 */
export const GOVBR_ENABLED =
  String(import.meta.env.VITE_GOVBR_ENABLED ?? "").toLowerCase() === "true";

/** Quando true, exibe o botão "Entrar com Microsoft 365 (Entra ID)" na tela de login. */
export const ENTRA_ENABLED =
  String(import.meta.env.VITE_ENTRA_ENABLED ?? "").toLowerCase() === "true";
