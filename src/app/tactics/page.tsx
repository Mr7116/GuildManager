'use client';

import dynamic from 'next/dynamic';

const TacticsContainer = dynamic(
  () => import('@/components/tactics/TacticsContainer'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400">กำลังโหลดระบบวางแผนยุทธการ...</p>
      </div>
    ),
  }
);

export default function AdminTacticsPage() {
  return <TacticsContainer mode="admin" />;
}
