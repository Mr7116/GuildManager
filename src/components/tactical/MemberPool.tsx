'use client';

import React, { useState, useMemo } from 'react';
import { Member } from '@/types/member';
import { MemberSlot } from './MemberSlot';
import { JOB_LOOKUP } from '@/constants/jobs';

interface MemberPoolProps {
  members: Member[];
  assignedMemberIds: Set<string>;
  selectedMemberId?: string | null;
  selectedFamily?: string | null;
  onSelectMember: (memberId: string) => void;
  onAutoAssign?: () => void;
}

export default function MemberPool({
  members,
  assignedMemberIds,
  selectedMemberId,
  selectedFamily = null,
  onSelectMember,
  onAutoAssign,
}: MemberPoolProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'tank' | 'dps' | 'healer' | 'bard'>('all');
  const [onlyReady, setOnlyReady] = useState(false);

  // Unassigned list
  const unassignedMembers = useMemo(() => {
    return members.filter((m) => !assignedMemberIds.has(m.id));
  }, [members, assignedMemberIds]);

  // Filtered list
  const filteredList = useMemo(() => {
    const query = search.trim().toLowerCase();
    return unassignedMembers.filter((m) => {
      // Search text match
      const nameMatch = m.name?.toLowerCase().includes(query);
      const jobMatch = m.job?.toLowerCase().includes(query);
      if (query && !nameMatch && !jobMatch) return false;

      // Family filter from top Emblem Bar
      if (selectedFamily) {
        const meta = JOB_LOOKUP[m.job?.trim().toLowerCase()];
        if (!meta || meta.familyKey !== selectedFamily) return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        const meta = JOB_LOOKUP[m.job?.trim().toLowerCase()];
        if (!meta || meta.role !== roleFilter) return false;
      }

      // Ready filter
      if (onlyReady && m.status === 'leave') return false;

      return true;
    });
  }, [unassignedMembers, search, selectedFamily, roleFilter, onlyReady]);

  return (
    <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0d121f]/95 p-3.5 sm:p-4 shadow-md dark:shadow-xl">
      {/* Pool Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>สมาชิกที่ยังไม่ได้ลงตี้</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700">
              {unassignedMembers.length}
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">คลิกเลือกชื่อ แล้วคลิกช่องว่างในตี้เพื่อวาง</p>
        </div>

        {onAutoAssign && unassignedMembers.length > 0 && (
          <button
            type="button"
            onClick={onAutoAssign}
            className="flex items-center gap-1 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-600/25 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-600/40 transition cursor-pointer"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">จัดอัตโนมัติ</span>
          </button>
        )}
      </div>

      {/* Search Input & Secondary Filters */}
      <div className="py-2.5 space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ, คลาส, ตำแหน่ง..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">ทุกบทบาท (Role)</option>
            <option value="tank">🛡️ Tank</option>
            <option value="dps">⚔️ DPS</option>
            <option value="healer">💚 Healer</option>
            <option value="bard">🎵 Support / Bard</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyReady(!onlyReady)}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium border transition cursor-pointer ${
              onlyReady
                ? 'bg-emerald-50 dark:bg-emerald-600/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            เฉพาะพร้อมวอร์
          </button>
        </div>
      </div>

      {/* Member List Grid / Scroll */}
      <div className="max-h-[260px] sm:max-h-[360px] lg:max-h-[560px] overflow-y-auto space-y-1.5 pr-1 pt-1 scrollbar-thin">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            {unassignedMembers.length === 0
              ? '🎉 สมาชิกทุกคนมีตี้ครบแล้ว!'
              : 'ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา'}
          </div>
        ) : (
          filteredList.map((m) => {
            const isSelected = selectedMemberId === m.id;
            return (
              <MemberSlot
                key={m.id}
                member={m}
                isSelected={isSelected}
                showRemove={false}
                onClick={() => onSelectMember(m.id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
