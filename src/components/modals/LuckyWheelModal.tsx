'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AuctionItem, AuctionEntry } from '@/types/auction';
import JobEmblem from '@/components/tactical/JobEmblem';
import TitleSvgIcon from '@/components/icons/TitleSvgIcon';
import TitleChestSvgIcon from '@/components/icons/TitleChestSvgIcon';
import RelicSvgIcon from '@/components/icons/RelicSvgIcon';
import PetSvgIcon from '@/components/icons/PetSvgIcon';
import { getTitleTierStyle } from '@/constants/titleItems';
import { getChestTierStyle } from '@/constants/chestItems';
import { getPetTierStyle } from '@/constants/petItems';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionItem | null;
  onConfirmWinner: (auctionId: string, winnerMemberId: string) => void;
  onOpenRegisterModal?: () => void;
}

const SLICE_COLORS = [
  '#f43f5e', // rose
  '#0ea5e9', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#d946ef', // fuchsia
  '#84cc16', // lime
  '#eab308', // yellow
  '#a855f7', // purple
];

export default function LuckyWheelModal({
  isOpen,
  onClose,
  auction,
  onConfirmWinner,
  onOpenRegisterModal,
}: LuckyWheelModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<AuctionEntry | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Rotation state in radians
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const entries: AuctionEntry[] = useMemo(() => {
    return auction?.entries || [];
  }, [auction]);

  // Reset winner state when auction changes
  useEffect(() => {
    if (auction?.winnerMemberId) {
      const existing = entries.find((e) => e.memberId === auction.winnerMemberId);
      if (existing) {
        setWinner(existing);
      } else if (auction.winnerMemberName) {
        setWinner({
          id: 'prev_winner',
          memberId: auction.winnerMemberId,
          memberName: auction.winnerMemberName,
          memberJob: auction.winnerMemberJob,
          registeredAt: auction.closedAt || '',
        });
      }
    } else {
      setWinner(null);
    }
    setShowConfetti(false);
    setIsSpinning(false);
  }, [auction, entries]);

  // Draw the wheel onto canvas
  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 14;

    ctx.clearRect(0, 0, width, height);

    const count = entries.length;
    if (count === 0) {
      // Draw empty placeholder
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ยังไม่มีผู้ลงชื่อในรายการนี้', centerX, centerY);
      return;
    }

    const arcSize = (Math.PI * 2) / count;

    // Outer glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    // Slices
    for (let i = 0; i < count; i++) {
      const angleStart = rotation + i * arcSize;
      const angleEnd = angleStart + arcSize;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angleStart, angleEnd);
      ctx.closePath();

      // Colors
      const color = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fillStyle = color;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Text inside slice
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angleStart + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      // Dynamic font size depending on count
      const fontSize = count > 20 ? 11 : count > 12 ? 12 : 14;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const name = entries[i].memberName;
      const maxTextWidth = radius - 45;
      let display = name;
      if (ctx.measureText(display).width > maxTextWidth) {
        while (ctx.measureText(display + '..').width > maxTextWidth && display.length > 2) {
          display = display.slice(0, -1);
        }
        display += '..';
      }

      ctx.fillText(display, radius - 20, 0);
      ctx.restore();

      ctx.restore();
    }

    // Center Hub (Pin)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f43f5e';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎰', centerX, centerY);
    ctx.restore();
  }, [entries]);

  // Initial draw & resize
  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [drawWheel]);

  if (!isOpen || !auction) return null;

  // Spin animation
  const handleSpin = () => {
    if (isSpinning || entries.length === 0) return;

    setIsSpinning(true);
    setWinner(null);
    setShowConfetti(false);

    const count = entries.length;
    const arcSize = (Math.PI * 2) / count;

    // Pick random winning index
    const winningIndex = Math.floor(Math.random() * count);
    const winningMember = entries[winningIndex];

    // Pointer is at TOP (12 o'clock, which is -Math.PI / 2 or 3*Math.PI / 2).
    // Angle that corresponds to slice i is: rotation + i * arcSize + arcSize/2
    // We want: rotation + winningIndex * arcSize + arcSize/2 = 3 * Math.PI / 2 (mod 2PI)
    // So targetRotation mod 2PI = 3*Math.PI/2 - (winningIndex * arcSize + arcSize/2)
    const pointerAngle = (3 * Math.PI) / 2;
    const targetSliceCenter = winningIndex * arcSize + arcSize / 2;
    let targetAngle = pointerAngle - targetSliceCenter;

    // Normalize target angle to positive
    while (targetAngle < 0) targetAngle += Math.PI * 2;

    // Number of full spins (between 6 and 9 full spins)
    const fullSpins = 7 * Math.PI * 2;
    const startRotation = currentRotationRef.current % (Math.PI * 2);
    const totalRotationNeeded = fullSpins + (targetAngle - startRotation + Math.PI * 2) % (Math.PI * 2);

    const spinDuration = 5500; // 5.5s
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3.5);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      const eased = easeOutCubic(progress);

      const currentAngle = startRotation + totalRotationNeeded * eased;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinner(winningMember);
        setShowConfetti(true);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleConfirmWinnerClick = () => {
    if (!winner) return;
    onConfirmWinner(auction.id, winner.memberId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-rose-500/40 bg-[#0d121f] p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[95vh] flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-xl border border-rose-500/40 text-amber-400">
              🎡
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                <span>วงล้อสุ่มผู้โชคดี (Lucky Wheel Raffle)</span>
              </h3>
              <p className="text-xs text-slate-400">
                สุ่มหาผู้ได้รับไอเทมจากรายชื่อสมาชิกที่ลงชื่อ ({entries.length} คน)
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSpinning}
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 transition cursor-pointer disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Item Banner Bar */}
        {(() => {
          const isTitle = auction.itemCategory === 'title' || (auction.cardSlot && auction.cardSlot.includes('Title')) || (auction.cardQuality && auction.cardQuality.includes('Title'));
          const isChest = !isTitle && (auction.itemCategory === 'chest' || (auction.cardSlot && (auction.cardSlot.includes('หีบ') || auction.cardSlot.includes('กล่อง') || auction.cardSlot.includes('Pack'))));
          const isPet = !isTitle && !isChest && (auction.itemCategory === 'pet' || (auction.cardSlot && auction.cardSlot.includes('สัตว์เลี้ยง')) || (auction.cardQuality && auction.cardQuality.startsWith('Pet')));
          const isRelic = !isTitle && !isChest && !isPet && (auction.itemCategory === 'relic' || auction.cardQuality === 'Sage');
          const isCard = !isTitle && !isChest && !isPet && !isRelic && (auction.itemCategory === 'card' || auction.cardQuality === 'Purple');
          const titleTier = isTitle ? getTitleTierStyle(auction.accessoryIcon || auction.accessoryName || auction.cardQuality) : null;
          const chestTier = isChest ? getChestTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const petTier = isPet ? getPetTierStyle(auction.accessoryName || auction.cardQuality) : null;
          const imageSrc = isTitle
            ? `/images/titles/${auction.accessoryIcon}.webp`
            : isChest
            ? `/images/chests/${auction.accessoryIcon}.webp`
            : isPet
            ? `/images/pets/${auction.accessoryIcon}.webp`
            : isRelic
            ? `/images/relics/${auction.accessoryIcon}.webp`
            : isCard
            ? `/images/cards/${auction.accessoryIcon}.webp`
            : `/images/accessories/${auction.accessoryIcon}.webp`;

          return (
            <div className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-inner shrink-0 ${
              isTitle ? `${titleTier?.border} ${titleTier?.bg}` : isChest ? `${chestTier?.border} ${chestTier?.bg}` : isPet ? `${petTier?.border} ${petTier?.bg}` : isRelic ? 'border-amber-500/30 bg-amber-950/20' : isCard ? 'border-purple-500/30 bg-purple-950/20' : 'border-rose-500/30 bg-rose-950/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`relative w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center shadow ${
                  isTitle ? `${titleTier?.border} bg-[#0c1220]` : isChest ? `${chestTier?.border} bg-[#0c1220]` : isPet ? `${petTier?.border} bg-[#0c1220]` : isRelic ? 'border-amber-500/40 bg-[#0c1220]' : isCard ? 'border-purple-500/40 bg-[#0c1220]' : 'border-rose-500/40 bg-[#0c1220]'
                }`}>
                  <Image
                    src={imageSrc}
                    alt={auction.accessoryName}
                    width={40}
                    height={40}
                    unoptimized
                    className="object-contain drop-shadow"
                    onError={(e) => {
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
                      (e.target as HTMLImageElement).src = fallback;
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
                      {petTier?.tier === 'gold' ? 'SSR' : petTier?.tier === 'purple' ? 'SR' : petTier?.tier === 'blue' ? 'R' : 'N'}
                    </span>
                  ) : isRelic ? (
                    <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-amber-950/90 border border-amber-500/60 text-amber-200">
                      Sage
                    </span>
                  ) : isCard ? (
                    <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[7px] font-bold bg-purple-950/90 border border-purple-500/60 text-purple-200">
                      {auction.cardSlot || 'MVP'}
                    </span>
                  ) : (
                    auction.accessoryLevel && (
                      <span className="absolute bottom-0 right-0 px-1 py-0.2 rounded text-[8px] font-bold bg-black/90 border border-slate-700 text-amber-300 font-mono">
                        Lv.{auction.accessoryLevel}
                      </span>
                    )
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-white">{auction.accessoryName}</h4>
                    {isTitle ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${titleTier?.badgeBg}`}>
                        <TitleSvgIcon className="w-3 h-3" />
                        <span>{auction.cardQuality || titleTier?.label}</span>
                      </span>
                    ) : isChest ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${chestTier?.badgeBg}`}>
                        <TitleChestSvgIcon className="w-3 h-3" variant={chestTier?.tier} />
                        <span>{auction.cardQuality || chestTier?.label}</span>
                      </span>
                    ) : isPet ? (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border flex items-center gap-1 ${petTier?.badgeBg}`}>
                        <PetSvgIcon className="w-3 h-3" variant={petTier?.tier} />
                        <span>{auction.cardQuality || petTier?.label}</span>
                      </span>
                    ) : isRelic ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <RelicSvgIcon className="w-3 h-3" />
                        <span>Relic · {auction.cardSlot || 'Sage'}</span>
                      </span>
                    ) : isCard ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        🃏 MVP ม่วง · {auction.cardSlot || 'การ์ด'}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        💎 Red
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    ผู้ลงชื่อชิงไอเทม:{' '}
                    <strong className="text-amber-400 font-mono">
                      {entries.length}
                      {auction.maxEntries ? `/${auction.maxEntries}` : ''}
                    </strong>{' '}
                    คน
                    {auction.maxEntries && entries.length >= auction.maxEntries && (
                      <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        เต็มโควตา
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {onOpenRegisterModal && (
                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={() => {
                    onClose();
                    onOpenRegisterModal();
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer disabled:opacity-40"
                >
                  ➕ จัดการรายชื่อ
                </button>
              )}
            </div>
          );
        })()}

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center justify-center my-1 select-none">
          {/* Top Pointer Indicator */}
          <div className="absolute top-0 z-20 flex flex-col items-center -translate-y-2 pointer-events-none">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]" />
          </div>

          {/* Canvas Wheel */}
          <div className="relative rounded-full p-2 bg-gradient-to-br from-slate-800 via-[#0a0f1d] to-slate-900 shadow-2xl shadow-rose-950/40">
            <canvas
              ref={canvasRef}
              width={380}
              height={380}
              className="rounded-full max-w-[320px] max-h-[320px] sm:max-w-[380px] sm:max-h-[380px]"
            />
          </div>
        </div>

        {/* Winner Announcement or Spin Button */}
        <div className="w-full flex flex-col items-center gap-3 pt-2">
          {winner ? (
            <div className="w-full rounded-2xl border-2 border-emerald-500/60 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 p-4 shadow-xl text-center space-y-2.5 animate-bounce-once">
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🎉</span>
                <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  ขอแสดงความยินดีกับผู้ชนะ!
                </span>
                <span className="text-2xl">🎉</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                {winner.memberJob && (
                  <JobEmblem job={winner.memberJob} size={32} />
                )}
                <div className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  {winner.memberName}
                </div>
              </div>

              <p className="text-xs text-slate-300">
                ได้รับไอเทม <strong className="text-rose-300">{auction.accessoryName}</strong> ไปครอง!
              </p>

              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleSpin}
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  🔄 สุ่มใหม่อีกครั้ง
                </button>

                <button
                  type="button"
                  onClick={handleConfirmWinnerClick}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-extrabold text-white shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>🏆</span>
                  <span>บันทึกผลผู้ชนะ (ปิดรายการ)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={isSpinning || entries.length === 0}
                onClick={handleSpin}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 disabled:opacity-40 text-base font-extrabold text-white shadow-xl shadow-rose-950/50 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
              >
                <span className="text-xl">{isSpinning ? '🌀' : '🎡'}</span>
                <span>{isSpinning ? 'กำลังหมุนวงล้อ...' : 'เริ่มหมุนวงล้อสุ่ม (SPIN)!'}</span>
              </button>

              {entries.length === 0 && (
                <p className="text-xs text-rose-400 font-semibold">
                  ⚠️ ยังไม่มีสมาชิกที่ลงชื่อชิงไอเทมนี้ กรุณากดปุ่ม &ldquo;จัดการรายชื่อ&rdquo; เพื่อเพิ่มสมาชิกก่อน
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

