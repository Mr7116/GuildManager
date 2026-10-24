'use client';

import React from 'react';
import { JOB_FAMILIES } from '@/constants/jobs';
import JobEmblem from './JobEmblem';

interface JobEmblemBarProps {
  selectedJob: string | null;
  onSelectJob: (jobKey: string | null) => void;
  counts?: Record<string, number>;
  totalCount?: number;
}

export default function JobEmblemBar({
  selectedJob,
  onSelectJob,
  counts = {},
  totalCount = 0,
}: JobEmblemBarProps) {
  const families = Object.values(JOB_FAMILIES);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#141822]/90 px-4 py-3 shadow-md dark:shadow-lg backdrop-blur-sm">
      {/* Bar Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>🛡️ ตราสัญลักษณ์และสถิติประจำสายอาชีพทั้ง 15 สาย (คลิกที่ไอคอนอาชีพเพื่อกรองดูเฉพาะสายนั้น)</span>
        </span>
        {selectedJob !== null && (
          <button
            type="button"
            onClick={() => onSelectJob(null)}
            className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-semibold transition flex items-center gap-1 cursor-pointer"
          >
            <span>✕</span>
            <span>แสดงทั้งหมด (รีเซ็ตตัวกรอง)</span>
          </button>
        )}
      </div>

      {/* 15 Job Families Grid / Horizontal Scroll */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {families.map((fam) => {
          const isSelected = selectedJob === fam.familyKey;
          const count = counts[fam.familyKey] ?? 0;

          return (
            <button
              key={fam.familyKey}
              type="button"
              onClick={() => onSelectJob(isSelected ? null : fam.familyKey)}
              title={`${fam.label} (${count} คน)`}
              className={`group relative flex flex-col items-center justify-center min-w-[70px] sm:min-w-[78px] px-2 py-2 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-200 dark:bg-[#363d4e] border-slate-400 dark:border-slate-500 ring-2 ring-amber-400/80 shadow-md'
                  : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-[#272c3a]'
              }`}
            >
              {/* Count badge on top right */}
              {count > 0 && (
                <span className="absolute top-1 right-1 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-950/90 text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700">
                  {count}
                </span>
              )}

              {/* Emblem Crest */}
              <div className="transform group-hover:scale-110 transition duration-200">
                <JobEmblem jobName={fam.label} size={40} />
              </div>

              {/* Job label */}
              <span
                className={`mt-1.5 text-xs font-bold tracking-tight ${
                  isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'
                }`}
              >
                {fam.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
