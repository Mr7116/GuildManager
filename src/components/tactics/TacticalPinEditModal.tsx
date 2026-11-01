'use client';

import React, { useState, useEffect } from 'react';
import { TacticalPin, TacticalIconType, TacticalColorType } from '@/types/tactics';
import { TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';

interface TacticalPinEditModalProps {
  pin: TacticalPin | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPin: TacticalPin) => void;
  onDelete: (pinId: string) => void;
  availableParties?: string[];
}

const QUICK_SUGGESTIONS = [
  'โจมตีทะลวงหน้าวาร์ป',
  'ตั้งรับหน้าบันไดสกัดศัตรู',
  'คุ้มกันหินกิลด์ Emperium',
  'ยึดจุดเกิด Square',
  'วิ่งอ้อมหลังทางลับ Secret Passage',
  'จุดรวมพลพรีสต์บัฟเต็มสูบ',
  'ชิงธงปีกซ้าย',
  'ชิงธงปีกขวา',
  'ดักซุ่มสเกาต์ศัตรู',
];

export default function TacticalPinEditModal({
  pin,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableParties = ['ทัพหลัก', 'ปาร์ตี้ 1', 'ปาร์ตี้ 2', 'ปาร์ตี้ 3', 'ปาร์ตี้ 4', 'ปาร์ตี้ 5', 'พรีสต์ / ซัพพอร์ต'],
}: TacticalPinEditModalProps) {
  const [icon, setIcon] = useState<TacticalIconType>('sword');
  const [color, setColor] = useState<TacticalColorType>('rose');
  const [label, setLabel] = useState('');
  const [assignedParty, setAssignedParty] = useState('');
  const [orderNumber, setOrderNumber] = useState<number>(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (pin) {
      setIcon(pin.icon || 'sword');
      setColor(pin.color || 'rose');
      setLabel(pin.label || '');
      setAssignedParty(pin.assignedParty || '');
      setOrderNumber(pin.orderNumber || 1);
      setNote(pin.note || '');
    }
  }, [pin]);

  if (!isOpen || !pin) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...pin,
      icon,
      color,
      label: label.trim() || 'หมุดคำสั่ง',
      assignedParty: assignedParty.trim() || undefined,
      orderNumber: Number(orderNumber) || undefined,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const selectedColorMeta = TACTICAL_COLORS.find((c) => c.type === color) || TACTICAL_COLORS[0];
  const selectedIconMeta = TACTICAL_ICONS.find((i) => i.type === icon) || TACTICAL_ICONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with live preview */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border border-white/60"
              style={{ backgroundColor: selectedColorMeta.hex }}
            >
              <span>{selectedIconMeta.icon}</span>
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                แก้ไขหมุดคำสั่งยุทธการ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                พิกัด: X {pin.x.toFixed(1)}% , Y {pin.y.toFixed(1)}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-200/50 dark:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* 1. Select Symbol / Icon */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              สัญลักษณ์คำสั่ง (Icon Symbol)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {TACTICAL_ICONS.map((item) => {
                const isActive = icon === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setIcon(item.type)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 ring-2 ring-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <span className="text-xs truncate">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Select Color */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              สีหมุด / ทีม (Pin Color & Team)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TACTICAL_COLORS.map((item) => {
                const isActive = color === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setColor(item.type)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isActive
                        ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm border border-white/60"
                      style={{ backgroundColor: item.hex }}
                    />
                    <span className="text-xs truncate text-slate-700 dark:text-slate-300">
                      {item.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Label & Quick Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                ข้อความคำสั่ง (Order Label) *
              </label>
              <span className="text-[10px] text-slate-400">แสดงใต้หมุด</span>
            </div>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="เช่น ตี้ 1+2 ทะลวงหน้าวาร์ป, ตั้งรับหน้าบันได"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_SUGGESTIONS.slice(0, 6).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setLabel(sugg)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 transition"
                >
                  + {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Assign Team / Party & Order Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                มอบหมายทีม / ปาร์ตี้
              </label>
              <input
                type="text"
                list="party-suggestions"
                value={assignedParty}
                onChange={(e) => setAssignedParty(e.target.value)}
                placeholder="เลือกหรือพิมพ์ชื่อตี้"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="party-suggestions">
                {availableParties.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                ลำดับขั้นตอน (Order #)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={orderNumber}
                onChange={(e) => setOrderNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 5. Additional Note */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
              รายละเอียด / หมายเหตุเชิงลึก (Notes)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น เมจเตรียมลงกิลตี้หน้าวาร์ป ไนท์คอยสตั้น พรีสต์เตรียมซาคราเมนท์..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('ต้องการลบหมุดนี้ใช่หรือไม่?')) {
                  onDelete(pin.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>🗑️</span>
              <span>ลบหมุด</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer"
              >
                บันทึกคำสั่ง
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

