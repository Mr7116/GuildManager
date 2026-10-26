// Title Items (ไอเทม Title) for Auction System
// Official icons from roworlddb: icon_item_touxian_01 to 04

export interface TitleItem {
  id: number;
  name: string;
  nameTh: string;
  category: 'title';
  quality: 'Gold' | 'Purple' | 'Blue' | 'Green';
  qualityBadge: string;
  type: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  stats: string[];
}

export const TITLE_ITEMS: TitleItem[] = [
  {
    id: 18415001,
    name: 'Pioneer Certificate',
    nameTh: 'Pioneer Certificate',
    category: 'title',
    quality: 'Gold',
    qualityBadge: 'Title ส้มทอง',
    type: 'ไอเทม Title (เกียรติบัตร)',
    icon: 'icon_item_touxian_04',
    localIcon: '/images/titles/icon_item_touxian_04.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_touxian_04.webp',
    stats: [
      'ตราสัญลักษณ์ Trailblazer ที่ออกโดยสมาคม Kafra',
      'ของหายากและล้ำค่า ใช้ Promote Title ของ Trailblazer',
      'ย่อยสลายได้เป็นบันทึกการผจญภัย 4 ชิ้น',
    ],
  },
  {
    id: 18414001,
    name: 'Adventure Journal',
    nameTh: 'Adventure Journal',
    category: 'title',
    quality: 'Purple',
    qualityBadge: 'Title ม่วง',
    type: 'ไอเทม Title (สมุดบันทึก)',
    icon: 'icon_item_touxian_03',
    localIcon: '/images/titles/icon_item_touxian_03.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_touxian_03.webp',
    stats: [
      'สมุดบันทึกข้อมูลการผจญภัยระดับสูง',
      'ใช้สำหรับ Level Up Title หรือ Promote Title',
      'ย่อยสลายได้เป็นเศษบันทึกการผจญภัย 4 ชิ้น',
    ],
  },
  {
    id: 18413001,
    name: 'Adventure Scrap',
    nameTh: 'Adventure Scrap',
    category: 'title',
    quality: 'Blue',
    qualityBadge: 'Title ฟ้า',
    type: 'ไอเทม Title (เศษบันทึก)',
    icon: 'icon_item_touxian_02',
    localIcon: '/images/titles/icon_item_touxian_02.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_touxian_02.webp',
    stats: [
      'ข้อมูลล้ำค่าที่บันทึกไว้ระหว่างการผจญภัย',
      'ใช้สำหรับ Level Up Title หรือผสมผสานเป็นไอเทม Title ระดับสูงขึ้น',
      'ย่อยสลายได้เป็นบันทึกนักเดินทาง 4 ชิ้น',
    ],
  },
  {
    id: 18412001,
    name: "Traveler's Note",
    nameTh: "Traveler's Note",
    category: 'title',
    quality: 'Green',
    qualityBadge: 'Title เขียว',
    type: 'ไอเทม Title (โน้ตนักเดินทาง)',
    icon: 'icon_item_touxian_01',
    localIcon: '/images/titles/icon_item_touxian_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_touxian_01.webp',
    stats: [
      'บันทึกย่อที่จดไว้ระหว่างเดินทาง',
      'ใช้สำหรับ Level Up Title หรือผสมผสานเป็นไอเทม Title ระดับสูงขึ้น',
    ],
  },
];

export interface TitleTierStyle {
  tier: 'gold' | 'purple' | 'blue' | 'green';
  border: string;
  bg: string;
  text: string;
  badgeBg: string;
  shadow: string;
  label: string;
}

export function getTitleTierStyle(itemNameOrIcon?: string): TitleTierStyle {
  const str = (itemNameOrIcon || '').toLowerCase();

  // Pioneer Certificate -> กรอบสีทอง
  if (str.includes('pioneer') || str.includes('touxian_04')) {
    return {
      tier: 'gold',
      border: 'border-amber-400 dark:border-amber-500/70',
      bg: 'bg-amber-500/15 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
      shadow: 'shadow-amber-500/20',
      label: 'Title ส้มทอง',
    };
  }

  // Adventure Journal -> กรอบสีม่วง
  if (str.includes('journal') || str.includes('touxian_03')) {
    return {
      tier: 'purple',
      border: 'border-purple-400 dark:border-purple-500/70',
      bg: 'bg-purple-500/15 dark:bg-purple-950/30',
      text: 'text-purple-600 dark:text-purple-300',
      badgeBg: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
      shadow: 'shadow-purple-500/20',
      label: 'Title ม่วง',
    };
  }

  // Adventure Scrap -> กรอบสีฟ้า
  if (str.includes('scrap') || str.includes('touxian_02')) {
    return {
      tier: 'blue',
      border: 'border-sky-400 dark:border-sky-500/70',
      bg: 'bg-sky-500/15 dark:bg-sky-950/30',
      text: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
      shadow: 'shadow-sky-500/20',
      label: 'Title ฟ้า',
    };
  }

  // Traveler's Note -> กรอบสีเขียว
  if (str.includes('note') || str.includes('traveler') || str.includes('touxian_01')) {
    return {
      tier: 'green',
      border: 'border-emerald-400 dark:border-emerald-500/70',
      bg: 'bg-emerald-500/15 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
      shadow: 'shadow-emerald-500/20',
      label: 'Title เขียว',
    };
  }

  return {
    tier: 'gold',
    border: 'border-amber-400 dark:border-amber-500/70',
    bg: 'bg-amber-500/15 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-300',
    badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
    shadow: 'shadow-amber-500/20',
    label: 'ไอเทม Title',
  };
}
