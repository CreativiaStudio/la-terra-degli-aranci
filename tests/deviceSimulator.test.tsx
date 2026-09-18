import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeviceSimulator } from '../src/components/common/DeviceSimulator';

describe('DeviceSimulator Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders mode switch and smartphone iframe by default on desktop', () => {
    // Set desktop window width
    window.innerWidth = 1200;

    render(
      <DeviceSimulator>
        <div data-testid="test-content">Wedding Content</div>
      </DeviceSimulator>
    );

    // Toggle buttons should be present
    expect(screen.getByRole('button', { name: /smartphone/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schermo intero/i })).toBeInTheDocument();

    // Default mode is mobile: iframe is rendered
    const iframe = screen.getByTitle(/Anteprima/i);
    expect(iframe).toBeInTheDocument();
  });

  it('does NOT expose any version switcher buttons to guests (V2 Natale is the only official version)', () => {
    window.innerWidth = 1200;

    render(
      <DeviceSimulator>
        <div data-testid="test-content">Wedding Content</div>
      </DeviceSimulator>
    );

    expect(screen.queryByRole('button', { name: /V1 Estate/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /V2 Natale/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /V3 Gala/i })).toBeNull();
    expect(screen.queryByText(/V1 Estate/i)).toBeNull();
    expect(screen.queryByText(/V3 Gala/i)).toBeNull();
  });

  it('switches to fullscreen mode when Schermo Intero button is clicked', () => {
    window.innerWidth = 1200;

    render(
      <DeviceSimulator>
        <div data-testid="test-content">Wedding Content</div>
      </DeviceSimulator>
    );

    const desktopBtn = screen.getByRole('button', { name: /schermo intero/i });
    fireEvent.click(desktopBtn);

    // Now direct children content is visible
    expect(screen.getByTestId('test-content')).toBeInTheDocument();

    // Switch back to mobile
    const mobileBtn = screen.getByRole('button', { name: /smartphone/i });
    fireEvent.click(mobileBtn);

    const iframe = screen.getByTitle(/Anteprima/i);
    expect(iframe).toBeInTheDocument();
  });
});
