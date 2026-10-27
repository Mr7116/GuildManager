'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useGuildStore } from '@/lib/guildStore';
import { useAuth } from '@/lib/auth';
import JobEmblem from '@/components/tactical/JobEmblem';
import ThemeToggle from '@/components/layout/ThemeToggle';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import LiveClock from '@/components/common/LiveClock';
import { AuctionItem, AuctionRound, formatRegistrationTime, isTitleItem, isChestItem, isMultiEntryItem, getAuctionItemImageSrc } from '@/types/auction';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { getTitleTierStyle } from '@/constants/titleItems';
import { getChestTierStyle } from '@/constants/chestItems';
import { getPetTierStyle } from '@/constants/petItems';

interface MemberAuctionViewProps {
  onSwitchToAdmin?: () => void;
}

export default function MemberAuctionView({ onSwitchToAdmin }: MemberAuctionViewProps) {
  const {
    guildName,
    members,
    auctionRounds,
    auctionItems,
    addMemberToAuction,
    removeMemberFromAuction,
    removeOneMemberEntryFromAuction,
  } = useGuildStore();

  const { isAuthenticated } = useAuth();

  // Member selection
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [itemSearch, setItemSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'my' | 'all'>('active');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Restore saved member from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('TUMDOOD_auction_selected_member');
      if (saved && members.some((m) => m.id === saved)) {
        setSelectedMemberId(saved);
      }
    } catch {}
  }, [members]);

  // Handle member selection
  const handleSelectMember = (id: string) => {
    setSelectedMemberId(id);
    try {
      localStorage.setItem('TUMDOOD_auction_selected_member', id);
    } catch {}
  };

  // Selected member object
  const currentMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Current active round (or newest)
  const currentRound: AuctionRound | null = useMemo(() => {
    if (auctionRounds.length === 0) return null;
    return auctionRounds.find((r) => r.status === 'active' || r.status === 'scheduled') || auctionRounds[0];
  }, [auctionRounds]);

  // Live timer tick for scheduled countdown
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isRoundScheduled = Boolean(
    currentRound &&
    currentRound.status === 'scheduled' &&
    currentRound.scheduledOpenAt &&
    new Date(currentRound.scheduledOpenAt).getTime() > nowTick
  );

  const scheduledCountdownStr = useMemo(() => {
    if (!isRoundScheduled || !currentRound?.scheduledOpenAt) return '';
    const diff = new Date(currentRound.scheduledOpenAt).getTime() - nowTick;
    if (diff <= 0) return '00:00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) {
      return `${hours} ชม. ${String(minutes).padStart(2, '0')} นาที ${String(seconds).padStart(2, '0')} วิ`;
    }
    return `${String(minutes).padStart(2, '0')} นาที ${String(seconds).padStart(2, '0')} วิ`;
  }, [isRoundScheduled, currentRound, nowTick]);

  // Items for this round
  const roundItems: AuctionItem[] = useMemo(() => {
    if (!currentRound) return [];
    return auctionItems.filter((item) => {
      const rId = item.roundId || auctionRounds[0]?.id || 'round_default';
      return rId === currentRound.id;
    });
  }, [auctionItems, currentRound, auctionRounds]);

  // Open items (status === 'active')
  const activeItems = useMemo(() => {
    return roundItems.filter((item) => item.status === 'active');
  }, [roundItems]);

  // Items joined by selected member
  const myRegisteredItems = useMemo(() => {
    if (!selectedMemberId) return [];
    return roundItems.filter((item) =>
      (item.entries || []).some((e) => e.memberId === selectedMemberId)
    );
  }, [roundItems, selectedMemberId]);

  // Filtered items based on activeTab and search
  const displayItems = useMemo(() => {
    let list = roundItems;
    if (activeTab === 'active') {
      list = isRoundScheduled ? roundItems : activeItems;
    } else if (activeTab === 'my') {
      list = myRegisteredItems;
    }

    if (itemSearch.trim()) {
      const q = itemSearch.trim().toLowerCase();
      list = list.filter((item) => {
        const matchName = item.accessoryName.toLowerCase().includes(q);
        const matchSource = item.sourceNote?.toLowerCase().includes(q);
        return matchName || matchSource;
      });
    }

    return list;
  }, [roundItems, activeItems, myRegisteredItems, activeTab, itemSearch]);

  // Filtered members for member picker
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.job && m.job.toLowerCase().includes(q))
    );
  }, [members, memberSearch]);

  // Join item
  const handleJoin = (item: AuctionItem) => {
    if (isRoundScheduled) {
      alert(`รอบนี้ยังไม่ถึงเวลาเปิดรับรายชื่อ จะเปิดอัตโนมัติในอีก ${scheduledCountdownStr}`);
      return;
    }
    if (!currentMember) {
      alert('กรุณาเลือกชื่อของคุณด้านบนก่อน');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (item.status !== 'active') {
      alert('รายการนี้ยังไม่เปิดรับรายชื่อ หรือสุ่มเสร็จแล้ว');
      return;
    }
    if (item.maxEntries && item.maxEntries > 0 && (item.entries || []).length >= item.maxEntries) {
      alert('ขออภัย รายการนี้มีคนลงชื่อครบตามโควตาแล้ว');
      return;
    }

    const isTitle = isTitleItem(item);
    const isChest = isChestItem(item);
    const allowMultiple = isTitle || isChest;

    if (!allowMultiple) {
      const alreadyRegistered = (item.entries || []).some((e) => e.memberId === currentMember.id);
      if (alreadyRegistered) {
        alert('ไอเทมนี้สามารถลงชื่อได้เพียงคนละ 1 ครั้งเท่านั้น');
        return;
      }
    }

    addMemberToAuction(item.id, currentMember.id);
  };

  // Leave one entry (or all if only 1)
  const handleLeaveOne = (item: AuctionItem) => {
    if (!currentMember) return;
    removeOneMemberEntryFromAuction(item.id, currentMember.id);
  };

  // Leave item (all)
  const handleLeave = (item: AuctionItem) => {
    if (!currentMember) return;
    if (
      window.confirm(
        `คุณต้องการยกเลิกการลงชื่อทั้งหมดของ "${item.accessoryName}" ใช่หรือไม่?`
      )
    ) {
      removeMemberFromAuction(item.id, currentMember.id);
    }
  };

  return (
    <div suppressHydrationWarning className="mx-auto max-w-4xl px-3 py-4 sm:px-6 space-y-5 pb-16">
      {/* Top Bar / Header */}
      <div className="flex flex-col gap-3 rounded-3xl border border-rose-300 dark:border-rose-500/30 bg-white dark:bg-[#0d121f] p-4 sm:p-5 shadow-sm dark:shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/15 to-amber-500/20 text-2xl border border-rose-500/30 text-rose-500 dark:text-rose-400 shrink-0">
              💎
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <span>ลงชื่อลุ้นรับไอเทมประมูล</span>
                <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                  — {guildName}
                </span>
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                เลือกชื่อตัวละครของคุณ แล้วกดลงชื่อในไอเทมที่ต้องการลุ้นสุ่มวงล้อ (ไม่ต้อง Login)
              </p>
            </div>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex flex-col sm:items-end justify-center gap-2 shrink-0">
            {/* Row 1: Live Clock & Auto-Sync Status */}
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <LiveClock variant="compact" />
              <AutoSaveBadge />
            </div>

            {/* Row 2: Mode & Theme Controls */}
            <div className="flex items-center gap-2 sm:justify-end">
              {isAuthenticated ? (
                onSwitchToAdmin ? (
                  <button
                    type="button"
                    onClick={onSwitchToAdmin}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 transition cursor-pointer"
                  >
                    <span>👑</span>
                    <span>โหมดแอดมิน</span>
                  </button>
                ) : (
                  <Link
                    href="/auction"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-950/40 transition cursor-pointer"
                  >
                    <span>👑</span>
                    <span>โหมดแอดมิน</span>
                  </Link>
                )
              ) : (
                <Link
                  href="/login?redirect=/auction"
                  className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  <span>🔑</span>
                  <span>แอดมิน</span>
                </Link>
              )}

              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Current Round Banner */}
        {currentRound ? (
          <div suppressHydrationWarning className="mt-1 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div suppressHydrationWarning className="flex flex-wrap items-center gap-2">
              <span suppressHydrationWarning className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <span>🎯</span>
                <span suppressHydrationWarning>{currentRound.name}</span>
              </span>

              {isRoundScheduled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <span>⏰</span>
                  <span>รอเปิดรับรายชื่ออัตโนมัติ ({scheduledCountdownStr})</span>
                </span>
              ) : currentRound.status === 'active' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>กำลังเปิดให้สมาชิกลงชื่อ</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  🏆 รอบนี้จบการสุ่มแล้ว
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
              {currentRound.date && (
                <span>📅 วันที่: <strong className="text-slate-800 dark:text-slate-200">{currentRound.date}</strong></span>
              )}
              {currentRound.note && (
                <span>• 📝 {currentRound.note}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-1 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ ยังไม่มีรอบการประมูลเปิดอยู่ในขณะนี้ กรุณารอหัวหน้ากิลด์สร้างรอบใหม่
          </div>
        )}
      </div>

      {/* SCHEDULED COUNTDOWN BANNER (เมื่อรอบถูกตั้งเวลาเปิดล่วงหน้า) */}
      {isRoundScheduled && currentRound?.scheduledOpenAt && (
        <div className="p-3.5 sm:p-4 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl border border-amber-500/40 text-amber-500 dark:text-amber-300">
              ⏰
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-amber-900 dark:text-amber-200">
                รอบนี้ตั้งเวลาเปิดรับรายชื่อล่วงหน้า
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                กำหนดเปิดระบบเวลา{' '}
                <strong className="text-amber-700 dark:text-amber-300">
                  {new Date(currentRound.scheduledOpenAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </strong>{' '}
                (สมาชิกรอกดลงชื่อพร้อมกันเมื่อเวลานับถอยหลังสิ้นสุด)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">เหลือเวลา:</span>
            <div className="font-mono text-base sm:text-lg font-black px-3.5 py-1.5 rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/50 shadow-inner">
              {scheduledCountdownStr}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: MEMBER SELECTOR BOX */}
      <div className="rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d121f] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">
              1
            </span>
            <span>เลือกชื่อตัวละครของคุณ (Select Your Character):</span>
          </label>

          {currentMember && (
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId('');
                try {
                  localStorage.removeItem('TUMDOOD_auction_selected_member');
                } catch {}
              }}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              🔄 เปลี่ยนตัวละคร
            </button>
          )}
        </div>

        {currentMember ? (
          /* Selected Member Card View */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-sm shrink-0">
                <JobEmblem job={currentMember.job} size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {currentMember.name}
                  </span>
                  {currentMember.title && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      {currentMember.title}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>อาชีพ: <strong className="text-slate-800 dark:text-slate-200">{currentMember.job || '-'}</strong></span>
                  <span>•</span>
                  <span>Lv.{currentMember.lv || 1}</span>
                </div>
              </div>
            </div>

            {/* Registered summary pill */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-white dark:bg-slate-900/80 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-sm">
                ลงชื่อไว้ในรอบนี้: <strong className="font-mono text-sm">{myRegisteredItems.length}</strong> ชิ้น
              </div>
            </div>
          </div>
        ) : (
          /* Member Search & Dropdown Picker */
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="ค้นหาชื่อตัวละคร หรือ อาชีพของคุณ..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none"
              />

              <select
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- คลิกเลือกชื่อของคุณจากรายชื่อ --</option>
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.job || 'ไม่ระบุอาชีพ'}) — Lv.{m.lv || 1}
                  </option>
                ))}
              </select>
            </div>

            {memberSearch.trim() && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-44 overflow-y-auto p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 scrollbar-thin">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMember(m.id)}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/60 hover:bg-rose-500/10 text-left transition cursor-pointer"
                  >
                    <JobEmblem job={m.job} size={20} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {m.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: OPEN AUCTION ITEMS LIST */}
      <div className="space-y-3">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] shadow-sm">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>🟢 เปิดรับรายชื่ออยู่</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-black/30 font-mono">
                {activeItems.length}
              </span>
            </button>

            {currentMember && (
              <button
                type="button"
                onClick={() => setActiveTab('my')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'my'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>⭐ ชิ้นที่คุณลงชื่อไว้</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 dark:bg-black/30 font-mono">
                  {myRegisteredItems.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>ทั้งหมดในรอบ</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-black/30 font-mono">
                {roundItems.length}
              </span>
            </button>
          </div>

          {/* Search item */}
          <input
            type="text"
            placeholder="ค้นหาชื่อไอเทม..."
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none w-full sm:w-48"
          />
        </div>

        {/* Items List */}
        {displayItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-transparent p-10 text-center space-y-2">
            <span className="text-3xl">📦</span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">
              {activeTab === 'active'
                ? 'ยังไม่มีรายการที่เปิดรับรายชื่อในขณะนี้'
                : activeTab === 'my'
                ? 'คุณยังไม่ได้ลงชื่อในไอเทมชิ้นใด'
                : 'ไม่พบรายการไอเทม'}
            </h4>
            <p className="text-xs text-slate-500">
              {activeTab === 'active'
                ? 'กรุณารอแอดมินหรือหัวหน้ากิลด์กดเปิดรับรายชื่อไอเทม'
                : 'คลิกแท็บ "🟢 เปิดรับรายชื่ออยู่" เพื่อเลือกไอเทมที่คุณอยากได้'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item, index) => {
              const isOpen = item.status === 'active';
              const isEnded = item.status === 'ended';
              const isPending = item.status === 'pending';
              const entries = item.entries || [];
              const myEntries = selectedMemberId ? entries.filter((e) => e.memberId === selectedMemberId) : [];
              const myCount = myEntries.length;
              const isRegistered = myCount > 0;
              const myIndices = selectedMemberId
                ? entries.map((e, idx) => (e.memberId === selectedMemberId ? idx : -1)).filter((idx) => idx !== -1)
                : [];
              const isQuotaFull = !!(item.maxEntries && item.maxEntries > 0 && entries.length >= item.maxEntries);
              const isExpanded = expandedItemId === item.id;
              const isTitle = isTitleItem(item);
              const isChest = isChestItem(item);
              const allowMultiple = isTitle || isChest;
              const isPet = !isTitle && !isChest && (item.itemCategory === 'pet' || (item.cardSlot && item.cardSlot.includes('สัตว์เลี้ยง')) || (item.cardQuality && item.cardQuality.startsWith('Pet')));
              const isRelic = !isTitle && !isChest && !isPet && (item.itemCategory === 'relic' || item.cardQuality === 'Sage');
              const isCard = !isTitle && !isChest && !isPet && !isRelic && (item.itemCategory === 'card' || item.cardQuality === 'Purple');
              const titleTier = isTitle ? getTitleTierStyle(item.accessoryIcon || item.accessoryName || item.cardQuality) : null;
              const chestTier = isChest ? getChestTierStyle(item.accessoryName || item.cardQuality) : null;
              const petTier = isPet ? getPetTierStyle(item.accessoryName || item.cardQuality) : null;
              const imageSrc = getAuctionItemImageSrc(item);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-3.5 sm:p-4 transition shadow-sm ${
                    isRegistered
                      ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/15'
                      : isOpen
                      ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0d121f] hover:border-slate-400'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#0a0e18]/80 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Thumbnail & Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-400 w-5 shrink-0 text-right">
                        {index + 1}.
                      </span>

                      {/* Icon */}
                      <div className={`relative w-13 h-13 shrink-0 rounded-xl border flex items-center justify-center shadow-md ${
                        isTitle
                          ? `${titleTier?.border} ${titleTier?.bg}`
                          : isChest
                          ? `${chestTier?.border} ${chestTier?.bg}`
                          : isPet
                          ? `${petTier?.border} ${petTier?.bg}`
                          : isRelic
                          ? 'border-amber-500/50 bg-amber-950/20'
                          : isCard
                          ? 'border-purple-500/50 bg-purple-950/20'
                          : 'border-rose-500/40 bg-slate-100 dark:bg-[#080d19]'
                      }`}>
                        {item.accessoryIcon.includes('title_chest') ? (
                          <TitleChestSvgIcon
                            variant={chestTier?.tier || 'gold'}
                            className="w-10 h-10 drop-shadow"
                          />
                        ) : (
                          <Image
                            src={imageSrc}
                            alt={item.accessoryName}
                            width={44}
                            height={44}
                            unoptimized
                            className="object-contain drop-shadow"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              const icon = item.accessoryIcon || '';
                              if (icon.includes('title_chest')) {
                                target.src = `/images/chests/${icon}.svg`;
                                return;
                              }
                              if (isChest) {
                                target.src = `/images/chests/icon_item_bx_fy.webp`;
                                return;
                              }
                              if (isTitle) {
                                target.src = `/images/titles/${icon}.webp`;
                                return;
                              }
                              if (isPet) {
                                target.src = icon.includes('mfmm')
                                  ? `https://roworlddb.com/media/images/icon/pet/${icon}.webp`
                                  : `https://roworlddb.com/media/images/pet/${icon}.webp`;
                                return;
                              }
                              if (isRelic) {
                                target.src = `https://roworlddb.com/media/images/hallows/${icon}.webp`;
                                return;
                              }
                              target.src = `https://roworlddb.com/media/images/item/${icon}.webp`;
                            }}
                          />
                        )}
                        {isTitle ? (
                          <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${titleTier?.badgeBg}`}>
                            {titleTier?.tier === 'gold' ? 'ทอง' : titleTier?.tier === 'purple' ? 'ม่วง' : titleTier?.tier === 'blue' ? 'ฟ้า' : 'เขียว'}
                          </span>
                        ) : isChest ? (
                          <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${chestTier?.badgeBg}`}>
                            {chestTier?.tier === 'purple' ? 'ม่วง' : chestTier?.tier === 'blue' ? 'ฟ้า' : 'ทอง'}
                          </span>
                        ) : isPet ? (
                          <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${petTier?.badgeBg}`}>
                            {petTier?.tier === 'gold' ? 'SSR' : petTier?.tier === 'purple' ? 'SR' : petTier?.tier === 'blue' ? 'R' : 'N'}
                          </span>
                        ) : isRelic ? (
                          <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-amber-950/90 border border-amber-500/60 text-amber-200">
                            Sage
                          </span>
                        ) : isCard ? (
                          <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-purple-950/90 border border-purple-500/60 text-purple-200">
                            {item.cardSlot || 'MVP'}
                          </span>
                        ) : (
                          item.accessoryLevel && (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[8px] font-bold bg-black/90 border border-slate-700 text-amber-300 font-mono">
                              Lv.{item.accessoryLevel}
                            </span>
                          )
                        )}
                      </div>

                      {/* Name & Badges */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {item.accessoryName}
                          </h4>

                          {isTitle ? (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                              <TitleSvgIcon className="w-3 h-3" />
                              <span>{item.cardQuality || titleTier?.label}</span>
                            </span>
                          ) : isChest ? (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                              <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                              <span>{item.cardQuality || chestTier?.label}</span>
                            </span>
                          ) : isPet ? (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                              <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                              <span>{item.cardQuality || petTier?.label}</span>
                            </span>
                          ) : isRelic ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <RelicSvgIcon className="w-3 h-3" />
                              <span>Relic · {item.cardSlot || 'Sage'}</span>
                            </span>
                          ) : isCard ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                              🃏 MVP ม่วง · {item.cardSlot || 'การ์ด'}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                              Red Lv.90
                            </span>
                          )}

                          {/* Status */}
                          {isRoundScheduled ? (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <span>⏰</span>
                              <span>รอเปิดตามเวลา ({scheduledCountdownStr})</span>
                            </span>
                          ) : isOpen && (
                            isQuotaFull ? (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>{isTitle ? `🔒 ได้ผู้รับสิทธิ์ครบแล้ว (${entries.length}/${item.maxEntries})` : `🔒 เต็มโควตา (${entries.length}/${item.maxEntries})`}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{isTitle ? `⚡ เปิดรับสิทธิ์ ${item.maxEntries ? `(${entries.length}/${item.maxEntries})` : ''}` : `เปิดรับรายชื่อ ${item.maxEntries ? `(${entries.length}/${item.maxEntries})` : ''}`}</span>
                              </span>
                            )
                          )}
                          {isPending && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                              ⏳ ยังไม่เปิดรับ
                            </span>
                          )}
                          {isEnded && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40">
                              🏆 สรุปผลแล้ว
                            </span>
                          )}
                        </div>

                        {/* Note & Participant Count */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.sourceNote && (
                            <span>🏷️ {item.sourceNote}</span>
                          )}

                          {isEnded && item.winnerMemberName ? (
                            <div className="flex flex-wrap items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                              <span>ผู้ชนะ:</span>
                              {item.winners && item.winners.length > 1 ? (
                                <div className="flex flex-wrap items-center gap-1">
                                  {item.winners.map((w) => (
                                    <span key={w.memberId} className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                                      {w.memberJob && <JobEmblem job={w.memberJob} size={14} />}
                                      <span>{w.memberName}</span>
                                      <span className="text-amber-600 dark:text-amber-400 font-mono">x{w.count}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="flex items-center gap-1">
                                  {item.winnerMemberJob && (
                                    <JobEmblem job={item.winnerMemberJob} size={15} />
                                  )}
                                  <span>{item.winnerMemberName}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedItemId(isExpanded ? null : item.id)
                              }
                              className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>
                                {isTitle ? '👑 ผู้ได้รับสิทธิ์ ' : '👥 ผู้ลงชื่อ '}
                                {entries.length}
                                {item.maxEntries ? `/${item.maxEntries}` : ''} รายการ
                              </span>
                              {isTitle && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  (กดก่อนได้ก่อน)
                                </span>
                              )}
                              {isQuotaFull && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30">
                                  เต็ม
                                </span>
                              )}
                              <span className="text-[10px]">
                                {isExpanded ? '▲ ซ่อน' : '▼ ดูรายชื่อ'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {isRoundScheduled ? (
                        <div
                          className="px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 shadow-xs select-none"
                          title="รอบนี้ตั้งเวลาเปิดรับรายชื่อล่วงหน้า สมาชิกจะสามารถกดลงชื่อได้พร้อมกันเมื่อถึงเวลา"
                        >
                          <span className="animate-pulse">⏰</span>
                          <span>รอเปิดรับ ({scheduledCountdownStr})</span>
                        </div>
                      ) : isOpen ? (
                        isRegistered ? (
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1">
                              <span>{isTitle ? '👑' : isChest ? '📦' : '✅'}</span>
                              <span>
                                {allowMultiple
                                  ? isTitle
                                    ? `ได้สิทธิ์แล้ว x${myCount}`
                                    : `ลงชื่อแล้ว x${myCount}`
                                  : 'ลงชื่อแล้ว'}
                              </span>
                            </span>

                            {/* ปุ่มเพิ่มสิทธิ์: แสดงสำหรับ Title และ กล่อง/หีบ (Chest/Pack) เมื่อยังไม่เต็มโควตา */}
                            {allowMultiple && !isQuotaFull && (
                              <button
                                type="button"
                                onClick={() => handleJoin(item)}
                                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow transition cursor-pointer flex items-center gap-1 active:scale-95"
                                title={isTitle ? 'กดรับสิทธิ์เพิ่มอีก 1 รายการ' : 'กดลงชื่อเพิ่มอีก 1 สิทธิ์'}
                              >
                                <span>+</span>
                                <span>{isTitle ? 'รับสิทธิ์เพิ่ม (+1)' : 'ลงชื่อเพิ่ม (+1)'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => (allowMultiple && myCount > 1 ? handleLeaveOne(item) : handleLeave(item))}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition cursor-pointer"
                              title={allowMultiple && myCount > 1 ? 'ยกเลิกลด 1 ชิ้น' : 'ยกเลิกการลงชื่อ'}
                            >
                              {allowMultiple && myCount > 1 ? '✕ ลด 1 อัน' : '✕ ยกเลิก'}
                            </button>
                          </div>
                        ) : isQuotaFull ? (
                          <span className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1">
                            <span>🔒</span>
                            <span>{isTitle ? `ผู้รับสิทธิ์เต็มแล้ว (${entries.length}/${item.maxEntries})` : `เต็มโควตาแล้ว (${entries.length}/${item.maxEntries})`}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoin(item)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                          >
                            <span>+</span>
                            <span>
                              {isTitle ? 'กดรับสิทธิ์ Title นี้' : 'ลงชื่อลุ้นรับชิ้นนี้'}
                              {item.maxEntries ? ` (${entries.length}/${item.maxEntries})` : ''}
                            </span>
                          </button>
                        )
                      ) : isPending ? (
                        <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs font-semibold">
                          ⏳ รอเปิดสุ่ม
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs font-semibold">
                          🔒 ปิดรับแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Participant List */}
                  {isExpanded && entries.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                        <span>
                          {isTitle
                            ? `👑 รายชื่อผู้ได้รับสิทธิ์ Title ตามลำดับ (${entries.length}${item.maxEntries ? `/${item.maxEntries}` : ''} รายการ):`
                            : `รายชื่อสมาชิกที่ลงชื่อลุ้นชิ้นนี้ (${entries.length}${item.maxEntries ? `/${item.maxEntries}` : ''} รายการ):`}
                        </span>
                        {item.maxEntries && (
                          <span className="text-[10px] text-amber-500 font-semibold">
                            โควตาสูงสุด {item.maxEntries} รายการ (ใครกดก่อนได้ก่อน)
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entries.map((e, eIdx) => {
                          const isMe = e.memberId === selectedMemberId;
                          const regTime = formatRegistrationTime(e.registeredAt);
                          return (
                            <span
                              key={e.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                                isMe
                                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-bold ring-1 ring-emerald-500'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-300'
                              }`}
                            >
                              <span className="text-[10px] text-slate-400 font-mono font-bold">
                                #{eIdx + 1}
                              </span>
                              {e.memberJob && (
                                <JobEmblem job={e.memberJob} size={15} />
                              )}
                              <span>{e.memberName}</span>
                              {isMe && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  (คุณ)
                                </span>
                              )}
                              {isTitle && (
                                <span className="text-[10px] text-amber-500 font-bold">👑 ได้สิทธิ์</span>
                              )}
                              {regTime && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-0.5 ml-0.5">
                                  <span>🕒</span>
                                  <span>{regTime}</span>
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

