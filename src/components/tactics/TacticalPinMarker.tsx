'use client';

import React, { useRef } from 'react';
import { TacticalPin } from '@/types/tactics';
import { TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';

interface TacticalPinMarkerProps {
  pin: TacticalPin;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect: (pin: TacticalPin) => void;
  onEdit: (pin: TacticalPin) => void;
  onDragStart?: (pin: TacticalPin, e: React.MouseEvent | React.TouchEvent) => void;
}

export default function TacticalPinMarker({
  pin,
  isSelected,
  isDragging = false,
  onSelect,
  onEdit,
  onDragStart,
}: TacticalPinMarkerProps) {
  const iconMeta = TACTICAL_ICONS.find((i) => i.type === pin.icon) || TACTICAL_ICONS[0];
  const colorMeta = TACTICAL_COLORS.find((c) => c.type === pin.color) || TACTICAL_COLORS[0];

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDragActionRef = useRef<boolean>(false);
  const lastTapTimeRef = useRef<number>(0);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isDragActionRef.current = false;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    pointerDownPosRef.current = { x: clientX, y: clientY };

    if (onDragStart) {
      onDragStart(pin, e);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If it was a drag gesture, do not treat as click
    if (isDragActionRef.current) return;
    onSelect(pin);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(pin);
  };

  // Double-tap support for mobile touch screens
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isDragActionRef.current) return;

    const now = Date.now();
    if (now - lastTapTimeRef.current < 380) {
      // Double tap detected!
      onEdit(pin);
      lastTapTimeRef.current = 0;
    } else {
      lastTapTimeRef.current = now;
      onSelect(pin);
    }
  };

  return (
    <div
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none group z-20 ${
        isDragging ? 'scale-110 z-40 opacity-90' : 'transition-transform hover:scale-110 hover:z-30'
      }`}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title={`${pin.label} (${iconMeta.label}) - ดับเบิ้ลคลิก 2 ครั้งเพื่อแก้ไข / ลากเพื่อย้าย`}
    >
      {/* Outer Pulse when selected */}
      {isSelected && (
        <span
          className="absolute -inset-2 rounded-full animate-ping opacity-60 pointer-events-none"
          style={{ backgroundColor: colorMeta.hex }}
        />
      )}

      {/* Main Pin Container */}
      <div className="relative flex flex-col items-center">
        {/* Pin Head */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-xl border-2 transition ${
            isSelected
              ? 'ring-4 ring-white dark:ring-amber-400 border-white scale-105'
              : 'border-white/90 hover:border-white'
          }`}
          style={{
            backgroundColor: colorMeta.hex,
            boxShadow: `0 8px 18px -4px ${colorMeta.hex}80, 0 4px 6px -2px rgba(0, 0, 0, 0.4)`,
          }}
        >
          {/* Symbol / Emoji */}
          <span className="text-lg sm:text-xl drop-shadow select-none leading-none">
            {iconMeta.icon}
          </span>

          {/* Order Badge (#1, #2) */}
          {pin.orderNumber !== undefined && pin.orderNumber > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-slate-950 text-white font-mono font-black text-[10px] flex items-center justify-center border border-white/70 shadow-sm">
              {pin.orderNumber}
            </span>
          )}
        </div>

        {/* Pin Pointer Arrow (triangular bottom tip) */}
        <div
          className="w-0 h-0 border-x-4 border-x-transparent border-t-[6px] -mt-0.5 drop-shadow"
          style={{ borderTopColor: colorMeta.hex }}
        />

        {/* Pin Label Tooltip / Banner */}
        <div
          className={`mt-1 max-w-[150px] sm:max-w-[180px] px-2 py-0.5 rounded-lg text-center backdrop-blur-md shadow-md border pointer-events-none transition-all ${
            isSelected
              ? 'bg-slate-950/90 text-white border-amber-400/80 font-bold opacity-100 scale-100 z-30'
              : 'bg-slate-900/85 text-slate-100 border-slate-700/60 opacity-90 group-hover:opacity-100 group-hover:scale-105'
          }`}
        >
          {pin.assignedParty && (
            <div className="text-[9px] font-black uppercase tracking-wider text-amber-300 truncate">
              {pin.assignedParty}
            </div>
          )}
          <div className="text-[10px] sm:text-[11px] font-extrabold truncate leading-tight">
            {pin.label || iconMeta.label}
          </div>
        </div>
      </div>
    </div>
  );
}
