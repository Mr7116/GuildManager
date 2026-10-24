'use client';

import React from 'react';

interface TitleMedalProps {
  title?: string | null;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

interface MedalTheme {
  family: string;
  label: string;
  points: number; // Star points count
  starLight: string;
  starDark: string;
  ringOuter: string;
  ringInner: string;
  bgGradStart: string;
  bgGradEnd: string;
  accentColor: string;
}

const RAINBOW_SPICULES = [
  { light: '#f87171', dark: '#dc2626' }, // 0: Crimson (Top)
  { light: '#fb923c', dark: '#ea580c' }, // 1: Orange
  { light: '#facc15', dark: '#ca8a04' }, // 2: Amber / Gold
  { light: '#a3e635', dark: '#65a30d' }, // 3: Lime
  { light: '#4ade80', dark: '#16a34a' }, // 4: Emerald
  { light: '#2dd4bf', dark: '#0d9488' }, // 5: Teal (Bottom)
  { light: '#38bdf8', dark: '#0284c7' }, // 6: Sky Blue
  { light: '#818cf8', dark: '#4f46e5' }, // 7: Indigo
  { light: '#c084fc', dark: '#9333ea' }, // 8: Purple / Violet
  { light: '#f472b6', dark: '#db2777' }, // 9: Pink / Rose
];

const THEMES: Record<string, MedalTheme> = {
  traveler: {
    family: 'traveler',
    label: 'Traveler',
    points: 5,
    starLight: '#4ade80',
    starDark: '#16a34a',
    ringOuter: '#bbf7d0',
    ringInner: '#15803d',
    bgGradStart: '#bbf7d0',
    bgGradEnd: '#22c55e',
    accentColor: '#14532d',
  },
  explorer: {
    family: 'explorer',
    label: 'Explorer',
    points: 6,
    starLight: '#60a5fa',
    starDark: '#1d4ed8',
    ringOuter: '#bfdbfe',
    ringInner: '#1e40af',
    bgGradStart: '#bae6fd',
    bgGradEnd: '#3b82f6',
    accentColor: '#1e3a8a',
  },
  pathfinder: {
    family: 'pathfinder',
    label: 'Pathfinder',
    points: 7,
    starLight: '#c084fc',
    starDark: '#7e22ce',
    ringOuter: '#e9d5ff',
    ringInner: '#6b21a8',
    bgGradStart: '#e9d5ff',
    bgGradEnd: '#a855f7',
    accentColor: '#581c87',
  },
  trailblazer: {
    family: 'trailblazer',
    label: 'Trailblazer',
    points: 8,
    starLight: '#fbbf24',
    starDark: '#b45309',
    ringOuter: '#fef3c7',
    ringInner: '#92400e',
    bgGradStart: '#fef08a',
    bgGradEnd: '#f59e0b',
    accentColor: '#78350f',
  },
  pioneer: {
    family: 'pioneer',
    label: 'ผู้บุกเบิก',
    points: 8,
    starLight: '#f87171',
    starDark: '#991b1b',
    ringOuter: '#fecaca',
    ringInner: '#7f1d1d',
    bgGradStart: '#fca5a5',
    bgGradEnd: '#ef4444',
    accentColor: '#450a0a',
  },
  dawn: {
    family: 'dawn',
    label: 'ผู้เบิกอรุณ',
    points: 10,
    starLight: '#f87171',
    starDark: '#dc2626',
    ringOuter: '#fef08a',
    ringInner: '#9333ea',
    bgGradStart: '#fdf4ff',
    bgGradEnd: '#bae6fd',
    accentColor: '#4f46e5',
  },
};

/**
 * Calculates 5-pointed star points string
 */
function calculateStarPoints(
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): string {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  const points: string[] = [];

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius;
    let y = cy + Math.sin(rot) * outerRadius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    rot += step;
  }
  return points.join(' ');
}

export default function TitleMedal({
  title,
  size = 28,
  className = '',
  showTooltip = true,
}: TitleMedalProps) {
  if (!title) return null;

  const clean = title.trim().toLowerCase();

  // 1. Theme determination (check อรุณ before ผู้บุกเบิก)
  let theme = THEMES.pathfinder;
  if (clean.includes('อรุณ') || clean.includes('dawn')) theme = THEMES.dawn;
  else if (clean.includes('ผู้บุกเบิก') || clean.includes('pioneer')) theme = THEMES.pioneer;
  else if (clean.includes('trailblazer') || clean.includes('เทรลเบล')) theme = THEMES.trailblazer;
  else if (clean.includes('pathfinder') || clean.includes('พาธไฟน์')) theme = THEMES.pathfinder;
  else if (clean.includes('explorer') || clean.includes('เอ็กซ์พลอ')) theme = THEMES.explorer;
  else if (clean.includes('traveler') || clean.includes('ทราเวล')) theme = THEMES.traveler;

  // 2. Star tier (1 to 5) - check 'iv' before 'v'
  let tier = 1;
  if (clean.includes(' iv') || clean.endsWith('iv') || clean.includes(' 4') || clean.endsWith('4')) tier = 4;
  else if (clean.includes(' v') || clean.endsWith('v') || clean.includes(' 5') || clean.endsWith('5')) tier = 5;
  else if (clean.includes(' iii') || clean.endsWith('iii') || clean.includes(' 3') || clean.endsWith('3')) tier = 3;
  else if (clean.includes(' ii') || clean.endsWith('ii') || clean.includes(' 2') || clean.endsWith('2')) tier = 2;
  else if (clean.includes(' i') || clean.endsWith('i') || clean.includes(' 1') || clean.endsWith('1')) tier = 1;

  // Star positions along bottom arc
  const starCoords: Record<number, { cx: number; cy: number; r: number }[]> = {
    1: [{ cx: 50, cy: 85, r: 8 }],
    2: [
      { cx: 41, cy: 84.5, r: 7.5 },
      { cx: 59, cy: 84.5, r: 7.5 },
    ],
    3: [
      { cx: 33, cy: 83.5, r: 7 },
      { cx: 50, cy: 86.5, r: 7.5 },
      { cx: 67, cy: 83.5, r: 7 },
    ],
    4: [
      { cx: 27, cy: 81, r: 6.5 },
      { cx: 42, cy: 85, r: 7 },
      { cx: 58, cy: 85, r: 7 },
      { cx: 73, cy: 81, r: 6.5 },
    ],
    5: [
      { cx: 21, cy: 77.5, r: 6 },
      { cx: 35, cy: 83, r: 6.5 },
      { cx: 50, cy: 86.5, r: 7 },
      { cx: 65, cy: 83, r: 6.5 },
      { cx: 79, cy: 77.5, r: 6 },
    ],
  };

  const stars = starCoords[tier] || starCoords[1];

  // Star geometry calculations
  const cx = 50;
  const cy = 44;
  const outerR = 39;
  const innerR = 21;
  const numPoints = theme.points;
  const step = (Math.PI * 2) / numPoints;
  const startAngle = -Math.PI / 2; // top at 12 o'clock

  const starFacets: React.ReactNode[] = [];
  for (let i = 0; i < numPoints; i++) {
    const tipAngle = startAngle + i * step;
    const prevValleyAngle = tipAngle - step / 2;
    const nextValleyAngle = tipAngle + step / 2;

    const tipX = cx + outerR * Math.cos(tipAngle);
    const tipY = cy + outerR * Math.sin(tipAngle);

    const prevX = cx + innerR * Math.cos(prevValleyAngle);
    const prevY = cy + innerR * Math.sin(prevValleyAngle);

    const nextX = cx + innerR * Math.cos(nextValleyAngle);
    const nextY = cy + innerR * Math.sin(nextValleyAngle);

    // Prismatic color for dawn or single theme color
    const c1 = theme.family === 'dawn' ? RAINBOW_SPICULES[i % RAINBOW_SPICULES.length].light : theme.starLight;
    const c2 = theme.family === 'dawn' ? RAINBOW_SPICULES[i % RAINBOW_SPICULES.length].dark : theme.starDark;

    starFacets.push(
      <polygon
        key={`facet-left-${i}`}
        points={`${cx},${cy} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${prevX.toFixed(1)},${prevY.toFixed(1)}`}
        fill={c1}
      />,
      <polygon
        key={`facet-right-${i}`}
        points={`${cx},${cy} ${tipX.toFixed(1)},${tipY.toFixed(1)} ${nextX.toFixed(1)},${nextY.toFixed(1)}`}
        fill={c2}
      />
    );
  }

  const uniqueId = `medal_${theme.family}_${tier}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`inline-block shrink-0 select-none drop-shadow-md hover:scale-110 transition-transform ${className}`}
    >
      {showTooltip && title && <title>{title}</title>}
      <defs>
        {/* Subtle drop shadow */}
        <filter id={`${uniqueId}_shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.65" />
        </filter>

        {/* Soft glow for inner icon */}
        <filter id={`${uniqueId}_glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.4" />
        </filter>

        {/* Metallic Bezel Gradient */}
        <linearGradient id={`${uniqueId}_metal`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor={theme.ringOuter} />
          <stop offset="70%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor={theme.ringInner} />
        </linearGradient>

        {/* Inner Medallion Gradient */}
        <radialGradient id={`${uniqueId}_disc`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor={theme.bgGradStart} />
          <stop offset="100%" stopColor={theme.bgGradEnd} />
        </radialGradient>

        {/* Gold Star Gradient */}
        <linearGradient id={`${uniqueId}_gold`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="25%" stopColor="#fef08a" />
          <stop offset="65%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>

      {/* 1. Multi-faceted Star Base */}
      <g filter={`url(#${uniqueId}_shadow)`}>
        {starFacets}
      </g>

      {/* 2. Outer Metallic Bezel Ring */}
      <circle
        cx={cx}
        cy={cy}
        r="27"
        fill={`url(#${uniqueId}_metal)`}
        stroke="#ffffff"
        strokeWidth="0.8"
        strokeOpacity="0.9"
        filter={`url(#${uniqueId}_shadow)`}
      />

      {/* 3. Inner Bevel Rim */}
      <circle
        cx={cx}
        cy={cy}
        r="24.5"
        fill="none"
        stroke={theme.ringInner}
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* 4. Center Disc Background */}
      <circle
        cx={cx}
        cy={cy}
        r="23"
        fill={`url(#${uniqueId}_disc)`}
      />

      {/* 5. Delicate Sunburst Rays */}
      <g stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.3" strokeLinecap="round">
        <line x1="50" y1="44" x2="50" y2="23" />
        <line x1="50" y1="44" x2="65" y2="29" />
        <line x1="50" y1="44" x2="71" y2="44" />
        <line x1="50" y1="44" x2="65" y2="59" />
        <line x1="50" y1="44" x2="50" y2="65" />
        <line x1="50" y1="44" x2="35" y2="59" />
        <line x1="50" y1="44" x2="29" y2="44" />
        <line x1="50" y1="44" x2="35" y2="29" />
      </g>

      {/* 6. Center Emblem Icon */}
      <g filter={`url(#${uniqueId}_glow)`}>
        {theme.family === 'pathfinder' && (
          /* Aviator / Pilot Helmet with Goggles */
          <g transform="translate(0, 0)">
            <path
              d="M34,44 C34,34 40,29 50,29 C60,29 66,34 66,44 C66,47 64,51 61,53 L62,59 C62,60 61,61 60,61 L58,61 C57,61 56,60 56,59 L55.5,54.5 C53.5,55 51.5,55.3 49.5,55.3 C47,55.3 45,55 43.5,54.5 L43,59 C43,60 42,61 41,61 L39,61 C38,61 37,60 37,59 L38.5,53 C35.5,51 34,47 34,44 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.8"
            />
            <path
              d="M34,43 Q50,49 66,43"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M36,42 C36,39 39,37 43,37 L46,37 C49,37 50,39 50,42 C50,45 49,47 46,47 L43,47 C39,47 36,45 36,42 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
            <path
              d="M38.5,42 C38.5,40.5 40.5,39 43,39 L45,39 C47.5,39 48,40.5 48,42 C48,43.5 47.5,45 45,45 L43,45 C40.5,45 38.5,43.5 38.5,42 Z"
              fill="#a855f7"
              fillOpacity="0.85"
            />
            <path
              d="M51,42 C51,39 52,37 55,37 L58,37 C62,37 65,39 65,42 C65,45 62,47 58,47 L55,47 C52,47 51,45 51,42 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
            <path
              d="M53,42 C53,40.5 53.5,39 56,39 L58,39 C60.5,39 62.5,40.5 62.5,42 C62.5,43.5 60.5,45 58,45 L56,45 C53.5,45 53,43.5 53,42 Z"
              fill="#a855f7"
              fillOpacity="0.85"
            />
            <line x1="48" y1="41" x2="52" y2="41" stroke="#ffffff" strokeWidth="1.2" />
          </g>
        )}

        {theme.family === 'traveler' && (
          /* Traveler Top Hat */
          <g>
            <path
              d="M40,49 L42,34 C42,32 44,30 47,30 L53,30 C56,30 58,32 58,34 L60,49 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
            <path
              d="M40.5,45 L41,41 L59,41 L59.5,45 Z"
              fill="#15803d"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="18"
              ry="4"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
          </g>
        )}

        {theme.family === 'explorer' && (
          /* Explorer Winged Mariner Cap */
          <g>
            <path
              d="M34,42 C34,35 41,31 50,31 C59,31 66,35 66,42 C66,47 62,50 50,50 C38,50 34,47 34,42 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
            <path
              d="M36,44 Q50,55 64,44 Q50,51 36,44 Z"
              fill="#1e40af"
            />
            <path
              d="M58,36 C64,30 67,26 69,27 C69,30 66,35 60,39 Z"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="0.6"
            />
            <path
              d="M55,39 C62,35 65,31 67,33 C66,36 62,40 57,41 Z"
              fill="#bae6fd"
            />
          </g>
        )}

        {theme.family === 'trailblazer' && (
          /* Radiant Sun Crest */
          <g>
            <circle cx="50" cy="44" r="8" fill="#ffffff" stroke={theme.accentColor} strokeWidth="0.9" />
            <path
              d="M50,29 L52,34 L50,33 L48,34 Z M50,59 L52,54 L50,55 L48,54 Z M35,44 L40,42 L39,44 L40,46 Z M65,44 L60,42 L61,44 L60,46 Z M39,33 L44,37 L43,38 L41,36 Z M61,55 L56,51 L57,50 L59,52 Z M61,33 L59,38 L57,37 L60,35 Z M39,55 L41,50 L43,51 L40,53 Z"
              fill="#ffffff"
            />
          </g>
        )}

        {theme.family === 'pioneer' && (
          /* Royal Crown */
          <g>
            <path
              d="M35,50 L37,36 L43,43 L50,33 L57,43 L63,36 L65,50 Z"
              fill="#ffffff"
              stroke={theme.accentColor}
              strokeWidth="0.9"
            />
            <rect x="35" y="50" width="30" height="3.5" rx="1" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="50" cy="33" r="1.5" fill="#fef08a" />
            <circle cx="37" cy="36" r="1.2" fill="#fef08a" />
            <circle cx="63" cy="36" r="1.2" fill="#fef08a" />
          </g>
        )}

        {theme.family === 'dawn' && (
          /* Angelic Winged Crest with Diamond Core (matches media_1792834131476_b9e42357.png) */
          <g>
            {/* Left Wing */}
            <path
              d="M32,45 C30,36 34,29 44,35 C42,38 39,42 38,47 C35,46 33,46 32,45 Z"
              fill="#ffffff"
              stroke="#6366f1"
              strokeWidth="0.8"
            />
            <path
              d="M34,44 C33,39 36,33 43,37 C41,40 39,43 37,45 Z"
              fill="#bae6fd"
            />
            {/* Right Wing */}
            <path
              d="M68,45 C70,36 66,29 56,35 C58,38 61,42 62,47 C65,46 67,46 68,45 Z"
              fill="#ffffff"
              stroke="#6366f1"
              strokeWidth="0.8"
            />
            <path
              d="M66,44 C67,39 64,33 57,37 C59,40 61,43 63,45 Z"
              fill="#bae6fd"
            />
            {/* Center Halo / Sunburst Ring */}
            <circle cx="50" cy="44" r="7.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            {/* Center Prismatic Diamond */}
            <polygon points="50,37 55,44 50,51 45,44" fill="#ffffff" stroke="#6366f1" strokeWidth="0.8" />
            <polygon points="50,40 53,44 50,48 47,44" fill="#c084fc" />
          </g>
        )}
      </g>

      {/* 7. Gold Stars at bottom for Tier (I - V) */}
      <g filter={`url(#${uniqueId}_shadow)`}>
        {stars.map((s, idx) => (
          <polygon
            key={idx}
            fill={`url(#${uniqueId}_gold)`}
            stroke="#92400e"
            strokeWidth="0.8"
            points={calculateStarPoints(s.cx, s.cy, 5, s.r, s.r * 0.48)}
          />
        ))}
      </g>
    </svg>
  );
}
