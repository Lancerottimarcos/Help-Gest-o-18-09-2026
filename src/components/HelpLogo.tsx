import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface HelpLogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const HelpLogo: React.FC<HelpLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  let isDark = false;
  try {
    const themeContext = useTheme();
    isDark = themeContext.isDark;
  } catch {
    // Graceful fallback if rendered outside ThemeProvider
  }

  // Height presets for full logo
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10 sm:h-11',
    lg: 'h-11 sm:h-12',
    xl: 'h-14',
  };

  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick}
        className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
        title="Help Ideias Digitais"
      >
        <img
          src="/icone-help.png"
          alt="Help Ideias Digitais"
          className="w-8 h-8 object-contain transition-transform duration-200 hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Full variant: uses attached image or dark version with svg fallback
  const imgSrc = isDark
    ? (imgError ? '/logotipo-help-dark.svg' : '/logotipo-help-dark.png')
    : (imgError ? '/logotipo-help-2026.svg' : '/logotipo-help-2026.png');

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center cursor-pointer select-none transition-opacity duration-200 hover:opacity-90 ${className}`}
      title="Help Ideias Digitais"
    >
      <img
        id="sidebar-logo-img"
        src={imgSrc}
        alt="Help Ideias Digitais"
        className={`${heightClasses[size]} w-auto object-contain object-left max-w-[195px] transition-all duration-200`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
