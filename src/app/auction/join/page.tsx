'use client';

import dynamic from 'next/dynamic';

const MemberAuctionView = dynamic(
  () => import('@/components/auction/MemberAuctionView'),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-4xl px-3 py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <p className="text-xs font-bold text-slate-400">กำลังโหลดระบบลงชื่อประมูล...</p>
      </div>
    ),
  }
);

export default function AuctionJoinPage() {
  return <MemberAuctionView />;
}
