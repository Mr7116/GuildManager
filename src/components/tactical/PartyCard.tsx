import React from 'react';
import { Party, Team, LaneKey } from '@/types/party';
import { Member } from '@/types/member';
import { GVG_LANES, getGvgLane } from '@/constants/lanes';
import { MemberSlot } from './MemberSlot';
import { getTeamColorConfig } from '@/constants/teamColors';

interface PartyCardProps {
  party: Party;
  teamName: string;
  teamColor?: string;
  showTeamColor?: boolean;
  members: Member[];
  allTeams?: Team[];
  selectedSlot?: { partyId: string; slotIndex: number } | null;
  isReadOnly?: boolean;
  showLane?: boolean;
  onSlotClick?: (slotIndex: number, memberId: string | null) => void;
  onRemoveMember?: (slotIndex: number) => void;
  onClearParty?: () => void;
  onDeleteParty?: () => void;
  onRenameParty?: () => void;
  onChangeLane?: (lane: LaneKey) => void;
  onChangeTeam?: (teamId: string) => void;
  onImportPreset?: () => void;
  onDropMemberToSlot?: (targetSlotIndex: number, payload: { memberId: string; fromPartyId?: string; fromSlotIndex?: number }) => void;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  party,
  teamName,
  teamColor,
  showTeamColor = false,
  members,
  allTeams = [],
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
  onDropMemberToSlot
}) => {
  const partySlots = party.slots || [null, null, null, null, null];
  const filledMembers = partySlots.map(id => (id ? members.find(m => m.id === id) : null)).filter(Boolean);
  const laneMeta = getGvgLane(party.lane);
  const currentTeam = allTeams.find((t) => t.id === party.teamId);
  const teamColorCfg = getTeamColorConfig(currentTeam?.color || teamColor);

  return (
    <div className="bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md dark:shadow-lg overflow-hidden">
      {/* Party Card Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800/90 pb-2.5 bg-slate-50/80 dark:bg-slate-900/60 -mx-3 -mt-3 p-3 rounded-t-2xl">
        {/* Line 1: Party Name & Quick Actions */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-wide truncate">
              {party.name}
            </span>
            {!isReadOnly && onRenameParty && (
              <button
                type="button"
                onClick={onRenameParty}
                title="เปลี่ยนชื่อปาร์ตี้"
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs p-1 rounded-md hover:bg-slate-200/80 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
              >
                ✏️
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 shrink-0">
            {!isReadOnly && onImportPreset && (
              <button
                type="button"
                onClick={onImportPreset}
                title="ดึงสมาชิกจากตี้ประจำ"
                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/35 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <span>📥</span>
                <span className="hidden sm:inline">ตี้ประจำ</span>
              </button>
            )}
            {!isReadOnly && filledMembers.length > 0 && onClearParty && (
              <button
                type="button"
                onClick={onClearParty}
                title="ถอดสมาชิกทั้งหมดออกจากตี้"
                className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium transition cursor-pointer"
              >
                ล้าง
              </button>
            )}
            {!isReadOnly && onDeleteParty && (
              <button
                type="button"
                onClick={onDeleteParty}
                title="ลบปาร์ตี้นี้"
                className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/30 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center justify-center text-xs transition cursor-pointer"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Line 2: Team Identity */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          {showTeamColor ? (
            <span
              title={teamName}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border truncate max-w-full flex items-center gap-1.5 ${teamColorCfg.badgeClass}`}
            >
              <span
                style={{ backgroundColor: teamColorCfg.hex }}
                className="w-2 h-2 rounded-full shrink-0"
              />
              <span className="truncate">{teamName}</span>
            </span>
          ) : (
            <span
              title={teamName}
              className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300/70 dark:border-slate-700 truncate max-w-full"
            >
              {teamName}
            </span>
          )}
        </div>

        {/* Line 3: Move Team Dropdown (New Row) */}
        {!isReadOnly && onChangeTeam && allTeams.length > 1 && (
          <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-medium">ย้ายไป:</span>
            <select
              value={party.teamId}
              onChange={(e) => onChangeTeam(e.target.value)}
              className="flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200 focus:outline-none truncate cursor-pointer font-medium"
            >
              {allTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Line 3: Tactical Controls (Lane - GVG only) */}
        {showLane && (
          <div className="pt-0.5">
            {!isReadOnly && onChangeLane ? (
              <select
                value={party.lane || 'lane_mid'}
                onChange={(e) => onChangeLane(e.target.value as LaneKey)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-700 dark:text-amber-300 focus:outline-none truncate cursor-pointer font-medium"
              >
                {GVG_LANES.map(ln => (
                  <option key={ln.key} value={ln.key}>
                    {ln.icon} {ln.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{ borderColor: `${laneMeta.hexAccent}88`, color: laneMeta.hexAccent }}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-950/70 border shrink-0 flex items-center justify-center gap-1 w-full"
              >
                <span>{laneMeta.icon}</span>
                <span>{laneMeta.name}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5 Member Slots */}
      <div className="space-y-1.5 flex-1">
        {partySlots.map((mId, slotIdx) => {
          const m = mId ? members.find(x => x.id === mId) : null;
          const isSelected = selectedSlot?.partyId === party.id && selectedSlot?.slotIndex === slotIdx;
          return (
            <MemberSlot
              key={slotIdx}
              slotIndex={slotIdx}
              partyId={party.id}
              member={m}
              isSelected={isSelected}
              isReadOnly={isReadOnly}
              showRemove={!isReadOnly}
              onClick={() => onSlotClick && onSlotClick(slotIdx, mId)}
              onRemove={() => onRemoveMember && onRemoveMember(slotIdx)}
              onDropPayload={(payload) =>
                onDropMemberToSlot && onDropMemberToSlot(slotIdx, payload)
              }
            />
          );
        })}
      </div>
    </div>
  );
};

