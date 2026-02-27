import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// ✅ применяем тему ДО Reacts
const savedTheme = localStorage.getItem('theme') || 'light-theme';
document.body.classList.add(savedTheme);

createRoot(document.getElementById('root')).render(
  <App />
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("SW registered"))
      .catch(err => console.log("SW error", err));
  });
}
