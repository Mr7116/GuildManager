import { JobFamilyMeta } from '@/types/member';

export const JOB_FAMILIES: JobFamilyMeta[] = [
  {
    familyKey: 'knight',
    label: 'Knight',
    role: 'tank',
    hexMain: '#dc2626',
    hexDark: '#881313',
    hexBorder: '#f87171',
    namePillStyle: 'background-color: #dc2626; border-color: #f87171; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(220,38,38,0.12); border-color: rgba(248,113,113,0.28);',
    jobs: ['Knight', 'Lord Knight']
  },
  {
    familyKey: 'crusader',
    label: 'Crusader',
    role: 'tank',
    hexMain: '#9f1d20',
    hexDark: '#5f0f12',
    hexBorder: '#fb7185',
    namePillStyle: 'background-color: #9f1d20; border-color: #fb7185; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(185,28,28,0.13); border-color: rgba(251,113,133,0.28);',
    jobs: ['Crusader', 'Paladin']
  },
  {
    familyKey: 'wizard',
    label: 'Wizard',
    role: 'dps',
    hexMain: '#1d5bd6',
    hexDark: '#133785',
    hexBorder: '#60a5fa',
    namePillStyle: 'background-color: #1d5bd6; border-color: #60a5fa; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(37,99,235,0.12); border-color: rgba(96,165,250,0.28);',
    jobs: ['Wizard', 'High Wizard']
  },
  {
    familyKey: 'sage',
    label: 'Sage',
    sub: 'Professor',
    role: 'dps',
    hexMain: '#1e6be6',
    hexDark: '#103c8f',
    hexBorder: '#7dd3fc',
    namePillStyle: 'background-color: #1e6be6; border-color: #7dd3fc; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(14,165,233,0.12); border-color: rgba(125,211,252,0.28);',
    jobs: ['Sage', 'Professor', 'Scholar', 'เซจ']
  },
  {
    familyKey: 'hunter',
    label: 'Hunter',
    role: 'dps',
    hexMain: '#c67a2b',
    hexDark: '#7c4711',
    hexBorder: '#fbbf24',
    namePillStyle: 'background-color: #c67a2b; border-color: #fbbf24; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(217,119,6,0.12); border-color: rgba(251,191,36,0.28);',
    jobs: ['Hunter', 'Sniper']
  },
  {
    familyKey: 'bard',
    label: 'Bard',
    role: 'bard',
    hexMain: '#b86f24',
    hexDark: '#73410e',
    hexBorder: '#f59e0b',
    namePillStyle: 'background-color: #b86f24; border-color: #f59e0b; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(180,83,9,0.12); border-color: rgba(245,158,11,0.28);',
    jobs: ['Bard', 'Clown']
  },
  {
    familyKey: 'dancer',
    label: 'Dancer',
    role: 'bard',
    hexMain: '#c46d25',
    hexDark: '#7c3f0e',
    hexBorder: '#fb923c',
    namePillStyle: 'background-color: #c46d25; border-color: #fb923c; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(194,65,12,0.12); border-color: rgba(251,146,60,0.28);',
    jobs: ['Dancer', 'Gypsy']
  },
  {
    familyKey: 'priest',
    label: 'Priest',
    role: 'healer',
    hexMain: '#218332',
    hexDark: '#124c1d',
    hexBorder: '#4ade80',
    namePillStyle: 'background-color: #218332; border-color: #4ade80; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(22,101,52,0.13); border-color: rgba(74,222,128,0.28);',
    jobs: ['Priest', 'High Priest']
  },
  {
    familyKey: 'monk',
    label: 'Monk',
    role: 'dps',
    hexMain: '#288d36',
    hexDark: '#15521e',
    hexBorder: '#86efac',
    namePillStyle: 'background-color: #288d36; border-color: #86efac; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(21,128,61,0.13); border-color: rgba(134,239,172,0.28);',
    jobs: ['Monk', 'Champion']
  },
  {
    familyKey: 'assassin',
    label: 'Assassin',
    sub: 'Assassin Cross',
    role: 'dps',
    hexMain: '#6b2fb5',
    hexDark: '#3f1770',
    hexBorder: '#c084fc',
    namePillStyle: 'background-color: #6b2fb5; border-color: #c084fc; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(126,34,206,0.13); border-color: rgba(192,132,252,0.28);',
    jobs: ['Assassin', 'Assassin Cross']
  },
  {
    familyKey: 'rogue',
    label: 'Rogue',
    sub: 'Stalker',
    role: 'dps',
    hexMain: '#7c3aed',
    hexDark: '#4c1d95',
    hexBorder: '#d8b4fe',
    namePillStyle: 'background-color: #7c3aed; border-color: #d8b4fe; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(109,40,217,0.13); border-color: rgba(216,180,254,0.28);',
    jobs: ['Rogue', 'Stalker', 'โร้ก']
  },
  {
    familyKey: 'blacksmith',
    label: 'Blacksmith',
    role: 'dps',
    hexMain: '#ad4f22',
    hexDark: '#692b0e',
    hexBorder: '#fdba74',
    namePillStyle: 'background-color: #ad4f22; border-color: #fdba74; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(194,65,12,0.12); border-color: rgba(253,186,116,0.28);',
    jobs: ['Blacksmith', 'Whitesmith']
  },
  {
    familyKey: 'alchemist',
    label: 'Alchemist',
    role: 'dps',
    hexMain: '#a65422',
    hexDark: '#632e0e',
    hexBorder: '#fcd34d',
    namePillStyle: 'background-color: #a65422; border-color: #fcd34d; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(180,83,9,0.12); border-color: rgba(252,211,77,0.28);',
    jobs: ['Alchemist', 'Creator']
  },
  {
    familyKey: 'rebel',
    label: 'Rebel',
    sub: 'Night Walker',
    role: 'dps',
    hexMain: '#6c352c',
    hexDark: '#421d17',
    hexBorder: '#fca5a5',
    namePillStyle: 'background-color: #6c352c; border-color: #fca5a5; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(127,29,29,0.13); border-color: rgba(252,165,165,0.28);',
    jobs: ['Rebel', 'Night Walker', 'Gunslinger']
  },
  {
    familyKey: 'kanos',
    label: 'คานอส',
    role: 'dps',
    hexMain: '#296e67',
    hexDark: '#16403b',
    hexBorder: '#5eead4',
    namePillStyle: 'background-color: #296e67; border-color: #5eead4; color: #ffffff;',
    cardTintStyle: 'background-color: rgba(15,118,110,0.13); border-color: rgba(94,234,212,0.28);',
    jobs: ['คานอส', 'อาลิเทีย', 'Kanos', 'Alithea']
  }
];

const NOVICE_FAMILY: JobFamilyMeta = {
  familyKey: 'novice',
  label: 'Novice',
  role: 'dps',
  hexMain: '#475569',
  hexDark: '#1e293b',
  hexBorder: '#94a3b8',
  namePillStyle: 'background-color: #475569; border-color: #94a3b8; color: #ffffff;',
  cardTintStyle: 'background-color: rgba(51,65,85,0.12); border-color: rgba(148,163,184,0.22);',
  jobs: ['Novice']
};

export function getJobFamily(jobName?: string): JobFamilyMeta {
  if (!jobName) return NOVICE_FAMILY;
  const key = jobName.trim().toLowerCase();
  for (const fam of JOB_FAMILIES) {
    if (fam.jobs.some(j => j.toLowerCase() === key || key.includes(j.toLowerCase()))) {
      return fam;
    }
  }
  return NOVICE_FAMILY;
}

export function getJobInnerSymbolSVG(familyKey: string): string {
  switch (familyKey) {
    case 'knight':
      return '<path d="M19 45 L44 20 M40 18 L46 18 L46 24" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M23 35 L29 41 M18 46 L22 42" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/><path d="M45 45 L20 20 M24 18 L18 18 L18 24" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M41 35 L35 41 M46 46 L42 42" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>';
    case 'crusader':
      return '<path d="M32 16 L45 21 V32 C45 40.5 39 46.5 32 49 C25 46.5 19 40.5 19 32 V21 L32 16 Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 22 V42 M24 29 H40" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>';
    case 'wizard':
      return '<path d="M24 46 L37 29" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 28 C30 21 36 16 42 19 C47 22 45 30 39 31 C36 31.5 35 28 37 26" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" fill="none"/><circle cx="39" cy="24" r="2.6" fill="#ffffff"/>';
    case 'sage':
      return '<path d="M32 33 C28 28 29 21 34 16 C33 21 38 22 37 28 C39 26 40 23 39 20 C42 24 41 31 35 34 Z" fill="#ffffff"/><path d="M18 33 C23 33 28 35 32 39 C36 35 41 33 46 33 V43 C41 43 36 45 32 49 C28 45 23 43 18 43 Z" fill="rgba(255,255,255,0.2)" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round"/><path d="M21 29 C25 29 29 31 32 35 C35 31 39 29 43 29" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none"/><line x1="32" y1="38" x2="32" y2="48" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>';
    case 'hunter':
      return '<path d="M24 18 C38 21 41 41 24 46" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/><line x1="24" y1="19" x2="24" y2="45" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/><path d="M19 32 H45 M39 26 L46 32 L39 38" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    case 'bard':
      return '<path d="M22 20 C22 34 25 44 33 44 C41 44 43 34 42 22" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M20 20 H44" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/><line x1="29" y1="22" x2="29" y2="42" stroke="#ffffff" stroke-width="2.2"/><line x1="35" y1="22" x2="35" y2="42" stroke="#ffffff" stroke-width="2.2"/>';
    case 'dancer':
      return '<path d="M22 45 L29 36" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M29 36 C38 35 45 27 41 20 C37 15 27 19 29 26 C31 32 42 33 45 41" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" fill="none"/><circle cx="21" cy="45" r="2.5" fill="#ffffff"/>';
    case 'priest':
      return '<path d="M32 16 V48 M18 30 H46" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round"/><circle cx="32" cy="30" r="5" fill="#218332" stroke="#ffffff" stroke-width="2.6"/><path d="M29 18 H35 M29 46 H35 M20 27 V33 M44 27 V33" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>';
    case 'monk':
      return '<path d="M22 29 C22 23 26 20 32 20 C38 20 42 23 42 29 V37 C42 42 38 45 32 45 C26 45 22 42 22 37 Z" fill="#ffffff"/><path d="M32 26 L33.8 30.2 L38 32 L33.8 33.8 L32 38 L30.2 33.8 L26 32 L30.2 30.2 Z" fill="#288d36"/>';
    case 'assassin':
      return '<path d="M32 16 L42 37 L32 33 L22 37 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/><path d="M21 41 H43 M25 45 H39" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>';
    case 'rogue':
      return '<path d="M22 19 C21 29 25 37 31 39 L30 35 L35 37 L38 33 C31 30 26 25 22 19 Z" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><path d="M34 41 L40 31" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M37 37 L43 41 C44.5 42 44.5 44 43 44.8 C41.5 46 39.5 45 38.5 43.5 L35.5 39" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';
    case 'blacksmith':
      return '<line x1="32" y1="17" x2="32" y2="47" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 22 C24 18 18 22 18 28 C18 34 24 38 32 34 Z" fill="#ffffff"/><path d="M32 22 C40 18 46 22 46 28 C46 34 40 38 32 34 Z" fill="#ffffff"/>';
    case 'alchemist':
      return '<path d="M28 18 H36 M30 18 V26 L21 41 C19.5 43.5 21.5 46 24.5 46 H39.5 C42.5 46 44.5 43.5 43 41 L34 26 V18" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24 38 H40 L42 42 H22 Z" fill="#ffffff"/>';
    case 'rebel':
      return '<path d="M19 25 H43 V31 H32 L29 43 H22 L25 31 H19 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="31" cy="28" r="2.4" fill="#6c352c"/>';
    case 'kanos':
      return '<path d="M32 46 V26" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 34 C25 34 21 29 22 24 C23 19 28 17 32 21 C36 17 41 19 42 24 C43 29 39 34 32 34 Z" fill="none" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 46 H39" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>';
    default:
      return '<circle cx="32" cy="32" r="9" fill="#ffffff"/>';
  }
}

export const getJobMeta = getJobFamily;

export const JOB_LOOKUP: Record<string, JobFamilyMeta> = {};
JOB_FAMILIES.forEach(fam => {
  JOB_LOOKUP[fam.familyKey.toLowerCase()] = fam;
  fam.jobs.forEach(j => {
    JOB_LOOKUP[j.toLowerCase()] = fam;
  });
});
