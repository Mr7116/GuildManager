'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/member';
import { Party, Team, LaneKey, FieldZoneKey } from '@/types/party';
import { AuctionItem, AuctionEntry, AuctionRound, BidRecord, isTitleItem } from '@/types/auction';
import { QueueList, QueueEntry } from '@/types/queue';

export interface GuildState {
  guildName: string;
  setGuildName: React.Dispatch<React.SetStateAction<string>>;
  fileTimestamp: string;
  setFileTimestamp: React.Dispatch<React.SetStateAction<string>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  gvgTeams: Team[];
  setGvgTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  gvgParties: Party[];
  setGvgParties: React.Dispatch<React.SetStateAction<Party[]>>;
  siegeTeams: Team[];
  setSiegeTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  siegeParties: Party[];
  setSiegeParties: React.Dispatch<React.SetStateAction<Party[]>>;
  polarityTeams: Team[];
  setPolarityTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  polarityParties: Party[];
  setPolarityParties: React.Dispatch<React.SetStateAction<Party[]>>;
  presetParties: Party[];
  setPresetParties: React.Dispatch<React.SetStateAction<Party[]>>;
  auctionItems: AuctionItem[];
  setAuctionItems: React.Dispatch<React.SetStateAction<AuctionItem[]>>;
  auctionRounds: AuctionRound[];
  setAuctionRounds: React.Dispatch<React.SetStateAction<AuctionRound[]>>;
  activeRoundId: string | null;
  setActiveRoundId: (id: string | null) => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;

  isLoading: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  saveStatus: 'idle' | 'pending' | 'saving' | 'saved' | 'error';
  error: string | null;

  loadFromCloud: () => Promise<void>;
  saveToCloud: () => Promise<void>;
  triggerAutoSave: (delayMs?: number) => void;

  // GVG Operations
  setPartyLane: (partyId: string, lane: LaneKey) => void;
  setPartyTeam: (partyId: string, targetTeamId: string) => void;
  renameParty: (partyId: string, newName: string) => void;
  clearPartySlots: (partyId: string) => void;
  deleteParty: (partyId: string) => void;
  addPartyToTeam: (teamId: string) => void;
  renumberTeamParties: (teamId: string) => void;
  setTeamField: (teamId: string, field: FieldZoneKey) => void;
  renameTeam: (teamId: string, newName: string) => void;
  setTeamColor: (teamId: string, color: string) => void;
  removeMemberFromSlot: (partyId: string, slotIndex: number) => void;
  placeMemberInSlot: (partyId: string, slotIndex: number, memberId: string) => void;
  swapSlots: (fromPartyId: string, fromSlotIdx: number, toPartyId: string, toSlotIdx: number) => void;
  applyPresetToParty: (mode: 'gvg' | 'siege' | 'polarity', targetPartyId: string, presetPartyId: string) => void;

  // Auction Round Operations
  createAuctionRound: (name: string, date?: string, note?: string) => string;
  updateAuctionRound: (id: string, updates: Partial<AuctionRound>) => void;
  deleteAuctionRound: (id: string) => void;
  completeAuctionRound: (id: string) => void;
  reopenAuctionRound: (id: string) => void;

  // Auction Operations
  addAuctionItem: (item: Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }) => void;
  addAuctionItems: (items: Array<Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }>) => void;
  startAuction: (auctionId: string) => void;
  startAllPendingAuctions: () => void;
  addMemberToAuction: (auctionId: string, memberId: string) => void;
  addMultipleMembersToAuction: (auctionId: string, memberIds: string[]) => void;
  removeMemberFromAuction: (auctionId: string, memberId: string) => void;
  removeOneMemberEntryFromAuction: (auctionId: string, memberId: string) => void;
  removeMemberEntryById: (auctionId: string, entryId: string) => void;
  updateAuctionMaxEntries: (auctionId: string, maxEntries?: number) => void;
  setAuctionWinner: (auctionId: string, winnerMemberId: string) => void;
  confirmAuctionWinners: (auctionId: string) => void;
  resetAuctionWinner: (auctionId: string) => void;
  placeBid: (auctionId: string, memberId: string, memberName: string, memberJob: string | undefined, amount: number, note?: string) => { success: boolean; message: string };
  closeAuction: (auctionId: string, winnerMemberId?: string) => void;
  deleteAuctionItem: (auctionId: string) => void;
  cancelAuctionItem: (auctionId: string) => void;

  // Queue Management
  queueLists: QueueList[];
  createQueueList: (data: Omit<QueueList, 'id' | 'createdAt' | 'entries'>) => string;
  updateQueueList: (id: string, updates: Partial<QueueList>) => void;
  deleteQueueList: (id: string) => void;
  addMemberToQueue: (queueId: string, memberId: string, note?: string) => { success: boolean; message: string };
  removeMemberFromQueue: (queueId: string, entryId: string) => void;
  removeMemberByMemberIdFromQueue: (queueId: string, memberId: string) => void;
  reorderQueueEntries: (queueId: string, entries: QueueEntry[]) => void;
  toggleQueueEntryCompleted: (queueId: string, entryId: string) => void;
  clearQueueEntries: (queueId: string) => void;
  setQueueStatus: (queueId: string, status: 'open' | 'in_progress' | 'closed') => void;
}

const DEFAULT_GVG_TEAMS: Team[] = [
  { id: 'team_a', name: 'ทีม A', field: 'main', color: 'rose' },
  { id: 'team_b', name: 'ทีม B', field: 'main', color: 'sky' },
  { id: 'team_c', name: 'ทีม C', field: 'sub', color: 'amber' },
];

const DEFAULT_GVG_PARTIES: Party[] = [
  { id: 'gvg_p1', name: 'ปาร์ตี้ 1', teamId: 'team_a', lane: 'lane_mid', slots: [null, null, null, null, null] },
  { id: 'gvg_p2', name: 'ปาร์ตี้ 2', teamId: 'team_a', lane: 'lane_mid', slots: [null, null, null, null, null] },
  { id: 'gvg_p3', name: 'ปาร์ตี้ 3', teamId: 'team_a', lane: 'lane_right', slots: [null, null, null, null, null] },
  { id: 'gvg_p4', name: 'ปาร์ตี้ 4', teamId: 'team_a', lane: 'roam_left', slots: [null, null, null, null, null] },
  { id: 'gvg_p5', name: 'ปาร์ตี้ 5', teamId: 'team_b', lane: 'lane_left', slots: [null, null, null, null, null] },
  { id: 'gvg_p6', name: 'ปาร์ตี้ 6', teamId: 'team_b', lane: 'lane_left', slots: [null, null, null, null, null] },
  { id: 'gvg_p7', name: 'ปาร์ตี้ 7', teamId: 'team_c', lane: 'roam_right', slots: [null, null, null, null, null] },
  { id: 'gvg_p8', name: 'ปาร์ตี้ 8', teamId: 'team_c', lane: 'roam_right', slots: [null, null, null, null, null] },
];

const GuildContext = createContext<GuildState | null>(null);

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [guildName, setGuildName] = useState('TUMDOOD');
  const [fileTimestamp, setFileTimestamp] = useState('กำลังโหลด...');
  const [members, setMembers] = useState<Member[]>([]);
  const [gvgTeams, setGvgTeams] = useState<Team[]>(DEFAULT_GVG_TEAMS);
  const [gvgParties, setGvgParties] = useState<Party[]>(DEFAULT_GVG_PARTIES);
  const [siegeTeams, setSiegeTeams] = useState<Team[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('TUMDOOD_siege_teams');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [{ id: 'siege_team_1', name: 'ทีมปราสาท 1', color: 'sky', field: 'main' }];
  });
  const [siegeParties, setSiegeParties] = useState<Party[]>([]);
  const [polarityTeams, setPolarityTeams] = useState<Team[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('TUMDOOD_polarity_teams');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [{ id: 'pol_main', name: 'สงครามดาว', color: 'amber', field: 'main' }];
  });
  const [polarityParties, setPolarityParties] = useState<Party[]>([]);
  const [presetParties, setPresetParties] = useState<Party[]>([]);
  const [auctionRounds, setAuctionRounds] = useState<AuctionRound[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('TUMDOOD_auction_rounds');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return [
      {
        id: 'round_default',
        name: 'รอบประมูลรอบที่ 1',
        date: new Date().toISOString().split('T')[0],
        status: 'active',
        createdAt: new Date().toISOString(),
        note: 'รอบประมูลเริ่มต้น',
      },
    ];
  });
  const [activeRoundId, setActiveRoundId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedRounds = localStorage.getItem('TUMDOOD_auction_rounds');
        if (cachedRounds) {
          const parsed = JSON.parse(cachedRounds);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const active = parsed.find((r: AuctionRound) => r.status === 'active');
            return active ? active.id : parsed[0].id;
          }
        }
      } catch (e) {}
    }
    return 'round_default';
  });

  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('TUMDOOD_auctions');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('TUMDOOD_auctions', JSON.stringify(auctionItems));
      } catch (e) {}
    }
  }, [auctionItems]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('TUMDOOD_auction_rounds', JSON.stringify(auctionRounds));
      } catch (e) {}
    }
  }, [auctionRounds]);

  const [queueLists, setQueueLists] = useState<QueueList[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('TUMDOOD_queue_lists');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('TUMDOOD_queue_lists', JSON.stringify(queueLists));
      } catch (e) {}
    }
  }, [queueLists]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoadDone = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRemoteUpdatedAtRef = useRef<string | null>(null);
  const isRemoteSyncingRef = useRef(false);
  const clientSessionId = useRef<string>(
    typeof window !== 'undefined'
      ? `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`
      : 'server'
  );
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // References to latest state to avoid stale closures in save
  const latestStateRef = useRef({
    guildName,
    fileTimestamp,
    members,
    gvgTeams,
    gvgParties,
    siegeTeams,
    siegeParties,
    polarityTeams,
    polarityParties,
    presetParties,
    auctionItems,
    auctionRounds,
    activeRoundId,
    queueLists,
  });

  useEffect(() => {
    latestStateRef.current = {
      guildName,
      fileTimestamp,
      members,
      gvgTeams,
      gvgParties,
      siegeTeams,
      siegeParties,
      polarityTeams,
      polarityParties,
      presetParties,
      auctionItems,
      auctionRounds,
      activeRoundId,
      queueLists,
    };
  }, [guildName, fileTimestamp, members, gvgTeams, gvgParties, siegeTeams, siegeParties, polarityTeams, polarityParties, presetParties, auctionItems, auctionRounds, activeRoundId, queueLists]);

  // Apply parsed database state to React state
  const applyRemoteData = useCallback((data: any) => {
    if (!data) return;
    isRemoteSyncingRef.current = true;

    if (data.updated_at) {
      lastRemoteUpdatedAtRef.current = data.updated_at;
    }

    if (data.guild_name) setGuildName(data.guild_name);
    if (data.file_timestamp) setFileTimestamp(data.file_timestamp);
    if (Array.isArray(data.members)) setMembers(data.members);

    if (Array.isArray(data.parties)) {
      const rawParties = data.parties as (Party & {
        category?: string;
        teamName?: string;
        teamField?: FieldZoneKey;
        teamColor?: string;
      })[];

      // GVG
      const gvgRaw = rawParties.filter((p) => !p.category || p.category === 'gvg');
      if (gvgRaw.length > 0) {
        const teamMap = new Map<string, Team>();
        gvgRaw.forEach((p) => {
          const tid = p.teamId || 'team_a';
          if (!teamMap.has(tid)) {
            teamMap.set(tid, {
              id: tid,
              name: p.teamName || (tid === 'team_a' ? 'ทีม A' : tid === 'team_b' ? 'ทีม B' : 'ทีม C'),
              field: p.teamField === 'sub' ? 'sub' : 'main',
              color: p.teamColor || 'rose',
            });
          }
        });
        const extractedTeams = Array.from(teamMap.values());
        setGvgTeams(extractedTeams.length > 0 ? extractedTeams : DEFAULT_GVG_TEAMS);
        setGvgParties(
          gvgRaw.map((p) => ({
            id: p.id,
            name: p.name || 'ปาร์ตี้',
            teamId: p.teamId || 'team_a',
            lane: p.lane || 'lane_mid',
            slots: Array.isArray(p.slots) ? p.slots.slice(0, 5) : [null, null, null, null, null],
          }))
        );
      }

      // Polarity
      const polTeamsConfig = rawParties.find((p: any) => p.id === '__polarity_teams_config__') as { teams?: Team[] } | undefined;
      if (polTeamsConfig && Array.isArray(polTeamsConfig.teams) && polTeamsConfig.teams.length > 0) {
        setPolarityTeams(polTeamsConfig.teams);
        try {
          localStorage.setItem('TUMDOOD_polarity_teams', JSON.stringify(polTeamsConfig.teams));
        } catch (e) {}
      }

      const polRaw = rawParties.filter((p) => p.category === 'polarity' && p.id !== '__polarity_teams_config__');
      if (polRaw.length > 0) {
        setPolarityParties(polRaw);
      } else {
        setPolarityParties(
          Array.from({ length: 8 }, (_, i) => ({
            id: `pol_p${i + 1}`,
            name: `ปาร์ตี้ ${i + 1}`,
            teamId: 'pol_main',
            slots: [null, null, null, null, null],
          }))
        );
      }

      // Siege
      const siegeTeamsConfig = rawParties.find((p: any) => p.id === '__siege_teams_config__') as { teams?: Team[] } | undefined;
      const siegeRaw = rawParties.filter((p) => p.category === 'siege' && p.id !== '__siege_teams_config__');

      if (siegeTeamsConfig && Array.isArray(siegeTeamsConfig.teams) && siegeTeamsConfig.teams.length > 0) {
        setSiegeTeams(siegeTeamsConfig.teams);
        try {
          localStorage.setItem('TUMDOOD_siege_teams', JSON.stringify(siegeTeamsConfig.teams));
        } catch (e) {}
      } else if (siegeRaw.length > 0) {
        const teamMap = new Map<string, Team>();
        siegeRaw.forEach((p) => {
          const tid = p.teamId || 'siege_team_1';
          if (!teamMap.has(tid)) {
            teamMap.set(tid, {
              id: tid,
              name: p.teamName || (tid === 'siege_team_1' ? 'ทีมปราสาท 1' : `ทีมปราสาท ${tid.replace('siege_team_', '')}`),
              field: p.teamField === 'sub' ? 'sub' : 'main',
              color: p.teamColor || 'sky',
            });
          }
        });
        const extracted = Array.from(teamMap.values());
        if (extracted.length > 0) {
          setSiegeTeams(extracted);
          try {
            localStorage.setItem('TUMDOOD_siege_teams', JSON.stringify(extracted));
          } catch (e) {}
        }
      }

      if (siegeRaw.length > 0) {
        setSiegeParties(
          siegeRaw.map((p) => ({
            id: p.id,
            name: p.name || 'ปาร์ตี้',
            teamId: p.teamId || 'siege_team_1',
            slots: Array.isArray(p.slots) ? p.slots.slice(0, 5) : [null, null, null, null, null],
          }))
        );
      } else {
        setSiegeParties(
          Array.from({ length: 8 }, (_, i) => ({
            id: `siege_p${i + 1}`,
            name: `ปาร์ตี้ ${i + 1}`,
            teamId: 'siege_team_1',
            slots: [null, null, null, null, null],
          }))
        );
      }

      // Preset
      const presetRaw = rawParties.filter((p) => p.category === 'preset');
      if (presetRaw.length > 0) {
        setPresetParties(presetRaw);
      } else {
        setPresetParties(
          Array.from({ length: 8 }, (_, i) => ({
            id: `preset_p${i + 1}`,
            name: `ตี้ประจำ ${i + 1}`,
            teamId: 'preset',
            slots: [null, null, null, null, null],
          }))
        );
      }

      // Auction Items & Rounds
      const auctionEntry = rawParties.find((p) => p.id === '__auction_items_config__');
      if (auctionEntry) {
        if (Array.isArray((auctionEntry as any).rounds)) {
          setAuctionRounds((auctionEntry as any).rounds);
          try {
            localStorage.setItem('TUMDOOD_auction_rounds', JSON.stringify((auctionEntry as any).rounds));
          } catch (e) {}
        }
        if (Array.isArray((auctionEntry as any).items)) {
          const rawItems = (auctionEntry as any).items as AuctionItem[];
          const sanitizedItems = rawItems.map((item) => {
            if (!isTitleItem(item) && Array.isArray(item.entries) && item.entries.length > 0) {
              const seen = new Set<string>();
              const uniqueEntries = item.entries.filter((e) => {
                if (!e.memberId) return true;
                if (seen.has(e.memberId)) return false;
                seen.add(e.memberId);
                return true;
              });
              return { ...item, entries: uniqueEntries };
            }
            return item;
          });
          setAuctionItems(sanitizedItems);
          try {
            localStorage.setItem('TUMDOOD_auctions', JSON.stringify(sanitizedItems));
          } catch (e) {}
        }
      }

      // Queue Lists
      const queueEntry = rawParties.find((p) => p.id === '__queue_lists_config__');
      if (queueEntry && Array.isArray((queueEntry as any).lists)) {
        setQueueLists((queueEntry as any).lists);
        try {
          localStorage.setItem('TUMDOOD_queue_lists', JSON.stringify((queueEntry as any).lists));
        } catch (e) {}
      }
    }

    setTimeout(() => {
      isRemoteSyncingRef.current = false;
    }, 400);
  }, []);

  // Silent reload from Supabase (without toggling full-page loading spinner)
  const silentReloadFromCloud = useCallback(async () => {
    // If pending local changes or saving, avoid overwriting local edits
    if (autoSaveTimerRef.current) return;

    try {
      const { data, error: fetchErr } = await supabase
        .from('guild_state')
        .select('*')
        .eq('id', 2)
        .maybeSingle();

      if (fetchErr) {
        console.warn('Realtime sync fetch error:', fetchErr);
        return;
      }

      if (data) {
        applyRemoteData(data);
      }
    } catch (e) {
      console.warn('Realtime silent reload error:', e);
    }
  }, [applyRemoteData]);

  // Initial Fetch from Supabase
  const loadFromCloud = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('guild_state')
        .select('*')
        .eq('id', 2)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (data) {
        applyRemoteData(data);
      }
    } catch (err: unknown) {
      console.error('Failed to load from Supabase:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
      isInitialLoadDone.current = true;
    }
  }, [applyRemoteData]);

  // Save to Supabase (uses latestStateRef)
  const saveToCloud = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      const state = latestStateRef.current;
      const gvgPartiesWithMeta = state.gvgParties.map((p) => {
        const team = state.gvgTeams.find((t) => t.id === p.teamId);
        return {
          ...p,
          teamName: team?.name || 'ทีม',
          teamField: team?.field || 'main',
          teamColor: team?.color || 'rose',
          category: 'gvg',
        };
      });

      const siegePartiesWithMeta = state.siegeParties.map((p) => {
        const team = state.siegeTeams.find((t) => t.id === p.teamId);
        return {
          ...p,
          teamName: team?.name || 'ทีมปราสาท',
          teamField: team?.field || 'main',
          teamColor: team?.color || 'sky',
          category: 'siege',
        };
      });

      const pin = typeof window !== 'undefined' ? localStorage.getItem('TUMDOOD_guild_pin') || 'TUMDOOD' : 'TUMDOOD';
      const authEntry = {
        id: '__guild_auth_config__',
        category: '__system__',
        pin,
        updatedAt: new Date().toISOString(),
      };

      const siegeTeamsEntry = {
        id: '__siege_teams_config__',
        category: '__system__',
        teams: state.siegeTeams,
      };

      const polarityTeamsEntry = {
        id: '__polarity_teams_config__',
        category: '__system__',
        teams: state.polarityTeams,
      };

      const sanitizedAuctionItems = state.auctionItems.map((item) => {
        if (!isTitleItem(item) && Array.isArray(item.entries) && item.entries.length > 0) {
          const seen = new Set<string>();
          const uniqueEntries = item.entries.filter((e) => {
            if (!e.memberId) return true;
            if (seen.has(e.memberId)) return false;
            seen.add(e.memberId);
            return true;
          });
          return { ...item, entries: uniqueEntries };
        }
        return item;
      });

      const auctionEntry = {
        id: '__auction_items_config__',
        category: '__system__',
        items: sanitizedAuctionItems,
        rounds: state.auctionRounds,
      };

      const queueListsEntry = {
        id: '__queue_lists_config__',
        category: '__system__',
        lists: state.queueLists,
      };

      try {
        localStorage.setItem('TUMDOOD_siege_teams', JSON.stringify(state.siegeTeams));
        localStorage.setItem('TUMDOOD_polarity_teams', JSON.stringify(state.polarityTeams));
        localStorage.setItem('TUMDOOD_auctions', JSON.stringify(sanitizedAuctionItems));
        localStorage.setItem('TUMDOOD_auction_rounds', JSON.stringify(state.auctionRounds));
        localStorage.setItem('TUMDOOD_queue_lists', JSON.stringify(state.queueLists));
      } catch (e) {}

      const combinedParties = [
        ...gvgPartiesWithMeta,
        ...state.polarityParties.map((p) => ({ ...p, category: 'polarity' })),
        ...siegePartiesWithMeta,
        ...state.presetParties.map((p) => ({ ...p, category: 'preset' })),
        authEntry,
        siegeTeamsEntry,
        polarityTeamsEntry,
        auctionEntry,
        queueListsEntry,
      ];

      const newUpdatedAt = new Date().toISOString();
      lastRemoteUpdatedAtRef.current = newUpdatedAt;

      const { error: saveErr } = await supabase.from('guild_state').upsert({
        id: 2,
        guild_name: state.guildName,
        file_timestamp: state.fileTimestamp,
        members: state.members,
        parties: combinedParties,
        updated_at: newUpdatedAt,
      });

      if (saveErr) throw saveErr;

      // Broadcast realtime event to all other open tabs/windows/devices
      if (realtimeChannelRef.current) {
        try {
          realtimeChannelRef.current.send({
            type: 'broadcast',
            event: 'state_sync',
            payload: { updated_at: newUpdatedAt, senderId: clientSessionId.current },
          });
        } catch (bcErr) {
          console.warn('Realtime broadcast error:', bcErr);
        }
      }

      const nowStr = new Date().toLocaleTimeString('th-TH');
      setLastSavedAt(nowStr);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
    } catch (err: unknown) {
      console.error('Failed to save to Supabase:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced Auto Save trigger
  const triggerAutoSave = useCallback((delayMs: number = 400) => {
    if (!isInitialLoadDone.current || isRemoteSyncingRef.current) return;
    setHasUnsavedChanges(true);
    setSaveStatus('pending');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      saveToCloud();
    }, delayMs);
  }, [saveToCloud]);

  // Watch for state changes and auto-save (skip when sync is coming in from remote)
  useEffect(() => {
    if (!isInitialLoadDone.current || isRemoteSyncingRef.current) return;
    triggerAutoSave(800);
  }, [gvgParties, gvgTeams, members, siegeParties, siegeTeams, polarityParties, polarityTeams, presetParties, triggerAutoSave]);

  // Flush beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        saveToCloud();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveToCloud]);

  // Initial load on mount
  useEffect(() => {
    loadFromCloud();
  }, [loadFromCloud]);

  // Multi-tier Realtime Synchronization:
  // 1. Supabase Realtime channel (postgres_changes + broadcast)
  // 2. Browser StorageEvent (instant cross-tab update on same computer)
  // 3. Fallback polling interval (3.5 seconds) ensuring updates even if WebSockets disconnect
  useEffect(() => {
    const channel = supabase
      .channel('TUMDOOD_guild_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guild_state', filter: 'id=eq.2' },
        (payload: any) => {
          if (payload?.new) {
            if (payload.new.updated_at && payload.new.updated_at === lastRemoteUpdatedAtRef.current) {
              return;
            }
            applyRemoteData(payload.new);
          } else {
            silentReloadFromCloud();
          }
        }
      )
      .on('broadcast', { event: 'state_sync' }, (payload: any) => {
        if (payload?.payload?.senderId === clientSessionId.current) {
          return;
        }
        silentReloadFromCloud();
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // Cross-tab instant sync
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      if (e.key === 'TUMDOOD_queue_lists') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            isRemoteSyncingRef.current = true;
            setQueueLists(parsed);
            setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          }
        } catch (_) {}
      } else if (e.key === 'TUMDOOD_auctions') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            isRemoteSyncingRef.current = true;
            setAuctionItems(parsed);
            setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          }
        } catch (_) {}
      } else if (e.key === 'TUMDOOD_auction_rounds') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            isRemoteSyncingRef.current = true;
            setAuctionRounds(parsed);
            setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          }
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3.5s Fallback heartbeat polling
    const pollingInterval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (autoSaveTimerRef.current || isRemoteSyncingRef.current) return;
      try {
        const { data, error } = await supabase
          .from('guild_state')
          .select('updated_at')
          .eq('id', 2)
          .maybeSingle();

        if (!error && data?.updated_at && data.updated_at !== lastRemoteUpdatedAtRef.current) {
          lastRemoteUpdatedAtRef.current = data.updated_at;
          silentReloadFromCloud();
        }
      } catch (_) {}
    }, 3500);

    return () => {
      supabase.removeChannel(channel);
      realtimeChannelRef.current = null;
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollingInterval);
    };
  }, [applyRemoteData, silentReloadFromCloud]);

  // Helper actions for GVG
  const setPartyLane = (partyId: string, lane: LaneKey) => {
    setGvgParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, lane } : p)));
  };

  const setPartyTeam = (partyId: string, targetTeamId: string) => {
    setGvgParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, teamId: targetTeamId } : p)));
  };

  const renameParty = (partyId: string, newName: string) => {
    setGvgParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, name: newName } : p)));
  };

  const clearPartySlots = (partyId: string) => {
    setGvgParties((prev) => prev.map((p) => (p.id === partyId ? { ...p, slots: [null, null, null, null, null] } : p)));
  };

  const deleteParty = (partyId: string) => {
    setGvgParties((prev) => prev.filter((p) => p.id !== partyId));
  };

  const addPartyToTeam = (teamId: string) => {
    const teamParties = gvgParties.filter((p) => p.teamId === teamId);
    const newIdx = teamParties.length + 1;
    const team = gvgTeams.find((t) => t.id === teamId);
    const newParty: Party = {
      id: `party_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `ปาร์ตี้ ${newIdx}`,
      teamId,
      lane: team?.field === 'sub' ? 'roam_left' : 'lane_mid',
      slots: [null, null, null, null, null],
    };
    setGvgParties((prev) => [...prev, newParty]);
  };

  const renumberTeamParties = (teamId: string) => {
    let counter = 1;
    setGvgParties((prev) =>
      prev.map((p) => {
        if (p.teamId === teamId) {
          const renamed = { ...p, name: `ปาร์ตี้ ${counter}` };
          counter++;
          return renamed;
        }
        return p;
      })
    );
  };

  const setTeamField = (teamId: string, field: FieldZoneKey) => {
    setGvgTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, field } : t)));
  };

  const renameTeam = (teamId: string, newName: string) => {
    setGvgTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t)));
    setSiegeTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name: newName } : t)));
  };

  const setTeamColor = (teamId: string, color: string) => {
    setGvgTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, color } : t)));
    setSiegeTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, color } : t)));
  };

  const removeMemberFromSlot = (partyId: string, slotIndex: number) => {
    setGvgParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        const nextSlots = [...(p.slots || [null, null, null, null, null])];
        nextSlots[slotIndex] = null;
        return { ...p, slots: nextSlots };
      })
    );
  };

  const placeMemberInSlot = (partyId: string, slotIndex: number, memberId: string) => {
    setGvgParties((prev) => {
      const cleaned = prev.map((p) => {
        const slots = (p.slots || [null, null, null, null, null]).map((id) => (id === memberId ? null : id));
        return { ...p, slots };
      });

      return cleaned.map((p) => {
        if (p.id !== partyId) return p;
        const slots = [...(p.slots || [null, null, null, null, null])];
        slots[slotIndex] = memberId;
        return { ...p, slots };
      });
    });
  };

  const swapSlots = (fromPartyId: string, fromSlotIdx: number, toPartyId: string, toSlotIdx: number) => {
    setGvgParties((prev) => {
      const fromParty = prev.find((p) => p.id === fromPartyId);
      const toParty = prev.find((p) => p.id === toPartyId);
      if (!fromParty || !toParty) return prev;

      const fromMemberId = fromParty.slots?.[fromSlotIdx] || null;
      const toMemberId = toParty.slots?.[toSlotIdx] || null;

      return prev.map((p) => {
        if (p.id === fromPartyId && p.id === toPartyId) {
          const slots = [...(p.slots || [null, null, null, null, null])];
          slots[fromSlotIdx] = toMemberId;
          slots[toSlotIdx] = fromMemberId;
          return { ...p, slots };
        }
        if (p.id === fromPartyId) {
          const slots = [...(p.slots || [null, null, null, null, null])];
          slots[fromSlotIdx] = toMemberId;
          return { ...p, slots };
        }
        if (p.id === toPartyId) {
          const slots = [...(p.slots || [null, null, null, null, null])];
          slots[toSlotIdx] = fromMemberId;
          return { ...p, slots };
        }
        return p;
      });
    });
  };

  const applyPresetToParty = (
    mode: 'gvg' | 'siege' | 'polarity',
    targetPartyId: string,
    presetPartyId: string
  ) => {
    const preset = presetParties.find((p) => p.id === presetPartyId);
    if (!preset) return;

    const presetSlots = [...(preset.slots || [null, null, null, null, null])];
    while (presetSlots.length < 5) presetSlots.push(null);
    const newMemberIds = new Set(presetSlots.filter(Boolean) as string[]);

    if (mode === 'gvg') {
      setGvgParties((prev) => {
        const cleaned = prev.map((p) => {
          if (p.id === targetPartyId) return p;
          const slots = (p.slots || [null, null, null, null, null]).map((id) =>
            id && newMemberIds.has(id) ? null : id
          );
          return { ...p, slots };
        });
        return cleaned.map((p) => {
          if (p.id !== targetPartyId) return p;
          return { ...p, slots: presetSlots, presetId: presetPartyId };
        });
      });
    } else if (mode === 'siege') {
      setSiegeParties((prev) => {
        const cleaned = prev.map((p) => {
          if (p.id === targetPartyId) return p;
          const slots = (p.slots || [null, null, null, null, null]).map((id) =>
            id && newMemberIds.has(id) ? null : id
          );
          return { ...p, slots };
        });
        return cleaned.map((p) => {
          if (p.id !== targetPartyId) return p;
          return { ...p, slots: presetSlots, presetId: presetPartyId };
        });
      });
    } else if (mode === 'polarity') {
      setPolarityParties((prev) => {
        const cleaned = prev.map((p) => {
          if (p.id === targetPartyId) return p;
          const slots = (p.slots || [null, null, null, null, null]).map((id) =>
            id && newMemberIds.has(id) ? null : id
          );
          return { ...p, slots };
        });
        return cleaned.map((p) => {
          if (p.id !== targetPartyId) return p;
          return { ...p, slots: presetSlots, presetId: presetPartyId };
        });
      });
    }
  };

  const createAuctionRound = (name: string, date?: string, note?: string): string => {
    const newRoundId = `round_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRound: AuctionRound = {
      id: newRoundId,
      name: name.trim() || `รอบประมูล ${new Date().toLocaleDateString('th-TH')}`,
      date: date || new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date().toISOString(),
      note: note?.trim() || undefined,
    };
    setAuctionRounds((prev) => [newRound, ...prev]);
    setActiveRoundId(newRoundId);
    triggerAutoSave();
    return newRoundId;
  };

  const updateAuctionRound = (id: string, updates: Partial<AuctionRound>) => {
    setAuctionRounds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    triggerAutoSave();
  };

  const deleteAuctionRound = (id: string) => {
    setAuctionRounds((prev) => {
      const remaining = prev.filter((r) => r.id !== id);
      if (activeRoundId === id) {
        setActiveRoundId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
    setAuctionItems((prev) => prev.filter((item) => item.roundId !== id));
    triggerAutoSave();
  };

  const completeAuctionRound = (id: string) => {
    setAuctionRounds((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'completed', closedAt: new Date().toISOString() }
          : r
      )
    );
    triggerAutoSave();
  };

  const reopenAuctionRound = (id: string) => {
    setAuctionRounds((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'active', closedAt: undefined } : r
      )
    );
    setActiveRoundId(id);
    triggerAutoSave();
  };

  const addAuctionItems = (
    itemsData: Array<Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active'; roundId?: string }>
  ) => {
    const now = new Date().toISOString();
    const currentRound = latestStateRef.current.activeRoundId || (latestStateRef.current.auctionRounds[0]?.id) || 'round_default';
    const newItems: AuctionItem[] = itemsData.map((itemData, index) => ({
      ...itemData,
      id: `auc_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      roundId: itemData.roundId || currentRound,
      currentPrice: itemData.startPrice,
      status: itemData.status || 'pending',
      createdAt: now,
      entries: [],
      bids: [],
    }));
    setAuctionItems((prev) => [...newItems, ...prev]);
    triggerAutoSave();
  };

  const addAuctionItem = (
    itemData: Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }
  ) => {
    addAuctionItems([itemData]);
  };

  const startAuction = (auctionId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) =>
        item.id === auctionId
          ? {
              ...item,
              status: 'active',
              startedAt: new Date().toISOString(),
            }
          : item
      )
    );
    triggerAutoSave();
  };

  const startAllPendingAuctions = () => {
    const now = new Date().toISOString();
    setAuctionItems((prev) =>
      prev.map((item) =>
        item.status === 'pending'
          ? {
              ...item,
              status: 'active',
              startedAt: now,
            }
          : item
      )
    );
    triggerAutoSave();
  };

  const addMemberToAuction = (auctionId: string, memberId: string) => {
    const member = latestStateRef.current.members.find((m) => m.id === memberId);
    if (!member) return;

    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        const currentEntries = item.entries || [];

        // Check maxEntries limit
        if (item.maxEntries && item.maxEntries > 0 && currentEntries.length >= item.maxEntries) {
          return item;
        }

        // If not Title, member can only register once
        const isTitle = isTitleItem(item);
        if (!isTitle && currentEntries.some((e) => e.memberId === memberId)) {
          return item;
        }

        const newEntry: AuctionEntry = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          memberId: member.id,
          memberName: member.name,
          memberJob: member.job,
          registeredAt: new Date().toISOString(),
        };
        return {
          ...item,
          entries: [...currentEntries, newEntry],
        };
      })
    );
    triggerAutoSave();
  };

  const addMultipleMembersToAuction = (auctionId: string, memberIds: string[]) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        const currentEntries = item.entries || [];
        const newEntries: AuctionEntry[] = [];
        const maxLimit = item.maxEntries && item.maxEntries > 0 ? item.maxEntries : Infinity;
        const isTitle = isTitleItem(item);

        for (const mId of memberIds) {
          if (currentEntries.length + newEntries.length >= maxLimit) break;
          // If not Title, member can only register once
          if (!isTitle && (currentEntries.some((e) => e.memberId === mId) || newEntries.some((e) => e.memberId === mId))) {
            continue;
          }
          const member = latestStateRef.current.members.find((m) => m.id === mId);
          if (member) {
            newEntries.push({
              id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              memberId: member.id,
              memberName: member.name,
              memberJob: member.job,
              registeredAt: new Date().toISOString(),
            });
          }
        }

        return {
          ...item,
          entries: [...currentEntries, ...newEntries],
        };
      })
    );
    triggerAutoSave();
  };

  const updateAuctionMaxEntries = (auctionId: string, maxEntries?: number) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          maxEntries: maxEntries !== undefined && maxEntries > 0 ? maxEntries : undefined,
        };
      })
    );
    triggerAutoSave();
  };

  const removeMemberFromAuction = (auctionId: string, memberId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          entries: (item.entries || []).filter((e) => e.memberId !== memberId),
        };
      })
    );
    triggerAutoSave();
  };

  const removeOneMemberEntryFromAuction = (auctionId: string, memberId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        const currentEntries = item.entries || [];
        let lastIndex = -1;
        for (let i = currentEntries.length - 1; i >= 0; i--) {
          if (currentEntries[i].memberId === memberId) {
            lastIndex = i;
            break;
          }
        }
        if (lastIndex === -1) return item;
        const newEntries = [...currentEntries];
        newEntries.splice(lastIndex, 1);
        return {
          ...item,
          entries: newEntries,
        };
      })
    );
    triggerAutoSave();
  };

  const removeMemberEntryById = (auctionId: string, entryId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          entries: (item.entries || []).filter((e) => e.id !== entryId),
        };
      })
    );
    triggerAutoSave();
  };

  const setAuctionWinner = (auctionId: string, winnerMemberId: string) => {
    const member = latestStateRef.current.members.find((m) => m.id === winnerMemberId);
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          status: 'ended',
          closedAt: new Date().toISOString(),
          winnerMemberId,
          winnerMemberName: member?.name || item.entries?.find((e) => e.memberId === winnerMemberId)?.memberName,
          winnerMemberJob: member?.job || item.entries?.find((e) => e.memberId === winnerMemberId)?.memberJob,
        };
      })
    );
    triggerAutoSave();
  };

  const confirmAuctionWinners = (auctionId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        const currentEntries = item.entries || [];
        if (currentEntries.length === 0) return item;

        // Group entries by member
        const countMap = new Map<string, { memberId: string; memberName: string; memberJob?: string; count: number }>();
        for (const e of currentEntries) {
          const existing = countMap.get(e.memberId);
          if (existing) {
            existing.count += 1;
          } else {
            countMap.set(e.memberId, {
              memberId: e.memberId,
              memberName: e.memberName,
              memberJob: e.memberJob,
              count: 1,
            });
          }
        }
        const winnersList = Array.from(countMap.values());
        const summary = winnersList.map((w) => `${w.memberName} (x${w.count})`).join(', ');

        return {
          ...item,
          status: 'ended',
          closedAt: new Date().toISOString(),
          winnerMemberId: winnersList[0]?.memberId,
          winnerMemberName: summary,
          winnerMemberJob: winnersList.length === 1 ? winnersList[0]?.memberJob : undefined,
          winners: winnersList,
        };
      })
    );
    triggerAutoSave();
  };

  const resetAuctionWinner = (auctionId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          status: 'active',
          closedAt: undefined,
          winnerMemberId: undefined,
          winnerMemberName: undefined,
          winnerMemberJob: undefined,
          winners: undefined,
        };
      })
    );
    triggerAutoSave();
  };

  const placeBid = (
    auctionId: string,
    memberId: string,
    memberName: string,
    memberJob: string | undefined,
    amount: number,
    note?: string
  ): { success: boolean; message: string } => {
    const target = latestStateRef.current.auctionItems.find((a) => a.id === auctionId);
    if (!target) return { success: false, message: 'ไม่พบรายการประมูลนี้' };
    if (target.status !== 'active') return { success: false, message: 'การประมูลนี้สิ้นสุดหรือถูกยกเลิกแล้ว' };

    const minAllowed = target.bids.length === 0 ? target.startPrice : target.currentPrice + target.minIncrement;
    if (amount < minAllowed) {
      return {
        success: false,
        message: `ต้องเสนอราคาอย่างน้อย ${minAllowed.toLocaleString()} หน่วย (ขั้นต่ำ +${target.minIncrement.toLocaleString()})`,
      };
    }

    const newBid: BidRecord = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      memberId,
      memberName,
      memberJob,
      amount,
      timestamp: new Date().toISOString(),
      note,
    };

    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        return {
          ...item,
          currentPrice: amount,
          winnerMemberId: memberId,
          winnerMemberName: memberName,
          winnerMemberJob: memberJob,
          bids: [newBid, ...item.bids],
        };
      })
    );

    triggerAutoSave();
    return { success: true, message: `เสนอราคา ${amount.toLocaleString()} หน่วย สำเร็จ!` };
  };

  const closeAuction = (auctionId: string, winnerMemberId?: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.id !== auctionId) return item;
        let winnerName = item.winnerMemberName;
        let winnerJob = item.winnerMemberJob;
        if (winnerMemberId) {
          const m = latestStateRef.current.members.find((x) => x.id === winnerMemberId);
          if (m) {
            winnerName = m.name;
            winnerJob = m.job;
          }
        }
        return {
          ...item,
          status: 'ended',
          closedAt: new Date().toISOString(),
          finalPrice: item.currentPrice,
          winnerMemberId: winnerMemberId || item.winnerMemberId,
          winnerMemberName: winnerName,
          winnerMemberJob: winnerJob,
        };
      })
    );
    triggerAutoSave();
  };

  const deleteAuctionItem = (auctionId: string) => {
    setAuctionItems((prev) => prev.filter((item) => item.id !== auctionId));
    triggerAutoSave();
  };

  const cancelAuctionItem = (auctionId: string) => {
    setAuctionItems((prev) =>
      prev.map((item) => (item.id === auctionId ? { ...item, status: 'cancelled' } : item))
    );
    triggerAutoSave();
  };

  // Queue Operations
  const createQueueList = (data: Omit<QueueList, 'id' | 'createdAt' | 'entries'>): string => {
    const newId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newList: QueueList = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      entries: [],
    };
    setQueueLists((prev) => [newList, ...prev]);
    triggerAutoSave();
    return newId;
  };

  const updateQueueList = (id: string, updates: Partial<QueueList>) => {
    setQueueLists((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q))
    );
    triggerAutoSave();
  };

  const deleteQueueList = (id: string) => {
    setQueueLists((prev) => prev.filter((q) => q.id !== id));
    triggerAutoSave();
  };

  const addMemberToQueue = (queueId: string, memberId: string, note?: string): { success: boolean; message: string } => {
    const member = latestStateRef.current.members.find((m) => m.id === memberId);
    if (!member) return { success: false, message: 'ไม่พบข้อมูลสมาชิก' };

    let added = false;
    let errMessage = '';
    let newPosition = 1;

    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        if (q.status === 'closed') {
          errMessage = 'คิวนี้ปิดรับแล้ว';
          return q;
        }
        const currentEntries = q.entries || [];
        if (q.maxCapacity && q.maxCapacity > 0 && currentEntries.length >= q.maxCapacity) {
          errMessage = 'คิวเต็มตามจำนวนที่กำหนดแล้ว';
          return q;
        }

        const newEntry: QueueEntry = {
          id: `qentry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          memberId: member.id,
          memberName: member.name,
          memberJob: member.job,
          joinedAt: new Date().toISOString(),
          note: note?.trim() || undefined,
        };

        newPosition = currentEntries.length + 1;
        added = true;
        return {
          ...q,
          entries: [...currentEntries, newEntry],
          updatedAt: new Date().toISOString(),
        };
      })
    );

    if (added) {
      triggerAutoSave();
      return { success: true, message: `เข้าร่วมคิวสำเร็จ! (อันดับที่ #${newPosition})` };
    }
    return { success: false, message: errMessage || 'ไม่สามารถเข้าร่วมคิวได้' };
  };

  const removeMemberFromQueue = (queueId: string, entryId: string) => {
    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        return {
          ...q,
          entries: (q.entries || []).filter((e) => e.id !== entryId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    triggerAutoSave();
  };

  const removeMemberByMemberIdFromQueue = (queueId: string, memberId: string) => {
    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        return {
          ...q,
          entries: (q.entries || []).filter((e) => e.memberId !== memberId),
          updatedAt: new Date().toISOString(),
        };
      })
    );
    triggerAutoSave();
  };

  const reorderQueueEntries = (queueId: string, entries: QueueEntry[]) => {
    setQueueLists((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, entries, updatedAt: new Date().toISOString() } : q))
    );
    triggerAutoSave();
  };

  const toggleQueueEntryCompleted = (queueId: string, entryId: string) => {
    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        const updatedEntries = q.entries.map((e) => {
          if (e.id !== entryId) return e;
          const willBeCompleted = !e.isCompleted;
          return {
            ...e,
            isCompleted: willBeCompleted,
            completedAt: willBeCompleted ? new Date().toISOString() : undefined,
          };
        });
        return { ...q, entries: updatedEntries, updatedAt: new Date().toISOString() };
      })
    );
    triggerAutoSave();
  };

  const clearQueueEntries = (queueId: string) => {
    setQueueLists((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, entries: [], updatedAt: new Date().toISOString() } : q))
    );
    triggerAutoSave();
  };

  const setQueueStatus = (queueId: string, status: 'open' | 'in_progress' | 'closed') => {
    setQueueLists((prev) =>
      prev.map((q) =>
        q.id === queueId
          ? {
              ...q,
              status,
              closedAt: status === 'closed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString(),
            }
          : q
      )
    );
    triggerAutoSave();
  };

  return (
    <GuildContext.Provider
      value={{
        guildName,
        setGuildName,
        fileTimestamp,
        setFileTimestamp,
        members,
        setMembers,
        gvgTeams,
        setGvgTeams,
        gvgParties,
        setGvgParties,
        siegeTeams,
        setSiegeTeams,
        siegeParties,
        setSiegeParties,
        polarityTeams,
        setPolarityTeams,
        polarityParties,
        setPolarityParties,
        presetParties,
        setPresetParties,
        auctionItems,
        setAuctionItems,
        auctionRounds,
        setAuctionRounds,
        activeRoundId,
        setActiveRoundId,
        createAuctionRound,
        updateAuctionRound,
        deleteAuctionRound,
        completeAuctionRound,
        reopenAuctionRound,
        selectedDate,
        setSelectedDate,
        isLoading,
        isSaving,
        lastSavedAt,
        hasUnsavedChanges,
        saveStatus,
        error,
        loadFromCloud,
        saveToCloud,
        triggerAutoSave,
        setPartyLane,
        setPartyTeam,
        renameParty,
        clearPartySlots,
        deleteParty,
        addPartyToTeam,
        renumberTeamParties,
        setTeamField,
        renameTeam,
        setTeamColor,
        removeMemberFromSlot,
        placeMemberInSlot,
        swapSlots,
        applyPresetToParty,
        addAuctionItem,
        addAuctionItems,
        startAuction,
        startAllPendingAuctions,
        addMemberToAuction,
        addMultipleMembersToAuction,
        removeMemberFromAuction,
        removeOneMemberEntryFromAuction,
        removeMemberEntryById,
        updateAuctionMaxEntries,
        setAuctionWinner,
        confirmAuctionWinners,
        resetAuctionWinner,
        placeBid,
        closeAuction,
        deleteAuctionItem,
        cancelAuctionItem,
        queueLists,
        createQueueList,
        updateQueueList,
        deleteQueueList,
        addMemberToQueue,
        removeMemberFromQueue,
        removeMemberByMemberIdFromQueue,
        reorderQueueEntries,
        toggleQueueEntryCompleted,
        clearQueueEntries,
        setQueueStatus,
      }}
    >
      {children}
    </GuildContext.Provider>
  );
}

export function useGuildStore(): GuildState {
  const context = useContext(GuildContext);
  if (!context) {
    throw new Error('useGuildStore must be used within a GuildProvider');
  }
  return context;
}

