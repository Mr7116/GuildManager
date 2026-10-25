import React from 'react';

interface RelicSvgIconProps {
  className?: string;
  size?: number;
}

export default function RelicSvgIcon({ className = 'w-5 h-5', size = 20 }: RelicSvgIconProps) {
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
        <linearGradient id="relicGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="relicGemGrad" x1="12" y1="8" x2="12" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      {/* Outer Glow Halo / Wings */}
      <path
        d="M12 2L14.5 7.5L20 6.5L16.5 11L21 14.5L15.5 16L16 22L12 18.5L8 22L8.5 16L3 14.5L7.5 11L4 6.5L9.5 7.5L12 2Z"
        fill="url(#relicGoldGrad)"
        fillOpacity="0.3"
      />
      {/* Relic Chalice / Artifact Core */}
      <path
        d="M6 5C6 5 8 13 12 13C16 13 18 5 18 5H6Z"
        stroke="url(#relicGoldGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stand and Base */}
      <path
        d="M12 13V19M8 21H16"
        stroke="url(#relicGoldGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gem in the center */}
      <path
        d="M12 6L14 9L12 12L10 9L12 6Z"
        fill="url(#relicGemGrad)"
      />
    </svg>
  );
}

