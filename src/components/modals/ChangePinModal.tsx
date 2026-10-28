'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGuildStore } from '@/lib/guildStore';
import { DEFAULT_PIN } from '@/config/guildConfig';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePinModal({ isOpen, onClose }: ChangePinModalProps) {
  const { saveToCloud } = useGuildStore();

  const [mounted, setMounted] = useState(false);
  const [currentPin, setCurrentPin] = useState(DEFAULT_PIN);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('Moonz_guild_pin') || DEFAULT_PIN;
      setCurrentPin(stored);
      setNewPin('');
      setConfirmPin('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPin = newPin.trim();
    if (!cleanPin) {
      setErrorMsg('กรุณากรอกรหัสผ่านใหม่');
      return;
    }

    if (cleanPin.length < 3) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    if (cleanPin !== confirmPin.trim()) {
      setErrorMsg('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน');
      return;
    }

    setIsSavingPin(true);
    try {
      localStorage.setItem('Moonz_guild_pin', cleanPin);
      setCurrentPin(cleanPin);

      await saveToCloud();

      setSuccessMsg(`✅ เปลี่ยนรหัสกิลด์เป็น "${cleanPin}" และซิงค์ขึ้น Cloud เรียบร้อยแล้ว!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg('เกิดข้อผิดพลาดในการบันทึกรหัสผ่านขึ้น Cloud');
    } finally {
      setIsSavingPin(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-[#0d121f] p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl border border-amber-500/30">
              🔑
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">เปลี่ยนรหัสผ่านกิลด์ (Cloud Sync)</h2>
              <p className="text-xs text-slate-400">เมื่อเปลี่ยนแล้ว สมาชิกในกิลด์จะใช้รหัสนี้ร่วมกัน</p>
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

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              รหัสผ่านปัจจุบันในเครื่อง:
            </label>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-300">
              {showPassword ? currentPin : '••••••••'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              รหัสผ่านกิลด์ใหม่:
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 3 ตัวอักษร)"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              ยืนยันรหัสผ่านใหม่อีกครั้ง:
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0"
              />
              <span>แสดงรหัสผ่าน</span>
            </label>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300 font-semibold">
              {successMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSavingPin}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 px-4 py-2 text-xs font-bold text-amber-300 transition shadow-sm cursor-pointer"
            >
              <span>💾</span>
              <span>{isSavingPin ? 'กำลังบันทึก...' : 'บันทึกรหัสใหม่ขึ้น Cloud'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
