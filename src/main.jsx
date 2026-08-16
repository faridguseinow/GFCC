import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

let bootReloading = false;
const BOOT_RELOAD_VERSION = "1.5.2";
const BOOT_RELOAD_PARAM = "gfcc_boot";
const BOOT_RELOAD_KEY = `gfcc_boot_reload_${BOOT_RELOAD_VERSION}`;

try {
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const url = new URL(window.location.href);
  const alreadyReloaded = sessionStorage.getItem(BOOT_RELOAD_KEY) === "1";

  if (
    isStandalone &&
    !alreadyReloaded &&
    url.searchParams.get(BOOT_RELOAD_PARAM) !== BOOT_RELOAD_VERSION
  ) {
    bootReloading = true;
    sessionStorage.setItem(BOOT_RELOAD_KEY, "1");
    url.searchParams.set(BOOT_RELOAD_PARAM, BOOT_RELOAD_VERSION);
    window.location.replace(url.toString());
  }
} catch {
  // ignore startup reload errors
}

if (!bootReloading) {
  try {
    const redirectPath = sessionStorage.getItem('gfcc_spa_redirect');
    const currentPath =
      window.location.pathname + window.location.search + window.location.hash;

    if (redirectPath) {
      sessionStorage.removeItem('gfcc_spa_redirect');

      if (redirectPath !== currentPath) {
        window.history.replaceState(null, '', redirectPath);
      }
    }
  } catch {
    // ignore storage errors
  }

  // ✅ применяем тему ДО React
  const savedTheme = localStorage.getItem('theme') || 'light-theme';
  document.body.classList.add(savedTheme);

  createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js");
    });
  }
}
