'use client';

import React, { useState, useMemo } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import TeamSection from '@/components/tactical/TeamSection';
import MemberPool from '@/components/tactical/MemberPool';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import DonateCard from '@/components/common/DonateCard';
import CreateTeamModal from '@/components/modals/CreateTeamModal';
import ExportImageModal from '@/components/modals/ExportImageModal';
import { ImportPresetModal } from '@/components/modals/ImportPresetModal';
import { Party, LaneKey, FieldZoneKey } from '@/types/party';
import { JOB_LOOKUP } from '@/constants/jobs';
import { TEAM_COLOR_KEYS } from '@/constants/teamColors';

export default function GvgPage() {
  const {
    guildName,
    fileTimestamp,
    members,
    gvgTeams,
    setGvgTeams,
    gvgParties,
    setGvgParties,
    selectedDate,
    setSelectedDate,
    isLoading,
    isSaving,
    lastSavedAt,
    error,
    loadFromCloud,
    saveToCloud,
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
    presetParties,
    applyPresetToParty,
  } = useGuildStore();

  // Selection state for drag/click-to-swap
  const [selectedSlot, setSelectedSlot] = useState<{ partyId: string; slotIndex: number } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isExportImageModalOpen, setIsExportImageModalOpen] = useState(false);
  const [importPresetPartyId, setImportPresetPartyId] = useState<string | null>(null);

  // Set of assigned member IDs in GVG
  const assignedMemberIds = useMemo(() => {
    const ids = new Set<string>();
    gvgParties.forEach((p) => {
      p.slots?.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [gvgParties]);

  // Counts of unassigned members for the 15 Job Emblem Bar
  const countsByFamily = useMemo(() => {
    const counts: Record<string, number> = {};
    const unassigned = members.filter((m) => !assignedMemberIds.has(m.id));
    unassigned.forEach((m) => {
      const meta = JOB_LOOKUP[m.job?.trim().toLowerCase()];
      if (meta) {
        counts[meta.familyKey] = (counts[meta.familyKey] || 0) + 1;
      }
    });
    return counts;
  }, [members, assignedMemberIds]);

  const unassignedCount = useMemo(() => {
    return members.filter((m) => !assignedMemberIds.has(m.id)).length;
  }, [members, assignedMemberIds]);

  // Main vs Sub field teams
  const mainFieldTeams = useMemo(() => gvgTeams.filter((t) => t.field === 'main'), [gvgTeams]);
  const subFieldTeams = useMemo(() => gvgTeams.filter((t) => t.field === 'sub'), [gvgTeams]);

  // Handle clicking a party slot
  const handleSlotClick = (partyId: string, slotIndex: number, currentMemberId: string | null) => {
    // Case 1: A member from the pool was selected -> place member into this slot
    if (selectedMemberId) {
      placeMemberInSlot(partyId, slotIndex, selectedMemberId);
      setSelectedMemberId(null);
      setSelectedSlot(null);
      return;
    }

    // Case 2: A party slot was already selected
    if (selectedSlot) {
      // If clicked the exact same slot -> deselect
      if (selectedSlot.partyId === partyId && selectedSlot.slotIndex === slotIndex) {
        setSelectedSlot(null);
        return;
      }
      // Swap slots
      swapSlots(selectedSlot.partyId, selectedSlot.slotIndex, partyId, slotIndex);
      setSelectedSlot(null);
      return;
    }

    // Case 3: Nothing was selected -> select this slot if it has a member, or prepare for placing
    if (currentMemberId) {
      setSelectedSlot({ partyId, slotIndex });
    }
  };

  // Handle member selection from pool
  const handleSelectMemberFromPool = (memberId: string) => {
    // If a slot was already selected -> place this pool member into that slot
    if (selectedSlot) {
      placeMemberInSlot(selectedSlot.partyId, selectedSlot.slotIndex, memberId);
      setSelectedSlot(null);
      setSelectedMemberId(null);
      return;
    }

    // Toggle pool member selection
    if (selectedMemberId === memberId) {
      setSelectedMemberId(null);
    } else {
      setSelectedMemberId(memberId);
    }
  };

  // Drag and Drop Handler
  const handleDropMemberToSlot = (
    targetPartyId: string,
    targetSlotIndex: number,
    payload: { memberId: string; fromPartyId?: string; fromSlotIndex?: number }
  ) => {
    if (payload.fromPartyId !== undefined && payload.fromSlotIndex !== undefined) {
      swapSlots(payload.fromPartyId, payload.fromSlotIndex, targetPartyId, targetSlotIndex);
    } else {
      placeMemberInSlot(targetPartyId, targetSlotIndex, payload.memberId);
    }
  };

  // Add new Team Modal Confirm
  const handleCreateTeamConfirm = (teamName: string, field: FieldZoneKey, color?: string) => {
    const newTeamId = `team_${Date.now()}`;
    const colors = TEAM_COLOR_KEYS;
    const finalColor = color || colors[gvgTeams.length % colors.length];

    const newTeam = {
      id: newTeamId,
      name: teamName,
      field,
      color: finalColor,
    };

    const defaultLanes: LaneKey[] =
      field === 'sub'
        ? ['roam_left', 'roam_left', 'roam_right', 'roam_right']
        : ['lane_mid', 'lane_mid', 'lane_right', 'roam_left'];

    const newParties: Party[] = [1, 2, 3, 4].map((num) => ({
      id: `party_${newTeamId}_p${num}_${Math.random().toString(36).substring(2, 6)}`,
      name: `ปาร์ตี้ ${num}`,
      teamId: newTeamId,
      lane: defaultLanes[num - 1],
      slots: [null, null, null, null, null],
    }));

    setGvgTeams([...gvgTeams, newTeam]);
    setGvgParties([...gvgParties, ...newParties]);
  };

  // Delete Team
  const handleDeleteTeam = (teamId: string) => {
    const team = gvgTeams.find((t) => t.id === teamId);
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${team?.name || 'ทีมนี้'}?`)) return;
    // Remove team and all its parties
    setGvgTeams(gvgTeams.filter((t) => t.id !== teamId));
    const partiesToDelete = gvgParties.filter((p) => p.teamId === teamId);
    partiesToDelete.forEach((p) => deleteParty(p.id));
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f]/95 p-4 sm:p-5 shadow-md dark:shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl border border-amber-500/30">
              ⚔️
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <span>ผังทัพกิลด์วอร์ (GVG) — {guildName}</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                สนามหลัก & สนามรอง • จัดทัพยุทธศาสตร์ RO Guild War
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {/* Status & Date */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-xs text-xs">
              <span className="text-indigo-800 dark:text-indigo-200 font-semibold flex items-center gap-1">
                <span>📅</span>
                <span className="hidden sm:inline">ข้อมูลวันที่:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-500/30 hover:border-indigo-400 rounded-lg px-2 py-0.5 text-slate-900 dark:text-white font-bold font-mono text-xs focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow transition active:scale-95 cursor-pointer"
                title="กลับมาวันนี้"
              >
                วันนี้
              </button>
            </div>

            <AutoSaveBadge />
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadFromCloud}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              <span>🔄</span>
              <span>ดึงข้อมูล</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportImageModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 transition shadow-sm cursor-pointer whitespace-nowrap"
              title="ส่งออกรูปภาพผังทัพที่จัด (PNG)"
            >
              <span>📸</span>
              <span>ส่งออกรูป</span>
            </button>

            <button
              type="button"
              onClick={saveToCloud}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <span>💾</span>
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก Cloud'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateTeamModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>+</span>
              <span>สร้างทีมใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* 15 Job Class Emblem Bar (Matching Image 2) */}
      <JobEmblemBar
        selectedJob={selectedFamily}
        onSelectJob={setSelectedFamily}
        counts={countsByFamily}
        totalCount={unassignedCount}
      />

      {/* Main Grid: Left Member Pool + Right Tactical Teams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Unassigned Members Pool & Donate Card */}
        <div className="lg:col-span-3 lg:sticky lg:top-20 space-y-4">
          <MemberPool
            members={members}
            assignedMemberIds={assignedMemberIds}
            selectedMemberId={selectedMemberId}
            selectedFamily={selectedFamily}
            onSelectMember={handleSelectMemberFromPool}
          />
          <DonateCard />
        </div>

        {/* Right: Tactical Teams (Main & Sub Field) */}
        <div className="lg:col-span-9 space-y-8">
          {/* Main Field Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm">
                  ⚔️
                </span>
                <h2 className="text-lg font-extrabold text-amber-700 dark:text-amber-200 tracking-wide">
                  สนามหลัก (Main Field)
                </h2>
                <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  {mainFieldTeams.length} ทีม
                </span>
              </div>
            </div>

            {mainFieldTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                ยังไม่มีทีมในสนามหลัก
              </div>
            ) : (
              mainFieldTeams.map((team) => {
                const teamParties = gvgParties.filter((p) => p.teamId === team.id);
                return (
                  <TeamSection
                    key={team.id}
                    team={team}
                    parties={teamParties}
                    members={members}
                    allTeams={gvgTeams}
                    selectedSlot={selectedSlot}
                    onSlotClick={handleSlotClick}
                    onRemoveMember={(partyId, slotIdx) => removeMemberFromSlot(partyId, slotIdx)}
                    onClearParty={(partyId) => clearPartySlots(partyId)}
                    onDeleteParty={(partyId) => deleteParty(partyId)}
                    onRenameParty={(partyId) => {
                      const cur = gvgParties.find((p) => p.id === partyId);
                      const name = prompt('เปลี่ยนชื่อปาร์ตี้:', cur?.name);
                      if (name && name.trim()) renameParty(partyId, name.trim());
                    }}
                    onChangeLane={(partyId, lane: LaneKey) => setPartyLane(partyId, lane)}
                    onChangeTeam={(partyId, targetTeamId) => setPartyTeam(partyId, targetTeamId)}
                    onImportPreset={(partyId) => setImportPresetPartyId(partyId)}
                    onRenameTeam={(teamId) => {
                      const cur = gvgTeams.find((t) => t.id === teamId);
                      const name = prompt('เปลี่ยนชื่อทีม:', cur?.name);
                      if (name && name.trim()) renameTeam(teamId, name.trim());
                    }}
                    onChangeTeamField={(teamId, field: FieldZoneKey) => setTeamField(teamId, field)}
                    onAddParty={(teamId) => addPartyToTeam(teamId)}
                    onRenumberParties={(teamId) => renumberTeamParties(teamId)}
                    onDeleteTeam={(teamId) => handleDeleteTeam(teamId)}
                    onDropMemberToSlot={handleDropMemberToSlot}
                  />
                );
              })
            )}
          </div>

          {/* Sub Field Header */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between border-b border-violet-500/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm">
                  🛡️
                </span>
                <h2 className="text-lg font-extrabold text-violet-700 dark:text-violet-200 tracking-wide">
                  สนามรอง (Sub Field)
                </h2>
                <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-500/30 px-2 py-0.5 text-[11px] font-bold text-violet-800 dark:text-violet-300">
                  {subFieldTeams.length} ทีม
                </span>
              </div>
            </div>

            {subFieldTeams.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-500">
                ยังไม่มีทีมในสนามรอง
              </div>
            ) : (
              subFieldTeams.map((team) => {
                const teamParties = gvgParties.filter((p) => p.teamId === team.id);
                return (
                  <TeamSection
                    key={team.id}
                    team={team}
                    parties={teamParties}
                    members={members}
                    allTeams={gvgTeams}
                    selectedSlot={selectedSlot}
                    onSlotClick={handleSlotClick}
                    onRemoveMember={(partyId, slotIdx) => removeMemberFromSlot(partyId, slotIdx)}
                    onClearParty={(partyId) => clearPartySlots(partyId)}
                    onDeleteParty={(partyId) => deleteParty(partyId)}
                    onRenameParty={(partyId) => {
                      const cur = gvgParties.find((p) => p.id === partyId);
                      const name = prompt('เปลี่ยนชื่อปาร์ตี้:', cur?.name);
                      if (name && name.trim()) renameParty(partyId, name.trim());
                    }}
                    onChangeLane={(partyId, lane: LaneKey) => setPartyLane(partyId, lane)}
                    onChangeTeam={(partyId, targetTeamId) => setPartyTeam(partyId, targetTeamId)}
                    onImportPreset={(partyId) => setImportPresetPartyId(partyId)}
                    onRenameTeam={(teamId) => {
                      const cur = gvgTeams.find((t) => t.id === teamId);
                      const name = prompt('เปลี่ยนชื่อทีม:', cur?.name);
                      if (name && name.trim()) renameTeam(teamId, name.trim());
                    }}
                    onChangeTeamField={(teamId, field: FieldZoneKey) => setTeamField(teamId, field)}
                    onAddParty={(teamId) => addPartyToTeam(teamId)}
                    onRenumberParties={(teamId) => renumberTeamParties(teamId)}
                    onDeleteTeam={(teamId) => handleDeleteTeam(teamId)}
                    onDropMemberToSlot={handleDropMemberToSlot}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        nextLetter={String.fromCharCode(65 + gvgTeams.length)}
        defaultColor={TEAM_COLOR_KEYS[gvgTeams.length % TEAM_COLOR_KEYS.length]}
        showColorSelector={false}
        onCreateTeam={handleCreateTeamConfirm}
      />

      {/* Export Tactical Board Image Modal */}
      <ExportImageModal
        isOpen={isExportImageModalOpen}
        onClose={() => setIsExportImageModalOpen(false)}
      />

      {/* Import Preset Squad Modal */}
      <ImportPresetModal
        isOpen={!!importPresetPartyId}
        onClose={() => setImportPresetPartyId(null)}
        targetParty={gvgParties.find((p) => p.id === importPresetPartyId) || null}
        presetParties={presetParties}
        currentParties={gvgParties}
        members={members}
        onConfirm={(presetPartyId) => {
          if (importPresetPartyId) {
            applyPresetToParty('gvg', importPresetPartyId, presetPartyId);
          }
        }}
      />
    </div>
  );
}

