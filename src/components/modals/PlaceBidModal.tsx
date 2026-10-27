'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AuctionItem, isTitleItem, isChestItem, getAuctionItemImageSrc } from '@/types/auction';
import { Member } from '@/types/member';
import JobEmblem from '@/components/tactical/JobEmblem';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { getTitleTierStyle } from '@/constants/titleItems';
import { getChestTierStyle } from '@/constants/chestItems';
import { getPetTierStyle } from '@/constants/petItems';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionItem | null;
  members: Member[];
  onConfirmBid: (
    auctionId: string,
    memberId: string,
    memberName: string,
    memberJob: string | undefined,
    amount: number,
    note?: string
  ) => void;
}

export default function PlaceBidModal({
  isOpen,
  onClose,
  auction,
  members,
  onConfirmBid,
}: PlaceBidModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidNote, setBidNote] = useState<string>('');

  const minNextBid = useMemo(() => {
    if (!auction) return 0;
    if (auction.bids.length === 0) return auction.startPrice;
    return auction.currentPrice + auction.minIncrement;
  }, [auction]);

  useEffect(() => {
    if (auction) {
      setBidAmount(minNextBid);
      setBidNote('');
      if (members.length > 0 && !selectedMemberId) {
        setSelectedMemberId(members[0].id);
      }
    }
  }, [auction, minNextBid, members, selectedMemberId]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members;
    const q = memberSearch.trim().toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.job && m.job.toLowerCase().includes(q))
    );
  }, [members, memberSearch]);

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  if (!isOpen || !auction) return null;

  const handleQuickAdd = (add: number) => {
    setBidAmount((prev) => Math.max(minNextBid, (prev || minNextBid) + add));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      alert('กรุณาเลือกสมาชิกผู้เสนอราคา');
      return;
    }
    if (bidAmount < minNextBid) {
      alert(`ราคาเสนอต้องไม่ต่ำกว่า ${minNextBid.toLocaleString()} หน่วย`);
      return;
    }

    onConfirmBid(
      auction.id,
      selectedMember.id,
      selectedMember.name,
      selectedMember.job,
      bidAmount,
      bidNote.trim() || undefined
    );
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/30 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg border border-amber-500/30 text-amber-300">
              💰
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                เสนอราคาประมูล (Place Bid)
              </h3>
              <p className="text-xs text-slate-400">
                เคาะราคาเพื่อชิงเครื่องประดับระดับแดงเข้าสู่ตัวละคร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Item Info Card */}
        {(() => {
          const isTitle = isTitleItem(auction);
          const isChest = isChestItem(auction);
          const isPet = !isTitle && !isChest && (auction.itemCategory === 'pet' || (auction.cardSlot && auction.cardSlot.includes('สัตว์เลี้ยง')) || (auction.cardQuality && auction.cardQuality.startsWith('Pet')));
          const isRelic = !isTitle && !isChest && !isPet && (auction.itemCategory === 'relic' || auction.cardQuality === 'Sage');
          const isCard = !isTitle && !isChest && !isPet && !isRelic && (auction.itemCategory === 'card' || auction.cardQuality === 'Purple');
          const titleTier = isTitle ? getTitleTierStyle(auction.accessoryIcon || auction.accessoryName || auction.cardQuality) : null;
          const chestTier = isChest ? getChestTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const petTier = isPet ? getPetTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const imageSrc = getAuctionItemImageSrc(auction);

          return (
            <div className={`flex items-center gap-3 p-3 rounded-2xl border shadow-inner ${
              isTitle ? `${titleTier?.border} ${titleTier?.bg}` : isChest ? `${chestTier?.border} ${chestTier?.bg}` : isPet ? `${petTier?.border} ${petTier?.bg}` : isRelic ? 'border-amber-500/30 bg-amber-950/20' : isCard ? 'border-purple-500/30 bg-purple-950/20' : 'border-rose-500/30 bg-rose-950/20'
            }`}>
              <div className={`relative w-14 h-14 shrink-0 rounded-xl border flex items-center justify-center ${
                isTitle ? `${titleTier?.border} bg-[#0c1220]` : isChest ? `${chestTier?.border} bg-[#0c1220]` : isPet ? `${petTier?.border} bg-[#0c1220]` : isRelic ? 'border-amber-500/40 bg-[#0c1220]' : isCard ? 'border-purple-500/40 bg-[#0c1220]' : 'border-rose-500/40 bg-[#0c1220]'
              }`}>
                {auction.accessoryIcon.includes('title_chest') ? (
                  <TitleChestSvgIcon
                    variant={chestTier?.tier || 'gold'}
                    className="w-12 h-12 drop-shadow"
                  />
                ) : (
                  <Image
                    src={imageSrc}
                    alt={auction.accessoryName}
                    width={48}
                    height={48}
                    unoptimized
                    className="object-contain drop-shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      const fallback = isTitle
                        ? `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`
                        : isChest
                        ? (auction.accessoryIcon.includes('title_chest')
                            ? `/images/chests/${auction.accessoryIcon}.svg`
                            : auction.accessoryIcon.includes('stonebox') || auction.accessoryIcon.includes('gem')
                            ? `https://roworlddb.com/media/images/item/icon_item_stonebox_14.webp`
                            : `https://roworlddb.com/media/images/item/icon_item_bx_fy.webp`)
                        : isPet
                        ? (auction.accessoryIcon.includes('mfmm')
                            ? `https://roworlddb.com/media/images/icon/pet/${auction.accessoryIcon}.webp`
                            : `https://roworlddb.com/media/images/pet/${auction.accessoryIcon}.webp`)
                        : isRelic
                        ? `https://roworlddb.com/media/images/hallows/${auction.accessoryIcon}.webp`
                        : `https://roworlddb.com/media/images/item/${auction.accessoryIcon}.webp`;
                      target.src = fallback;
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm text-white truncate">{auction.accessoryName}</h4>
                  {isTitle ? (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                      <TitleSvgIcon className="w-3 h-3" />
                      <span>{auction.cardQuality || titleTier?.label}</span>
                    </span>
                  ) : isChest ? (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                      <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                      <span>{auction.cardQuality || chestTier?.label}</span>
                    </span>
                  ) : isPet ? (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                      <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                      <span>{auction.cardQuality || petTier?.label}</span>
                    </span>
                  ) : isRelic ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <RelicSvgIcon className="w-3 h-3" />
                      <span>Relic</span>
                    </span>
                  ) : isCard ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      🃏 MVP ม่วง
                    </span>
                  ) : auction.accessoryLevel ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      Lv.{auction.accessoryLevel}
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  ราคาปัจจุบัน:{' '}
                  <span className="text-amber-400 font-extrabold font-mono text-sm">
                    {auction.currentPrice.toLocaleString()} หน่วย
                  </span>
                  {auction.winnerMemberName && (
                    <span className="text-slate-300 ml-1">
                      (โดย <strong className="text-white">{auction.winnerMemberName}</strong>)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">
                  เสนอขั้นต่ำถัดไป:{' '}
                  <strong className="text-emerald-400 font-mono">
                    {minNextBid.toLocaleString()} หน่วย
                  </strong>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Bid Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              เลือกสมาชิกผู้เสนอราคา:
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="พิมพ์ค้นหาชื่อ หรืออาชีพ..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {filteredMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.job || 'ไม่ระบุ'}) — Gear: {m.gear?.toLocaleString() || '-'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Member Preview */}
          {selectedMember && (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/70 text-xs">
              <JobEmblem job={selectedMember.job} size={24} />
              <div className="flex-1 min-w-0">
                <span className="font-extrabold text-white">{selectedMember.name}</span>
                <span className="text-slate-400 ml-1.5">({selectedMember.job || 'ไม่ระบุ'})</span>
              </div>
            </div>
          )}

          {/* Bid Amount Input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              จำนวนราคาที่ต้องการเสนอ (อย่างน้อย {minNextBid.toLocaleString()} หน่วย):
            </label>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-amber-400 font-bold">💰</span>
              <input
                type="number"
                min={minNextBid}
                step={auction.minIncrement || 100}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-amber-500/50 bg-slate-950 pl-9 pr-3 py-2.5 text-base text-amber-300 font-mono font-extrabold focus:border-amber-400 focus:outline-none"
                required
              />
            </div>

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">เคาะเพิ่ม:</span>
              {[500, 1000, 2000, 5000, 10000].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleQuickAdd(step)}
                  className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-[11px] font-bold text-amber-300 font-mono transition cursor-pointer"
                >
                  +{step.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              หมายเหตุการเสนอราคา (ถ้ามี):
            </label>
            <input
              type="text"
              value={bidNote}
              onChange={(e) => setBidNote(e.target.value)}
              placeholder="เช่น ขอเอาไปใช้เป็นเซ็ตหลัก"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={bidAmount < minNextBid || !selectedMember}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <span>🔨</span>
              <span>ยืนยันเสนอราคา ({bidAmount.toLocaleString()} หน่วย)</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

