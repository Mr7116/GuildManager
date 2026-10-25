'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Member } from '@/types/member';
import { Party, Team, LaneKey, FieldZoneKey } from '@/types/party';

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
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoadDone = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    };
  }, [guildName, fileTimestamp, members, gvgTeams, gvgParties, siegeTeams, siegeParties, polarityTeams, polarityParties, presetParties]);

  // Fetch from Supabase
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
        if (data.guild_name) setGuildName(data.guild_name);
        if (data.file_timestamp) setFileTimestamp(data.file_timestamp);
        if (Array.isArray(data.members)) setMembers(data.members);

        if (Array.isArray(data.parties)) {
          const rawParties = data.parties as (Party & { category?: string; teamName?: string; teamField?: FieldZoneKey; teamColor?: string })[];

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
            // Reconstruct teams from siege parties metadata if available
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
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load from Supabase:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setIsLoading(false);
      isInitialLoadDone.current = true;
    }
  }, []);

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

      try {
        localStorage.setItem('TUMDOOD_siege_teams', JSON.stringify(state.siegeTeams));
        localStorage.setItem('TUMDOOD_polarity_teams', JSON.stringify(state.polarityTeams));
      } catch (e) {}

      const combinedParties = [
        ...gvgPartiesWithMeta,
        ...state.polarityParties.map((p) => ({ ...p, category: 'polarity' })),
        ...siegePartiesWithMeta,
        ...state.presetParties.map((p) => ({ ...p, category: 'preset' })),
        authEntry,
        siegeTeamsEntry,
        polarityTeamsEntry,
      ];

      const { error: saveErr } = await supabase.from('guild_state').upsert({
        id: 2,
        guild_name: state.guildName,
        file_timestamp: state.fileTimestamp,
        members: state.members,
        parties: combinedParties,
        updated_at: new Date().toISOString(),
      });

      if (saveErr) throw saveErr;

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
    if (!isInitialLoadDone.current) return;
    setHasUnsavedChanges(true);
    setSaveStatus('pending');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      saveToCloud();
    }, delayMs);
  }, [saveToCloud]);

  // Watch for state changes and auto-save
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
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

