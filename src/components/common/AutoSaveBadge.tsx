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
      <div className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Sync ({lastSavedAt})</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>Active</span>
    </div>
  );
}

