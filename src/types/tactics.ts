export type TacticalIconType =
  | 'sword'     // ⚔️ โจมตี / บุกตี
  | 'shield'    // 🛡️ ป้องกัน / ตั้งรับ
  | 'target'    // 🎯 โฟกัสเป้าหมาย
  | 'portal'    // 🌀 วาร์ป / จุดรวมพล
  | 'flag'      // 🚩 ยึดธง / จุดยึด
  | 'bomb'      // 💣 ทะลวง / ทำลาย
  | 'eye'       // 👁️ ดักซุ่ม / สเกาต์
  | 'support'   // 💊 ซัพพอร์ต / ชุบชีวิต
  | 'warning'   // ⚠️ อันตราย / ระวัง
  | 'pin'       // 📍 จุดพิกัด
  | 'party';    // 👥 ปาร์ตี้ / ทีม

export type TacticalColorType =
  | 'rose'      // แดง
  | 'blue'      // น้ำเงิน
  | 'emerald'   // เขียว
  | 'amber'     // เหลือง
  | 'purple'    // ม่วง
  | 'orange'    // ส้ม
  | 'cyan'      // ฟ้าคราม
  | 'slate';    // เทา

export interface TacticalPin {
  id: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  icon: TacticalIconType;
  color: TacticalColorType;
  label: string; // e.g. "ตี้ 1+2 ทะลวงหน้าวาร์ป"
  assignedParty?: string; // e.g. "ปาร์ตี้ 1", "ทัพหลัก"
  orderNumber?: number; // ลำดับคำสั่ง เช่น 1, 2, 3
  note?: string; // บันทึกคำสั่งเพิ่มเติม
  createdAt?: string;
}

export interface TacticalDrawnLine {
  id: string;
  points: { x: number; y: number }[]; // percentage (0 - 100)
  color: string;
  width: number;
}

export type TacticalMapPresetId = 'map_outer' | 'map_emperium' | 'map_corridor' | 'custom';

export interface TacticalMapPreset {
  id: TacticalMapPresetId;
  name: string;
  subtitle: string;
  imageUrl: string;
  recommendedRole: string;
}

export interface TacticalPlan {
  id: string;
  name: string;
  mapId: TacticalMapPresetId;
  customImageUrl?: string;
  description?: string;
  pins: TacticalPin[];
  lines?: TacticalDrawnLine[];
  createdAt: string;
  updatedAt: string;
}

