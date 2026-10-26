import React from 'react';

interface TitleSvgIconProps {
  className?: string;
  size?: number;
}

export default function TitleSvgIcon({ className = 'w-5 h-5', size = 20 }: TitleSvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="titleRibbonGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="titleStarGrad" x1="12" y1="8" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Ribbon Banner tails */}
      <path
        d="M8.5 13.5L5 21L9.5 19L12 21L12 14"
        fill="#DC2626"
        fillOpacity="0.8"
      />
      <path
        d="M15.5 13.5L19 21L14.5 19L12 21L12 14"
        fill="#B91C1C"
        fillOpacity="0.9"
      />

      {/* Medal / Badge Base Circle */}
      <circle
        cx="12"
        cy="9.5"
        r="7.5"
        fill="url(#titleRibbonGrad)"
        stroke="#78350F"
        strokeWidth="1.25"
      />
      <circle
        cx="12"
        cy="9.5"
        r="5.75"
        fill="#DC2626"
        stroke="#FEF08A"
        strokeWidth="1"
      />

      {/* Golden Star in the center */}
      <path
        d="M12 6L13.1 8.3L15.6 8.6L13.8 10.3L14.2 12.8L12 11.6L9.8 12.8L10.2 10.3L8.4 8.6L10.9 8.3L12 6Z"
        fill="url(#titleStarGrad)"
        stroke="#B45309"
        strokeWidth="0.5"
      />

      {/* Sparkles */}
      <path
        d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z"
        fill="#FDE047"
      />
    </svg>
  );
}

