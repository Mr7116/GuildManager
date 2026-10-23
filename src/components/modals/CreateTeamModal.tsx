'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FieldZoneKey } from '@/types/party';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextLetter: string;
  onCreateTeam: (teamName: string, field: FieldZoneKey) => void;
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  nextLetter,
  onCreateTeam,
}: CreateTeamModalProps) {
  const [mounted, setMounted] = useState(false);
  const [teamName, setTeamName] = useState(`ทีม ${nextLetter}`);
  const [selectedField, setSelectedField] = useState<FieldZoneKey>('main');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTeamName(`ทีม ${nextLetter}`);
      setSelectedField('main');
    }
  }, [isOpen, nextLetter]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = teamName.trim() || `ทีม ${nextLetter}`;
    onCreateTeam(finalName, selectedField);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0b101d] p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="text-purple-400 font-extrabold text-lg">+</span>
            <span>สร้างทีมใหม่เข้าสนามรบ</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <p className="font-medium text-slate-200">
              ตั้งชื่อทีมใหม่ และเลือกสนามรบ (สนามหลัก / สนามรอง):
            </p>
            <p className="text-slate-400 text-[11px]">
              ระบบจะสร้าง ปาร์ตี้ 1 ถึง ปาร์ตี้ 4 ให้ในทีมอัตโนมัติ:
            </p>
          </div>

          {/* Team Name Input */}
          <div>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder={`ทีม ${nextLetter}`}
              className="w-full rounded-xl border border-indigo-500/60 bg-[#070b14] px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition"
              autoFocus
            />
          </div>

          {/* Field Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              เลือกสนามประจำทีม (สนามหลัก / สนามรอง):
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* สนามหลัก */}
              <button
                type="button"
                onClick={() => setSelectedField('main')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition cursor-pointer ${
                  selectedField === 'main'
                    ? 'border-2 border-amber-400 bg-[#161d31] text-white shadow-md shadow-amber-500/10'
                    : 'border border-slate-800 bg-[#070b14] text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🏟️</span>
                <span>สนามหลัก</span>
              </button>

              {/* สนามรอง */}
              <button
                type="button"
                onClick={() => setSelectedField('sub')}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition cursor-pointer ${
                  selectedField === 'sub'
                    ? 'border-2 border-amber-400 bg-[#161d31] text-white shadow-md shadow-amber-500/10'
                    : 'border border-slate-800 bg-[#070b14] text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>🚩</span>
                <span>สนามรอง</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer transform hover:-translate-y-0.5"
            >
              สร้างทีม
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

