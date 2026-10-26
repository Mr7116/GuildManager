'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import AdminQueueView from '@/components/queue/AdminQueueView';

export default function AdminQueuePage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลระบบจัดการคิว...</p>
      </div>
    );
  }

  return <AdminQueueView />;
}
