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

export function isTitleItem(item?: Partial<AuctionItem> | null): boolean {
  if (!item) return false;
  if (item.itemCategory === 'title') return true;
  const name = item.accessoryName || '';
  const slot = item.cardSlot || '';
  const quality = item.cardQuality || '';
  const icon = item.accessoryIcon || '';

  if (slot.includes('Title') || quality.includes('Title')) return true;
  if (icon.includes('touxian')) return true;
  if (
    name.includes('Adventure Scrap') ||
    name.includes('Pioneer Certificate') ||
    name.includes('Adventure Journal') ||
    name.includes("Traveler's Note")
  ) {
    return true;
  }
  return false;
}

export function isChestItem(item?: Partial<AuctionItem> | null): boolean {
  if (!item) return false;
  if (isTitleItem(item)) return false;
  if (item.itemCategory === 'chest') return true;
  const name = (item.accessoryName || '').toLowerCase();
  const slot = (item.cardSlot || '').toLowerCase();
  const quality = (item.cardQuality || '').toLowerCase();
  const icon = (item.accessoryIcon || '').toLowerCase();

  if (slot.includes('หีบ') || slot.includes('กล่อง') || slot.includes('pack') || slot.includes('chest') || slot.includes('box')) return true;
  if (quality.includes('pack') || quality.includes('chest') || quality.includes('box')) return true;
  if (icon.includes('title_chest') || icon.includes('stonebox') || icon.includes('gem') || icon.includes('chest') || icon.includes('box')) return true;
  if (name.includes('หีบ') || name.includes('กล่อง') || name.includes('pack') || name.includes('chest') || name.includes('box')) return true;
  return false;
}

/**
 * Returns true if an item allows multiple registrations/entries per member.
 * Title (ฉายา) and Chest / Box / Pack (กล่อง / หีบสมบัติ) allow multiple entries up to quota.
 * Other items (Weapons, Red Accessories, MVP/Purple Cards, Relics, Pets) are restricted to 1 entry per member.
 */
export function isMultiEntryItem(item?: Partial<AuctionItem> | null): boolean {
  return isTitleItem(item) || isChestItem(item);
}


