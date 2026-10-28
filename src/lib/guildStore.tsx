'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { GUILD_ID, GUILD_NAME, DEFAULT_PIN } from '@/config/guildConfig';
import { Member } from '@/types/member';
import { Party, Team, LaneKey, FieldZoneKey } from '@/types/party';
import { AuctionItem, AuctionEntry, AuctionRound, BidRecord, isTitleItem, isChestItem, isMultiEntryItem } from '@/types/auction';
import { QueueList, QueueEntry } from '@/types/queue';
import { TUMDOOD_PRESET_PARTIES } from '@/data/tumdoodSquads';

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
  createAuctionRound: (
    name: string,
    date?: string,
    note?: string,
    scheduledOpenAt?: string,
    scheduledCloseAt?: string
  ) => string;
  updateAuctionRound: (id: string, updates: Partial<AuctionRound>) => void;
  deleteAuctionRound: (id: string) => void;
  completeAuctionRound: (id: string) => void;
  reopenAuctionRound: (id: string) => void;
  setRoundSchedule: (
    id: string,
    scheduledOpenAt?: string | null,
    scheduledCloseAt?: string | null
  ) => void;
  openScheduledRoundNow: (id: string) => void;

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
  createQueueList: (data: Omit<QueueList, 'createdAt' | 'entries'> & { id?: string }) => string;
  updateQueueList: (id: string, updates: Partial<QueueList>) => void;
  deleteQueueList: (id: string) => void;
  addMemberToQueue: (queueId: string, memberId: string, note?: string) => Promise<{ success: boolean; message: string }>;
  removeMemberFromQueue: (queueId: string, entryId: string) => Promise<void>;
  removeMemberByMemberIdFromQueue: (queueId: string, memberId: string) => Promise<{ success: boolean; message: string }>;
  reorderQueueEntries: (queueId: string, entries: QueueEntry[]) => void;
  toggleQueueEntryCompleted: (queueId: string, entryId: string) => void;
  clearQueueEntries: (queueId: string) => void;
  setQueueStatus: (queueId: string, status: 'open' | 'in_progress' | 'closed' | 'scheduled') => void;
  openScheduledQueueNow: (queueId: string) => void;
  setQueueSchedule: (
    queueId: string,
    scheduledOpenAt?: string | null,
    preRegisteredMemberIds?: string[]
  ) => void;
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

export const MOONZ_PRESET_PARTIES: Party[] = [
  {
    id: 'preset_p_default_1',
    name: 'ตี้ประจำ 1',
    teamId: 'preset',
    teamColor: 'rose',
    category: 'preset',
    slots: ['m_csv_1792954365593_1_4zxo', 'm_csv_1792954365593_3_tjfl', 'm_csv_1792954365593_4_d5bt', 'm_csv_1792954365593_6_j3b0', 'm_csv_1792954365593_8_ec78'],
  },
  {
    id: 'preset_p_default_2',
    name: 'ตี้ประจำ 2',
    teamId: 'preset',
    teamColor: 'blue',
    category: 'preset',
    slots: ['m_csv_1792696734525_87', 'm_csv_1792696734525_6', 'm_csv_1792696734525_10', 'm_csv_1792696734525_19', 'm_csv_1792696734525_23'],
  },
  { id: 'preset_p_default_3', name: 'ตี้ประจำ 3', teamId: 'preset', teamColor: 'amber', category: 'preset', slots: [null, null, null, null, null] },
  { id: 'preset_p_default_4', name: 'ตี้ประจำ 4', teamId: 'preset', teamColor: 'emerald', category: 'preset', slots: [null, null, null, null, null] },
  { id: 'preset_p_default_5', name: 'ตี้ประจำ 5', teamId: 'preset', teamColor: 'purple', category: 'preset', slots: [null, null, null, null, null] },
  { id: 'preset_p_default_6', name: 'ตี้ประจำ 6', teamId: 'preset', teamColor: 'cyan', category: 'preset', slots: [null, null, null, null, null] },
  { id: 'preset_p_default_7', name: 'ตี้ประจำ 7', teamId: 'preset', teamColor: 'rose', category: 'preset', slots: [null, null, null, null, null] },
  { id: 'preset_p_default_8', name: 'ตี้ประจำ 8', teamId: 'preset', teamColor: 'blue', category: 'preset', slots: [null, null, null, null, null] },
];

export const DEFAULT_PRESET_PARTIES: Party[] = GUILD_ID === 2 ? TUMDOOD_PRESET_PARTIES : MOONZ_PRESET_PARTIES;

const GuildContext = createContext<GuildState | null>(null);

export function GuildProvider({ children }: { children: React.ReactNode }) {
  const [guildName, setGuildName] = useState(GUILD_NAME);
  const [fileTimestamp, setFileTimestamp] = useState('กำลังโหลด...');
  const [members, setMembers] = useState<Member[]>([]);
  const [gvgTeams, setGvgTeams] = useState<Team[]>(DEFAULT_GVG_TEAMS);
  const [gvgParties, setGvgParties] = useState<Party[]>(DEFAULT_GVG_PARTIES);
  const [siegeTeams, setSiegeTeams] = useState<Team[]>([
    { id: 'siege_team_1', name: 'ทีมปราสาท 1', color: 'sky', field: 'main' }
  ]);
  const [siegeParties, setSiegeParties] = useState<Party[]>([]);
  const [polarityTeams, setPolarityTeams] = useState<Team[]>([
    { id: 'pol_main', name: 'สงครามดาว', color: 'amber', field: 'main' }
  ]);
  const [polarityParties, setPolarityParties] = useState<Party[]>([]);
  const [presetParties, setPresetParties] = useState<Party[]>(DEFAULT_PRESET_PARTIES);
  const [auctionRounds, setAuctionRounds] = useState<AuctionRound[]>([
    {
      id: 'round_default',
      name: 'รอบประมูลรอบที่ 1',
      date: new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: new Date().toISOString(),
      note: 'รอบประมูลเริ่มต้น',
    },
  ]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>('round_default');
  const [auctionItems, setAuctionItems] = useState<AuctionItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [queueLists, setQueueLists] = useState<QueueList[]>([]);

  // Hydrate local cache on client mount to eliminate SSR hydration mismatch
  useEffect(() => {
    try {
      const cachedSiege = localStorage.getItem('Moonz_siege_teams');
      if (cachedSiege) {
        const parsed = JSON.parse(cachedSiege);
        if (Array.isArray(parsed) && parsed.length > 0) setSiegeTeams(parsed);
      }
      const cachedPol = localStorage.getItem('Moonz_polarity_teams');
      if (cachedPol) {
        const parsed = JSON.parse(cachedPol);
        if (Array.isArray(parsed) && parsed.length > 0) setPolarityTeams(parsed);
      }
      const cachedRounds = localStorage.getItem('Moonz_auction_rounds');
      if (cachedRounds) {
        const parsed = JSON.parse(cachedRounds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAuctionRounds(parsed);
          const active = parsed.find((r: AuctionRound) => r.status === 'active');
          setActiveRoundId(active ? active.id : parsed[0].id);
        }
      }
      const cachedAuctions = localStorage.getItem('Moonz_auctions');
      if (cachedAuctions) {
        const parsed = JSON.parse(cachedAuctions);
        if (Array.isArray(parsed)) setAuctionItems(parsed);
      }
      const cachedQueues = localStorage.getItem('Moonz_queue_lists');
      if (cachedQueues) {
        const parsed = JSON.parse(cachedQueues);
        if (Array.isArray(parsed)) setQueueLists(parsed);
      }
      const cachedPreset = localStorage.getItem(`${GUILD_NAME}_preset_parties`) || localStorage.getItem('Moonz_preset_parties');
      if (cachedPreset) {
        const parsed = JSON.parse(cachedPreset);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (GUILD_ID === 2 && parsed.length < 32) {
            setPresetParties(DEFAULT_PRESET_PARTIES);
          } else {
            setPresetParties(parsed);
          }
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && presetParties.length > 0) {
      try {
        localStorage.setItem(`${GUILD_NAME}_preset_parties`, JSON.stringify(presetParties));
      } catch (e) {}
    }
  }, [presetParties]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('Moonz_queue_lists', JSON.stringify(queueLists));
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
  const hasModularTablesRef = useRef<boolean>(false);

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
    if (data.updated_at && data.updated_at === lastRemoteUpdatedAtRef.current) {
      return;
    }
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
          localStorage.setItem('Moonz_polarity_teams', JSON.stringify(polTeamsConfig.teams));
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
          localStorage.setItem('Moonz_siege_teams', JSON.stringify(siegeTeamsConfig.teams));
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
            localStorage.setItem('Moonz_siege_teams', JSON.stringify(extracted));
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
        setPresetParties(DEFAULT_PRESET_PARTIES);
      }

      // Auction Items & Rounds
      const auctionEntry = rawParties.find((p) => p.id === '__auction_items_config__');
      if (auctionEntry) {
        if (Array.isArray((auctionEntry as any).rounds)) {
          setAuctionRounds((auctionEntry as any).rounds);
          try {
            localStorage.setItem('Moonz_auction_rounds', JSON.stringify((auctionEntry as any).rounds));
          } catch (e) {}
        }
        if (Array.isArray((auctionEntry as any).items)) {
          const rawItems = (auctionEntry as any).items as AuctionItem[];
          const sanitizedItems = rawItems.map((item) => {
            if (!isMultiEntryItem(item) && Array.isArray(item.entries) && item.entries.length > 0) {
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
            localStorage.setItem('Moonz_auctions', JSON.stringify(sanitizedItems));
          } catch (e) {}
        }
      }

      // Queue Lists
      const queueEntry = rawParties.find((p) => p.id === '__queue_lists_config__');
      if (queueEntry && Array.isArray((queueEntry as any).lists)) {
        setQueueLists((queueEntry as any).lists);
        try {
          localStorage.setItem('Moonz_queue_lists', JSON.stringify((queueEntry as any).lists));
        } catch (e) {}
      }
    }

    setTimeout(() => {
      isRemoteSyncingRef.current = false;
    }, 800);
  }, []);

  // Silent reload from Supabase (can target a specific table or reload all)
  const silentReloadFromCloud = useCallback(async (targetTable?: string) => {
    // If pending local changes or saving, avoid overwriting local edits
    if (autoSaveTimerRef.current) return;

    try {
      if (targetTable === 'guild_queues') {
        const { data } = await supabase.from('guild_queues').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data && Array.isArray(data.lists)) {
          isRemoteSyncingRef.current = true;
          setQueueLists(data.lists);
          try { localStorage.setItem('Moonz_queue_lists', JSON.stringify(data.lists)); } catch (_) {}
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_auctions') {
        const { data } = await supabase.from('guild_auctions').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data) {
          isRemoteSyncingRef.current = true;
          if (Array.isArray(data.items)) {
            setAuctionItems(data.items);
            try { localStorage.setItem('Moonz_auctions', JSON.stringify(data.items)); } catch (_) {}
          }
          if (Array.isArray(data.rounds)) {
            setAuctionRounds(data.rounds);
            try { localStorage.setItem('Moonz_auction_rounds', JSON.stringify(data.rounds)); } catch (_) {}
          }
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_members') {
        const { data } = await supabase.from('guild_members').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data && Array.isArray(data.members)) {
          isRemoteSyncingRef.current = true;
          setMembers(data.members);
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_gvg') {
        const { data } = await supabase.from('guild_gvg').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data) {
          isRemoteSyncingRef.current = true;
          if (Array.isArray(data.teams) && data.teams.length > 0) setGvgTeams(data.teams);
          if (Array.isArray(data.parties)) setGvgParties(data.parties);
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_siege') {
        const { data } = await supabase.from('guild_siege').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data) {
          isRemoteSyncingRef.current = true;
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            setSiegeTeams(data.teams);
            try { localStorage.setItem('Moonz_siege_teams', JSON.stringify(data.teams)); } catch (_) {}
          }
          if (Array.isArray(data.parties)) setSiegeParties(data.parties);
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_polarity') {
        const { data } = await supabase.from('guild_polarity').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data) {
          isRemoteSyncingRef.current = true;
          if (Array.isArray(data.teams) && data.teams.length > 0) {
            setPolarityTeams(data.teams);
            try { localStorage.setItem('Moonz_polarity_teams', JSON.stringify(data.teams)); } catch (_) {}
          }
          if (Array.isArray(data.parties)) setPolarityParties(data.parties);
          if (Array.isArray(data.preset_parties) && data.preset_parties.length > 0) {
            setPresetParties(data.preset_parties);
            try { localStorage.setItem(`${GUILD_NAME}_preset_parties`, JSON.stringify(data.preset_parties)); } catch (_) {}
          }
          setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          return;
        }
      }

      if (targetTable === 'guild_settings') {
        const { data } = await supabase.from('guild_settings').select('*').eq('id', GUILD_ID).maybeSingle();
        if (data) {
          if (data.guild_name) setGuildName(data.guild_name);
          if (data.file_timestamp) setFileTimestamp(data.file_timestamp);
          return;
        }
      }

      // Universal fallback: guild_state
      const { data, error: fetchErr } = await supabase
        .from('guild_state')
        .select('*')
        .eq('id', GUILD_ID)
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

  // Initial Fetch from Supabase (Modular tables with guild_state fallback)
  const loadFromCloud = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try parallel fetch from modular tables
      try {
        const [settRes, memRes, gvgRes, siegeRes, polRes, aucRes, queRes] = await Promise.all([
          supabase.from('guild_settings').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_members').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_gvg').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_siege').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_polarity').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_auctions').select('*').eq('id', GUILD_ID).maybeSingle(),
          supabase.from('guild_queues').select('*').eq('id', GUILD_ID).maybeSingle(),
        ]);

        const hasAnyModular = !!(
          settRes.data || memRes.data || gvgRes.data || siegeRes.data ||
          polRes.data || aucRes.data || queRes.data
        );

        if (hasAnyModular) {
          hasModularTablesRef.current = true;

          if (settRes.data) {
            if (settRes.data.guild_name) setGuildName(settRes.data.guild_name);
            if (settRes.data.file_timestamp) setFileTimestamp(settRes.data.file_timestamp);
            if (settRes.data.pin) {
              try { localStorage.setItem('Moonz_guild_pin', settRes.data.pin); } catch (_) {}
            }
          }
          if (memRes.data && Array.isArray(memRes.data.members)) {
            setMembers(memRes.data.members);
          }
          if (gvgRes.data) {
            if (Array.isArray(gvgRes.data.teams) && gvgRes.data.teams.length > 0) setGvgTeams(gvgRes.data.teams);
            if (Array.isArray(gvgRes.data.parties)) setGvgParties(gvgRes.data.parties);
          }
          if (siegeRes.data) {
            if (Array.isArray(siegeRes.data.teams) && siegeRes.data.teams.length > 0) {
              setSiegeTeams(siegeRes.data.teams);
              try { localStorage.setItem('Moonz_siege_teams', JSON.stringify(siegeRes.data.teams)); } catch (_) {}
            }
            if (Array.isArray(siegeRes.data.parties)) setSiegeParties(siegeRes.data.parties);
          }
          if (polRes.data) {
            if (Array.isArray(polRes.data.teams) && polRes.data.teams.length > 0) {
              setPolarityTeams(polRes.data.teams);
              try { localStorage.setItem('Moonz_polarity_teams', JSON.stringify(polRes.data.teams)); } catch (_) {}
            }
            if (Array.isArray(polRes.data.parties)) setPolarityParties(polRes.data.parties);
            if (Array.isArray(polRes.data.preset_parties) && polRes.data.preset_parties.length > 0) {
              setPresetParties(polRes.data.preset_parties);
              try { localStorage.setItem(`${GUILD_NAME}_preset_parties`, JSON.stringify(polRes.data.preset_parties)); } catch (_) {}
            } else {
              setPresetParties(DEFAULT_PRESET_PARTIES);
              try { localStorage.setItem(`${GUILD_NAME}_preset_parties`, JSON.stringify(DEFAULT_PRESET_PARTIES)); } catch (_) {}
            }
          }
          if (aucRes.data) {
            if (Array.isArray(aucRes.data.items)) {
              setAuctionItems(aucRes.data.items);
              try { localStorage.setItem('Moonz_auctions', JSON.stringify(aucRes.data.items)); } catch (_) {}
            }
            if (Array.isArray(aucRes.data.rounds)) {
              setAuctionRounds(aucRes.data.rounds);
              try { localStorage.setItem('Moonz_auction_rounds', JSON.stringify(aucRes.data.rounds)); } catch (_) {}
            }
          }
          if (queRes.data && Array.isArray(queRes.data.lists)) {
            setQueueLists(queRes.data.lists);
            try { localStorage.setItem('Moonz_queue_lists', JSON.stringify(queRes.data.lists)); } catch (_) {}
          }
          return;
        }
      } catch (modularErr) {
        console.warn('Modular tables check fallback to guild_state:', modularErr);
      }

      // 2. Fallback to guild_state
      const { data, error: fetchErr } = await supabase
        .from('guild_state')
        .select('*')
        .eq('id', GUILD_ID)
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

  // Save to Supabase (Modular tables + guild_state fallback)
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

      const pin = typeof window !== 'undefined' ? localStorage.getItem('Moonz_guild_pin') || DEFAULT_PIN : DEFAULT_PIN;
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
        if (!isMultiEntryItem(item) && Array.isArray(item.entries) && item.entries.length > 0) {
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
        localStorage.setItem('Moonz_siege_teams', JSON.stringify(state.siegeTeams));
        localStorage.setItem('Moonz_polarity_teams', JSON.stringify(state.polarityTeams));
        localStorage.setItem('Moonz_auctions', JSON.stringify(sanitizedAuctionItems));
        localStorage.setItem('Moonz_auction_rounds', JSON.stringify(state.auctionRounds));
        localStorage.setItem('Moonz_queue_lists', JSON.stringify(state.queueLists));
        localStorage.setItem('Moonz_preset_parties', JSON.stringify(state.presetParties));
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

      // Parallel saves across all modular tables + guild_state fallback
      await Promise.allSettled([
        supabase.from('guild_settings').upsert({
          id: GUILD_ID,
          guild_name: state.guildName,
          pin,
          file_timestamp: state.fileTimestamp,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_members').upsert({
          id: GUILD_ID,
          members: state.members,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_gvg').upsert({
          id: GUILD_ID,
          teams: state.gvgTeams,
          parties: gvgPartiesWithMeta,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_siege').upsert({
          id: GUILD_ID,
          teams: state.siegeTeams,
          parties: siegePartiesWithMeta,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_polarity').upsert({
          id: GUILD_ID,
          teams: state.polarityTeams,
          parties: state.polarityParties,
          preset_parties: state.presetParties,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_auctions').upsert({
          id: GUILD_ID,
          items: sanitizedAuctionItems,
          rounds: state.auctionRounds,
          active_round_id: state.activeRoundId || null,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_queues').upsert({
          id: GUILD_ID,
          lists: state.queueLists,
          updated_at: newUpdatedAt,
        }),
        supabase.from('guild_state').upsert({
          id: GUILD_ID,
          guild_name: state.guildName,
          file_timestamp: state.fileTimestamp,
          members: state.members,
          parties: combinedParties,
          updated_at: newUpdatedAt,
        }),
      ]);

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
  const triggerAutoSave = useCallback((delayMs: number = 800) => {
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
  // 1. Supabase Realtime channel (postgres_changes per modular table + broadcast)
  // 2. Browser StorageEvent (instant cross-tab update on same computer)
  // 3. Fallback polling interval (10 seconds)
  useEffect(() => {
    const channel = supabase
      .channel(`moonz_guild_realtime_${GUILD_ID}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_queues', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_queues'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_auctions', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_auctions'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_members', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_members'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_gvg', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_gvg'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_siege', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_siege'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_polarity', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_polarity'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guild_settings', filter: `id=eq.${GUILD_ID}` }, () => silentReloadFromCloud('guild_settings'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guild_state', filter: `id=eq.${GUILD_ID}` },
        (payload: any) => {
          if (payload?.new) {
            if (payload.new.updated_at && payload.new.updated_at === lastRemoteUpdatedAtRef.current) {
              return;
            }
            applyRemoteData(payload.new);
          } else {
            silentReloadFromCloud('guild_state');
          }
        }
      )
      .on('broadcast', { event: 'state_sync' }, (payload: any) => {
        if (payload?.payload?.senderId === clientSessionId.current) {
          return;
        }
        silentReloadFromCloud(payload?.payload?.table);
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    // Cross-tab instant sync
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      if (e.key === 'Moonz_queue_lists') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            isRemoteSyncingRef.current = true;
            setQueueLists(parsed);
            setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          }
        } catch (_) {}
      } else if (e.key === 'Moonz_auctions') {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            isRemoteSyncingRef.current = true;
            setAuctionItems(parsed);
            setTimeout(() => { isRemoteSyncingRef.current = false; }, 300);
          }
        } catch (_) {}
      } else if (e.key === 'Moonz_auction_rounds') {
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

    // 10s Heartbeat polling (fallback check)
    const pollingInterval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (autoSaveTimerRef.current || isRemoteSyncingRef.current) return;
      try {
        const { data, error } = await supabase
          .from('guild_state')
          .select('updated_at')
          .eq('id', GUILD_ID)
          .maybeSingle();

        if (!error && data?.updated_at && data.updated_at !== lastRemoteUpdatedAtRef.current) {
          silentReloadFromCloud();
        }
      } catch (_) {}
    }, 10000);

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

  const createAuctionRound = (
    name: string,
    date?: string,
    note?: string,
    scheduledOpenAt?: string,
    scheduledCloseAt?: string
  ): string => {
    const newRoundId = `round_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isFutureSchedule = scheduledOpenAt ? new Date(scheduledOpenAt).getTime() > Date.now() : false;
    const newRound: AuctionRound = {
      id: newRoundId,
      name: name.trim() || `รอบประมูล ${new Date().toLocaleDateString('th-TH')}`,
      date: date || new Date().toISOString().split('T')[0],
      status: isFutureSchedule ? 'scheduled' : 'active',
      createdAt: new Date().toISOString(),
      scheduledOpenAt: scheduledOpenAt || undefined,
      scheduledCloseAt: scheduledCloseAt || undefined,
      note: note?.trim() || undefined,
    };
    setAuctionRounds((prev) => [newRound, ...prev]);
    setActiveRoundId(newRoundId);
    triggerAutoSave();
    return newRoundId;
  };

  const setRoundSchedule = (
    id: string,
    scheduledOpenAt?: string | null,
    scheduledCloseAt?: string | null
  ) => {
    setAuctionRounds((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const isFuture = scheduledOpenAt ? new Date(scheduledOpenAt).getTime() > Date.now() : false;
        return {
          ...r,
          status: isFuture ? 'scheduled' : 'active',
          scheduledOpenAt: scheduledOpenAt || undefined,
          scheduledCloseAt: scheduledCloseAt || undefined,
        };
      })
    );
    triggerAutoSave();
  };

  const openScheduledRoundNow = (id: string) => {
    setAuctionRounds((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: 'active', scheduledOpenAt: undefined }
          : r
      )
    );
    setAuctionItems((prev) =>
      prev.map((item) => {
        if (item.roundId === id && item.status === 'pending') {
          return { ...item, status: 'active' };
        }
        return item;
      })
    );
    triggerAutoSave();
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

  // Auto-schedule checker for Auction Rounds and Queue Lists (runs every second)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      // 1. Check scheduled auction rounds
      const roundsToOpen: string[] = [];
      const roundsToClose: string[] = [];

      auctionRounds.forEach((r) => {
        if (r.status === 'scheduled' && r.scheduledOpenAt) {
          const openTime = new Date(r.scheduledOpenAt).getTime();
          if (now >= openTime) {
            roundsToOpen.push(r.id);
          }
        } else if (r.status === 'active' && r.scheduledCloseAt) {
          const closeTime = new Date(r.scheduledCloseAt).getTime();
          if (now >= closeTime) {
            roundsToClose.push(r.id);
          }
        }
      });

      if (roundsToOpen.length > 0) {
        setAuctionRounds((prev) =>
          prev.map((r) =>
            roundsToOpen.includes(r.id)
              ? { ...r, status: 'active', scheduledOpenAt: undefined }
              : r
          )
        );
        setAuctionItems((prev) =>
          prev.map((item) =>
            item.roundId && roundsToOpen.includes(item.roundId) && item.status === 'pending'
              ? { ...item, status: 'active' }
              : item
          )
        );
        hasChanges = true;
      }

      if (roundsToClose.length > 0) {
        setAuctionRounds((prev) =>
          prev.map((r) =>
            roundsToClose.includes(r.id)
              ? { ...r, status: 'completed', closedAt: new Date().toISOString() }
              : r
          )
        );
        hasChanges = true;
      }

      // 2. Check scheduled queue lists
      const queuesToOpen: string[] = [];
      queueLists.forEach((q) => {
        if (q.status === 'scheduled' && q.scheduledOpenAt) {
          const openTime = new Date(q.scheduledOpenAt).getTime();
          if (now >= openTime) {
            queuesToOpen.push(q.id);
          }
        }
      });

      if (queuesToOpen.length > 0) {
        setQueueLists((prev) =>
          prev.map((q) => {
            if (!queuesToOpen.includes(q.id)) return q;
            const existingMemberIds = new Set((q.entries || []).map((e) => e.memberId));
            const newEntries = [...(q.entries || [])];
            (q.preRegisteredMemberIds || []).forEach((mId, idx) => {
              if (!existingMemberIds.has(mId)) {
                const m = latestStateRef.current.members.find((mem) => mem.id === mId);
                newEntries.push({
                  id: `qentry_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
                  memberId: mId,
                  memberName: m?.name || 'ไม่ทราบชื่อ',
                  memberJob: m?.job,
                  joinedAt: new Date(Date.now() + idx * 100).toISOString(),
                });
                existingMemberIds.add(mId);
              }
            });

            return {
              ...q,
              status: 'open',
              entries: newEntries,
              scheduledOpenAt: undefined,
              updatedAt: new Date().toISOString(),
            };
          })
        );
        hasChanges = true;
      }

      if (hasChanges) {
        triggerAutoSave();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auctionRounds, queueLists]);

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

        // If not Multi-Entry (Title or Chest/Pack), member can only register once
        const allowMultiple = isMultiEntryItem(item);
        if (!allowMultiple && currentEntries.some((e) => e.memberId === memberId)) {
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
        const allowMultiple = isMultiEntryItem(item);

        for (const mId of memberIds) {
          if (currentEntries.length + newEntries.length >= maxLimit) break;
          // If not Multi-Entry, member can only register once
          if (!allowMultiple && (currentEntries.some((e) => e.memberId === mId) || newEntries.some((e) => e.memberId === mId))) {
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
  const createQueueList = (data: Omit<QueueList, 'createdAt' | 'entries'> & { id?: string }): string => {
    const rawId = (data.id && data.id.trim())
      ? data.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : '';
    const newId = rawId || `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isFutureSchedule = data.scheduledOpenAt ? new Date(data.scheduledOpenAt).getTime() > Date.now() : false;
    const preRegIds = data.preRegisteredMemberIds || [];

    // If opened immediately and preRegIds has members, populate them right now into entries
    let initialEntries: QueueEntry[] = [];
    if (!isFutureSchedule && preRegIds.length > 0) {
      initialEntries = preRegIds.map((mId, idx) => {
        const m = latestStateRef.current.members.find((mem) => mem.id === mId);
        return {
          id: `qentry_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          memberId: mId,
          memberName: m?.name || 'ไม่ทราบชื่อ',
          memberJob: m?.job,
          joinedAt: new Date(Date.now() + idx * 100).toISOString(),
        };
      });
    }

    const newList: QueueList = {
      ...data,
      id: newId,
      status: isFutureSchedule ? 'scheduled' : data.status || 'open',
      createdAt: new Date().toISOString(),
      entries: initialEntries,
      preRegisteredMemberIds: preRegIds,
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

  const addMemberToQueue = async (
    queueId: string,
    memberId: string,
    note?: string
  ): Promise<{ success: boolean; message: string }> => {
    const member = latestStateRef.current.members.find((m) => m.id === memberId);
    if (!member) return { success: false, message: 'ไม่พบข้อมูลสมาชิก' };

    // 1. เรียก Atomic Database Function (RPC) บน Supabase ล็อกแถวด้วย FOR UPDATE
    // ป้องกันคนกดพร้อมกันแล้วแย่งกัน / เด้งออก 100%
    try {
      const { data, error: rpcErr } = await supabase.rpc('join_queue_atomic', {
        p_guild_id: GUILD_ID,
        p_queue_id: queueId,
        p_member_id: member.id,
        p_member_name: member.name,
        p_member_job: member.job || null,
        p_note: note?.trim() || null,
      });

      if (!rpcErr && data && typeof data === 'object') {
        const res = data as { success: boolean; message: string; position?: number };
        if (res.success) {
          silentReloadFromCloud('guild_queues');
          return {
            success: true,
            message: res.message || `เข้าร่วมคิวสำเร็จ! (อันดับที่ #${res.position})`,
          };
        } else {
          return {
            success: false,
            message: res.message || 'ไม่สามารถเข้าร่วมคิวได้',
          };
        }
      }
    } catch (rpcEx) {
      console.warn('join_queue_atomic RPC fallback:', rpcEx);
    }

    // 2. Fallback: ถ้ายังไม่ได้รัน SQL RPC บน Cloud
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

  const removeMemberFromQueue = async (queueId: string, entryId: string): Promise<void> => {
    try {
      const { data, error: rpcErr } = await supabase.rpc('remove_queue_entry_atomic', {
        p_guild_id: GUILD_ID,
        p_queue_id: queueId,
        p_entry_id: entryId,
      });

      if (!rpcErr && data && (data as any).success) {
        silentReloadFromCloud('guild_queues');
        return;
      }
    } catch (rpcEx) {
      console.warn('remove_queue_entry_atomic RPC fallback:', rpcEx);
    }

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

  const removeMemberByMemberIdFromQueue = async (
    queueId: string,
    memberId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error: rpcErr } = await supabase.rpc('leave_queue_atomic', {
        p_guild_id: GUILD_ID,
        p_queue_id: queueId,
        p_member_id: memberId,
      });

      if (!rpcErr && data && (data as any).success) {
        silentReloadFromCloud('guild_queues');
        return { success: true, message: (data as any).message || 'ยกเลิกการต่อคิวเรียบร้อยแล้ว' };
      }
    } catch (rpcEx) {
      console.warn('leave_queue_atomic RPC fallback:', rpcEx);
    }

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
    return { success: true, message: 'ยกเลิกการต่อคิวเรียบร้อยแล้ว' };
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

  const setQueueStatus = (queueId: string, status: 'open' | 'in_progress' | 'closed' | 'scheduled') => {
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

  const openScheduledQueueNow = (queueId: string) => {
    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        const existingMemberIds = new Set((q.entries || []).map((e) => e.memberId));
        const newEntries = [...(q.entries || [])];
        (q.preRegisteredMemberIds || []).forEach((mId, idx) => {
          if (!existingMemberIds.has(mId)) {
            const m = latestStateRef.current.members.find((mem) => mem.id === mId);
            newEntries.push({
              id: `qentry_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              memberId: mId,
              memberName: m?.name || 'ไม่ทราบชื่อ',
              memberJob: m?.job,
              joinedAt: new Date(Date.now() + idx * 100).toISOString(),
            });
            existingMemberIds.add(mId);
          }
        });

        return {
          ...q,
          status: 'open',
          entries: newEntries,
          scheduledOpenAt: undefined,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    triggerAutoSave();
  };

  const setQueueSchedule = (
    queueId: string,
    scheduledOpenAt?: string | null,
    preRegisteredMemberIds?: string[]
  ) => {
    setQueueLists((prev) =>
      prev.map((q) => {
        if (q.id !== queueId) return q;
        const isFuture = scheduledOpenAt ? new Date(scheduledOpenAt).getTime() > Date.now() : false;
        return {
          ...q,
          status: isFuture ? 'scheduled' : 'open',
          scheduledOpenAt: scheduledOpenAt || undefined,
          preRegisteredMemberIds: preRegisteredMemberIds !== undefined ? preRegisteredMemberIds : q.preRegisteredMemberIds,
          updatedAt: new Date().toISOString(),
        };
      })
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
        setRoundSchedule,
        openScheduledRoundNow,
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
        openScheduledQueueNow,
        setQueueSchedule,
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

