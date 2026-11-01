'use client';

import React, { useState } from 'react';
import { TacticalPlan, TacticalIconType, TacticalColorType, TacticalMapPresetId } from '@/types/tactics';
import { MAP_PRESETS, TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';

interface TacticalSidebarProps {
  plans: TacticalPlan[];
  activePlanId: string;
  onSelectPlan: (planId: string) => void;
  onCreatePlan: (name: string, mapId: TacticalMapPresetId) => void;
  onDuplicatePlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onChangePlanMap: (mapId: TacticalMapPresetId, customUrl?: string) => void;
  selectedIcon: TacticalIconType;
  onChangeIcon: (icon: TacticalIconType) => void;
  selectedColor: TacticalColorType;
  onChangeColor: (color: TacticalColorType) => void;
  selectedParty: string;
  onChangeParty: (party: string) => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: (val: boolean) => void;
  drawingColor: string;
  onChangeDrawingColor: (color: string) => void;
  onUndoLine: () => void;
  onClearLines: () => void;
  onClearAllPins: () => void;
  onExportImage: () => void;
  onCopySummary: () => void;
  availableParties?: string[];
  activePlan: TacticalPlan;
  onEditPin?: (pin: any) => void;
  isReadOnly?: boolean;
}

export default function TacticalSidebar({
  plans,
  activePlanId,
  onSelectPlan,
  onCreatePlan,
  onDuplicatePlan,
  onDeletePlan,
  onChangePlanMap,
  selectedIcon,
  onChangeIcon,
  selectedColor,
  onChangeColor,
  selectedParty,
  onChangeParty,
  isDrawingMode,
  onToggleDrawingMode,
  drawingColor,
  onChangeDrawingColor,
  onUndoLine,
  onClearLines,
  onClearAllPins,
  onExportImage,
  onCopySummary,
  availableParties = ['ทัพหลัก', 'ปาร์ตี้ 1', 'ปาร์ตี้ 2', 'ปาร์ตี้ 3', 'ปาร์ตี้ 4', 'ปาร์ตี้ 5', 'พรีสต์ / ซัพพอร์ต'],
  activePlan,
  onEditPin,
  isReadOnly = false,
}: TacticalSidebarProps) {
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanMapId, setNewPlanMapId] = useState<TacticalMapPresetId>('map_outer');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    onCreatePlan(newPlanName.trim(), newPlanMapId);
    setNewPlanName('');
    setIsCreatingPlan(false);
  };

  const handleCustomMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChangePlanMap('custom', dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full lg:w-96 space-y-4 shrink-0">
      {/* 1. Plan Selector Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>🗺️</span>
            <span>แผนยุทธการ (Tactical Plans)</span>
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsCreatingPlan(!isCreatingPlan)}
              className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition cursor-pointer"
            >
              {isCreatingPlan ? '✕ ยกเลิก' : '+ สร้างแผนใหม่'}
            </button>
          )}
        </div>

        {/* Create Plan Form Popover */}
        {isCreatingPlan ? (
          <form onSubmit={handleCreateSubmit} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/50 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                ชื่อแผนยุทธการ *
              </label>
              <input
                type="text"
                required
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="เช่น แผนบุกห้องหิน A, แผนรับลานหน้า"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                เลือกแผนที่ประจำแผน
              </label>
              <select
                value={newPlanMapId}
                onChange={(e) => setNewPlanMapId(e.target.value as TacticalMapPresetId)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {MAP_PRESETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              บันทึกสร้างแผน
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <select
              value={activePlanId}
              onChange={(e) => onSelectPlan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/50 dark:bg-slate-900 text-sm font-extrabold text-slate-900 dark:text-white cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pins?.length || 0} หมุด)
                </option>
              ))}
            </select>

            {!isReadOnly && (
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => onDuplicatePlan(activePlanId)}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>📑</span>
                  <span>คัดลอกแผนนี้</span>
                </button>
                {plans.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`ต้องการลบแผน "${activePlan.name}" ใช่หรือไม่?`)) {
                        onDeletePlan(activePlanId);
                      }
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>🗑️</span>
                    <span>ลบแผนนี้</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Map Selector Card (Switch among the 3 preset maps) */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>🏰</span>
            <span>{isReadOnly ? 'แผนที่ประจำแผนนี้' : 'เลือกแผนที่ (1 แผน / 1 แผนที่)'}</span>
          </span>
          {!isReadOnly && (
            <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1">
              <span>📷</span>
              <span>อัปโหลดรูปเอง</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCustomMapUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {activePlan.mapId === 'custom' && (
            <div className="p-2.5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                {activePlan.customImageUrl ? (
                  <img src={activePlan.customImageUrl} alt="Custom" className="w-full h-full object-cover" />
                ) : (
                  <span>🗺️</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  แผนที่กำหนดเอง
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  รูปภาพที่อัปโหลด
                </div>
              </div>
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                ✓
              </span>
            </div>
          )}

          {MAP_PRESETS.map((map) => {
            const isSelected = activePlan.mapId === map.id;
            return (
              <button
                key={map.id}
                type="button"
                disabled={isReadOnly}
                onClick={() => onChangePlanMap(map.id)}
                className={`p-2.5 rounded-2xl border-2 flex items-center gap-3 text-left transition ${
                  isReadOnly ? 'cursor-default' : 'cursor-pointer'
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                    : isReadOnly
                    ? 'opacity-40 border-slate-200 dark:border-slate-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <img
                  src={map.imageUrl}
                  alt={map.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {map.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {map.subtitle}
                  </div>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tactical Tools & Markers Card (or Plan Overview if read-only) */}
      {isReadOnly ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>📝</span>
            <span>รายละเอียดแผนนี้ (Plan Info)</span>
          </span>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-extrabold text-slate-900 dark:text-white text-sm">
              {activePlan.name}
            </div>
            {activePlan.description && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {activePlan.description}
              </p>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
              <span>📍 มีทั้งหมด {activePlan.pins?.length || 0} จุดคำสั่ง</span>
              <span>·</span>
              <span>✏️ {activePlan.lines?.length || 0} เส้นเดินทัพ</span>
            </div>
          </div>
        </div>
      ) : (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-4">
        {/* Mode Switch: Pin vs Draw */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => onToggleDrawingMode(false)}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              !isDrawingMode
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>📌</span>
            <span>โหมดปักหมุด</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleDrawingMode(true)}
            className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isDrawingMode
                ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>✏️</span>
            <span>วาดเส้นเดินทัพ</span>
          </button>
        </div>

        {isDrawingMode ? (
          /* Drawing Mode Tools */
          <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
              เลือกสีเส้นทางเดินทัพ:
            </span>
            <div className="flex items-center gap-2">
              {[
                { hex: '#f43f5e', label: 'แดง (โจมตี)' },
                { hex: '#3b82f6', label: 'น้ำเงิน (ป้องกัน)' },
                { hex: '#f59e0b', label: 'เหลือง (ทะลวง)' },
                { hex: '#10b981', label: 'เขียว (สนับสนุน)' },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChangeDrawingColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition transform cursor-pointer ${
                    drawingColor === c.hex
                      ? 'scale-125 border-white shadow-md'
                      : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onUndoLine}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <span>↩️</span>
                <span>ย้อนกลับเส้นล่าสุด</span>
              </button>
              <button
                type="button"
                onClick={onClearLines}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
              >
                <span>🗑️</span>
                <span>ลบเส้นทั้งหมด</span>
              </button>
            </div>
          </div>
        ) : (
          /* Pin Mode Tools */
          <div className="space-y-3">
            {/* 1. Quick Icons */}
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                สัญลักษณ์คำสั่งที่จะปัก:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {TACTICAL_ICONS.slice(0, 8).map((item) => {
                  const isActive = selectedIcon === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => onChangeIcon(item.type)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-black shadow-sm ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                      title={item.description}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>
                      <span className="text-[9px] font-bold truncate mt-1">
                        {item.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Quick Colors */}
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                สีหมุด (ทีม / ปาร์ตี้):
              </span>
              <div className="flex flex-wrap gap-2">
                {TACTICAL_COLORS.map((c) => {
                  const isActive = selectedColor === c.type;
                  return (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => onChangeColor(c.type)}
                      className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-indigo-500 border-white scale-110 shadow-md'
                          : 'border-white/50 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {isActive && <span className="text-white text-[10px] font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Assigned Party dropdown */}
            <div>
              <span className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                มอบหมายตี้ (Quick Assign):
              </span>
              <select
                value={selectedParty}
                onChange={(e) => onChangeParty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="">-- ไม่ระบุตี้ (ทั่วไป) --</option>
                {availableParties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 4. Active Pins List in this Plan */}
      {(activePlan.pins || []).length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c101d] p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>📍</span>
              <span>หมุดคำสั่ง ({activePlan.pins.length})</span>
            </span>
            <span className="text-[10px] text-slate-400">ดับเบิ้ลคลิกหมุดเพื่อแก้ไข</span>
          </div>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {[...(activePlan.pins || [])]
              .sort((a, b) => (a.orderNumber || 99) - (b.orderNumber || 99))
              .map((p) => {
                const iconMeta = TACTICAL_ICONS.find((i) => i.type === p.icon) || TACTICAL_ICONS[0];
                const colorMeta = TACTICAL_COLORS.find((c) => c.type === p.color) || TACTICAL_COLORS[0];
                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between gap-2 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-5 h-5 rounded-lg text-xs flex items-center justify-center shrink-0 text-white font-mono font-bold"
                        style={{ backgroundColor: colorMeta.hex }}
                      >
                        {iconMeta.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {p.orderNumber && <span className="text-amber-500 mr-1 font-mono">#{p.orderNumber}</span>}
                          {p.label}
                        </div>
                        {p.assignedParty && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {p.assignedParty}
                          </div>
                        )}
                      </div>
                    </div>

                    {onEditPin && (
                      <button
                        type="button"
                        onClick={() => onEditPin(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs transition cursor-pointer"
                        title="คลิกเพื่อแก้ไขหมุดนี้"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 5. Action Buttons (Export Image & Copy Discord) */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onExportImage}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
        >
          <span>📸</span>
          <span>บันทึกรูปภาพแผนยุทธการ (Export Image)</span>
        </button>

        <button
          type="button"
          onClick={onCopySummary}
          className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>📋</span>
          <span>คัดลอกสรุปคำสั่งส่ง Discord / LINE</span>
        </button>

        {!isReadOnly && (activePlan.pins?.length || 0) > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('ต้องการล้างหมุดทั้งหมดในแผนนี้ใช่หรือไม่?')) {
                onClearAllPins();
              }
            }}
            className="w-full py-1.5 text-center text-xs font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
          >
            ล้างหมุดทั้งหมด ({activePlan.pins.length} หมุด)
          </button>
        )}
      </div>
    </div>
  );
}

