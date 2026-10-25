'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import ThemeToggle from '@/components/layout/ThemeToggle';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, changePin, isAuthenticated } = useAuth();

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change PIN modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [modalMsg, setModalMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      const redirectUrl = searchParams.get('redirect') || '/gvg';
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const ok = await login(pin, remember);
      if (ok) {
        const redirectUrl = searchParams.get('redirect') || '/gvg';
        router.replace(redirectUrl);
      } else {
        setErrorMsg('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalMsg(null);

    if (newPin !== confirmPin) {
      setModalMsg({ text: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', isError: true });
      return;
    }

    const res = await changePin(oldPin, newPin);
    if (res.success) {
      setModalMsg({ text: res.message, isError: false });
      setPin(newPin);
      setTimeout(() => {
        setIsModalOpen(false);
        setModalMsg(null);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
      }, 1500);
    } else {
      setModalMsg({ text: res.message, isError: true });
    }
  };

  return (
    <div className="relative w-full max-w-md z-10">
      <div className="bg-[#0e1422]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">
              TUMDOOD <span className="text-indigo-400">Tactical</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">ระบบจัดผังทัพและยุทธศาสตร์กิลด์วอร์</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                🔒 รหัสผ่านเข้าสู่ระบบ (Passcode)
              </label>
              <span className="text-[11px] text-slate-500"></span>
            </div>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="กรอกรหัสผ่านเพื่อเข้าจัดการทัพ..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                {showPin ? '🙈 ซ่อน' : '👁️ ดู'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>จำรหัสผ่านในเครื่องนี้</span>
            </label>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
            >
              เปลี่ยนรหัสผ่าน
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-900/40 transition cursor-pointer"
          >
            {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : '🔑 เข้าสู่ระบบ (Login)'}
          </button>

          {/* Public Links */}
          <div className="pt-2 space-y-2 border-t border-slate-800/80 text-center">
            <Link
              href="/public"
              className="block py-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              🌐 มุมมองลูกกิลด์ (ค้นหาตี้)
            </Link>
            <Link
              href="/auctions"
              className="block py-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              💎 ประมูล (ลงชื่อลุ้นไอเทม)
            </Link>
            <Link
              href="/leave"
              className="block py-2 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              📝 แจ้งลากิลด์วอร์ออนไลน์
            </Link>
          </div>
        </form>
      </div>

      {/* Change PIN Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">เปลี่ยนรหัสผ่านกิลด์</h3>
                <p className="text-[11px] text-slate-400">ซิงค์รหัสผ่านใหม่ขึ้น Cloud ทันที</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="รหัสผ่านปัจจุบัน"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">รหัสผ่านใหม่ (อย่างน้อย 3 ตัว)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="รหัสผ่านใหม่..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านใหม่..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {modalMsg && (
                <div
                  className={`p-2 rounded-xl text-center text-xs font-semibold ${
                    modalMsg.isError
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {modalMsg.text}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  บันทึกรหัสใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-950/30 rounded-full blur-[140px] pointer-events-none" />
      <Suspense fallback={<div className="text-white text-xs">กำลังโหลดหน้าล็อกอิน...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

