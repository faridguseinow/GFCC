import { Capacitor, CapacitorHttp } from "@capacitor/core";

const APP_VERSION = "1.6.1";
const VISITOR_ID_KEY = "gfcc_anonymous_visitor_id";
const VISIT_SESSION_KEY = "gfcc_visit_reported";
const VISITS_API_URL = (
  import.meta.env.VITE_APP_VISITS_API_URL || "https://gfcc-oasis.ru/api/app-visits.php"
).trim();
const DISTRIBUTION_CHANNEL = String(import.meta.env.VITE_DISTRIBUTION_CHANNEL || "").toLowerCase();

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

const createVisitorId = () => {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

const getVisitorId = () => {
  try {
    const saved = localStorage.getItem(VISITOR_ID_KEY);
    if (saved) return saved;

    const created = createVisitorId();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    return createVisitorId();
  }
};

export const detectAppSource = () => {
  if (isNative()) {
    return DISTRIBUTION_CHANNEL === "rustore" ? "rustore" : "apk";
  }

  if (window.Telegram?.WebApp || /Telegram/i.test(navigator.userAgent)) {
    return "telegram";
  }

  const standalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;

  return standalone ? "pwa" : "web";
};

export async function registerAppVisit(hasClientCard) {
  const source = detectAppSource();

  try {
    if (sessionStorage.getItem(VISIT_SESSION_KEY) === source) {
      return false;
    }
  } catch {
    // Continue without session de-duplication.
  }

  const body = {
    visitorId: getVisitorId(),
    source,
    appVersion: APP_VERSION,
    hasClientCard: Boolean(hasClientCard)
  };

  if (isNative()) {
    const response = await CapacitorHttp.post({
      url: VISITS_API_URL,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      data: body,
      connectTimeout: 10000,
      readTimeout: 10000
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
  } else {
    const response = await fetch(VISITS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  try {
    sessionStorage.setItem(VISIT_SESSION_KEY, source);
  } catch {
    // Ignore storage errors after a successful request.
  }

  return true;
}
