import type { Metadata } from 'next';
import { Kanit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth';
import { GuildProvider } from '@/lib/guildStore';

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-kanit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TUMDOOD Tactical — ระบบจัดทัพกิลด์วอร์',
  description: 'ระบบจัดผังทัพกิลด์วอร์ ROX (GVG / Siege / Polarity / Squads)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={`${kanit.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-600/30 selection:text-indigo-200">
        <AuthProvider>
          <GuildProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)] pb-12">
              {children}
            </main>
          </GuildProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

