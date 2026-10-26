// Chest & Box Items (กล่อง / หีบสมบัติ / Pack) for Auction System
// Official icons from roworlddb and high-res vector assets

export interface ChestItem {
  id: number;
  name: string;
  nameTh: string;
  category: 'chest';
  quality: 'Gold' | 'Purple' | 'Blue';
  qualityBadge: string;
  type: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  stats: string[];
}

export const CHEST_ITEMS: ChestItem[] = [
  {
    id: 11603003,
    name: 'หีบ Pioneer Certificate',
    nameTh: 'หีบ Pioneer Certificate',
    category: 'chest',
    quality: 'Gold',
    qualityBadge: 'Pack ส้มทอง',
    type: 'กล่อง Title (Pack)',
    icon: 'gold_title_chest',
    localIcon: '/images/chests/gold_title_chest.webp',
    remoteIcon: '/images/chests/gold_title_chest.svg',
    stats: [
      'หีบเกียรติยศบรรจุ Pioneer Certificate (เกียรติบัตรนักบุกเบิก)',
      'ใช้สำหรับ Promote Title สู่ระดับ Trailblazer สูงสุด',
      'ไอเทมประเภท Pack ล้ำค่าจากกิจกรรมกิลด์',
    ],
  },
  {
    id: 11603001,
    name: 'หีบ Adventure Journal',
    nameTh: 'หีบ Adventure Journal',
    category: 'chest',
    quality: 'Purple',
    qualityBadge: 'Pack ม่วง',
    type: 'กล่อง Title (Pack)',
    icon: 'purple_title_chest',
    localIcon: '/images/chests/purple_title_chest.webp',
    remoteIcon: '/images/chests/purple_title_chest.svg',
    stats: [
      'หีบสมบัติบรรจุสมุดบันทึกการผจญภัย (Adventure Journal)',
      'ใช้สำหรับ Level Up หรือ Promote Title ขั้นสูง',
      'ไอเทมประเภท Pack จากกิจกรรมกิลด์',
    ],
  },
  {
    id: 11603002,
    name: 'หีบ Adventure Scrap',
    nameTh: 'หีบ Adventure Scrap',
    category: 'chest',
    quality: 'Blue',
    qualityBadge: 'Pack ฟ้า',
    type: 'กล่อง Title (Pack)',
    icon: 'blue_title_chest',
    localIcon: '/images/chests/blue_title_chest.webp',
    remoteIcon: '/images/chests/blue_title_chest.svg',
    stats: [
      'หีบสมบัติบรรจุเศษบันทึกการผจญภัย (Adventure Scrap)',
      'ใช้สำหรับ Level Up หรือ ผสมผสานไอเทม Title',
      'ไอเทมประเภท Pack จากกิจกรรมกิลด์',
    ],
  },
  {
    id: 11594068,
    name: 'หีบเลือกอัญมณีขั้นสูง',
    nameTh: 'หีบเลือกอัญมณีขั้นสูง',
    category: 'chest',
    quality: 'Gold',
    qualityBadge: 'Pack ส้มทอง',
    type: 'กล่องอัญมณี (Pack)',
    icon: 'icon_item_stonebox_14',
    localIcon: '/images/chests/icon_item_stonebox_14.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp',
    stats: [
      'หีบมหัศจรรย์ที่บรรจุอัญมณีหลากหลายชนิดไว้ภายใน',
      'เปิดเพื่อเลือกรับอัญมณีขั้นสูง 1 ชิ้นตามต้องการ',
      'ประกอบด้วย: Imperious Gem, Sharp Gem, Famed Bow Gem ฯลฯ',
    ],
  },
  {
    id: 11594070,
    name: 'กล่องเลือกอัญมณีสุดยอด',
    nameTh: 'กล่องเลือกอัญมณีสุดยอด',
    category: 'chest',
    quality: 'Gold',
    qualityBadge: 'Pack ส้มทอง',
    type: 'กล่องอัญมณีสุดยอด (Pack)',
    icon: 'box_gem_ultimate',
    localIcon: '/images/chests/box_gem_ultimate.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp',
    stats: [
      'กล่องเลือกสรรอัญมณีระดับสูงสุดอันล้ำค่า',
      'เปิดเพื่อเลือกรับอัญมณีระดับสุดยอดที่ต้องการ',
      'ไอเทมประมูลระดับพรีเมียมของกิลด์',
    ],
  },
];

export interface ChestTierStyle {
  tier: 'gold' | 'purple' | 'blue';
  border: string;
  bg: string;
  text: string;
  badgeBg: string;
  shadow: string;
  label: string;
}

export function getChestTierStyle(itemNameOrQuality?: string): ChestTierStyle {
  const str = (itemNameOrQuality || '').toLowerCase();

  // Blue tier (หีบ Adventure Scrap)
  if (str.includes('adventure scrap') || str.includes('scrap') || str.includes('blue') || str.includes('ฟ้า')) {
    return {
      tier: 'blue',
      border: 'border-sky-400 dark:border-sky-500/70',
      bg: 'bg-sky-50 dark:bg-sky-950/20',
      text: 'text-sky-800 dark:text-sky-300',
      badgeBg: 'bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-900 dark:text-sky-200 border-sky-500/50',
      shadow: 'shadow-sky-500/10',
      label: 'Pack ฟ้า',
    };
  }

  // Purple tier (หีบ Adventure Journal)
  if (str.includes('adventure journal') || str.includes('journal') || str.includes('purple') || str.includes('ม่วง')) {
    return {
      tier: 'purple',
      border: 'border-purple-400 dark:border-purple-500/70',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-800 dark:text-purple-300',
      badgeBg: 'bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 text-purple-900 dark:text-purple-200 border-purple-500/50',
      shadow: 'shadow-purple-500/10',
      label: 'Pack ม่วง',
    };
  }

  // Gold tier (หีบ Pioneer Certificate, หีบเลือกอัญมณีขั้นสูง, กล่องเลือกอัญมณีสุดยอด)
  return {
    tier: 'gold',
    border: 'border-amber-400 dark:border-amber-500/70',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-300',
    badgeBg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 dark:text-amber-200 border-amber-500/50',
    shadow: 'shadow-amber-500/10',
    label: 'Pack ส้มทอง',
  };
}
