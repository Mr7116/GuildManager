'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { RED_ACCESSORIES, RedAccessory } from '@/constants/redAccessories';
import { PURPLE_MVP_CARDS, PurpleMvpCard } from '@/constants/purpleMvpCards';
import { GVG_BASE_RELICS, GvgBaseRelic } from '@/constants/gvgRelics';
import { RELIC_AFFIXES, RelicAffix } from '@/constants/relicAffixes';
import { TITLE_ITEMS, TitleItem, getTitleTierStyle } from '@/constants/titleItems';
import { CHEST_ITEMS, ChestItem, getChestTierStyle } from '@/constants/chestItems';
import { PET_ITEMS, PetItem, getPetTierStyle } from '@/constants/petItems';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { AuctionItem } from '@/types/auction';

export interface SelectableAuctionItem {
  id: number;
  name: string;
  category: 'accessory' | 'card' | 'relic' | 'title' | 'chest' | 'pet';
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
  maxEntries?: number;
}

interface AddAuctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    items: Array<Omit<AuctionItem, 'id' | 'createdAt' | 'currentPrice' | 'bids' | 'status' | 'entries'> & { status?: 'pending' | 'active' }>
  ) => void;
}

export default function AddAuctionModal({ isOpen, onClose, onConfirm }: AddAuctionModalProps) {
  const [categoryTab, setCategoryTab] = useState<'all' | 'accessory' | 'card' | 'relic' | 'title' | 'chest' | 'pet'>('all');
  const [selectedAffixId, setSelectedAffixId] = useState<string>('sage');
  const [search, setSearch] = useState('');
  const [sourceNote, setSourceNote] = useState<string>('ดรอปจากกิลด์วอร์ (GVG)');
  const [defaultMaxEntries, setDefaultMaxEntries] = useState<number | undefined>(undefined);
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
      stats: [`GVG Relic (${currentAffix.effect})`, ...base.baseStats],
    }));

    const titles: SelectableAuctionItem[] = TITLE_ITEMS.map((title) => ({
      id: title.id,
      name: title.name,
      category: 'title' as const,
      slot: title.type,
      slotTh: title.type,
      qualityBadge: title.qualityBadge,
      icon: title.icon,
      localIcon: title.localIcon,
      remoteIcon: title.remoteIcon,
      stats: title.stats,
    }));

    const chests: SelectableAuctionItem[] = CHEST_ITEMS.map((chest) => ({
      id: chest.id,
      name: chest.name,
      category: 'chest' as const,
      slot: chest.type,
      slotTh: chest.type,
      qualityBadge: chest.qualityBadge,
      icon: chest.icon,
      localIcon: chest.localIcon,
      remoteIcon: chest.remoteIcon,
      stats: chest.stats,
    }));

    const pets: SelectableAuctionItem[] = PET_ITEMS.map((pet) => ({
      id: pet.id,
      name: pet.name,
      category: 'pet' as const,
      slot: pet.qualityTag,
      slotTh: pet.qualityName,
      qualityBadge: pet.qualityBadge,
      icon: pet.icon,
      localIcon: pet.localIcon,
      remoteIcon: pet.remoteIcon,
      stats: pet.stats,
    }));

    return [...accessories, ...cards, ...relics, ...titles, ...chests, ...pets];
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
            maxEntries: defaultMaxEntries !== undefined ? defaultMaxEntries : (item.category === 'title' ? 24 : undefined),
          },
        };
      }
    });
  };

  const handleUpdateEntryMaxLimit = (entryKey: string, maxLimit?: number) => {
    setSelectedMap((prev) => {
      const existing = prev[entryKey];
      if (!existing) return prev;
      return {
        ...prev,
        [entryKey]: {
          ...existing,
          maxEntries: maxLimit !== undefined && maxLimit > 0 ? maxLimit : undefined,
        },
      };
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
        stats: [`GVG Relic (${affix.effect})`, `สาย: ${affix.name} (${affix.effect})`],
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
              : entry.item.category === 'title'
              ? 'ไอเทม Title'
              : entry.item.category === 'chest'
              ? 'กล่อง / หีบสมบัติ (Pack)'
              : entry.item.category === 'pet'
              ? `สัตว์เลี้ยง (${entry.item.slot || 'Pet'})`
              : entry.item.slotTh || entry.item.slot,
          cardQuality:
            entry.item.category === 'card'
              ? 'Purple'
              : entry.item.category === 'relic'
              ? entry.item.affixName || 'Sage'
              : entry.item.category === 'title'
              ? entry.item.qualityBadge || 'Title'
              : entry.item.category === 'chest'
              ? entry.item.qualityBadge || 'Pack'
              : entry.item.category === 'pet'
              ? entry.item.qualityBadge || 'Pet'
              : undefined,
          startPrice: 0,
          minIncrement: 0,
          maxEntries: entry.maxEntries && entry.maxEntries > 0 ? entry.maxEntries : undefined,
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
              </h3>             
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

        {/* Source Note & Quota Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/60 shrink-0 text-xs">
          <div className="md:col-span-2">
            <label className="text-slate-400 block mb-1 font-semibold">แหล่งที่มา / หมายเหตุ (Source):</label>
            <input
              type="text"
              value={sourceNote}
              onChange={(e) => setSourceNote(e.target.value)}
              placeholder="เช่น ดรอปจาก GVG รอบวันอาทิตย์ / Siege War / กล่องสมบัติกิลด์"
              className="w-full rounded-xl border border-slate-700 bg-[#080d1a] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold flex items-center justify-between">
              <span>โควตาคนลงชื่อเริ่มต้น:</span>
              <span className="text-[10px] text-amber-400 font-bold">
                {defaultMaxEntries ? `จำกัด ${defaultMaxEntries} คน (0/${defaultMaxEntries})` : 'ไม่จำกัด'}
              </span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setDefaultMaxEntries(undefined);
                  setSelectedMap((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => (next[k] = { ...next[k], maxEntries: undefined }));
                    return next;
                  });
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  defaultMaxEntries === undefined
                    ? 'bg-slate-700 text-white border-slate-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                ไม่จำกัด
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultMaxEntries(1);
                  setSelectedMap((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => (next[k] = { ...next[k], maxEntries: 1 }));
                    return next;
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  defaultMaxEntries === 1
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 font-black shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="ตั้งค่าให้คนลงชื่อได้แค่ 1 คน พอลงครบแล้วปิดรับทันที (0/1)"
              >
                ⚡ 1 คน (0/1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDefaultMaxEntries(24);
                  setSelectedMap((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => (next[k] = { ...next[k], maxEntries: 24 }));
                    return next;
                  });
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  defaultMaxEntries === 24
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 font-black shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="ตั้งค่าโควตา 24 คน (เหมาะสำหรับ Title GVG 24 ชิ้น)"
              >
                👑 24 คน (0/24)
              </button>
              <input
                type="number"
                min={0}
                placeholder="กำหนด"
                value={defaultMaxEntries ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value) || 0);
                  const parsed = val && val > 0 ? val : undefined;
                  setDefaultMaxEntries(parsed);
                  setSelectedMap((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => (next[k] = { ...next[k], maxEntries: parsed }));
                    return next;
                  });
                }}
                className="w-14 text-center rounded-lg border border-slate-700 bg-[#080d1a] px-1 py-1 text-xs text-amber-300 font-bold placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                title="กำหนดจำนวนคนลงชื่อสูงสุดต่อชิ้น"
              />
            </div>
          </div>
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
                onClick={() => setCategoryTab('pet')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'pet'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black shadow-md shadow-orange-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <PetSvgIcon className="w-4 h-4 shrink-0" variant="gold" />
                <span> สัตว์เลี้ยง (Pet)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-amber-300">
                  {PET_ITEMS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('title')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'title'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-amber-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <TitleSvgIcon className="w-4 h-4 shrink-0" />
                <span> Title</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-amber-300">
                  {TITLE_ITEMS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryTab('chest')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  categoryTab === 'chest'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 text-white font-black shadow-md shadow-purple-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <TitleChestSvgIcon className="w-4 h-4 shrink-0" />
                <span> กล่อง / หีบสมบัติ (Pack)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-purple-300">
                  {CHEST_ITEMS.length}
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
                <span>🏺Relic (8 ชิ้น · 27 สาย)</span>
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
                <span> การ์ดม่วง MVP</span>
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
                <span> เครื่องประดับแดง</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
                  {RED_ACCESSORIES.length}
                </span>
              </button>
            </div>

            {/* Relic Affix Selector Bar (Shows in Relic and All tabs) */}
            {(categoryTab === 'relic' || categoryTab === 'all') && (
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
                const isTitle = item.category === 'title';
                const isChest = item.category === 'chest';
                const isPet = item.category === 'pet';
                const titleTier = isTitle ? getTitleTierStyle(item.icon || item.name) : null;
                const chestTier = isChest ? getChestTierStyle(item.name || item.qualityBadge) : null;
                const petTier = isPet ? getPetTierStyle(item.name || item.qualityBadge) : null;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer relative group ${
                      isSelected
                        ? isTitle
                          ? `${titleTier?.border} ${titleTier?.bg} ring-1 ring-current shadow-md ${titleTier?.shadow}`
                          : isChest
                          ? `${chestTier?.border} ${chestTier?.bg} ring-1 ring-current shadow-md ${chestTier?.shadow}`
                          : isPet
                          ? `${petTier?.border} ${petTier?.bg} ring-1 ring-current shadow-md ${petTier?.shadow}`
                          : isRelic
                          ? 'border-amber-400 bg-amber-950/40 ring-1 ring-amber-500 shadow-md shadow-amber-500/20'
                          : isCard
                          ? 'border-purple-400 bg-purple-950/40 ring-1 ring-purple-500 shadow-md shadow-purple-500/20'
                          : 'border-rose-400 bg-rose-950/40 ring-1 ring-rose-500 shadow-md shadow-rose-500/20'
                        : isTitle
                        ? `${titleTier?.border} bg-[#0b101c] hover:bg-slate-900/80`
                        : isChest
                        ? `${chestTier?.border} bg-[#0b101c] hover:bg-slate-900/80`
                        : isPet
                        ? `${petTier?.border} bg-[#0b101c] hover:bg-slate-900/80`
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
                      {isTitle ? (
                        <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${titleTier?.badgeBg}`}>
                          {titleTier?.tier === 'gold' ? 'ทอง' : titleTier?.tier === 'purple' ? 'ม่วง' : titleTier?.tier === 'blue' ? 'ฟ้า' : 'เขียว'}
                        </span>
                      ) : isChest ? (
                        <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${chestTier?.badgeBg}`}>
                          {chestTier?.tier === 'purple' ? 'ม่วง' : chestTier?.tier === 'blue' ? 'ฟ้า' : 'ทอง'}
                        </span>
                      ) : isPet ? (
                        <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${petTier?.badgeBg}`}>
                          {item.slot || (petTier?.tier === 'gold' ? 'SSR' : petTier?.tier === 'purple' ? 'SR' : petTier?.tier === 'blue' ? 'R' : 'N')}
                        </span>
                      ) : isRelic ? (
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
                        isTitle
                          ? titleTier?.text
                          : isChest
                          ? chestTier?.text
                          : isPet
                          ? petTier?.text
                          : isRelic
                          ? 'text-amber-400'
                          : isCard
                          ? 'text-purple-400'
                          : 'text-rose-400'
                      }`}
                      title={isRelic ? item.affixEffect : undefined}
                    >
                      {isTitle
                        ? item.qualityBadge || titleTier?.label
                        : isChest
                        ? item.qualityBadge || chestTier?.label
                        : isPet
                        ? item.qualityBadge || petTier?.label
                        : isRelic
                        ? item.affixEffect || 'GVG Relic'
                        : isCard
                        ? 'MVP ม่วง'
                        : 'เครื่องประดับ'}
                    </span>

                    {isSelected && (
                      <span
                        className={`absolute top-1 right-1 flex items-center justify-center px-1.5 py-0.2 rounded-full text-white text-[10px] font-bold shadow ${
                          isTitle
                            ? titleTier?.badgeBg
                            : isChest
                            ? chestTier?.badgeBg
                            : isPet
                            ? petTier?.badgeBg
                            : isRelic
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
                  const isTitle = entry.item.category === 'title';
                  const isChest = entry.item.category === 'chest';
                  const isPet = entry.item.category === 'pet';
                  const titleTier = isTitle ? getTitleTierStyle(entry.item.icon || entry.item.name) : null;
                  const chestTier = isChest ? getChestTierStyle(entry.item.name || entry.item.qualityBadge) : null;
                  const petTier = isPet ? getPetTierStyle(entry.item.name || entry.item.qualityBadge) : null;
                  return (
                    <div
                      key={entry.entryKey}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-2xl border transition ${
                        isTitle
                          ? `${titleTier?.border} bg-[#0c1220] hover:border-current`
                          : isChest
                          ? `${chestTier?.border} bg-[#0c1220] hover:border-current`
                          : isPet
                          ? `${petTier?.border} bg-[#0c1220] hover:border-current`
                          : isRelic
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
                            isTitle
                              ? `${titleTier?.border} ${titleTier?.bg}`
                              : isChest
                              ? `${chestTier?.border} ${chestTier?.bg}`
                              : isPet
                              ? `${petTier?.border} ${petTier?.bg}`
                              : isRelic
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
                          {isTitle ? (
                            <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${titleTier?.badgeBg}`}>
                              {titleTier?.tier === 'gold' ? 'ทอง' : titleTier?.tier === 'purple' ? 'ม่วง' : titleTier?.tier === 'blue' ? 'ฟ้า' : 'เขียว'}
                            </span>
                          ) : isChest ? (
                            <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${chestTier?.badgeBg}`}>
                              {chestTier?.tier === 'purple' ? 'ม่วง' : chestTier?.tier === 'blue' ? 'ฟ้า' : 'ทอง'}
                            </span>
                          ) : isPet ? (
                            <span className={`absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold border ${petTier?.badgeBg}`}>
                              {entry.item.slot || (petTier?.tier === 'gold' ? 'SSR' : petTier?.tier === 'purple' ? 'SR' : petTier?.tier === 'blue' ? 'R' : 'N')}
                            </span>
                          ) : isRelic ? (
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
                            {isTitle ? (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                                <TitleSvgIcon className="w-3 h-3" />
                                <span>{entry.item.qualityBadge || titleTier?.label}</span>
                              </span>
                            ) : isChest ? (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                                <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                                <span>{entry.item.qualityBadge || chestTier?.label}</span>
                              </span>
                            ) : isPet ? (
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                                <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                                <span>{entry.item.qualityBadge || petTier?.label}</span>
                              </span>
                            ) : isRelic ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                🏺 GVG Relic
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

                      {/* Quota & Quantity & Remove */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end sm:self-center">
                        {/* Per-item Quota Setting */}
                        <div className="flex items-center gap-1 bg-slate-950/80 rounded-xl border border-slate-700/80 px-2 py-1">
                          <span className="text-[10px] text-slate-400 font-semibold">โควตา:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateEntryMaxLimit(entry.entryKey, 1)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                              entry.maxEntries === 1
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                            title="จำกัดคนลงชื่อ 1 คน (0/1)"
                          >
                            0/1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEntryMaxLimit(entry.entryKey, 24)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                              entry.maxEntries === 24
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                            title="จำกัดคนลงชื่อ 24 คน (0/24 เหมาะสำหรับ Title)"
                          >
                            0/24
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateEntryMaxLimit(entry.entryKey, undefined)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer border ${
                              !entry.maxEntries
                                ? 'bg-slate-700 text-white border-slate-600'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                            title="ไม่จำกัดจำนวนคนลงชื่อ"
                          >
                            ไม่จำกัด
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={entry.maxEntries ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? undefined : parseInt(e.target.value);
                              handleUpdateEntryMaxLimit(entry.entryKey, val && val > 0 ? val : undefined);
                            }}
                            placeholder="ระบุ"
                            className="w-10 text-center rounded border border-slate-700 bg-black/60 px-1 py-0.5 text-[10px] text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
                            title="ใส่ตัวเลขโควตา เช่น 1, 2, 3... หรือเว้นว่างเพื่อไม่จำกัด"
                          />
                        </div>

                        {/* Quantity Stepper */}
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
