import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

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
