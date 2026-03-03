import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';

import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

import { useEffect, useState } from 'react';
import { AliveScope, KeepAlive } from 'react-activation';

import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";

import './App.scss';
import './reset.css';

import WelcomeScreen from './components/WelcomeScreen'
import PWAInstallBanner from './components/PWAInstallBanner'

import Home from './pages/Home';

import Contacts from './pages/Contacts';

import Price from './pages/Price';

import Cart from './pages/Cart';

import Others from './pages/Others';
import ConverterPage from './pages/Others/ConverterPage';
import FAQPage from './pages/Others/FAQPage';

import Footer from './layouts/Footer';

import Privacy from "./pages/Others/Privacy";
import Terms from "./pages/Others/Terms";

// ———————————————
// Scroll Restoration (всё кроме /price)
function ScrollHandler() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/price') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return null;
}

function App() {
  const [appReady, setAppReady] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(true);

  const handleWelcomeReady = async () => {
    setAppReady(true);

    if (Capacitor.isNativePlatform()) {
      await SplashScreen.hide();
    }
  };

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(false);


  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const listener = CapacitorApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [location]);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsInstalled(standalone);
  }, []);

  useEffect(() => {
    const handleFocusIn = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        setKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setKeyboardOpen(false);
    };

    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return (
    <ThemeProvider>
      <div className="app-container">
        <CartProvider>
          <ToastProvider>

            {welcomeVisible ? (
              <WelcomeScreen
                onFinish={() => setWelcomeVisible(false)}
                onReady={handleWelcomeReady}
              />
            ) : (
              <>
                {!isInstalled && <PWAInstallBanner />}

                <ScrollHandler />

                <AliveScope>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <KeepAlive cacheKey="home">
                          <Home />
                        </KeepAlive>
                      }
                    />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route
                      path="/price"
                      element={
                        <KeepAlive cacheKey="price">
                          <Price />
                        </KeepAlive>
                      }
                    />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/others" element={<Others />} />
                    <Route path="/others/converter" element={<ConverterPage />} />
                    <Route path="/others/faq" element={<FAQPage />} />
                    <Route path="/others/privacy" element={<Privacy />} />
                    <Route path="/others/terms" element={<Terms />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AliveScope>

                {!keyboardOpen && <Footer />}
              </>
            )}

          </ToastProvider>
        </CartProvider>
      </div>
    </ThemeProvider>
  );
}


export default App;
