'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AuctionItem } from '@/types/auction';
import JobEmblem from '@/components/tactical/JobEmblem';

interface BidHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionItem | null;
}

export default function BidHistoryModal({ isOpen, onClose, auction }: BidHistoryModalProps) {
  if (!isOpen || !auction) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-lg border border-indigo-500/30 text-indigo-300">
              📜
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                ประวัติการเสนอราคา (Bid History)
              </h3>
              <p className="text-xs text-slate-400">
                รายการเคาะราคาทั้งหมด {auction.bids.length} ครั้ง
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Item Summary Bar */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/70 shrink-0">
          <div className="relative w-12 h-12 shrink-0 rounded-xl border border-rose-500/40 bg-[#0c1220] flex items-center justify-center">
            <Image
              src={`/images/accessories/${auction.accessoryIcon}.webp`}
              alt={auction.accessoryName}
              width={40}
              height={40}
              unoptimized
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-white truncate">{auction.accessoryName}</h4>
              {auction.accessoryLevel && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Lv.{auction.accessoryLevel}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              ราคาเริ่มต้น: <span className="font-mono text-slate-300">{auction.startPrice.toLocaleString()}</span> • ราคาปัจจุบัน:{' '}
              <strong className="text-amber-400 font-mono">{auction.currentPrice.toLocaleString()} หน่วย</strong>
            </div>
          </div>
        </div>

        {/* Bids List */}
        <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          {auction.bids.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
              ยังไม่มีประวัติการเสนอราคาสำหรับไอเทมนี้
            </div>
          ) : (
            auction.bids.map((b, idx) => {
              const isHighest = idx === 0;
              const timeStr = new Date(b.timestamp).toLocaleString('th-TH', {
                dateStyle: 'short',
                timeStyle: 'medium',
              });

              return (
                <div
                  key={b.id || idx}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isHighest
                      ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-slate-900/60 shadow-md'
                      : 'border-slate-800/80 bg-[#070b14]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold font-mono shrink-0 ${
                        isHighest
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isHighest ? '👑' : auction.bids.length - idx}
                    </span>

                    <JobEmblem job={b.memberJob} size={24} />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{b.memberName}</span>
                        {b.memberJob && (
                          <span className="text-[10px] text-slate-400">({b.memberJob})</span>
                        )}
                        {isHighest && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ราคาสูงสุด
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>🕒 {timeStr}</span>
                        {b.note && <span className="text-slate-400 truncate">💬 &quot;{b.note}&quot;</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono font-extrabold text-sm ${
                        isHighest ? 'text-amber-400 text-base' : 'text-slate-200'
                      }`}
                    >
                      {b.amount.toLocaleString()} หน่วย
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

