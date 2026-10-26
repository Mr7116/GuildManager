export type QueueDungeonType =
  | 'vanished_75'          // มายาสิ้นสูญ Lv.75
  | 'vanished_95'          // มายาสิ้นสูญ Lv.95
  | 'apocalypse_normal'   // Apocalypse ทั่วไป
  | 'apocalypse_hard'     // Apocalypse ยาก
  | 'apocalypse_nightmare'// Apocalypse ฝันร้าย
  | 'apocalypse_hell'     // Apocalypse นรก
  | 'apocalypse_endless'  // Apocalypse ไม่สิ้นสุด
  | 'custom';             // กำหนดเอง

export interface QueueEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberJob?: string;
  joinedAt: string; // ISO 8601 string
  isCompleted?: boolean; // ติ๊กถูก บอกว่าคนนี้ผ่านเรียบร้อยแล้ว
  completedAt?: string;
  note?: string;
}

export interface QueueList {
  id: string;
  title: string;
  dungeonType: QueueDungeonType;
  dungeonCategory: 'vanished' | 'apocalypse' | 'custom';
  levelRequirement?: string;  // e.g. "Lv.75", "Lv.95"
  difficultyLabel?: string;   // e.g. "ทั่วไป", "ยาก", "ฝันร้าย", "นรก", "ไม่สิ้นสุด"
  maxPartySize: number;       // ค่าเริ่มต้น 5 คน ต่อปาร์ตี้
  maxCapacity?: number;       // รับคิวสูงสุดกี่คน (undefined = ไม่จำกัด)
  status: 'open' | 'in_progress' | 'closed';
  entries: QueueEntry[];
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  note?: string;
}

export function formatQueueTime(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return (
      d.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' น.'
    );
  } catch {
    return '';
  }
}

export function formatQueueDateTime(isoStr?: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const datePart = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    const timePart = d.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return `${datePart} ${timePart} น.`;
  } catch {
    return '';
  }
}

