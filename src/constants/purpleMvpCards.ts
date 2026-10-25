// List of Purple MVP Cards from roworlddb.com
export interface PurpleMvpCard {
  id: number;
  name: string;
  quality: 'Purple';
  slot: 'Backwear' | 'Headwear' | 'Mouthwear' | 'Facewear';
  slotTh: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  effects: string[];
}

export const PURPLE_MVP_CARDS: PurpleMvpCard[] = [
  {
    id: 13133001,
    name: 'มายา·Mistress Card',
    quality: 'Purple',
    slot: 'Backwear',
    slotTh: 'หลัง (Backwear)',
    icon: 'icon_item_card_fh_01',
    localIcon: '/images/cards/icon_item_card_fh_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_fh_01.webp',
    effects: [
      'ลดดาเมจต่อเผ่า Human % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133002,
    name: 'มายา·Orc Hero Card',
    quality: 'Purple',
    slot: 'Headwear',
    slotTh: 'ส่วนหัว (Headwear)',
    icon: 'icon_item_card_sryx_01',
    localIcon: '/images/cards/icon_item_card_sryx_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_sryx_01.webp',
    effects: [
      'เพิ่มดาเมจต่อขนาดกลาง % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133003,
    name: 'มายา·Angeling Card',
    quality: 'Purple',
    slot: 'Backwear',
    slotTh: 'หลัง (Backwear)',
    icon: 'icon_item_card_tsbl_01',
    localIcon: '/images/cards/icon_item_card_tsbl_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_tsbl_01.webp',
    effects: [
      'เพิ่มดาเมจต่อขนาดใหญ่ % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133004,
    name: 'มายา·Orc Lord Card',
    quality: 'Purple',
    slot: 'Headwear',
    slotTh: 'ส่วนหัว (Headwear)',
    icon: 'icon_item_card_srqz_01',
    localIcon: '/images/cards/icon_item_card_srqz_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_srqz_01.webp',
    effects: [
      'ลดดาเมจต่อยูนิตขนาดใหญ่ % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133009,
    name: 'มายา·Osiris Card',
    quality: 'Purple',
    slot: 'Mouthwear',
    slotTh: 'ส่วนปาก (Mouthwear)',
    icon: 'icon_item_card_esls_01',
    localIcon: '/images/cards/icon_item_card_esls_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_esls_01.webp',
    effects: [
      'HP สูงสุด% +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133011,
    name: 'มายา·Phreeoni Card',
    quality: 'Purple',
    slot: 'Mouthwear',
    slotTh: 'ส่วนปาก (Mouthwear)',
    icon: 'icon_item_card_pln_01',
    localIcon: '/images/cards/icon_item_card_pln_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_pln_01.webp',
    effects: [
      'ลดดาเมจต่อขนาดกลาง % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133013,
    name: 'มายา·Dracula Card',
    quality: 'Purple',
    slot: 'Facewear',
    slotTh: 'ส่วนหน้า (Facewear)',
    icon: 'icon_item_card_dglnj_01',
    localIcon: '/images/cards/icon_item_card_dglnj_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_dglnj_01.webp',
    effects: [
      'เพิ่มดาเมจต่อเผ่า Human % +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
  {
    id: 13133014,
    name: 'มายา·Goblin Leader Card',
    quality: 'Purple',
    slot: 'Facewear',
    slotTh: 'ส่วนหน้า (Facewear)',
    icon: 'icon_item_card_gblsl_01',
    localIcon: '/images/cards/icon_item_card_gblsl_01.webp',
    remoteIcon: 'https://roworlddb.com/media/images/item/icon_item_card_gblsl_01.webp',
    effects: [
      'P.DEF% +3.60%~6%',
      'มาพร้อมแอฟฟิกซ์สุ่มสูงสุด 2 อย่าง',
    ],
  },
];

