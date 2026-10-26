'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QueueDungeonType, QueueList } from '@/types/queue';
import { QUEUE_PRESETS, QueuePreset } from '@/constants/queuePresets';

interface CreateQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<QueueList, 'id' | 'createdAt' | 'entries'>) => void;
}

export default function CreateQueueModal({ isOpen, onClose, onCreate }: CreateQueueModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<QueueDungeonType>('vanished_95');
  const [customTitle, setCustomTitle] = useState('');
  const [maxPartySize, setMaxPartySize] = useState<number>(5);
  const [maxCapacity, setMaxCapacity] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const currentPreset = QUEUE_PRESETS.find((p) => p.id === selectedPresetId);

  const handleSelectPreset = (preset: QueuePreset) => {
    setSelectedPresetId(preset.id);
    setCustomTitle(preset.name);
    setMaxPartySize(preset.defaultPartySize || 5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = selectedPresetId === 'custom';
    const finalTitle = customTitle.trim() || currentPreset?.name || 'รายการคิว';

    onCreate({
      title: finalTitle,
      dungeonType: selectedPresetId,
      dungeonCategory: currentPreset?.category || (isCustom ? 'custom' : 'vanished'),
      levelRequirement: currentPreset?.level,
      difficultyLabel: currentPreset?.difficulty,
      maxPartySize: maxPartySize > 0 ? maxPartySize : 5,
      maxCapacity: maxCapacity && maxCapacity > 0 ? maxCapacity : undefined,
      status: 'open',
      note: note.trim() || undefined,
    });

    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-indigo-500/30 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl border border-indigo-500/40 text-indigo-400">
              📋
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wide">
                สร้าง List จัดการคิวใหม่ (Create Queue List)
              </h3>
              <p className="text-xs text-slate-400">
                เลือกดันเจี้ยนที่ต้องการเปิดคิว เช่น มายาสิ้นสูญ หรือ Apocalypse ให้สมาชิกในกิลด์มากดต่อคิว
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Quick Dungeon Presets */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              1. เลือกประเภทดันเจี้ยน / กิจกรรม (Dungeon Presets):
            </label>

            <div className="space-y-3">
              {/* Category: มายาสิ้นสูญ */}
              <div>
                <span className="text-[11px] font-semibold text-purple-400 block mb-1.5">
                  🌀 ดันเจี้ยน มายาสิ้นสูญ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUEUE_PRESETS.filter((p) => p.category === 'vanished').map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500 shadow-md'
                            : 'border-slate-800 bg-[#090d18] hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-2xl shrink-0">{preset.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">{preset.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${preset.badgeBg} ${preset.badgeColor} border ${preset.badgeBorder}`}>
                              {preset.level}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category: Apocalypse */}
              <div>
                <span className="text-[11px] font-semibold text-rose-400 block mb-1.5">
                  ⚔️ มหันตภัยกิลด์ Apocalypse:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUEUE_PRESETS.filter((p) => p.category === 'apocalypse').map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500 shadow-md'
                            : 'border-slate-800 bg-[#090d18] hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-xl shrink-0">{preset.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-white truncate">{preset.name}</div>
                          <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${preset.badgeBg} ${preset.badgeColor} border ${preset.badgeBorder}`}>
                            {preset.difficulty}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Title & Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                2. ชื่อของคิวนี้ (Queue Title):
              </label>
              <input
                type="text"
                value={customTitle || currentPreset?.name || ''}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="เช่น มายาสิ้นสูญ Lv.95 (รอบ 20:30 น.)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Max Queue Capacity */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                <span>3. จำกัดจำนวนคนในคิวสูงสุด (Max Capacity):</span>
                <span className="text-amber-400 font-mono font-bold">
                  {maxCapacity ? `${maxCapacity} คน` : 'ไม่จำกัด'}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMaxCapacity(undefined)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    maxCapacity === undefined
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ไม่จำกัด
                </button>
                {[5, 10, 15, 20, 25].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setMaxCapacity(cap)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      maxCapacity === cap
                        ? 'bg-amber-600/30 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cap} คน
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  placeholder="ระบุเอง"
                  value={maxCapacity && ![5, 10, 15, 20, 25].includes(maxCapacity) ? maxCapacity : ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setMaxCapacity(isNaN(val) || val <= 0 ? undefined : val);
                  }}
                  className="w-20 text-center rounded-xl border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  title="ระบุจำนวนคนสูงสุด"
                />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                หมายเหตุ / ข้อความแจ้งสมาชิก (Note):
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ขอคนพร้อมเวลา 20:00 น. / เข้าดิสคอร์ดกิลด์ห้อง 2"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-xs font-black text-white shadow-lg shadow-indigo-950/50 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <span>+</span>
              <span>สร้าง List คิวนี้เลย</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

