'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useGuildStore } from '@/lib/guildStore';
import { supabase } from '@/lib/supabase';
import { GUILD_ID, GUILD_NAME } from '@/config/guildConfig';
import { TacticalPlan, TacticalPin, TacticalIconType, TacticalColorType, TacticalMapPresetId } from '@/types/tactics';
import { DEFAULT_TACTICAL_PLANS, MAP_PRESETS, TACTICAL_ICONS } from '@/config/tacticsConfig';
import TacticalMapBoard from '@/components/tactics/TacticalMapBoard';
import TacticalSidebar from '@/components/tactics/TacticalSidebar';
import TacticalExportModal from '@/components/tactics/TacticalExportModal';
import TacticalPinViewModal from '@/components/tactics/TacticalPinViewModal';
import DonateCard from '@/components/common/DonateCard';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface TacticsContainerProps {
  mode: 'admin' | 'view';
}

export default function TacticsContainer({ mode }: TacticsContainerProps) {
  const { guildName, gvgParties, siegeParties } = useGuildStore();
  const displayGuildName = guildName || GUILD_NAME;

  const isReadOnly = mode === 'view';
  const [mounted, setMounted] = useState(false);

  // Initialize with DEFAULT_TACTICAL_PLANS for consistent SSR
  const [plans, setPlans] = useState<TacticalPlan[]>(DEFAULT_TACTICAL_PLANS);
  const [activePlanId, setActivePlanId] = useState<string>('plan_outer_assault');

  // Tool State
  const [selectedIcon, setSelectedIcon] = useState<TacticalIconType>('sword');
  const [selectedColor, setSelectedColor] = useState<TacticalColorType>('rose');
  const [selectedParty, setSelectedParty] = useState<string>('ทัพหลัก');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#f43f5e');

  // Modals & Toast State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewingPin, setViewingPin] = useState<TacticalPin | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; icon?: string } | null>(null);
  const [pendingMapChange, setPendingMapChange] = useState<{
    mapId: TacticalMapPresetId;
    customUrl?: string;
    targetMapName: string;
    pinCount: number;
  } | null>(null);

  // Active Plan Object
  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === activePlanId) || plans[0] || DEFAULT_TACTICAL_PLANS[0];
  }, [plans, activePlanId]);

  // Available Parties list for easy assignment
  const availableParties = useMemo(() => {
    const set = new Set<string>();
    set.add('ทัพหลัก (Main Team)');
    set.add('กองหนุน (Sub Team)');
    gvgParties.forEach((p) => {
      if (p.name) set.add(p.name);
    });
    siegeParties.forEach((p) => {
      if (p.name) set.add(p.name);
    });
    set.add('พรีสต์ / ซัพพอร์ต');
    set.add('ทีมสเกาต์ / ลอบตี');
    return Array.from(set);
  }, [gvgParties, siegeParties]);

  const lastUserActionTimeRef = useRef<number>(0);

  // Load from Supabase Cloud on mount & subscribe to Realtime updates
  useEffect(() => {
    let isMounted = true;
    setMounted(true);

    // 1. Read localStorage first for immediate UI
    try {
      const saved = localStorage.getItem('Moonz_tactical_plans');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlans(parsed);
          setActivePlanId(parsed[0]?.id || 'plan_outer_assault');
        }
      }
    } catch (_) {}

    // 2. Sync from Supabase Cloud
    const loadTacticsFromCloud = async () => {
      try {
        const { data, error } = await supabase
          .from('guild_tactics')
          .select('*')
          .eq('id', GUILD_ID)
          .maybeSingle();

        if (!error && data && Array.isArray(data.plans) && data.plans.length > 0 && isMounted) {
          setPlans(data.plans);
          try {
            localStorage.setItem('Moonz_tactical_plans', JSON.stringify(data.plans));
          } catch (_) {}
        }
      } catch (_) {}
    };

    loadTacticsFromCloud();

    // Supabase Realtime Channel (both admin & viewers get real-time sync)
    const channel = supabase
      .channel(`tactics_realtime_${GUILD_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guild_tactics', filter: `id=eq.${GUILD_ID}` },
        (payload: any) => {
          // Prevent overwriting if local user just made changes in last 2.5s
          if (Date.now() - lastUserActionTimeRef.current < 2500) return;
          if (payload?.new && Array.isArray(payload.new.plans) && payload.new.plans.length > 0) {
            setPlans(payload.new.plans);
            try {
              localStorage.setItem('Moonz_tactical_plans', JSON.stringify(payload.new.plans));
            } catch (_) {}
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Persist plans to localStorage + Supabase Cloud
  const savePlans = useCallback((newPlans: TacticalPlan[]) => {
    if (isReadOnly) return; // Read-only mode cannot modify cloud or localStorage
    lastUserActionTimeRef.current = Date.now();
    setPlans(newPlans);
    try {
      localStorage.setItem('Moonz_tactical_plans', JSON.stringify(newPlans));
    } catch (_) {}

    // Async Cloud Sync to Supabase
    void Promise.resolve(
      supabase.from('guild_tactics').upsert({
        id: GUILD_ID,
        plans: newPlans,
        updated_at: new Date().toISOString(),
      })
    ).catch(() => {});
  }, [isReadOnly]);

  const showToast = (text: string, icon = '✅') => {
    setToastMsg({ text, icon });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Plan Handlers
  const handleUpdatePlan = (updatedPlan: TacticalPlan) => {
    if (isReadOnly) return;
    const next = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    savePlans(next);
  };

  const handleCreatePlan = (name: string, mapId: TacticalMapPresetId) => {
    if (isReadOnly) return;
    const newId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlan: TacticalPlan = {
      id: newId,
      name,
      mapId,
      pins: [],
      lines: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [newPlan, ...plans];
    savePlans(next);
    setActivePlanId(newId);
    showToast(`สร้างแผน "${name}" เรียบร้อย!`);
  };

  const handleDuplicatePlan = (planId: string) => {
    if (isReadOnly) return;
    const target = plans.find((p) => p.id === planId);
    if (!target) return;
    const newId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const dupPlan: TacticalPlan = {
      ...target,
      id: newId,
      name: `${target.name} (คัดลอก)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [dupPlan, ...plans];
    savePlans(next);
    setActivePlanId(newId);
    showToast(`คัดลอกแผน "${target.name}" แล้ว!`);
  };

  const handleDeletePlan = (planId: string) => {
    if (isReadOnly) return;
    if (plans.length <= 1) {
      alert('ไม่สามารถลบแผนสุดท้ายได้');
      return;
    }
    const next = plans.filter((p) => p.id !== planId);
    savePlans(next);
    setActivePlanId(next[0].id);
    showToast('ลบแผนเรียบร้อย');
  };

  const executeMapChange = (mapId: TacticalMapPresetId, customUrl?: string) => {
    const next = plans.map((p) =>
      p.id === activePlanId
        ? {
            ...p,
            mapId,
            customImageUrl: customUrl !== undefined ? customUrl : undefined,
            pins: [], // หมุดที่เคยวางหายไป
            lines: [], // เส้นเดินทัพหายไป
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    savePlans(next);
    setPendingMapChange(null);
    showToast('เปลี่ยนแผนที่และล้างหมุดเรียบร้อย', '🗺️');
  };

  const handleChangePlanMap = (mapId: TacticalMapPresetId, customUrl?: string) => {
    if (isReadOnly) return;

    // If clicking same map preset and not uploading new custom image, do nothing
    if (activePlan.mapId === mapId && !customUrl && activePlan.mapId !== 'custom') return;

    const pinCount = activePlan.pins?.length || 0;
    const lineCount = activePlan.lines?.length || 0;

    const targetMapPreset = MAP_PRESETS.find((m) => m.id === mapId);
    const targetMapName = customUrl ? 'แผนที่รูปภาพที่อัปโหลด' : (targetMapPreset?.name || 'แผนที่ใหม่');

    // If there are pins or lines placed, show popup warning first!
    if (pinCount > 0 || lineCount > 0) {
      setPendingMapChange({
        mapId,
        customUrl,
        targetMapName,
        pinCount,
      });
      return;
    }

    // If no pins, change directly and clear pins & lines
    executeMapChange(mapId, customUrl);
  };

  // Undo / Clear Lines
  const handleUndoLine = () => {
    if (isReadOnly) return;
    if (!activePlan.lines || activePlan.lines.length === 0) return;
    const nextLines = activePlan.lines.slice(0, -1);
    handleUpdatePlan({
      ...activePlan,
      lines: nextLines,
      updatedAt: new Date().toISOString(),
    });
    showToast('ย้อนกลับเส้นล่าสุดแล้ว');
  };

  const handleClearLines = () => {
    if (isReadOnly) return;
    if (!confirm('ต้องการล้างเส้นวาดทั้งหมดในแผนนี้ใช่หรือไม่?')) return;
    handleUpdatePlan({
      ...activePlan,
      lines: [],
      updatedAt: new Date().toISOString(),
    });
    showToast('ล้างเส้นวาดทั้งหมดแล้ว');
  };

  const handleClearAllPins = () => {
    if (isReadOnly) return;
    handleUpdatePlan({
      ...activePlan,
      pins: [],
      lines: [],
      updatedAt: new Date().toISOString(),
    });
    showToast('ล้างหมุดทั้งหมดในแผนนี้เรียบร้อย');
  };

  // Copy Summary text for Discord/LINE
  const handleCopySummary = () => {
    const sortedPins = [...(activePlan.pins || [])].sort(
      (a, b) => (a.orderNumber || 99) - (b.orderNumber || 99)
    );
    const preset = MAP_PRESETS.find((m) => m.id === activePlan.mapId) || MAP_PRESETS[0];

    const lines: string[] = [];
    lines.push(`🗺️ **[แผนยุทธการ ${displayGuildName}] ${activePlan.name}**`);
    lines.push(`🏰 แผนที่: ${preset.name}`);
    if (activePlan.description) lines.push(`📝 คำอธิบาย: ${activePlan.description}`);
    lines.push('──────────────────────────────');

    if (sortedPins.length === 0) {
      lines.push('ยังไม่มีการปักหมุดคำสั่ง');
    } else {
      sortedPins.forEach((pin, idx) => {
        const iconMeta = TACTICAL_ICONS.find((i) => i.type === pin.icon) || TACTICAL_ICONS[0];
        const partyStr = pin.assignedParty ? ` [${pin.assignedParty}]` : '';
        const orderStr = pin.orderNumber ? `#${pin.orderNumber} ` : `${idx + 1}. `;
        lines.push(`${orderStr}${iconMeta.icon}${partyStr} ${pin.label}`);
        if (pin.note) {
          lines.push(`   💬 หมายเหตุ: ${pin.note}`);
        }
      });
    }

    lines.push('──────────────────────────────');
    lines.push(`🛡️ วางแผนโดยระบบ ${displayGuildName} Guild Manager`);

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        showToast('คัดลอกสรุปคำสั่งลงคลิปบอร์ดแล้ว! วางใน Discord/LINE ได้เลย', '📋');
      })
      .catch(() => {
        alert('ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง');
      });
  };

  // Copy Member Shareable View URL
  const handleCopyMemberUrl = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/tactics/view`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        showToast('คัดลอกลิงก์สำหรับสมาชิกเรียบร้อย! นำไปแชร์ได้ทันที', '🔗');
      })
      .catch(() => {
        alert('ไม่สามารถคัดลอกได้');
      });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400">กำลังโหลดแผนที่ยุทธการ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 pb-16 transition-colors">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-indigo-500/30 bg-slate-950/90 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3">
          <span>{toastMsg.icon || '✅'}</span>
          <span className="text-xs sm:text-sm font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Standalone View Header (when in /tactics/view mode) */}
      {isReadOnly && (
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-[1720px] px-3 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg sm:text-xl font-black bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent truncate">
                {displayGuildName}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <span>🗺️</span>
                <span>แผนที่ยุทธการ (Tactical Map)</span>
              </span>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40">
                👁️ ดูอย่างเดียว
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggle />
              <Link
                href="/login?redirect=%2Ftactics"
                className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>🔑</span>
                <span className="hidden sm:inline">เข้าสู่ระบบผู้ดูแล</span>
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-[1720px] px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* Admin Page Header (when mode === 'admin') */}
        {!isReadOnly && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c101d]/90 backdrop-blur-md shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
                🗺️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                    วางแผนกลยุทธ์ & แผนที่ยุทธการ (Admin Tactics Board)
                  </h1>
                  <AutoSaveBadge />
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  ปักหมุดเข็มหมุดหลากสีตามทีม สัญลักษณ์โจมตี ⚔️ ป้องกัน 🛡️ โฟกัส 🎯 และลากเส้นเดินทัพสำหรับกิลด์วอร์ & ปราสาท
                </p>
              </div>
            </div>

            {/* Quick Header Actions for Admin */}
            <div className="flex items-center gap-2 self-end md:self-center flex-wrap">
              {/* Copy Shareable Member View URL */}
              <button
                type="button"
                onClick={handleCopyMemberUrl}
                className="px-3.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-xs font-extrabold text-indigo-700 dark:text-indigo-300 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="คัดลอกลิงก์สำหรับส่งให้สมาชิกในกิลด์เข้าดู (ดูอย่างเดียว ไม่ต้องล็อกอิน)"
              >
                <span>🔗</span>
                <span>คัดลอกลิงก์สำหรับสมาชิก</span>
              </button>

              {/* Open View Mode in new tab */}
              <Link
                href="/tactics/view"
                target="_blank"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-sm"
                title="เปิดดูหน้าจอในมุมมองของสมาชิกที่ไม่ได้ล็อกอินในแท็บใหม่"
              >
                <span>👁️</span>
                <span className="hidden sm:inline">ดูหน้าสำหรับสมาชิก</span>
              </Link>

              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>📋</span>
                <span className="hidden sm:inline">คัดลอกส่ง Discord/LINE</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>📸</span>
                <span>บันทึกรูปภาพ</span>
              </button>
            </div>
          </div>
        )}

        {/* Member View Banner (when in /tactics/view mode) */}
        {isReadOnly && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-200 dark:border-indigo-800/80 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛡️</span>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  แผนยุทธการกิลด์ {displayGuildName}: {activePlan.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  คลิกที่เข็มหมุดบนแผนที่เพื่อดูคำสั่งประจำจุด หรือเลือกดูแผนยุทธการอื่นได้จากเมนูด้านขวา
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1 cursor-pointer"
              >
                <span>📋</span>
                <span>สรุปคำสั่ง</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <span>📸</span>
                <span>รูปภาพ</span>
              </button>
            </div>
          </div>
        )}

        {/* Board & Sidebar Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-5">
          {/* Left / Center: Interactive Map Board */}
          <div className="flex-1 w-full min-w-0">
            <TacticalMapBoard
              plan={activePlan}
              onUpdatePlan={handleUpdatePlan}
              selectedIcon={selectedIcon}
              selectedColor={selectedColor}
              selectedParty={selectedParty}
              isDrawingMode={isDrawingMode}
              drawingColor={drawingColor}
              availableParties={availableParties}
              isReadOnly={isReadOnly}
            />
          </div>

          {/* Right: Tactical Sidebar & Tools */}
          <TacticalSidebar
            plans={plans}
            activePlanId={activePlanId}
            onSelectPlan={setActivePlanId}
            onCreatePlan={handleCreatePlan}
            onDuplicatePlan={handleDuplicatePlan}
            onDeletePlan={handleDeletePlan}
            onChangePlanMap={handleChangePlanMap}
            selectedIcon={selectedIcon}
            onChangeIcon={setSelectedIcon}
            selectedColor={selectedColor}
            onChangeColor={setSelectedColor}
            selectedParty={selectedParty}
            onChangeParty={setSelectedParty}
            isDrawingMode={isDrawingMode}
            onToggleDrawingMode={setIsDrawingMode}
            drawingColor={drawingColor}
            onChangeDrawingColor={setDrawingColor}
            onUndoLine={handleUndoLine}
            onClearLines={handleClearLines}
            onClearAllPins={handleClearAllPins}
            onExportImage={() => setIsExportModalOpen(true)}
            onCopySummary={handleCopySummary}
            availableParties={availableParties}
            activePlan={activePlan}
            onEditPin={(pin) => setViewingPin(pin)}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* Embedded Donate Card at Bottom */}
        <div className="pt-4">
          <DonateCard />
        </div>
      </div>

      {/* Pin View Modal for Sidebar click in read-only mode */}
      <TacticalPinViewModal
        pin={viewingPin}
        isOpen={!!viewingPin}
        onClose={() => setViewingPin(null)}
      />

      {/* Export Image Modal */}
      <TacticalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plan={activePlan}
        guildName={displayGuildName}
      />

      {/* Map Change Warning Confirmation Modal */}
      {pendingMapChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1423] border border-amber-300 dark:border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-2xl mx-auto shadow-inner">
              ⚠️
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                ยืนยันการเปลี่ยนแผนที่?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                แผนยุทธการเลือกได้เพียง <span className="font-bold text-indigo-600 dark:text-indigo-400">1 แผนที่</span> เท่านั้น
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>🚨</span>
                <span>หมุดและเส้นเดินทัพจะหายไปทั้งหมด:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                หากเปลี่ยนไปใช้แผนที่ <b>&ldquo;{pendingMapChange.targetMapName}&rdquo;</b> หมุดคำสั่งที่เคยวางไว้ ({pendingMapChange.pinCount} จุด) และเส้นทางเดินทัพทั้งหมดในแผนนี้จะถูกล้างออกทันที
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPendingMapChange(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                ยกเลิก (คงเดิม)
              </button>
              <button
                type="button"
                onClick={() => executeMapChange(pendingMapChange.mapId, pendingMapChange.customUrl)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-black shadow-md transition cursor-pointer"
              >
                ยืนยันเปลี่ยนแผนที่ (ล้างหมุด)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

