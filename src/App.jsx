import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import { useEffect, useState } from 'react';
import { AliveScope, KeepAlive } from 'react-activation';
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";

import './App.scss';
import './reset.css';

import WelcomeScreen from './components/WelcomeScreen'
import PWAInstallBanner from './components/PWAInstallBanner'

import Home from './pages/Home';

import Contacts from './pages/Contacts';
import ContactsGolden from './pages/Contacts/ContactsGolden';
import ContactsOasis from './pages/Contacts/ContactsOasis';

import Price from './pages/Price';

import Cart from './pages/Cart';

import Others from './pages/Others';
import ConverterPage from './pages/Others/ConverterPage';
import FAQPage from './pages/Others/FAQPage';

import Footer from './layouts/Footer';

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

// ———————————————
// Основной компонент
function App() {
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    setIsInstalled(standalone);
  }, []);

  return (
    <div className="app-container">
      <CartProvider>
        <ToastProvider>
          <Router>

            {welcomeVisible && (
              <WelcomeScreen onFinish={() => setWelcomeVisible(false)} />
            )}

            {!welcomeVisible && !isInstalled && (
              <PWAInstallBanner />
            )}

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

                <Route
                  path="/contacts"
                  element={
                    <KeepAlive cacheKey="contacts">
                      <Contacts />
                    </KeepAlive>
                  }
                />

                <Route
                  path="/contacts/golden"
                  element={
                    <KeepAlive cacheKey="contacts">
                      <ContactsGolden />
                    </KeepAlive>
                  }
                />

                <Route
                  path="/contacts/oasis"
                  element={
                    <KeepAlive cacheKey="contacts">
                      <ContactsOasis />
                    </KeepAlive>
                  }
                />

                <Route
                  path="/price"
                  element={
                    <KeepAlive cacheKey="price">
                      <Price />
                    </KeepAlive>
                  }
                />

                <Route
                  path="/cart"
                  element={<Cart />}
                />

                <Route
                  path="/others"
                  element={
                    <Others />
                  }
                />

                <Route path="/others/converter" element={<ConverterPage />} />
                <Route path="/others/faq" element={<FAQPage />} />


                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </AliveScope>

            <Footer />

          </Router>
        </ToastProvider>
      </CartProvider>
    </div>
  );
}


export default App;
