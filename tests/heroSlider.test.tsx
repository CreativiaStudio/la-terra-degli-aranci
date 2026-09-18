import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '../src/components/hero/HeroSection';

describe('HeroSection Photo Slider', () => {
  it('renders all 3 couple photos in the 3/4 frame', () => {
    render(<HeroSection />);

    const images = screen.getAllByRole('img');
    const sources = images.map((img) => img.getAttribute('src'));

    expect(sources).toContain('./images/sposi_1.jpg');
    expect(sources).toContain('./images/sposi_3.jpg');
    expect(sources).toContain('./images/sposi_2.jpg');
  });

  it('navigates photos using next and previous buttons', () => {
    render(<HeroSection />);

    const nextBtn = screen.getByLabelText('Foto successiva');
    const prevBtn = screen.getByLabelText('Foto precedente');

    // Initially photo 1 is active (opacity-100)
    const img1 = screen.getByAltText('Francesca & Ferdinando — La Promessa');
    expect(img1.className).toContain('opacity-100');

    // Click next -> photo 2 (sposi_3) active
    fireEvent.click(nextBtn);
    const img2 = screen.getByAltText('Francesca & Ferdinando — La Complicità');
    expect(img2.className).toContain('opacity-100');

    // Click next -> photo 3 (sposi_2) active
    fireEvent.click(nextBtn);
    const img3 = screen.getByAltText('Francesca & Ferdinando — La Gioia');
    expect(img3.className).toContain('opacity-100');

    // Click prev -> returns to photo 2
    fireEvent.click(prevBtn);
    expect(img2.className).toContain('opacity-100');
  });

  it('navigates photos using dot indicators', () => {
    render(<HeroSection />);

    const dot3 = screen.getByLabelText('Vai alla foto 3');
    fireEvent.click(dot3);

    const img3 = screen.getByAltText('Francesca & Ferdinando — La Gioia');
    expect(img3.className).toContain('opacity-100');
  });
});
