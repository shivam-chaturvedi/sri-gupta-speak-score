const DEFAULT_GA_MEASUREMENT_ID = "G-7TYF234V14";

export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;

type GtagFn = (command: string, targetIdOrEventName: string, params?: Record<string, unknown>) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

export function gaPageView(pagePath: string) {
  if (!import.meta.env.PROD) return;
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", "page_view", {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function gaEvent(eventName: string, params?: Record<string, unknown>) {
  if (!import.meta.env.PROD) return;
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, params);
}
