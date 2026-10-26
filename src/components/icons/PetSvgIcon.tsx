import React from 'react';

interface PetSvgIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  variant?: 'gold' | 'purple' | 'blue' | 'green';
}

export const PetSvgIcon: React.FC<PetSvgIconProps> = ({
  className = 'w-4 h-4',
  size = 16,
  variant = 'gold',
  ...props
}) => {
  const uid = React.useId().replace(/:/g, '');

  const gradColors =
    variant === 'gold'
      ? { c1: '#fbbf24', c2: '#f59e0b', c3: '#d97706', stroke: '#78350f' }
      : variant === 'purple'
      ? { c1: '#c084fc', c2: '#a855f7', c3: '#7e22ce', stroke: '#4c1d95' }
      : variant === 'blue'
      ? { c1: '#38bdf8', c2: '#0ea5e9', c3: '#0284c7', stroke: '#075985' }
      : { c1: '#34d399', c2: '#10b981', c3: '#047857', stroke: '#064e3b' };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`petPadGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradColors.c1} />
          <stop offset="50%" stopColor={gradColors.c2} />
          <stop offset="100%" stopColor={gradColors.c3} />
        </linearGradient>
      </defs>

      {/* Main Bottom Paw Pad */}
      <path
        d="M12 11.5C9.2 11.5 7 13.6 7 16.2C7 18.5 8.7 20.5 11 20.9C11.6 21 12.4 21 13 20.9C15.3 20.5 17 18.5 17 16.2C17 13.6 14.8 11.5 12 11.5Z"
        fill={`url(#petPadGrad_${uid})`}
        stroke={gradColors.stroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 4 Toe Pads */}
      <ellipse
        cx="5.8"
        cy="11.2"
        rx="2"
        ry="2.7"
        transform="rotate(-28 5.8 11.2)"
        fill={`url(#petPadGrad_${uid})`}
        stroke={gradColors.stroke}
        strokeWidth="1"
      />
      <ellipse
        cx="9.8"
        cy="7.2"
        rx="2.1"
        ry="2.8"
        transform="rotate(-10 9.8 7.2)"
        fill={`url(#petPadGrad_${uid})`}
        stroke={gradColors.stroke}
        strokeWidth="1"
      />
      <ellipse
        cx="14.2"
        cy="7.2"
        rx="2.1"
        ry="2.8"
        transform="rotate(10 14.2 7.2)"
        fill={`url(#petPadGrad_${uid})`}
        stroke={gradColors.stroke}
        strokeWidth="1"
      />
      <ellipse
        cx="18.2"
        cy="11.2"
        rx="2"
        ry="2.7"
        transform="rotate(28 18.2 11.2)"
        fill={`url(#petPadGrad_${uid})`}
        stroke={gradColors.stroke}
        strokeWidth="1"
      />

      {/* Highlight reflection */}
      <path
        d="M10 14C10.6 13.4 11.4 13 12.3 13"
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
    </svg>
  );
};

export default PetSvgIcon;

