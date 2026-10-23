'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useGuildStore } from '@/lib/guildStore';
import TeamSection from '@/components/tactical/TeamSection';
import { PartyCard } from '@/components/tactical/PartyCard';
import { MemberSlot } from '@/components/tactical/MemberSlot';
import JobEmblem from '@/components/tactical/JobEmblem';
import { getJobMeta } from '@/constants/jobs';
import { getGvgLane } from '@/constants/lanes';

export default function PublicPage() {
  const {
    guildName,
    members,
    gvgTeams,
    gvgParties,
    siegeParties,
    polarityParties,
    isLoading,
    loadFromCloud,
  } = useGuildStore();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<'gvg' | 'siege' | 'polarity'>('gvg');
  const [searchQuery, setSearchQuery] = useState('');

  // Search matches
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, searchQuery]);

  // Main & Sub fields for GVG
  const mainTeams = useMemo(() => gvgTeams.filter((t) => t.field === 'main'), [gvgTeams]);
  const subTeams = useMemo(() => gvgTeams.filter((t) => t.field === 'sub'), [gvgTeams]);

  // Helper to find member party assignments
  const getMemberAssignments = (memberId: string) => {
    const gvgParty = gvgParties.find((p) => p.slots?.includes(memberId));
    const gvgTeam = gvgParty ? gvgTeams.find((t) => t.id === gvgParty.teamId) : null;
    const siegeParty = siegeParties.find((p) => p.slots?.includes(memberId));
    const polarityParty = polarityParties.find((p) => p.slots?.includes(memberId));

    return { gvgParty, gvgTeam, siegeParty, polarityParty };
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-[#0d121f]/95 p-4 sm:p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl border border-indigo-500/30">
              🌐
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                มุมมองผังทัพลูกกิลด์ — {guildName}
              </h1>
              <p className="text-xs text-slate-400">
                ตรวจสอบตำแหน่งปาร์ตี้ เลนยุทธศาสตร์ และสถานะกิลด์วอร์แบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadFromCloud}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              <span>🔄</span>
              <span>รีเฟรชข้อมูล</span>
            </button>
            <Link
              href="/leave"
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-semibold text-amber-300 transition"
            >
              <span>🏖️</span>
              <span>แจ้งลากิลด์วอร์</span>
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

        {/* Member Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-xl">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="พิมพ์ชื่อค้นหาปาร์ตี้ของตัวเอง เช่น Legend, Wrist, Mr7116..."
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
          </div>

          {/* Search Result Box */}
          {searchQuery.trim() && (
            <div className="mt-3 space-y-2.5 max-w-2xl">
              {searchResults.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-center text-xs text-rose-400">
                  ❌ ไม่พบสมาชิกที่ชื่อ &quot;{searchQuery}&quot; ในระบบกิลด์
                </div>
              ) : (
                searchResults.slice(0, 4).map((m) => {
                  const meta = getJobMeta(m.job);
                  const { gvgParty, gvgTeam, siegeParty, polarityParty } = getMemberAssignments(m.id);
                  const laneMeta = gvgParty ? getGvgLane(gvgParty.lane) : null;

                  return (
                    <div
                      key={m.id}
                      style={{ backgroundColor: `${meta.hexDark}44`, borderColor: meta.hexBorder }}
                      className="rounded-2xl border p-4 shadow-lg backdrop-blur-sm space-y-3"
                    >
                      {/* Member Info */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <JobEmblem jobName={m.job} size={36} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-extrabold text-white">{m.name}</span>
                              <span style={{ color: meta.hexMain }} className="text-xs font-bold">
                                {m.job}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {m.status === 'leave' ? '🔴 แจ้งลาวอร์' : '🟢 พร้อมลงสนาม'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tactical Positions */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        {/* GVG */}
                        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400">⚔️ GVG ทัพหลัก</span>
                          {gvgParty ? (
                            <div>
                              <div className="font-bold text-white">
                                {gvgTeam?.name} • {gvgParty.name}
                              </div>
                              {laneMeta && (
                                <div className="text-[11px] text-amber-300 flex items-center gap-1 mt-0.5">
                                  <span>{laneMeta.icon}</span>
                                  <span>{laneMeta.name}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">ยังไม่มีตี้ / สำรอง</div>
                          )}
                        </div>

                        {/* Siege */}
                        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-sky-400">🏰 Siege ปราสาท</span>
                          {siegeParty ? (
                            <div className="font-bold text-white">{siegeParty.name}</div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">ยังไม่มีตี้</div>
                          )}
                        </div>

                        {/* Polarity */}
                        <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 space-y-1">
                          <span className="text-[10px] font-bold text-violet-400">✨ Polarity สงครามดาว</span>
                          {polarityParty ? (
                            <div className="font-bold text-white">{polarityParty.name}</div>
                          ) : (
                            <div className="text-slate-500 text-[11px]">ยังไม่มีตี้</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('gvg')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'gvg'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⚔️</span>
            <span>ผังทัพ GVG</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('siege')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'siege'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏰</span>
            <span>Siege War ปราสาท</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('polarity')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
              activeTab === 'polarity'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>✨</span>
            <span>Polarity War สงครามดาว</span>
          </button>
        </div>
      </div>

      {/* Mode View Content (Read-Only) */}
      {activeTab === 'gvg' && (
        <div className="space-y-8">
          {/* Main Field */}
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-amber-200 tracking-wide flex items-center gap-2">
              <span>⚔️ สนามหลัก (Main Field)</span>
            </h2>
            <div className="space-y-6">
              {mainTeams.map((team) => (
                <TeamSection
                  key={team.id}
                  team={team}
                  parties={gvgParties.filter((p) => p.teamId === team.id)}
                  members={members}
                  allTeams={gvgTeams}
                  isReadOnly={true}
                />
              ))}
            </div>
          </div>

          {/* Sub Field */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-extrabold text-violet-200 tracking-wide flex items-center gap-2">
              <span>🛡️ สนามรอง (Sub Field)</span>
            </h2>
            <div className="space-y-6">
              {subTeams.map((team) => (
                <TeamSection
                  key={team.id}
                  team={team}
                  parties={gvgParties.filter((p) => p.teamId === team.id)}
                  members={members}
                  allTeams={gvgTeams}
                  isReadOnly={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'siege' && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-sky-200 tracking-wide flex items-center gap-2">
            <span>🏰 ปาร์ตี้ Siege War ทั้งหมด</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {siegeParties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                teamName="Siege"
                members={members}
                showLane={false}
                isReadOnly={true}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'polarity' && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-violet-200 tracking-wide flex items-center gap-2">
            <span>✨ ปาร์ตี้ Polarity War ทั้งหมด</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {polarityParties.map((party) => (
              <PartyCard
                key={party.id}
                party={party}
                teamName="Polarity"
                members={members}
                showLane={false}
                isReadOnly={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
