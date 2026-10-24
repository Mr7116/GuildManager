'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGuildStore } from '@/lib/guildStore';
import { getJobMeta, getJobFamily } from '@/constants/jobs';
import { getGvgLane } from '@/constants/lanes';
import { useTheme } from '@/lib/theme';
import JobEmblem from '@/components/tactical/JobEmblem';

interface ExportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'gvg' | 'siege' | 'polarity';
}

export default function ExportImageModal({ isOpen, onClose, mode = 'gvg' }: ExportImageModalProps) {
  const {
    guildName,
    members,
    gvgTeams,
    gvgParties,
    siegeTeams,
    siegeParties,
    polarityTeams,
    polarityParties,
    selectedDate,
    setSelectedDate,
  } = useGuildStore();

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  const [posterWidth, setPosterWidth] = useState(1680);
  const [rowLayout, setRowLayout] = useState<'4' | '8'>('8');
  const [showLeaveStatus, setShowLeaveStatus] = useState(true);
  const [showLeaveFooter, setShowLeaveFooter] = useState(true);
  const [themeChoice, setThemeChoice] = useState<'auto' | 'dark' | 'light'>('auto');
  const [isExporting, setIsExporting] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const isDarkPoster = themeChoice === 'auto' ? resolvedTheme === 'dark' : themeChoice === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Formatted date string synced with selectedDate
  const selectedThaiDateStr = useMemo(() => {
    let dateObj: Date;
    if (selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      dateObj = new Date(y, m - 1, d);
    } else {
      dateObj = new Date();
    }

    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
    ];
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const dayName = thaiDays[dateObj.getDay()];
    const dateNum = dateObj.getDate();
    const monthName = thaiMonths[dateObj.getMonth()];
    const yearBE = dateObj.getFullYear() + 543;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const pad = (n: number) => String(n).padStart(2, '0');

    return {
      full: `${dayName} ${dateNum} ${monthName} ${yearBE}`,
      stamp: `${pad(dateNum)}/${pad(dateObj.getMonth() + 1)}/${yearBE} ${timeStr}`,
      iso: selectedDate || now.toISOString().split('T')[0],
    };
  }, [selectedDate]);

  // Mode configuration for GVG, Siege, and Polarity
  const modeConfig = useMemo(() => {
    if (mode === 'siege') {
      const defaultTeam = { id: 'siege_team_1', name: 'ทีมปราสาท 1', field: 'main' as const, color: 'sky' };
      const teams = siegeTeams.length > 0 ? siegeTeams : [defaultTeam];
      return {
        title: `ผังทัพศึกชิงปราสาท (Siege War) — ${guildName}`,
        modalTitle: 'ส่งออกรูปภาพผังทัพปราสาท (Siege War PNG)',
        subtitle: `RO Guild Siege War Lineup & Castle Assignments • วันที่ข้อมูล: ${selectedThaiDateStr.stamp}`,
        icon: '🏰',
        fieldTitle: 'ทัพศึกชิงปราสาท (Siege War)',
        fieldSubtitle: 'ทัพหลักประจำสมรภูมิศึกชิงปราสาท',
        badgeColor: 'bg-sky-600',
        borderColor: 'border-sky-500/80',
        showLane: false,
        parties: siegeParties,
        teams,
        filename: `${guildName}_SiegeWar_${selectedThaiDateStr.iso}`,
      };
    }
    if (mode === 'polarity') {
      const defaultTeam = { id: 'pol_main', name: 'สงครามดาว', field: 'main' as const, color: 'amber' };
      const teams = polarityTeams.length > 0 ? polarityTeams : [defaultTeam];
      return {
        title: `ผังทัพสงครามดาว (Polarity War) — ${guildName}`,
        modalTitle: 'ส่งออกรูปภาพผังสงครามดาว (Polarity War PNG)',
        subtitle: `RO Guild Polarity War Lineup & Zone Assignments • วันที่ข้อมูล: ${selectedThaiDateStr.stamp}`,
        icon: '✨',
        fieldTitle: 'ทัพสงครามดาว (Polarity War)',
        fieldSubtitle: 'ทัพประจำสมรภูมิ Polarity Zone',
        badgeColor: 'bg-amber-600',
        borderColor: 'border-amber-500/80',
        showLane: false,
        parties: polarityParties,
        teams,
        filename: `${guildName}_PolarityWar_${selectedThaiDateStr.iso}`,
      };
    }
    // GVG Mode (Default)
    return {
      title: `ผังทัพกิลด์วอร์ (สนามหลัก & สนามรอง) — ${guildName}`,
      modalTitle: 'ส่งออกรูปภาพผังทัพที่จัด (Export PNG)',
      subtitle: `RO Guild Tactical Lineup & Field Assignment (Main / Sub Field) • วันที่ข้อมูล: ${selectedThaiDateStr.stamp}`,
      icon: '⚔️',
      fieldTitle: 'สนามหลัก (Main Field)',
      fieldSubtitle: 'ทัพหลักประจำสมรภูมิหลัก',
      badgeColor: 'bg-amber-600',
      borderColor: 'border-amber-600/80',
      showLane: true,
      parties: gvgParties,
      teams: gvgTeams,
      filename: `${guildName}_GVGLineup_${selectedThaiDateStr.iso}`,
    };
  }, [mode, guildName, selectedThaiDateStr, gvgParties, gvgTeams, siegeParties, siegeTeams, polarityParties, polarityTeams]);

  // Current active parties list for member count
  const currentParties = useMemo(() => {
    return modeConfig.parties;
  }, [modeConfig.parties]);

  // Assigned members in current mode
  const assignedMemberIds = useMemo(() => {
    const s = new Set<string>();
    currentParties.forEach((p) => {
      p.slots?.forEach((id) => {
        if (id) s.add(id);
      });
    });
    return s;
  }, [currentParties]);

  // Status breakdown
  const readyMembers = useMemo(() => members.filter((m) => m.status !== 'leave'), [members]);
  const leaveMembers = useMemo(() => members.filter((m) => m.status === 'leave'), [members]);

  // Teams categorized for display
  const mainTeams = useMemo(() => {
    if (mode !== 'gvg') {
      if (teamFilter === 'all') return modeConfig.teams;
      return modeConfig.teams.filter((t) => t.id === teamFilter);
    }
    if (teamFilter === 'all') return gvgTeams.filter((t) => t.field === 'main');
    if (teamFilter === 'field_main') return gvgTeams.filter((t) => t.field === 'main');
    if (teamFilter === 'field_sub') return [];
    return gvgTeams.filter((t) => t.id === teamFilter && t.field === 'main');
  }, [mode, modeConfig.teams, teamFilter, gvgTeams]);

  const subTeams = useMemo(() => {
    if (mode !== 'gvg') return [];
    if (teamFilter === 'all') return gvgTeams.filter((t) => t.field === 'sub');
    if (teamFilter === 'field_sub') return gvgTeams.filter((t) => t.field === 'sub');
    if (teamFilter === 'field_main') return [];
    return gvgTeams.filter((t) => t.id === teamFilter && t.field === 'sub');
  }, [mode, teamFilter, gvgTeams]);

  // Main Field Parties count
  const mainParties = useMemo(() => {
    if (mode !== 'gvg') return modeConfig.parties;
    return gvgParties.filter((p) => mainTeams.some((t) => t.id === p.teamId));
  }, [mode, modeConfig.parties, gvgParties, mainTeams]);

  const mainMembersCount = useMemo(() => {
    return mainParties.reduce((acc, p) => acc + (p.slots?.filter(Boolean).length || 0), 0);
  }, [mainParties]);

  // Prepared teams with their filtered parties for main board
  const teamsWithParties = useMemo(() => {
    return mainTeams.map((team) => {
      const filtered = mode === 'gvg'
        ? gvgParties.filter((p) => p.teamId === team.id)
        : modeConfig.parties.filter((p) => {
            if (modeConfig.teams.length <= 1) return true;
            if (p.teamId === team.id) return true;
            const isKnownTeam = modeConfig.teams.some((t) => t.id === p.teamId);
            if (!isKnownTeam && team.id === modeConfig.teams[0]?.id) return true;
            return false;
          });
      const teamFilled = filtered.reduce((acc, p) => acc + (p.slots?.filter(Boolean).length || 0), 0);
      return {
        team,
        parties: filtered,
        teamFilled,
      };
    });
  }, [mainTeams, mode, gvgParties, modeConfig.parties, modeConfig.teams]);

  const activeTeamsWithParties = useMemo(() => {
    return teamsWithParties.filter((item) => item.parties.length > 0);
  }, [teamsWithParties]);

  // Smart grouping for Siege War:
  // Combines consecutive teams that together sum to EXACTLY 8 parties (e.g. 4+4, 3+5).
  // If the next team cannot form an exact 8, each team renders in its own separate box.
  const siegeTeamGroups = useMemo(() => {
    if (mode !== 'siege') {
      return activeTeamsWithParties.map((item) => ({
        isCombined: false,
        teams: [item],
        totalParties: item.parties.length,
      }));
    }

    const groups: {
      isCombined: boolean;
      teams: typeof activeTeamsWithParties;
      totalParties: number;
    }[] = [];

    let i = 0;
    while (i < activeTeamsWithParties.length) {
      const current = activeTeamsWithParties[i];
      let runningSum = current.parties.length;
      let j = i + 1;
      let foundExact8 = false;
      let targetEnd = i;

      while (j < activeTeamsWithParties.length && runningSum < 8) {
        runningSum += activeTeamsWithParties[j].parties.length;
        if (runningSum === 8) {
          foundExact8 = true;
          targetEnd = j;
          break;
        }
        j++;
      }

      if (foundExact8 && targetEnd > i) {
        groups.push({
          isCombined: true,
          teams: activeTeamsWithParties.slice(i, targetEnd + 1),
          totalParties: 8,
        });
        i = targetEnd + 1;
      } else {
        groups.push({
          isCombined: false,
          teams: [current],
          totalParties: current.parties.length,
        });
        i++;
      }
    }

    return groups;
  }, [mode, activeTeamsWithParties]);

  // Sub Field Parties count
  const subParties = useMemo(() => {
    if (mode !== 'gvg') return [];
    return gvgParties.filter((p) => subTeams.some((t) => t.id === p.teamId));
  }, [mode, gvgParties, subTeams]);

  const subMembersCount = useMemo(() => {
    return subParties.reduce((acc, p) => acc + (p.slots?.filter(Boolean).length || 0), 0);
  }, [subParties]);

  // High-Res html2canvas Export
  const handleDownload = async () => {
    if (!boardRef.current) return;
    setIsExporting(true);

    try {
      const html2canvas = (await import('html2canvas')).default;

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = boardRef.current;
      const fullHeight = element.scrollHeight;
      const fullWidth = posterWidth;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: isDarkPoster ? '#030712' : '#cfcfcf',
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth + 100,
        windowHeight: fullHeight + 500,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const board = clonedDoc.getElementById('exportPosterBoard');
          if (board) {
            board.style.width = `${posterWidth}px`;
            board.style.minWidth = `${posterWidth}px`;
            board.style.height = 'auto';
            board.style.maxHeight = 'none';
            board.style.overflow = 'visible';
            board.style.transform = 'none';
            if (isDarkPoster) {
              board.classList.add('dark-poster');
              board.classList.remove('light-poster');
            } else {
              board.classList.add('light-poster');
              board.classList.remove('dark-poster');
            }
          }

          // Unclip all parent elements in the cloned document so nothing gets cut off
          let parent = board?.parentElement;
          while (parent) {
            parent.style.overflow = 'visible';
            parent.style.height = 'auto';
            parent.style.maxHeight = 'none';
            parent.style.minHeight = '0';
            parent.style.position = 'static';
            parent.style.transform = 'none';
            parent.scrollTop = 0;
            parent = parent.parentElement;
          }

          if (clonedDoc.body) {
            clonedDoc.body.style.overflow = 'visible';
            clonedDoc.body.style.height = 'auto';
          }
        },
      });

      const link = document.createElement('a');
      link.download = `${modeConfig.filename}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export PNG:', err);
      alert('เกิดข้อผิดพลาดในการเรนเดอร์รูปภาพ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  const renderPartyCard = (party: any, team: any, isEightCols: boolean) => {
    const laneMeta = getGvgLane(party.lane);
    const filledCount = party.slots?.filter(Boolean).length || 0;

    return (
      <div
        key={party.id}
        className={`rounded-2xl border ${
          isDarkPoster
            ? 'border-slate-800/90 bg-[#060b17] shadow-lg'
            : 'border-slate-200 bg-slate-50/70 shadow-sm'
        } ${isEightCols ? 'p-2 space-y-1.5' : 'p-3 space-y-2.5'}`}
      >
        {/* Header */}
        {isEightCols ? (
          <div className="space-y-1 pb-1">
            <div className="flex items-center justify-between text-[11px] gap-1">
              <h3 style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }} className={`font-extrabold text-xs sm:text-sm tracking-wide truncate max-w-[110px] ${
                isDarkPoster ? 'text-white' : 'text-slate-900'
              }`}>
                {party.name}
              </h3>
              <span
                className={`font-extrabold text-[10px] mono whitespace-nowrap px-1.5 py-0.5 rounded shrink-0 ml-auto border ${
                  isDarkPoster
                    ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30'
                    : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                }`}
              >
                {filledCount}/5 คน
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] pt-0.5 overflow-hidden">
              <span
                className={`px-1.5 py-0.5 rounded font-bold text-[9px] whitespace-nowrap shrink-0 border ${
                  isDarkPoster ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                {team.name}
              </span>
              {modeConfig.showLane && (
                <span
                  style={{ borderColor: `${laneMeta.hexAccent}90`, color: isDarkPoster ? laneMeta.hexAccent : '#0f172a', lineHeight: '1.8' }}
                  className={`px-1.5 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 whitespace-nowrap truncate min-w-0 ${
                    isDarkPoster ? 'bg-slate-950' : 'bg-white'
                  }`}
                >
                  <span>{laneMeta.icon}</span>
                  <span className="truncate">{laneMeta.name}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 pb-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded font-bold text-xs whitespace-nowrap border ${
                    isDarkPoster ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {team.name}
                </span>
                {modeConfig.showLane && (
                  <span
                    style={{ borderColor: `${laneMeta.hexAccent}90`, color: isDarkPoster ? laneMeta.hexAccent : '#0f172a', lineHeight: '1.8' }}
                    className={`px-2 py-0.5 rounded border text-xs font-bold flex items-center gap-1 whitespace-nowrap ${
                      isDarkPoster ? 'bg-slate-950' : 'bg-white'
                    }`}
                  >
                    <span>{laneMeta.icon}</span>
                    <span>{laneMeta.name}</span>
                  </span>
                )}
              </div>
              <span
                className={`font-extrabold text-xs mono whitespace-nowrap ${
                  isDarkPoster ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                {filledCount}/5 คน
              </span>
            </div>
            <div className="pt-0.5">
              <h3 style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }} className={`font-extrabold text-base tracking-wide whitespace-nowrap ${
                isDarkPoster ? 'text-white' : 'text-slate-900'
              }`}>
                {party.name}
              </h3>
            </div>
          </div>
        )}

        {/* 5 Slots */}
        <div className="space-y-1.5">
          {(party.slots || [null, null, null, null, null]).map((mId: any, slotIdx: number) => {
            const m = mId ? members.find((x) => x.id === mId) : null;
            if (!m) {
              return (
                <div
                  key={slotIdx}
                  className={`${isEightCols ? 'h-10 text-[10px]' : 'h-11 text-xs'} rounded-xl border border-dashed flex items-center justify-center font-medium whitespace-nowrap ${
                    isDarkPoster
                      ? 'border-slate-800 bg-[#060a14]/60 text-slate-600'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  + ช่องว่างที่ {slotIdx + 1}
                </div>
              );
            }

            const meta = getJobMeta(m.job);
            const fam = getJobFamily(m.job);
            const isLeave = m.status === 'leave';

            const bgTint = isDarkPoster
              ? (meta.hexDark ? `${meta.hexDark}44` : 'rgba(15,23,42,0.6)')
              : (fam.cardTintStyle.match(/background-color:\s*([^;]+);/)?.[1] || 'rgba(241,245,249,0.9)');
            const borderTint = isDarkPoster
              ? `${meta.hexBorder}44`
              : (fam.cardTintStyle.match(/border-color:\s*([^;]+);/)?.[1] || `${meta.hexBorder}60`);

            return (
              <div
                key={slotIdx}
                style={{
                  background: isDarkPoster ? bgTint : `linear-gradient(${bgTint}, ${bgTint}), #ffffff`,
                  borderColor: borderTint,
                }}
                className={`h-12 rounded-xl border ${isEightCols ? 'px-2' : 'px-2.5'} flex items-center justify-between gap-2 shadow-sm overflow-hidden member-slot-card`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  <div className="shrink-0 flex items-center justify-center">
                    <JobEmblem job={m.job} size={isEightCols ? 28 : 32} />
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div
                      style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }}
                      className={`truncate font-extrabold text-xs sm:text-sm ${
                        isDarkPoster ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        color: meta.hexBorder || meta.hexMain || (isDarkPoster ? '#94a3b8' : '#64748b'),
                        whiteSpace: 'nowrap',
                        lineHeight: '1.8',
                      }}
                      className="text-[10px] sm:text-[11px] font-semibold truncate"
                    >
                      {m.job}
                    </div>
                  </div>
                </div>

                {/* Leave Badge */}
                {showLeaveStatus && isLeave ? (
                  <div
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold border whitespace-nowrap ${
                      isDarkPoster
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    🏖️ ลา
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-900/60 dark:bg-black/90 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      {/* Top Floating Control Bar */}
      <div className="sticky top-0 z-50 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#0d121f]/95 p-4 shadow-2xl backdrop-blur-md max-w-[1750px] mx-auto w-full mb-4">
        {/* Row 1: Header + Action & Close Buttons */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-lg shadow-sm text-indigo-600 dark:text-indigo-300">
              {modeConfig.icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-wide truncate">
                {modeConfig.modalTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                ปรับแต่งข้อมูลและความกว้างของตาราง แล้วกดดาวน์โหลดเป็นไฟล์รูปภาพ PNG ความละเอียดสูงได้ทันที
              </p>
            </div>
          </div>

          {/* Right: Download + Close */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 text-xs sm:text-sm shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <span>{isExporting ? '⏳' : '💾'}</span>
              <span>{isExporting ? 'กำลังประมวลผลรูปภาพ...' : 'ดาวน์โหลดรูปภาพ (.PNG)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/80 dark:hover:border-rose-700/60 dark:hover:text-rose-200 transition cursor-pointer"
              title="ปิดหน้าต่างนี้"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Row 2: Customization Toolbar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Dropdowns in sleek pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. เลือกทีม / โหมด */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">เลือกทีม:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                {mode === 'gvg' ? (
                  <>
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">ทุกสนาม & ทุกทีมทั้งหมด ({gvgTeams.length} ทีม)</option>
                    <option value="field_main" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-300">🏟️ เฉพาะสนามหลัก ({gvgTeams.filter((t) => t.field === 'main').length} ทีม)</option>
                    <option value="field_sub" className="bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-300">🚩 เฉพาะสนามรอง ({gvgTeams.filter((t) => t.field === 'sub').length} ทีม)</option>
                    {gvgTeams.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        เฉพาะ {t.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">ทุกปาร์ตี้ทั้งหมด ({modeConfig.parties.length} ตี้)</option>
                    {modeConfig.teams.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                        เฉพาะ {t.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* 2. ความกว้างรูป */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">ความกว้างรูป:</span>
              <select
                value={posterWidth}
                onChange={(e) => setPosterWidth(Number(e.target.value))}
                className="bg-transparent text-amber-700 dark:text-amber-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={1680} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1680px (มาตรฐาน)</option>
                <option value={1920} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1920px (Full HD คมชัดสูงสุด)</option>
                <option value={1400} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1400px (กะทัดรัด)</option>
              </select>
            </div>

            {/* 3. แถวปาร์ตี้ */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">แถวปาร์ตี้:</span>
              <select
                value={rowLayout}
                onChange={(e) => setRowLayout(e.target.value as '4' | '8')}
                className="bg-transparent text-slate-800 dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="8" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1 แถว 8 ปาร์ตี้ (แนวยาว)</option>
                <option value="4" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">1 แถว 4 ปาร์ตี้ (2 แถวในทีม)</option>
              </select>
            </div>

            {/* 4. ข้อมูลวันที่ (Image 1 widget) */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <span>📅</span>
                <span>ข้อมูลวันที่:</span>
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-slate-800 dark:text-white font-mono text-xs focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition cursor-pointer"
                title="เปลี่ยนเป็นวันนี้"
              >
                วันนี้
              </button>
            </div>

            {/* 5. ธีมรูปภาพ (Light / Dark) */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#080c16] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <span>🎨</span>
                <span>ธีมรูปภาพ:</span>
              </span>
              <select
                value={themeChoice}
                onChange={(e) => setThemeChoice(e.target.value as 'auto' | 'dark' | 'light')}
                className="bg-transparent text-slate-800 dark:text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="auto" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  🔄 ตามระบบ ({resolvedTheme === 'dark' ? 'โหมดมืด' : 'โหมดสว่าง'})
                </option>
                <option value="light" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  ☀️ สว่าง (Light Mode)
                </option>
                <option value="dark" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  🌙 มืด (Dark Mode)
                </option>
              </select>
            </div>
          </div>

          {/* Right: Checkboxes */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLeaveStatus}
                onChange={(e) => setShowLeaveStatus(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
              />
              <span>แสดงสถานะ-ลา</span>
            </label>

            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLeaveFooter}
                onChange={(e) => setShowLeaveFooter(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer"
              />
              <span>สรุปคนล่างตาราง</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Poster Preview Board (Will be captured to PNG) */}
      <div className="flex-1 overflow-x-auto pb-8 flex justify-center">
        <div
          ref={boardRef}
          id="exportPosterBoard"
          style={{ width: `${posterWidth}px`, minWidth: `${posterWidth}px` }}
          className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-2xl transition-all ${
            isDarkPoster
              ? 'dark-poster border-slate-800 bg-[#030712] text-white'
              : 'light-poster border-[#b0b0b0] bg-[#cfcfcf] text-slate-900'
          }`}
        >
          {/* 1. Poster Header Banner */}
          <div
            className={`flex items-center justify-between rounded-2xl border px-6 py-4 shadow-xl ${
              isDarkPoster ? 'border-slate-800/90 bg-[#0d1322]' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-600 text-2xl shadow-lg border border-amber-400/40 text-white">
                {modeConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className={`text-xl sm:text-2xl font-black tracking-wide ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>
                    {modeConfig.title}
                  </h1>
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${
                      isDarkPoster
                        ? 'border-indigo-500/40 bg-indigo-950/70 text-indigo-300'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    ประจำวันที่ {selectedThaiDateStr.full}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                  {modeConfig.subtitle}
                </p>
              </div>
            </div>

            {/* Right KPI Badges */}
            <div className="flex items-center gap-2.5 text-xs">
              <div
                className={`rounded-xl border px-3.5 py-2 text-center min-w-[88px] ${
                  isDarkPoster ? 'border-slate-700/80 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className={`text-[10px] ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>สมาชิกทั้งหมด</div>
                <div className={`font-extrabold text-sm font-mono mt-0.5 ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>
                  {members.length} คน
                </div>
              </div>
              <div
                className={`rounded-xl border px-3.5 py-2 text-center min-w-[88px] ${
                  isDarkPoster ? 'border-emerald-500/30 bg-emerald-950/30' : 'border-emerald-200 bg-emerald-50/70'
                }`}
              >
                <div className={`text-[10px] ${isDarkPoster ? 'text-emerald-400' : 'text-emerald-700'}`}>พร้อมลงวอร์วันนี้</div>
                <div className={`font-extrabold text-sm font-mono mt-0.5 ${isDarkPoster ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {readyMembers.length} คน
                </div>
              </div>
              <div
                className={`rounded-xl border px-3.5 py-2 text-center min-w-[88px] ${
                  isDarkPoster ? 'border-rose-500/30 bg-rose-950/30' : 'border-rose-200 bg-rose-50/70'
                }`}
              >
                <div className={`text-[10px] ${isDarkPoster ? 'text-rose-400' : 'text-rose-700'}`}>แจ้งลาวันนี้</div>
                <div className={`font-extrabold text-sm font-mono mt-0.5 ${isDarkPoster ? 'text-rose-300' : 'text-rose-700'}`}>
                  {leaveMembers.length} คน
                </div>
              </div>
              <div
                className={`rounded-xl border px-3.5 py-2 text-center min-w-[88px] ${
                  isDarkPoster ? 'border-amber-500/30 bg-amber-950/30' : 'border-amber-200 bg-amber-50/70'
                }`}
              >
                <div className={`text-[10px] ${isDarkPoster ? 'text-amber-400' : 'text-amber-700'}`}>จัดลงปาร์ตี้แล้ว</div>
                <div className={`font-extrabold text-sm font-mono mt-0.5 ${isDarkPoster ? 'text-amber-300' : 'text-amber-700'}`}>
                  {assignedMemberIds.size} คน
                </div>
              </div>
            </div>
          </div>

          {/* 2. Main Field Section (or Siege / Polarity) */}
          {mainTeams.length > 0 && (
            <div
              className={`rounded-3xl border-2 ${modeConfig.borderColor} p-5 space-y-4 shadow-xl ${
                isDarkPoster ? 'bg-[#080d19]' : 'bg-slate-100/60'
              }`}
            >
              {/* Field Header */}
              <div
                className={`flex items-center justify-between rounded-2xl border px-5 py-3.5 ${
                  isDarkPoster ? 'bg-[#111726] border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{modeConfig.icon}</span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className={`text-base sm:text-lg font-extrabold tracking-wide ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>
                        {modeConfig.fieldTitle}
                      </h2>
                      <span className={`rounded-full ${modeConfig.badgeColor} px-2.5 py-0.5 text-xs font-extrabold text-white shadow-sm`}>
                        ครอบคลุม {mainTeams.length} ทีม ({mainTeams.map((t) => t.name).join(', ')})
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                      {modeConfig.fieldSubtitle}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-3 text-xs px-4 py-2 rounded-xl border ${
                    isDarkPoster
                      ? 'text-slate-300 bg-slate-950/80 border-slate-800'
                      : 'text-slate-700 bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <span>ทีมในทัพ: <strong className={isDarkPoster ? 'text-white' : 'text-slate-900'}>{mainTeams.length} ทีม</strong></span>
                  <span>•</span>
                  <span>ปาร์ตี้รวม: <strong className={isDarkPoster ? 'text-white' : 'text-slate-900'}>{mainParties.length} ตี้</strong></span>
                  <span>•</span>
                  <span>สมาชิกในทัพ: <strong className={isDarkPoster ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'}>{mainMembersCount}/{mainParties.length * 5} คน</strong></span>
                </div>
              </div>

              {/* Teams in Main Field / War */}
              <div className="space-y-4">
                {siegeTeamGroups.map((group, groupIdx) => {
                  if (group.isCombined) {
                    /* Combined side-by-side layout for consecutive teams whose parties sum to exactly 8 */
                    return (
                      <div
                        key={`combined_group_${groupIdx}`}
                        className={`rounded-2xl border p-4 space-y-3 ${
                          isDarkPoster ? 'border-slate-800 bg-[#0c1220] shadow-inner' : 'border-slate-200 bg-white shadow-sm'
                        }`}
                      >
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(8, minmax(0, 1fr))`,
                          }}
                        >
                          {/* Row 1: Team Headers spanning their parties */}
                          {group.teams.map((item) => (
                            <div
                              key={`hdr_${item.team.id}`}
                              style={{ gridColumn: `span ${item.parties.length}` }}
                              className={`rounded-xl px-3 py-2 flex items-center justify-between border ${
                                isDarkPoster
                                  ? 'bg-slate-800/90 border-slate-700 text-white shadow-sm'
                                  : 'bg-slate-100 border-slate-300 text-slate-900 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }} className="font-extrabold text-sm sm:text-base tracking-wide truncate">
                                  {item.team.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                                    isDarkPoster
                                      ? 'bg-sky-950 text-sky-300 border-sky-800'
                                      : 'bg-sky-100 text-sky-800 border-sky-200'
                                  }`}
                                >
                                  {item.parties.length} ตี้
                                </span>
                              </div>
                              <div className={`text-xs shrink-0 ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                                สมาชิก: <strong className={isDarkPoster ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'}>{item.teamFilled}/{item.parties.length * 5} คน</strong>
                              </div>
                            </div>
                          ))}

                          {/* Row 2: All Parties from the combined teams aligned side-by-side in 1 row of 8 columns */}
                          {group.teams.flatMap((item) =>
                            item.parties.map((party) => renderPartyCard(party, item.team, true))
                          )}
                        </div>
                      </div>
                    );
                  }

                  /* Standard per-team box layout when a team cannot pair into an exact 8-party row */
                  const { team, parties, teamFilled } = group.teams[0];
                  const gridColsClass = parties.length <= 4 ? 'grid-cols-4' : rowLayout === '8' ? 'grid-cols-8' : 'grid-cols-4';
                  const isEightCols = gridColsClass === 'grid-cols-8';

                  return (
                    <div
                      key={team.id}
                      className={`rounded-2xl border p-4 space-y-3 ${
                        isDarkPoster ? 'border-slate-800 bg-[#0c1220] shadow-inner' : 'border-slate-200 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs pb-1">
                        <div className="flex items-center gap-2.5">
                          <span style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }} className={`font-extrabold text-base tracking-wide ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>{team.name}</span>
                          <span style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isDarkPoster
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {mode === 'gvg' ? 'สนามหลัก' : modeConfig.fieldTitle}
                          </span>
                        </div>
                        <div className={`text-xs ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                          จำนวนปาร์ตี้: <span className={`font-bold ${isDarkPoster ? 'text-slate-200' : 'text-slate-900'}`}>{parties.length} ตี้</span> • สมาชิกในทีม: <span className={`font-bold ${isDarkPoster ? 'text-emerald-400' : 'text-emerald-700'}`}>{teamFilled}/{parties.length * 5} คน</span>
                        </div>
                      </div>

                      <div className={`grid ${gridColsClass} ${isEightCols ? 'gap-2' : 'gap-3.5'}`}>
                        {parties.map((party) => renderPartyCard(party, team, isEightCols))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Sub Field Section (Only in GVG mode) */}
          {mode === 'gvg' && subTeams.length > 0 && (
            <div
              className={`rounded-3xl border-2 border-cyan-500/80 p-5 space-y-4 shadow-xl ${
                isDarkPoster ? 'bg-[#080d19]' : 'bg-slate-100/60'
              }`}
            >
              {/* Field Header */}
              <div
                className={`flex items-center justify-between rounded-2xl border px-5 py-3.5 ${
                  isDarkPoster ? 'bg-[#111726] border-cyan-500/30' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚩</span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className={`text-base sm:text-lg font-extrabold tracking-wide ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>
                        สนามรอง (Sub Field)
                      </h2>
                      <span className="rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-extrabold text-white shadow-sm">
                        ครอบคลุม {subTeams.length} ทีม ({subTeams.map((t) => t.name).join(', ')})
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                      ทัพหนุนประจำสมรภูมิรอง
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-3 text-xs px-4 py-2 rounded-xl border ${
                    isDarkPoster
                      ? 'text-slate-300 bg-slate-950/80 border-slate-800'
                      : 'text-slate-700 bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  <span>ทีมในสนามรอง: <strong className={isDarkPoster ? 'text-white' : 'text-slate-900'}>{subTeams.length} ทีม</strong></span>
                  <span>•</span>
                  <span>ปาร์ตี้รวม: <strong className={isDarkPoster ? 'text-white' : 'text-slate-900'}>{subParties.length} ตี้</strong></span>
                  <span>•</span>
                  <span>สมาชิกในสนามรอง: <strong className={isDarkPoster ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold'}>{subMembersCount}/{subParties.length * 5} คน</strong></span>
                </div>
              </div>

              {/* Teams in Sub Field */}
              <div className="space-y-4">
                {subTeams.map((team) => {
                  const parties = gvgParties.filter((p) => p.teamId === team.id);
                  const teamFilled = parties.reduce((acc, p) => acc + (p.slots?.filter(Boolean).length || 0), 0);
                  const gridColsClass = parties.length <= 4 ? 'grid-cols-4' : rowLayout === '8' ? 'grid-cols-8' : 'grid-cols-4';
                  const isEightCols = gridColsClass === 'grid-cols-8';

                  return (
                    <div
                      key={team.id}
                      className={`rounded-2xl border p-4 space-y-3 ${
                        isDarkPoster ? 'border-slate-800 bg-[#0c1220] shadow-inner' : 'border-slate-200 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs pb-1">
                        <div className="flex items-center gap-2.5">
                          <span style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }} className={`font-extrabold text-base tracking-wide ${isDarkPoster ? 'text-white' : 'text-slate-900'}`}>{team.name}</span>
                          <span style={{ whiteSpace: 'nowrap', lineHeight: '1.8' }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                              isDarkPoster
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            สนามรอง
                          </span>
                        </div>
                        <div className={`text-xs ${isDarkPoster ? 'text-slate-400' : 'text-slate-500'}`}>
                          จำนวนปาร์ตี้: <span className={`font-bold ${isDarkPoster ? 'text-slate-200' : 'text-slate-900'}`}>{parties.length} ตี้</span> • สมาชิกในทีม: <span className={`font-bold ${isDarkPoster ? 'text-emerald-400' : 'text-emerald-700'}`}>{teamFilled}/{parties.length * 5} คน</span>
                        </div>
                      </div>

                      <div className={`grid ${gridColsClass} ${isEightCols ? 'gap-2' : 'gap-3.5'}`}>
                        {parties.map((party) => renderPartyCard(party, team, isEightCols))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Leave Footer Summary (if enabled) */}
          {showLeaveFooter && leaveMembers.length > 0 && (
            <div
              className={`rounded-2xl border p-3.5 space-y-2 ${
                isDarkPoster ? 'border-rose-500/30 bg-rose-950/20' : 'border-rose-200 bg-rose-50/70'
              }`}
            >
              <div
                className={`flex items-center justify-between text-xs font-bold border-b pb-1.5 ${
                  isDarkPoster ? 'text-rose-300 border-rose-500/20' : 'text-rose-800 border-rose-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>🏖️</span>
                  <span>รายชื่อสมาชิกที่แจ้งลาวันนี้ ({leaveMembers.length} คน):</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {leaveMembers.map((m) => (
                  <span
                    key={m.id}
                    className={`rounded-lg border px-2.5 py-1 text-xs ${
                      isDarkPoster
                        ? 'border-rose-500/30 bg-rose-950/40 text-rose-200'
                        : 'border-rose-200 bg-white text-rose-800 shadow-xs'
                    }`}
                  >
                    {m.name} ({m.job}) {m.leaveReason ? `- ${m.leaveReason}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
