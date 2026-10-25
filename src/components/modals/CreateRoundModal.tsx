'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface CreateRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRound: (name: string, date: string, note?: string) => void;
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

  if (!isOpen) return null;

  const handleDateChange = (newDateIso: string) => {
    setDate(newDateIso);
    setName(`${prefix} ${formatThaiDate(newDateIso)}`);
  };

  const handleQuickPrefix = (newPrefix: string) => {
    setPrefix(newPrefix);
    setName(`${newPrefix} ${formatThaiDate(date)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อรอบการประมูล');
      return;
    }
    onCreateRound(name.trim(), date, note.trim() || undefined);
    onClose();
  };

  const yesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatLocalDate(d);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/40 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-xs font-extrabold text-white shadow-lg shadow-rose-950/40 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span>
              <span>สร้างรอบใหม่และเริ่มใช้งาน</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
