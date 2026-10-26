'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AuctionItem, formatRegistrationTime, isTitleItem, isChestItem } from '@/types/auction';
import { Member } from '@/types/member';
import JobEmblem from '@/components/tactical/JobEmblem';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { getTitleTierStyle } from '@/constants/titleItems';
import { getChestTierStyle } from '@/constants/chestItems';
import { getPetTierStyle } from '@/constants/petItems';

interface RegisterMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionItem | null;
  members: Member[];
  onAddMember: (auctionId: string, memberId: string) => void;
  onRemoveMember: (auctionId: string, memberId: string) => void;
  onRemoveOneMember?: (auctionId: string, memberId: string) => void;
  onRemoveEntry?: (auctionId: string, entryId: string) => void;
  onUpdateMaxEntries?: (auctionId: string, maxEntries?: number) => void;
  onConfirmWinners?: (auctionId: string) => void;
  onOpenWheel: () => void;
}

export default function RegisterMembersModal({
  isOpen,
  onClose,
  auction,
  members,
  onAddMember,
  onRemoveMember,
  onRemoveOneMember,
  onRemoveEntry,
  onUpdateMaxEntries,
  onConfirmWinners,
  onOpenWheel,
}: RegisterMembersModalProps) {
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    return auction?.entries || [];
  }, [auction]);

  const maxLimit = auction?.maxEntries && auction.maxEntries > 0 ? auction.maxEntries : undefined;
  const isQuotaFull = maxLimit !== undefined && entries.length >= maxLimit;
  const isTitle = isTitleItem(auction);
  const isChest = isChestItem(auction);

  const registeredIdSet = useMemo(() => {
    return new Set(entries.map((e) => e.memberId));
  }, [entries]);

  // Filter guild members
  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const matchName = m.name.toLowerCase().includes(q);
      const matchJob = m.job ? m.job.toLowerCase().includes(q) : false;
      return matchName || matchJob;
    });
  }, [members, search]);

  if (!isOpen || !auction) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-rose-500/30 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-xl border border-amber-500/40 text-amber-400">
              👥
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>รายชื่อสมาชิกที่ต้องการไอเทมนี้</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  {entries.length} คน
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                เลือกสมาชิกในกิลด์ที่ส่งรายชื่อเข้ามาเพื่อเตรียมนำไปหมุนในวงล้อสุ่ม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Item Summary Bar */}
        {(() => {
          const isTitle = isTitleItem(auction);
          const isChest = isChestItem(auction);
          const isPet = !isTitle && !isChest && (auction.itemCategory === 'pet' || (auction.cardSlot && auction.cardSlot.includes('สัตว์เลี้ยง')) || (auction.cardQuality && auction.cardQuality.startsWith('Pet')));
          const isRelic = !isTitle && !isChest && !isPet && (auction.itemCategory === 'relic' || auction.cardQuality === 'Sage');
          const isCard = !isTitle && !isChest && !isPet && !isRelic && (auction.itemCategory === 'card' || auction.cardQuality === 'Purple');
          const titleTier = isTitle ? getTitleTierStyle(auction.accessoryIcon || auction.accessoryName || auction.cardQuality) : null;
          const chestTier = isChest ? getChestTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const petTier = isPet ? getPetTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const imageSrc = isTitle
            ? `/images/titles/${auction.accessoryIcon}.webp`
            : isChest
            ? `/images/chests/${auction.accessoryIcon}.webp`
            : isPet
            ? `/images/pets/${auction.accessoryIcon}.webp`
            : isRelic
            ? `/images/relics/${auction.accessoryIcon}.webp`
            : isCard
            ? `/images/cards/${auction.accessoryIcon}.webp`
            : `/images/accessories/${auction.accessoryIcon}.webp`;

          return (
            <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-inner shrink-0 ${
              isTitle ? `${titleTier?.border} ${titleTier?.bg}` : isChest ? `${chestTier?.border} ${chestTier?.bg}` : isPet ? `${petTier?.border} ${petTier?.bg}` : isRelic ? 'border-amber-500/30 bg-amber-950/20' : isCard ? 'border-purple-500/30 bg-purple-950/20' : 'border-rose-500/30 bg-rose-950/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center shadow ${
                  isTitle ? `${titleTier?.border} bg-[#0c1220]` : isChest ? `${chestTier?.border} bg-[#0c1220]` : isPet ? `${petTier?.border} bg-[#0c1220]` : isRelic ? 'border-amber-500/40 bg-[#0c1220]' : isCard ? 'border-purple-500/40 bg-[#0c1220]' : 'border-rose-500/40 bg-[#0c1220]'
                }`}>
                  <Image
                    src={imageSrc}
                    alt={auction.accessoryName}
                    width={40}
                    height={40}
                    unoptimized
                    className="object-contain drop-shadow"
                    onError={(e) => {
                      const fallback = isTitle
                        ? `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`
                        : isChest
                        ? (auction.accessoryIcon.includes('title_chest')
                            ? `/images/chests/${auction.accessoryIcon}.svg`
                            : auction.accessoryIcon.includes('stonebox') || auction.accessoryIcon.includes('gem')
                            ? `https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp`
                            : `https://roworlddb.com/media/images/item/icon_item_bx_fy.webp`)
                        : isPet
                        ? (auction.accessoryIcon.includes('mfmm')
                            ? `https://roworlddb.com/media/images/icon/pet/${auction.accessoryIcon}.webp`
                            : `https://roworlddb.com/media/images/pet/${auction.accessoryIcon}.webp`)
                        : isRelic
                        ? `https://roworlddb.com/media/images/hallows/${auction.accessoryIcon}.webp`
                        : `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`;
                      (e.target as HTMLImageElement).src = fallback;
                    }}
                  />
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
                      {auction.cardSlot || 'MVP'}
                    </span>
                  ) : (
                    auction.accessoryLevel && (
                      <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[8px] font-bold bg-black/90 border border-slate-700 text-amber-300 font-mono">
                        Lv.{auction.accessoryLevel}
                      </span>
                    )
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-white">{auction.accessoryName}</h4>
                    {isTitle ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                        <TitleSvgIcon className="w-3 h-3" />
                        <span>{auction.cardQuality || titleTier?.label}</span>
                      </span>
                    ) : isChest ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                        <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                        <span>{auction.cardQuality || chestTier?.label}</span>
                      </span>
                    ) : isPet ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                        <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                        <span>{auction.cardQuality || petTier?.label}</span>
                      </span>
                    ) : isRelic ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <RelicSvgIcon className="w-3 h-3" />
                        <span>Relic · {auction.cardSlot || 'Sage'}</span>
                      </span>
                    ) : isCard ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        🃏 MVP ม่วง · {auction.cardSlot || 'การ์ด'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        💎 Red
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {auction.sourceNote
                      ? `🏷️ ${auction.sourceNote}`
                      : isTitle
                      ? `${auction.cardQuality || 'ไอเทม Title'}`
                      : isRelic
                      ? `Relic ${auction.cardSlot || ''}`
                      : isCard
                      ? `การ์ด MVP ${auction.cardSlot || ''}`
                      : 'ไอเทมระดับ Red Lv.90'}
                  </p>
                </div>
              </div>

              {entries.length > 0 && (
                isTitle ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `ยืนยันผู้ชนะ Title "${auction.accessoryName}" ทั้งหมด ${entries.length} ชิ้นตามรายชื่อที่ขอเข้ามาใช่หรือไม่?`
                        )
                      ) {
                        onConfirmWinners?.(auction.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                    title="ยืนยันผู้ชนะตามจำนวนที่ขอเข้ามาทุกคน โดยไม่ต้องสุ่มวงล้อ"
                  >
                    <span>🏆</span>
                    <span>กดยืนยันผู้ชนะ ({entries.length} ชิ้น) ▶</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `ยืนยันผู้ชนะ "${auction.accessoryName}" ทั้งหมด ${entries.length} คนตามรายชื่อที่ลงทะเบียนโดยตรง (ไม่ต้องหมุนสุ่ม) ใช่หรือไม่?`
                          )
                        ) {
                          onConfirmWinners?.(auction.id);
                          onClose();
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      title="ยืนยันผู้ชนะโดยตรงตามคิวลงชื่อ"
                    >
                      <span>🏆</span>
                      <span>ยืนยันผู้ชนะ ({entries.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWheel();
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>🎡</span>
                      <span>ไปหมุนวงล้อสุ่ม ({entries.length}{maxLimit ? `/${maxLimit}` : ''}) ▶</span>
                    </button>
                  </div>
                )
              )}
            </div>
          );
        })()}

        {/* Quota Setting Bar for Admin */}
        {onUpdateMaxEntries && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl border border-slate-800 bg-slate-950/70 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">🔒 โควตาจำกัดคนลงชื่อ:</span>
              <span className="text-amber-400 font-mono font-bold">
                {maxLimit ? `${entries.length} / ${maxLimit} คน` : `${entries.length} คน (ไม่จำกัด)`}
              </span>
              {isQuotaFull && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  เต็มโควตาแล้ว
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onUpdateMaxEntries(auction.id, undefined)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  !maxLimit
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                ไม่จำกัด
              </button>
              <button
                type="button"
                onClick={() => onUpdateMaxEntries(auction.id, 1)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  maxLimit === 1
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                ⚡ 1 คน (0/1)
              </button>
              <button
                type="button"
                onClick={() => onUpdateMaxEntries(auction.id, 24)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  maxLimit === 24
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                👑 24 คน (0/24)
              </button>
              <button
                type="button"
                onClick={() => onUpdateMaxEntries(auction.id, 3)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  maxLimit === 3
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                3 คน
              </button>
              <div className="flex items-center gap-1 pl-1">
                <span className="text-[10px] text-slate-500">ระบุ:</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  placeholder="จำนวน"
                  value={maxLimit && ![1, 2, 3].includes(maxLimit) ? maxLimit : ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onUpdateMaxEntries(auction.id, isNaN(val) || val <= 0 ? undefined : val);
                  }}
                  className="w-14 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-white text-center focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Two-Column Grid: Members Selector & Enrolled List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[300px]">
          {/* Left Column: Guild Members Search & Add */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#090d18] p-3 space-y-2.5 overflow-hidden">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <label className="text-xs font-bold text-slate-300">
                สมาชิกในกิลด์ ({filteredMembers.length} คน):
              </label>
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรืออาชีพ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none w-40"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredMembers.map((m) => {
                const memberEntries = entries.filter((e) => e.memberId === m.id);
                const memberCount = memberEntries.length;

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition ${
                      memberCount > 0
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {m.job && <JobEmblem job={m.job} size={22} />}
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{m.name}</div>
                        {m.job && <div className="text-[10px] text-slate-400">{m.job}</div>}
                      </div>
                    </div>

                    {memberCount > 0 ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          {isTitle ? `x${memberCount}` : 'ลงชื่อแล้ว'}
                        </span>
                        {isTitle && !isQuotaFull && (
                          <button
                            type="button"
                            onClick={() => onAddMember(auction.id, m.id)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 hover:text-white border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition cursor-pointer"
                            title="เพิ่มชื่อสมาชิกนี้อีก 1 รายการ"
                          >
                            +1
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isTitle && onRemoveOneMember && memberCount > 1) {
                              onRemoveOneMember(auction.id, m.id);
                            } else {
                              onRemoveMember(auction.id, m.id);
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[10px] font-bold transition cursor-pointer"
                          title={isTitle && memberCount > 1 ? 'ลดลง 1 รายการ' : 'ลบรายชื่อนี้ออก'}
                        >
                          {isTitle && memberCount > 1 ? '-1' : 'ลบ'}
                        </button>
                      </div>
                    ) : isQuotaFull ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-[11px] font-medium cursor-not-allowed">
                        🔒 โควตาเต็ม
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddMember(auction.id, m.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        + เพิ่มชื่อ
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Currently Registered List */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-[#090d18] p-3 space-y-2.5 overflow-hidden">
            <div className="flex items-center justify-between shrink-0">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>
                  {isTitle
                    ? `รายชื่อผู้ได้รับสิทธิ์ Title (${entries.length}${maxLimit ? `/${maxLimit}` : ''} ชิ้น):`
                    : `รายชื่อในวงล้อสุ่ม (${entries.length}${maxLimit ? `/${maxLimit}` : ''} คน):`}
                </span>
                {maxLimit && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    โควตา {maxLimit} {isTitle ? 'ชิ้น' : 'คน'}
                  </span>
                )}
              </label>
              {entries.length > 0 && (
                isTitle ? (
                  <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                    <span>⚡</span>
                    <span>ได้รับสิทธิ์ทุกคน (ไม่ต้องสุ่ม)</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400 font-semibold font-mono">
                    โอกาส {((1 / entries.length) * 100).toFixed(1)}% / คน
                  </span>
                )
              )}
            </div>

            {entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-1.5">
                <span className="text-2xl">📝</span>
                <p className="font-semibold text-slate-400">ยังไม่มีรายชื่อที่ลงทะเบียน</p>
                <p>กดปุ่ม &ldquo;+ เพิ่มชื่อ&rdquo; จากรายการด้านซ้ายเพื่อเพิ่มสมาชิกที่จะร่วมหมุนวงล้อ</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                {entries.map((entry, idx) => {
                  const regTime = formatRegistrationTime(entry.registeredAt);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-[#0d121f] hover:border-slate-700 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 font-mono font-bold text-slate-500 text-right shrink-0">
                          {idx + 1}.
                        </span>
                        {entry.memberJob && <JobEmblem job={entry.memberJob} size={22} />}
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">{entry.memberName}</div>
                          {entry.memberJob && (
                            <div className="text-[10px] text-slate-400">{entry.memberJob}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {regTime && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            <span>🕒</span>
                            <span>{regTime}</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (onRemoveEntry) {
                              onRemoveEntry(auction.id, entry.id);
                            } else {
                              onRemoveMember(auction.id, entry.memberId);
                            }
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 text-xs transition cursor-pointer"
                          title="ลบรายการนี้"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <div className="text-xs text-slate-400">
            ลงชื่อทั้งหมด:{' '}
            <strong className="text-white font-mono text-sm">{entries.length}</strong> คน
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              ปิด
            </button>

            {entries.length > 0 && (
              isTitle ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `ยืนยันผู้ชนะ Title "${auction.accessoryName}" ทั้งหมด ${entries.length} ชิ้นตามรายชื่อที่ขอเข้ามาใช่หรือไม่?`
                      )
                    ) {
                      onConfirmWinners?.(auction.id);
                      onClose();
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-xs font-black text-slate-950 shadow-xl shadow-amber-950/50 flex items-center gap-2 transition cursor-pointer active:scale-95"
                >
                  <span className="text-base">🏆</span>
                  <span>กดยืนยันผู้ชนะ ({entries.length} ชิ้นตามที่ขอ)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `ยืนยันผู้ชนะ "${auction.accessoryName}" ทั้งหมด ${entries.length} คนตามรายชื่อที่ลงทะเบียนโดยตรง (ไม่ต้องหมุนสุ่ม) ใช่หรือไม่?`
                        )
                      ) {
                        onConfirmWinners?.(auction.id);
                        onClose();
                      }
                    }}
                    className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-300 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🏆</span>
                    <span>ยืนยันผู้ชนะโดยตรง</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenWheel();
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-xs font-extrabold text-white shadow-lg shadow-rose-950/40 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>🎡</span>
                    <span>เปิดวงล้อสุ่มผู้โชคดี!</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

