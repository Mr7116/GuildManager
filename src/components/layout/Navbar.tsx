'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AdminNavActions from './AdminNavActions';
import ThemeToggle from './ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'GVG ทัพหลัก', href: '/gvg', icon: '⚔️' },
  { label: 'Siege ปราสาท', href: '/siege', icon: '🏰' },
  { label: 'Polarity สงครามดาว', href: '/polarity', icon: '✨' },
  { label: 'ตี้ประจำ (Squads)', href: '/squads', icon: '👥' },
  { label: 'จัดการสมาชิก', href: '/roster', icon: '🛡️' },
  { label: 'กิจกรรมประจำสัปดาห์', href: '/events', icon: '📅' },
  { label: 'ประมูลไอเทม', href: '/auction', icon: '💎' },
  { label: 'จัดการคิว', href: '/queue', icon: '📋' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Hide navbar on standalone viewer pages
  if (
    pathname === '/login' ||
    pathname === '/public' ||
    pathname === '/leave' ||
    pathname === '/auctions' ||
    pathname === '/auction/join' ||
    pathname === '/queues' ||
    pathname === '/queue/join'
  ) {
    return null;
  }

  const currentItem = navItems.find(
    (item) => pathname === item.href || (item.href === '/gvg' && pathname === '/')
  ) || navItems[0];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-[1700px] px-3 sm:px-6">
        
        {/* ============================================================ */}
        {/* MOBILE VIEW (< lg): Compact 1-Row Header (~48px height)      */}
        {/* ============================================================ */}
        <div className="flex lg:hidden items-center justify-between h-12 gap-2">
          {/* Left: Brand Logo & Current Page Pill */}
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/gvg" className="flex items-center gap-1.5 shrink-0">
              <span className="text-base font-black tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                TUMDOOD
              </span>
            </Link>

            {/* Tap to Toggle Page Pill */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 text-[11px] font-bold text-indigo-700 dark:text-indigo-200 truncate max-w-[160px] active:scale-95 transition cursor-pointer"
              title="แตะเพื่อเลือกหน้าเมนูอื่น"
            >
              <span>{currentItem.icon}</span>
              <span className="truncate">{currentItem.label}</span>
              <span className="text-[9px] opacity-60 ml-0.5">▼</span>
            </button>
          </div>

          {/* Right: Theme Toggle & Hamburger Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                mobileMenuOpen
                  ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700/60 text-rose-600 dark:text-rose-300'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              aria-label="เมนูหลัก"
            >
              <span>{mobileMenuOpen ? '✕' : '☰'}</span>
              <span>{mobileMenuOpen ? 'ปิด' : 'เมนู'}</span>
            </button>
          </div>
        </div>

        {/* MOBILE COLLAPSIBLE DRAWER / DROPDOWN */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 space-y-3 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* 8 Navigation Pages Grid */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                📌 หน้าทั้งหมด (All Pages)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/gvg' && pathname === '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40'
                      }`}
                    >
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Mobile Admin Tools or Login */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              {isAuthenticated ? (
                <AdminNavActions layout="mobile" onActionClick={() => setMobileMenuOpen(false)} />
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-2 text-xs font-bold text-white shadow-md transition"
                >
                  <span>🔑 เข้าสู่ระบบผู้ดูแล (Admin Login)</span>
                </Link>
              )}
            </div>

            {/* Mobile Dev Credits */}
            <div className="text-center pt-1 text-[11px] font-mono text-slate-800 dark:text-slate-400">
              Dev By : Mr7116,xZeNox
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* DESKTOP VIEW (>= lg): Full Two-Row Layout                    */}
        {/* ============================================================ */}
        <div className="hidden lg:block py-2">
          {/* Row 1: Brand & Admin Tools */}
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800/60">
            {/* Guild Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/gvg" className="flex items-center gap-2 transition hover:opacity-90">
                <span className="text-lg font-black tracking-wider bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                  TUMDOOD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                  Guild Manager
                </span>
              </Link>
            </div>

            {/* Quick action / Theme Toggle / Auth */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAuthenticated ? (
                <AdminNavActions layout="desktop" />
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-200 transition"
                >
                  <span>🔑</span>
                  <span>เข้าสู่ระบบ</span>
                </Link>
              )}
            </div>
          </div>

          {/* Row 2: Navigation Tabs & Dev Credits */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <nav className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href === '/gvg' && pathname === '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-500/15 dark:bg-indigo-600/30 border border-indigo-400 dark:border-indigo-500/50 text-indigo-700 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Dev Credits */}
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-mono shadow-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">Dev By :</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Mr7116,xZeNox</span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
