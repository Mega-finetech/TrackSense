import { useState, useEffect } from 'react';

let deferredPrompt = null;

// Capture the install event globally as early as possible
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    if (deferredPrompt) setCanInstall(true);

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      setCanInstall(false);
      setIsInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return { canInstall, isInstalled, isStandalone, promptInstall };
}
