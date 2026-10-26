import { QueueDungeonType } from '@/types/queue';

export interface QueuePreset {
  id: QueueDungeonType;
  name: string;
  category: 'vanished' | 'apocalypse' | 'custom';
  level?: string;
  difficulty?: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  defaultPartySize: number;
  description: string;
}

export const QUEUE_PRESETS: QueuePreset[] = [
  {
    id: 'vanished_75',
    name: 'มายาสิ้นสูญ Lv.75',
    category: 'vanished',
    level: 'Lv.75',
    badgeColor: 'text-sky-300',
    badgeBg: 'bg-sky-500/20',
    badgeBorder: 'border-sky-500/40',
    icon: '🌀',
    defaultPartySize: 5,
    description: 'ดันเจี้ยนมายาสิ้นสูญ ระดับเลเวล 75 (ปาร์ตี้ละ 5 คน)',
  },
  {
    id: 'vanished_95',
    name: 'มายาสิ้นสูญ Lv.95',
    category: 'vanished',
    level: 'Lv.95',
    badgeColor: 'text-purple-300',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/40',
    icon: '🔮',
    defaultPartySize: 5,
    description: 'ดันเจี้ยนมายาสิ้นสูญ ระดับเลเวล 95 (ปาร์ตี้ละ 5 คน)',
  },
  {
    id: 'apocalypse_normal',
    name: 'Apocalypse ทั่วไป',
    category: 'apocalypse',
    difficulty: 'ทั่วไป',
    badgeColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/40',
    icon: '⚔️',
    defaultPartySize: 5,
    description: 'มหันตภัยกิลด์ Apocalypse ระดับทั่วไป',
  },
  {
    id: 'apocalypse_hard',
    name: 'Apocalypse ยาก',
    category: 'apocalypse',
    difficulty: 'ยาก',
    badgeColor: 'text-blue-300',
    badgeBg: 'bg-blue-500/20',
    badgeBorder: 'border-blue-500/40',
    icon: '🛡️',
    defaultPartySize: 5,
    description: 'มหันตภัยกิลด์ Apocalypse ระดับยาก',
  },
  {
    id: 'apocalypse_nightmare',
    name: 'Apocalypse ฝันร้าย',
    category: 'apocalypse',
    difficulty: 'ฝันร้าย',
    badgeColor: 'text-purple-300',
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/40',
    icon: '💀',
    defaultPartySize: 5,
    description: 'มหันตภัยกิลด์ Apocalypse ระดับฝันร้าย',
  },
  {
    id: 'apocalypse_hell',
    name: 'Apocalypse นรก',
    category: 'apocalypse',
    difficulty: 'นรก',
    badgeColor: 'text-rose-300',
    badgeBg: 'bg-rose-500/20',
    badgeBorder: 'border-rose-500/40',
    icon: '🔥',
    defaultPartySize: 5,
    description: 'มหันตภัยกิลด์ Apocalypse ระดับนรก',
  },
  {
    id: 'apocalypse_endless',
    name: 'Apocalypse ไม่สิ้นสุด',
    category: 'apocalypse',
    difficulty: 'ไม่สิ้นสุด',
    badgeColor: 'text-amber-300',
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/40',
    icon: '👑',
    defaultPartySize: 5,
    description: 'มหันตภัยกิลด์ Apocalypse ระดับไม่สิ้นสุด (Endless)',
  },
];

export function getQueuePreset(id: QueueDungeonType): QueuePreset | undefined {
  return QUEUE_PRESETS.find((p) => p.id === id);
}

