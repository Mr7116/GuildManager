'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useGuildStore } from '@/lib/guildStore';
import { getJobMeta } from '@/constants/jobs';
import JobEmblem from '@/components/tactical/JobEmblem';

const QUICK_REASONS = [
  'ติดงาน / ทำโอที',
  'ติดเรียน / อ่านหนังสือสอบ',
  'เดินทางต่างจังหวัด',
  'ธุระครอบครัว',
  'ป่วย / ไม่สบาย',
  'โทรศัพท์ / เน็ตมีปัญหา',
];

export default function LeavePage() {
  const { guildName, members, setMembers, saveToCloud, isSaving, lastSavedAt } = useGuildStore();
  const { isAuthenticated } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [searchLeave, setSearchLeave] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // List of members currently on leave
  const leaveMembers = useMemo(() => {
    return members.filter((m) => m.status === 'leave');
  }, [members]);

  // Filtered leave list for search
  const filteredLeaveList = useMemo(() => {
    const q = searchLeave.trim().toLowerCase();
    return leaveMembers.filter((m) => {
      const matchName = m.name?.toLowerCase().includes(q);
      const matchJob = m.job?.toLowerCase().includes(q);
      const matchReason = m.leaveReason?.toLowerCase().includes(q);
      if (q && !matchName && !matchJob && !matchReason) return false;
      return true;
    });
  }, [leaveMembers, searchLeave]);

  // Submit leave
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setStatusMsg({ text: 'กรุณาเลือกชื่อของคุณ', isError: true });
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) return;

    const dateRangeText = startDate === endDate ? startDate : `${startDate} ถึง ${endDate}`;
    const reasonText = leaveReason.trim() || 'ติดภารกิจ';

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== selectedMemberId) return m;
        return {
          ...m,
          status: 'leave',
          leaveReason: `${reasonText} (${dateRangeText})`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setStatusMsg({
      text: `✅ บันทึกการลาของ "${member.name}" เรียบร้อยแล้ว (${dateRangeText})`,
      isError: false,
    });

    setLeaveReason('');
    setSelectedMemberId('');

    setTimeout(() => {
      saveToCloud();
    }, 100);
  };

  // Cancel leave
  const handleCancelLeave = (memberId: string, memberName: string) => {
    if (!confirm(`ต้องการยกเลิกการลาของ "${memberName}" และกลับมาเป็นสถานะ "พร้อมวอร์" หรือไม่?`)) return;

    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        return {
          ...m,
          status: 'ready',
          leaveReason: undefined,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setStatusMsg({
      text: `🟢 ยกเลิกการลาของ "${memberName}" สำเร็จ กลับมาพร้อมรบแล้ว!`,
      isError: false,
    });

    setTimeout(() => {
      saveToCloud();
    }, 100);
  };

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-[#0d121f]/95 p-4 sm:p-5 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/20 text-xl border border-rose-500/30">
            📝
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              ระบบบันทึกการลาวอร์ — {guildName}
            </h1>
            <p className="text-xs text-slate-400">
              แจ้งลาล่วงหน้าเพื่อความสะดวกในการวางแผนจัดผังทัพกิลด์วอร์
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs text-rose-300 font-bold">
            🔴 ผู้แจ้งลา {leaveMembers.length} คน
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300 font-bold">
            🟢 พร้อมวอร์ {members.length - leaveMembers.length} คน
          </div>
          <Link
            href="/public"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition"
          >
            <span>👀</span>
            <span>ดูผังจัดทีม</span>
          </Link>
          {isAuthenticated ? (
            <Link
              href="/gvg"
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3 py-1.5 text-xs font-bold text-indigo-200 transition"
            >
              <span>⚙️</span>
              <span>หน้าจัดการทัพ (GVG)</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
            >
              <span>🔐</span>
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}
        </div>
      </div>

      {statusMsg && (
        <div
          className={`rounded-2xl border p-3.5 text-center text-xs font-bold ${
            statusMsg.isError
              ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
              : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Main Grid: Left Form + Right Leave List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-800/90 bg-[#0d121f]/95 p-5 space-y-4 shadow-xl"
          >
            <h2 className="text-base font-extrabold text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>✍️ ฟอร์มแจ้งลากิลด์วอร์</span>
              <span className="text-[11px] text-slate-400 font-normal">ทุกสาเหตุไม่มีผลเสีย</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                เลือกชื่อสมาชิกกิลด์ *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- กรุณาเลือกชื่อของคุณ --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.job}) {m.status === 'leave' ? '— [แจ้งลาแล้ว]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ตั้งแต่วันที่ *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ถึงวันที่ *
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                เหตุผลการลา (พิมพ์เอง หรือ เลือกด่วน)
              </label>
              <input
                type="text"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="เช่น ติดงาน, ติดสอบ, ธุระด่วน"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />

              {/* Quick Reason Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setLeaveReason(r)}
                    className="text-[10px] rounded-lg bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl border border-rose-500/40 bg-rose-600/30 hover:bg-rose-600/50 py-2.5 text-xs font-bold text-rose-100 transition shadow-lg shadow-rose-950/40 cursor-pointer"
            >
              🚀 ยืนยันการแจ้งลาวอร์
            </button>
          </form>
        </div>

        {/* Leave List Column */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-800/90 bg-[#0d121f]/95 p-5 space-y-3 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>📋 รายชื่อสมาชิกที่แจ้งลาวอร์</span>
                <span className="rounded-full bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 text-xs text-rose-300 font-bold">
                  {leaveMembers.length} คน
                </span>
              </h2>

              <input
                type="text"
                value={searchLeave}
                onChange={(e) => setSearchLeave(e.target.value)}
                placeholder="ค้นหาชื่อที่แจ้งลา..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredLeaveList.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  {leaveMembers.length === 0
                    ? '🎉 ยังไม่มีสมาชิกแจ้งลา ทุกคนพร้อมรบ 100%!'
                    : 'ไม่พบรายชื่อตามคำค้นหา'}
                </div>
              ) : (
                filteredLeaveList.map((m) => {
                  const meta = getJobMeta(m.job);

                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-2xl border border-rose-900/40 bg-rose-950/20 p-3 hover:bg-rose-950/30 transition gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <JobEmblem jobName={m.job} size={32} />
                        <div className="min-w-0">
                          <span className="text-sm font-extrabold text-white block truncate">
                            {m.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {m.job} • เหตุผล: <span className="text-rose-300 font-medium">{m.leaveReason || 'ติดภารกิจ'}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelLeave(m.id, m.name)}
                        className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition shrink-0 cursor-pointer"
                        title="ยกเลิกการลาและกลับมาพร้อมรบ"
                      >
                        ยกเลิกการลา
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
