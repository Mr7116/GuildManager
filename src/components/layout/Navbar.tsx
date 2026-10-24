'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import AdminNavActions from './AdminNavActions';

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
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();

  // Hide navbar on login, public viewer, and leave request pages
  if (pathname === '/login' || pathname === '/public' || pathname === '/leave') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Guild Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/gvg" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-wide text-white">
                TUMDOOD
              </span>           
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none mx-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/gvg' && pathname === '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/25 border border-indigo-500/40 text-white font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quick action / Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <AdminNavActions />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3 py-1.5 text-xs font-bold text-indigo-200 transition"
            >
              <span>🔑</span>
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
