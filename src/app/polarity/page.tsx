'use client';

import React, { useState, useMemo } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import MemberPool from '@/components/tactical/MemberPool';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import DonateCard from '@/components/common/DonateCard';
import { PartyCard } from '@/components/tactical/PartyCard';
import ExportImageModal from '@/components/modals/ExportImageModal';
import { ImportPresetModal } from '@/components/modals/ImportPresetModal';
import { Party } from '@/types/party';
import { JOB_LOOKUP } from '@/constants/jobs';

export default function PolarityPage() {
  const {
    guildName,
    members,
    polarityParties,
    setPolarityParties,
    presetParties,
    applyPresetToParty,
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
  const [importPresetPartyId, setImportPresetPartyId] = useState<string | null>(null);

  // Assigned members in Polarity
  const assignedMemberIds = useMemo(() => {
    const ids = new Set<string>();
    polarityParties.forEach((p) => {
      p.slots?.forEach((id) => {
        if (id) ids.add(id);
      });
    });
    return ids;
  }, [polarityParties]);

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
      setPolarityParties((prev) => {
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
      setPolarityParties((prev) => {
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
    setPolarityParties((prev) =>
      prev.map((p) => {
        if (p.id !== partyId) return p;
        const slots = [...(p.slots || [null, null, null, null, null])];
        slots[slotIndex] = null;
        return { ...p, slots };
      })
    );
  };

  const handleClearParty = (partyId: string) => {
    setPolarityParties((prev) =>
      prev.map((p) => (p.id === partyId ? { ...p, slots: [null, null, null, null, null] } : p))
    );
  };

  const handleAddParty = () => {
    const newIdx = polarityParties.length + 1;
    const newParty: Party = {
      id: `pol_p_${Date.now()}`,
      name: `ปาร์ตี้ ${newIdx}`,
      teamId: 'pol_main',
      slots: [null, null, null, null, null],
    };
    setPolarityParties((prev) => [...prev, newParty]);
  };

  const handleDeleteParty = (partyId: string) => {
    setPolarityParties((prev) => prev.filter((p) => p.id !== partyId));
  };

  const handleRenameParty = (partyId: string) => {
    const cur = polarityParties.find((p) => p.id === partyId);
    const name = prompt('เปลี่ยนชื่อปาร์ตี้:', cur?.name);
    if (name && name.trim()) {
      setPolarityParties((prev) =>
        prev.map((p) => (p.id === partyId ? { ...p, name: name.trim() } : p))
      );
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d121f]/95 p-4 sm:p-5 shadow-md dark:shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl border border-amber-500/30">
            ✨
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">
              สงครามดาว (Polarity War) — {guildName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              จัดทัพปาร์ตี้ลงดันเจี้ยนสงครามขั้วพลัง • {polarityParties.length} ปาร์ตี้
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
              onClick={handleAddParty}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-600/25 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-600/40 transition cursor-pointer whitespace-nowrap"
            >
              <span>➕</span>
              <span>เพิ่มปาร์ตี้</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExportImageModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm cursor-pointer whitespace-nowrap"
              title="ส่งออกรูปภาพผังสงครามดาว (PNG)"
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
                setPolarityParties((prev) => {
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
            {polarityParties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                teamName="สงครามดาว"
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
                onImportPreset={() => setImportPresetPartyId(party.id)}
                onDropMemberToSlot={(slotIdx, payload) => {
                  if (payload.fromPartyId !== undefined && payload.fromSlotIndex !== undefined) {
                    const fromPartyId = payload.fromPartyId;
                    const fromSlotIdx = payload.fromSlotIndex;
                    setPolarityParties((prev) => {
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
                    setPolarityParties((prev) => {
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
        mode="polarity"
      />

      {/* Import Preset Squad Modal */}
      <ImportPresetModal
        isOpen={!!importPresetPartyId}
        onClose={() => setImportPresetPartyId(null)}
        targetParty={polarityParties.find((p) => p.id === importPresetPartyId) || null}
        presetParties={presetParties}
        members={members}
        onConfirm={(presetPartyId) => {
          if (importPresetPartyId) {
            applyPresetToParty('polarity', importPresetPartyId, presetPartyId);
          }
        }}
      />
    </div>
  );
}
