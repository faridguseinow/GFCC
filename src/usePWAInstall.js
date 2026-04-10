import { useEffect, useState } from 'react';

export function usePWAInstall() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const dismissed = localStorage.getItem('pwaDismissed');

    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => {
        setShowBanner(true);
      }, 1200); // небольшая пауза после splash
    }
  }, []);

  const closeBanner = () => {
    localStorage.setItem('pwaDismissed', 'true');
    setShowBanner(false);
  };

  return { showBanner, closeBanner };
}