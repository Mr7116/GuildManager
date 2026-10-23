import { GvgLaneMeta, LaneKey } from '@/types/party';

export const GVG_LANES: GvgLaneMeta[] = [
  {
    key: 'lane_mid',
    name: 'เลนกลาง (MID)',
    shortName: 'เลนกลาง',
    fullName: '⚔️ เลนกลาง (MID)',
    subtitle: 'ทัพปะทะหลักทะลวงเลนกลาง ควบคุมพื้นที่ใจกลางสนาม',
    icon: '⚔️',
    hexAccent: '#eab308',
    badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    activeClass: 'bg-amber-400 text-slate-950 font-bold'
  },
  {
    key: 'lane_left',
    name: 'เลนซ้าย (LEFT)',
    shortName: 'เลนซ้าย',
    fullName: '🛡️ เลนซ้าย (LEFT)',
    subtitle: 'ทัพประจำการปีกซ้าย ตั้งรับและดันเลนซ้าย',
    icon: '🛡️',
    hexAccent: '#22c55e',
    badgeClass: 'bg-green-500/20 text-green-300 border-green-500/40',
    activeClass: 'bg-green-500 text-slate-950 font-bold'
  },
  {
    key: 'lane_right',
    name: 'เลนขวา (RIGHT)',
    shortName: 'เลนขวา',
    fullName: '🏹 เลนขวา (RIGHT)',
    subtitle: 'ทัพประจำการปีกขวา คุมเชิงและดันเลนขวา',
    icon: '🏹',
    hexAccent: '#ef4444',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
    activeClass: 'bg-red-500 text-white font-bold'
  },
  {
    key: 'roam_left',
    name: 'โรมซ้าย (Roaming left)',
    shortName: 'โรมซ้าย',
    fullName: '⚡ โรมซ้าย (Roaming left)',
    subtitle: 'หน่วยเคลื่อนที่เร็วฝั่งซ้าย เคลียร์เป้าหมายและซัพพอร์ตเลนซ้าย',
    icon: '⚡',
    hexAccent: '#10b981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    activeClass: 'bg-emerald-400 text-slate-950 font-bold'
  },
  {
    key: 'roam_right',
    name: 'โรมขวา (Roaming right)',
    shortName: 'โรมขวา',
    fullName: '🌪️ โรมขวา (Roaming right)',
    subtitle: 'หน่วยเคลื่อนที่เร็วฝั่งขวา ซ้อนเสริมจังหวะและซัพพอร์ตเลนขวา',
    icon: '🌪️',
    hexAccent: '#06b6d4',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    activeClass: 'bg-cyan-500 text-slate-950 font-bold'
  }
];

export function getGvgLane(laneKey?: LaneKey | string): GvgLaneMeta {
  return GVG_LANES.find(l => l.key === laneKey) || GVG_LANES[0];
}

