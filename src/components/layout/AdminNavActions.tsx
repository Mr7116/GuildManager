'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useGuildStore } from '@/lib/guildStore';
import ImportCsvModal from '@/components/modals/ImportCsvModal';
import ChangePinModal from '@/components/modals/ChangePinModal';
import ExportImageModal from '@/components/modals/ExportImageModal';

export default function AdminNavActions() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const { guildName, members, gvgTeams, gvgParties } = useGuildStore();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [isExportImageModalOpen, setIsExportImageModalOpen] = useState(false);

  if (!isAuthenticated) return null;

  const exportMode = pathname === '/siege' ? 'siege' : pathname === '/polarity' ? 'polarity' : 'gvg';

  // 1. Export Lineup & Members CSV
  const handleExportCSV = () => {
    if (members.length === 0) {
      alert('ไม่มีข้อมูลสมาชิกในระบบสำหรับส่งออก CSV');
      return;
    }

    const headers = [
      'ID',
      'ชื่อตัวละคร',
      'Lv.',
      'อาชีพ',
      'Title',
      'เพศ',
      'ตำแหน่ง',
      'คะแนน Gear',
      'กิจกรรมกิลด์รายสัปดาห์',
      'คะแนนบริจาคสัปดาห์',
      'คะแนนบริจาครวม',
      'สถานะการออนไลน์',
      'ทีม GVG',
      'ปาร์ตี้ GVG',
    ];

    const rows = members.map((m, idx) => {
      const gvgParty = gvgParties.find((p) => p.slots?.includes(m.id));
      const gvgTeam = gvgParty ? gvgTeams.find((t) => t.id === gvgParty.teamId) : null;

      const teamName = gvgTeam ? gvgTeam.name : '-';
      const partyName = gvgParty ? gvgParty.name : '-';

      return [
        m.csvId || idx + 1,
        `"${m.name || ''}"`,
        m.lv || 1,
        `"${m.job || ''}"`,
        `"${m.title || '-'}"`,
        `"${m.gender || '-'}"`,
        `"${m.position || 'สมาชิก'}"`,
        m.gear || 0,
        m.weeklyActivity || 0,
        m.weeklyContrib || 0,
        m.totalContrib || 0,
        `"${m.onlineStatus || m.status || 'พร้อมลงวอร์'}"`,
        `"${teamName}"`,
        `"${partyName}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `${guildName}_Lineup_Export_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* 1. นำเข้า .CSV */}
        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition cursor-pointer"
          title="นำเข้าสมาชิกจากไฟล์ .CSV"
        >
          <span>📥</span>
          <span>นำเข้า .CSV</span>
        </button>

        {/* 2. ส่งออก CSV */}
        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700/90 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
          title="ส่งออกรายชื่อสมาชิกและข้อมูลเป็นไฟล์ CSV"
        >
          <span>📊</span>
          <span>ส่งออก CSV</span>
        </button>

        {/* 3. ส่งออกรูปผังทัพ (PNG) */}
        <button
          type="button"
          onClick={() => setIsExportImageModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-200 transition cursor-pointer"
          title="ส่งออกรูปภาพผังทัพที่จัด (PNG)"
        >
          <span>📸</span>
          <span>ส่งออกรูปผังทัพ</span>
        </button>

        {/* 4. จัดการรหัสผ่าน */}
        <button
          type="button"
          onClick={() => setIsChangePinModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-slate-700/80 bg-amber-50 dark:bg-slate-800/90 hover:bg-amber-100 dark:hover:bg-slate-700/90 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 transition cursor-pointer"
          title="เปลี่ยนรหัสผ่านผู้ดูแล (บันทึก Cloud)"
        >
          <span>🔑</span>
          <span>จัดการรหัส</span>
        </button>

        {/* 5. ออกจากระบบ */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800/90 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-rose-300 dark:hover:border-rose-700/60 hover:text-rose-600 dark:hover:text-rose-300 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition cursor-pointer"
          title="ออกจากระบบ"
        >
          <span>🚪</span>
          <span>ออกจากระบบ</span>
        </button>
      </div>

      {/* Modals */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ChangePinModal
        isOpen={isChangePinModalOpen}
        onClose={() => setIsChangePinModalOpen(false)}
      />

      <ExportImageModal
        isOpen={isExportImageModalOpen}
        onClose={() => setIsExportImageModalOpen(false)}
        mode={exportMode}
      />
    </>
  );
}
