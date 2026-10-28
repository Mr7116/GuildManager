'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import NotFound from '@/app/not-found';
import { useGuildStore } from '@/lib/guildStore';
import { useAuth } from '@/lib/auth';
import JobEmblem from '@/components/tactical/JobEmblem';
import ThemeToggle from '@/components/layout/ThemeToggle';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import LiveClock from '@/components/common/LiveClock';
import { QueueList, formatQueueTime } from '@/types/queue';
import { getQueuePreset } from '@/constants/queuePresets';

interface MemberQueueViewProps {
  onSwitchToAdmin?: () => void;
  requireId?: boolean;
}

export default function MemberQueueView({ onSwitchToAdmin, requireId = false }: MemberQueueViewProps) {
  const {
    guildName,
    members,
    queueLists,
    isLoading,
    addMemberToQueue,
    removeMemberByMemberIdFromQueue,
  } = useGuildStore();

  const { isAuthenticated } = useAuth();

  // Selected member state
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'my' | 'vanished' | 'apocalypse'>('open');
  const [toastMsg, setToastMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [selectedQueueIdFromUrl, setSelectedQueueIdFromUrl] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Read URL query parameter "?id=..." or "?list=..." on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get('id') || params.get('queueId') || params.get('list');
      if (qId) {
        setSelectedQueueIdFromUrl(qId);
      }
    }
  }, []);

  // Live ticker for countdown update every second
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Restore saved member
  useEffect(() => {
    try {
      const saved = localStorage.getItem('Moonz_queue_selected_member');
      if (saved && members.some((m) => m.id === saved)) {
        setSelectedMemberId(saved);
      }
    } catch {}
  }, [members]);

  const handleSelectMember = (id: string) => {
    setSelectedMemberId(id);
    try {
      localStorage.setItem('Moonz_queue_selected_member', id);
    } catch {}
  };

  const currentMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchJob = m.job ? m.job.toLowerCase().includes(q) : false;
      return matchName || matchJob;
    });
  }, [members, memberSearch]);

  const showToast = (text: string, isError = false) => {
    setToastMsg({ text, isError });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  // Lists where current member is joined or pre-registered
  const myQueueLists = useMemo(() => {
    if (!selectedMemberId) return [];
    return queueLists.filter(
      (q) =>
        (q.entries || []).some((e) => e.memberId === selectedMemberId) ||
        (q.status === 'scheduled' && (q.preRegisteredMemberIds || []).includes(selectedMemberId))
    );
  }, [queueLists, selectedMemberId]);

  // Targeted queue from URL ("ใคร list มัน")
  const targetedQueue = useMemo(() => {
    if (!selectedQueueIdFromUrl) return null;
    return queueLists.find((q) => q.id === selectedQueueIdFromUrl) || null;
  }, [queueLists, selectedQueueIdFromUrl]);

  // Filtered queue lists
  const displayLists = useMemo(() => {
    if (selectedQueueIdFromUrl && targetedQueue) {
      return [targetedQueue];
    }
    let lists = [...queueLists];
    if (activeTab === 'open') {
      lists = lists.filter((q) => q.status === 'open' || q.status === 'scheduled');
    } else if (activeTab === 'my') {
      lists = myQueueLists;
    } else if (activeTab === 'vanished') {
      lists = lists.filter((q) => q.dungeonCategory === 'vanished');
    } else if (activeTab === 'apocalypse') {
      lists = lists.filter((q) => q.dungeonCategory === 'apocalypse');
    }
    return lists;
  }, [queueLists, activeTab, myQueueLists, selectedQueueIdFromUrl, targetedQueue]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async (queue: QueueList) => {
    if (!currentMember) {
      showToast('กรุณาเลือกชื่อตัวละครของคุณก่อน', true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (queue.status === 'scheduled') {
      showToast('คิวนี้ยังไม่เปิดรับ กรุณารอเวลาเปิดตามที่กำหนด', true);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await addMemberToQueue(queue.id, currentMember.id);
      showToast(res.message, !res.success);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async (queue: QueueList) => {
    if (!currentMember) return;
    if (window.confirm(`คุณต้องการยกเลิกการต่อคิว "${queue.title}" ใช่หรือไม่?`)) {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const res = await removeMemberByMemberIdFromQueue(queue.id, currentMember.id);
        showToast(res?.message || `ยกเลิกคิว "${queue.title}" เรียบร้อยแล้ว`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // ถ้าเข้าผ่าน URL ที่เจาะจงคิว (?id=...)
  // 1. ระหว่างกำลังโหลดข้อมูลจาก Cloud ให้แสดง Spinner รอ
  if (isLoading && selectedQueueIdFromUrl) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">กำลังค้นหารายการคิว...</p>
      </div>
    );
  }

  // 2. ถ้าโหลดเสร็จแล้ว ไม่พบคิวรหัสนี้ หรือคิวถูกปิดไปแล้ว (status === 'closed') ให้เด้งไปหน้า Error 404
  if (!isLoading && selectedQueueIdFromUrl && (!targetedQueue || targetedQueue.status === 'closed')) {
    return <NotFound />;
  }

  return (
    <>
      {/* Toast Notification (อยู่นอก container หลัก ไม่ดัน space-y-5 ไม่ทำให้หน้าขยับ 100%) */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[9999] pointer-events-none transition-all duration-300 ease-out animate-in fade-in slide-in-from-top-3">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md pointer-events-auto ${
              toastMsg.isError
                ? 'bg-rose-950/95 border-rose-500/60 text-rose-100 shadow-rose-950/50'
                : 'bg-slate-900/95 border-indigo-500/60 text-indigo-100 shadow-indigo-950/50'
            }`}
          >
            <span className="text-base shrink-0">
              {toastMsg.isError ? '⚠️' : '✨'}
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-wide">
              {toastMsg.text}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 space-y-5 pb-16">
        {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-md">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-2xl border border-indigo-500/30 text-indigo-400">
            📋
          </span>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <span>ระบบต่อคิวลงดันเจี้ยน</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                — {guildName}
              </span>
            </h1>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              มายาสิ้นสูญ Lv.75 / Lv.95 และ Apocalypse ทุกระดับ (ไม่ต้อง Login แค่เลือกชื่อตัวเองแล้วกดต่อคิว)
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
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-950/40 transition cursor-pointer"
                >
                  <span>👑</span>
                  <span>โหมดแอดมิน</span>
                </button>
              ) : (
                <Link
                  href="/queue"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-950/40 transition cursor-pointer"
                >
                  <span>👑</span>
                  <span>โหมดแอดมิน</span>
                </Link>
              )
            ) : (
              <Link
                href="/login?redirect=/queue"
                className="flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                <span>🔑</span>
                <span>แอดมิน Login</span>
              </Link>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* STEP 1: CHARACTER SELECTOR */}
      <div className="p-4 rounded-3xl border-2 border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-[#0d121f] shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
            <span>👤</span>
            <span>ขั้นตอนที่ 1: เลือกชื่อตัวละครของคุณ</span>
          </label>

          {currentMember && (
            <button
              type="button"
              onClick={() => {
                setSelectedMemberId('');
                try {
                  localStorage.removeItem('Moonz_queue_selected_member');
                } catch {}
              }}
              className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
            >
              🔄 เปลี่ยนตัวละคร
            </button>
          )}
        </div>

        {currentMember ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-sm shrink-0">
                <JobEmblem job={currentMember.job} size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    {currentMember.name}
                  </span>
                  {currentMember.title && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      {currentMember.title}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 mt-0.5 font-medium">
                  <span>อาชีพ: <strong className="text-slate-900 dark:text-white">{currentMember.job || '-'}</strong></span>
                  <span>•</span>
                  <span>Lv.{currentMember.lv || 1}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="px-3.5 py-1.5 rounded-xl border-2 border-emerald-500 bg-white dark:bg-slate-900 text-xs font-black text-emerald-700 dark:text-emerald-300 shadow-sm">
                กำลังต่อคิวอยู่: <strong className="font-mono text-sm">{myQueueLists.length}</strong> คิว
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="ค้นหาชื่อตัวละคร หรือ อาชีพของคุณ..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
              />

              <select
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- คลิกเลือกชื่อของคุณจากรายชื่อสมาชิก --</option>
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
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-left transition cursor-pointer"
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

      {/* STEP 2: QUEUE LISTS */}
      <div className="space-y-3">
        {/* Filter Tabs (แสดงเฉพาะเมื่อดูรายการรวม) */}
        {!requireId && !selectedQueueIdFromUrl && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-2xl border-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-sm">
            {[
              { id: 'open', label: '🟢 เปิดรับคิวอยู่', count: queueLists.filter((q) => q.status === 'open' || q.status === 'scheduled').length },
              { id: 'vanished', label: '🌀 มายาสิ้นสูญ', count: queueLists.filter((q) => q.dungeonCategory === 'vanished').length },
              { id: 'apocalypse', label: '⚔️ Apocalypse', count: queueLists.filter((q) => q.dungeonCategory === 'apocalypse').length },
              { id: 'my', label: '📌 คิวของฉัน', count: myQueueLists.length },
              { id: 'all', label: 'ทั้งหมด', count: queueLists.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold border border-slate-300 dark:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 text-white font-mono font-bold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {displayLists.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-12 text-center space-y-2 shadow-sm">
            <span className="text-3xl">📋</span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">
              {activeTab === 'open'
                ? 'ยังไม่มีรายการคิวที่เปิดรับในขณะนี้'
                : activeTab === 'my'
                ? 'คุณยังไม่ได้เข้าร่วมในคิวใด'
                : 'ไม่พบรายการคิว'}
            </h4>
            <p className="text-xs text-slate-500">
              กรุณารอแอดมินหรือหัวหน้ากิลด์สร้างและเปิดรับคิวลงดันเจี้ยน
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayLists.map((queue, qIdx) => {
              const preset = getQueuePreset(queue.dungeonType);
              const entries = queue.entries || [];
              const isOpen = queue.status === 'open';
              const isInProgress = queue.status === 'in_progress';
              const isClosed = queue.status === 'closed';
              const isScheduled = queue.status === 'scheduled';

              const msUntilOpen = queue.scheduledOpenAt ? new Date(queue.scheduledOpenAt).getTime() - Date.now() : 0;
              const minsUntilOpen = Math.max(0, Math.ceil(msUntilOpen / 60000));
              const isPreRegistered = selectedMemberId && queue.preRegisteredMemberIds ? queue.preRegisteredMemberIds.includes(selectedMemberId) : false;

              const myEntries = selectedMemberId ? entries.filter((e) => e.memberId === selectedMemberId) : [];
              const myCount = myEntries.length;
              const isJoined = myCount > 0;
              const myIndices = selectedMemberId
                ? entries.map((e, idx) => (e.memberId === selectedMemberId ? idx : -1)).filter((idx) => idx !== -1)
                : [];

              const isCapacityFull = !!(queue.maxCapacity && queue.maxCapacity > 0 && entries.length >= queue.maxCapacity);

              return (
                <div
                  key={queue.id}
                  className={`rounded-3xl border-2 p-4 sm:p-5 transition shadow-md space-y-4 ${
                    isJoined || isPreRegistered
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-[#0d1322] shadow-indigo-500/10'
                      : isScheduled
                      ? 'border-amber-400 dark:border-amber-500/40 bg-amber-50/40 dark:bg-[#13110d]'
                      : isOpen
                      ? 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c101d] hover:border-slate-400'
                      : 'border-slate-300 dark:border-slate-800/80 bg-slate-100/90 dark:bg-[#0a0e18]'
                  }`}
                >
                  {/* Card Header: Title + Status + Action Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl sm:text-3xl shrink-0 p-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm">
                        {preset?.icon || '📋'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-wide truncate">
                            {queue.title}
                          </h3>

                          {/* ID Badge */}
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-400/40 font-bold" title={`รหัสคิว: ${queue.id}`}>
                            #{queue.id}
                          </span>

                          {/* Level / Difficulty badge */}
                          {preset && (
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-black border shadow-sm ${preset.badgeBg} ${preset.badgeColor} ${preset.badgeBorder}`}>
                              {preset.level || preset.difficulty}
                            </span>
                          )}

                          {/* Status Badge */}
                          {isScheduled ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-2 border-amber-500 flex items-center gap-1 shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>⏰ รอเปิดรับคิว (ในอีก ~{minsUntilOpen} นาที)</span>
                            </span>
                          ) : isOpen ? (
                            isCapacityFull ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border-2 border-amber-400 flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>🔒 คิวเต็มแล้ว ({entries.length}/{queue.maxCapacity})</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-500 flex items-center gap-1 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>เปิดรับคิว ({entries.length}{queue.maxCapacity ? `/${queue.maxCapacity}` : ''} คน)</span>
                              </span>
                            )
                          ) : isInProgress ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-2 border-purple-500 flex items-center gap-1 shadow-sm">
                              <span>⏳</span>
                              <span>กำลังลงดันเจี้ยน</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-2 border-slate-400 shadow-sm">
                              🔒 ปิดคิวแล้ว
                            </span>
                          )}
                        </div>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">
                          <span>
                            👥 จำนวนในคิว: <strong className="text-indigo-700 dark:text-indigo-400 font-black font-mono text-sm">{entries.length}</strong>
                            {queue.maxCapacity ? `/${queue.maxCapacity}` : ''} คน
                          </span>
                          {queue.note && <span>💬 หมายเหตุ: <strong className="text-slate-900 dark:text-white">{queue.note}</strong></span>}
                          {isScheduled && queue.scheduledOpenAt && (
                            <span className="text-amber-700 dark:text-amber-300 font-semibold">
                              ⏰ เปิดเวลา: {new Date(queue.scheduledOpenAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button for Member */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}/queue/join?id=${queue.id}`;
                          navigator.clipboard.writeText(url);
                          showToast(`คัดลอกลิงก์คิว "${queue.title}" แล้ว! 🔗 (รหัส: ${queue.id})`);
                        }}
                        className="p-2 sm:px-3 sm:py-2 rounded-xl border border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm shrink-0"
                        title="คัดลอกลิงก์เฉพาะ List คิวนี้ เพื่อส่งให้เพื่อนเข้าต่อคิวได้ทันที"
                      >
                        <span>🔗</span>
                        <span className="hidden sm:inline">คัดลอกลิงก์</span>
                      </button>
                      {isScheduled ? (
                        isPreRegistered ? (
                          <span className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
                            <span>👑</span>
                            <span>อยู่ในรายชื่อลงชื่ออัตโนมัติแล้ว!</span>
                          </span>
                        ) : (
                          <span className="px-3.5 py-2 rounded-xl border-2 border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                            <span>⏰</span>
                            <span>รอเปิดรับ (ในอีก ~{minsUntilOpen} นาที)</span>
                          </span>
                        )
                      ) : isOpen ? (
                        isJoined ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md">
                              <span>✅</span>
                              <span>
                                อยู่ในคิวแล้ว (อันดับ {myIndices.map(i => `#${i + 1}`).join(', ')})
                              </span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleLeave(queue)}
                              className="px-3 py-2 rounded-xl border-2 border-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                              title="ยกเลิกการต่อคิวนี้"
                            >
                              ✕ ยกเลิกคิว
                            </button>
                          </div>
                        ) : isCapacityFull ? (
                          <span className="px-3.5 py-2 rounded-xl border-2 border-rose-400 bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-xs font-black flex items-center gap-1 shadow-sm">
                            <span>🔒</span>
                            <span>คิวเต็มแล้ว ({entries.length}/{queue.maxCapacity})</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoin(queue)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                          >
                            <span>+</span>
                            <span>กดต่อคิวนี้</span>
                          </button>
                        )
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold">
                          🔒 ปิดรับคิว
                        </span>
                      )}
                    </div>
                  </div>

                  {/* QUEUE ENTRIES AS A CLEAN LIST */}
                  {entries.length === 0 ? (
                    isScheduled ? (
                      <div className="p-6 text-center text-xs font-bold text-amber-700 dark:text-amber-300 border-2 border-dashed border-amber-400/50 rounded-2xl bg-amber-500/5">
                        <div className="text-sm">⏰ คิวนี้ตั้งเวลาเปิดอัตโนมัติ</div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-transparent">
                        ยังไม่มีคนกดต่อคิวในรายการนี้ เป็นคนแรกที่กดเข้าร่วมได้เลย! 🚀
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200 px-1 pb-1">
                        <span className="flex items-center gap-1.5 text-sm font-black">
                          <span>📋</span>
                          <span>รายชื่อผู้ต่อคิว ({entries.length} คน)</span>
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          เรียงตามลำดับเวลาที่กดเข้าร่วม (มาก่อนได้ก่อน)
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                        {entries.map((entry, idx) => {
                          const isMe = entry.memberId === selectedMemberId;
                          const timeStr = formatQueueTime(entry.joinedAt);
                          const isDone = !!entry.isCompleted;

                          return (
                            <div
                              key={entry.id}
                              className={`p-3 sm:p-3.5 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs sm:text-sm transition ${
                                isDone
                                  ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/30 shadow-sm'
                                  : isMe
                                  ? 'border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/30 shadow-sm ring-1 ring-indigo-500/30'
                                  : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-sm hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                    isDone
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : idx === 0
                                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                      : idx === 1
                                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300'
                                      : idx === 2
                                      ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500 border border-amber-600/40'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300'
                                  }`}
                                >
                                  {isDone ? '✓' : `#${idx + 1}`}
                                </span>
                                {entry.memberJob && (
                                  <div className="shrink-0">
                                    <JobEmblem job={entry.memberJob} size={28} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 font-black truncate text-slate-900 dark:text-white">
                                    <span className={`text-sm sm:text-base truncate ${isDone ? 'text-emerald-700 dark:text-emerald-300 font-black' : ''}`}>
                                      {entry.memberName}
                                    </span>
                                    {isMe && (
                                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-indigo-600 text-white shadow-sm shrink-0">
                                        (คุณ)
                                      </span>
                                    )}
                                    {isDone && (
                                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-600 text-white shadow-sm shrink-0 flex items-center gap-1">
                                        ✓ ผ่านแล้ว
                                      </span>
                                    )}
                                  </div>
                                  {entry.memberJob && (
                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">
                                      {entry.memberJob}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                                {timeStr && (
                                  <span className="text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 font-bold font-mono flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-sm shrink-0">
                                    <span>🕒</span>
                                    <span>{timeStr}</span>
                                  </span>
                                )}
                                {isMe && isOpen && (
                                  <button
                                    type="button"
                                    onClick={() => handleLeave(queue)}
                                    className="px-3 py-1.5 rounded-xl border-2 border-rose-400 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black shadow-sm transition cursor-pointer active:scale-95 shrink-0"
                                    title="ยกเลิกการต่อคิวนี้"
                                  >
                                    ✕ ออกจากคิว
                                  </button>
                                )}
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
      </div>
    </div>
    </>
  );
}

