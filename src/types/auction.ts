export interface BidRecord {
  id: string;
  memberId: string;
  memberName: string;
  memberJob?: string;
  amount: number;
  timestamp: string; // ISO String
  note?: string;
}

export interface AuctionRound {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  closedAt?: string;
  note?: string;
}

export interface AuctionEntry {
  id: string;
  memberId: string;
  memberName: string;
  memberJob?: string;
  registeredAt: string;
}

export interface AuctionItem {
  id: string;
  roundId?: string;
  itemCategory?: 'accessory' | 'card' | 'relic' | 'title' | 'chest' | 'pet';
  cardSlot?: string;
  cardQuality?: string;
  accessoryId: number;
  accessoryName: string;
  accessoryLevel?: number;
  accessoryIcon: string;
  accessoryStats: string[];

  // Price & Settings
  startPrice: number;
  minIncrement: number;
  currentPrice: number;

  status: 'pending' | 'active' | 'ended' | 'cancelled';

  // Registered Participants for Lucky Wheel
  entries: AuctionEntry[];
  maxEntries?: number; // จำกัดจำนวนคนลงชื่อสูงสุด (undefined หรือ <= 0 คือไม่จำกัด เช่น 1 = 0/1)

  // Winner Information
  winnerMemberId?: string;
  winnerMemberName?: string;
  winnerMemberJob?: string;
  winners?: Array<{ memberId: string; memberName: string; memberJob?: string; count: number }>;
  finalPrice?: number;

  // Metadata
  sourceNote?: string;
  createdAt: string;
  startedAt?: string;
  endsAt?: string;
  closedAt?: string;

  // Bids
  bids: BidRecord[];
}

export function formatRegistrationTime(isoStr?: string): string {
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

export function formatRegistrationDateTime(isoStr?: string): string {
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


