'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AuctionRound, AuctionItem } from '@/types/auction';

interface RoundHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rounds: AuctionRound[];
  activeRoundId: string | null;
  auctionItems: AuctionItem[];
  onSelectRound: (roundId: string) => void;
  onCompleteRound: (roundId: string) => void;
  onReopenRound?: (roundId: string) => void;
  onDeleteRound: (roundId: string) => void;
}

export default function RoundHistoryModal({
  isOpen,
  onClose,
  rounds,
  activeRoundId,
  auctionItems,
  onSelectRound,
  onCompleteRound,
  onReopenRound,
  onDeleteRound,
}: RoundHistoryModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-700 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl border border-indigo-500/30 text-indigo-400">
              📜
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                ประวัติรอบการประมูลทั้งหมด (Rounds History)
              </h3>
              <p className="text-xs text-slate-400">
                เลือกรอบการประมูลเพื่อดูรายการของดรอปและผู้ชนะย้อนหลัง
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

        {/* Rounds List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {rounds.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
              ยังไม่มีรอบการประมูลที่บันทึกไว้
            </div>
          ) : (
            rounds.map((round) => {
              const isSelected = activeRoundId === round.id;
              const isCompleted = round.status === 'completed';
              const roundItems = auctionItems.filter((i) => (i.roundId || 'round_default') === round.id);
              const wonCount = roundItems.filter((i) => i.status === 'ended').length;

              return (
                <div
                  key={round.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition ${
                    isSelected
                      ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                      : 'border-slate-800 bg-[#090d18] hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
                        {round.name}
                      </h4>

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ★ กำลังเปิดดูรอบนี้
                        </span>
                      )}

                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          🏆 จบแล้ว
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          🟢 ดำเนินการ
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span>📅 {round.date}</span>
                      <span>•</span>
                      <span>
                        ไอเทมในรอบ:{' '}
                        <strong className="text-white font-mono">{roundItems.length}</strong> ชิ้น
                      </span>
                      <span>•</span>
                      <span>
                        สุ่มได้ผู้ชนะแล้ว:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {wonCount}/{roundItems.length}
                        </strong>
                      </span>
                    </div>

                    {round.note && (
                      <p className="text-[11px] text-slate-500 truncate">
                        📝 {round.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isSelected && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectRound(round.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
                      >
                        🔍 ดูรอบนี้
                      </button>
                    )}

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onCompleteRound(round.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition cursor-pointer"
                        title="ทำเครื่องหมายว่าจบการสุ่มรอบนี้แล้ว"
                      >
                        🔒 ปิดรอบนี้
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบรอบ "${round.name}" และไอเทมในรอบนี้ทั้งหมด?`)) {
                          onDeleteRound(round.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 text-xs transition cursor-pointer"
                      title="ลบรอบนี้"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 pt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

