'use client';

import React from 'react';
import { Team, Party, LaneKey, FieldZoneKey } from '@/types/party';
import { Member } from '@/types/member';
import { PartyCard } from './PartyCard';

interface TeamSectionProps {
  team: Team;
  parties: Party[];
  members: Member[];
  allTeams: Team[];
  selectedSlot?: { partyId: string; slotIndex: number } | null;
  isReadOnly?: boolean;
  showLane?: boolean;
  onSlotClick?: (partyId: string, slotIndex: number, memberId: string | null) => void;
  onRemoveMember?: (partyId: string, slotIndex: number) => void;
  onClearParty?: (partyId: string) => void;
  onDeleteParty?: (partyId: string) => void;
  onRenameParty?: (partyId: string) => void;
  onChangeLane?: (partyId: string, lane: LaneKey) => void;
  onChangeTeam?: (partyId: string, targetTeamId: string) => void;
  onImportPreset?: (partyId: string) => void;
  onRenameTeam?: (teamId: string) => void;
  onChangeTeamField?: (teamId: string, field: FieldZoneKey) => void;
  onAddParty?: (teamId: string) => void;
  onRenumberParties?: (teamId: string) => void;
  onDeleteTeam?: (teamId: string) => void;
  onExportTeamImage?: (teamId: string) => void;
  onDropMemberToSlot?: (partyId: string, slotIndex: number, payload: { memberId: string; fromPartyId?: string; fromSlotIndex?: number }) => void;
}

export default function TeamSection({
  team,
  parties,
  members,
  allTeams,
  selectedSlot = null,
  isReadOnly = false,
  showLane = true,
  onSlotClick,
  onRemoveMember,
  onClearParty,
  onDeleteParty,
  onRenameParty,
  onChangeLane,
  onChangeTeam,
  onImportPreset,
  onRenameTeam,
  onChangeTeamField,
  onAddParty,
  onRenumberParties,
  onDeleteTeam,
  onExportTeamImage,
  onDropMemberToSlot,
}: TeamSectionProps) {
  // Count total members in this team
  const totalSlots = parties.length * 5;
  const occupiedSlots = parties.reduce((sum, p) => {
    return sum + (p.slots?.filter(Boolean).length || 0);
  }, 0);

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0d121f]/90 p-4 sm:p-5 shadow-md dark:shadow-xl transition-all">
      {/* Team Header */}
      <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800/80 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Team Name, Field Switcher & Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Team Name */}
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-wide">
              {team.name}
            </h2>
            {!isReadOnly && onRenameTeam && (
              <button
                type="button"
                onClick={() => onRenameTeam(team.id)}
                className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                title="เปลี่ยนชื่อทีม"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">เปลี่ยนชื่อ</span>
              </button>
            )}
          </div>

          {/* Field Toggle (สนามหลัก / สนามรอง) */}
          {!isReadOnly && onChangeTeamField ? (
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onChangeTeamField(team.id, 'main')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  team.field === 'main'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>⚔️</span>
                <span>สนามหลัก</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTeamField(team.id, 'sub')}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition cursor-pointer ${
                  team.field === 'sub'
                    ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/40 shadow-sm font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>🛡️</span>
                <span>สนามรอง</span>
              </button>
            </div>
          ) : team.field ? (
            <span
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border ${
                team.field === 'main'
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                  : 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/40'
              }`}
            >
              <span>{team.field === 'main' ? '⚔️ สนามหลัก' : '🛡️ สนามรอง'}</span>
            </span>
          ) : null}

          {/* Stats Badge */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/70 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <span>
              ปาร์ตี้ในทีม: <strong className="text-slate-900 dark:text-white">{parties.length}</strong> ตี้
            </span>
            <span>•</span>
            <span>
              สมาชิก:{' '}
              <strong className={occupiedSlots === totalSlots && totalSlots > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {occupiedSlots}/{totalSlots}
              </strong>{' '}
              คน
            </span>
          </div>
        </div>

        {/* Right: Eye-friendly Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onExportTeamImage && (
            <button
              type="button"
              onClick={() => onExportTeamImage(team.id)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white transition shadow-sm cursor-pointer"
              title="ส่งออกรูปทีม"
            >
              <span>📷</span>
              <span>รูป{team.name}</span>
            </button>
          )}

          {!isReadOnly && onAddParty && (
            <button
              type="button"
              onClick={() => onAddParty(team.id)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-600/25 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-600/40 hover:text-indigo-900 dark:hover:text-white transition shadow-sm cursor-pointer"
            >
              <span>➕</span>
              <span>เพิ่มปาร์ตี้ใน {team.name}</span>
            </button>
          )}

          {!isReadOnly && onRenumberParties && parties.length > 0 && (
            <button
              type="button"
              onClick={() => onRenumberParties(team.id)}
              className="flex items-center gap-1.5 rounded-xl border border-sky-300 dark:border-sky-600/30 bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-900/40 hover:text-sky-900 dark:hover:text-white transition shadow-sm cursor-pointer"
              title="จัดเรียงเลขปาร์ตี้ใหม่ 1 ถึง N"
            >
              <span>🔢</span>
              <span className="hidden sm:inline">รันเลขตี้ 1-N</span>
            </button>
          )}

          {!isReadOnly && onDeleteTeam && (
            <button
              type="button"
              onClick={() => onDeleteTeam(team.id)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-300 dark:border-rose-600/30 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:text-rose-900 dark:hover:text-white transition shadow-sm cursor-pointer"
              title="ลบทีมนี้"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">ลบทีม</span>
            </button>
          )}
        </div>
      </div>

      {/* Party Cards Grid */}
      {parties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-12 text-center bg-slate-50/50 dark:bg-transparent">
          <p className="text-sm text-slate-500 dark:text-slate-400">ยังไม่มีปาร์ตี้ในทีมนี้</p>
          {!isReadOnly && onAddParty && (
            <button
              type="button"
              onClick={() => onAddParty(team.id)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-600/25 px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-600/40 transition"
            >
              <span>➕</span>
              <span>สร้างปาร์ตี้แรก</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
          {parties.map((party) => (
            <PartyCard
              key={party.id}
              party={party}
              teamName={team.name}
              members={members}
              allTeams={allTeams}
              selectedSlot={selectedSlot}
              isReadOnly={isReadOnly}
              showLane={showLane}
              onSlotClick={(slotIdx, memberId) =>
                onSlotClick && onSlotClick(party.id, slotIdx, memberId)
              }
              onRemoveMember={(slotIdx) =>
                onRemoveMember && onRemoveMember(party.id, slotIdx)
              }
              onClearParty={() => onClearParty && onClearParty(party.id)}
              onDeleteParty={() => onDeleteParty && onDeleteParty(party.id)}
              onRenameParty={() => onRenameParty && onRenameParty(party.id)}
              onChangeLane={(lane) => onChangeLane && onChangeLane(party.id, lane)}
              onChangeTeam={(targetTeamId) =>
                onChangeTeam && onChangeTeam(party.id, targetTeamId)
              }
              onImportPreset={() => onImportPreset && onImportPreset(party.id)}
              onDropMemberToSlot={(slotIdx, payload) =>
                onDropMemberToSlot && onDropMemberToSlot(party.id, slotIdx, payload)
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

