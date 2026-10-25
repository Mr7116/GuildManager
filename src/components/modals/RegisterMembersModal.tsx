'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AuctionItem } from '@/types/auction';
import { Member } from '@/types/member';
import JobEmblem from '@/components/tactical/JobEmblem';

interface RegisterMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionItem | null;
  members: Member[];
  onAddMember: (auctionId: string, memberId: string) => void;
  onRemoveMember: (auctionId: string, memberId: string) => void;
  onOpenWheel: () => void;
}

export default function RegisterMembersModal({
  isOpen,
  onClose,
  auction,
  members,
  onAddMember,
  onRemoveMember,
  onOpenWheel,
}: RegisterMembersModalProps) {
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    return auction?.entries || [];
  }, [auction]);

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
          const isCard = auction.itemCategory === 'card' || auction.cardQuality === 'Purple';
          const isRelic = auction.itemCategory === 'relic' || auction.cardQuality === 'Sage';
          const imageSrc = isRelic
            ? `/images/relics/${auction.accessoryIcon}.webp`
            : isCard
            ? `/images/cards/${auction.accessoryIcon}.webp`
            : `/images/accessories/${auction.accessoryIcon}.webp`;

          return (
            <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-inner shrink-0 ${
              isRelic ? 'border-amber-500/30 bg-amber-950/20' : isCard ? 'border-purple-500/30 bg-purple-950/20' : 'border-rose-500/30 bg-rose-950/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center shadow ${
                  isRelic ? 'border-amber-500/40 bg-[#0c1220]' : isCard ? 'border-purple-500/40 bg-[#0c1220]' : 'border-rose-500/40 bg-[#0c1220]'
                }`}>
                  <Image
                    src={imageSrc}
                    alt={auction.accessoryName}
                    width={40}
                    height={40}
                    unoptimized
                    className="object-contain"
                    onError={(e) => {
                      const fallback = isRelic
                        ? `https://roworlddb.com/media/images/hallows/${auction.accessoryIcon}.webp`
                        : `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`;
                      (e.target as HTMLImageElement).src = fallback;
                    }}
                  />
                  {isRelic ? (
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
                    {isRelic ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        🏺 Relic · {auction.cardSlot || 'Sage'}
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
                      : isRelic
                      ? `Relic ${auction.cardSlot || ''}`
                      : isCard
                      ? `การ์ด MVP ${auction.cardSlot || ''}`
                      : 'ไอเทมระดับ Red Lv.90'}
                  </p>
                </div>
              </div>

              {entries.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWheel();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-bold shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>🎡</span>
                  <span>ไปหมุนวงล้อสุ่ม ({entries.length}) ▶</span>
                </button>
              )}
            </div>
          );
        })()}

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
                const isRegistered = registeredIdSet.has(m.id);

                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition ${
                      isRegistered
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

                    {isRegistered ? (
                      <button
                        type="button"
                        onClick={() => onRemoveMember(auction.id, m.id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-bold transition cursor-pointer"
                        title="นำออกจากรายชื่อชิงไอเทม"
                      >
                        ✓ ลงชื่อแล้ว (ลบ)
                      </button>
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
                <span>รายชื่อในวงล้อสุ่ม ({entries.length} คน):</span>
              </label>
              {entries.length > 0 && (
                <span className="text-[11px] text-amber-400 font-semibold font-mono">
                  โอกาส {((1 / entries.length) * 100).toFixed(1)}% / คน
                </span>
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
                {entries.map((entry, idx) => (
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

                    <button
                      type="button"
                      onClick={() => onRemoveMember(auction.id, entry.memberId)}
                      className="text-slate-500 hover:text-rose-400 p-1 text-xs transition cursor-pointer"
                      title="ลบรายชื่อนี้"
                    >
                      ✕
                    </button>
                  </div>
                ))}
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
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

