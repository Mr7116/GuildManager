'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { RED_ACCESSORIES, RedAccessory } from '@/constants/redAccessories';
import { PURPLE_MVP_CARDS, PurpleMvpCard } from '@/constants/purpleMvpCards';
import { GVG_BASE_RELICS, GvgBaseRelic } from '@/constants/gvgRelics';
import { RELIC_AFFIXES, RelicAffix } from '@/constants/relicAffixes';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import { AuctionItem } from '@/types/auction';

export interface SelectableAuctionItem {
  id: number;
  name: string;
  category: 'accessory' | 'card' | 'relic';
  level?: number;
  slot?: string;
  slotTh?: string;
  qualityBadge: string;
  baseName?: string;
  affixName?: string;
  affixEffect?: string;
  icon: string;
  localIcon: string;
  remoteIcon: string;
  stats: string[];
}

interface SelectedEntry {
  entryKey: string;
  item: SelectableAuctionItem;
  affixId?: string;
  count: number;
}

interface AddAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    items: Array<Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }>
  ) => void;
}

export default function AddAuctionModal({ isOpen, onClose, onConfirm }: AddAuctionModalProps) {
  const [categoryTab, setCategoryTab] = useState<'all' | 'accessory' | 'card' | 'relic'>('all');
  const [selectedAffixId, setSelectedAffixId] = useState<string>('sage');
  const [search, setSearch] = useState('');
  const [sourceNote, setSourceNote] = useState<string>('ดรอปจากกิลด์วอร์ (GVG)');
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedEntry>>({});

  const currentAffix = useMemo(() => {
    return RELIC_AFFIXES.find((a) => a.id === selectedAffixId) || RELIC_AFFIXES[0];
  }, [selectedAffixId]);

  // Dynamic selectable items (Relics update with current selected Affix)
  const allSelectableItems: SelectableAuctionItem[] = useMemo(() => {
    const accessories: SelectableAuctionItem[] = RED_ACCESSORIES.map((acc) => ({
      id: acc.id,
      name: acc.name,
      category: 'accessory' as const,
      level: acc.level,
      qualityBadge: 'Lv.90 Red',
      icon: acc.icon,
      localIcon: acc.localIcon,
      remoteIcon: acc.remoteIcon,
      stats: acc.stats,
    }));

    const cards: SelectableAuctionItem[] = PURPLE_MVP_CARDS.map((card) => ({
      id: card.id,
      name: card.name,
      category: 'card' as const,
      slot: card.slot,
      slotTh: card.slotTh,
      qualityBadge: 'MVP ม่วง',
      icon: card.icon,
      localIcon: card.localIcon,
      remoteIcon: card.remoteIcon,
      stats: card.effects,
    }));

    const relics: SelectableAuctionItem[] = GVG_BASE_RELICS.map((base) => ({
      id: base.id,
      name: `${base.baseName} - ${currentAffix.name}`,
      category: 'relic' as const,
      slot: base.slot,
      slotTh: base.type,
      qualityBadge: `Relic · ${currentAffix.name}`,
      baseName: base.baseName,
      affixName: currentAffix.name,
      affixEffect: currentAffix.effect,
      icon: base.icon,
      localIcon: base.localIcon,
      remoteIcon: base.remoteIcon,
      stats: [`Relic (${currentAffix.effect})`, ...base.baseStats],
    }));

    return [...accessories, ...cards, ...relics];
  }, [currentAffix]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let list = allSelectableItems;
    if (categoryTab !== 'all') {
      list = list.filter((i) => i.category === categoryTab);
    }
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter((i) => {
        const matchBasic =
          i.name.toLowerCase().includes(query) ||
          (i.slotTh && i.slotTh.toLowerCase().includes(query)) ||
          i.stats.some((s) => s.toLowerCase().includes(query)) ||
          (i.affixEffect && i.affixEffect.toLowerCase().includes(query));

        if (matchBasic) return true;

        if (i.category === 'relic') {
          return RELIC_AFFIXES.some(
            (a) =>
              a.name.toLowerCase().includes(query) ||
              a.effect.toLowerCase().includes(query)
          );
        }
        return false;
      });
    }
    return list;
  }, [allSelectableItems, categoryTab, search]);

  // Selected entries array
  const selectedEntries = useMemo(() => Object.values(selectedMap), [selectedMap]);

  const totalItemCount = useMemo(() => {
    return selectedEntries.reduce((sum, entry) => sum + entry.count, 0);
  }, [selectedEntries]);

  if (!isOpen) return null;

  const getEntryKey = (item: SelectableAuctionItem) => {
    if (item.category === 'relic') {
      return `${item.id}_${item.affixName || 'Sage'}`;
    }
    return `${item.id}`;
  };

  const handleToggleItem = (item: SelectableAuctionItem) => {
    const key = getEntryKey(item);
    setSelectedMap((prev) => {
      const existing = prev[key];
      if (existing) {
        return {
          ...prev,
          [key]: {
            ...existing,
            count: existing.count + 1,
          },
        };
      } else {
        return {
          ...prev,
          [key]: {
            entryKey: key,
            item,
            affixId: item.category === 'relic' ? selectedAffixId : undefined,
            count: 1,
          },
        };
      }
    });
  };

  const handleUpdateCount = (entryKey: string, delta: number) => {
    setSelectedMap((prev) => {
      const existing = prev[entryKey];
      if (!existing) return prev;
      const newCount = existing.count + delta;
      if (newCount <= 0) {
        const copy = { ...prev };
        delete copy[entryKey];
        return copy;
      }
      return {
        ...prev,
        [entryKey]: { ...existing, count: newCount },
      };
    });
  };

  const handleRemoveItem = (entryKey: string) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      delete copy[entryKey];
      return copy;
    });
  };

  const handleUpdateRelicAffix = (entryKey: string, newAffixId: string) => {
    const affix = RELIC_AFFIXES.find((a) => a.id === newAffixId);
    if (!affix) return;

    setSelectedMap((prev) => {
      const existing = prev[entryKey];
      if (!existing) return prev;

      const baseName = existing.item.baseName || existing.item.name.split(' - ')[0];
      const newName = `${baseName} - ${affix.name}`;
      const newKey = `${existing.item.id}_${affix.name}`;

      const updatedItem: SelectableAuctionItem = {
        ...existing.item,
        name: newName,
        affixName: affix.name,
        affixEffect: affix.effect,
        qualityBadge: `Relic · ${affix.name}`,
        stats: [`Relic (${affix.effect})`, `สาย: ${affix.name} (${affix.effect})`],
      };

      const copy = { ...prev };
      delete copy[entryKey];

      if (copy[newKey]) {
        copy[newKey] = {
          ...copy[newKey],
          count: copy[newKey].count + existing.count,
        };
      } else {
        copy[newKey] = {
          entryKey: newKey,
          item: updatedItem,
          affixId: affix.id,
          count: existing.count,
        };
      }
      return copy;
    });
  };

  const handleClearAll = () => {
    setSelectedMap({});
  };

  const handleSubmit = (status: 'pending' | 'active') => {
    if (selectedEntries.length === 0) {
      alert('กรุณาคลิกเลือกไอเทมอย่างน้อย 1 ชิ้นเพื่อเพิ่มเข้าสู่รายการ');
      return;
    }

    const itemsToCreate: Array<
      Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }
    > = [];

    for (const entry of selectedEntries) {
      for (let i = 0; i < entry.count; i++) {
        itemsToCreate.push({
          accessoryId: entry.item.id,
          accessoryName: entry.item.name,
          accessoryLevel: entry.item.level,
          accessoryIcon: entry.item.icon,
          accessoryStats: entry.item.stats || [],
          itemCategory: entry.item.category,
          cardSlot:
            entry.item.category === 'relic'
              ? `${entry.item.affixName || 'Sage'} (${entry.item.affixEffect || ''})`
              : entry.item.slotTh || entry.item.slot,
          cardQuality:
            entry.item.category === 'card'
              ? 'Purple'
              : entry.item.category === 'relic'
              ? entry.item.affixName || 'Sage'
              : undefined,
          startPrice: 0,
          minIncrement: 0,
          sourceNote: sourceNote.trim() || undefined,
          status,
        });
      }
    }

    onConfirm(itemsToCreate);

    // Reset & Close
    setSelectedMap({});
    setSearch('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-rose-500/30 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300">
              <RelicSvgIcon className="w-6 h-6" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2 flex-wrap">
                <span>เพิ่มรายการของดรอปเพื่อเปิดสุ่ม (Add Drop Items)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  Relic (27 สาย)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300">
                  MVP ม่วง
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300">
                  Lv.90 Red
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                คลิกเลือก Relic, เครื่องประดับ หรือการ์ดม่วง MVP เพื่อเพิ่มเป็น List รายการให้สมาชิกกิลด์ส่งรายชื่อเข้ามาสุ่มด้วยวงล้อ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Source Note Bar */}
        <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 shrink-0 text-xs">
          <label className="text-slate-400 block mb-1 font-semibold">แหล่งที่มา / หมายเหตุ (Source):</label>
          <input
            type="text"
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
            placeholder="เช่น ดรอปจาก GVG รอบวันอาทิตย์ / Siege War / กล่องสมบัติกิลด์"
            className="w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        {/* Middle Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          {/* Step 1: Item Category & Selector Grid */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-bold">1</span>
                <span>คลิกเลือกไอเทมที่จะนำมาเปิดรอบ (พบ {filteredItems.length} ชิ้น):</span>
              </label>

              <input
                type="text"
                placeholder="ค้นหาชื่อ, สเตตัส, ธาตุ หรือต้านสถานะ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none w-full sm:w-64"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCategoryTab('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'all'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>📦 ทั้งหมด</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                  {allSelectableItems.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('relic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'relic'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <RelicSvgIcon className="w-4 h-4 shrink-0" />
                <span>🏺 Relic (8 ชิ้น · 27 สาย)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-amber-300">
                  {GVG_BASE_RELICS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('card')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'card'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>🃏 การ์ดม่วง MVP</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                  {PURPLE_MVP_CARDS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('accessory')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'accessory'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>💎 เครื่องประดับแดง</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                  {RED_ACCESSORIES.length}
                </span>
              </button>
            </div>

            {/* Relic Affix Selector Bar (Shows ONLY when in Relic tab) */}
            {categoryTab === 'relic' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-950/30 dark:via-slate-900/60 dark:to-amber-950/20 shadow-inner">
                <div className="flex items-center gap-2">
                  <RelicSvgIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <span>เลือกสาย / คุณสมบัติ Relic:</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/40 font-mono">
                        {currentAffix.name} ({currentAffix.effect})
                      </span>
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      คลิกเลือกจาก 27 สาย (สเตตัส / ต้านทานธาตุ / ต้านทานสถานะ) ก่อนกดเลือกไอเทม
                    </p>
                  </div>
                </div>

                <select
                  value={selectedAffixId}
                  onChange={(e) => setSelectedAffixId(e.target.value)}
                  className="rounded-xl border border-amber-500/40 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300 font-bold focus:border-amber-400 focus:outline-none cursor-pointer w-full sm:w-auto shadow-sm"
                >
                  <optgroup label="⚡ สายสเตตัสหลัก (Stats)">
                    {RELIC_AFFIXES.filter((a) => a.category === 'stat').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.effect})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛡️ สายต้านทานธาตุ (Element Resist)">
                    {RELIC_AFFIXES.filter((a) => a.category === 'element').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.effect})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="✨ สายต้านทานสถานะ (Status Resist)">
                    {RELIC_AFFIXES.filter((a) => a.category === 'status').map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.effect})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 max-h-56 overflow-y-auto p-2.5 rounded-2xl border border-slate-800 bg-slate-950/70 scrollbar-thin">
              {filteredItems.map((item) => {
                const key = getEntryKey(item);
                const entry = selectedMap[key];
                const isSelected = !!entry;
                const count = entry?.count || 0;
                const isCard = item.category === 'card';
                const isRelic = item.category === 'relic';

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer relative group ${
                      isSelected
                        ? isRelic
                          ? 'border-amber-400 bg-amber-950/40 ring-1 ring-amber-500 shadow-md shadow-amber-500/20'
                          : isCard
                          ? 'border-purple-400 bg-purple-950/40 ring-1 ring-purple-500 shadow-md shadow-purple-500/20'
                          : 'border-rose-400 bg-rose-950/40 ring-1 ring-rose-500 shadow-md shadow-rose-500/20'
                        : 'border-slate-800 bg-[#0b101c] hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
                      <Image
                        src={item.localIcon}
                        alt={item.name}
                        width={44}
                        height={44}
                        unoptimized
                        className="object-contain drop-shadow"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = item.remoteIcon;
                        }}
                      />
                      {isRelic ? (
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-amber-950/90 border border-amber-500/60 text-amber-200">
                          {item.affixName || 'Sage'}
                        </span>
                      ) : isCard ? (
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[8px] font-bold bg-purple-950/90 border border-purple-500/60 text-purple-200">
                          {item.slot === 'Headwear' ? 'หัว' : item.slot === 'Backwear' ? 'หลัง' : item.slot === 'Mouthwear' ? 'ปาก' : 'หน้า'}
                        </span>
                      ) : (
                        <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[9px] font-bold bg-black/80 border border-slate-700 text-amber-300 font-mono">
                          Lv.{item.level}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-bold text-slate-200 line-clamp-1 w-full" title={item.name}>
                      {item.name}
                    </span>

                    <span
                      className={`text-[9px] font-semibold mt-0.5 truncate w-full ${
                        isRelic ? 'text-amber-400' : isCard ? 'text-purple-400' : 'text-rose-400'
                      }`}
                      title={isRelic ? item.affixEffect : undefined}
                    >
                      {isRelic ? item.affixEffect || 'Relic' : isCard ? 'MVP ม่วง' : 'เครื่องประดับ'}
                    </span>

                    {isSelected && (
                      <span
                        className={`absolute top-1 right-1 flex items-center justify-center px-1.5 py-0.2 rounded-full text-white text-[10px] font-bold shadow ${
                          isRelic
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : isCard
                            ? 'bg-purple-600 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        x{count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Selected Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">2</span>
                <span>รายการไอเทมที่จะเพิ่มเข้าสู่ List ({totalItemCount} ชิ้น):</span>
              </label>
              {selectedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  ล้างรายการทั้งหมด
                </button>
              )}
            </div>

            {selectedEntries.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500 space-y-1">
                <p className="text-sm text-slate-400 font-semibold">ยังไม่มีไอเทมในรายการ</p>
                <p>คลิกที่ไอคอนด้านบนเพื่อเพิ่มเข้าสู่ List รายการเตรียมเปิดสุ่ม</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                {selectedEntries.map((entry) => {
                  const isCard = entry.item.category === 'card';
                  const isRelic = entry.item.category === 'relic';
                  return (
                    <div
                      key={entry.entryKey}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl border transition ${
                        isRelic
                          ? 'border-amber-500/30 bg-[#161208] hover:border-amber-500/50'
                          : isCard
                          ? 'border-purple-500/30 bg-[#0e0c1f] hover:border-purple-500/50'
                          : 'border-slate-800 bg-[#090d18] hover:border-slate-700'
                      }`}
                    >
                      {/* Item Thumbnail & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`relative w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${
                            isRelic
                              ? 'border-amber-500/40 bg-amber-950/30'
                              : isCard
                              ? 'border-purple-500/40 bg-purple-950/30'
                              : 'border-rose-500/30 bg-[#0d121f]'
                          }`}
                        >
                          <Image
                            src={entry.item.localIcon}
                            alt={entry.item.name}
                            width={36}
                            height={36}
                            unoptimized
                            className="object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = entry.item.remoteIcon;
                            }}
                          />
                          {isRelic ? (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-amber-950/90 border border-amber-500/60 text-amber-200">
                              {entry.item.affixName || 'Sage'}
                            </span>
                          ) : isCard ? (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-purple-950/90 border border-purple-500/60 text-purple-200">
                              {entry.item.slot === 'Headwear' ? 'หัว' : entry.item.slot === 'Backwear' ? 'หลัง' : entry.item.slot === 'Mouthwear' ? 'ปาก' : 'หน้า'}
                            </span>
                          ) : (
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[8px] font-bold bg-black/80 border border-slate-700 text-amber-300 font-mono">
                              Lv.{entry.item.level}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-white truncate">{entry.item.name}</h4>
                            {isRelic ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🏺 Relic
                              </span>
                            ) : isCard ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                🃏 MVP ม่วง · {entry.item.slotTh}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                💎 Red Lv.90
                              </span>
                            )}
                          </div>

                          {/* If Relic, allow changing affix on the fly */}
                          {isRelic ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-slate-400">เปลี่ยนสาย:</span>
                              <select
                                value={entry.affixId || RELIC_AFFIXES.find((a) => a.name === entry.item.affixName)?.id || 'sage'}
                                onChange={(e) => handleUpdateRelicAffix(entry.entryKey, e.target.value)}
                                className="rounded-lg border border-amber-500/40 bg-slate-950 px-2 py-0.5 text-[11px] text-amber-300 font-semibold focus:outline-none cursor-pointer"
                              >
                                <optgroup label="⚡ สเตตัสหลัก">
                                  {RELIC_AFFIXES.filter((a) => a.category === 'stat').map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name} ({a.effect})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="🛡️ ต้านทานธาตุ">
                                  {RELIC_AFFIXES.filter((a) => a.category === 'element').map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name} ({a.effect})
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="✨ ต้านทานสถานะ">
                                  {RELIC_AFFIXES.filter((a) => a.category === 'status').map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name} ({a.effect})
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                          ) : (
                            entry.item.stats &&
                            entry.item.stats.length > 0 && (
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {entry.item.stats.join(' | ')}
                              </p>
                            )
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1 bg-slate-950 rounded-xl border border-slate-700 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(entry.entryKey, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold text-white">
                            {entry.count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(entry.entryKey, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(entry.entryKey)}
                          className="text-slate-500 hover:text-rose-400 p-1 text-sm transition cursor-pointer"
                          title="ลบชิ้นนี้ออกจากรายการ"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
          <div className="text-xs text-slate-400">
            รวมทั้งหมด:{' '}
            <strong className="text-white font-mono text-sm">{totalItemCount}</strong> ชิ้น
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              ยกเลิก
            </button>

            {/* Action 1: Add as Pending List (รอเปิดสุ่ม) */}
            <button
              type="button"
              disabled={totalItemCount === 0}
              onClick={() => handleSubmit('pending')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-amber-900/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>📋</span>
              <span>เพิ่มเป็นรายการรอเปิดสุ่ม ({totalItemCount})</span>
            </button>

            {/* Action 2: Add and Start Immediately */}
            <button
              type="button"
              disabled={totalItemCount === 0}
              onClick={() => handleSubmit('active')}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>▶️</span>
              <span>เปิดรับรายชื่อทันที</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
