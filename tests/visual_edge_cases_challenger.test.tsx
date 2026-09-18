import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { EstateGallery, estateSpaces } from '../src/components/location/EstateGallery';
import { UnboxingEnvelope } from '../src/components/unboxing/UnboxingEnvelope';
import { WaxSeal } from '../src/components/unboxing/WaxSeal';
import { RoyalCrestMonogram } from '../src/components/common/RoyalCrestMonogram';
import { CoupleHeader } from '../src/components/hero/CoupleHeader';
import { VenueMap } from '../src/components/location/VenueMap';
import { Footer } from '../src/components/footer/Footer';

describe('Adversarial Stress Suite - Visual Boundaries, Lightbox, Wax Seal & SVG Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. LIGHTBOX MODAL INTERACTIONS, ARROW NAVIGATION & KEYBOARD CLEANUP
  // =========================================================================
  describe('1. Lightbox Modal Stress & Interaction Tests', () => {
    it('opens lightbox on space click and renders full space metadata', () => {
      render(<EstateGallery />);

      // Initially, no dialog should exist
      expect(screen.queryByRole('dialog')).toBeNull();

      // Click on "Il Giardino delle Promesse"
      const firstCard = screen.getByText('Il Giardino delle Promesse');
      fireEvent.click(firstCard);

      // Dialog should now be open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(within(dialog).getByText('1 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText(/Dove il «Sì» si fa eterno/i)).toBeInTheDocument();
      expect(within(dialog).getByText('Il Giardino delle Promesse')).toBeInTheDocument();
    });

    it('navigates sequentially forward and wraps around (0 -> 1 -> 2 -> 3 -> 0)', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('1 di 4')).toBeInTheDocument();

      const nextBtn = within(dialog).getByRole('button', { name: /Spazio successivo/i });

      // 1 -> 2 (L'Agrumeto Storico)
      fireEvent.click(nextBtn);
      expect(within(dialog).getByText('2 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText("L'Agrumeto Storico")).toBeInTheDocument();

      // 2 -> 3 (La Sala Bianca)
      fireEvent.click(nextBtn);
      expect(within(dialog).getByText('3 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('La Sala Bianca')).toBeInTheDocument();

      // 3 -> 4 (Il Taglio della Torta sotto le Stelle)
      fireEvent.click(nextBtn);
      expect(within(dialog).getByText('4 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('Il Taglio della Torta sotto le Stelle')).toBeInTheDocument();

      // 4 -> 1 (Wrap around to Il Giardino delle Promesse)
      fireEvent.click(nextBtn);
      expect(within(dialog).getByText('1 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('Il Giardino delle Promesse')).toBeInTheDocument();
    });

    it('navigates backwards and wraps around (0 -> 3 -> 2 -> 1 -> 0)', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText('1 di 4')).toBeInTheDocument();

      const prevBtn = within(dialog).getByRole('button', { name: /Spazio precedente/i });

      // 1 -> 4 (Wrap backwards to Il Taglio della Torta)
      fireEvent.click(prevBtn);
      expect(within(dialog).getByText('4 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('Il Taglio della Torta sotto le Stelle')).toBeInTheDocument();

      // 4 -> 3
      fireEvent.click(prevBtn);
      expect(within(dialog).getByText('3 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('La Sala Bianca')).toBeInTheDocument();
    });

    it('handles keyboard ArrowRight and ArrowLeft correctly', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      const dialog = screen.getByRole('dialog');

      // ArrowRight
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(within(dialog).getByText('2 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText("L'Agrumeto Storico")).toBeInTheDocument();

      // ArrowLeft
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(within(dialog).getByText('1 di 4')).toBeInTheDocument();
      expect(within(dialog).getByText('Il Giardino delle Promesse')).toBeInTheDocument();
    });

    it('closes on Escape key and verifies listener cleanup', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Press Escape
      fireEvent.keyDown(window, { key: 'Escape' });

      // Dialog must be closed
      expect(screen.queryByRole('dialog')).toBeNull();

      // Subsequent key events when closed must not throw or alter state
      expect(() => {
        fireEvent.keyDown(window, { key: 'ArrowRight' });
        fireEvent.keyDown(window, { key: 'Escape' });
      }).not.toThrow();
    });

    it('closes on backdrop click but does NOT close on inner modal content click (stopPropagation)', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Click inside modal content (e.g. caption text)
      const poeticCaption = within(dialog).getByText(/Dove il «Sì» si fa eterno/i);
      fireEvent.click(poeticCaption);

      // Must remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Click on backdrop (dialog container itself)
      fireEvent.click(dialog);

      // Must now be closed
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('closes via dedicated Close (X) button with accessible aria-label', () => {
      render(<EstateGallery />);
      fireEvent.click(screen.getByText('Il Giardino delle Promesse'));

      const dialog = screen.getByRole('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /Chiudi galleria/i });
      fireEvent.click(closeBtn);

      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  // =========================================================================
  // 2. WAX SEAL CLICK STATE GUARDS & RAPID DOUBLE-CLICK RESILIENCE
  // =========================================================================
  describe('2. Wax Seal & Unboxing State Guards', () => {
    it('guards against rapid click spamming on WaxSeal during unboxing', () => {
      vi.useFakeTimers();
      const onOpenComplete = vi.fn();

      render(<UnboxingEnvelope onOpenComplete={onOpenComplete} />);

      const sealButton = screen.getByRole('button', { name: /Apri invito nuziale/i });
      expect(sealButton).toBeInTheDocument();

      // Rapidly spam click 10 times in immediate succession
      for (let i = 0; i < 10; i++) {
        fireEvent.click(sealButton);
      }

      // Fast forward 400ms (unfolding step)
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Additional clicks during unfolding must be ignored
      fireEvent.click(sealButton);

      // Fast forward remaining 700ms (revealed step, total 1100ms)
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // onOpenComplete must have been triggered exactly ONCE despite 11 clicks
      expect(onOpenComplete).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('WaxSeal component applies pointer-events-none and opacity-0 when broken', () => {
      const handleClick = vi.fn();
      const { rerender } = render(<WaxSeal onClick={handleClick} isBroken={false} />);

      const button = screen.getByRole('button', { name: /Apri invito nuziale/i });
      expect(button.className).toContain('opacity-100');

      // Click when intact
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Re-render as broken
      rerender(<WaxSeal onClick={handleClick} isBroken={true} />);

      expect(button.className).toContain('pointer-events-none');
      expect(button.className).toContain('opacity-0');
    });
  });

  // =========================================================================
  // 3. SVG GRADIENT ISOLATION & UNIQUE ID GENERATION (useId)
  // =========================================================================
  describe('3. SVG Gradient Isolation & ID Collision Prevention', () => {
    it('generates distinct gradient and filter IDs across multiple RoyalCrestMonogram instances', () => {
      const { container } = render(
        <div>
          <RoyalCrestMonogram variant="gold" />
          <RoyalCrestMonogram variant="wax" />
          <RoyalCrestMonogram variant="subtle" />
          <RoyalCrestMonogram variant="monochrome" />
        </div>
      );

      const linearGradients = container.querySelectorAll('linearGradient');
      const gradientIds = Array.from(linearGradients).map((el) => el.id);

      // Verify all gradient IDs are non-empty and completely unique
      expect(gradientIds.length).toBeGreaterThan(0);
      const uniqueIds = new Set(gradientIds);
      expect(uniqueIds.size).toBe(gradientIds.length);

      // Verify that colons are sanitized to underscores for cross-browser query selector safety
      gradientIds.forEach((id) => {
        expect(id).not.toContain(':');
      });
    });

    it('matches path fill and stroke url references to local instance defs', () => {
      const { container } = render(<RoyalCrestMonogram variant="gold" withDropShadow={true} />);

      const svg = container.querySelector('svg')!;
      expect(svg).toBeInTheDocument();

      const defs = svg.querySelector('defs')!;
      const goldGrad = defs.querySelector('linearGradient[id^="royalGoldGrad_"]')!;
      expect(goldGrad).toBeInTheDocument();

      const goldGradId = goldGrad.getAttribute('id');
      expect(goldGradId).toBeTruthy();

      // Check that paths referencing the gradient match the def ID
      const pathsWithGradient = svg.querySelectorAll(`path[stroke="url(#${goldGradId})"]`);
      expect(pathsWithGradient.length).toBeGreaterThan(0);
    });

    it('renders monochrome variant using currentColor without broken gradient references', () => {
      const { container } = render(<RoyalCrestMonogram variant="monochrome" withDropShadow={false} />);

      const svg = container.querySelector('svg')!;
      const strokeElements = svg.querySelectorAll('path[stroke="currentColor"]');
      expect(strokeElements.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. IMAGE ALT TEXT PRESENCE & RESPONSIVE SCALING ATTRIBUTES
  // =========================================================================
  describe('4. Image Alt Text & Asset Resilience', () => {
    it('verifies all images in EstateGallery have meaningful alt text', () => {
      render(<EstateGallery />);
      const images = screen.getAllByRole('img');
      expect(images.length).toBe(estateSpaces.length);

      images.forEach((img) => {
        expect(img).toHaveAttribute('alt');
        const alt = img.getAttribute('alt');
        expect(alt).toBeTruthy();
        expect(alt!.trim().length).toBeGreaterThan(5);
      });
    });

    it('verifies couple hero photo in CoupleHeader has descriptive alt text', () => {
      render(<CoupleHeader />);
      const coupleImg = screen.getByAltText(/Francesca & Ferdinando — Nell'agrumeto a La Terra degli Aranci/i);
      expect(coupleImg).toBeInTheDocument();
      expect(coupleImg).toHaveAttribute('src', './images/coppia_hero.jpg');
    });

    it('verifies official TdA logo badges have appropriate branding alt text', () => {
      render(
        <div>
          <VenueMap />
          <Footer onOpenAdmin={() => {}} />
          <UnboxingEnvelope onOpenComplete={() => {}} />
        </div>
      );

      const tdaLogos = screen.getAllByAltText(/La Terra degli Aranci|Logo Ufficiale La Terra degli Aranci|Emblema TdA/i);
      expect(tdaLogos.length).toBeGreaterThanOrEqual(3);
    });
  });
});

