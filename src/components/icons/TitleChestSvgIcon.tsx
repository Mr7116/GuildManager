import React from 'react';

interface TitleChestSvgIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  variant?: 'purple' | 'blue' | 'gold';
}

export const TitleChestSvgIcon: React.FC<TitleChestSvgIconProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'purple',
  ...props
}) => {
  // Gradients configuration based on variant
  const isBlue = variant === 'blue';
  const isGold = variant === 'gold';

  const uid = React.useId().replace(/:/g, '');

  const lidColors = isBlue
    ? { c1: '#7dd3fc', c2: '#38bdf8', c3: '#0284c7' }
    : isGold
    ? { c1: '#fde047', c2: '#f59e0b', c3: '#d97706' }
    : { c1: '#9387be', c2: '#7a70a3', c3: '#584e7a' };

  const lidRimLeftColors = isBlue
    ? { c1: '#0ea5e9', c2: '#0369a1' }
    : isGold
    ? { c1: '#fbbf24', c2: '#b45309' }
    : { c1: '#695f8f', c2: '#4e456d' };

  const lidRimRightColors = isBlue
    ? { c1: '#0369a1', c2: '#075985' }
    : isGold
    ? { c1: '#d97706', c2: '#78350f' }
    : { c1: '#4f4670', c2: '#383050' };

  const bodyLeftColors = isBlue
    ? { c1: '#0284c7', c2: '#0369a1', c3: '#075985' }
    : isGold
    ? { c1: '#d97706', c2: '#b45309', c3: '#78350f' }
    : { c1: '#665c8a', c2: '#544a76', c3: '#433a60' };

  const bodyRightColors = isBlue
    ? { c1: '#0369a1', c2: '#075985', c3: '#082f49' }
    : isGold
    ? { c1: '#b45309', c2: '#78350f', c3: '#451a03' }
    : { c1: '#4a4269', c2: '#3b3353', c3: '#2c253f' };

  const shadowColor = isBlue ? '#082f49' : isGold ? '#451a03' : '#140d28';
  const innerStroke = isBlue ? '#0369a1' : isGold ? '#78350f' : '#483e66';
  const emblemHollow = isBlue ? '#0284c7' : isGold ? '#f59e0b' : '#5d5382';
  const emblemCore = isBlue ? '#0369a1' : isGold ? '#78350f' : '#4d436f';
  const lockInner = isBlue ? '#0369a1' : isGold ? '#78350f' : '#2d2543';

  const gemColors = isBlue
    ? { c1: '#ffffff', c2: '#67e8f9', c3: '#06b6d4', c4: '#0e7490' }
    : isGold
    ? { c1: '#ffffff', c2: '#f87171', c3: '#dc2626', c4: '#991b1b' }
    : { c1: '#ffffff', c2: '#ffec3d', c3: '#fa8c16', c4: '#ad4e00' };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        {/* Soft ambient drop shadow */}
        <radialGradient id={`chestDropShadow_${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={shadowColor} stopOpacity="0.55" />
          <stop offset="65%" stopColor={shadowColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={shadowColor} stopOpacity="0" />
        </radialGradient>

        {/* Top Lid Gradient */}
        <linearGradient id={`lidTopGrad_${uid}`} x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor={lidColors.c1} />
          <stop offset="45%" stopColor={lidColors.c2} />
          <stop offset="100%" stopColor={lidColors.c3} />
        </linearGradient>

        {/* Lid Rim Front Left */}
        <linearGradient id={`lidRimLeft_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lidRimLeftColors.c1} />
          <stop offset="100%" stopColor={lidRimLeftColors.c2} />
        </linearGradient>

        {/* Lid Rim Front Right */}
        <linearGradient id={`lidRimRight_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={lidRimRightColors.c1} />
          <stop offset="100%" stopColor={lidRimRightColors.c2} />
        </linearGradient>

        {/* Box Body Front Left Face */}
        <linearGradient id={`bodyLeftGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bodyLeftColors.c1} />
          <stop offset="60%" stopColor={bodyLeftColors.c2} />
          <stop offset="100%" stopColor={bodyLeftColors.c3} />
        </linearGradient>

        {/* Box Body Front Right Face */}
        <linearGradient id={`bodyRightGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bodyRightColors.c1} />
          <stop offset="60%" stopColor={bodyRightColors.c2} />
          <stop offset="100%" stopColor={bodyRightColors.c3} />
        </linearGradient>

        {/* Gold Trim Gradients */}
        <linearGradient id={`goldHighlight_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff1b8" />
          <stop offset="35%" stopColor="#ffd666" />
          <stop offset="80%" stopColor="#d48806" />
          <stop offset="100%" stopColor="#915904" />
        </linearGradient>

        <linearGradient id={`goldShadow_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5c242" />
          <stop offset="50%" stopColor="#ba7809" />
          <stop offset="100%" stopColor="#704402" />
        </linearGradient>

        {/* Emblem Gold Gradient */}
        <linearGradient id={`emblemGold_${uid}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#fff7cd" />
          <stop offset="30%" stopColor="#ffd56b" />
          <stop offset="70%" stopColor="#e09612" />
          <stop offset="100%" stopColor="#9a5a04" />
        </linearGradient>

        {/* Central Gem/Lock Jewel Gradient */}
        <radialGradient id={`lockGemGrad_${uid}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={gemColors.c1} />
          <stop offset="25%" stopColor={gemColors.c2} />
          <stop offset="65%" stopColor={gemColors.c3} />
          <stop offset="100%" stopColor={gemColors.c4} />
        </radialGradient>
      </defs>

      {/* Ground Drop Shadow */}
      <ellipse cx="64" cy="106" rx="46" ry="15" fill={`url(#chestDropShadow_${uid})`} />

      {/* ==================== BOX BODY ==================== */}
      <path d="M19 46 L59 70 L59 104 L24 81 Z" fill={`url(#bodyLeftGrad_${uid})`} />
      <path d="M59 70 L104 43 L99 76 L59 104 Z" fill={`url(#bodyRightGrad_${uid})`} />

      {/* Vertical Gold Strips on Body */}
      <path d="M33 54 L37 56.5 L40 90 L36 88 Z" fill={`url(#goldHighlight_${uid})`} opacity="0.9" />
      <path d="M82 56 L86 53.5 L83 87 L79 90 Z" fill={`url(#goldShadow_${uid})`} opacity="0.85" />

      {/* Bottom Rim Horizontal Gold Trim */}
      <path d="M23 79 L59 102 L59 105 L23 83 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M59 102 L100 75 L100 78 L59 105 Z" fill={`url(#goldShadow_${uid})`} />

      {/* Bottom Corner Brackets */}
      <path d="M21 76 L28 80.5 L28 85 L22 83.5 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M22 83.5 L27 86.5 L26 89 L20 86 Z" fill={`url(#goldShadow_${uid})`} />

      <path d="M53 96 L59 100 L65 96 L65 102 L59 106 L53 102 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M59 100 L65 96 L65 102 L59 106 Z" fill={`url(#goldShadow_${uid})`} />

      <path d="M94 77 L100 73.5 L101 78 L95 82 Z" fill={`url(#goldShadow_${uid})`} />

      {/* ==================== BOX LID ==================== */}
      <path d="M14 41 L58 67 L58 73 L14 47 Z" fill={`url(#lidRimLeft_${uid})`} />
      <path d="M58 67 L109 37 L109 43 L58 73 Z" fill={`url(#lidRimRight_${uid})`} />

      {/* Lid Bottom Edge Gold Band */}
      <path d="M14 45 L58 71 L58 73.5 L14 47.5 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M58 71 L109 41 L109 43.5 L58 73.5 Z" fill={`url(#goldShadow_${uid})`} />

      {/* Lid Top Surface */}
      <path d="M14 41 L61 17 L109 37 L58 67 Z" fill={`url(#lidTopGrad_${uid})`} />

      {/* Top Lid Border Inset Lines */}
      <path d="M19 41.5 L61 21 L103 38 L58 63 Z" fill="none" stroke={innerStroke} strokeWidth="1.2" opacity="0.6" />

      {/* Vertical Ribs on Lid Rim */}
      <path d="M30 50.5 L34 53 L34 58 L30 55.5 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M88 49 L92 46.5 L92 51.5 L88 54 Z" fill={`url(#goldShadow_${uid})`} />

      {/* ==================== LID GOLD CORNERS ==================== */}
      <path d="M55 18 L61 15 L67 18.5 L65 22 L61 20 L57 22 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M13 39 L22 36 L21 42 L17 41 L18 48 L13 45 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M110 35 L101 32 L101 38 L105 38 L104 45 L110 42 Z" fill={`url(#goldShadow_${uid})`} />

      {/* Front Corner Bracket on Lid */}
      <path d="M52 61 L58 57 L64 61 L62 67 L58 65 L54 67 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M58 57 L64 61 L62 67 L58 65 Z" fill={`url(#goldShadow_${uid})`} />

      {/* ==================== TOP LID FLOWER/CLOUD EMBLEM ==================== */}
      <path
        d="M58 26 C63 24 70 27 72 31 C76 31 80 34 79 38 C80 42 77 46 72 47 C70 51 63 53 58 51 C53 53 46 51 44 47 C39 46 36 42 37 38 C36 34 40 31 44 31 C46 27 53 24 58 26 Z"
        fill={innerStroke}
        opacity="0.6"
      />
      <path
        d="M58 27 C62.5 25 69 28 71 32 C75 32 78.5 35 77.5 39 C78.5 42.5 75.5 46 71 47 C69 50.5 62.5 52 58 50 C53.5 52 47 50.5 45 47 C40.5 46 37.5 42.5 38.5 39 C37.5 35 41 32 45 32 C47 28 53.5 25 58 27 Z"
        fill={`url(#emblemGold_${uid})`}
      />
      <path
        d="M58 31 C61 29.5 65.5 31.5 67 34.5 C69.5 34.5 72 36.5 71.5 39 C72 41.5 70 44 67 44.5 C65.5 47 61 48 58 46.5 C55 48 50.5 47 49 44.5 C46 44 44 41.5 44.5 39 C44 36.5 46.5 34.5 49 34.5 C50.5 31.5 55 29.5 58 31 Z"
        fill={emblemHollow}
      />

      {/* Center Gold Cloud Core */}
      <circle cx="58" cy="39" r="4.5" fill={`url(#emblemGold_${uid})`} />
      <circle cx="58" cy="39" r="2.2" fill={emblemCore} />

      {/* Additional Gold Accents */}
      <circle cx="40" cy="35" r="1.8" fill={`url(#goldHighlight_${uid})`} />
      <circle cx="76" cy="35" r="1.8" fill={`url(#goldHighlight_${uid})`} />
      <path d="M48 27 C46 25 43 26 42 28 C41 30 43 32 45 31" fill="none" stroke={`url(#goldHighlight_${uid})`} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M68 27 C70 25 73 26 74 28 C75 30 73 32 71 31" fill="none" stroke={`url(#goldHighlight_${uid})`} strokeWidth="1.2" strokeLinecap="round" />

      {/* ==================== FRONT LOCK & HASP ==================== */}
      <path d="M51 61 L65 61 L67 71 L58 79 L49 71 Z" fill={innerStroke} opacity="0.7" />
      <path d="M52 62 L64 62 L66 70.5 L58 78 L50 70.5 Z" fill={`url(#goldHighlight_${uid})`} />
      <path d="M58 62 L64 62 L66 70.5 L58 78 Z" fill={`url(#goldShadow_${uid})`} opacity="0.6" />

      {/* Inner Bevel on Lock */}
      <path d="M54 64.5 L62 64.5 L63.5 70 L58 75 L52.5 70 Z" fill={lockInner} opacity="0.8" />

      {/* Glowing Jewel / Center Medallion on Lock */}
      <polygon points="58,66 61.8,69.5 58,73 54.2,69.5" fill={`url(#lockGemGrad_${uid})`} />
      <polygon points="58,66 61.8,69.5 58,69.5" fill="#fff7cd" opacity="0.8" />

      {/* Small Sparkles */}
      <circle cx="57" cy="68" r="0.8" fill="#ffffff" />
      <circle cx="21" cy="40" r="0.9" fill="#ffffff" opacity="0.8" />
      <circle cx="58" cy="18" r="0.9" fill="#ffffff" opacity="0.8" />
      <circle cx="58" cy="101" r="0.9" fill="#ffffff" opacity="0.8" />
    </svg>
  );
};

export default TitleChestSvgIcon;
