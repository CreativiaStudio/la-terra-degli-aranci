import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Programma', href: '#timeline' },
    { label: 'La Tenuta', href: '#location' },
    { label: 'Regalo', href: '#regalo' },
    { label: 'Dress Code', href: '#dresscode' },
    { label: 'RSVP', href: '#rsvp' },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        isScrolled
          ? 'bg-amalfi-base/95 backdrop-blur-md shadow-md py-3 border-b border-gold-accent/20'
          : 'bg-transparent py-5 pointer-events-none'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between pointer-events-auto">
        {/* Monogram / Couple Name */}
        <a
          href="#hero"
          className={`font-script text-2xl md:text-3xl text-wedding-charcoal transition-opacity duration-300 hover:text-gold-accent ${
            isScrolled ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Francesca & Ferdinando
        </a>

        {/* Desktop Navigation Links */}
        <div
          className={`hidden md:flex items-center gap-7 transition-opacity duration-300 ${
            isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="font-serif text-xs uppercase tracking-[0.2em] text-gray-700 hover:text-gold-accent transition-colors"
            >
              {link.label}
            </a>
          ))}

          {/* Admin link discreet trigger */}
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-[10px] text-gray-400 hover:text-gold-accent transition-colors uppercase tracking-widest pl-2"
              title="Area riservata sposi"
            >
              Area Sposi
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div
          className={`md:hidden transition-opacity duration-300 ${
            isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-wedding-charcoal hover:text-gold-accent transition-colors"
            aria-label="Menu di navigazione"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-amalfi-card/98 backdrop-blur-xl border-b border-gold-accent/30 py-5 px-6 space-y-3 shadow-xl pointer-events-auto animate-fadeIn">
          {navLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block font-serif text-sm uppercase tracking-widest text-wedding-charcoal hover:text-gold-accent py-1.5 border-b border-gold-accent/10"
            >
              {link.label}
            </a>
          ))}
          {onOpenAdmin && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="block w-full text-left font-serif text-xs uppercase tracking-widest text-gold-accent pt-2"
            >
              Area Riservata Sposi (PIN)
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
