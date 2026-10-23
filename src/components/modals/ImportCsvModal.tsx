'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGuildStore } from '@/lib/guildStore';
import { Member } from '@/types/member';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportCsvModal({ isOpen, onClose }: ImportCsvModalProps) {
  const { members, setMembers, setGuildName, setFileTimestamp } = useGuildStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedMembers, setParsedMembers] = useState<Member[]>([]);
  const [detectedGuild, setDetectedGuild] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const parseCSVText = (text: string) => {
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols: string[] = [];
      let inQuotes = false;
      let cur = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(cur.trim().replace(/^"|"$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      cols.push(cur.trim().replace(/^"|"$/g, ''));

      if (cols.length < 3) continue;
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = cols[idx] !== undefined ? cols[idx] : '';
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setStatusMsg('');

    const baseName = file.name.replace(/\.csv$/i, '');
    const parts = baseName.split('_');
    if (parts.length >= 2) {
      setDetectedGuild(parts[0]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const rows = parseCSVText(content);

        if (!rows.length) {
          setErrorMsg('ไม่สามารถอ่านข้อมูลจากไฟล์ CSV ได้ กรุณาตรวจสอบว่าเป็นไฟล์ตารางรายชื่อที่ถูกต้อง');
          return;
        }

        const imported: Member[] = rows.map((r, idx) => {
          const name = (r['ชื่อผู้เล่น'] || r['ชื่อ'] || r['Name'] || `Member_${idx + 1}`).trim();
          const onlineStr = (r['สถานะออนไลน์'] || r['Online'] || '[ออนไลน์]').trim();
          const isLongOffline = ['ออฟไลน์ 4 วัน', 'ออฟไลน์ 5 วัน', 'ออฟไลน์ 6 วัน', 'ออฟไลน์เกิน 7 วัน'].includes(onlineStr);

          return {
            id: `m_csv_${Date.now()}_${r['ID'] || idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
            csvId: parseInt(r['ID'] || `${idx + 1}`, 10) || idx + 1,
            name,
            lv: parseInt(r['Lv.'] || r['Lv'] || r['Level'] || '1', 10) || 1,
            job: (r['คลาส'] || r['อาชีพ'] || r['Class'] || r['Job'] || 'Novice').trim(),
            title: (r['Title'] || '-').trim(),
            gender: (r['เพศ'] || r['Gender'] || '-').trim(),
            position: (r['ตำแหน่ง'] || r['Position'] || 'สมาชิก').trim(),
            gear: parseInt(r['คะแนน Gear'] || r['Gear'] || r['คะแนน'] || '0', 10) || 0,
            weeklyActivity: parseInt(r['กิจกรรมสัปดาห์นี้'] || '0', 10) || 0,
            weeklyContrib: parseInt(r['แต้มสนับสนุนสัปดาห์นี้'] || '0', 10) || 0,
            totalContrib: parseInt(r['แต้มสนับสนุนสะสม'] || '0', 10) || 0,
            onlineStatus: onlineStr,
            status: isLongOffline ? 'leave' : 'ready',
            leaveReason: isLongOffline ? onlineStr : undefined,
            weeklyEvents: {},
          };
        });

        setParsedMembers(imported);
        setStatusMsg(`พบข้อมูลสมาชิกทั้งหมด ${imported.length} คน จากไฟล์ "${file.name}"`);
      } catch (err) {
        setErrorMsg('เกิดข้อผิดพลาดในการแปลงไฟล์ CSV');
      }
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleMerge = async () => {
    if (!parsedMembers.length) return;

    if (detectedGuild) setGuildName(detectedGuild);
    setFileTimestamp(new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }));

    const existingMap = new Map(members.map((m) => [m.name.toLowerCase(), m]));
    let updatedCount = 0;
    let addedCount = 0;

    const newMembersList = [...members];

    parsedMembers.forEach((imp) => {
      const key = imp.name.toLowerCase();
      if (existingMap.has(key)) {
        const ex = existingMap.get(key)!;
        const targetIdx = newMembersList.findIndex((x) => x.id === ex.id);
        if (targetIdx !== -1) {
          newMembersList[targetIdx] = {
            ...ex,
            lv: imp.lv,
            job: imp.job,
            title: imp.title,
            gender: imp.gender,
            position: imp.position,
            gear: imp.gear,
            weeklyActivity: imp.weeklyActivity,
            weeklyContrib: imp.weeklyContrib,
            totalContrib: imp.totalContrib,
            onlineStatus: imp.onlineStatus,
            status: imp.status === 'leave' && ex.status !== 'leave' ? 'leave' : ex.status,
            leaveReason: imp.leaveReason || ex.leaveReason,
          };
          updatedCount++;
        }
      } else {
        newMembersList.push(imp);
        addedCount++;
      }
    });

    setMembers(newMembersList);
    alert(`✅ รวมข้อมูลสำเร็จ!\n- อัปเดตข้อมูลเดิม: ${updatedCount} คน\n- เพิ่มสมาชิกใหม่: ${addedCount} คน\n- สมาชิกรวมทั้งหมด: ${newMembersList.length} คน\n(ระบบจะบันทึกขึ้น Cloud อัตโนมัติ)`);
    onClose();
  };

  const handleOverwrite = async () => {
    if (!parsedMembers.length) return;
    if (!confirm(`⚠️ ยืนยันการ "แทนที่ทั้งหมด"?\nข้อมูลสมาชิกเดิมจะถูกแทนที่ด้วยรายชื่อจาก CSV จำนวน ${parsedMembers.length} คน`)) return;

    if (detectedGuild) setGuildName(detectedGuild);
    setFileTimestamp(new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }));

    setMembers(parsedMembers);
    alert(`✅ แทนที่ข้อมูลใหม่ทั้งหมดสำเร็จ!\n- โหลดสมาชิกใหม่: ${parsedMembers.length} คน\n(ระบบจะบันทึกขึ้น Cloud อัตโนมัติ)`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0d121f] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-xl border border-emerald-500/30">
              📁
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">นำเข้าข้อมูลสมาชิกด้วย .CSV</h2>
              <p className="text-xs text-slate-400">รองรับไฟล์ CSV รายชื่อสมาชิกจากเกม ROX</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* File Selector */}
        <div className="space-y-3">
          <label
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-6 text-center hover:border-emerald-500/60 hover:bg-slate-900 cursor-pointer transition"
          >
            <span className="text-3xl">📥</span>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                {fileName ? `ไฟล์ที่เลือก: ${fileName}` : 'คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวาง'}
              </p>
              <p className="text-xs text-slate-500 mt-1">ไฟล์นามสกุล .csv (UTF-8)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 font-medium">
              ✅ {statusMsg}
            </div>
          )}
        </div>

        {/* Action Choice Buttons */}
        {parsedMembers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <p className="text-xs font-semibold text-slate-300">เลือกรูปแบบการนำเข้าข้อมูล:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleMerge}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/30 hover:bg-emerald-600/50 px-4 py-2.5 text-xs font-bold text-emerald-200 transition shadow-sm cursor-pointer"
              >
                <span>🔄 รวมข้อมูล (Merge)</span>
              </button>

              <button
                type="button"
                onClick={handleOverwrite}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-4 py-2.5 text-xs font-bold text-rose-300 transition shadow-sm cursor-pointer"
              >
                <span>⚠️ ทับใหม่ทั้งหมด (Overwrite)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              * รวมข้อมูล (Merge): อัปเดต Gear / อาชีพ / เลเวลของคนเดิม และเพิ่มคนที่ไม่มี โดยไม่กระทบตำแหน่งในปาร์ตี้เดิม
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
