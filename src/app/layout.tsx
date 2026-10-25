import type { Metadata } from 'next';
import { Kanit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/lib/auth';
import { GuildProvider } from '@/lib/guildStore';
import { ThemeProvider } from '@/lib/theme';

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
  title: 'Moonz Tactical — ระบบจัดทัพกิลด์วอร์',
  description: 'ระบบจัดผังทัพกิลด์วอร์ ROX (GVG / Siege / Polarity / Squads)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning className={`${kanit.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('Moonz_theme');
                  var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) || !t;
                  if (t === 'light') isDark = false;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-400">
        <ThemeProvider>
          <AuthProvider>
            <GuildProvider>
              <Navbar />
              <main className="min-h-[calc(100vh-64px)] pb-12">
                {children}
              </main>
            </GuildProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
