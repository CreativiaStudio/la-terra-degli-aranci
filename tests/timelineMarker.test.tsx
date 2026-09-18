import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timeline } from '../src/components/ceremony/Timeline';

describe('Timeline Component', () => {
  it('renders the timeline without the orange emoji and with heart marker', () => {
    const { container } = render(<Timeline />);
    expect(container.textContent).not.toContain('🍊');
    expect(screen.getByText('La Nostra Giornata')).toBeInTheDocument();
    const marker = container.querySelector('[title="Momento attuale"]');
    expect(marker).toBeInTheDocument();
    expect(marker?.className).toContain('z-0');
  });

  it('renders stages with proper card stacking (z-10)', () => {
    const { container } = render(<Timeline />);
    const cards = container.querySelectorAll('.deckled-border');
    expect(cards.length).toBeGreaterThanOrEqual(4);
    cards.forEach((card) => {
      expect(card.className).toContain('z-10');
    });
  });
});
