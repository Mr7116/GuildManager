'use client';

import React from 'react';
import { useGuildStore } from '@/lib/guildStore';

export default function AutoSaveBadge({ className = '' }: { className?: string }) {
  const { saveStatus, lastSavedAt, isSaving } = useGuildStore();

  if (isSaving || saveStatus === 'saving') {
    return (
      <div
        suppressHydrationWarning
        className={`flex items-center gap-1.5 rounded-xl border border-indigo-400/40 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-sm ${className}`}
      >
        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 shrink-0"></span>
        <span>กำลังบันทึก...</span>
      </div>
    );
  }

  if (saveStatus === 'error') {
    return (
      <div
        suppressHydrationWarning
        className={`flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 shadow-sm ${className}`}
      >
        <span>⚠️</span>
        <span>บันทึกไม่สำเร็จ</span>
      </div>
    );
  }

  // Calm, stable status badge (syncs every 10s without layout jumping)
  return (
    <div
      suppressHydrationWarning
      className={`flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm ${className}`}
      title="รีเฟรชข้อมูลอัตโนมัติทุกๆ 10 วินาที"
    >
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
      <span suppressHydrationWarning>
        {lastSavedAt ? `Sync (${lastSavedAt})` : 'Sync (10s)'}
      </span>
    </div>
  );
}

