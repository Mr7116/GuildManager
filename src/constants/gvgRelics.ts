import { RELIC_AFFIXES, RelicAffix } from './relicAffixes';

// Base Relics from Ragnarok
export interface GvgBaseRelic {
  id: number;
  baseName: string;
  type: string;
  slot: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  baseStats: string[];
}

export const GVG_BASE_RELICS: GvgBaseRelic[] = [
  {
    id: 70001001,
    baseName: 'Blade of Destruction',
    type: 'Relic (อาวุธ/ดาบ)',
    slot: 'Weapon',
    icon: 'icon_hallows_spear_01',
    localIcon: '/images/relics/icon_hallows_spear_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_spear_01.webp',
    baseStats: ['เพิ่มพลังโจมตีและดาเมจทำลายล้าง'],
  },
  {
    id: 70001002,
    baseName: 'Radiant Holy Shield',
    type: 'Relic (โล่/ป้องกัน)',
    slot: 'Shield',
    icon: 'icon_hallows_shield_01',
    localIcon: '/images/relics/icon_hallows_shield_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_shield_01.webp',
    baseStats: ['เพิ่มพลังป้องกันศักดิ์สิทธิ์และลดดาเมจ'],
  },
  {
    id: 70001003,
    baseName: 'Eternal Strings',
    type: 'Relic (เครื่องดนตรี/ซัพพอร์ต)',
    slot: 'Instrument',
    icon: 'icon_hallows_string_01',
    localIcon: '/images/relics/icon_hallows_string_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_string_01.webp',
    baseStats: ['เพิ่มประสิทธิภาพการซัพพอร์ตและความเร็ว'],
  },
  {
    id: 70001004,
    baseName: 'Blade of Decay',
    type: 'Relic (อาวุธ/กริช)',
    slot: 'Dagger',
    icon: 'icon_hallows_kinfe_01',
    localIcon: '/images/relics/icon_hallows_kinfe_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_kinfe_01.webp',
    baseStats: ['เพิ่มดาเมจกัดกร่อนและลดพลังฟื้นฟูของศัตรู'],
  },
  {
    id: 70001005,
    baseName: 'Intimidation Horn',
    type: 'Relic (แตรสงคราม/ควบคุม)',
    slot: 'Horn',
    icon: 'icon_hallows_horn_01',
    localIcon: '/images/relics/icon_hallows_horn_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_horn_01.webp',
    baseStats: ['เสริมพลังข่มขวัญและต้านทานสถานะควบคุม'],
  },
  {
    id: 70001006,
    baseName: 'Blessing Laurel',
    type: 'Relic (มงกุฎ/ศีรษะ)',
    slot: 'Crown',
    icon: 'icon_hallows_crown_01',
    localIcon: '/images/relics/icon_hallows_crown_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_crown_01.webp',
    baseStats: ['เพิ่ม Max HP และมอบบัฟอวยพรอันศักดิ์สิทธิ์'],
  },
  {
    id: 70001007,
    baseName: 'Judex Scepter',
    type: 'Relic (คทาเวท/พิพากษา)',
    slot: 'Staff',
    icon: 'icon_hallows_mace_01',
    localIcon: '/images/relics/icon_hallows_mace_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_mace_01.webp',
    baseStats: ['เพิ่ม M.ATK และดาเมจเวทพิพากษาแสง'],
  },
  {
    id: 70001008,
    baseName: 'Harmony Crystal',
    type: 'Relic (อัญมณี/คริสตัล)',
    slot: 'Crystal',
    icon: 'icon_hallows_crystal_01',
    localIcon: '/images/relics/icon_hallows_crystal_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/hallows/icon_hallows_crystal_01.webp',
    baseStats: ['ฟื้นฟูพลังและปรับสมดุลธาตุการต่อสู้'],
  },
];

// Helper to create a specific Relic combination
export function getRelicFullName(baseName: string, affixName: string): string {
  return `${baseName} - ${affixName}`;
}

export interface GvgRelic {
  id: number;
  name: string;
  nameTh: string;
  category: 'relic';
  quality: 'Gold' | 'Sage';
  baseName: string;
  affixName: string;
  affixEffect: string;
  type: string;
  slot: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  stats: string[];
}

// Default Sage list for quick access
export const GVG_RELICS: GvgRelic[] = GVG_BASE_RELICS.map((base) => ({
  id: base.id,
  name: `${base.baseName} - Sage`,
  nameTh: `${base.baseName} - Sage`,
  category: 'relic' as const,
  quality: 'Sage' as const,
  baseName: base.baseName,
  affixName: 'Sage',
  affixEffect: 'STR',
  type: base.type,
  slot: base.slot,
  icon: base.icon,
  localIcon: base.localIcon,
  remoteIcon: base.remoteIcon,
  stats: ['Relic (STR)', ...base.baseStats],
}));
