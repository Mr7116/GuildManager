'use client';

import dynamic from 'next/dynamic';

const MemberQueueView = dynamic(
  () => import('@/components/queue/MemberQueueView'),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-4xl px-3 py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400">กำลังโหลดระบบต่อคิว...</p>
      </div>
    ),
  }
);

export default function QueuesPage() {
  return <MemberQueueView />;
}

