'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { QueueDungeonType, QueueList, generateQueueId } from '@/types/queue';
import { QUEUE_PRESETS, QueuePreset } from '@/constants/queuePresets';
import { useGuildStore } from '@/lib/guildStore';
import JobEmblem from '@/components/tactical/JobEmblem';

interface CreateQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<QueueList, 'createdAt' | 'entries'> & { id?: string }) => void;
}

export default function CreateQueueModal({ isOpen, onClose, onCreate }: CreateQueueModalProps) {
  const { members } = useGuildStore();

  const [selectedPresetId, setSelectedPresetId] = useState<QueueDungeonType>('vanished_95');
  const [customQueueId, setCustomQueueId] = useState<string>(() => generateQueueId('vanished_95'));
  const [isCustomIdEdited, setIsCustomIdEdited] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [maxPartySize, setMaxPartySize] = useState<number>(5);
  const [maxCapacity, setMaxCapacity] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');

  // Helper to format local date YYYY-MM-DD
  const formatLocalDate = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const initialDate = formatLocalDate(new Date());

  // Schedule timer states
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [openDate, setOpenDate] = useState<string>(initialDate);
  const [openTime, setOpenTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });

  // Pre-registered members state (รายชื่อลงชื่ออัตโนมัติล่วงหน้า)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const currentPreset = QUEUE_PRESETS.find((p) => p.id === selectedPresetId);

  // Filtered members for pre-register selection
  const filteredAvailableMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    const unselected = members.filter((m) => !selectedMemberIds.includes(m.id));
    if (!q) return unselected.slice(0, 15);
    return unselected.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchJob = m.job ? m.job.toLowerCase().includes(q) : false;
      return matchName || matchJob;
    }).slice(0, 20);
  }, [members, selectedMemberIds, memberSearch]);

  const selectedMembers = useMemo(() => {
    return selectedMemberIds
      .map((id) => members.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => !!m);
  }, [members, selectedMemberIds]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: QueuePreset) => {
    setSelectedPresetId(preset.id);
    setCustomTitle(preset.name);
    setMaxPartySize(preset.defaultPartySize || 5);
    if (!isCustomIdEdited) {
      setCustomQueueId(generateQueueId(preset.id));
    }
  };

  const handleRegenerateId = () => {
    setCustomQueueId(generateQueueId(selectedPresetId));
    setIsCustomIdEdited(false);
  };

  const handleAddMember = (mId: string) => {
    if (!selectedMemberIds.includes(mId)) {
      setSelectedMemberIds((prev) => [...prev, mId]);
    }
  };

  const handleRemoveMember = (mId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== mId));
  };

  const handleQuickAddMinutes = (mins: number) => {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + mins);
    const h = String(dt.getHours()).padStart(2, '0');
    const m = String(dt.getMinutes()).padStart(2, '0');
    setOpenTime(`${h}:${m}`);
    setOpenDate(formatLocalDate(dt));
    setScheduleMode('scheduled');
  };

  const handleQuickSetHour = (hour: number, minute: number = 0) => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    setOpenTime(`${h}:${m}`);
    setOpenDate(formatLocalDate(new Date()));
    setScheduleMode('scheduled');
  };

  const getScheduledOpenIso = (): string | undefined => {
    if (scheduleMode !== 'scheduled' || !openTime) return undefined;
    try {
      const [hours, minutes] = openTime.split(':').map(Number);
      const [year, month, day] = openDate.split('-').map(Number);
      const dt = new Date(year, month - 1, day, hours, minutes, 0, 0);
      return dt.toISOString();
    } catch {
      return undefined;
    }
  };

  const scheduledIso = getScheduledOpenIso();
  const minutesUntil = scheduledIso
    ? Math.round((new Date(scheduledIso).getTime() - Date.now()) / 60000)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCustom = selectedPresetId === 'custom';
    const finalTitle = customTitle.trim() || currentPreset?.name || 'รายการคิว';

    const openIso = getScheduledOpenIso();
    if (scheduleMode === 'scheduled' && openIso && new Date(openIso).getTime() <= Date.now()) {
      alert('เวลาที่ตั้งเปิดคิวต้องเป็นเวลาในอนาคต กรุณาเลือกเวลาใหม่อีกครั้ง');
      return;
    }

    onCreate({
      id: customQueueId.trim() || generateQueueId(selectedPresetId),
      title: finalTitle,
      dungeonType: selectedPresetId,
      dungeonCategory: currentPreset?.category || (isCustom ? 'custom' : 'vanished'),
      levelRequirement: currentPreset?.level,
      difficultyLabel: currentPreset?.difficulty,
      maxPartySize: maxPartySize > 0 ? maxPartySize : 5,
      maxCapacity: maxCapacity && maxCapacity > 0 ? maxCapacity : undefined,
      status: scheduleMode === 'scheduled' ? 'scheduled' : 'open',
      scheduledOpenAt: openIso,
      preRegisteredMemberIds: selectedMemberIds,
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
                เลือกดันเจี้ยน ตั้งเวลาเปิดอัตโนมัติ และเลือกลงชื่อสมาชิกล่วงหน้าได้
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

            {/* Queue URL ID / Slug (ใคร list มัน) */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3 sm:p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                  <span>🆔 รหัสประจำ List สำหรับใส่ URL (Queue URL ID):</span>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-900/40 hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-500/40 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="กดเพื่อสุ่มรหัส ID ใหม่"
                >
                  <span>🎲 สุ่มรหัสใหม่</span>
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={customQueueId}
                  onChange={(e) => {
                    const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
                    setCustomQueueId(cleaned);
                    setIsCustomIdEdited(true);
                  }}
                  placeholder="เช่น apo-nightmare-8a2 หรือ party-1"
                  className="w-full rounded-xl border border-indigo-500/40 bg-slate-950 px-3.5 py-2 font-mono text-sm text-indigo-300 placeholder-slate-600 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-0.5">
                <span>🔗 ลิงก์ตรงสำหรับส่งให้สมาชิก:</span>
                <span className="font-mono text-indigo-300 bg-slate-900/90 px-2 py-0.5 rounded-md border border-indigo-500/30 font-bold truncate max-w-full">
                  /queue/join?id={customQueueId || '...'}
                </span>
                <span className="text-slate-500 text-[10px]">(สมาชิกกดลิงก์นี้จะเปิดเฉพาะ List นี้ทันที)</span>
              </div>
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

          {/* ============================================================ */}
          {/* SECTION 4: SCHEDULE TIMER (ตั้งเวลาเปิดคิวอัตโนมัติ)          */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>⏰</span>
                <span>4. ตั้งเวลาเปิดคิว (Schedule Open)</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {scheduleMode === 'scheduled' ? 'เปิดตามเวลา' : 'เปิดรับคิวทันที'}
              </span>
            </div>

            {/* Toggle Mode */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleMode('immediate')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  scheduleMode === 'immediate'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡</span>
                <span>เปิดรับคิวทันที</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode('scheduled')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  scheduleMode === 'scheduled'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⏰</span>
                <span>ตั้งเวลาเปิดล่วงหน้า</span>
              </button>
            </div>

            {/* Scheduled Time Inputs */}
            {scheduleMode === 'scheduled' && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      วันที่เปิด:
                    </label>
                    <input
                      type="date"
                      value={openDate}
                      onChange={(e) => setOpenDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      เวลาที่เปิด (น.):
                    </label>
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Time Buttons */}
                <div>
                  <span className="block text-[10px] text-slate-400 mb-1">ตั้งเวลาด่วน:</span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAddMinutes(15)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-amber-300 cursor-pointer"
                    >
                      +15 นาที
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddMinutes(30)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-amber-300 cursor-pointer"
                    >
                      +30 นาที
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAddMinutes(60)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-amber-300 cursor-pointer"
                    >
                      +1 ชม.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetHour(20, 0)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                    >
                      20:00 น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetHour(21, 0)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                    >
                      21:00 น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetHour(21, 30)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                    >
                      21:30 น.
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickSetHour(22, 0)}
                      className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
                    >
                      22:00 น.
                    </button>
                  </div>
                </div>

                {/* Live Countdown Badge */}
                {minutesUntil !== null && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-xs font-bold text-amber-300 flex items-center gap-2">
                    <span className="text-sm">⏰</span>
                    <span>
                      {minutesUntil > 0
                        ? `จะเปิดรับคิวอัตโนมัติในอีก ~${minutesUntil} นาที (${openDate} เวลา ${openTime} น.)`
                        : minutesUntil === 0
                        ? 'กำลังจะเปิดในอีกไม่กี่วินาทีนี้'
                        : `เวลาที่เลือกผ่านไปแล้ว (${Math.abs(minutesUntil)} นาทีที่แล้ว)`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* SECTION 5: PRE-REGISTERED MEMBERS (ลงชื่ออัตโนมัติเมื่อเปิด)  */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <span>👥</span>
                <span>5. รายชื่อลงชื่ออัตโนมัติล่วงหน้า (Pre-registered Members)</span>
              </span>
              <span className="text-[11px] text-indigo-400 font-mono font-bold">
                เลือกแล้ว: {selectedMemberIds.length} คน
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              สมาชิกที่เลือกไว้จะถูกลงชื่อเข้าคิวให้โดยอัตโนมัติทันทีเมื่อคิวเปิดใช้งาน (ลำดับตามที่จัดไว้)
            </p>

            {/* Selected Members Chips */}
            {selectedMembers.length > 0 && (
              <div className="space-y-1.5 p-2 rounded-xl border border-indigo-500/40 bg-slate-950/70">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span className="font-semibold text-indigo-300">
                    ลำดับคิวที่จะได้อัตโนมัติ:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMemberIds([])}
                    className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {selectedMembers.map((m, idx) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-500/60 bg-indigo-950/70 text-white text-xs font-bold shadow-sm"
                    >
                      <span className="text-[10px] font-mono text-amber-300">#{idx + 1}</span>
                      <JobEmblem job={m.job} size={14} />
                      <span>{m.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.id)}
                        className="text-slate-400 hover:text-rose-400 text-xs ml-0.5 cursor-pointer font-bold"
                        title="เอาออก"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member Search & Quick Selection */}
            <div className="space-y-2">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="🔍 ค้นหาชื่อสมาชิกหรืออาชีพเพื่อเลือกลงชื่อ..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />

              {filteredAvailableMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                  {filteredAvailableMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleAddMember(m.id)}
                      className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 hover:border-indigo-500 hover:bg-indigo-950/50 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>+</span>
                      <JobEmblem job={m.job} size={13} />
                      <span className="font-semibold">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
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
              className={`px-6 py-2 rounded-xl text-xs font-black text-white shadow-lg flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                scheduleMode === 'scheduled'
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-amber-950/50'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-indigo-950/50'
              }`}
            >
              <span>{scheduleMode === 'scheduled' ? '⏰' : '+'}</span>
              <span>
                {scheduleMode === 'scheduled'
                  ? `สร้างและตั้งเวลาเปิด (${openTime} น.)`
                  : 'สร้าง List คิวนี้เลย'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
