'use client';

import React, { useState, useMemo } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import MemberPool from '@/components/tactical/MemberPool';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import { PartyCard } from '@/components/tactical/PartyCard';
import ExportImageModal from '@/components/modals/ExportImageModal';
import { Party } from '@/types/party';
import { JOB_LOOKUP } from '@/constants/jobs';

export default function SiegePage() {
  const {
    guildName,
    members,
    siegeParties,
    setSiegeParties,
    selectedDate,
    setSelectedDate,
    isLoading,
    isSaving,
    loadFromCloud,
    saveToCloud,
  } = useGuildStore();

  const [selectedSlot, setSelectedSlot] = useState<{ partyId: string; slotIndex: number } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [isExportImageModalOpen, setIsExportImageModalOpen] = useState(false);

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

  const handleAddParty = () => {
    const newIdx = siegeParties.length + 1;
    const newParty: Party = {
      id: `siege_p_${Date.now()}`,
      name: `ปาร์ตี้ ${newIdx}`,
      teamId: 'siege_main',
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

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-[#0d121f]/95 p-4 sm:p-5 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-xl border border-sky-500/30">
            🏰
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              ศึกชิงปราสาท (Siege War) — {guildName}
            </h1>
            <p className="text-xs text-slate-400">
              จัดทัพป้องกันและบุกยึดปราสาท • {siegeParties.length} ปาร์ตี้
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date & Member Stats (Top Banner right section) */}
          <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <span className="text-indigo-200 font-semibold text-xs flex items-center gap-1">
              <span>📅</span>
              <span>ข้อมูลวันที่:</span>
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900/90 border border-indigo-500/40 hover:border-indigo-400 rounded-lg px-2 py-0.5 text-white font-bold mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer shadow-inner"
            />
            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow transition active:scale-95 cursor-pointer"
              title="กลับมาวันนี้"
            >
              วันนี้
            </button>
          </div>

          <AutoSaveBadge />

          <button
            type="button"
            onClick={handleAddParty}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-600/25 px-3.5 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-600/40 hover:text-white transition"
          >
            <span>➕</span>
            <span>เพิ่มปาร์ตี้</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportImageModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/70 px-3.5 py-1.5 text-xs font-semibold text-sky-200 transition shadow-sm cursor-pointer"
            title="ส่งออกรูปภาพผังทัพปราสาท (PNG)"
          >
            <span>📸</span>
            <span>ส่งออกรูปผังทัพ</span>
          </button>

          <button
            type="button"
            onClick={saveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 px-4 py-1.5 text-xs font-bold text-indigo-100 hover:bg-indigo-600/50 hover:text-white transition shadow-sm"
          >
            <span>💾</span>
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกขึ้น Cloud'}</span>
          </button>
        </div>
      </div>

      {/* 15 Job Class Emblem Bar (Matching Image 2) */}
      <JobEmblemBar
        selectedJob={selectedFamily}
        onSelectJob={setSelectedFamily}
        counts={countsByFamily}
        totalCount={unassignedCount}
      />

      {/* Main Grid: Left Member Pool + Right Parties */}
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
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {siegeParties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                teamName="ทัพปราสาท"
                members={members}
                showLane={false}
                selectedSlot={selectedSlot}
                onSlotClick={(slotIdx, currentMemberId) =>
                  handleSlotClick(party.id, slotIdx, currentMemberId)
                }
                onRemoveMember={(slotIdx) => handleRemoveMember(party.id, slotIdx)}
                onClearParty={() => handleClearParty(party.id)}
                onDeleteParty={() => handleDeleteParty(party.id)}
                onRenameParty={() => handleRenameParty(party.id)}
                onDropMemberToSlot={(slotIdx, payload) => {
                  if (payload.fromPartyId !== undefined && payload.fromSlotIndex !== undefined) {
                    const fromPartyId = payload.fromPartyId;
                    const fromSlotIdx = payload.fromSlotIndex;
                    setSiegeParties((prev) => {
                      const fromParty = prev.find((p) => p.id === fromPartyId);
                      const toParty = prev.find((p) => p.id === party.id);
                      if (!fromParty || !toParty) return prev;
                      const fromMember = fromParty.slots?.[fromSlotIdx] || null;
                      const toMember = toParty.slots?.[slotIdx] || null;

                      return prev.map((p) => {
                        if (p.id === fromPartyId && p.id === party.id) {
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
                        if (p.id === party.id) {
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
                        if (p.id !== party.id) return p;
                        const slots = [...(p.slots || [null, null, null, null, null])];
                        slots[slotIdx] = payload.memberId;
                        return { ...p, slots };
                      });
                    });
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Export Lineup PNG Modal */}
      <ExportImageModal
        isOpen={isExportImageModalOpen}
        onClose={() => setIsExportImageModalOpen(false)}
        mode="siege"
      />
    </div>
  );
}
