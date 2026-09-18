import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { detectWeddingTheme, WeddingThemeProvider } from '../src/theme/WeddingThemeContext';
import { AppContent } from '../src/App';
import { HeroSection } from '../src/components/hero/HeroSection';
import { SectionHeading } from '../src/components/common/SectionHeading';
import { WinterSnow } from '../src/components/common/WinterSnow';

function setUrl(path: string) {
  window.history.replaceState({}, '', path);
}

describe('V2 Winter Theme — detection (V2 Natale = default assoluto)', () => {
  afterEach(() => {
    setUrl('/');
    cleanup();
    document.body.classList.remove('theme-winter');
  });

  it('detects V2 from the /v2 path segment', () => {
    setUrl('/invito/v2/');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('detects V2 from the ?v=2 query parameter', () => {
    setUrl('/invito/?v=2');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('uses V2 Natale as default on the clean public URL', () => {
    setUrl('/invito/francesca-e-ferdinando/');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('uses V2 Natale as default when no parameters are present', () => {
    setUrl('/invito/');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('falls back to V2 for unknown v values', () => {
    setUrl('/invito/?v=99');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('still honours the explicit V1 debug override (?v=1)', () => {
    setUrl('/invito/?v=1');
    expect(detectWeddingTheme()).toBe('v1');
  });

  it('still honours the explicit V3 debug override (?v=3)', () => {
    setUrl('/invito/?v=3');
    expect(detectWeddingTheme()).toBe('v3');
  });

  it('detects V2 with combined path and query parameters (iframe preview URL)', () => {
    setUrl('/invito/v2/?v=2&view=inner');
    expect(detectWeddingTheme()).toBe('v2');
  });

  it('defaults to V2 with deep anchors and inner view params', () => {
    setUrl('/invito/francesca-e-ferdinando/?view=inner');
    expect(detectWeddingTheme()).toBe('v2');
  });
});

describe('V2 Winter Theme — application on AppContent', () => {
  afterEach(() => {
    setUrl('/');
    cleanup();
    document.body.classList.remove('theme-winter');
  });

  it('applies theme-winter class, snow overlay and body class by default on the clean URL', () => {
    setUrl('/invito/francesca-e-ferdinando/');
    const { container } = render(
      <WeddingThemeProvider>
        <AppContent />
      </WeddingThemeProvider>
    );

    expect(container.querySelector('.theme-winter')).not.toBeNull();
    expect(screen.getByTestId('winter-snow')).toBeInTheDocument();
    expect(document.body.classList.contains('theme-winter')).toBe(true);
  });

  it('applies theme-winter class, snow overlay and body class in V2', () => {
    setUrl('/invito/?v=2');
    const { container } = render(
      <WeddingThemeProvider>
        <AppContent />
      </WeddingThemeProvider>
    );

    expect(container.querySelector('.theme-winter')).not.toBeNull();
    expect(screen.getByTestId('winter-snow')).toBeInTheDocument();
    expect(document.body.classList.contains('theme-winter')).toBe(true);
  });

  it('keeps the V1 summer layout free of winter classes with the explicit ?v=1 override', () => {
    setUrl('/invito/?v=1');
    const { container } = render(
      <WeddingThemeProvider>
        <AppContent />
      </WeddingThemeProvider>
    );

    expect(container.querySelector('.theme-winter')).toBeNull();
    expect(screen.queryByTestId('winter-snow')).toBeNull();
    expect(document.body.classList.contains('theme-winter')).toBe(false);
  });

  it('removes the body winter class on unmount', () => {
    setUrl('/invito/v2/');
    const { unmount } = render(
      <WeddingThemeProvider>
        <AppContent />
      </WeddingThemeProvider>
    );

    expect(document.body.classList.contains('theme-winter')).toBe(true);
    unmount();
    expect(document.body.classList.contains('theme-winter')).toBe(false);
  });
});

describe('V2 Winter Theme — festive wording & ornaments', () => {
  afterEach(() => {
    setUrl('/');
    cleanup();
  });

  it('shows Ci sposiamo! eyebrow and winter burgundy styles', () => {
    setUrl('/invito/?v=2');
    const v2 = render(
      <WeddingThemeProvider>
        <HeroSection />
      </WeddingThemeProvider>
    );
    expect(screen.getByText('Ci sposiamo!')).toBeInTheDocument();
    v2.unmount();

    setUrl('/invito/?v=1');
    render(
      <WeddingThemeProvider>
        <HeroSection />
      </WeddingThemeProvider>
    );
    expect(screen.getByText('Ci sposiamo!')).toBeInTheDocument();
  });

  it('swaps the SectionHeading ornament glyph in V2 (default) vs explicit V1', () => {
    setUrl('/invito/francesca-e-ferdinando/');
    const v2 = render(
      <WeddingThemeProvider>
        <SectionHeading title="Programma" />
      </WeddingThemeProvider>
    );
    expect(screen.getByText('✦ ❄ ✦')).toBeInTheDocument();
    v2.unmount();

    setUrl('/invito/?v=1');
    render(
      <WeddingThemeProvider>
        <SectionHeading title="Programma" />
      </WeddingThemeProvider>
    );
    expect(screen.getByText('✦ ❦ ✦')).toBeInTheDocument();
  });

  it('renders a discreet deterministic snowfall overlay', () => {
    const { container } = render(
      <WeddingThemeProvider>
        <WinterSnow />
      </WeddingThemeProvider>
    );
    const snow = screen.getByTestId('winter-snow');
    expect(snow).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.winter-snowflake').length).toBe(28);
  });
});
