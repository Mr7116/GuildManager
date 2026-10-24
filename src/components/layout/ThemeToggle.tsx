'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-8 w-8 rounded-xl border border-slate-800 bg-slate-900/60 ${className}`} />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'เปลี่ยนเป็น Light Mode (ธีมสว่าง)' : 'เปลี่ยนเป็น Dark Mode (ธีมมืด)'}
      aria-label="Toggle theme"
      className={`group relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
        isDark
          ? 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-amber-400'
          : 'border-slate-200 bg-slate-100 hover:bg-slate-200 text-amber-600 shadow-sm'
      } ${className}`}
    >
      <span className="text-sm transition-transform duration-300 group-hover:scale-115 group-active:scale-95">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

