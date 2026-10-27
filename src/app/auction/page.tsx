'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useGuildStore } from '@/lib/guildStore';
import MemberAuctionView from '@/components/auction/MemberAuctionView';
import { AuctionItem, AuctionRound, isTitleItem, isChestItem, getAuctionItemImageSrc } from '@/types/auction';
import AddAuctionModal from '@/components/modals/AddAuctionModal';
import RegisterMembersModal from '@/components/modals/RegisterMembersModal';
import LuckyWheelModal from '@/components/modals/LuckyWheelModal';
import CreateRoundModal from '@/components/modals/CreateRoundModal';
import RoundHistoryModal from '@/components/modals/RoundHistoryModal';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import LiveClock from '@/components/common/LiveClock';
import JobEmblem from '@/components/tactical/JobEmblem';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { getTitleTierStyle } from '@/constants/titleItems';
import { getChestTierStyle } from '@/constants/chestItems';
import { getPetTierStyle } from '@/constants/petItems';

export default function AuctionPage() {
  const {
    guildName,
    members,
    auctionItems,
    auctionRounds,
    activeRoundId,
    setActiveRoundId,
    createAuctionRound,
    updateAuctionRound,
    completeAuctionRound,
    reopenAuctionRound,
    deleteAuctionRound,
    openScheduledRoundNow,
    setRoundSchedule,
    addAuctionItems,
    startAuction,
    startAllPendingAuctions,
    addMemberToAuction,
    removeMemberFromAuction,
    removeOneMemberEntryFromAuction,
    removeMemberEntryById,
    updateAuctionMaxEntries,
    setAuctionWinner,
    confirmAuctionWinners,
    resetAuctionWinner,
    deleteAuctionItem,
  } = useGuildStore();

  const { isAuthenticated } = useAuth();
  const [viewAsMember, setViewAsMember] = useState(false);

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'ended'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateRoundOpen, setIsCreateRoundOpen] = useState(false);
  const [isRoundHistoryOpen, setIsRoundHistoryOpen] = useState(false);
  const [registerAuctionId, setRegisterAuctionId] = useState<string | null>(null);
  const [wheelAuctionId, setWheelAuctionId] = useState<string | null>(null);

  // Active round object
  const currentRound: AuctionRound | null = useMemo(() => {
    if (auctionRounds.length === 0) return null;
    return auctionRounds.find((r) => r.id === activeRoundId) || auctionRounds[0];
  }, [auctionRounds, activeRoundId]);

  // Active items for modals (always fetched from live state)
  const registerAuction = useMemo(() => {
    return auctionItems.find((a) => a.id === registerAuctionId) || null;
  }, [auctionItems, registerAuctionId]);

  const wheelAuction = useMemo(() => {
    return auctionItems.find((a) => a.id === wheelAuctionId) || null;
  }, [auctionItems, wheelAuctionId]);

  // Items belonging to current round
  const roundItems = useMemo(() => {
    if (!currentRound) return [];
    return auctionItems.filter((item) => {
      const rId = item.roundId || auctionRounds[0]?.id || 'round_default';
      return rId === currentRound.id;
    });
  }, [auctionItems, currentRound, auctionRounds]);

  // Filtered items (by tab and search within the round)
  const filteredItems = useMemo(() => {
    return roundItems.filter((item) => {
      if (activeTab === 'pending' && item.status !== 'pending') return false;
      if (activeTab === 'active' && item.status !== 'active') return false;
      if (activeTab === 'ended' && item.status !== 'ended') return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = item.accessoryName.toLowerCase().includes(q);
        const matchWinner = item.winnerMemberName?.toLowerCase().includes(q);
        const matchSource = item.sourceNote?.toLowerCase().includes(q);
        const matchEntry = (item.entries || []).some((e) => e.memberName.toLowerCase().includes(q));
        if (!matchName && !matchWinner && !matchSource && !matchEntry) return false;
      }
      return true;
    });
  }, [roundItems, activeTab, search]);

  // Statistics for currently selected round
  const stats = useMemo(() => {
    const pendingCount = roundItems.filter((a) => a.status === 'pending').length;
    const activeCount = roundItems.filter((a) => a.status === 'active').length;
    const endedCount = roundItems.filter((a) => a.status === 'ended').length;
    const totalEntriesCount = roundItems.reduce((sum, a) => sum + (a.entries?.length || 0), 0);

    return {
      pendingCount,
      activeCount,
      endedCount,
      totalEntriesCount,
    };
  }, [roundItems]);

  const handleStartAuction = (item: AuctionItem) => {
    startAuction(item.id);
  };

  const handleStartAllPending = () => {
    if (stats.pendingCount === 0) return;
    if (window.confirm(`คุณต้องการเปิดรับรายชื่อไอเทมทั้งหมดที่รออยู่ในรอบนี้จำนวน ${stats.pendingCount} ชิ้นพร้อมกันหรือไม่?`)) {
      startAllPendingAuctions();
    }
  };

  const handleDeletePrompt = (item: AuctionItem) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรายการ "${item.accessoryName}"?`)) {
      deleteAuctionItem(item.id);
    }
  };

  const handleResetWinnerPrompt = (item: AuctionItem) => {
    if (window.confirm(`คุณต้องการรีเซ็ตผลผู้ชนะของ "${item.accessoryName}" เพื่อเปิดรับรายชื่อหรือสุ่มใหม่หรือไม่?`)) {
      resetAuctionWinner(item.id);
    }
  };

  // If visitor is NOT logged in or toggled member view, render MemberAuctionView directly!
  if (!isAuthenticated || viewAsMember) {
    return <MemberAuctionView onSwitchToAdmin={() => setViewAsMember(false)} />;
  }

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-4 sm:space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-rose-500/30 bg-white dark:bg-[#0d121f]/95 p-4 sm:p-5 shadow-xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-amber-500/20 text-2xl border border-rose-500/40 shadow-sm text-amber-400 shrink-0">
            🎡
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">
                สุ่มแจกไอเทมกิลด์ (Lucky Wheel Raffle) — {guildName}
              </h1>             
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              จัดกลุ่มของดรอปเป็นรอบ (Rounds) เพื่อเปิดรับรายชื่อ สุ่มด้วยวงล้อ และเก็บบันทึกประวัติย้อนหลังได้ทุกสัปดาห์
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <AutoSaveBadge />

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                const url = `${window.location.origin}/auctions`;
                navigator.clipboard?.writeText(url);
                alert('คัดลอกลิงก์หน้าลงชื่อประมูลสำหรับสมาชิก (/auctions) เรียบร้อยแล้ว!\n\n' + url);
              }
            }}
            className="flex items-center gap-1.5 rounded-2xl border border-indigo-400 dark:border-indigo-500/40 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
            title="คัดลอกลิงก์ /auctions สำหรับส่งให้สมาชิกใน Line/Discord"
          >
            <span>🔗</span>
            <span>ลิงก์สำหรับสมาชิก (/auctions)</span>
          </button>

          {currentRound && stats.pendingCount > 0 && currentRound.status === 'active' && (
            <button
              type="button"
              onClick={handleStartAllPending}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer"
            >
              <span>▶️</span>
              <span>เปิดรับรายชื่อทั้งหมด ({stats.pendingCount})</span>
            </button>
          )}

          {currentRound && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition cursor-pointer"
            >
              <span>+</span>
              <span>เพิ่มของในรอบนี้ (เป็น List)</span>
            </button>
          )}
        </div>
      </div>

      {/* Round Selector Bar (ครอบรอบประมูล) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3.5 sm:p-4 rounded-3xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-gradient-to-r dark:from-[#0d1322] dark:via-[#0b101c] dark:to-[#101728] shadow-sm dark:shadow-lg">
        {/* Left: Round Dropdown Selector & Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl border border-amber-500/30 text-amber-500 dark:text-amber-400 shrink-0">
              🎯
            </span>
            <div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                เลือกรอบการประมูล / สุ่มแจก (Round):
              </div>
              <select
                value={currentRound?.id || ''}
                onChange={(e) => setActiveRoundId(e.target.value)}
                disabled={auctionRounds.length === 0}
                className="bg-slate-50 dark:bg-[#070b14] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white focus:border-rose-500 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-md mt-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {auctionRounds.length === 0 ? (
                  <option value="">-- ยังไม่มีรอบประมูล (กดปุ่ม + สร้างรอบใหม่) --</option>
                ) : (
                  auctionRounds.map((r) => {
                    const rItems = auctionItems.filter((i) => (i.roundId || auctionRounds[0]?.id || 'round_default') === r.id);
                    const isComp = r.status === 'completed';
                    const isSched = r.status === 'scheduled';
                    return (
                      <option key={r.id} value={r.id}>
                        {isComp ? '🏆 [จบแล้ว]' : isSched ? '⏰ [ตั้งเวลาเปิด]' : '🟢 [เปิดอยู่]'} {r.name} ({r.date}) — {rItems.length} ชิ้น
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          </div>

          {/* Current Round Status Pill */}
          {currentRound && (
            <div className="flex items-center gap-1.5 self-end mb-1">
              {currentRound.status === 'completed' ? (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <span>🏆</span>
                  <span>รอบนี้จบการประมูลแล้ว</span>
                </span>
              ) : currentRound.status === 'scheduled' ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <span>⏰</span>
                    <span>
                      รอเปิดอัตโนมัติ:{' '}
                      {currentRound.scheduledOpenAt
                        ? new Date(currentRound.scheduledOpenAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.'
                        : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`ต้องการเปิดรอบ "${currentRound.name}" ทันทีตอนนี้เลยหรือไม่?`)) {
                        openScheduledRoundNow(currentRound.id);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow transition cursor-pointer"
                    title="เปิดให้สมาชิกลงชื่อทันทีโดยไม่ต้องรอเวลา"
                  >
                    <span>⚡ เปิดทันที</span>
                  </button>
                </div>
              ) : (
                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>กำลังดำเนินการ</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: Live Date & Time Clock (วัน เดือน ปี เวลา ที่เดินไปเรื่อยๆ) */}
        <div className="flex items-center justify-center my-1 md:my-0">
          <LiveClock />
        </div>

        {/* Right: Round Operations */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {currentRound && currentRound.status === 'active' && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`คุณต้องการปิดรอบ "${currentRound.name}" หรือไม่?`)) {
                  completeAuctionRound(currentRound.id);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              title="บันทึกว่าจบการประมูลรอบนี้แล้ว"
            >
              <span>🔒</span>
              <span>ปิดรอบนี้</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRoundHistoryOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            <span>📜</span>
            <span>ดูรอบย้อนหลัง ({auctionRounds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateRoundOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-md shadow-amber-950/40 transition cursor-pointer flex items-center gap-1"
          >
            <span>+</span>
            <span>สร้างรอบใหม่</span>
          </button>
        </div>
      </div>

      {/* If No Round is Created Yet */}
      {!currentRound ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0b101d] dark:to-[#070b14] p-10 sm:p-14 text-center space-y-4 shadow-inner">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-purple-500/20 border border-amber-500/30 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/10">
            🎯
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide">
              ยังไม่มีรอบการประมูล / สุ่มแจก
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              กรุณากดปุ่ม <strong className="text-amber-600 dark:text-amber-300 font-semibold">&ldquo;+ สร้างรอบใหม่&rdquo;</strong> ด้านบน เพื่อกำหนดรอบการประมูล (เช่น รอบกิลด์วอร์ประจำสัปดาห์) ก่อนที่จะเปิดรับรายชื่อและสุ่มวงล้อ
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateRoundOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-500 hover:from-amber-500 hover:to-rose-500 text-white text-xs sm:text-sm font-extrabold shadow-xl shadow-amber-950/40 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
            >
              <span>+</span>
              <span>สร้างรอบการประมูลใหม่</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Historical Round Banner */}
      {currentRound && currentRound.status === 'completed' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 rounded-2xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-gradient-to-r dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 text-xs shadow-inner">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
            <span className="text-base">📜</span>
            <span>
              คุณกำลังดูข้อมูลย้อนหลังของรอบ <strong className="text-slate-900 dark:text-white">&ldquo;{currentRound.name}&rdquo;</strong> (วันที่ {currentRound.date}) — บันทึกผลเสร็จสมบูรณ์แล้ว
            </span>
          </div>

          {auctionRounds.some((r) => r.status === 'active') && (
            <button
              type="button"
              onClick={() => {
                const act = auctionRounds.find((r) => r.status === 'active');
                if (act) setActiveRoundId(act.id);
              }}
              className="text-xs font-bold text-amber-600 dark:text-amber-300 hover:underline cursor-pointer shrink-0"
            >
              สลับไปรอบปัจจุบัน ▶
            </button>
          )}
        </div>
      )}

      {/* Summary Stats Cards for Selected Round */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Pending */}
        <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/15 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl border border-amber-500/40 text-amber-600 dark:text-amber-400 shrink-0">
            ⏳
          </span>
          <div>
            <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400/90">รอเปิดรับรายชื่อ (Pending)</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-700 dark:text-amber-300">
              {stats.pendingCount} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ชิ้น</span>
            </div>
          </div>
        </div>

        {/* 2. Active */}
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/15 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shrink-0">
            🟢
          </span>
          <div>
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400/90">เปิดรับรายชื่อ / พร้อมสุ่ม</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
              {stats.activeCount} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ชิ้น</span>
            </div>
          </div>
        </div>

        {/* 3. Ended */}
        <div className="rounded-2xl border border-indigo-300 dark:border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/15 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-xl border border-indigo-500/40 text-indigo-600 dark:text-indigo-400 shrink-0">
            🏆
          </span>
          <div>
            <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-400/90">สุ่มได้ผู้ชนะแล้ว (Ended)</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
              {stats.endedCount} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">ชิ้น</span>
            </div>
          </div>
        </div>

        {/* 4. Total Registered Members */}
        <div className="rounded-2xl border border-rose-300 dark:border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/15 p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 shrink-0">
            👥
          </span>
          <div>
            <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400/90">ยอดคนลงชื่อในรอบนี้</div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-700 dark:text-rose-300">
              {stats.totalEntriesCount} <span className="text-xs font-sans text-slate-500 dark:text-slate-400">คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d121f] p-3 shadow-sm">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ทั้งหมดในรอบ ({roundItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>⏳ รอเปิดรับรายชื่อ</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-black/30 font-mono">
              {stats.pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🟢 เปิดรับรายชื่อ / พร้อมสุ่ม</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-black/30 font-mono">
              {stats.activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ended'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>🏆 ได้ผู้ชนะแล้ว</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-black/30 font-mono">
              {stats.endedCount}
            </span>
          </button>
        </div>

        {/* Search & View Mode Switch */}
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="ค้นหาชื่อไอเทม, ผู้ชนะ, ผู้ลงชื่อ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-500 focus:outline-none w-48 sm:w-64"
          />

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="แสดงผลแบบรายการ (List)"
            >
              <span>📋</span>
              <span className="hidden sm:inline">รายการ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="แสดงผลแบบการ์ด (Grid)"
            >
              <span>🎴</span>
              <span className="hidden sm:inline">การ์ด</span>
            </button>
          </div>
        </div>
      </div>

      {/* Round Title Header Bar (ชื่อรอบการประมูล ครอบรายการของประมูล) */}
      <div className="rounded-2xl sm:rounded-3xl border border-rose-300 dark:border-rose-500/30 bg-white dark:bg-gradient-to-r dark:from-[#0d1424] dark:via-[#0f172a] dark:to-[#0c1220] p-4 sm:p-5 shadow-sm dark:shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          {/* Left: Round Name & Status */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-base border border-rose-500/40 text-amber-500 dark:text-amber-300">
                🎯
              </span>

              <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
                <span>{currentRound?.name || 'รอบการประมูลปัจจุบัน'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!currentRound) return;
                    const newName = window.prompt('แก้ไขชื่อรอบการประมูล:', currentRound.name);
                    if (newName && newName.trim()) {
                      updateAuctionRound(currentRound.id, { name: newName.trim() });
                    }
                  }}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 text-xs transition cursor-pointer"
                  title="แก้ไขชื่อรอบ"
                >
                  ✏️
                </button>
              </h2>

              {/* Status Badge */}
              {currentRound?.status === 'completed' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <span>🏆</span>
                  <span>จบการสุ่มรอบนี้แล้ว</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>กำลังเปิดสุ่ม</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              {currentRound?.date && (
                <span className="flex items-center gap-1">
                  <span>📅</span>
                  <span>วันที่จัดรอบ: <strong className="text-slate-800 dark:text-slate-200">{currentRound.date}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentRound) return;
                      const newDate = window.prompt('เปลี่ยนวันที่จัดรอบ (YYYY-MM-DD):', currentRound.date);
                      if (newDate && newDate.trim()) {
                        updateAuctionRound(currentRound.id, { date: newDate.trim() });
                      }
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 text-[11px] transition cursor-pointer"
                    title="แก้ไขวันที่จัดรอบ"
                  >
                    ✏️
                  </button>
                </span>
              )}
              {currentRound?.note && (
                <>
                  <span>•</span>
                  <span className="text-slate-500 dark:text-slate-400 italic">📝 {currentRound.note}</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Round Item Stats Summary */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <div className="flex items-center gap-2.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-[#070b14]/80">
              <span className="text-slate-600 dark:text-slate-400">ไอเทมในรอบ:</span>
              <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">{roundItems.length}</strong>
              <span className="text-slate-400 dark:text-slate-600">|</span>
              <span className="text-slate-600 dark:text-slate-400">ได้ผู้ชนะแล้ว:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{stats.endedCount}/{roundItems.length}</strong>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-bold text-white shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>+</span>
              <span>เพิ่มของในรอบนี้</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auction Items List / Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-transparent p-12 text-center space-y-3">
          <span className="text-4xl">🎡</span>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-300">
            {roundItems.length === 0
              ? `ยังไม่มีรายการไอเทมในรอบ "${currentRound?.name || 'รอบปัจจุบัน'}"`
              : 'ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-500 max-w-md mx-auto">
            {roundItems.length === 0
              ? 'คลิกปุ่ม "+ เพิ่มของในรอบนี้ (เป็น List)" ด้านบนเพื่อเริ่มเลือกเครื่องประดับใส่ในรอบนี้'
              : 'ลองเปลี่ยนคำค้นหาหรือแท็บตัวกรองด้านบนเพื่อดูรายการอื่นๆ'}
          </p>
          {roundItems.length === 0 && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white transition shadow cursor-pointer"
            >
              <span>+ เพิ่มของในรอบนี้ (เป็น List)</span>
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ===== LIST VIEW (แบบรายการ) ===== */
        <div className="space-y-2.5">
          {filteredItems.map((item, index) => {
            const isPending = item.status === 'pending';
            const isActive = item.status === 'active';
            const isEnded = item.status === 'ended';
            const isTitle = isTitleItem(item);
            const isChest = isChestItem(item);
            const isPet = !isTitle && !isChest && (item.itemCategory === 'pet' || (item.cardSlot && item.cardSlot.includes('สัตว์เลี้ยง')) || (item.cardQuality && item.cardQuality.startsWith('Pet')));
            const isRelic = !isTitle && !isChest && !isPet && (item.itemCategory === 'relic' || item.cardQuality === 'Sage');
            const isCard = !isTitle && !isChest && !isPet && !isRelic && (item.itemCategory === 'card' || item.cardQuality === 'Purple');
            const titleTier = isTitle ? getTitleTierStyle(item.accessoryIcon || item.accessoryName || item.cardQuality) : null;
            const chestTier = isChest ? getChestTierStyle(item.accessoryName || item.cardQuality) : null;
            const petTier = isPet ? getPetTierStyle(item.accessoryName || item.cardQuality) : null;
            const entryCount = (item.entries || []).length;
            const isQuotaFull = !!(item.maxEntries && item.maxEntries > 0 && entryCount >= item.maxEntries);
            const imageSrc = getAuctionItemImageSrc(item);

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 transition shadow-sm ${
                  isActive
                    ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-gradient-to-r dark:from-[#0d1527] dark:to-[#0c1a24] hover:border-emerald-500/70'
                    : isPending
                    ? 'border-amber-400/50 bg-amber-50/50 dark:bg-[#0d121f] hover:border-amber-500/60'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0e18]/80'
                }`}
              >
                {/* Left: Thumbnail & Item Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-5 text-right shrink-0">
                    {index + 1}.
                  </span>

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
                          const fallback = isTitle
                            ? `https://roworlddb.com/media/images/item/${item.accessoryIcon}.webp`
                            : isChest
                            ? (item.accessoryIcon.includes('title_chest')
                                ? `/images/chests/${item.accessoryIcon}.svg`
                                : item.accessoryIcon.includes('stonebox') || item.accessoryIcon.includes('gem')
                                ? `https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp`
                                : `https://roworlddb.com/media/images/item/icon_item_bx_fy.webp`)
                            : isPet
                            ? (item.accessoryIcon.includes('mfmm')
                                ? `https://roworlddb.com/media/images/icon/pet/${item.accessoryIcon}.webp`
                                : `https://roworlddb.com/media/images/pet/${item.accessoryIcon}.webp`)
                            : isRelic
                            ? `https://roworlddb.com/media/images/hallows/${item.accessoryIcon}.webp`
                            : `https://roworlddb.com/media/images/item/${item.accessoryIcon}.webp`;
                          target.src = fallback;
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

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wide truncate">
                        {item.accessoryName}
                      </h4>

                      {isTitle ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                          <TitleSvgIcon className="w-3 h-3" />
                          <span>{item.cardQuality || titleTier?.label}</span>
                        </span>
                      ) : isChest ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                          <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                          <span>{item.cardQuality || chestTier?.label}</span>
                        </span>
                      ) : isPet ? (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                          <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                          <span>{item.cardQuality || petTier?.label}</span>
                        </span>
                      ) : isRelic ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <RelicSvgIcon className="w-3 h-3" />
                          <span>Relic</span>
                        </span>
                      ) : isCard ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                          🃏 MVP ม่วง · {item.cardSlot || 'การ์ด'}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                          Red Lv.90
                        </span>
                      )}

                      {/* Status Badge */}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <span>⏳</span>
                          <span>รอเปิดรับรายชื่อ</span>
                        </span>
                      )}
                      {isActive && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          isQuotaFull
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isQuotaFull ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                          <span>
                            {isTitle
                              ? (isQuotaFull ? `🔒 ผู้รับสิทธิ์ครบ (${entryCount}/${item.maxEntries})` : `⚡ เปิดรับสิทธิ์ Title ${item.maxEntries ? `(${entryCount}/${item.maxEntries})` : ''}`)
                              : (isQuotaFull ? `🔒 โควตาเต็ม (${entryCount}/${item.maxEntries})` : `เปิดรับรายชื่อ ${item.maxEntries ? `(${entryCount}/${item.maxEntries})` : '/ พร้อมหมุน'}`)}
                          </span>
                        </span>
                      )}
                      {isEnded && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                          <span>🏆</span>
                          <span>ได้ผู้ชนะแล้ว</span>
                        </span>
                      )}
                    </div>

                    {item.sourceNote && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        🏷️ {item.sourceNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: Winner or Registered Entries count */}
                <div className="flex items-center gap-4 px-2 md:px-0 self-start md:self-center shrink-0">
                  <div className="text-left md:text-right">
                    {isEnded && item.winnerMemberName ? (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          {item.winners && item.winners.length > 1 ? `ผู้ได้รับสิทธิ์ทั้งหมด (${entryCount} ชิ้น):` : 'ผู้ชนะที่สุ่มได้:'}
                        </div>
                        {item.winners && item.winners.length > 1 ? (
                          <div className="flex flex-wrap items-center md:justify-end gap-1.5 mt-1 max-w-md">
                            {item.winners.map((w) => (
                              <span key={w.memberId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                                {w.memberJob && <JobEmblem job={w.memberJob} size={15} />}
                                <span>{w.memberName}</span>
                                <span className="text-amber-300 font-mono">x{w.count}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center md:justify-end gap-1.5 mt-0.5">
                            {item.winnerMemberJob && (
                              <JobEmblem job={item.winnerMemberJob} size={18} />
                            )}
                            <span className="text-base sm:text-lg font-black text-emerald-300 tracking-wide">
                              {item.winnerMemberName}
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          จากผู้ลงชื่อทั้งหมด {entryCount} รายการ
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          {isPending ? 'สถานะ:' : isTitle ? 'สมาชิกที่ขอรับสิทธิ์:' : 'สมาชิกที่ส่งรายชื่อเข้ามา:'}
                        </div>
                        <div className="text-base sm:text-lg font-extrabold font-mono text-amber-400">
                          {isPending ? (
                            <span className="text-sm font-sans text-amber-300/90 font-bold">รอเปิดรับ</span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span>{entryCount}</span>
                              {item.maxEntries ? (
                                <span className="text-xs font-mono text-slate-400">/{item.maxEntries}</span>
                              ) : null}
                              <span className="text-xs font-sans text-slate-400 font-normal">ชิ้น</span>
                              {isQuotaFull && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-500 font-bold border border-rose-500/30">
                                  เต็ม
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {isActive && entryCount > 0 && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            {isTitle ? '⚡ กดปุ่มยืนยันผู้ชนะได้ทันที' : 'พร้อมหมุนวงล้อสุ่ม 🎡'}
                          </div>
                        )}
                        {isActive && entryCount === 0 && (
                          <div className="text-[10px] text-slate-500">
                            ยังไม่มีคนส่งรายชื่อ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                  {/* Action 1: START (เมื่อเป็น pending) */}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => handleStartAuction(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>▶️</span>
                      <span>เปิดรับรายชื่อ</span>
                    </button>
                  )}

                  {/* Action 2: REGISTER MEMBERS (เมื่อ active) */}
                  {isActive && (
                    isTitle ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRegisterAuctionId(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>👥</span>
                          <span>จัดการรายชื่อ ({entryCount}{item.maxEntries ? `/${item.maxEntries}` : ''})</span>
                        </button>

                        {entryCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`ยืนยันผู้ชนะ Title "${item.accessoryName}" ทั้งหมด ${entryCount} ชิ้นตามรายชื่อที่ขอเข้ามาใช่หรือไม่?`)) {
                                confirmAuctionWinners(item.id);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                            title="ยืนยันผู้ชนะตามจำนวนที่ขอเข้ามาทุกคน โดยไม่ต้องสุ่มวงล้อ"
                          >
                            <span>🏆</span>
                            <span>กดยืนยันผู้ชนะ ({entryCount})</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setRegisterAuctionId(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>👥</span>
                          <span>ลงชื่อ ({entryCount}{item.maxEntries ? `/${item.maxEntries}` : ''})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setWheelAuctionId(item.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>🎡</span>
                          <span>หมุนวงล้อสุ่ม</span>
                        </button>
                      </>
                    )
                  )}

                  {/* Re-roll or View Wheel (for ended) */}
                  {isEnded && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWheelAuctionId(item.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🎡</span>
                        <span>ดูวงล้อ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetWinnerPrompt(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold transition cursor-pointer"
                        title="รีเซ็ตผู้ชนะเพื่อสุ่มใหม่"
                      >
                        🔄 สุ่มใหม่
                      </button>
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeletePrompt(item)}
                    className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 text-xs transition cursor-pointer"
                    title="ลบรายการนี้"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== GRID VIEW (แบบการ์ด) ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPending = item.status === 'pending';
            const isActive = item.status === 'active';
            const isEnded = item.status === 'ended';
            const isTitle = isTitleItem(item);
            const isChest = isChestItem(item);
            const isPet = !isTitle && !isChest && (item.itemCategory === 'pet' || (item.cardSlot && item.cardSlot.includes('สัตว์เลี้ยง')) || (item.cardQuality && item.cardQuality.startsWith('Pet')));
            const isRelic = !isTitle && !isChest && !isPet && (item.itemCategory === 'relic' || item.cardQuality === 'Sage');
            const isCard = !isTitle && !isChest && !isPet && !isRelic && (item.itemCategory === 'card' || item.cardQuality === 'Purple');
            const titleTier = isTitle ? getTitleTierStyle(item.accessoryIcon || item.accessoryName || item.cardQuality) : null;
            const chestTier = isChest ? getChestTierStyle(item.accessoryName || item.cardQuality) : null;
            const petTier = isPet ? getPetTierStyle(item.accessoryName || item.cardQuality) : null;
            const entryCount = (item.entries || []).length;
            const isQuotaFull = !!(item.maxEntries && item.maxEntries > 0 && entryCount >= item.maxEntries);
            const imageSrc = getAuctionItemImageSrc(item);

            return (
              <div
                key={item.id}
                className={`rounded-3xl border p-4 sm:p-5 flex flex-col justify-between transition-all shadow-md relative overflow-hidden group ${
                  isActive
                    ? 'border-emerald-500/50 bg-emerald-50/40 dark:bg-[#0d121f] hover:border-emerald-500/70 hover:shadow-emerald-500/10'
                    : isPending
                    ? 'border-amber-400/50 bg-amber-50/40 dark:bg-[#0d121f] hover:border-amber-500/60'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0e18]/80'
                }`}
              >
                {/* Top: Status Badge + Delete Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 gap-2">
                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <span>⏳</span>
                        <span>รอเปิดรับรายชื่อ</span>
                      </span>
                    ) : isActive ? (
                      <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isQuotaFull
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isQuotaFull ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                        <span>
                          {isQuotaFull
                            ? `🔒 เต็มโควตา (${entryCount}/${item.maxEntries})`
                            : `เปิดรับรายชื่อ ${item.maxEntries ? `(${entryCount}/${item.maxEntries})` : '/ พร้อมสุ่ม'}`}
                        </span>
                      </span>
                    ) : isEnded ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        <span>🏆</span>
                        <span>ได้ผู้ชนะแล้ว</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                        ยกเลิก
                      </span>
                    )}

                    {isTitle ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                        <TitleSvgIcon className="w-3 h-3" />
                        <span>{titleTier?.label}</span>
                      </span>
                    ) : isChest ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                        <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                        <span>{chestTier?.label}</span>
                      </span>
                    ) : isPet ? (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                        <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                        <span>{item.cardQuality || petTier?.label}</span>
                      </span>
                    ) : isRelic ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <RelicSvgIcon className="w-3 h-3" />
                        <span>Relic</span>
                      </span>
                    ) : isCard ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                        MVP ม่วง
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                        Red Lv.90
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isEnded && (
                      <button
                        type="button"
                        onClick={() => handleResetWinnerPrompt(item)}
                        className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[10px] font-bold transition cursor-pointer"
                        title="รีเซ็ตผู้ชนะเพื่อสุ่มใหม่"
                      >
                        🔄 สุ่มใหม่
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(item)}
                      className="text-slate-400 hover:text-rose-500 p-1 text-xs transition cursor-pointer"
                      title="ลบรายการนี้"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Middle: Item Details */}
                <div className="py-3.5 space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <div className={`relative w-16 h-16 shrink-0 rounded-2xl border flex items-center justify-center shadow-lg group-hover:scale-105 transition ${
                      isTitle
                        ? `${titleTier?.border} ${titleTier?.bg} ${titleTier?.shadow}`
                        : isChest
                        ? `${chestTier?.border} ${chestTier?.bg} ${chestTier?.shadow}`
                        : isPet
                        ? `${petTier?.border} ${petTier?.bg} ${petTier?.shadow}`
                        : isRelic
                        ? 'border-amber-500/50 bg-amber-950/20 shadow-amber-500/15'
                        : isCard
                        ? 'border-purple-500/50 bg-purple-950/20 shadow-purple-500/15'
                        : 'border-rose-500/50 bg-slate-100 dark:bg-[#080d19] shadow-rose-500/15'
                    }`}>
                    {item.accessoryIcon.includes('title_chest') ? (
                      <TitleChestSvgIcon
                        variant={chestTier?.tier || 'gold'}
                        className="w-12 h-12 drop-shadow"
                      />
                    ) : (
                      <Image
                        src={imageSrc}
                        alt={item.accessoryName}
                        width={54}
                        height={54}
                        unoptimized
                        className="object-contain drop-shadow"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          const fallback = isTitle
                            ? `https://roworlddb.com/media/images/item/${item.accessoryIcon}.webp`
                            : isChest
                            ? (item.accessoryIcon.includes('title_chest')
                                ? `/images/chests/${item.accessoryIcon}.svg`
                                : item.accessoryIcon.includes('stonebox') || item.accessoryIcon.includes('gem')
                                ? `https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp`
                                : `https://roworlddb.com/media/images/item/icon_item_bx_fy.webp`)
                            : isPet
                            ? (item.accessoryIcon.includes('mfmm')
                                ? `https://roworlddb.com/media/images/icon/pet/${item.accessoryIcon}.webp`
                                : `https://roworlddb.com/media/images/pet/${item.accessoryIcon}.webp`)
                            : isRelic
                            ? `https://roworlddb.com/media/images/hallows/${item.accessoryIcon}.webp`
                            : `https://roworlddb.com/media/images/item/${item.accessoryIcon}.webp`;
                          target.src = fallback;
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
                          <span className="absolute bottom-0 right-0 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/90 border border-slate-700 text-amber-300 font-mono">
                            Lv.{item.accessoryLevel}
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white tracking-wide truncate" title={item.accessoryName}>
                        {item.accessoryName}
                      </h4>
                      {isTitle ? (
                        <div className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1 ${titleTier?.text}`}>
                          <TitleSvgIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.cardQuality || item.cardSlot || titleTier?.label}</span>
                        </div>
                      ) : isChest ? (
                        <div className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1 ${chestTier?.text}`}>
                          <TitleChestSvgIcon className="w-3.5 h-3.5 shrink-0" variant={chestTier?.tier} />
                          <span>{item.cardQuality || item.cardSlot || chestTier?.label}</span>
                        </div>
                      ) : isPet ? (
                        <div className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1 ${petTier?.text}`}>
                          <PetSvgIcon className="w-3.5 h-3.5 shrink-0" variant={petTier?.tier} />
                          <span>{item.cardQuality || item.cardSlot || petTier?.label}</span>
                        </div>
                      ) : isRelic ? (
                        <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                          <RelicSvgIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.cardSlot || 'Relic'}</span>
                        </div>
                      ) : isCard ? (
                        <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                          ช่อง: {item.cardSlot || 'การ์ด MVP'}
                        </div>
                      ) : null}
                      {item.sourceNote && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          🏷️ {item.sourceNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Registered Info Box */}
                  <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080d19]/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {isEnded ? 'ผู้ชนะจากการสุ่มวงล้อ:' : 'สมาชิกที่ส่งรายชื่อเข้ามา:'}
                      </span>
                      <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">
                        {entryCount} <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-normal">คน</span>
                      </span>
                    </div>

                    {/* Winner or Participants summary */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      {isEnded && item.winnerMemberName ? (
                        <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white w-full justify-between">
                          <span className="text-slate-500 dark:text-slate-400">ผู้ชนะ:</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300 font-bold">
                            {item.winnerMemberJob && (
                              <JobEmblem job={item.winnerMemberJob} size={18} />
                            )}
                            <span>{item.winnerMemberName}</span>
                          </span>
                        </span>
                      ) : isPending ? (
                        <span className="text-slate-500 font-medium">รอเปิดรับรายชื่อ</span>
                      ) : entryCount > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">พร้อมหมุนวงล้อสุ่ม 🎡</span>
                      ) : (
                        <span className="text-slate-400 font-medium">ยังไม่มีผู้ส่งรายชื่อ</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                  {isPending ? (
                    <button
                      type="button"
                      onClick={() => handleStartAuction(item)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <span>▶️</span>
                      <span>เปิดรับรายชื่อรายการนี้</span>
                    </button>
                  ) : isActive ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setRegisterAuctionId(item.id)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>👥</span>
                        <span>ลงชื่อ ({entryCount}{item.maxEntries ? `/${item.maxEntries}` : ''})</span>
                      </button>

                      {isTitle ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (entryCount === 0) {
                              setRegisterAuctionId(item.id);
                              return;
                            }
                            if (window.confirm(`ยืนยันผู้ชนะ Title "${item.accessoryName}" ทั้งหมด ${entryCount} ชิ้นตามรายชื่อที่ขอเข้ามาใช่หรือไม่?`)) {
                              confirmAuctionWinners(item.id);
                            }
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-md shadow-amber-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                          title="ยืนยันผู้ชนะตามจำนวนที่ขอเข้ามาทุกคน โดยไม่ต้องสุ่มวงล้อ"
                        >
                          <span>🏆</span>
                          <span>ยืนยันผู้ชนะ ({entryCount})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setWheelAuctionId(item.id)}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-extrabold shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>🎡</span>
                          <span>หมุนวงล้อ</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWheelAuctionId(item.id)}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                    >
                      <span>🎡</span>
                      <span>ดูวงล้อ / ผลสุ่ม ({entryCount} คน)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Modals */}
      <AddAuctionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={(items) => {
          const currentRId = currentRound?.id || 'round_default';
          addAuctionItems(items.map((i) => ({ ...i, roundId: currentRId })));
        }}
      />

      <CreateRoundModal
        isOpen={isCreateRoundOpen}
        onClose={() => setIsCreateRoundOpen(false)}
        onCreateRound={(name, date, note, scheduledOpenAt, scheduledCloseAt) => {
          createAuctionRound(name, date, note, scheduledOpenAt, scheduledCloseAt);
        }}
      />

      <RoundHistoryModal
        isOpen={isRoundHistoryOpen}
        onClose={() => setIsRoundHistoryOpen(false)}
        rounds={auctionRounds}
        activeRoundId={currentRound?.id || null}
        auctionItems={auctionItems}
        onSelectRound={(roundId) => {
          setActiveRoundId(roundId);
        }}
        onCompleteRound={(roundId) => {
          completeAuctionRound(roundId);
        }}
        onReopenRound={(roundId) => {
          reopenAuctionRound(roundId);
        }}
        onDeleteRound={(roundId) => {
          deleteAuctionRound(roundId);
        }}
      />

      <RegisterMembersModal
        isOpen={!!registerAuction}
        onClose={() => setRegisterAuctionId(null)}
        auction={registerAuction}
        members={members}
        onAddMember={(auctionId, memberId) => {
          addMemberToAuction(auctionId, memberId);
        }}
        onRemoveMember={(auctionId, memberId) => {
          removeMemberFromAuction(auctionId, memberId);
        }}
        onRemoveOneMember={(auctionId, memberId) => {
          removeOneMemberEntryFromAuction(auctionId, memberId);
        }}
        onRemoveEntry={(auctionId, entryId) => {
          removeMemberEntryById(auctionId, entryId);
        }}
        onUpdateMaxEntries={(auctionId, maxEntries) => {
          updateAuctionMaxEntries(auctionId, maxEntries);
        }}
        onConfirmWinners={(auctionId) => {
          confirmAuctionWinners(auctionId);
        }}
        onOpenWheel={() => {
          if (registerAuction) {
            setWheelAuctionId(registerAuction.id);
          }
        }}
      />

      <LuckyWheelModal
        isOpen={!!wheelAuction}
        onClose={() => setWheelAuctionId(null)}
        auction={wheelAuction}
        onConfirmWinner={(auctionId, winnerMemberId) => {
          setAuctionWinner(auctionId, winnerMemberId);
        }}
        onOpenRegisterModal={() => {
          if (wheelAuction) {
            setRegisterAuctionId(wheelAuction.id);
          }
        }}
      />
    </div>
  );
}
