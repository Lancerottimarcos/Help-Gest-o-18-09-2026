import React, { useState, useEffect } from 'react';
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
  const [customLogoLight, setCustomLogoLight] = useState<string | null>(() => {
    try {
      return localStorage.getItem('agency_custom_logo_light') || localStorage.getItem('agency_custom_logo') || null;
    } catch {
      return null;
    }
  });
  const [customLogoDark, setCustomLogoDark] = useState<string | null>(() => {
    try {
      return localStorage.getItem('agency_custom_logo_dark') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setCustomLogoLight(localStorage.getItem('agency_custom_logo_light') || localStorage.getItem('agency_custom_logo') || null);
        setCustomLogoDark(localStorage.getItem('agency_custom_logo_dark') || null);
        setImgError(false);
      } catch {}
    };

    window.addEventListener('agency_logo_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('agency_logo_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

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
    const iconSrc = (isDark ? customLogoDark : null) || customLogoLight || '/icone-help.png';
    return (
      <div 
        onClick={onClick}
        className={`relative flex items-center justify-center cursor-pointer select-none ${className}`}
        title="Help Ideias Digitais"
      >
        <img
          src={imgError ? '/icone-help.png' : iconSrc}
          alt="Help Ideias Digitais"
          className="w-8 h-8 object-contain transition-transform duration-200 hover:scale-105 rounded-lg"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Full variant: uses custom logo if provided, otherwise default theme images
  let imgSrc: string;
  if (!imgError && isDark && customLogoDark) {
    imgSrc = customLogoDark;
  } else if (!imgError && customLogoLight) {
    imgSrc = customLogoLight;
  } else {
    imgSrc = isDark
      ? (imgError ? '/logotipo-help-dark.svg' : '/logotipo-help-dark.png')
      : (imgError ? '/logotipo-help-2026.svg' : '/logotipo-help-2026.png');
  }

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
