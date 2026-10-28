'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import NotFound from '@/app/not-found';

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

export default function QueueJoinPage() {
  const [hasId, setHasId] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qId = params.get('id') || params.get('queueId') || params.get('list');
      setHasId(!!(qId && qId.trim()));
    }
  }, []);

  if (hasId === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">กำลังตรวจสอบรหัสคิว...</p>
      </div>
    );
  }

  // หากไม่มี id ใน URL ให้แสดงหน้า Error 404 ทันที
  if (!hasId) {
    return <NotFound />;
  }

  return <MemberQueueView requireId={true} />;
}
