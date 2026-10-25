export interface TeamColorConfig {
  key: string;
  name: string;
  dotClass: string;
  badgeClass: string;
  borderClass: string;
  borderLeftClass: string;
  headerBgClass: string;
  glowClass: string;
  hex: string;
  hexBg: string;
  hexBorder: string;
}

export const TEAM_COLORS: Record<string, TeamColorConfig> = {
  rose: {
    key: 'rose',
    name: 'แดงกุหลาบ (Rose)',
    dotClass: 'bg-rose-500',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
    borderClass: 'border-rose-400 dark:border-rose-500/60',
    borderLeftClass: 'border-l-rose-500',
    headerBgClass: 'from-rose-500/10 to-transparent',
    glowClass: 'shadow-rose-500/10',
    hex: '#f43f5e',
    hexBg: 'rgba(244, 63, 94, 0.12)',
    hexBorder: '#fb7185',
  },
  sky: {
    key: 'sky',
    name: 'ฟ้าคราม (Sky)',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
    borderClass: 'border-sky-400 dark:border-sky-500/60',
    borderLeftClass: 'border-l-sky-500',
    headerBgClass: 'from-sky-500/10 to-transparent',
    glowClass: 'shadow-sky-500/10',
    hex: '#0ea5e9',
    hexBg: 'rgba(14, 165, 233, 0.12)',
    hexBorder: '#38bdf8',
  },
  amber: {
    key: 'amber',
    name: 'ส้มทอง (Amber)',
    dotClass: 'bg-amber-500',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-400 dark:border-amber-500/60',
    borderLeftClass: 'border-l-amber-500',
    headerBgClass: 'from-amber-500/10 to-transparent',
    glowClass: 'shadow-amber-500/10',
    hex: '#f59e0b',
    hexBg: 'rgba(245, 158, 11, 0.12)',
    hexBorder: '#fbbf24',
  },
  emerald: {
    key: 'emerald',
    name: 'เขียวมรกต (Emerald)',
    dotClass: 'bg-emerald-500',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-400 dark:border-emerald-500/60',
    borderLeftClass: 'border-l-emerald-500',
    headerBgClass: 'from-emerald-500/10 to-transparent',
    glowClass: 'shadow-emerald-500/10',
    hex: '#10b981',
    hexBg: 'rgba(16, 185, 129, 0.12)',
    hexBorder: '#34d399',
  },
  purple: {
    key: 'purple',
    name: 'ม่วงเข้ม (Purple)',
    dotClass: 'bg-purple-500',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40',
    borderClass: 'border-purple-400 dark:border-purple-500/60',
    borderLeftClass: 'border-l-purple-500',
    headerBgClass: 'from-purple-500/10 to-transparent',
    glowClass: 'shadow-purple-500/10',
    hex: '#a855f7',
    hexBg: 'rgba(168, 85, 247, 0.12)',
    hexBorder: '#c084fc',
  },
  indigo: {
    key: 'indigo',
    name: 'น้ำเงินคราม (Indigo)',
    dotClass: 'bg-indigo-500',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
    borderClass: 'border-indigo-400 dark:border-indigo-500/60',
    borderLeftClass: 'border-l-indigo-500',
    headerBgClass: 'from-indigo-500/10 to-transparent',
    glowClass: 'shadow-indigo-500/10',
    hex: '#6366f1',
    hexBg: 'rgba(99, 102, 241, 0.12)',
    hexBorder: '#818cf8',
  },
  fuchsia: {
    key: 'fuchsia',
    name: 'ชมพู (Pink)',
    dotClass: 'bg-fuchsia-500',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/40',
    borderClass: 'border-fuchsia-400 dark:border-fuchsia-500/60',
    borderLeftClass: 'border-l-fuchsia-500',
    headerBgClass: 'from-fuchsia-500/10 to-transparent',
    glowClass: 'shadow-fuchsia-500/10',
    hex: '#d946ef',
    hexBg: 'rgba(217, 70, 239, 0.12)',
    hexBorder: '#e879f9',
  },
  teal: {
    key: 'teal',
    name: 'เขียวฟ้า (Teal)',
    dotClass: 'bg-teal-500',
    badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40',
    borderClass: 'border-teal-400 dark:border-teal-500/60',
    borderLeftClass: 'border-l-teal-500',
    headerBgClass: 'from-teal-500/10 to-transparent',
    glowClass: 'shadow-teal-500/10',
    hex: '#14b8a6',
    hexBg: 'rgba(20, 184, 166, 0.12)',
    hexBorder: '#2dd4bf',
  },
};

export const TEAM_COLOR_LIST = Object.values(TEAM_COLORS);
export const TEAM_COLOR_KEYS = Object.keys(TEAM_COLORS);

export function getTeamColorConfig(colorKey?: string): TeamColorConfig {
  if (colorKey && TEAM_COLORS[colorKey]) {
    return TEAM_COLORS[colorKey];
  }
  return TEAM_COLORS.sky;
}

