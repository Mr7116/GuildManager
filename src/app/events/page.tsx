'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useGuildStore } from '@/lib/guildStore';
import { Member } from '@/types/member';
import { getJobMeta } from '@/constants/jobs';
import JobEmblem from '@/components/tactical/JobEmblem';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';

interface EventConfig {
  key: string;
  name: string;
  shortName: string;
  icon: string;
  accentClass: string;
}

const WEEKLY_EVENTS_CONFIG: EventConfig[] = [
  { key: 'mirror_world', name: 'Mirror World', shortName: 'Mirror World', icon: '🪞', accentClass: 'border-cyan-500/40 text-cyan-300' },
  { key: 'hazy_maze', name: 'The Hazy Maze Forest', shortName: 'Hazy Maze', icon: '🌲', accentClass: 'border-emerald-500/40 text-emerald-300' },
  { key: 'guild_league_tue', name: 'Guild League (อังคาร)', shortName: 'GL (อังคาร)', icon: '⚔️', accentClass: 'border-amber-500/40 text-amber-300' },
  { key: 'guild_league_thu', name: 'Guild League (พฤหัสบดี)', shortName: 'GL (พฤหัสฯ)', icon: '🛡️', accentClass: 'border-blue-500/40 text-blue-300' },
  { key: 'polarity_zone', name: 'Polarity Zone', shortName: 'Polarity Zone', icon: '⚡', accentClass: 'border-purple-500/40 text-purple-300' },
  { key: 'siege_war', name: 'ศึกชิงปราสาท', shortName: 'ศึกชิงปราสาท', icon: '🏰', accentClass: 'border-rose-500/40 text-rose-300' },
];

type EventStatus = 'none' | 'joined' | 'leave' | 'absent';

interface EventRecord {
  status: EventStatus;
  note?: string;
  updatedAt?: string;
}

interface MemberWithEvents extends Member {
  weeklyEvents?: Record<string, Record<string, EventRecord>>;
}

// Date helpers
function getLocalDateISO(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekMondayISO(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput.getTime());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateISO(d);
}

function getWeekSundayISO(mondayIso: string): string {
  const [y, m, d] = mondayIso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + 6);
  return getLocalDateISO(dt);
}

function formatThaiWeekRange(mondayIso: string): string {
  const sunIso = getWeekSundayISO(mondayIso);
  const mParts = mondayIso.split('-').map(Number);
  const sParts = sunIso.split('-').map(Number);
  const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const yearBE = mParts[0] + 543;
  return `${mParts[2]} ${thaiMonths[mParts[1]]} - อาทิตย์ ${sParts[2]} ${thaiMonths[sParts[1]]} ${yearBE}`;
}

function formatShortRange(monIso: string, sunIso: string): string {
  const mParts = monIso.split('-').map(Number);
  const sParts = sunIso.split('-').map(Number);
  const thaiMonths = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${mParts[2]} ${thaiMonths[mParts[1]]} - ${sParts[2]} ${thaiMonths[sParts[1]]}`;
}

export default function EventsPage() {
  const { guildName, members, setMembers, gvgParties, gvgTeams } = useGuildStore();

  const [selectedWeekMonday, setSelectedWeekMonday] = useState(() => getWeekMondayISO(new Date()));
  const [activeTab, setActiveTab] = useState<'matrix' | 'analytics'>('matrix');
  const [clickMode, setClickMode] = useState<'joined' | 'cycle' | 'leave' | 'absent' | 'note'>('joined');

  // Matrix View Filters
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState<'team_party' | 'name' | 'gear_desc'>('team_party');

  // Analytics View Filters
  const [analyticsScope, setAnalyticsScope] = useState<'all_weeks' | 'selected_week'>('all_weeks');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsTeamFilter, setAnalyticsTeamFilter] = useState('all');
  const [analyticsMemberFilter, setAnalyticsMemberFilter] = useState<'all' | 'has_leave_or_absent' | 'has_absent' | 'has_leave' | 'perfect'>('all');
  const [analyticsSort, setAnalyticsSort] = useState<'leave_absent_desc' | 'absent_desc' | 'leave_desc' | 'joined_desc'>('leave_absent_desc');

  const currentMondayIso = useMemo(() => getWeekMondayISO(new Date()), []);

  // Helper to get member event status
  const getEventRecord = useCallback((m: MemberWithEvents, monIso: string, eventKey: string): EventRecord => {
    return m.weeklyEvents?.[monIso]?.[eventKey] || { status: 'none' };
  }, []);

  // Set member event status
  const updateMemberEvent = useCallback((memberId: string, eventKey: string, newRecord: EventRecord) => {
    const nowStamp = new Date().toLocaleTimeString('th-TH');
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        const weekEvents = { ...(curEvents[selectedWeekMonday] || {}) };
        weekEvents[eventKey] = { ...newRecord, updatedAt: nowStamp };
        curEvents[selectedWeekMonday] = weekEvents;
        return { ...m, weeklyEvents: curEvents };
      })
    );
  }, [selectedWeekMonday, setMembers]);

  // Click on event cell
  const handleCellClick = (memberId: string, eventKey: string) => {
    const m = members.find((x) => x.id === memberId) as MemberWithEvents | undefined;
    if (!m) return;
    const cur = getEventRecord(m, selectedWeekMonday, eventKey);

    if (clickMode === 'note') {
      const noteInput = prompt(`ระบุหมายเหตุสำหรับ ${m.name} (${eventKey}):`, cur.note || '');
      if (noteInput !== null) {
        updateMemberEvent(memberId, eventKey, {
          status: cur.status === 'none' ? 'joined' : cur.status,
          note: noteInput.trim(),
        });
      }
      return;
    }

    if (clickMode === 'cycle') {
      const cycleMap: Record<EventStatus, EventStatus> = {
        none: 'joined',
        joined: 'leave',
        leave: 'absent',
        absent: 'none',
      };
      updateMemberEvent(memberId, eventKey, { status: cycleMap[cur.status], note: cur.note });
      return;
    }

    if (clickMode === 'joined') {
      const nextStatus = cur.status === 'joined' ? 'none' : 'joined';
      updateMemberEvent(memberId, eventKey, { status: nextStatus, note: cur.note });
      return;
    }

    if (clickMode === 'leave') {
      const nextStatus = cur.status === 'leave' ? 'none' : 'leave';
      updateMemberEvent(memberId, eventKey, { status: nextStatus, note: cur.note });
      return;
    }

    if (clickMode === 'absent') {
      const nextStatus = cur.status === 'absent' ? 'none' : 'absent';
      updateMemberEvent(memberId, eventKey, { status: nextStatus, note: cur.note });
      return;
    }
  };

  // Bulk check all guild for a single event
  const bulkCheckEventForGuild = (eventKey: string) => {
    if (!confirm(`ต้องการเช็ค "เข้าร่วม" กิจกรรม ${eventKey} ให้กับลูกกิลด์ทุกคนใช่หรือไม่?`)) return;
    const nowStamp = new Date().toLocaleTimeString('th-TH');
    setMembers((prev) =>
      prev.map((m) => {
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        const weekEvents = { ...(curEvents[selectedWeekMonday] || {}) };
        if (weekEvents[eventKey]?.status !== 'leave') {
          weekEvents[eventKey] = { status: 'joined', note: weekEvents[eventKey]?.note || '', updatedAt: nowStamp };
        }
        curEvents[selectedWeekMonday] = weekEvents;
        return { ...m, weeklyEvents: curEvents };
      })
    );
  };

  // Mark all 6 events for a single member
  const handleMarkAllForMember = (memberId: string) => {
    const nowStamp = new Date().toLocaleTimeString('th-TH');
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        const weekEvents = { ...(curEvents[selectedWeekMonday] || {}) };
        WEEKLY_EVENTS_CONFIG.forEach((ev) => {
          weekEvents[ev.key] = { status: 'joined', note: weekEvents[ev.key]?.note || '', updatedAt: nowStamp };
        });
        curEvents[selectedWeekMonday] = weekEvents;
        return { ...m, weeklyEvents: curEvents };
      })
    );
  };

  // Clear all 6 events for a single member
  const handleClearForMember = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        delete curEvents[selectedWeekMonday];
        return { ...m, weeklyEvents: curEvents };
      })
    );
  };

  // Set all 6 events for the entire guild
  const handleSetAllGuildComplete = () => {
    if (!confirm('คุณต้องการตั้ง "เข้าร่วมครบทุกกิจกรรม (6/6)" ให้กับสมาชิกทั้งกิลด์ในสัปดาห์นี้ใช่หรือไม่?')) return;
    const nowStamp = new Date().toLocaleTimeString('th-TH');
    setMembers((prev) =>
      prev.map((m) => {
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        const weekEvents = { ...(curEvents[selectedWeekMonday] || {}) };
        WEEKLY_EVENTS_CONFIG.forEach((ev) => {
          if (weekEvents[ev.key]?.status !== 'leave') {
            weekEvents[ev.key] = { status: 'joined', note: weekEvents[ev.key]?.note || '', updatedAt: nowStamp };
          }
        });
        curEvents[selectedWeekMonday] = weekEvents;
        return { ...m, weeklyEvents: curEvents };
      })
    );
  };

  // Clear entire selected week
  const handleClearSelectedWeek = () => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลกิจกรรมทั้งหมดของสัปดาห์ ${formatThaiWeekRange(selectedWeekMonday)}?`)) return;
    setMembers((prev) =>
      prev.map((m) => {
        const curEvents = { ...(m as MemberWithEvents).weeklyEvents };
        delete curEvents[selectedWeekMonday];
        return { ...m, weeklyEvents: curEvents };
      })
    );
  };

  // 6-Week Strip generation (-3 to +2 weeks from current/selected)
  const sixWeeksStrip = useMemo(() => {
    const list = [];
    const [y, m, d] = currentMondayIso.split('-').map(Number);
    for (let offset = -3; offset <= 2; offset++) {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + offset * 7);
      const monIso = getLocalDateISO(dt);
      const sunIso = getWeekSundayISO(monIso);
      const isSelected = monIso === selectedWeekMonday;
      const isCurrent = monIso === currentMondayIso;

      let joinedCount = 0;
      let absentCount = 0;
      members.forEach((mem) => {
        WEEKLY_EVENTS_CONFIG.forEach((ev) => {
          const st = getEventRecord(mem as MemberWithEvents, monIso, ev.key).status;
          if (st === 'joined') joinedCount++;
          if (st === 'absent') absentCount++;
        });
      });
      const maxPossible = members.length * WEEKLY_EVENTS_CONFIG.length;
      const pct = maxPossible > 0 ? Math.round((joinedCount / maxPossible) * 100) : 0;

      list.push({
        monIso,
        sunIso,
        isSelected,
        isCurrent,
        label: formatShortRange(monIso, sunIso),
        pct,
        joinedCount,
        absentCount,
      });
    }
    return list;
  }, [currentMondayIso, selectedWeekMonday, members, getEventRecord]);

  // Event Summary Cards Stats (for current selected week)
  const eventSummaries = useMemo(() => {
    return WEEKLY_EVENTS_CONFIG.map((ev) => {
      let joined = 0;
      let leave = 0;
      let absent = 0;
      members.forEach((m) => {
        const st = getEventRecord(m as MemberWithEvents, selectedWeekMonday, ev.key).status;
        if (st === 'joined') joined++;
        else if (st === 'leave') leave++;
        else if (st === 'absent') absent++;
      });
      const max = members.length;
      const pct = max > 0 ? Math.round((joined / max) * 100) : 0;
      return {
        ...ev,
        pct,
        joined,
        leave,
        absent: max - joined - leave,
      };
    });
  }, [members, selectedWeekMonday, getEventRecord]);

  // Analytics Data Computation (Tab 2)
  const analyticsData = useMemo(() => {
    // Determine target weeks
    const allWeeksSet = new Set<string>([selectedWeekMonday]);
    members.forEach((m) => {
      const we = (m as MemberWithEvents).weeklyEvents;
      if (we && typeof we === 'object') {
        Object.keys(we).forEach((w) => {
          if (we[w] && Object.keys(we[w]).length > 0) allWeeksSet.add(w);
        });
      }
    });

    const targetWeeks = analyticsScope === 'selected_week' ? [selectedWeekMonday] : Array.from(allWeeksSet).sort().reverse();
    const totalWeeks = targetWeeks.length;
    const maxPossiblePerMember = totalWeeks * WEEKLY_EVENTS_CONFIG.length;

    // Totals per event
    const eventTotals: Record<string, { joined: number; leave: number; absent: number; totalPossible: number }> = {};
    WEEKLY_EVENTS_CONFIG.forEach((ev) => {
      eventTotals[ev.key] = { joined: 0, leave: 0, absent: 0, totalPossible: members.length * totalWeeks };
    });

    let guildTotalJoined = 0;
    let guildTotalLeave = 0;
    let guildTotalAbsent = 0;

    // Per member stats
    const memberStats = members.map((m) => {
      const byEvent: Record<string, { joined: number; leave: number; absent: number }> = {};
      WEEKLY_EVENTS_CONFIG.forEach((ev) => {
        byEvent[ev.key] = { joined: 0, leave: 0, absent: 0 };
      });

      let totalJoined = 0;
      let totalLeave = 0;
      let totalAbsent = 0;
      const leaveAbsentDetails: { eventName: string; weekKey: string; status: 'leave' | 'absent'; note?: string }[] = [];

      targetWeeks.forEach((wKey) => {
        WEEKLY_EVENTS_CONFIG.forEach((ev) => {
          const rec = getEventRecord(m as MemberWithEvents, wKey, ev.key);
          if (rec.status === 'joined') {
            byEvent[ev.key].joined++;
            totalJoined++;
            eventTotals[ev.key].joined++;
            guildTotalJoined++;
          } else if (rec.status === 'leave') {
            byEvent[ev.key].leave++;
            totalLeave++;
            eventTotals[ev.key].leave++;
            guildTotalLeave++;
            leaveAbsentDetails.push({ eventName: ev.shortName, weekKey: wKey, status: 'leave', note: rec.note });
          } else if (rec.status === 'absent') {
            byEvent[ev.key].absent++;
            totalAbsent++;
            eventTotals[ev.key].absent++;
            guildTotalAbsent++;
            leaveAbsentDetails.push({ eventName: ev.shortName, weekKey: wKey, status: 'absent', note: rec.note });
          }
        });
      });

      const party = gvgParties.find((p) => p.slots?.includes(m.id));
      const team = party ? gvgTeams.find((t) => t.id === party.teamId) : null;
      const totalLeaveAndAbsent = totalLeave + totalAbsent;
      const joinedPct = maxPossiblePerMember > 0 ? Math.round((totalJoined / maxPossiblePerMember) * 100) : 0;

      return {
        member: m,
        party,
        team,
        byEvent,
        totalJoined,
        totalLeave,
        totalAbsent,
        totalLeaveAndAbsent,
        joinedPct,
        leaveAbsentDetails,
      };
    });

    const membersWithLeaveOrAbsent = memberStats.filter((x) => x.totalLeaveAndAbsent > 0).length;

    return {
      targetWeeks,
      totalWeeks,
      maxPossiblePerMember,
      eventTotals,
      guildTotalJoined,
      guildTotalLeave,
      guildTotalAbsent,
      membersWithLeaveOrAbsent,
      memberStats,
    };
  }, [members, gvgParties, gvgTeams, selectedWeekMonday, analyticsScope, getEventRecord]);

  // Filtered member stats for Analytics Ranking Table
  const filteredAnalyticsMemberStats = useMemo(() => {
    const q = analyticsSearch.trim().toLowerCase();
    return analyticsData.memberStats
      .filter((item) => {
        const m = item.member;
        if (q) {
          const matchName = m.name?.toLowerCase().includes(q);
          const matchJob = m.job?.toLowerCase().includes(q);
          if (!matchName && !matchJob) return false;
        }

        if (analyticsTeamFilter !== 'all') {
          if (analyticsTeamFilter === 'unassigned' && item.party) return false;
          if (analyticsTeamFilter !== 'unassigned' && (!item.party || item.party.teamId !== analyticsTeamFilter)) return false;
        }

        if (analyticsMemberFilter === 'has_leave_or_absent' && item.totalLeaveAndAbsent === 0) return false;
        if (analyticsMemberFilter === 'has_absent' && item.totalAbsent === 0) return false;
        if (analyticsMemberFilter === 'has_leave' && item.totalLeave === 0) return false;
        if (analyticsMemberFilter === 'perfect' && item.totalLeaveAndAbsent > 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (analyticsSort === 'absent_desc') return b.totalAbsent - a.totalAbsent || b.totalLeaveAndAbsent - a.totalLeaveAndAbsent;
        if (analyticsSort === 'leave_desc') return b.totalLeave - a.totalLeave || b.totalLeaveAndAbsent - a.totalLeaveAndAbsent;
        if (analyticsSort === 'joined_desc') return b.totalJoined - a.totalJoined;
        return b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.totalAbsent - a.totalAbsent;
      });
  }, [analyticsData.memberStats, analyticsSearch, analyticsTeamFilter, analyticsMemberFilter, analyticsSort]);

  // Filtered members list for Matrix Table (Tab 1)
  const filteredMatrixMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (q) {
          const matchName = m.name?.toLowerCase().includes(q);
          const matchJob = m.job?.toLowerCase().includes(q);
          if (!matchName && !matchJob) return false;
        }

        if (teamFilter !== 'all') {
          const party = gvgParties.find((p) => p.slots?.includes(m.id));
          if (teamFilter === 'unassigned' && party) return false;
          if (teamFilter !== 'unassigned' && (!party || party.teamId !== teamFilter)) return false;
        }

        if (statusFilter !== 'all') {
          let hasJoined = false;
          let hasLeave = false;
          let hasAbsent = false;
          WEEKLY_EVENTS_CONFIG.forEach((ev) => {
            const st = getEventRecord(m as MemberWithEvents, selectedWeekMonday, ev.key).status;
            if (st === 'joined') hasJoined = true;
            if (st === 'leave') hasLeave = true;
            if (st === 'absent') hasAbsent = true;
          });

          if (statusFilter === 'joined' && !hasJoined) return false;
          if (statusFilter === 'leave' && !hasLeave) return false;
          if (statusFilter === 'absent' && !hasAbsent) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'name') return a.name.localeCompare(b.name, 'th');
        if (sortOption === 'gear_desc') return (b.gear || 0) - (a.gear || 0);
        const partyA = gvgParties.find((p) => p.slots?.includes(a.id));
        const partyB = gvgParties.find((p) => p.slots?.includes(b.id));
        if (partyA && !partyB) return -1;
        if (!partyA && partyB) return 1;
        if (partyA && partyB) {
          if (partyA.teamId !== partyB.teamId) return partyA.teamId.localeCompare(partyB.teamId);
          return partyA.name.localeCompare(partyB.name);
        }
        return a.name.localeCompare(b.name, 'th');
      });
  }, [members, search, teamFilter, statusFilter, sortOption, gvgParties, selectedWeekMonday, getEventRecord]);

  // Copy Summary to Clipboard
  const handleCopySummary = () => {
    const lines: string[] = [];
    lines.push(`🏆 สรุปการเข้ากิจกรรมประจำสัปดาห์ — ${guildName}`);
    lines.push(`📅 สัปดาห์: ${formatThaiWeekRange(selectedWeekMonday)}`);
    lines.push(`========================================`);
    eventSummaries.forEach((ev) => {
      lines.push(`${ev.icon} ${ev.name}: ✅ เข้าร่วม ${ev.joined}/${members.length} คน | 🏖️ ลา ${ev.leave} คน | ❌ ขาด ${ev.absent} คน`);
    });
    navigator.clipboard.writeText(lines.join('\n'));
    alert('📋 คัดลอกสรุปสำหรับส่ง Discord / LINE เรียบร้อยแล้ว!');
  };

  // Copy Leave / Absent Offenders Report
  const handleCopyOffenders = () => {
    const lines: string[] = [];
    lines.push(`📊 รายงานสรุปสมาชิก ลา / ขาดกิจกรรม — ${guildName}`);
    lines.push(`📅 ช่วงข้อมูล: ${analyticsScope === 'selected_week' ? formatThaiWeekRange(selectedWeekMonday) : `สะสม ${analyticsData.totalWeeks} สัปดาห์`}`);
    lines.push(`✅ เข้าร่วมสะสม: ${analyticsData.guildTotalJoined} ครั้ง | 🏖️ แจ้งลา: ${analyticsData.guildTotalLeave} ครั้ง | ❌ ขาด: ${analyticsData.guildTotalAbsent} ครั้ง`);
    lines.push(`========================================`);
    const offenders = analyticsData.memberStats.filter((x) => x.totalLeaveAndAbsent > 0);
    if (offenders.length === 0) {
      lines.push('🎉 ไม่มีสมาชิกคนไหนขาดหรือลากิจกรรมเลย ทุกคนมาครบ 100%!');
    } else {
      offenders.forEach((item, idx) => {
        lines.push(`${idx + 1}. ${item.member.name} (${item.member.job}): 🏖️ ลา ${item.totalLeave} | ❌ ขาด ${item.totalAbsent} (รวม ${item.totalLeaveAndAbsent} ครั้ง)`);
      });
    }
    navigator.clipboard.writeText(lines.join('\n'));
    alert('📋 คัดลอกสรุปคนลา/ขาด สำหรับส่ง Discord / LINE เรียบร้อยแล้ว!');
  };

  // Export Analytics CSV
  const handleExportCSV = () => {
    const headers = ['อันดับ', 'ชื่อสมาชิก', 'สายอาชีพ', 'Gear', 'ทีม', 'ปาร์ตี้', ...WEEKLY_EVENTS_CONFIG.map((ev) => `${ev.name} (เข้า/ลา/ขาด)`), 'รวมเข้า', 'รวมลา', 'รวมขาด', 'รวมลา+ขาด', 'เข้าร่วมสะสม %'];
    const rows = filteredAnalyticsMemberStats.map((item, idx) => {
      const m = item.member;
      const teamName = item.team ? item.team.name : '-';
      const partyName = item.party ? item.party.name : 'ไม่มีตี้';
      const evCols = WEEKLY_EVENTS_CONFIG.map((ev) => {
        const c = item.byEvent[ev.key];
        return `${c.joined}/${c.leave}/${c.absent}`;
      });
      return [idx + 1, `"${m.name}"`, `"${m.job}"`, m.gear || 0, `"${teamName}"`, `"${partyName}"`, ...evCols, item.totalJoined, item.totalLeave, item.totalAbsent, item.totalLeaveAndAbsent, `${item.joinedPct}%`].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Guild_Events_Attendance_${selectedWeekMonday}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-[1750px] px-3 py-4 sm:px-6 space-y-5">
      {/* 1. Header Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/90 bg-[#0d121f]/95 p-4 sm:p-5 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide flex items-center gap-2">
              <span>🏆</span>
              <span>ระบบบันทึกการเข้ากิจกรรมประจำสัปดาห์ & สถิติการลา/ขาด</span>
            </h1>
            <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-0.5 text-xs font-bold">
              สัปดาห์: {formatThaiWeekRange(selectedWeekMonday)}
            </span>
            <AutoSaveBadge />
          </div>
          <p className="text-xs text-slate-400">
            เช็คชื่อและวิเคราะห์สถิติการเข้าร่วม / แจ้งลา / ขาดกิจกรรมทั้ง 6 (Mirror World, Hazy Maze, Guild League อังคาร/พฤหัสบดี, Polarity Zone, ศึกชิงปราสาท) ลงฐานข้อมูล Cloud
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const [y, m, d] = selectedWeekMonday.split('-').map(Number);
              const dt = new Date(y, m - 1, d);
              dt.setDate(dt.getDate() - 7);
              setSelectedWeekMonday(getLocalDateISO(dt));
            }}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition cursor-pointer"
          >
            ◀ สัปดาห์ก่อนหน้า
          </button>

          <input
            type="date"
            value={selectedWeekMonday}
            onChange={(e) => setSelectedWeekMonday(getWeekMondayISO(e.target.value))}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />

          <button
            type="button"
            onClick={() => setSelectedWeekMonday(currentMondayIso)}
            className="rounded-xl border border-indigo-500/40 bg-indigo-600/30 hover:bg-indigo-600/50 px-3 py-1.5 text-xs font-bold text-indigo-200 transition cursor-pointer"
          >
            สัปดาห์นี้
          </button>

          <button
            type="button"
            onClick={() => {
              const [y, m, d] = selectedWeekMonday.split('-').map(Number);
              const dt = new Date(y, m - 1, d);
              dt.setDate(dt.getDate() + 7);
              setSelectedWeekMonday(getLocalDateISO(dt));
            }}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition cursor-pointer"
          >
            สัปดาห์ถัดไป ▶
          </button>
        </div>
      </div>

      {/* 2. Six-Week Interactive Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {sixWeeksStrip.map((w) => (
          <button
            key={w.monIso}
            type="button"
            onClick={() => setSelectedWeekMonday(w.monIso)}
            className={`rounded-2xl border p-3 text-left transition-all cursor-pointer relative ${
              w.isSelected
                ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-400 shadow-xl scale-[1.02]'
                : 'bg-[#0d121f]/90 border-slate-800 hover:bg-slate-800/60 text-slate-400'
            }`}
          >
            {w.isCurrent && (
              <span className="absolute top-2 right-2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 text-[9px] font-bold">
                สัปดาห์นี้
              </span>
            )}
            <div className="text-[10px] text-slate-400 font-mono">สัปดาห์ที่</div>
            <div className="text-xs font-extrabold text-white mt-0.5 truncate">{w.label}</div>
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
              <span className={`font-bold ${w.pct > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{w.pct}%</span>
              <span className="text-slate-400">
                👥 {w.joinedCount} ❌ {w.absentCount}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Six Event Summary Cards (Only in Matrix tab) */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {eventSummaries.map((ev) => (
            <div
              key={ev.key}
              className="rounded-2xl border border-slate-800 bg-[#0d121f]/90 p-3.5 shadow-lg flex flex-col justify-between gap-2.5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-white flex items-center gap-1.5 truncate">
                    <span>{ev.icon}</span>
                    <span className="truncate">{ev.shortName}</span>
                  </span>
                  <span className="rounded-full bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-400">
                    {ev.pct}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-2.5 text-center text-[10px]">
                  <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-1">
                    <span className="text-slate-400 block text-[9px]">เข้าร่วม</span>
                    <span className="font-bold text-emerald-300 font-mono">{ev.joined}</span>
                  </div>
                  <div className="rounded-lg bg-amber-950/30 border border-amber-500/30 p-1">
                    <span className="text-slate-400 block text-[9px]">แจ้งลา</span>
                    <span className="font-bold text-amber-300 font-mono">{ev.leave}</span>
                  </div>
                  <div className="rounded-lg bg-rose-950/30 border border-rose-500/30 p-1">
                    <span className="text-slate-400 block text-[9px]">ขาด</span>
                    <span className="font-bold text-rose-300 font-mono">{ev.absent}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => bulkCheckEventForGuild(ev.key)}
                className="w-full rounded-xl border border-emerald-500/40 bg-emerald-600/25 hover:bg-emerald-600/40 py-1.5 text-[11px] font-bold text-emerald-200 transition shadow-sm cursor-pointer flex items-center justify-center gap-1"
              >
                <span>✅</span>
                <span>เช็คยกทั้งกิลด์</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4. Controls Bar with BOTH Tabs */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d121f]/95 p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Sub Tabs Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>✅</span>
              <span>ตารางเช็คชื่อ 6 กิจกรรม (รายสัปดาห์)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40 ring-1 ring-purple-400/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📊</span>
              <span>สถิติของการลา / ขาด & การเข้าร่วมสะสม</span>
              <span className="rounded-full bg-slate-950/80 px-2 py-0.2 text-[10px] font-mono text-rose-300 border border-slate-700">
                ลา/ขาด {analyticsData.guildTotalLeave + analyticsData.guildTotalAbsent}
              </span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'matrix' && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
                <span className="text-slate-400 text-[11px]">โหมดคลิกช่อง:</span>
                <select
                  value={clickMode}
                  onChange={(e) => setClickMode(e.target.value as any)}
                  className="bg-transparent text-indigo-300 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="joined">✔ คลิกเดียว = เข้าร่วม (คลิกซ้ำเพื่อล้าง)</option>
                  <option value="cycle">🔄 สลับสถานะ (รอเช็ค ➔ เข้าร่วม ➔ ลา ➔ ขาด)</option>
                  <option value="leave">🏖️ คลิกเดียว = แจ้งลา</option>
                  <option value="absent">❌ คลิกเดียว = ขาดกิจกรรม</option>
                  <option value="note">✏️ คลิกเดียว = ระบุหมายเหตุ</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={activeTab === 'matrix' ? handleCopySummary : handleCopyOffenders}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <span>📋</span>
              <span>{activeTab === 'matrix' ? 'คัดลอกสรุปส่ง Discord/LINE' : 'คัดลอกสรุปคนลา/ขาด'}</span>
            </button>

            {activeTab === 'analytics' && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="rounded-xl border border-emerald-500/40 bg-emerald-600/30 hover:bg-emerald-600/50 px-3 py-1.5 text-xs font-bold text-emerald-200 transition cursor-pointer flex items-center gap-1"
              >
                <span>📥</span>
                <span>Export สถิติลา/ขาด CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Matrix Filters */}
        {activeTab === 'matrix' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 ค้นหาชื่อสมาชิก, อาชีพ, ทีม..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
              />

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">ทุกสนาม & ทุกทีม ({gvgTeams.length} ทีม)</option>
                {gvgTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    ทีม {t.name}
                  </option>
                ))}
                <option value="unassigned">สมาชิกที่ยังไม่มีตี้</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">ทุกสถานะการเข้าร่วม/ลา/ขาด</option>
                <option value="joined">🟢 มีการเข้าร่วม (อย่างน้อย 1 กิจกรรม)</option>
                <option value="leave">🏖️ มีการแจ้งลา (อย่างน้อย 1 กิจกรรม)</option>
                <option value="absent">❌ มีการขาด (อย่างน้อย 1 กิจกรรม)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetAllGuildComplete}
                className="rounded-xl border border-emerald-500/40 bg-emerald-600/25 hover:bg-emerald-600/40 px-3 py-1.5 text-xs font-bold text-emerald-200 transition cursor-pointer flex items-center gap-1"
              >
                <span>✅</span>
                <span>ตั้งเข้าครบทุกกิจกรรมทั้งกิลด์</span>
              </button>

              <button
                type="button"
                onClick={handleClearSelectedWeek}
                className="rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 px-3 py-1.5 text-xs font-bold text-rose-300 transition cursor-pointer flex items-center gap-1"
              >
                <span>🔄</span>
                <span>ล้างตารางสัปดาห์นี้</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Analytics Filters */}
        {activeTab === 'analytics' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={analyticsSearch}
                onChange={(e) => setAnalyticsSearch(e.target.value)}
                placeholder="🔍 ค้นหาชื่อสมาชิก, สายอาชีพ..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
              />

              <select
                value={analyticsScope}
                onChange={(e) => setAnalyticsScope(e.target.value as any)}
                className="bg-slate-950 border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs text-indigo-300 font-bold focus:outline-none"
              >
                <option value="all_weeks">🌐 ข้อมูลสะสมทุกสัปดาห์ทั้งหมด</option>
                <option value="selected_week">📅 ข้อมูลเฉพาะสัปดาห์ที่เลือก</option>
              </select>

              <select
                value={analyticsTeamFilter}
                onChange={(e) => setAnalyticsTeamFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">ทุกสนาม & ทุกทีม ({gvgTeams.length} ทีม)</option>
                {gvgTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    ทีม {t.name}
                  </option>
                ))}
                <option value="unassigned">สมาชิกที่ยังไม่มีตี้</option>
              </select>

              <select
                value={analyticsMemberFilter}
                onChange={(e) => setAnalyticsMemberFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">แสดงสมาชิกทุกคน</option>
                <option value="has_leave_or_absent">⚠️ มีประวัติ ลา หรือ ขาด (≥ 1 ครั้ง)</option>
                <option value="has_absent">❌ มีประวัติ ขาดกิจกรรม (≥ 1 ครั้ง)</option>
                <option value="has_leave">🏖️ มีประวัติ แจ้งลา (≥ 1 ครั้ง)</option>
                <option value="perfect">⭐ ยอดเยี่ยม: ไม่เคยลาหรือขาด (0 ครั้ง)</option>
              </select>

              <select
                value={analyticsSort}
                onChange={(e) => setAnalyticsSort(e.target.value as any)}
                className="bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
              >
                <option value="leave_absent_desc">เรียงตาม: รวม ลา + ขาด กิจกรรม (มาก ➔ น้อย)</option>
                <option value="absent_desc">เรียงตาม: ขาดกิจกรรม (มาก ➔ น้อย)</option>
                <option value="leave_desc">เรียงตาม: แจ้งลากิจกรรม (มาก ➔ น้อย)</option>
                <option value="joined_desc">เรียงตาม: เข้ากิจกรรมมากที่สุด (มาก ➔ น้อย)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 5A. TAB 1: Main Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="rounded-3xl border border-slate-800 bg-[#0d121f]/95 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[11px] border-b border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-3.5 min-w-[190px]">สมาชิก (ชื่อ / อาชีพ / Gear)</th>
                  <th className="py-3 px-2.5 min-w-[130px]">ทีม / ปาร์ตี้</th>
                  {WEEKLY_EVENTS_CONFIG.map((ev) => (
                    <th key={ev.key} className="py-3 px-2 text-center min-w-[110px]">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-sm">{ev.icon}</span>
                        <span className="text-[11px] font-bold text-slate-200 mt-0.5">{ev.shortName}</span>
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-2.5 text-center min-w-[110px]">สรุปสัปดาห์นี้</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">จัดการด่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMatrixMembers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-500">
                      ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredMatrixMembers.map((m) => {
                    const meta = getJobMeta(m.job);
                    const party = gvgParties.find((p) => p.slots?.includes(m.id));
                    const team = party ? gvgTeams.find((t) => t.id === party.teamId) : null;

                    let joinedThisWeek = 0;
                    WEEKLY_EVENTS_CONFIG.forEach((ev) => {
                      const st = getEventRecord(m as MemberWithEvents, selectedWeekMonday, ev.key).status;
                      if (st === 'joined') joinedThisWeek++;
                    });

                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition">
                        {/* Member Info */}
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <JobEmblem jobName={m.job} size={30} />
                            <div className="min-w-0">
                              <span className="font-extrabold text-sm text-white block truncate">
                                {m.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span style={{ color: meta.hexMain }} className="font-semibold">
                                  {m.job}
                                </span>
                                {m.gear && (
                                  <span className="text-slate-500 font-mono text-[10px]">
                                    • {m.gear.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Team / Party Badge */}
                        <td className="py-2.5 px-2.5">
                          {party && team ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-200">
                              {team.name} - {party.name}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">ไม่มีตี้</span>
                          )}
                        </td>

                        {/* 6 Event Columns */}
                        {WEEKLY_EVENTS_CONFIG.map((ev) => {
                          const rec = getEventRecord(m as MemberWithEvents, selectedWeekMonday, ev.key);
                          const st = rec.status;

                          return (
                            <td key={ev.key} className="py-2 px-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleCellClick(m.id, ev.key)}
                                className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                                  st === 'joined'
                                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 shadow-sm'
                                    : st === 'leave'
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                                    : st === 'absent'
                                    ? 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300'
                                    : 'bg-slate-900/60 hover:bg-slate-800 border border-dashed border-slate-700/80 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <span>
                                  {st === 'joined' && '✔ เข้าร่วม'}
                                  {st === 'leave' && '🏖️ แจ้งลา'}
                                  {st === 'absent' && '❌ ขาด'}
                                  {st === 'none' && 'รอเช็ค'}
                                </span>
                                {rec.note && (
                                  <span className="text-[9px] text-amber-200 truncate max-w-[85px] block mt-0.5" title={rec.note}>
                                    📝 {rec.note}
                                  </span>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        {/* Weekly Summary */}
                        <td className="py-2.5 px-2.5 text-center font-mono">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-extrabold border ${
                              joinedThisWeek === 6
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                : joinedThisWeek > 0
                                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                          >
                            ✔ {joinedThisWeek}/6
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleMarkAllForMember(m.id)}
                              className="rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 px-2 py-1 text-[11px] font-bold text-emerald-300 transition cursor-pointer"
                              title="ตั้งเข้าครบ 6 กิจกรรม"
                            >
                              ครบ 6
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClearForMember(m.id)}
                              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                              title="ล้างทั้งหมดของสัปดาห์นี้"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5B. TAB 2: Analytics & Leave/Absent Ranking View (Matching user uploaded image) */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: รวมแจ้งลากิจกรรม */}
            <div className="rounded-2xl border border-amber-500/30 bg-[#16120d]/90 p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>รวมแจ้งลากิจกรรม</span>
                </span>
                <span className="rounded-full bg-amber-950/60 text-amber-300 px-2 py-0.5 text-[10px] font-mono border border-amber-500/30">
                  {analyticsData.totalWeeks} สัปดาห์
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-amber-400 font-mono">{analyticsData.guildTotalLeave}</span>
                <span className="text-xs text-amber-300 ml-1.5 font-bold">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 truncate">
                ล่าสุด: <span className="text-amber-200">{analyticsData.guildTotalLeave === 0 ? 'ทุกคนพร้อมวอร์' : `${analyticsData.guildTotalLeave} ครั้งสะสม`}</span>
              </div>
            </div>

            {/* Card 2: รวมขาดกิจกรรม */}
            <div className="rounded-2xl border border-rose-500/30 bg-[#1a0f14]/90 p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span>❌</span>
                  <span>รวมขาดกิจกรรม (ไม่แจ้งลา)</span>
                </span>
                <span className="rounded-full bg-rose-950/60 text-rose-300 px-2 py-0.5 text-[10px] font-mono border border-rose-500/30">
                  {analyticsData.totalWeeks} สัปดาห์
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-rose-400 font-mono">{analyticsData.guildTotalAbsent}</span>
                <span className="text-xs text-rose-300 ml-1.5 font-bold">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 truncate">
                ล่าสุด: <span className="text-rose-200">{analyticsData.guildTotalAbsent === 0 ? 'ทุกคนมาครบ' : `${analyticsData.guildTotalAbsent} ครั้งสะสม`}</span>
              </div>
            </div>

            {/* Card 3: สมาชิกที่มีประวัติ ลา / ขาด */}
            <div className="rounded-2xl border border-purple-500/30 bg-[#140f1f]/90 p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>สมาชิกที่มีประวัติ ลา / ขาด</span>
                </span>
                <span className="rounded-full bg-purple-950/60 text-purple-300 px-2 py-0.5 text-[10px] font-mono border border-purple-500/30">
                  จาก {members.length} คน
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-purple-300 font-mono">{analyticsData.membersWithLeaveOrAbsent}</span>
                <span className="text-xs text-purple-200 ml-1.5 font-bold">คน</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 truncate">
                คิดเป็น:{' '}
                <span className="text-purple-200 font-mono font-bold">
                  {members.length > 0 ? Math.round((analyticsData.membersWithLeaveOrAbsent / members.length) * 100) : 0}% ของสมาชิกทั้งหมด
                </span>
              </div>
            </div>

            {/* Card 4: รวมเข้ากิจกรรม */}
            <div className="rounded-2xl border border-emerald-500/30 bg-[#0c1815]/90 p-4 shadow-lg flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>✅</span>
                  <span>รวมเข้ากิจกรรม & มาตามนัด</span>
                </span>
                <span className="rounded-full bg-emerald-950/60 text-emerald-300 px-2 py-0.5 text-[10px] font-mono border border-emerald-500/30">
                  Cloud Sync
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">{analyticsData.guildTotalJoined}</span>
                <span className="text-xs text-emerald-300 ml-1.5 font-bold">ครั้งที่เข้า</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 truncate">
                อัตราการเข้าร่วมรวม:{' '}
                <span className="text-emerald-300 font-mono font-bold">
                  {analyticsData.totalWeeks * members.length * 6 > 0 ? Math.round((analyticsData.guildTotalJoined / (analyticsData.totalWeeks * members.length * 6)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* สัดส่วนการเข้าร่วม / แจ้งลา / ขาด แยกตามรายกิจกรรม (6 Cards) */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d121f]/95 p-4 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-rose-300 flex items-center gap-1.5">
                <span>📌</span>
                <span>สัดส่วนการเข้าร่วม / แจ้งลา / ขาด แยกตามรายกิจกรรม (รวม Guild League อังคาร & พฤหัสบดี)</span>
              </h3>
              <span className="text-[11px] text-slate-400">ช่วยให้เห็นว่ากิจกรรมไหนสมาชิกไม่สะดวกหรือขาดเยอะเป็นพิเศษ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {WEEKLY_EVENTS_CONFIG.map((ev) => {
                const stat = analyticsData.eventTotals[ev.key];
                const total = stat.totalPossible;
                const leavePct = total > 0 ? Math.round((stat.leave / total) * 100) : 0;
                const absentPct = total > 0 ? Math.round((stat.absent / total) * 100) : 0;

                return (
                  <div key={ev.key} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 space-y-2 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-white flex items-center gap-1 truncate">
                        <span>{ev.icon}</span>
                        <span className="truncate">{ev.shortName}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">รวม: {stat.joined}</span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-emerald-400 flex items-center gap-1">
                          <span>👥</span>
                          <span>{stat.joined}</span>
                        </span>
                        <span className="text-amber-400 flex items-center gap-1">
                          <span>🏖️</span>
                          <span>
                            {stat.leave} ({leavePct}%)
                          </span>
                        </span>
                        <span className="text-rose-400 flex items-center gap-1">
                          <span>❌</span>
                          <span>
                            {stat.absent} ({absentPct}%)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ranking Table of All Members */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d121f]/95 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-[#090d16] text-slate-400 uppercase text-[11px] border-b border-slate-800 select-none">
                  <tr>
                    <th className="py-3 px-3 min-w-[170px]">อันดับ / สมาชิก</th>
                    <th className="py-3 px-2.5 min-w-[120px]">ทีม / ปาร์ตี้</th>
                    {WEEKLY_EVENTS_CONFIG.map((ev) => (
                      <th key={ev.key} className="py-3 px-2 text-center min-w-[95px]">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-xs">{ev.icon}</span>
                          <span className="text-[10px] font-bold text-slate-300 truncate max-w-[85px] mt-0.5">{ev.shortName}</span>
                          <span className="text-[8px] text-slate-500 font-normal lowercase">(เข้า/ลา/ขาด)</span>
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center min-w-[85px] text-amber-300">🔔 รวมลากิจกรรม</th>
                    <th className="py-3 px-2 text-center min-w-[85px] text-rose-300">❌ รวมขาดกิจกรรม</th>
                    <th className="py-3 px-2.5 text-center min-w-[110px] text-rose-200">🏖️ รวมลา+ขาด</th>
                    <th className="py-3 px-2 text-center min-w-[90px] text-emerald-300">✅ เข้าร่วมสะสม (%)</th>
                    <th className="py-3 px-3 min-w-[220px]">รายละเอียดกิจกรรมที่ ลา / ขาด & หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAnalyticsMemberStats.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-16 text-center text-slate-500">
                        ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredAnalyticsMemberStats.map((item, idx) => {
                      const m = item.member;
                      const meta = getJobMeta(m.job);

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition">
                          {/* Rank / Member */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                              <JobEmblem jobName={m.job} size={28} />
                              <div className="min-w-0">
                                <span className="font-extrabold text-sm text-white block truncate">{m.name}</span>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span style={{ color: meta.hexMain }} className="font-semibold">
                                    {m.job}
                                  </span>
                                  {m.gear && <span className="text-slate-500 font-mono">• {m.gear.toLocaleString()}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Team / Party */}
                          <td className="py-2.5 px-2.5">
                            {item.party && item.team ? (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                                {item.team.name} - {item.party.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px] italic">ไม่มีตี้</span>
                            )}
                          </td>

                          {/* 6 Events (เข้า / ลา / ขาด) */}
                          {WEEKLY_EVENTS_CONFIG.map((ev) => {
                            const c = item.byEvent[ev.key];
                            return (
                              <td key={ev.key} className="py-2 px-1 text-center font-mono text-[11px]">
                                <span className="rounded-lg bg-slate-900/90 border border-slate-800 px-2 py-1 inline-block">
                                  <span className="text-emerald-400 font-bold">{c.joined}</span>
                                  <span className="text-slate-600 mx-0.5">/</span>
                                  <span className="text-amber-400 font-bold">{c.leave}</span>
                                  <span className="text-slate-600 mx-0.5">/</span>
                                  <span className="text-rose-400 font-bold">{c.absent}</span>
                                </span>
                              </td>
                            );
                          })}

                          {/* รวมลากิจกรรม */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            <span className="font-bold text-amber-300">{item.totalLeave} ครั้ง</span>
                          </td>

                          {/* รวมขาดกิจกรรม */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            <span className="font-bold text-rose-300">{item.totalAbsent} ครั้ง</span>
                          </td>

                          {/* รวมลา+ขาด */}
                          <td className="py-2.5 px-2.5 text-center font-mono">
                            <span
                              className={`rounded-xl px-2 py-1 text-xs font-bold border inline-block ${
                                item.totalLeaveAndAbsent > 0 ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
                              }`}
                            >
                              รวม {item.totalLeaveAndAbsent} ครั้ง
                            </span>
                          </td>

                          {/* เข้าร่วมสะสม % */}
                          <td className="py-2.5 px-2 text-center font-mono">
                            <span className="font-bold text-emerald-400">
                              {item.totalJoined}/{analyticsData.totalWeeks * 6} ({item.joinedPct}%)
                            </span>
                          </td>

                          {/* รายละเอียดการขาด / ลา */}
                          <td className="py-2.5 px-3 text-[11px]">
                            {item.leaveAbsentDetails.length === 0 ? (
                              <span className="text-emerald-400 font-medium">✨ ไม่มีประวัติการขาดหรือลากิจกรรม</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {item.leaveAbsentDetails.slice(0, 3).map((d, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${
                                      d.status === 'absent' ? 'bg-rose-950/60 text-rose-300 border-rose-500/30' : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                                    }`}
                                  >
                                    {d.status === 'absent' ? 'ขาด' : 'ลา'} {d.eventName}
                                    {d.note && ` (${d.note})`}
                                  </span>
                                ))}
                                {item.leaveAbsentDetails.length > 3 && (
                                  <span className="text-[10px] text-slate-400">+{item.leaveAbsentDetails.length - 3} รายการ</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
