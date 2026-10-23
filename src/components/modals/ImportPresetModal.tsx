'use client';

import React, { useState, useEffect } from 'react';
import { Party } from '@/types/party';
import { Member } from '@/types/member';

interface ImportPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParty: Party | null;
  presetParties: Party[];
  members: Member[];
  onConfirm: (presetPartyId: string) => void;
}

export const ImportPresetModal: React.FC<ImportPresetModalProps> = ({
  isOpen,
  onClose,
  targetParty,
  presetParties,
  members,
  onConfirm,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  useEffect(() => {
    if (presetParties && presetParties.length > 0) {
      setSelectedPresetId(presetParties[0].id);
    }
  }, [presetParties, isOpen]);

  if (!isOpen || !targetParty) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPresetId) return;
    onConfirm(selectedPresetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
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
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            เลือกตี้ประจำที่ต้องการนำมาใส่ในปาร์ตี้นี้:
            {'\n'}
            (สมาชิก 5 ช่องในปาร์ตี้นี้จะถูกแทนที่ด้วยสมาชิกจากตี้ประจำที่เลือก)
          </p>

          <div className="space-y-1.5">
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
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {presetParties.map((p, idx) => {
                  const filledCount = (p.slots || []).filter(Boolean).length;
                  const memberNames = (p.slots || [])
                    .map((id) => {
                      const m = members.find((x) => x.id === id);
                      return m ? m.name : 'ว่าง';
                    })
                    .join(', ');
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name || `ตี้ประจำ ${idx + 1}`} ({filledCount}/5 คน) — [{memberNames}]
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
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
    </div>
  );
};

