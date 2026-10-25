export interface RelicAffix {
  id: string;
  name: string;
  effect: string;
  category: 'stat' | 'element' | 'status';
  categoryTh: string;
}

export const RELIC_AFFIXES: RelicAffix[] = [
  // Stats
  { id: 'sage', name: 'Sage', effect: 'STR', category: 'stat', categoryTh: 'สเตตัสหลัก' },
  { id: 'divine', name: 'Divine', effect: 'INT', category: 'stat', categoryTh: 'สเตตัสหลัก' },
  { id: 'rainbow_scar', name: 'Rainbow Scar', effect: 'VIT', category: 'stat', categoryTh: 'สเตตัสหลัก' },
  { id: 'fate_wheel', name: 'Fate Wheel', effect: 'AGI', category: 'stat', categoryTh: 'สเตตัสหลัก' },
  { id: 'celestial', name: 'Celestial', effect: 'LUK', category: 'stat', categoryTh: 'สเตตัสหลัก' },
  { id: 'omniverse', name: 'Omniverse', effect: 'DEX', category: 'stat', categoryTh: 'สเตตัสหลัก' },

  // Elements
  { id: 'flowing_mirror', name: 'Flowing Mirror', effect: 'ต้านทานธาตุ Neutral', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'abyssal_demise', name: 'Abyssal Demise', effect: 'ต้านทานธาตุ Water', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'ice_coffin', name: 'Ice Coffin', effect: 'ต้านทานธาตุ Earth', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'firmament_anchor', name: 'Firmament Anchor', effect: 'ต้านทานธาตุ Fire', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'plague_cauldron', name: 'Plague Cauldron', effect: 'ต้านทานธาตุ Wind', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'eternal_night', name: 'Eternal Night', effect: 'ต้านทานธาตุ Poison', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'collapse_shadow', name: 'Collapse Shadow', effect: 'ต้านทานธาตุ Holy', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'god_erosion', name: 'God Erosion', effect: 'ต้านทานธาตุ Shadow', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'purity', name: 'Purity', effect: 'ต้านทานธาตุ Ghost', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'flame_order', name: 'Flame Order', effect: 'ต้านทานธาตุ Undead', category: 'element', categoryTh: 'ต้านทานธาตุ' },
  { id: 'shadow_shackle', name: 'Shadow Shackle', effect: 'ต้านธาตุทั้งหมด', category: 'element', categoryTh: 'ต้านทานธาตุ' },

  // Status Resist
  { id: 'stone_edict', name: 'Stone Edict', effect: 'ต้านทานแช่แข็ง', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'awakened_dream', name: 'Awakened Dream', effect: 'ต้านทานกลายเป็นหิน', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'eternal', name: 'Eternal', effect: 'ต้านทานสตัน', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'gloom', name: 'Gloom', effect: 'ต้านทานดรึง', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'yan_lu', name: 'Yan Lu', effect: 'ต้านทานมืดบอด', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'chrono_wedge', name: 'Chrono Wedge', effect: 'ต้านทานใบ้', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'axis', name: 'Axis', effect: 'ต้านทานหน่วง', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'sanctum', name: 'Sanctum', effect: 'ต้านทานผลักกระเด็น', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'sword_tomb', name: 'Sword Tomb', effect: 'ต้านทานหลับใหล', category: 'status', categoryTh: 'ต้านทานสถานะ' },
  { id: 'rune_wheel', name: 'Rune Wheel', effect: 'ต้านทานสับสน', category: 'status', categoryTh: 'ต้านทานสถานะ' },
];

