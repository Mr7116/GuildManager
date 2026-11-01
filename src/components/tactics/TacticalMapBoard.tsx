'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TacticalPin, TacticalPlan, TacticalDrawnLine, TacticalIconType, TacticalColorType } from '@/types/tactics';
import { MAP_PRESETS, TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';
import TacticalPinMarker from './TacticalPinMarker';
import TacticalDrawingCanvas from './TacticalDrawingCanvas';
import TacticalPinEditModal from './TacticalPinEditModal';
import TacticalPinViewModal from './TacticalPinViewModal';

interface TacticalMapBoardProps {
  plan: TacticalPlan;
  onUpdatePlan: (updatedPlan: TacticalPlan) => void;
  selectedIcon: TacticalIconType;
  selectedColor: TacticalColorType;
  selectedParty?: string;
  isDrawingMode: boolean;
  drawingColor: string;
  onUndoLine?: () => void;
  onClearLines?: () => void;
  availableParties?: string[];
  isReadOnly?: boolean;
}

export default function TacticalMapBoard({
  plan,
  onUpdatePlan,
  selectedIcon,
  selectedColor,
  selectedParty,
  isDrawingMode,
  drawingColor,
  availableParties,
  isReadOnly = false,
}: TacticalMapBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardWrapperRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedPin, setSelectedPin] = useState<TacticalPin | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Map Image
  const activePreset = MAP_PRESETS.find((p) => p.id === plan.mapId) || MAP_PRESETS[0];
  const mapImageUrl = plan.customImageUrl || activePreset.imageUrl;

  // Handle placing a new pin on map click
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReadOnly || isDrawingMode || draggingPinId) return;
    if (!containerRef.current) return;

    // Check if clicked directly on map container or map image
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    const iconMeta = TACTICAL_ICONS.find((i) => i.type === selectedIcon) || TACTICAL_ICONS[0];
    const nextOrder = (plan.pins?.length || 0) + 1;

    const newPin: TacticalPin = {
      id: `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      icon: selectedIcon,
      color: selectedColor,
      label: iconMeta.label.split(' ')[0],
      assignedParty: selectedParty,
      orderNumber: nextOrder,
      createdAt: new Date().toISOString(),
    };

    const updatedPins = [...(plan.pins || []), newPin];
    onUpdatePlan({
      ...plan,
      pins: updatedPins,
      updatedAt: new Date().toISOString(),
    });

    // Select the newly placed pin without popping up modal
    setSelectedPin(newPin);
  };

  // Dragging Pin logic
  const handleDragStart = (pin: TacticalPin, e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly || isDrawingMode) return;
    setDraggingPinId(pin.id);
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggingPinId || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));

      onUpdatePlan({
        ...plan,
        pins: (plan.pins || []).map((p) =>
          p.id === draggingPinId ? { ...p, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } : p
        ),
      });
    },
    [draggingPinId, plan, onUpdatePlan]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingPinId) {
      setDraggingPinId(null);
    }
  }, [draggingPinId]);

  useEffect(() => {
    if (draggingPinId) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };
    }
  }, [draggingPinId, handlePointerMove, handlePointerUp]);

  // Pin Actions
  const handleSavePin = (updatedPin: TacticalPin) => {
    const updated = (plan.pins || []).map((p) => (p.id === updatedPin.id ? updatedPin : p));
    onUpdatePlan({
      ...plan,
      pins: updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeletePin = (pinId: string) => {
    const updated = (plan.pins || []).filter((p) => p.id !== pinId);
    onUpdatePlan({
      ...plan,
      pins: updated,
      updatedAt: new Date().toISOString(),
    });
    if (selectedPin?.id === pinId) {
      setSelectedPin(null);
    }
  };

  const handleAddLine = (newLine: TacticalDrawnLine) => {
    onUpdatePlan({
      ...plan,
      lines: [...(plan.lines || []), newLine],
      updatedAt: new Date().toISOString(),
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!boardWrapperRef.current) return;
    if (!document.fullscreenElement) {
      boardWrapperRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={boardWrapperRef}
      className={`relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none w-screen h-screen' : 'min-h-[560px] lg:min-h-[720px]'
      }`}
    >
      {/* Board Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:px-4 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-[200px] sm:max-w-xs">
            {plan.name}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 hidden sm:inline-block">
            {activePreset.name}
          </span>
        </div>

        {/* Right Controls: Zoom & View */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom In / Out / Reset */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 p-0.5 text-xs text-white">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(80, z - 15))}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 active:scale-95 transition"
              title="ย่อแผนที่"
            >
              -
            </button>
            <span className="px-2 font-mono font-bold text-[11px] text-slate-300 min-w-[42px] text-center">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
              className="px-2 py-1 rounded-lg hover:bg-slate-800 active:scale-95 transition"
              title="ขยายแผนที่"
            >
              +
            </button>
            {zoomLevel !== 100 && (
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-slate-800 transition"
              >
                100%
              </button>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="เต็มจอ"
          >
            <span>{isFullscreen ? '✕' : '⛶'}</span>
            <span className="hidden sm:inline">{isFullscreen ? 'ออกเต็มจอ' : 'เต็มจอ'}</span>
          </button>
        </div>
      </div>

      {/* Map View Area (Scrollable when zoomed) */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 relative scrollbar-thin">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: draggingPinId ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {/* Main Map Canvas Container: Perfectly shrink-wrapped around the image */}
          <div
            ref={containerRef}
            onClick={handleMapClick}
            className={`relative inline-block rounded-2xl shadow-2xl overflow-hidden border-2 border-slate-700/80 bg-slate-900 select-none shrink-0 ${
              isReadOnly
                ? 'cursor-default'
                : isDrawingMode
                ? 'cursor-crosshair'
                : 'cursor-cell hover:border-indigo-500/70 transition-colors'
            }`}
          >
            {/* The Map Image: Preserves natural aspect ratio without clipping on any screen */}
            <img
              src={mapImageUrl}
              alt={plan.name}
              draggable={false}
              className={`block w-auto h-auto select-none pointer-events-none ${
                isFullscreen
                  ? 'max-h-[88vh] max-w-[94vw]'
                  : 'max-h-[72vh] max-w-[min(90vw,900px)]'
              }`}
            />

            {/* Tactical Route Drawing Layer */}
            <TacticalDrawingCanvas
              lines={plan.lines || []}
              activeColor={drawingColor}
              isDrawingMode={!isReadOnly && isDrawingMode}
              onAddLine={handleAddLine}
              containerRef={containerRef}
            />

            {/* Tactical Pins Layer */}
            {(plan.pins || []).map((pin) => (
              <TacticalPinMarker
                key={pin.id}
                pin={pin}
                isSelected={selectedPin?.id === pin.id}
                isDragging={draggingPinId === pin.id}
                onSelect={(p) => {
                  setSelectedPin(p);
                  if (isReadOnly) {
                    setIsViewModalOpen(true);
                  }
                }}
                onEdit={(p) => {
                  setSelectedPin(p);
                  if (isReadOnly) {
                    setIsViewModalOpen(true);
                  } else {
                    setIsEditModalOpen(true);
                  }
                }}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>

        {/* Map Bottom Hint Pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none z-20">
          <div className="px-3 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-slate-300 shadow-xl flex items-center gap-2">
            <span>
              {isReadOnly
                ? '👁️ มุมมองดูอย่างเดียว: คลิกที่หมุดเพื่อดูรายละเอียดคำสั่งประจำจุด'
                : isDrawingMode
                ? '✏️ โหมดวาดเส้น: ลากเมาส์/นิ้วเพื่อวาดเส้นเดินทัพ'
                : '📌 คลิกแผนที่เพื่อปักหมุด · ลากเพื่อย้าย · ดับเบิ้ลคลิก 2 ครั้งเพื่อแก้ไข'}
            </span>
          </div>
        </div>
      </div>

      {/* Pin Edit Modal (Admin / Edit Mode) */}
      {!isReadOnly && (
        <TacticalPinEditModal
          pin={selectedPin}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPin(null);
          }}
          onSave={handleSavePin}
          onDelete={handleDeletePin}
          availableParties={availableParties}
        />
      )}

      {/* Pin View Modal (Member / Read-Only Mode) */}
      <TacticalPinViewModal
        pin={selectedPin}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPin(null);
        }}
      />
    </div>
  );
}

