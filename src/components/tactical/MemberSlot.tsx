'use client';

import React, { useState } from 'react';
import { Member } from '@/types/member';
import { getJobFamily } from '@/constants/jobs';
import { JobEmblem } from './JobEmblem';

export interface DragMemberPayload {
  memberId: string;
  fromPartyId?: string;
  fromSlotIndex?: number;
}

interface MemberSlotProps {
  member?: Member | null;
  slotIndex?: number;
  partyId?: string;
  isSelected?: boolean;
  isReadOnly?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onDropPayload?: (payload: DragMemberPayload) => void;
  showRemove?: boolean;
  className?: string;
}

export const MemberSlot: React.FC<MemberSlotProps> = ({
  member,
  slotIndex = 0,
  partyId,
  isSelected = false,
  isReadOnly = false,
  onClick,
  onRemove,
  onDropPayload,
  showRemove = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!member || isReadOnly) return;
    const payload: DragMemberPayload = {
      memberId: member.id,
      fromPartyId: partyId,
      fromSlotIndex: slotIndex,
    };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    setIsDragOver(false);
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const payload: DragMemberPayload = JSON.parse(raw);
      if (onDropPayload) {
        onDropPayload(payload);
      }
    } catch (err) {
      console.warn('Drop error:', err);
    }
  };

  if (!member) {
    return (
      <div
        onClick={onClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`h-11 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-950/40 px-2.5 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer transition select-none ${
          isDragOver ? 'ring-2 ring-indigo-400 bg-indigo-500/20 border-indigo-400 scale-[1.01]' : ''
        } ${isSelected ? 'ring-2 ring-amber-400 bg-amber-500/10' : ''} ${className}`}
      >
        <span className="truncate font-medium">+ ช่องว่างที่ {slotIndex + 1} (แตะหรือลากวาง)</span>
        <span className="text-[10px] opacity-60 shrink-0 ml-1">ช่อง {slotIndex + 1}</span>
      </div>
    );
  }

  const fam = getJobFamily(member.job);
  const isLeave = member.status === 'leave';
  const bgTint = fam.cardTintStyle.match(/background-color:\s*([^;]+);/)?.[1] || 'rgba(15,23,42,0.6)';
  const borderTint = fam.cardTintStyle.match(/border-color:\s*([^;]+);/)?.[1] || 'rgba(51,65,85,0.4)';

  return (
    <div
      onClick={onClick}
      draggable={!isReadOnly}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        background: `linear-gradient(${bgTint}, ${bgTint}), var(--slot-base, #ffffff)`,
        borderColor: borderTint
      }}
      className={`py-2 px-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing transition select-none group hover:brightness-105 dark:hover:brightness-110 relative member-slot-card shadow-sm dark:shadow-none ${
        isDragOver ? 'ring-2 ring-indigo-400 scale-[1.02] shadow-lg shadow-indigo-500/30' : ''
      } ${isSelected ? 'ring-2 ring-amber-400 shadow-md shadow-amber-500/20' : ''} ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="shrink-0 flex items-center justify-center">
          <JobEmblem job={member.job} size={32} />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center justify-between gap-2 w-full min-w-0">
            <span
              className={`font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate flex-1 block ${
                isLeave ? 'line-through opacity-75' : ''
              }`}
            >
              {member.name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span style={{ color: fam.hexBorder }} className="font-bold">
              {member.job}
            </span>
            {isLeave && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🏖️ ลา ({member.leaveReason || 'วันนี้'})
              </span>
            )}
          </div>
        </div>
      </div>

      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="ถอดออกจากตี้"
          className="w-6 h-6 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 dark:hover:text-rose-300 text-xs flex items-center justify-center transition shrink-0 ml-1 cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};
