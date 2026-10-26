'use client';

import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  className?: string;
  showDayOfWeek?: boolean;
  variant?: 'badge' | 'compact' | 'pill';
}

export default function LiveClock({
  className = '',
  showDayOfWeek = true,
  variant = 'badge',
}: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    // Skeleton placeholder to prevent Next.js SSR hydration mismatch
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 animate-pulse ${className}`}
      >
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700" />
        <span>กำลังโหลดเวลา...</span>
      </div>
    );
  }

  // Thai Day of week
  const thaiDays = [
    'วันอาทิตย์',
    'วันจันทร์',
    'วันอังคาร',
    'วันพุธ',
    'วันพฤหัสบดี',
    'วันศุกร์',
    'วันเสาร์',
  ];
  const dayName = thaiDays[now.getDay()];

  // Date formatted in Thai: วันที่ เดือน ปี พ.ศ.
  const dateStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Time formatted in Thai: HH:mm:ss น.
  const timeStr =
    now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' น.';

  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#070b14] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-slate-800 dark:text-white">{dateStr}</span>
        <span className="text-slate-400 dark:text-slate-600">•</span>
        <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
          {timeStr}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700/90 bg-white/95 dark:bg-gradient-to-r dark:from-[#0b101c] dark:to-[#0f172a] px-3.5 py-1.5 shadow-sm dark:shadow-md transition-all ${className}`}
      title="วัน เดือน ปี และเวลาปัจจุบัน (อัปเดตแบบเรียลไทม์วินาทีต่อวินาที)"
    >
      {/* Live Pulsing Indicator */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>

      {/* Date Part */}
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
        <span className="text-sm">📅</span>
        <span>
          {showDayOfWeek && <span className="text-slate-600 dark:text-slate-400 font-semibold mr-1">{dayName}</span>}
          <span className="font-extrabold text-slate-900 dark:text-white">{dateStr}</span>
        </span>
      </div>

      {/* Divider */}
      <span className="text-slate-300 dark:text-slate-700 font-light">|</span>

      {/* Time Part (Monospace ticking) */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-sm">🕒</span>
        <span className="font-mono text-[13px] font-black tracking-wider text-amber-600 dark:text-amber-400 drop-shadow-sm">
          {timeStr}
        </span>
      </div>
    </div>
  );
}

