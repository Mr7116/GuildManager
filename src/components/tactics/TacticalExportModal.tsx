'use client';

import React, { useState, useRef } from 'react';
import { TacticalPlan } from '@/types/tactics';
import { MAP_PRESETS, TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';

interface TacticalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: TacticalPlan;
  guildName: string;
}

export default function TacticalExportModal({
  isOpen,
  onClose,
  plan,
  guildName,
}: TacticalExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const activePreset = MAP_PRESETS.find((p) => p.id === plan.mapId) || MAP_PRESETS[0];
  const mapImageUrl = plan.customImageUrl || activePreset.imageUrl;
  const sortedPins = [...(plan.pins || [])].sort((a, b) => (a.orderNumber || 99) - (b.orderNumber || 99));

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = posterRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#090d16',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `TacticalPlan_${guildName}_${plan.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
      alert('ไม่สามารถส่งออกรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const renderPathD = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-[#090d16] text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h3 className="text-base font-extrabold text-white">ส่งออกรูปภาพแผนยุทธการ (High-Res PNG)</h3>
              <p className="text-xs text-slate-400">ภาพความละเอียดสูง พร้อมส่งเข้า Discord หรือ LINE กลุ่มกิลด์</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/90 flex justify-center scrollbar-thin">
          {/* Printable Poster Canvas */}
          <div
            ref={posterRef}
            className="w-full max-w-[800px] rounded-3xl border-2 border-slate-800 bg-[#0c101d] p-5 sm:p-6 space-y-4 shadow-2xl text-white"
          >
            {/* Poster Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400">
                  ⚔️ BATTLE PLAN & TACTICAL MAP
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {plan.name}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  แผนที่: {activePreset.name} · {guildName} Guild
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-black">
                  {guildName}
                </span>
                <div className="text-[10px] text-slate-500 mt-1">
                  {new Date().toLocaleDateString('th-TH', { dateStyle: 'medium' })}
                </div>
              </div>
            </div>

            {/* Poster Map Image & Pins Container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl">
              <img
                src={mapImageUrl}
                alt={plan.name}
                crossOrigin="anonymous"
                className="w-full h-auto block select-none"
              />

              {/* Lines Layer */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                {(plan.lines || []).map((line) => {
                  const d = renderPathD(line.points);
                  return (
                    <g key={line.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke="#000000"
                        strokeWidth={line.width * 0.4}
                        strokeOpacity="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={d}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={line.width * 0.25}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Pins Layer */}
              {sortedPins.map((pin) => {
                const iconMeta = TACTICAL_ICONS.find((i) => i.type === pin.icon) || TACTICAL_ICONS[0];
                const colorMeta = TACTICAL_COLORS.find((c) => c.type === pin.color) || TACTICAL_COLORS[0];

                return (
                  <div
                    key={pin.id}
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 select-none flex flex-col items-center pointer-events-none"
                  >
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white relative"
                      style={{
                        backgroundColor: colorMeta.hex,
                        boxShadow: `0 8px 16px -2px ${colorMeta.hex}90`,
                      }}
                    >
                      <span className="text-lg leading-none">{iconMeta.icon}</span>
                      {pin.orderNumber !== undefined && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-slate-950 text-white font-mono font-black text-[10px] flex items-center justify-center border border-white">
                          {pin.orderNumber}
                        </span>
                      )}
                    </div>
                    {/* Arrow tip */}
                    <div
                      className="w-0 h-0 border-x-4 border-x-transparent border-t-[5px]"
                      style={{ borderTopColor: colorMeta.hex }}
                    />
                    {/* Label */}
                    <div className="mt-0.5 px-2 py-0.5 rounded-lg bg-slate-950/90 text-white border border-slate-700/80 text-[10px] font-black text-center whitespace-nowrap shadow-md">
                      {pin.assignedParty && (
                        <span className="text-amber-300 font-bold mr-1">[{pin.assignedParty}]</span>
                      )}
                      <span>{pin.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Poster Legend / Strategic Orders Table */}
            {sortedPins.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span>📋</span>
                  <span>สรุปขั้นตอน & คำสั่งประจำจุด ({sortedPins.length} คำสั่ง)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sortedPins.map((p) => {
                    const iconMeta = TACTICAL_ICONS.find((i) => i.type === p.icon) || TACTICAL_ICONS[0];
                    const colorMeta = TACTICAL_COLORS.find((c) => c.type === p.color) || TACTICAL_COLORS[0];

                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 flex items-start gap-2.5"
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-white/40 shadow-sm"
                          style={{ backgroundColor: colorMeta.hex }}
                        >
                          {iconMeta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.orderNumber && (
                              <span className="font-mono font-black text-[10px] text-amber-400">
                                #{p.orderNumber}
                              </span>
                            )}
                            {p.assignedParty && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                {p.assignedParty}
                              </span>
                            )}
                            <span className="text-xs font-extrabold text-white truncate">
                              {p.label}
                            </span>
                          </div>
                          {p.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                              {p.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Poster Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-850">
              <span>🛡️ Generated by {guildName} Manager</span>
              <span>Ragnarok Online GVG / Siege System</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            ปิด
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>กำลังสร้างรูปภาพ...</span>
              </>
            ) : (
              <>
                <span>📥</span>
                <span>ดาวน์โหลดรูปภาพ (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

