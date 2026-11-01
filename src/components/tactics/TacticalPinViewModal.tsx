'use client';

import React from 'react';
import { TacticalPin } from '@/types/tactics';
import { TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';

interface TacticalPinViewModalProps {
  pin: TacticalPin | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TacticalPinViewModal({
  pin,
  isOpen,
  onClose,
}: TacticalPinViewModalProps) {
  if (!isOpen || !pin) return null;

  const iconMeta = TACTICAL_ICONS.find((i) => i.type === pin.icon) || TACTICAL_ICONS[0];
  const colorMeta = TACTICAL_COLORS.find((c) => c.type === pin.color) || TACTICAL_COLORS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-2xl overflow-hidden p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border border-white/60 shrink-0"
              style={{ backgroundColor: colorMeta.hex }}
            >
              <span>{iconMeta.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {pin.orderNumber && (
                  <span className="font-mono font-black text-xs px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/80">
                    ขั้นตอน #{pin.orderNumber}
                  </span>
                )}
                {pin.assignedParty && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {pin.assignedParty}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mt-1">
                {pin.label}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Details Content */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-2.5 text-xs sm:text-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>ประเภทคำสั่ง:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{iconMeta.label}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>สังกัดทีม / สีหมุด:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{colorMeta.label}</span>
          </div>

          {pin.note ? (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
                💬 คำสั่งยุทธวิธี & หมายเหตุ:
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                {pin.note}
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 italic">
              ไม่มีหมายเหตุเพิ่มเติมสำหรับจุดนี้
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

