'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGuildStore } from '@/lib/guildStore';
import JobEmblem from '@/components/tactical/JobEmblem';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import LiveClock from '@/components/common/LiveClock';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { QueueList, QueueEntry, formatQueueTime } from '@/types/queue';
import { getQueuePreset } from '@/constants/queuePresets';
import CreateQueueModal from './CreateQueueModal';

interface AdminQueueViewProps {
  onSwitchToMember?: () => void;
}

export default function AdminQueueView({ onSwitchToMember }: AdminQueueViewProps) {
  const {
    guildName,
    members,
    queueLists,
    createQueueList,
    deleteQueueList,
    addMemberToQueue,
    removeMemberFromQueue,
    reorderQueueEntries,
    toggleQueueEntryCompleted,
    clearQueueEntries,
    setQueueStatus,
    openScheduledQueueNow,
  } = useGuildStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'scheduled' | 'in_progress' | 'vanished' | 'apocalypse'>('all');
  const [manualAddQueueId, setManualAddQueueId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [, setTick] = useState(0);

  // Live ticker for countdown update every second
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2500);
  };

  // Filtered Queue Lists
  const displayLists = useMemo(() => {
    let lists = [...queueLists];
    if (activeTab === 'open') {
      lists = lists.filter((q) => q.status === 'open');
    } else if (activeTab === 'scheduled') {
      lists = lists.filter((q) => q.status === 'scheduled');
    } else if (activeTab === 'in_progress') {
      lists = lists.filter((q) => q.status === 'in_progress');
    } else if (activeTab === 'vanished') {
      lists = lists.filter((q) => q.dungeonCategory === 'vanished');
    } else if (activeTab === 'apocalypse') {
      lists = lists.filter((q) => q.dungeonCategory === 'apocalypse');
    }
    return lists;
  }, [queueLists, activeTab]);

  // Overall Stats
  const totalQueuedMembers = useMemo(() => {
    return queueLists.reduce((sum, q) => sum + (q.entries?.length || 0), 0);
  }, [queueLists]);

  const activeQueuesCount = useMemo(() => {
    return queueLists.filter((q) => q.status === 'open').length;
  }, [queueLists]);

  const scheduledQueuesCount = useMemo(() => {
    return queueLists.filter((q) => q.status === 'scheduled').length;
  }, [queueLists]);

  // Move queue entry up/down
  const handleMoveEntry = (queueId: string, entryIdx: number, direction: 'up' | 'down') => {
    const queue = queueLists.find((q) => q.id === queueId);
    if (!queue) return;
    const entries = [...queue.entries];
    const targetIdx = direction === 'up' ? entryIdx - 1 : entryIdx + 1;
    if (targetIdx < 0 || targetIdx >= entries.length) return;

    const temp = entries[entryIdx];
    entries[entryIdx] = entries[targetIdx];
    entries[targetIdx] = temp;

    reorderQueueEntries(queueId, entries);
    showToast('ปรับลำดับคิวเรียบร้อย');
  };

  // Copy list formatted for Discord / Line
  const handleCopyQueueList = (queue: QueueList) => {
    const entries = queue.entries || [];
    const lines: string[] = [];
    lines.push(`📋 [คิว] ${queue.title} (${entries.length} คน)`);
    if (queue.note) lines.push(`💬 หมายเหตุ: ${queue.note}`);
    lines.push('------------------------');

    if (entries.length === 0) {
      lines.push('ยังไม่มีผู้ลงชื่อในคิว');
    } else {
      entries.forEach((e, idx) => {
        const time = formatQueueTime(e.joinedAt);
        const status = e.isCompleted ? ' [✓ ผ่านแล้ว]' : '';
        lines.push(`${idx + 1}. ${e.memberName} (${e.memberJob || 'ไม่ระบุ'})${time ? ` - ${time}` : ''}${status}`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    showToast('คัดลอกรายชื่อคิวลงคลิปบอร์ดแล้ว (พร้อมวางใน Discord/LINE) 📋');
  };

  const filteredMembersForAdd = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchJob = m.job ? m.job.toLowerCase().includes(q) : false;
      return matchName || matchJob;
    });
  }, [members, memberSearch]);

  const activeQueueForAdd = useMemo(() => {
    return queueLists.find((q) => q.id === manualAddQueueId);
  }, [queueLists, manualAddQueueId]);

  return (
    <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-6 space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md rounded-2xl border p-4 text-xs sm:text-sm font-bold shadow-2xl transition-all ${
            toastMsg.isError
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/60'
              : 'bg-indigo-900/90 text-indigo-100 border-indigo-500/60'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c101d]/90 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-2xl text-white shadow-lg shadow-indigo-950/40">
            📋
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                ระบบจัดการคิวลงดันเจี้ยน (Queue Manager)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              สร้าง List คิว มายาสิ้นสูญ / Apocalypse และจัดปาร์ตี้อัตโนมัติตามลำดับเวลากด
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col md:items-end justify-center gap-2 shrink-0">
          {/* Row 1: Status & Time */}
          <div className="flex items-center gap-2 flex-wrap md:justify-end">
            <LiveClock variant="compact" />
            <AutoSaveBadge />
            <ThemeToggle />
          </div>

          {/* Row 2: Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap md:justify-end">
            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/queue/join`;
                navigator.clipboard.writeText(url);
                showToast(`คัดลอกลิงก์หน้าสมาชิกแล้ว: ${url} 📋`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition cursor-pointer"
              title="คัดลอกลิงก์หน้าลงชื่อสำหรับสมาชิก เพื่อส่งลง Discord หรือ LINE"
            >
              <span>🔗</span>
              <span>คัดลอกลิงก์ให้สมาชิก</span>
            </button>

            <Link
              href="/queue/join"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
              title="เปิดหน้าจอสมาชิกที่ไม่ได้ Login ในแท็บใหม่"
            >
              <span>👁️</span>
              <span>ดูหน้าสมาชิก ↗</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-extrabold shadow-md shadow-indigo-950/50 transition cursor-pointer active:scale-95"
            >
              <span>+</span>
              <span>สร้าง List คิวใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">List คิวทั้งหมด</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
            {queueLists.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">คิวที่เปิดรับอยู่</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-300 font-mono mt-0.5 block">
            {activeQueuesCount}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block">สมาชิกรอในคิวรวม</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300 font-mono mt-0.5 block">
            {totalQueuedMembers} <span className="text-xs font-normal text-slate-400">คน</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-50/40 dark:bg-purple-950/20 shadow-sm">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block">กำลังลงดันเจี้ยน</span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-300 font-mono mt-0.5 block">
            {queueLists.filter((q) => q.status === 'in_progress').length} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </span>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-sm">
          {[
            { id: 'all', label: 'ทั้งหมด', count: queueLists.length },
            { id: 'open', label: '🟢 เปิดรับคิว', count: queueLists.filter((q) => q.status === 'open').length },
            { id: 'scheduled', label: '⏰ ตั้งเวลาเปิด', count: scheduledQueuesCount },
            { id: 'in_progress', label: '⏳ กำลังลงดัน', count: queueLists.filter((q) => q.status === 'in_progress').length },
            { id: 'vanished', label: '🌀 มายาสิ้นสูญ', count: queueLists.filter((q) => q.dungeonCategory === 'vanished').length },
            { id: 'apocalypse', label: '⚔️ Apocalypse', count: queueLists.filter((q) => q.dungeonCategory === 'apocalypse').length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 text-white">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LIST OF QUEUES */}
      {displayLists.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-transparent p-14 text-center space-y-3">
          <span className="text-4xl">📋</span>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-300">
            ยังไม่มีรายการคิว
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            กดปุ่ม &ldquo;สร้าง List คิวใหม่&rdquo; ด้านบน เพื่อสร้างคิว มายาสิ้นสูญ หรือ Apocalypse ให้สมาชิกในกิลด์ส่งรายชื่อเข้ามา
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-black text-white shadow-lg transition cursor-pointer"
          >
            + สร้าง List คิวแรก
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayLists.map((queue) => {
            const preset = getQueuePreset(queue.dungeonType);
            const entries = queue.entries || [];
            const isOpen = queue.status === 'open';
            const isInProgress = queue.status === 'in_progress';
            const isClosed = queue.status === 'closed';
            const isScheduled = queue.status === 'scheduled';

            const msUntilOpen = queue.scheduledOpenAt ? new Date(queue.scheduledOpenAt).getTime() - Date.now() : 0;
            const minsUntilOpen = Math.max(0, Math.ceil(msUntilOpen / 60000));
            const preRegCount = queue.preRegisteredMemberIds?.length || 0;

            const partySize = queue.maxPartySize || 5;
            const partiesCount = Math.max(1, Math.ceil(entries.length / partySize));
            const isCapacityFull = !!(queue.maxCapacity && queue.maxCapacity > 0 && entries.length >= queue.maxCapacity);

            return (
              <div
                key={queue.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-4 transition hover:border-slate-400 dark:hover:border-slate-700"
              >
                {/* Header: Title + Status + Actions */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      {preset?.icon || '📋'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-wide truncate">
                          {queue.title}
                        </h3>

                        {/* Level / Difficulty badge */}
                        {preset && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${preset.badgeBg} ${preset.badgeColor} ${preset.badgeBorder}`}>
                            {preset.level || preset.difficulty}
                          </span>
                        )}

                        {/* Status Switcher */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-300 dark:border-slate-700">
                          {isScheduled && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-600 text-white shadow flex items-center gap-1">
                              <span>⏰</span>
                              <span>ตั้งเวลา</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setQueueStatus(queue.id, 'open')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              isOpen
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🟢 เปิดรับ
                          </button>
                          <button
                            type="button"
                            onClick={() => setQueueStatus(queue.id, 'in_progress')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              isInProgress
                                ? 'bg-purple-600 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ⏳ กำลังลง
                          </button>
                          <button
                            type="button"
                            onClick={() => setQueueStatus(queue.id, 'closed')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              isClosed
                                ? 'bg-slate-700 text-white shadow'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🔒 ปิดคิว
                          </button>
                          {isScheduled && (
                            <button
                              type="button"
                              onClick={() => {
                                openScheduledQueueNow(queue.id);
                                showToast('⚡ เปิดคิวและลงชื่อสมาชิกอัตโนมัติเรียบร้อยแล้ว!');
                              }}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow flex items-center gap-1 cursor-pointer active:scale-95 transition"
                              title="เปิดรับคิวและลงชื่อสมาชิกล่วงหน้าทันที"
                            >
                              <span>⚡</span>
                              <span>เปิดทันที</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>
                          👥 จำนวนในคิว: <strong className="text-indigo-400 font-mono">{entries.length}</strong>
                          {queue.maxCapacity ? `/${queue.maxCapacity}` : ''} คน
                        </span>
                        {queue.note && <span>💬 <strong>{queue.note}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Tools */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => setManualAddQueueId(queue.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      title="เพิ่มสมาชิกเข้าคิวนี้แทน"
                    >
                      <span>👤+</span>
                      <span>เพิ่มสมาชิกแทน</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyQueueList(queue)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="คัดลอกรายชื่อส่งใน Discord/LINE"
                    >
                      <span>📋</span>
                      <span>คัดลอกส่ง Discord/LINE</span>
                    </button>

                    {entries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`ล้างรายชื่อคิวทั้งหมดของ "${queue.title}" ใช่หรือไม่?`)) {
                            clearQueueEntries(queue.id);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
                        title="ล้างคิวทั้งหมด"
                      >
                        ล้างคิว
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`คุณแน่ใจว่าต้องการลบ List คิว "${queue.title}" หรือไม่?`)) {
                          deleteQueueList(queue.id);
                        }
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="ลบ List นี้"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* SCHEDULED INFO BANNER (ตั้งเวลาเปิด & สมาชิกลงชื่อล่วงหน้า) */}
                {isScheduled && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 p-3.5 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl shrink-0 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30">
                          ⏰
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                            <span>จะเปิดรับคิวอัตโนมัติในอีก ~{minsUntilOpen} นาที</span>
                            {queue.scheduledOpenAt && (
                              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                ({new Date(queue.scheduledOpenAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                            เมื่อถึงเวลา ระบบจะเปิดรับคิวและลงชื่อสมาชิกที่เลือกไว้ให้อัตโนมัติทันที
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          openScheduledQueueNow(queue.id);
                          showToast('⚡ เปิดคิวและลงชื่อสมาชิกอัตโนมัติเรียบร้อยแล้ว!');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer self-start sm:self-center active:scale-95 shrink-0"
                      >
                        <span>⚡</span>
                        <span>เปิดคิวทันที (Open Now)</span>
                      </button>
                    </div>

                    {/* Pre-registered members preview */}
                    {preRegCount > 0 && (
                      <div className="pt-2 border-t border-amber-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          <span>👥 สมาชิกที่ลงชื่ออัตโนมัติล่วงหน้า ({preRegCount} คน):</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                            จะเข้าคิวอันดับ #{entries.length + 1} - #{entries.length + preRegCount} ทันทีที่เปิด
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {queue.preRegisteredMemberIds?.map((mId, idx) => {
                            const mem = members.find((m) => m.id === mId);
                            return (
                              <span
                                key={mId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200"
                              >
                                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                                  #{idx + 1}
                                </span>
                                <JobEmblem job={mem?.job} size={13} />
                                <span>{mem?.name || 'ไม่ทราบชื่อ'}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* QUEUE ENTRIES AS A CLEAN LIST */}
                {entries.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    ยังไม่มีคนกดต่อคิวในรายการนี้ (สามารถกดปุ่ม &ldquo;👤+ เพิ่มสมาชิกแทน&rdquo; หรือรอสมาชิกกดเข้ามา)
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1 pb-1">
                      <span className="flex items-center gap-1.5">
                        <span>📋</span>
                        <span>รายชื่อในคิว ({entries.length} คน)</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-500">
                        เรียงตามลำดับเวลาที่กดเข้าร่วม · ปรับลำดับได้ด้วยปุ่ม ▲ ▼
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                      {entries.map((entry, idx) => {
                        const timeStr = formatQueueTime(entry.joinedAt);
                        const isDone = !!entry.isCompleted;

                        return (
                          <div
                            key={entry.id}
                            className={`p-3 sm:p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm transition ${
                              isDone
                                ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/30 shadow-md shadow-emerald-500/10'
                                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-slate-400 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : idx === 0
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                    : idx === 1
                                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                    : idx === 2
                                    ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-600/40'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {isDone ? '✓' : `#${idx + 1}`}
                              </span>
                              {entry.memberJob && (
                                <JobEmblem job={entry.memberJob} size={28} />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 font-bold truncate text-slate-900 dark:text-white" title={entry.memberName}>
                                  <span className={`text-sm ${isDone ? 'text-emerald-700 dark:text-emerald-300 font-black' : 'font-extrabold'}`}>
                                    {entry.memberName}
                                  </span>
                                  {isDone && (
                                    <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-600 text-white shadow-sm shrink-0">
                                      ✓ ผ่านแล้ว
                                    </span>
                                  )}
                                </div>
                                {entry.memberJob && (
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                                    {entry.memberJob}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {/* ปุ่มติ๊กถูก (คนนี้ผ่านเรียบร้อย) - High Contrast & Clearly Visible */}
                              <button
                                type="button"
                                onClick={() => {
                                  toggleQueueEntryCompleted(queue.id, entry.id);
                                  showToast(
                                    isDone
                                      ? `ยกเลิกสถานะผ่านของ "${entry.memberName}"`
                                      : `บันทึก "${entry.memberName}" ผ่านเรียบร้อยแล้ว! ✅`
                                  );
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border-2 text-xs font-black transition cursor-pointer active:scale-95 shadow-sm group ${
                                  isDone
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-500/30'
                                    : 'bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border-slate-300 hover:border-emerald-500 dark:border-slate-700 dark:hover:border-emerald-500'
                                }`}
                                title={isDone ? 'ผ่านเรียบร้อยแล้ว (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อติ๊กถูก: คนนี้ผ่านเรียบร้อยแล้ว'}
                              >
                                <span
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black transition ${
                                    isDone
                                      ? 'bg-white text-emerald-700 shadow-inner'
                                      : 'border-2 border-slate-400 group-hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-transparent group-hover:text-emerald-600'
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="text-xs font-extrabold">
                                  {isDone ? 'ผ่านเรียบร้อย' : 'กดผ่าน'}
                                </span>
                              </button>

                              {timeStr && (
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
                                  <span>🕒</span>
                                  <span>{timeStr}</span>
                                </span>
                              )}

                              {/* Entry Controls: Move / Delete */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveEntry(queue.id, idx, 'up')}
                                  className="w-7 h-7 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer flex items-center justify-center transition"
                                  title="เลื่อนคิวขึ้น"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === entries.length - 1}
                                  onClick={() => handleMoveEntry(queue.id, idx, 'down')}
                                  className="w-7 h-7 rounded-lg text-xs font-black text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-25 cursor-pointer flex items-center justify-center transition"
                                  title="เลื่อนคิวลง"
                                >
                                  ▼
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`นำ "${entry.memberName}" ออกจากคิวใช่หรือไม่?`)) {
                                      removeMemberFromQueue(queue.id, entry.id);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-lg text-xs font-black text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer flex items-center justify-center transition ml-0.5"
                                  title="ลบออกจากคิว"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
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

      {/* CREATE QUEUE MODAL */}
      <CreateQueueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(data) => {
          createQueueList(data);
          showToast(`สร้างคิว "${data.title}" เรียบร้อยแล้ว! 🚀`);
        }}
      />

      {/* MANUAL ENROLL MODAL */}
      {manualAddQueueId && activeQueueForAdd && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-[#0d121f] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-extrabold text-base text-white">
                  เพิ่มสมาชิกเข้าคิวแทน
                </h4>
                <p className="text-xs text-slate-400">
                  {activeQueueForAdd.title} ({activeQueueForAdd.entries?.length || 0} คน)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualAddQueueId(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="ค้นหาชื่อตัวละคร หรือ อาชีพ..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredMembersForAdd.map((m) => {
                const isAlready = (activeQueueForAdd.entries || []).some((e) => e.memberId === m.id);

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {m.job && <JobEmblem job={m.job} size={22} />}
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.name}</div>
                        {m.job && <div className="text-[10px] text-slate-400">{m.job}</div>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = addMemberToQueue(activeQueueForAdd.id, m.id);
                        showToast(res.message, !res.success);
                        setManualAddQueueId(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer transition"
                    >
                      {isAlready ? '+ เพิ่มชื่ออีก' : '+ เพิ่มเข้าคิว'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
