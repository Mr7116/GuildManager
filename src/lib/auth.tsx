'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PUBLIC_ROUTES = ['/login', '/public', '/leave', '/auctions'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth status on mount
  useEffect(() => {
    const session =
      localStorage.getItem('Moonz_auth_session') === 'logged_in' ||
      sessionStorage.getItem('Moonz_auth_session') === 'logged_in';

    setIsAuthenticated(session);
    setIsLoading(false);
  }, []);

  // Enforce route protection
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
    if (!isAuthenticated && !isPublic) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Login handler
  const login = async (pinInput: string, remember: boolean): Promise<boolean> => {
    const trimmed = (pinInput || '').trim();
    if (!trimmed) return false;

    // Fetch cloud PIN
    let validPin = localStorage.getItem('Moonz_guild_pin') || 'Moonz';
    try {
      const { data } = await supabase
        .from('guild_state')
        .select('parties')
        .eq('id', 1)
        .maybeSingle();

      if (data && Array.isArray(data.parties)) {
        const authEntry = data.parties.find((p: any) => p.id === '__guild_auth_config__');
        if (authEntry && authEntry.pin) {
          validPin = authEntry.pin;
          localStorage.setItem('Moonz_guild_pin', authEntry.pin);
        }
      }
    } catch (e) {
      console.warn('Could not fetch cloud PIN, using local fallback:', e);
    }

    if (trimmed.toLowerCase() === validPin.toLowerCase()) {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('Moonz_auth_session', 'logged_in');
      storage.setItem('Moonz_auth_timestamp', Date.now().toString());

      if (remember) {
        sessionStorage.removeItem('Moonz_auth_session');
      } else {
        localStorage.removeItem('Moonz_auth_session');
      }

      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    localStorage.removeItem('Moonz_auth_session');
    sessionStorage.removeItem('Moonz_auth_session');
    setIsAuthenticated(false);
    router.replace('/login');
  };

  const changePin = async (oldPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    let currentPin = localStorage.getItem('Moonz_guild_pin') || 'Moonz';
    try {
      const { data } = await supabase
        .from('guild_state')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      let latestParties = data?.parties || [];
      const authEntry = latestParties.find((p: any) => p.id === '__guild_auth_config__');
      if (authEntry?.pin) currentPin = authEntry.pin;

      if (oldPin.toLowerCase() !== currentPin.toLowerCase()) {
        return { success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' };
      }

      if (!newPin || newPin.length < 3) {
        return { success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 3 ตัวอักษร' };
      }

      const updatedAuth = {
        id: '__guild_auth_config__',
        category: '__system__',
        pin: newPin,
        updatedAt: new Date().toISOString(),
      };

      const existingIdx = latestParties.findIndex((p: any) => p.id === '__guild_auth_config__');
      if (existingIdx !== -1) {
        latestParties[existingIdx] = updatedAuth;
      } else {
        latestParties.push(updatedAuth);
      }

      await supabase.from('guild_state').upsert({
        id: 1,
        parties: latestParties,
        updated_at: new Date().toISOString(),
      });

      localStorage.setItem('Moonz_guild_pin', newPin);
      return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จแล้ว' };
    } catch (err: any) {
      localStorage.setItem('Moonz_guild_pin', newPin);
      return { success: true, message: 'บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว' };
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, changePin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

