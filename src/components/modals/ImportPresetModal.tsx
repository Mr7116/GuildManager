'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Party } from '@/types/party';
import { Member } from '@/types/member';
import JobEmblem from '@/components/tactical/JobEmblem';

interface ImportPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParty: Party | null;
  presetParties: Party[];
  currentParties?: Party[];
  members: Member[];
  onConfirm: (presetPartyId: string) => void;
}

export const ImportPresetModal: React.FC<ImportPresetModalProps> = ({
  isOpen,
  onClose,
  targetParty,
  presetParties,
  currentParties = [],
  members,
  onConfirm,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (presetParties && presetParties.length > 0) {
      setSelectedPresetId(presetParties[0].id);
    }
  }, [presetParties, isOpen]);

  // Check if a preset party is used in the current lineup
  const getPresetUsage = (preset: Party) => {
    if (!currentParties || currentParties.length === 0) return null;

    const presetMemberIds = (preset.slots || []).filter(Boolean) as string[];

    // 1. Direct match by presetId
    const partyWithPresetId = currentParties.find((p) => p.presetId === preset.id);
    if (partyWithPresetId) {
      return {
        partyName: partyWithPresetId.name,
        isCurrentTarget: targetParty?.id === partyWithPresetId.id,
      };
    }

    // 2. Member match (if preset has at least 1 member)
    if (presetMemberIds.length > 0) {
      for (const p of currentParties) {
        const pSlots = (p.slots || []).filter(Boolean) as string[];
        if (pSlots.length === 0) continue;

        // Check if all non-empty members of preset are present in this party
        const matchCount = presetMemberIds.filter((id) => pSlots.includes(id)).length;
        if (matchCount === presetMemberIds.length) {
          return {
            partyName: p.name,
            isCurrentTarget: targetParty?.id === p.id,
          };
        }
      }
    }

    return null;
  };

  const selectedPreset = useMemo(
    () => presetParties.find((p) => p.id === selectedPresetId) || null,
    [presetParties, selectedPresetId]
  );

  const selectedUsage = selectedPreset ? getPresetUsage(selectedPreset) : null;

  if (!isOpen || !targetParty || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPresetId) return;
    onConfirm(selectedPresetId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0d121f] p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <span>📥</span>
            <span>ดึงสมาชิกจาก &quot;ตี้ประจำ&quot;</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="font-semibold text-sky-300">ปาร์ตี้เป้าหมาย:</span> {targetParty.name}
            <div className="text-slate-400 text-[11px] mt-0.5">
              สมาชิก 5 ช่องในปาร์ตี้นี้จะถูกแทนที่ด้วยสมาชิกจากตี้ประจำที่เลือก
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              เลือกตี้ประจำ:
            </label>
            {presetParties.length === 0 ? (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                ยังไม่มีตี้ประจำในระบบ กรุณาไปที่เมนู &quot;จัดตี้ประจำ&quot; เพื่อสร้างตี้ก่อนครับ
              </p>
            ) : (
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
              >
                {presetParties.map((p, idx) => {
                  const usage = getPresetUsage(p);
                  const isUsed = !!usage;
                  const filledCount = (p.slots || []).filter(Boolean).length;
                  const memberNames = (p.slots || [])
                    .map((id) => {
                      const m = members.find((x) => x.id === id);
                      return m ? m.name : 'ว่าง';
                    })
                    .join(', ');

                  const prefix = isUsed ? '✅ ' : '';
                  const statusTag = isUsed
                    ? usage.isCurrentTarget
                      ? ' [✓ อยู่ในตี้ปัจจุบันนี้]'
                      : ` [✓ เคยเลือกแล้ว: ${usage.partyName}]`
                    : '';

                  return (
                    <option key={p.id} value={p.id}>
                      {prefix}{p.name || `ตี้ประจำ ${idx + 1}`} ({filledCount}/5 คน){statusTag} — [{memberNames}]
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Status Badge & Member Preview */}
          {selectedPreset && (
            <div className="space-y-2.5 pt-1">
              {/* Status info */}
              {selectedUsage ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <span>
                      {selectedUsage.isCurrentTarget
                        ? `ตี้ประจำนี้ถูกใส่ไว้ใน "${targetParty.name}" อยู่แล้ว`
                        : `ตี้ประจำนี้เคยถูกเลือกใช้แล้ว (อยู่ใน: ${selectedUsage.partyName})`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-400 text-xs">
                  <span className="text-slate-500 shrink-0">⚪</span>
                  <span>ยังไม่เคยถูกเลือกนำมาใช้ในผังทัพนี้</span>
                </div>
              )}

              {/* Members preview in selected preset */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>สมาชิกใน {selectedPreset.name}:</span>
                  <span className="text-emerald-400 font-mono">
                    {(selectedPreset.slots || []).filter(Boolean).length}/5 คน
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {(selectedPreset.slots || [null, null, null, null, null]).map((id, sIdx) => {
                    const m = id ? members.find((x) => x.id === id) : null;
                    return (
                      <div
                        key={sIdx}
                        className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-center min-h-[56px] ${
                          m
                            ? 'border-slate-700 bg-slate-900/80 text-white'
                            : 'border-dashed border-slate-800 bg-slate-950 text-slate-600'
                        }`}
                      >
                        {m ? (
                          <>
                            <JobEmblem job={m.job} size={22} />
                            <span className="text-[10px] font-bold truncate max-w-full mt-1">
                              {m.name}
                            </span>
                            <span className="text-[8px] text-slate-400 truncate max-w-full">
                              {m.job}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-600">ว่าง</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={presetParties.length === 0 || !selectedPresetId}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow shadow-indigo-500/30 cursor-pointer"
            >
              <span>📥</span>
              <span>นำเข้าตี้ประจำนี้</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
