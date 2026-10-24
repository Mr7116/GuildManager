'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import MemberPool from '@/components/tactical/MemberPool';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import DonateCard from '@/components/common/DonateCard';
import TeamSection from '@/components/tactical/TeamSection';
import ExportImageModal from '@/components/modals/ExportImageModal';
import { ImportPresetModal } from '@/components/modals/ImportPresetModal';
import { Party, Team } from '@/types/party';
import { JOB_LOOKUP } from '@/constants/jobs';

export default function SiegePage() {
  const {
    guildName,
    members,
    siegeTeams,
    setSiegeTeams,
    siegeParties,
    setSiegeParties,
    presetParties,
    applyPresetToParty,
    selectedDate,
    setSelectedDate,
    isLoading,
    isSaving,
    saveToCloud,
  } = useGuildStore();

  const [selectedSlot, setSelectedSlot] = useState<{ partyId: string; slotIndex: number } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [isExportImageModalOpen, setIsExportImageModalOpen] = useState(false);
  const [importPresetPartyId, setImportPresetPartyId] = useState<string | null>(null);

  // Fallback to default team if siegeTeams is empty
  const effectiveTeams = useMemo<Team[]>(() => {
    if (siegeTeams && siegeTeams.length > 0) return siegeTeams;
    return [{ id: 'siege_team_1', name: 'ทีมปราสาท 1', color: 'sky', field: 'main' }];
  }, [siegeTeams]);

  // Sync initial team into store if parties exist but no teams are recorded
  useEffect(() => {
    if (isLoading) return;
    if (siegeTeams.length === 0 && siegeParties.length > 0) {
      setSiegeTeams([{ id: 'siege_team_1', name: 'ทีมปราสาท 1', color: 'sky', field: 'main' }]);
    }
  }, [isLoading, siegeTeams.length, siegeParties.length, setSiegeTeams]);

  // If parties have teams not currently in siegeTeams, restore those teams instead of wiping them
  useEffect(() => {
    if (isLoading) return;
    const knownIds = new Set(siegeTeams.map((t) => t.id));
    const unrecordedTeamIds = Array.from(new Set(siegeParties.map((p) => p.teamId).filter(Boolean)))
      .filter((id) => id !== 'siege_main' && !knownIds.has(id!));

    if (unrecordedTeamIds.length > 0) {
      const recoveredTeams: Team[] = unrecordedTeamIds.map((tid, idx) => ({
        id: tid!,
        name: `ทีมปราสาท ${siegeTeams.length + idx + 1}`,
        color: 'sky',
        field: 'main',
      }));
      setSiegeTeams((prev) => [...prev, ...recoveredTeams]);
    }
  }, [isLoading, siegeTeams, siegeParties, setSiegeTeams]);

  // Only migrate truly orphaned parties (missing teamId or legacy 'siege_main')
  useEffect(() => {
    if (isLoading || effectiveTeams.length === 0) return;
    const hasOrphans = siegeParties.some((p) => !p.teamId || p.teamId === 'siege_main');
    if (hasOrphans) {
      const fallbackId = effectiveTeams[0].id;
      setSiegeParties((prev) =>
        prev.map((p) => {
          if (!p.teamId || p.teamId === 'siege_main') {
            return { ...p, teamId: fallbackId };
          }
          return p;
        })
      );
    }
  }, [isLoading, effectiveTeams, siegeParties, setSiegeParties]);

  // Assigned members in Siege
  const assignedMemberIds = useMemo(() => {
    const ids = new Set<string>();
    siegeParties.forEach((p) => {
      p.slots?.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [siegeParties]);

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

  // Handle clicking a party slot
  const handleSlotClick = (partyId: string, slotIndex: number, currentMemberId: string | null) => {
    if (selectedMemberId) {
      setSiegeParties((prev) => {
        const cleaned = prev.map((p) => ({
          ...p,
          slots: (p.slots || [null, null, null, null, null]).map((id) => (id === selectedMemberId ? null : id)),
        }));
        return cleaned.map((p) => {
          if (p.id !== partyId) return p;
          const slots = [...(p.slots || [null, null, null, null, null])];
          slots[slotIndex] = selectedMemberId;
          return { ...p, slots };
        });
      });
      setSelectedMemberId(null);
      setSelectedSlot(null);
      return;
    }

    if (selectedSlot) {
      if (selectedSlot.partyId === partyId && selectedSlot.slotIndex === slotIndex) {
        setSelectedSlot(null);
        return;
      }
      setSiegeParties((prev) => {
        const fromParty = prev.find((p) => p.id === selectedSlot.partyId);
        const toParty = prev.find((p) => p.id === partyId);
        if (!fromParty || !toParty) return prev;
        const fromMember = fromParty.slots?.[selectedSlot.slotIndex] || null;
        const toMember = toParty.slots?.[slotIndex] || null;

        return prev.map((p) => {
          if (p.id === selectedSlot.partyId && p.id === partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[selectedSlot.slotIndex] = toMember;
            slots[slotIndex] = fromMember;
            return { ...p, slots };
          }
          if (p.id === selectedSlot.partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[selectedSlot.slotIndex] = toMember;
            return { ...p, slots };
          }
          if (p.id === partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[slotIndex] = fromMember;
            return { ...p, slots };
          }
          return p;
        });
      });
      setSelectedSlot(null);
      return;
    }

    if (currentMemberId) {
      setSelectedSlot({ partyId, slotIndex });
    }
  };

  const handleRemoveMember = (partyId: string, slotIndex: number) => {
    setSiegeParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        const slots = [...(p.slots || [null, null, null, null, null])];
        slots[slotIndex] = null;
        return { ...p, slots };
      })
    );
  };

  const handleClearParty = (partyId: string) => {
    setSiegeParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, slots: [null, null, null, null, null] } : p))
    );
  };

  const handleCreateTeam = () => {
    const nextNum = effectiveTeams.length + 1;
    const name = prompt('กรุณาใส่ชื่อทีมใหม่:', `ทีมปราสาท ${nextNum}`);
    if (!name || !name.trim()) return;

    const newTeamId = `siege_team_${Date.now()}`;
    const newTeam: Team = {
      id: newTeamId,
      name: name.trim(),
      color: 'sky',
      field: 'main',
    };

    setSiegeTeams([...effectiveTeams, newTeam]);

    // Automatically add initial party to the newly created team
    const newParty: Party = {
      id: `siege_p_${Date.now()}`,
      name: `ปาร์ตี้ 1`,
      teamId: newTeamId,
      slots: [null, null, null, null, null],
    };
    setSiegeParties((prev) => [...prev, newParty]);
  };

  const handleAddParty = (teamId?: string) => {
    const targetTeamId = teamId || effectiveTeams[0].id;
    const teamParties = siegeParties.filter((p) => {
      if (effectiveTeams.length <= 1) return true;
      if (p.teamId === targetTeamId) return true;
      const isKnown = effectiveTeams.some((t) => t.id === p.teamId);
      if (!isKnown && targetTeamId === effectiveTeams[0].id) return true;
      return false;
    });
    const newIdx = teamParties.length + 1;
    const newParty: Party = {
      id: `siege_p_${Date.now()}`,
      name: `ปาร์ตี้ ${newIdx}`,
      teamId: targetTeamId,
      slots: [null, null, null, null, null],
    };
    setSiegeParties((prev) => [...prev, newParty]);
  };

  const handleDeleteParty = (partyId: string) => {
    setSiegeParties((prev) => prev.filter((p) => p.id !== partyId));
  };

  const handleRenameParty = (partyId: string) => {
    const cur = siegeParties.find((p) => p.id === partyId);
    const name = prompt('เปลี่ยนชื่อปาร์ตี้:', cur?.name);
    if (name && name.trim()) {
      setSiegeParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, name: name.trim() } : p))
      );
    }
  };

  const handleRenameTeam = (teamId: string) => {
    const team = effectiveTeams.find((t) => t.id === teamId);
    const name = prompt('เปลี่ยนชื่อทีม:', team?.name);
    if (name && name.trim()) {
      setSiegeTeams((prev) => {
        const list = prev.length > 0 ? prev : effectiveTeams;
        return list.map((t) => (t.id === teamId ? { ...t, name: name.trim() } : t));
      });
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    const team = effectiveTeams.find((t) => t.id === teamId);
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${team?.name || 'ทีมนี้'} และปาร์ตี้ทั้งหมดในทีม?`)) return;
    setSiegeTeams((prev) => prev.filter((t) => t.id !== teamId));
    setSiegeParties((prev) => prev.filter((p) => (p.teamId || effectiveTeams[0].id) !== teamId));
  };

  const handleRenumberParties = (teamId: string) => {
    let counter = 1;
    setSiegeParties((prev) =>
      prev.map((p) => {
        const belongsToTeam =
          effectiveTeams.length <= 1 ||
          p.teamId === teamId ||
          (!effectiveTeams.some((t) => t.id === p.teamId) && teamId === effectiveTeams[0].id);
        if (belongsToTeam) {
          const updated = { ...p, name: `ปาร์ตี้ ${counter}`, teamId };
          counter++;
          return updated;
        }
        return p;
      })
    );
  };

  const handleChangeTeam = (partyId: string, targetTeamId: string) => {
    setSiegeParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, teamId: targetTeamId } : p))
    );
  };

  // Drag and drop member between party slots
  const handleDropMemberToSlot = (
    partyId: string,
    slotIdx: number,
    payload: { memberId: string; fromPartyId?: string; fromSlotIndex?: number }
  ) => {
    if (payload.fromPartyId !== undefined && payload.fromSlotIndex !== undefined) {
      const fromPartyId = payload.fromPartyId;
      const fromSlotIdx = payload.fromSlotIndex;
      setSiegeParties((prev) => {
        const fromParty = prev.find((p) => p.id === fromPartyId);
        const toParty = prev.find((p) => p.id === partyId);
        if (!fromParty || !toParty) return prev;
        const fromMember = fromParty.slots?.[fromSlotIdx] || null;
        const toMember = toParty.slots?.[slotIdx] || null;

        return prev.map((p) => {
          if (p.id === fromPartyId && p.id === partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[fromSlotIdx] = toMember;
            slots[slotIdx] = fromMember;
            return { ...p, slots };
          }
          if (p.id === fromPartyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[fromSlotIdx] = toMember;
            return { ...p, slots };
          }
          if (p.id === partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[slotIdx] = fromMember;
            return { ...p, slots };
          }
          return p;
        });
      });
    } else {
      setSiegeParties((prev) => {
        const cleaned = prev.map((p) => ({
          ...p,
          slots: (p.slots || [null, null, null, null, null]).map((id) => (id === payload.memberId ? null : id)),
        }));
        return cleaned.map((p) => {
          if (p.id !== partyId) return p;
          const slots = [...(p.slots || [null, null, null, null, null])];
          slots[slotIdx] = payload.memberId;
          return { ...p, slots };
        });
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f]/95 p-4 sm:p-5 shadow-md dark:shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-xl border border-sky-500/30">
            🏰
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">
              ศึกชิงปราสาท (Siege War) — {guildName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              จัดทัพป้องกันและบุกยึดปราสาท • {effectiveTeams.length} ทีม • {siegeParties.length} ปาร์ตี้
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {/* Status & Date */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-indigo-500/40 rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-xs text-xs">
              <span className="text-slate-700 dark:text-indigo-200 font-semibold flex items-center gap-1">
                <span>📅</span>
                <span className="hidden sm:inline">ข้อมูลวันที่:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-indigo-500/30 hover:border-indigo-400 rounded-lg px-2 py-0.5 text-slate-900 dark:text-white font-bold font-mono text-xs focus:outline-none cursor-pointer"
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
              onClick={handleCreateTeam}
              className="flex items-center gap-1.5 rounded-xl border border-sky-400 bg-sky-600 hover:bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm cursor-pointer whitespace-nowrap"
              title="สร้างทีมปราสาทใหม่"
            >
              <span className="text-white font-extrabold text-sm">+</span>
              <span>สร้างทีมใหม่</span>
            </button>

            <button
              type="button"
              onClick={() => handleAddParty()}
              className="flex items-center gap-1.5 rounded-xl border border-sky-300 dark:border-sky-500/40 bg-sky-50 dark:bg-sky-600/25 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-600/40 transition cursor-pointer whitespace-nowrap"
            >
              <span>➕</span>
              <span>เพิ่มปาร์ตี้</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportImageModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm cursor-pointer whitespace-nowrap"
              title="ส่งออกรูปภาพผังทัพปราสาท (PNG)"
            >
              <span>📸</span>
              <span>ส่งออกรูป</span>
            </button>

            <button
              type="button"
              onClick={saveToCloud}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-400 dark:border-indigo-500/50 bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <span>💾</span>
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก Cloud'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 15 Job Class Emblem Bar */}
      <JobEmblemBar
        selectedJob={selectedFamily}
        onSelectJob={setSelectedFamily}
        counts={countsByFamily}
        totalCount={unassignedCount}
      />

      {/* Main Grid: Left Member Pool + Right Tactical Teams */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-3 lg:sticky lg:top-20 space-y-4">
          <MemberPool
            members={members}
            assignedMemberIds={assignedMemberIds}
            selectedMemberId={selectedMemberId}
            selectedFamily={selectedFamily}
            onSelectMember={(mId) => {
              if (selectedSlot) {
                setSiegeParties((prev) => {
                  const cleaned = prev.map((p) => ({
                    ...p,
                    slots: (p.slots || [null, null, null, null, null]).map((id) => (id === mId ? null : id)),
                  }));
                  return cleaned.map((p) => {
                    if (p.id !== selectedSlot.partyId) return p;
                    const slots = [...(p.slots || [null, null, null, null, null])];
                    slots[selectedSlot.slotIndex] = mId;
                    return { ...p, slots };
                  });
                });
                setSelectedSlot(null);
              } else {
                setSelectedMemberId(mId === selectedMemberId ? null : mId);
              }
            }}
          />
          <DonateCard />
        </div>

        {/* Right: Teams encompassing parties */}
        <div className="lg:col-span-9 space-y-6">
          {effectiveTeams.map((team) => {
            const teamParties = siegeParties.filter((p) => {
              if (effectiveTeams.length <= 1) return true;
              if (p.teamId === team.id) return true;
              const isKnown = effectiveTeams.some((t) => t.id === p.teamId);
              if (!isKnown && team.id === effectiveTeams[0].id) return true;
              return false;
            });
            return (
              <TeamSection
                key={team.id}
                team={team}
                parties={teamParties}
                members={members}
                allTeams={effectiveTeams}
                selectedSlot={selectedSlot}
                showLane={false}
                onSlotClick={handleSlotClick}
                onRemoveMember={handleRemoveMember}
                onClearParty={handleClearParty}
                onDeleteParty={handleDeleteParty}
                onRenameParty={handleRenameParty}
                onChangeTeam={handleChangeTeam}
                onImportPreset={(pId) => setImportPresetPartyId(pId)}
                onRenameTeam={handleRenameTeam}
                onAddParty={handleAddParty}
                onRenumberParties={handleRenumberParties}
                onDeleteTeam={handleDeleteTeam}
                onDropMemberToSlot={handleDropMemberToSlot}
              />
            );
          })}
        </div>
      </div>

      {/* Export Lineup PNG Modal */}
      <ExportImageModal
        isOpen={isExportImageModalOpen}
        onClose={() => setIsExportImageModalOpen(false)}
        mode="siege"
      />

      {/* Import Preset Squad Modal */}
      <ImportPresetModal
        isOpen={!!importPresetPartyId}
        onClose={() => setImportPresetPartyId(null)}
        targetParty={siegeParties.find((p) => p.id === importPresetPartyId) || null}
        presetParties={presetParties}
        members={members}
        onConfirm={(presetPartyId) => {
          if (!importPresetPartyId) return;
          applyPresetToParty('siege', importPresetPartyId, presetPartyId);
          setImportPresetPartyId(null);
        }}
      />
    </div>
  );
}
