export type AppMode = "local" | "hosted";

export const APP_MODE: AppMode =
  import.meta.env.VITE_APP_MODE === "hosted" ? "hosted" : "local";

export function isLocalMode(): boolean {
  return APP_MODE === "local";
}

export function isHostedMode(): boolean {
  return APP_MODE === "hosted";
}
