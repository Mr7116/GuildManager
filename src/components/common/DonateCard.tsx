'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function DonateCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Donate QR Box (Permanent Left Box) */}
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 rounded-2xl p-3 flex flex-col items-center text-center cursor-pointer group transition shadow-lg shadow-amber-950/20"
      >
        <div className="flex items-center gap-1.5 mb-1 text-amber-300 font-bold text-xs">
          <span>☕</span>
          <span>สนับสนุน / โดเนทค่าน้ำชา</span>
        </div>
        <p className="text-[11px] text-slate-400">สแกน QR Code ด้านล่าง (คลิกที่รูปเพื่อขยายใหญ่)</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          ลิงก์โดเนท :{' '}
          <a
            href="https://hiwdo.com/natdanai1256"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-indigo-400 underline hover:text-indigo-300 transition"
          >
            https://hiwdo.com/natdanai1256
          </a>
        </p>
        <div className="bg-white p-2.5 rounded-2xl shadow-md border-2 border-amber-400/70 group-hover:scale-105 transition duration-200 mt-2">
          <img
            src="/donate-qr.png"
            alt="QR Code โดเนท"
            className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
          />
        </div>
      </div>

      {/* Donate QR Zoom Modal (Rendered to body to stay above all elements) */}
      {isModalOpen && mounted && createPortal(
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-amber-500/50 bg-[#0d121f] p-6 space-y-4 text-center shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-bold text-amber-300 flex items-center gap-1.5">
                <span>💸</span>
                <span>สนับสนุนค่าขนม</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-sm font-semibold text-white leading-relaxed">
              สนับสนุนค่าขนมได้ตามความหล่อ/สวย ของคนโดเนท ✨
            </p>

            <p className="text-xs text-slate-400">
              ลิงก์โดเนท :{' '}
              <a
                href="https://hiwdo.com/natdanai1256"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 underline hover:text-indigo-300 transition"
              >
                https://hiwdo.com/natdanai1256
              </a>
            </p>

            <div className="bg-white p-4 rounded-2xl inline-block mx-auto shadow-xl border-4 border-amber-400/70">
              <img
                src="/donate-qr.png"
                alt="QR Code โดเนท"
                className="w-60 h-60 object-contain mx-auto"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

