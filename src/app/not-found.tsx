'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-500/10 border-2 border-indigo-500/30 text-5xl shadow-2xl shadow-indigo-950/50">
        🔍
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-wider">
          404
        </h1>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-200">
          ไม่พบคิวรหัสนี้ หรือคิวอาจถูกปิดไปแล้ว
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          รหัสคิวที่คุณเข้าถึงไม่มีอยู่ในระบบ หรือผู้ดูแลได้ปิดรับคิวนี้ไปแล้ว กรุณาตรวจสอบลิงก์อีกครั้ง
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-950/40 transition active:scale-95 cursor-pointer"
        >
          <span>🏠</span>
          <span>กลับสู่หน้าหลัก</span>
        </Link>
      </div>
    </div>
  );
}
