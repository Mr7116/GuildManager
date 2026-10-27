'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface CreateRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRound: (
    name: string,
    date: string,
    note?: string,
    scheduledOpenAt?: string,
    scheduledCloseAt?: string
  ) => void;
}

export default function CreateRoundModal({
  isOpen,
  onClose,
  onCreateRound,
}: CreateRoundModalProps) {
  // Helper to get local date in YYYY-MM-DD (not UTC)
  const formatLocalDate = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to format Thai date from YYYY-MM-DD
  const formatThaiDate = (dateIsoStr: string) => {
    if (!dateIsoStr) return '';
    try {
      const [y, m, d] = dateIsoStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateIsoStr;
    }
  };

  const getLastDayOfWeek = (targetDay: number) => {
    // 0 = Sunday, 6 = Saturday
    const d = new Date();
    const currentDay = d.getDay();
    let diff = (currentDay - targetDay + 7) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() - diff);
    return formatLocalDate(d);
  };

  const initialDate = formatLocalDate(new Date());
  const [prefix, setPrefix] = useState<string>('รอบ GVG');
  const [date, setDate] = useState<string>(initialDate);
  const [name, setName] = useState<string>(`รอบ GVG ${formatThaiDate(initialDate)}`);
  const [note, setNote] = useState<string>('ดรอปจากกิลด์วอร์รอบหลัก');

  // Schedule timer state
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [openDate, setOpenDate] = useState<string>(initialDate);
  const [openTime, setOpenTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  });
  const [autoCloseDuration, setAutoCloseDuration] = useState<string>('none');

  if (!isOpen) return null;

  const handleDateChange = (newDateIso: string) => {
    setDate(newDateIso);
    setOpenDate(newDateIso);
    setName(`${prefix} ${formatThaiDate(newDateIso)}`);
  };

  const handleQuickPrefix = (newPrefix: string) => {
    setPrefix(newPrefix);
    setName(`${newPrefix} ${formatThaiDate(date)}`);
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
    setOpenDate(date);
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

  const getScheduledCloseIso = (openIso?: string): string | undefined => {
    if (!openIso || autoCloseDuration === 'none') return undefined;
    try {
      const mins = parseInt(autoCloseDuration, 10);
      const dt = new Date(new Date(openIso).getTime() + mins * 60 * 1000);
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
    if (!name.trim()) {
      alert('กรุณาระบุชื่อรอบการประมูล');
      return;
    }

    const openIso = getScheduledOpenIso();
    if (scheduleMode === 'scheduled' && openIso && new Date(openIso).getTime() <= Date.now()) {
      alert('เวลาที่ตั้งเปิดประมูลต้องเป็นเวลาในอนาคต กรุณาเลือกเวลาใหม่อีกครั้ง');
      return;
    }

    const closeIso = getScheduledCloseIso(openIso);
    onCreateRound(name.trim(), date, note.trim() || undefined, openIso, closeIso);
    onClose();
  };

  const yesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalDate(d);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xl border border-rose-500/40 text-amber-400">
              🎯
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                สร้างรอบการประมูลใหม่ (New Round)
              </h3>
              <p className="text-xs text-slate-400">
                เพิ่มรอบใหม่เพื่อจัดกลุ่มของดรอปและเก็บประวัติการสุ่มย้อนหลัง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เลือกประเภทชื่อรอบด่วน:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPrefix('รอบ GVG')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  prefix === 'รอบ GVG'
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                ⚔️ รอบ GVG
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrefix('รอบ Siege War')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  prefix === 'รอบ Siege War'
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                🏰 รอบ Siege War
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrefix('รอบศึกชิงปราสาท')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                  prefix === 'รอบศึกชิงปราสาท'
                    ? 'border-rose-500/60 bg-rose-500/20 text-rose-300'
                    : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                }`}
              >
                🛡️ รอบศึกชิงปราสาท
              </button>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                วันที่จัดรอบ:
              </label>
              <span className="text-[11px] font-mono text-amber-300">
                {formatThaiDate(date)}
              </span>
            </div>

            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                onClick={(e) => {
                  try {
                    e.currentTarget.showPicker();
                  } catch {}
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-medium text-white focus:border-rose-500 focus:outline-none cursor-pointer dark:[color-scheme:dark] transition hover:border-slate-600"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleDateChange(formatLocalDate(new Date()))}
                className="px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                📅 วันนี้
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(yesterdayDate())}
                className="px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                📅 เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(getLastDayOfWeek(0))}
                className="px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                📅 อาทิตย์ที่ผ่านมา
              </button>
              <button
                type="button"
                onClick={() => handleDateChange(getLastDayOfWeek(6))}
                className="px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition cursor-pointer"
              >
                📅 เสาร์ที่ผ่านมา
              </button>
            </div>
          </div>

          {/* Round Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อรอบการประมูล / วันที่: <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น รอบ GVG วันที่ 26 ต.ค. 2569"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              หมายเหตุ / แหล่งที่มา (Note):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ดรอปจากบ้านปราสาท 1 / หลังจบวอร์"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* ============================================================ */}
          {/* SCHEDULE TIMER SECTION (ตั้งเวลาเปิดประมูลอัตโนมัติ)         */}
          {/* ============================================================ */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span>⏰</span>
                <span>ตั้งเวลาเปิดรอบประมูล (Schedule Open)</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {scheduleMode === 'scheduled' ? 'เปิดตามเวลา' : 'เปิดทันที'}
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
                <span>เปิดทันทีหลังสร้าง</span>
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

                {/* Auto Close Setting (Optional) */}
                <div className="pt-1.5 border-t border-amber-500/20 flex items-center justify-between gap-2">
                  <label className="text-[11px] text-slate-400">ปิดรับรายชื่ออัตโนมัติ:</label>
                  <select
                    value={autoCloseDuration}
                    onChange={(e) => setAutoCloseDuration(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white cursor-pointer focus:outline-none"
                  >
                    <option value="none">ไม่ปิดอัตโนมัติ (ปิดเอง)</option>
                    <option value="15">ปิดหลังเปิด 15 นาที</option>
                    <option value="30">ปิดหลังเปิด 30 นาที</option>
                    <option value="60">ปิดหลังเปิด 1 ชั่วโมง</option>
                    <option value="120">ปิดหลังเปิด 2 ชั่วโมง</option>
                  </select>
                </div>

                {/* Status Preview Badge */}
                {minutesUntil !== null && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      minutesUntil > 0
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <span>{minutesUntil > 0 ? '⏰' : '⚠️'}</span>
                    <span>
                      {minutesUntil > 0
                        ? `จะเปิดรับรายชื่ออัตโนมัติในอีก ~${minutesUntil} นาที (${formatThaiDate(openDate)} เวลา ${openTime} น.)`
                        : 'เวลาที่เลือกผ่านไปแล้ว กรุณาเลือกเวลาในอนาคต'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
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
              className={`px-5 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg transition cursor-pointer flex items-center gap-1.5 ${
                scheduleMode === 'scheduled'
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-amber-950/40'
                  : 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-rose-950/40'
              }`}
            >
              <span>{scheduleMode === 'scheduled' ? '⏰' : '+'}</span>
              <span>
                {scheduleMode === 'scheduled'
                  ? `สร้างรอบและตั้งเวลาเปิด (${openTime} น.)`
                  : 'สร้างรอบใหม่และเริ่มใช้งาน'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
