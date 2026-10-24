'use client';

import React, { useState, useMemo } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import MemberPool from '@/components/tactical/MemberPool';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import DonateCard from '@/components/common/DonateCard';
import { PartyCard } from '@/components/tactical/PartyCard';
import { Party } from '@/types/party';
import { JOB_LOOKUP } from '@/constants/jobs';

export default function SquadsPage() {
  const {
    guildName,
    members,
    presetParties,
    setPresetParties,
    isLoading,
    isSaving,
    loadFromCloud,
    saveToCloud,
  } = useGuildStore();

  const [selectedSlot, setSelectedSlot] = useState<{ partyId: string; slotIndex: number } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const assignedMemberIds = useMemo(() => {
    const ids = new Set<string>();
    presetParties.forEach((p) => {
      p.slots?.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [presetParties]);

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

  const handleSlotClick = (partyId: string, slotIndex: number, currentMemberId: string | null) => {
    if (selectedMemberId) {
      setPresetParties((prev) => {
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
      setPresetParties((prev) => {
        const fromParty = prev.find((p) => p.id === selectedSlot.partyId);
        const toParty = prev.find((p) => p.id === partyId);
        if (!fromParty || !toParty) return prev;
        const fromMember = fromParty.slots?.[selectedSlot.slotIndex] || null;
        const toMember = toParty.slots?.[slotIndex] || null;

        return prev.map((p) => {
          if (p.id === selectedSlot.partyId && p.id === partyId) {
            const slots = [...(p.slots || [null, null, null, null, null])];
            slots[selectedSlot.slotIndex] = toMember;
            slots[slotIdx(slotIndex)] = fromMember;
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

  function slotIdx(idx: number) {
    return idx;
  }

  const handleRemoveMember = (partyId: string, slotIndex: number) => {
    setPresetParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        const slots = [...(p.slots || [null, null, null, null, null])];
        slots[slotIndex] = null;
        return { ...p, slots };
      })
    );
  };

  const handleClearParty = (partyId: string) => {
    setPresetParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, slots: [null, null, null, null, null] } : p))
    );
  };

  const handleAddParty = () => {
    const newIdx = presetParties.length + 1;
    const newParty: Party = {
      id: `preset_p_${Date.now()}`,
      name: `ตี้ประจำ ${newIdx}`,
      teamId: 'preset',
      slots: [null, null, null, null, null],
    };
    setPresetParties((prev) => [...prev, newParty]);
  };

  const handleDeleteParty = (partyId: string) => {
    setPresetParties((prev) => prev.filter((p) => p.id !== partyId));
  };

  const handleRenameParty = (partyId: string) => {
    const cur = presetParties.find((p) => p.id === partyId);
    const name = prompt('เปลี่ยนชื่อตี้ประจำ:', cur?.name);
    if (name && name.trim()) {
      setPresetParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, name: name.trim() } : p))
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f]/95 p-4 sm:p-5 shadow-md dark:shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-xl border border-purple-500/30">
            👥
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">
              ตี้ประจำ (Preset Squads) — {guildName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              แม่แบบปาร์ตี้หลักสำหรับซิงค์เข้าทุกโหมดการรบ (GVG, Siege, Polarity)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <AutoSaveBadge />

          <button
            type="button"
            onClick={handleAddParty}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            <span>➕</span>
            <span>เพิ่มตี้ประจำ</span>
          </button>

          <button
            type="button"
            onClick={saveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
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
                setPresetParties((prev) => {
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

        <div className="lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {presetParties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                teamName="ตี้ประจำ"
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
                    setPresetParties((prev) => {
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
                    setPresetParties((prev) => {
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
    </div>
  );
}
