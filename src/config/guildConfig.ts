/**
 * ============================================================
 * Global Guild Configuration (ตั้งค่ากิลด์หลักทั้งหมดในที่เดียว)
 * ============================================================
 * คุณสามารถเปลี่ยนชื่อกิลด์, ID และรหัสผ่านเริ่มต้นได้ที่นี่ที่เดียว
 * หรือตั้งผ่าน environment variable เช่น:
 * NEXT_PUBLIC_GUILD_ID=2
 * NEXT_PUBLIC_GUILD_NAME=TUMDOOD
 * 
 * ทุกหน้า ทุกตาราง และระบบ Realtime ทั้งหมดจะเปลี่ยนตามทันที!
 */

// 1. กำหนด ID กิลด์ (1 = Moonz, 2 = TUMDOOD)
export const GUILD_ID: number = (() => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUILD_ID) {
    const parsed = Number(process.env.NEXT_PUBLIC_GUILD_ID);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // 👈 เปลี่ยนเลข ID เริ่มต้นตรงนี้ (2 = TUMDOOD, 1 = Moonz)
  return 2;
})();

// 2. กำหนดชื่อกิลด์หลัก (Guild Name)
export const GUILD_NAME: string = (() => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUILD_NAME) {
    return process.env.NEXT_PUBLIC_GUILD_NAME;
  }
  return GUILD_ID === 2 ? 'TUMDOOD' : 'Moonz';
})();

// 3. กำหนดรหัสผ่านเริ่มต้น (Default Passcode)
export const DEFAULT_PIN: string = (() => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GUILD_PIN) {
    return process.env.NEXT_PUBLIC_GUILD_PIN;
  }
  return GUILD_ID === 2 ? 'TUMDOOD' : 'Moonz';
})();

export const DEFAULT_GUILD_ID = GUILD_ID;
