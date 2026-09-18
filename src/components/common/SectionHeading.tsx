import React from 'react';
import { useWeddingTheme } from '../../theme/WeddingThemeContext';

interface SectionHeadingProps {
  subtitle?: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  subtitle,
  title,
  description,
  className = '',
}) => {
  const { isWinter, isV3 } = useWeddingTheme();

  return (
    <div className={`text-center max-w-2xl mx-auto mb-10 md:mb-14 ${className}`}>
      {subtitle && (
        <span
          className={`font-script text-2xl md:text-3xl block mb-1 tracking-wide ${
            isV3 ? 'gold-mirror-text' : isWinter ? 'gold-foil-text' : 'text-gold-accent'
          }`}
        >
          {subtitle}
        </span>
      )}
      <h2 className="font-serif text-3xl md:text-5xl font-light text-wedding-charcoal tracking-wider uppercase">
        {title}
      </h2>
      <div className="flex items-center justify-center gap-3 my-4">
        <span className="h-[1px] w-12 md:w-20 bg-gradient-to-r from-transparent to-gold-accent/70" />
        <span className="text-gold-accent text-xs">{isV3 ? '✦ ★ ✦' : isWinter ? '✦ ❄ ✦' : '✦ ❦ ✦'}</span>
        <span className="h-[1px] w-12 md:w-20 bg-gradient-to-l from-transparent to-gold-accent/70" />
      </div>
      {description && (
        <p className="text-sm md:text-base text-gray-600 font-light leading-relaxed max-w-xl mx-auto px-4">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
