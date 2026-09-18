import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { weddingData } from '../../data/weddingData';

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioSrc = weddingData.musica?.audioSrc || './audio/musica_sposi.mp3';
  const songTitle = weddingData.musica?.titolo || 'Canon in D Major — Johann Pachelbel';

  // Synchronize audio volume and global play helper
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
    }

    // Expose global helper for seamless gesture triggers
    (window as unknown as { playWeddingAudio?: () => Promise<boolean> }).playWeddingAudio = async () => {
      if (!audioRef.current) return false;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return true;
      } catch (err) {
        console.warn('Playback gesture required or prevented by browser:', err);
        return false;
      }
    };

    return () => {
      delete (window as unknown as { playWeddingAudio?: () => Promise<boolean> }).playWeddingAudio;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Could not start audio:', err);
      });
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      {/* Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        id="bg-wedding-audio"
        src={audioSrc}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Tooltip / Label */}
      <div
        className={`hidden sm:flex items-center px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-serif tracking-wider transition-all duration-300 shadow-lg ${
          isPlaying ? 'opacity-90' : 'opacity-70 hover:opacity-100'
        }`}
      >
        <span className="text-gold-foil mr-1.5">♪</span>
        <span>{isPlaying ? `In riproduzione: ${songTitle}` : 'Tocca per ascoltare la musica'}</span>
      </div>

      {/* 33 RPM Vinyl Record Button */}
      <button
        onClick={togglePlay}
        title={isPlaying ? 'Pausa musica' : 'Riproduci musica'}
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95 shadow-[0_8px_25px_rgba(0,0,0,0.45)]"
        aria-label={isPlaying ? 'Pausa musica' : 'Riproduci musica'}
      >
        {/* Vinyl Disc Body with Realistic Concentric Grooves */}
        <div
          className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-spin' : ''}`}
          style={{
            background:
              'radial-gradient(circle at center, #8C6B28 0%, #C5A059 22%, #111111 22.5%, #1c1c1c 26%, #111111 26.5%, #222222 35%, #111111 35.5%, #1a1a1a 50%, #111111 50.5%, #252525 70%, #111111 70.5%, #1f1f1f 85%, #0d0d0d 100%)',
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.12)',
            animationDuration: '3.2s',
          }}
        >
          {/* Vinyl Grooves Sheen */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-30"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.2) 45deg, transparent 90deg, rgba(255,255,255,0.2) 135deg, transparent 180deg, rgba(255,255,255,0.2) 225deg, transparent 270deg, rgba(255,255,255,0.2) 315deg, transparent 360deg)',
            }}
          />

          {/* Golden Center Label */}
          <div
            className="absolute inset-[30%] rounded-full flex flex-col items-center justify-center shadow-inner border border-gold-accent/50"
            style={{
              background: 'radial-gradient(circle at 40% 40%, #DFBE79 0%, #C5A059 70%, #8C6B28 100%)',
            }}
          >
            {/* Center Monogram */}
            <span className="font-script text-[10px] sm:text-xs text-wedding-charcoal font-bold tracking-tight select-none">
              F & F
            </span>
            {/* Center Spindle Hole */}
            <div className="w-1.5 h-1.5 rounded-full bg-black/90 shadow-inner" />
          </div>
        </div>

        {/* Center Steady Icon (Doesn't spin) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-gold-champagne shadow-md">
            {isPlaying ? (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-accent animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/90" />
            )}
          </div>
        </div>
      </button>
    </div>
  );
};

