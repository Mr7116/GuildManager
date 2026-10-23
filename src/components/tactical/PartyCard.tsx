import React from 'react';
import { Party, Team, LaneKey } from '@/types/party';
import { Member } from '@/types/member';
import { GVG_LANES, getGvgLane } from '@/constants/lanes';
import { MemberSlot } from './MemberSlot';

interface PartyCardProps {
  party: Party;
  teamName: string;
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
  onDropMemberToSlot?: (targetSlotIndex: number, payload: { memberId: string; fromPartyId?: string; fromSlotIndex?: number }) => void;
}

export const PartyCard: React.FC<PartyCardProps> = ({
  party,
  teamName,
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
  onDropMemberToSlot
}) => {
  const partySlots = party.slots || [null, null, null, null, null];
  const filledMembers = partySlots.map(id => (id ? members.find(m => m.id === id) : null)).filter(Boolean);
  const laneMeta = getGvgLane(party.lane);

  return (
    <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg">
      {/* Party Card Header */}
      <div className="flex flex-col gap-1.5 border-b border-slate-800/90 pb-2 bg-slate-900/60 -mx-3 -mt-3 px-3 pt-2.5 rounded-t-2xl">
        {/* Line 1: Team & Stats */}
        <div className="flex items-center justify-between gap-1 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
            {teamName}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-emerald-400 font-extrabold text-xs mr-1">{filledMembers.length}/5 คน</span>
            {!isReadOnly && filledMembers.length > 0 && onClearParty && (
              <button
                type="button"
                onClick={onClearParty}
                title="ถอดสมาชิกทั้งหมดออกจากตี้"
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
              >
                ล้าง
              </button>
            )}
            {!isReadOnly && onDeleteParty && (
              <button
                type="button"
                onClick={onDeleteParty}
                title="ลบปาร์ตี้นี้"
                className="px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] transition"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Line 2: Party Name & Controls (Move Team right behind Party Name) */}
        <div className="flex items-center justify-between gap-1.5 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-wide truncate shrink-0">
              {party.name}
            </span>
            {!isReadOnly && onChangeTeam && allTeams.length > 0 && (
              <select
                value={party.teamId}
                onChange={(e) => onChangeTeam(e.target.value)}
                className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[125px] truncate cursor-pointer shrink-0"
              >
                {allTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    ย้ายไป: {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isReadOnly && onRenameParty && (
            <button
              type="button"
              onClick={onRenameParty}
              title="เปลี่ยนชื่อปาร์ตี้"
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition shrink-0"
            >
              ✏️
            </button>
          )}
        </div>

        {/* Line 3: Tactical Controls (Lane) placed below Party Name */}
        {showLane && (
          <div className="pt-0.5">
            {!isReadOnly && onChangeLane ? (
              <select
                value={party.lane || 'lane_mid'}
                onChange={(e) => onChangeLane(e.target.value as LaneKey)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-amber-300 focus:outline-none truncate cursor-pointer"
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
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-950/70 border shrink-0 flex items-center justify-center gap-1 w-full"
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

