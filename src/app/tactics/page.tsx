'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import { supabase } from '@/lib/supabase';
import { GUILD_ID } from '@/config/guildConfig';
import { TacticalPlan, TacticalIconType, TacticalColorType, TacticalMapPresetId } from '@/types/tactics';
import { DEFAULT_TACTICAL_PLANS, MAP_PRESETS, TACTICAL_ICONS, TACTICAL_COLORS } from '@/config/tacticsConfig';
import TacticalMapBoard from '@/components/tactics/TacticalMapBoard';
import TacticalSidebar from '@/components/tactics/TacticalSidebar';
import TacticalExportModal from '@/components/tactics/TacticalExportModal';
import DonateCard from '@/components/common/DonateCard';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';

export default function TacticsPage() {
  const { guildName, gvgParties, siegeParties } = useGuildStore();
  const [mounted, setMounted] = useState(false);

  // Initialize with DEFAULT_TACTICAL_PLANS for consistent SSR
  const [plans, setPlans] = useState<TacticalPlan[]>(DEFAULT_TACTICAL_PLANS);
  const [activePlanId, setActivePlanId] = useState<string>('plan_outer_assault');

  // Current Tool State
  const [selectedIcon, setSelectedIcon] = useState<TacticalIconType>('sword');
  const [selectedColor, setSelectedColor] = useState<TacticalColorType>('rose');
  const [selectedParty, setSelectedParty] = useState<string>('ทัพหลัก');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#f43f5e');

  // Modals & Toast State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; icon?: string } | null>(null);

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

    // Supabase Realtime Channel
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
  }, []);

  const showToast = (text: string, icon = '✅') => {
    setToastMsg({ text, icon });
    setTimeout(() => {
      setToastMsg((prev) => (prev?.text === text ? null : prev));
    }, 2800);
  };

  // Plan Handlers
  const handleUpdatePlan = (updatedPlan: TacticalPlan) => {
    const next = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    savePlans(next);
  };

  const handleCreatePlan = (name: string, mapId: TacticalMapPresetId) => {
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
    if (plans.length <= 1) {
      alert('ไม่สามารถลบแผนสุดท้ายได้');
      return;
    }
    const next = plans.filter((p) => p.id !== planId);
    savePlans(next);
    setActivePlanId(next[0].id);
    showToast('ลบแผนเรียบร้อย');
  };

  const handleChangePlanMap = (mapId: TacticalMapPresetId, customUrl?: string) => {
    const next = plans.map((p) =>
      p.id === activePlanId
        ? {
            ...p,
            mapId,
            customImageUrl: customUrl !== undefined ? customUrl : p.customImageUrl,
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    savePlans(next);
    showToast('เปลี่ยนแผนที่เรียบร้อย');
  };

  // Undo / Clear Lines
  const handleUndoLine = () => {
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
    if (!confirm('ต้องการล้างเส้นวาดทั้งหมดในแผนนี้ใช่หรือไม่?')) return;
    handleUpdatePlan({
      ...activePlan,
      lines: [],
      updatedAt: new Date().toISOString(),
    });
    showToast('ล้างเส้นวาดทั้งหมดแล้ว');
  };

  const handleClearAllPins = () => {
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
    lines.push(`🗺️ **[แผนยุทธการ ${guildName}] ${activePlan.name}**`);
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
    lines.push(`🛡️ วางแผนโดยระบบ ${guildName} Guild Manager`);

    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => {
        showToast('คัดลอกสรุปคำสั่งลงคลิปบอร์ดแล้ว! วางใน Discord/LINE ได้เลย', '📋');
      })
      .catch(() => {
        alert('ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง');
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

      {/* Main Container */}
      <div className="mx-auto max-w-[1720px] px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0c101d]/90 backdrop-blur-md shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
              🗺️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-wide">
                  วางแผนกลยุทธ์ & แผนที่ยุทธการ (Tactics Board)
                </h1>
                <AutoSaveBadge />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                ปักหมุดเข็มหมุดหลากสีตามทีม สัญลักษณ์โจมตี ⚔️ ป้องกัน 🛡️ โฟกัส 🎯 และลากเส้นเดินทัพสำหรับกิลด์วอร์ & ปราสาท
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>📋</span>
              <span className="hidden sm:inline">คัดลอกลง Discord/LINE</span>
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
          />
        </div>

        {/* Embedded Donate Card at Bottom */}
        <div className="pt-4">
          <DonateCard />
        </div>
      </div>

      {/* Export Image Modal */}
      <TacticalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        plan={activePlan}
        guildName={guildName}
      />
    </div>
  );
}

