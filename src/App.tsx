import React, { useState, useEffect } from 'react';
import { UnboxingEnvelope } from './components/unboxing/UnboxingEnvelope';
import { Navbar } from './components/common/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { Timeline } from './components/ceremony/Timeline';
import { VenueMap } from './components/location/VenueMap';
import { RsvpSection } from './components/rsvp/RsvpSection';
import { GiftSection } from './components/gift/GiftSection';
import { HashtagSection } from './components/social/HashtagSection';
import { DressCode } from './components/dresscode/DressCode';
import { SposiCRM } from './components/crm/SposiCRM';
import { AudioPlayer } from './components/common/AudioPlayer';
import { Toast, ToastMessage } from './components/common/Toast';
import { Footer } from './components/footer/Footer';
import { DeviceSimulator } from './components/common/DeviceSimulator';
import { WinterSnow } from './components/common/WinterSnow';
import { WeddingThemeProvider, useWeddingTheme } from './theme/WeddingThemeContext';

export const AppContent: React.FC = () => {
  const { isWinter, isV3 } = useWeddingTheme();
  const [isOpened, setIsOpened] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('sposi') || params.has('admin') || params.has('crm') || window.location.pathname.endsWith('/crm')) {
        setIsAdminOpen(true);
      }
    }
  }, []);

  // Riflette V2 (invernale) e V3 (midnight gala) anche su <body> (background e scrollbar)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('theme-winter', isWinter);
    document.body.classList.toggle('theme-midnight', isV3);
    return () => {
      document.body.classList.remove('theme-winter');
      document.body.classList.remove('theme-midnight');
    };
  }, [isWinter, isV3]);

  const addToast = (text: string, type: 'success' | 'info' | 'gold' | 'heart' = 'gold') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div
      className={`min-h-screen bg-amalfi-base text-wedding-charcoal font-sans selection:bg-gold-champagne selection:text-wedding-charcoal ${
        isWinter ? 'theme-winter' : ''
      } ${isV3 ? 'theme-midnight' : ''}`}
    >
      {(isWinter || isV3) && <WinterSnow />}
      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
      <AudioPlayer />
      <Toast messages={toasts} onDismiss={removeToast} />

      {!isOpened && (
        <UnboxingEnvelope
          onOpenStart={() => {
            const audioEl = document.getElementById('bg-wedding-audio') as HTMLAudioElement | null;
            if (audioEl && audioEl.paused) {
              audioEl.play().catch(() => {});
            }
          }}
          onOpenComplete={() => setIsOpened(true)}
        />
      )}

      <main className="animate-fadeIn transition-opacity duration-1000">
        <HeroSection onNotify={text => addToast(text, 'gold')} />
        <Timeline onNotify={text => addToast(text, 'gold')} />
        <VenueMap />
        <RsvpSection onNotify={text => addToast(text, 'heart')} />
        <GiftSection onNotify={text => addToast(text, 'success')} />
        <HashtagSection onNotify={text => addToast(text, 'gold')} />
        <DressCode />
        <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

        <SposiCRM
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onNotify={text => addToast(text, 'gold')}
          onSongChange={newUrl => {
            const audioEl = document.getElementById('bg-wedding-audio') as HTMLAudioElement | null;
            if (audioEl) {
              audioEl.src = newUrl;
              audioEl.play().catch(() => {});
            }
          }}
        />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WeddingThemeProvider>
      <DeviceSimulator>
        <AppContent />
      </DeviceSimulator>
    </WeddingThemeProvider>
  );
};

export default App;
