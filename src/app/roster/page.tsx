'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGuildStore } from '@/lib/guildStore';
import { Member } from '@/types/member';
import JobEmblem from '@/components/tactical/JobEmblem';
import JobEmblemBar from '@/components/tactical/JobEmblemBar';
import TitleMedal from '@/components/tactical/TitleMedal';
import AutoSaveBadge from '@/components/common/AutoSaveBadge';
import { JOB_FAMILIES, JOB_LOOKUP, getJobMeta } from '@/constants/jobs';
import { getTitleMeta, TITLE_LIST, getTitleRankWeight } from '@/constants/titles';

type SortField = 'name' | 'job' | 'position' | 'title' | 'status' | 'gear';
type SortDirection = 'asc' | 'desc';

export default function RosterPage() {
  const { members, setMembers, saveToCloud, isSaving, lastSavedAt } = useGuildStore();

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('gear');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'gear' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-slate-600 ml-1 text-[10px]">↕</span>;
    }
    return (
      <span className="text-amber-400 ml-1 text-[11px] font-bold">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formName, setFormName] = useState('');
  const [formJob, setFormJob] = useState('Lord Knight');
  const [formGear, setFormGear] = useState('');
  const [formLevel, setFormLevel] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState<'ready' | 'leave'>('ready');

  // Count by family for top bar
  const countsByFamily = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const meta = JOB_LOOKUP[m.job?.trim().toLowerCase()];
      if (meta) {
        counts[meta.familyKey] = (counts[meta.familyKey] || 0) + 1;
      }
    });
    return counts;
  }, [members]);

  // Filtered members
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return members.filter((m) => {
      const nameMatch = m.name?.toLowerCase().includes(query);
      const jobMatch = m.job?.toLowerCase().includes(query);
      const posMatch = m.position?.toLowerCase().includes(query);
      const titleMatch = m.title?.toLowerCase().includes(query);
      if (query && !nameMatch && !jobMatch && !posMatch && !titleMatch) return false;

      if (selectedFamily) {
        const meta = JOB_LOOKUP[m.job?.trim().toLowerCase()];
        if (!meta || meta.familyKey !== selectedFamily) return false;
      }
      return true;
    });
  }, [members, search, selectedFamily]);

  // Sorted members based on active sortField and sortDirection
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '', 'th', { sensitivity: 'base' });
      } else if (sortField === 'job') {
        comparison = (a.job || '').localeCompare(b.job || '', 'th', { sensitivity: 'base' });
      } else if (sortField === 'position') {
        const aVal = a.position || 'สมาชิกทั่วไป';
        const bVal = b.position || 'สมาชิกทั่วไป';
        comparison = aVal.localeCompare(bVal, 'th', { sensitivity: 'base' });
      } else if (sortField === 'title') {
        const aRank = getTitleRankWeight(a.title);
        const bRank = getTitleRankWeight(b.title);
        if (aRank === 0 && bRank === 0) {
          comparison = (a.title || '').localeCompare(b.title || '', 'th', { sensitivity: 'base' });
        } else if (aRank === 0) {
          return 1;
        } else if (bRank === 0) {
          return -1;
        } else if (aRank !== bRank) {
          comparison = aRank - bRank;
        } else {
          comparison = (a.title || '').localeCompare(b.title || '', 'th', { sensitivity: 'base' });
        }
      } else if (sortField === 'status') {
        const aVal = a.status === 'ready' ? 1 : 0;
        const bVal = b.status === 'ready' ? 1 : 0;
        comparison = aVal - bVal;
      } else if (sortField === 'gear') {
        const aVal = Number(a.gear) || 0;
        const bVal = Number(b.gear) || 0;
        comparison = aVal - bVal;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredMembers, sortField, sortDirection]);

  // Bulk selection
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedMembers.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // Delete handlers
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`คุณต้องการลบสมาชิกที่เลือกจำนวน ${selectedIds.size} คน ใช่หรือไม่?`)) return;

    setMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
  };

  const handleDeleteOne = (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" ออกจากกิลด์ใช่หรือไม่?`)) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Open modal
  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormJob('Lord Knight');
    setFormGear('');
    setFormLevel('90');
    setFormPosition('สมาชิกทั่วไป');
    setFormTitle('');
    setFormStatus('ready');
    setModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormJob(m.job);
    setFormGear(m.gear ? String(m.gear) : '');
    setFormLevel(m.lv ? String(m.lv) : '90');
    setFormPosition(m.position || '');
    setFormTitle(m.title || '');
    setFormStatus(m.status);
    setModalOpen(true);
  };

  // Save Modal
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingMember) {
      setMembers((prev) =>
        prev.map((m) => {
          if (m.id !== editingMember.id) return m;
          return {
            ...m,
            name: formName.trim(),
            job: formJob,
            gear: formGear ? parseInt(formGear, 10) : undefined,
            lv: formLevel ? parseInt(formLevel, 10) : undefined,
            position: formPosition.trim() || undefined,
            title: formTitle.trim() || undefined,
            status: formStatus,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    } else {
      const newMember: Member = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        job: formJob,
        gear: formGear ? parseInt(formGear, 10) : undefined,
        lv: formLevel ? parseInt(formLevel, 10) : undefined,
        position: formPosition.trim() || undefined,
        title: formTitle.trim() || undefined,
        status: formStatus,
        updatedAt: new Date().toISOString(),
      };
      setMembers((prev) => [newMember, ...prev]);
    }

    setModalOpen(false);
  };

  // All jobs options
  const allJobOptions = useMemo(() => {
    const list: string[] = [];
    JOB_FAMILIES.forEach((f) => {
      f.jobs.forEach((j) => {
        if (!list.includes(j)) list.push(j);
      });
    });
    return list;
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-[#0d121f]/95 p-4 sm:p-5 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-xl border border-indigo-500/30">
            🛡️
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              จัดการรายชื่อสมาชิกกิลด์ (Roster)
            </h1>
            <p className="text-xs text-slate-400">
              สมาชิกทั้งหมด {members.length} คน • พร้อมลงสนาม {members.filter((m) => m.status !== 'leave').length} คน
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AutoSaveBadge />

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-600/30 px-3.5 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-600/50 transition shadow-sm cursor-pointer"
            >
              <span>🗑️</span>
              <span>ลบที่เลือก ({selectedIds.size} คน)</span>
            </button>
          )}

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600/25 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/40 hover:text-white transition cursor-pointer"
          >
            <span>➕</span>
            <span>เพิ่มสมาชิกใหม่</span>
          </button>

          <button
            type="button"
            onClick={saveToCloud}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-600/30 px-4 py-1.5 text-xs font-bold text-indigo-100 hover:bg-indigo-600/50 hover:text-white transition shadow-sm cursor-pointer"
          >
            <span>💾</span>
            <span>{isSaving ? 'กำลังบันทึก...' : lastSavedAt ? `บันทึกล่าสุด ${lastSavedAt}` : 'บันทึกขึ้น Cloud'}</span>
          </button>
        </div>
      </div>

      {/* 15 Job Class Emblem Bar */}
      <JobEmblemBar
        selectedJob={selectedFamily}
        onSelectJob={setSelectedFamily}
        counts={countsByFamily}
        totalCount={members.length}
      />

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d121f]/90 border border-slate-800 p-3 rounded-2xl">
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ คลาส..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 shrink-0">เรียงตาม:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-');
                setSortField(f as SortField);
                setSortDirection(d as SortDirection);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="gear-desc">Gear Score (มาก ➔ น้อย)</option>
              <option value="gear-asc">Gear Score (น้อย ➔ มาก)</option>
              <option value="name-asc">ชื่อสมาชิก (ก-ฮ / A-Z)</option>
              <option value="name-desc">ชื่อสมาชิก (ฮ-ก / Z-A)</option>
              <option value="job-asc">สายอาชีพ (A-Z)</option>
              <option value="job-desc">สายอาชีพ (Z-A)</option>
              <option value="title-asc">ตำแหน่ง / Title (ก-ฮ / A-Z)</option>
              <option value="title-desc">ตำแหน่ง / Title (ฮ-ก / Z-A)</option>
              <option value="status-desc">สถานะ (พร้อมวอร์ก่อน)</option>
              <option value="status-asc">สถานะ (คนลาก่อน)</option>
            </select>
          </div>

          <div className="text-xs text-slate-400 shrink-0">
            แสดงผล <strong className="text-white">{sortedMembers.length}</strong> จากทั้งหมด {members.length} คน
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d121f]/95 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] border-b border-slate-800 select-none">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === sortedMembers.length && sortedMembers.length > 0}
                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตามชื่อสมาชิก"
                >
                  <span className="inline-flex items-center">
                    สมาชิก
                    {renderSortIcon('name')}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('job')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตามสายอาชีพ"
                >
                  <span className="inline-flex items-center">
                    สายอาชีพ
                    {renderSortIcon('job')}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('position')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตามตำแหน่ง"
                >
                  <span className="inline-flex items-center">
                    ตำแหน่ง
                    {renderSortIcon('position')}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตาม Title"
                >
                  <span className="inline-flex items-center">
                    Title
                    {renderSortIcon('title')}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตามสถานะ"
                >
                  <span className="inline-flex items-center">
                    สถานะ
                    {renderSortIcon('status')}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('gear')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition select-none group"
                  title="คลิกเพื่อเรียงตาม Gear Score"
                >
                  <span className="inline-flex items-center">
                    Gear Score
                    {renderSortIcon('gear')}
                  </span>
                </th>
                <th className="py-3 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sortedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    ไม่พบสมาชิกตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              ) : (
                sortedMembers.map((m) => {
                  const meta = getJobMeta(m.job);
                  const isChecked = selectedIds.has(m.id);

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isChecked ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleSelectOne(m.id, e.target.checked)}
                          className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <JobEmblem jobName={m.job} size={30} />
                          <div>
                            <span className="font-extrabold text-sm text-white block">
                              {m.name}
                            </span>
                            {m.lv && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Lv.{m.lv}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span style={{ color: meta.hexMain }} className="font-semibold text-xs">
                          {m.job}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-xs text-slate-200">
                          {m.position || 'สมาชิกทั่วไป'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        {m.title ? (
                          <div className="flex items-center gap-2">
                            <TitleMedal title={m.title} size={28} />
                            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                              {m.title}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {m.status === 'leave' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                            🔴 ลาวอร์ ({m.leaveReason || 'วันนี้'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            🟢 พร้อมวอร์
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                        {m.gear ? m.gear.toLocaleString() : '-'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 hover:text-white transition"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(m.id, m.name)}
                            className="rounded-lg bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/40 px-2.5 py-1 text-rose-300 transition"
                          >
                            🗑️
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

      {/* Add / Edit Member Modal */}
      {modalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {editingMember ? '✏️ แก้ไขข้อมูลสมาชิก' : '➕ เพิ่มสมาชิกใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">ชื่อสมาชิกกิลด์ *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น นิพพาน, SeasmoKe, Legend"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">สายอาชีพ (คลาส) *</label>
                <select
                  value={formJob}
                  onChange={(e) => setFormJob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {allJobOptions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">ตำแหน่งในกิลด์ (Position)</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="เช่น นักออกแบบ, เสมียน, สมาชิกทั่วไป"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ฉายา (Title)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      list="rosterTitleOptions"
                      placeholder="เช่น Pathfinder III"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <datalist id="rosterTitleOptions">
                      {TITLE_LIST.map((t) => (
                        <option key={t.key} value={t.name} />
                      ))}
                    </datalist>
                    {formTitle.trim() && (
                      <div className="shrink-0">
                        <TitleMedal title={formTitle} size={34} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Gear Score (ตัวเลข)</label>
                  <input
                    type="number"
                    value={formGear}
                    onChange={(e) => setFormGear(e.target.value)}
                    placeholder="เช่น 313868"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">เลเวล (Level)</label>
                  <input
                    type="number"
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    placeholder="เช่น 91"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">สถานะความพร้อม</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'ready' | 'leave')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ready">🟢 พร้อมลงวอร์ (Ready)</option>
                  <option value="leave">🔴 แจ้งลากิลด์วอร์ (Leave)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {editingMember ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

