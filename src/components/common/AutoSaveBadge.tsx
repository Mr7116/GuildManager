'use client';

import React from 'react';
import { useGuildStore } from '@/lib/guildStore';

export default function AutoSaveBadge({ className = '' }: { className?: string }) {
  const { saveStatus, lastSavedAt, isSaving } = useGuildStore();

  if (isSaving || saveStatus === 'saving') {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm animate-pulse ${className}`}>
        <span>💾</span>
        <span>กำลังบันทึกอัตโนมัติ...</span>
      </div>
    );
  }

  if (saveStatus === 'pending') {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-sm animate-pulse ${className}`}>
        <span>⏳</span>
        <span>รอเซฟอัตโนมัติ...</span>
      </div>
    );
  }

  if (saveStatus === 'error') {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-sm ${className}`}>
        <span>⚠️</span>
        <span>บันทึกไม่สำเร็จ</span>
      </div>
    );
  }

  if (lastSavedAt) {
    return (
      <div className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm ${className}`}>
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>🟢 บันทึก Auto แล้ว ({lastSavedAt})</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-400 ${className}`}>
      <span>☁️</span>
      <span>บันทึก Database อัตโนมัติ</span>
    </div>
  );
}

