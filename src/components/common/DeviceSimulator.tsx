import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface DeviceSimulatorProps {
  children: React.ReactNode;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({ children }) => {
  // Nessuno switch di versione esposto: la V2 Natale è la versione ufficiale scelta dagli sposi.
  const { theme, isWinter, isV3 } = useWeddingTheme();
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [mode, setMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Check if current execution is inside the iframe
  const isInsideIframe =
    typeof window !== 'undefined' &&
    (window.self !== window.top ||
      new URLSearchParams(window.location.search).get('view') === 'inner');

  useEffect(() => {
    setIsMounted(true);
    const checkViewport = () => {
      if (typeof window === 'undefined') return;
      // Real phone viewport detection: narrow window OR touch device with screen width < 768
      const hasTouch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      const screenShort =
        typeof window.screen !== 'undefined'
          ? Math.min(window.screen.width || 0, window.screen.height || 0)
          : 0;
      const isMobile =
        window.innerWidth < 768 || (hasTouch && screenShort > 0 && screenShort < 768);
      setIsMobileViewport(isMobile);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // 1. If inside iframe, always render children directly (this is the inner mobile view)
  if (isInsideIframe) {
    return <>{children}</>;
  }

  // 2. If on a real mobile device (viewport < 768px), render children directly without mockup or toggle
  if (isMobileViewport) {
    return <>{children}</>;
  }

  // Calculate the iframe URL for the simulator
  const themeParam = theme === 'v3' ? '3' : isWinter ? '2' : '1';
  const iframeUrl =
    typeof window !== 'undefined'
      ? `${window.location.pathname}?v=${themeParam}&view=inner`
      : `./?v=${themeParam}&view=inner`;

  return (
    <div className="relative min-h-screen w-full">
      {/* Desktop Floating Viewport Switcher (solo anteprima desktop, mai sui telefoni reali).
          Nessuna selezione di versione: gli invitati vedono sempre la V2 Natale ufficiale. */}
      <aside
        aria-label="Controlli anteprima"
        className="fixed top-4 right-4 z-[99999] flex items-center gap-1.5 p-1.5 rounded-full bg-black/90 backdrop-blur-xl border border-gold-accent/40 shadow-2xl text-xs font-serif select-none animate-fadeIn"
      >
        {/* Viewport Switcher */}
        <button
          type="button"
          onClick={() => setMode('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            mode === 'mobile'
              ? 'bg-white/20 text-white font-medium shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="Attiva visualizzazione smartphone"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Smartphone</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer ${
            mode === 'desktop'
              ? 'bg-white/20 text-white font-medium shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
          aria-label="Attiva visualizzazione a schermo intero"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Schermo Intero</span>
        </button>
      </aside>

      {/* Mode A: Fullscreen Desktop Mode */}
      {mode === 'desktop' && (
        <div className="w-full min-h-screen animate-fadeIn transition-opacity duration-500">
          {children}
        </div>
      )}

      {/* Mode B: Luxury Smartphone Simulator Mode (Default on Desktop) */}
      {mode === 'mobile' && isMounted && (
        <div
          className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden select-none animate-fadeIn ${
            isV3 ? 'bg-[#040912]' : isWinter ? 'bg-[#180408]' : 'bg-[#17130c]'
          }`}
        >
          {/* Ambient Stage Background: Luxury Vignette & Subtle Warmth (V2: velluto bordeaux, V3: notte reale) */}
          <div
            className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] pointer-events-none ${
              isV3
                ? 'from-[#122A54] via-[#0B172B] to-[#02060D]'
                : isWinter
                ? 'from-[#4A0E1A] via-[#20050B] to-[#0A0204]'
                : 'from-[#2a2114] via-[#17130c] to-[#0a0805]'
            }`}
          />

          {/* Background Ambient Branding */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 text-center pointer-events-none">
            <p className="font-serif text-[11px] sm:text-xs uppercase tracking-[0.3em] text-gold-accent/50 font-light">
              La Terra degli Aranci • Anteprima WhatsApp Sposi
            </p>
          </div>

          {/* Smartphone Hardware Frame (Brushed Gold Titanium / Obsidian Chassis) */}
          <div className="relative z-10 w-[393px] h-[min(92vh,844px)] rounded-[50px] p-[11px] bg-gradient-to-b from-[#382c1a] via-[#14120e] to-[#382c1a] shadow-[0_30px_90px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.4),inset_0_1px_3px_rgba(255,255,255,0.25)] transition-transform duration-500 hover:scale-[1.005]">
            {/* Left Hardware Button Silhouettes (Volume & Silent Switch) */}
            <div className="absolute -left-[3px] top-28 w-[3px] h-7 bg-[#241c10] rounded-l-sm" />
            <div className="absolute -left-[3px] top-40 w-[3px] h-12 bg-[#241c10] rounded-l-sm" />
            <div className="absolute -left-[3px] top-56 w-[3px] h-12 bg-[#241c10] rounded-l-sm" />

            {/* Right Hardware Button Silhouette (Power) */}
            <div className="absolute -right-[3px] top-36 w-[3px] h-16 bg-[#241c10] rounded-r-sm" />

            {/* Inner Screen Chassis */}
            <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-black shadow-inner ring-1 ring-black">
              {/* Seamless Screen iFrame */}
              <iframe
                key={iframeUrl}
                src={iframeUrl}
                title="Anteprima Invito Digitale Francesca & Ferdinando"
                className="w-full h-full border-0 rounded-[40px] bg-amalfi-base"
                allow="autoplay; fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSimulator;
