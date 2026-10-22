
// ============================================================================
// GUILD AUTHENTICATION GUARD
// ============================================================================
(function enforceGuildAuth() {
  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (currentFile === 'login.html' || currentFile === 'public-leave.html') return;

  const isAuth = localStorage.getItem('Moonz_auth_session') === 'logged_in' ||
                 sessionStorage.getItem('Moonz_auth_session') === 'logged_in';

  if (!isAuth) {
    const rawTarget = window.location.pathname.split('/').pop() || 'index.html';
    const redirectUrl = `login.html?redirect=${encodeURIComponent(rawTarget + window.location.search)}`;
    window.location.replace(redirectUrl);
  }
})();

function logoutGuild() {
  if (typeof openCustomDialog === 'function') {
    openCustomDialog({
      title: '🔒 ยืนยันออกจากระบบ',
      message: 'คุณต้องการออกจากระบบกิลด์ใช่หรือไม่?\n(จะต้องกรอกรหัสผ่านเพื่อเข้าใช้งานใหม่อีกครั้ง)',
      confirmText: 'ออกจากระบบ',
      cancelText: 'ยกเลิก',
      onConfirm: () => {
        localStorage.removeItem('Moonz_auth_session');
        sessionStorage.removeItem('Moonz_auth_session');
        window.location.replace('login.html');
      }
    });
  } else {
    if (confirm('คุณต้องการออกจากระบบกิลด์ใช่หรือไม่?')) {
      localStorage.removeItem('Moonz_auth_session');
      sessionStorage.removeItem('Moonz_auth_session');
      window.location.replace('login.html');
    }
  }
}
window.logoutGuild = logoutGuild;

let currentGuildPin = localStorage.getItem('Moonz_guild_pin') || 'Moonz';

function openChangeGuildPasswordModal() {
  openCustomDialog({
    title: '🔑 เปลี่ยนรหัสผ่านกิลด์ (Cloud Sync)',
    message: 'กรอกรหัสผ่านกิลด์ใหม่ (เมื่อเปลี่ยนแล้ว สมาชิกทุกคนในกิลด์จะใช้รหัสนี้ร่วมกัน):',
    showInput: true,
    inputType: 'text',
    defaultInput: currentGuildPin || 'Moonz',
    confirmText: '💾 บันทึกรหัสใหม่ขึ้น Cloud',
    onConfirm: async (newPin) => {
      const cleanPin = (newPin || '').trim();
      if (!cleanPin || cleanPin.length < 3) {
        showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 3 ตัวอักษรครับ', 'danger');
        return;
      }
      currentGuildPin = cleanPin;
      localStorage.setItem('Moonz_guild_pin', cleanPin);
      await triggerAutoSaveImmediate('เปลี่ยนรหัสผ่านกิลด์');
      showToast(`✅ เปลี่ยนรหัสผ่านกิลด์เป็น "${cleanPin}" และซิงค์ขึ้น Cloud สำเร็จแล้ว!`, 'success');
    }
  });
}
window.openChangeGuildPasswordModal = openChangeGuildPasswordModal;

// Default Party Generators for Cross-Page Preset Deployments
function getDefaultPolarityParties() {
  const pTeams = [
    { id: 'star_team_1', name: '🌟 ทีมดาว 1 (Star 1)', color: 'amber' },
    { id: 'star_team_2', name: '🌟 ทีมดาว 2 (Star 2)', color: 'purple' },
    { id: 'star_team_3', name: '🌟 ทีมดาว 3 (Star 3)', color: 'cyan' },
    { id: 'star_team_4', name: '🌟 ทีมดาว 4 (Star 4)', color: 'rose' }
  ];
  const list = [];
  pTeams.forEach(t => {
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `pol_p_${t.id}_${i}`,
        name: `ตี้ ${i}`,
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        category: 'polarity',
        slots: [null, null, null, null, null]
      });
    }
  });
  return list;
}

function getDefaultSiegeParties() {
  const sTeams = [
    { id: 'siege_team_1', name: '🏰 ทัพบุกหลัก / ตีหิน (Main Breaker)', color: 'rose' },
    { id: 'siege_team_2', name: '🛡️ ทัพป้องกัน / เฝ้าหิน (Castle Defense)', color: 'blue' },
    { id: 'siege_team_3', name: '⚡ ทัพดักหน้าวาป / ตัดกำลัง (Warp Interceptor)', color: 'amber' },
    { id: 'siege_team_4', name: '🎯 ทัพเคลื่อนที่เร็ว / กองหนุน (Mobile Scout)', color: 'emerald' }
  ];
  const list = [];
  sTeams.forEach(t => {
    for (let i = 1; i <= 2; i++) {
      list.push({
        id: `siege_p_${t.id}_${i}`,
        name: `ตี้ ${i}`,
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        category: 'siege',
        slots: [null, null, null, null, null]
      });
    }
  });
  return list;
}

function getDefaultPresetParties() {
  const defaultColors = ['rose', 'blue', 'amber', 'emerald', 'purple', 'cyan', 'rose', 'blue'];
  const list = [];
  for (let i = 1; i <= 8; i++) {
    const c = defaultColors[(i - 1) % defaultColors.length];
    list.push({
      id: `preset_p_default_${i}`,
      name: `ตี้ประจำ ${i}`,
      color: c,
      category: 'preset',
      slots: [null, null, null, null, null]
    });
  }
  return list;
}

// ============================================================================
// SHARED RO GUILD MANAGER CORE (Supabase Cloud Sync, State & Common Helpers)
// ============================================================================

// Global safe stubs for page-specific functions
if (typeof window.populateClassFilterDropdown !== 'function') {
  window.populateClassFilterDropdown = function() {};
}
if (typeof window.autoAssignByGearAndRole !== 'function') {
  window.autoAssignByGearAndRole = function() {};
}
if (typeof window.updateBulkDeleteButton !== 'function') {
  window.updateBulkDeleteButton = function() {};
}

    // ============================================================================
    // 1. TEAM COLOR PALETTES (8 DISTINCT COLORS FOR TEAMS A, B, C, ETC.)
    // ============================================================================
    const TEAM_COLORS = {
      rose: {
        key: 'rose',
        name: 'แดงเพลิง',
        hexAccent: '#f43f5e',
        hexBgSoft: 'rgba(136, 19, 55, 0.28)',
        hexHeaderBg: 'rgba(136, 19, 55, 0.45)',
        dotClass: 'bg-rose-500',
        containerBorder: 'border-rose-500/50',
        containerBg: 'bg-gradient-to-b from-rose-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-rose-950/50 border-rose-500/40',
        badgeClass: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
        partyBorder: 'border-rose-500/35 hover:border-rose-400/70',
        partyHeaderBg: 'bg-rose-950/35',
        buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white'
      },
      blue: {
        key: 'blue',
        name: 'น้ำเงินคราม',
        hexAccent: '#3b82f6',
        hexBgSoft: 'rgba(30, 58, 138, 0.28)',
        hexHeaderBg: 'rgba(30, 58, 138, 0.45)',
        dotClass: 'bg-blue-500',
        containerBorder: 'border-blue-500/50',
        containerBg: 'bg-gradient-to-b from-blue-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-blue-950/50 border-blue-500/40',
        badgeClass: 'bg-blue-500/20 text-blue-200 border-blue-500/40',
        partyBorder: 'border-blue-500/35 hover:border-blue-400/70',
        partyHeaderBg: 'bg-blue-950/35',
        buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white'
      },
      emerald: {
        key: 'emerald',
        name: 'เขียวมรกต',
        hexAccent: '#10b981',
        hexBgSoft: 'rgba(6, 78, 59, 0.28)',
        hexHeaderBg: 'rgba(6, 78, 59, 0.45)',
        dotClass: 'bg-emerald-500',
        containerBorder: 'border-emerald-500/50',
        containerBg: 'bg-gradient-to-b from-emerald-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-emerald-950/50 border-emerald-500/40',
        badgeClass: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
        partyBorder: 'border-emerald-500/35 hover:border-emerald-400/70',
        partyHeaderBg: 'bg-emerald-950/35',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
      },
      amber: {
        key: 'amber',
        name: 'ทองอำพัน',
        hexAccent: '#f59e0b',
        hexBgSoft: 'rgba(120, 53, 15, 0.28)',
        hexHeaderBg: 'rgba(120, 53, 15, 0.45)',
        dotClass: 'bg-amber-500',
        containerBorder: 'border-amber-500/50',
        containerBg: 'bg-gradient-to-b from-amber-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-amber-950/50 border-amber-500/40',
        badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
        partyBorder: 'border-amber-500/35 hover:border-amber-400/70',
        partyHeaderBg: 'bg-amber-950/35',
        buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950'
      },
      purple: {
        key: 'purple',
        name: 'ม่วงอเมทิสต์',
        hexAccent: '#a855f7',
        hexBgSoft: 'rgba(88, 28, 135, 0.28)',
        hexHeaderBg: 'rgba(88, 28, 135, 0.45)',
        dotClass: 'bg-purple-500',
        containerBorder: 'border-purple-500/50',
        containerBg: 'bg-gradient-to-b from-purple-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-purple-950/50 border-purple-500/40',
        badgeClass: 'bg-purple-500/20 text-purple-200 border-purple-500/40',
        partyBorder: 'border-purple-500/35 hover:border-purple-400/70',
        partyHeaderBg: 'bg-purple-950/35',
        buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white'
      },
      pink: {
        key: 'pink',
        name: 'ชมพูบานเย็น',
        hexAccent: '#ec4899',
        hexBgSoft: 'rgba(131, 24, 67, 0.28)',
        hexHeaderBg: 'rgba(131, 24, 67, 0.45)',
        dotClass: 'bg-pink-500',
        containerBorder: 'border-pink-500/50',
        containerBg: 'bg-gradient-to-b from-pink-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-pink-950/50 border-pink-500/40',
        badgeClass: 'bg-pink-500/20 text-pink-200 border-pink-500/40',
        partyBorder: 'border-pink-500/35 hover:border-pink-400/70',
        partyHeaderBg: 'bg-pink-950/35',
        buttonClass: 'bg-pink-600 hover:bg-pink-500 text-white'
      },
      cyan: {
        key: 'cyan',
        name: 'ฟ้านีออน',
        hexAccent: '#06b6d4',
        hexBgSoft: 'rgba(22, 78, 99, 0.28)',
        hexHeaderBg: 'rgba(22, 78, 99, 0.45)',
        dotClass: 'bg-cyan-400',
        containerBorder: 'border-cyan-500/50',
        containerBg: 'bg-gradient-to-b from-cyan-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-cyan-950/50 border-cyan-500/40',
        badgeClass: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40',
        partyBorder: 'border-cyan-500/35 hover:border-cyan-400/70',
        partyHeaderBg: 'bg-cyan-950/35',
        buttonClass: 'bg-cyan-600 hover:bg-cyan-500 text-white'
      },
      orange: {
        key: 'orange',
        name: 'ส้มแสด',
        hexAccent: '#f97316',
        hexBgSoft: 'rgba(124, 45, 18, 0.28)',
        hexHeaderBg: 'rgba(124, 45, 18, 0.45)',
        dotClass: 'bg-orange-500',
        containerBorder: 'border-orange-500/50',
        containerBg: 'bg-gradient-to-b from-orange-950/30 via-slate-900/95 to-slate-900',
        headerBg: 'bg-orange-950/50 border-orange-500/40',
        badgeClass: 'bg-orange-500/20 text-orange-200 border-orange-500/40',
        partyBorder: 'border-orange-500/35 hover:border-orange-400/70',
        partyHeaderBg: 'bg-orange-950/35',
        buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white'
      }
    };

    function getTeamTheme(colorKey) {
      return TEAM_COLORS[colorKey] || TEAM_COLORS.rose;
    }

    const FIELD_ZONES = [
      {
        key: 'main',
        name: 'สนามหลัก',
        shortName: 'หลัก',
        fullName: '🏟️ สนามหลัก (Main Field)',
        subtitle: 'ทัพหลักประจำสมรภูมิหลัก',
        icon: '🏟️',
        hexAccent: '#f59e0b',
        hexBgSoft: 'rgba(120, 53, 15, 0.16)',
        hexHeaderBg: 'linear-gradient(90deg, rgba(180, 83, 9, 0.42) 0%, rgba(15, 23, 42, 0.95) 100%)',
        wrapperBorder: 'border-amber-500/60',
        wrapperBg: 'bg-gradient-to-b from-amber-950/20 via-slate-900/95 to-slate-950',
        headerClass: 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-amber-500/50',
        badgeClass: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
        pillClass: 'bg-amber-500 text-slate-950 font-bold'
      },
      {
        key: 'sub',
        name: 'สนามรอง',
        shortName: 'รอง',
        fullName: '🚩 สนามรอง (Sub Field)',
        subtitle: 'ทัพสมทบประจำสมรภูมิรอง',
        icon: '🚩',
        hexAccent: '#38bdf8',
        hexBgSoft: 'rgba(12, 74, 110, 0.16)',
        hexHeaderBg: 'linear-gradient(90deg, rgba(3, 105, 161, 0.42) 0%, rgba(15, 23, 42, 0.95) 100%)',
        wrapperBorder: 'border-sky-500/60',
        wrapperBg: 'bg-gradient-to-b from-sky-950/20 via-slate-900/95 to-slate-950',
        headerClass: 'bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-900 border-sky-500/50',
        badgeClass: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
        pillClass: 'bg-sky-400 text-slate-950 font-bold'
      }
    ];

    function getFieldZone(fieldKey) {
      return FIELD_ZONES.find(f => f.key === fieldKey) || FIELD_ZONES[0];
    }

    // ============================================================================
    // 2. ROWORLDDB 13 JOB FAMILIES & OCTAGONAL RIBBON CREST SVG
    // ============================================================================
    const JOB_FAMILIES = [
      {
        familyKey: 'knight',
        label: 'Knight',
        role: 'tank',
        hexMain: '#dc2626',
        hexDark: '#881313',
        hexBorder: '#f87171',
        namePillStyle: 'background: linear-gradient(90deg, #dc2626 0%, #991b1b 100%); border-color: #f87171; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(220,38,38,0.24) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(220,38,38,0.45);',
        jobs: ['Knight', 'Lord Knight']
      },
      {
        familyKey: 'crusader',
        label: 'Crusader',
        role: 'tank',
        hexMain: '#9f1d20',
        hexDark: '#5f0f12',
        hexBorder: '#fb7185',
        namePillStyle: 'background: linear-gradient(90deg, #9f1d20 0%, #6b1114 100%); border-color: #fb7185; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(159,29,32,0.28) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(185,28,28,0.45);',
        jobs: ['Crusader', 'Paladin']
      },
      {
        familyKey: 'wizard',
        label: 'Wizard',
        role: 'dps',
        hexMain: '#1d5bd6',
        hexDark: '#133785',
        hexBorder: '#60a5fa',
        namePillStyle: 'background: linear-gradient(90deg, #1d5bd6 0%, #173b8f 100%); border-color: #60a5fa; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(29,91,214,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(37,99,235,0.45);',
        jobs: ['Wizard', 'High Wizard']
      },
      {
        familyKey: 'sage',
        label: 'Sage',
        sub: 'Professor',
        role: 'dps',
        hexMain: '#1e6be6',
        hexDark: '#103c8f',
        hexBorder: '#7dd3fc',
        namePillStyle: 'background: linear-gradient(90deg, #1e6be6 0%, #12439e 100%); border-color: #7dd3fc; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(30,107,230,0.26) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(56,189,248,0.48);',
        jobs: ['Sage', 'Professor', 'Scholar', 'เซจ']
      },
      {
        familyKey: 'hunter',
        label: 'Hunter',
        role: 'dps',
        hexMain: '#c67a2b',
        hexDark: '#7c4711',
        hexBorder: '#fbbf24',
        namePillStyle: 'background: linear-gradient(90deg, #c67a2b 0%, #8c5116 100%); border-color: #fbbf24; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(198,122,43,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(198,122,43,0.45);',
        jobs: ['Hunter', 'Sniper']
      },
      {
        familyKey: 'bard',
        label: 'Bard',
        role: 'bard',
        hexMain: '#b86f24',
        hexDark: '#73410e',
        hexBorder: '#f59e0b',
        namePillStyle: 'background: linear-gradient(90deg, #b86f24 0%, #7d4812 100%); border-color: #f59e0b; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(184,111,36,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(184,111,36,0.45);',
        jobs: ['Bard', 'Clown']
      },
      {
        familyKey: 'dancer',
        label: 'Dancer',
        role: 'bard',
        hexMain: '#c46d25',
        hexDark: '#7c3f0e',
        hexBorder: '#fb923c',
        namePillStyle: 'background: linear-gradient(90deg, #c46d25 0%, #874612 100%); border-color: #fb923c; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(196,109,37,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(196,109,37,0.45);',
        jobs: ['Dancer', 'Gypsy']
      },
      {
        familyKey: 'priest',
        label: 'Priest',
        role: 'healer',
        hexMain: '#218332',
        hexDark: '#124c1d',
        hexBorder: '#4ade80',
        namePillStyle: 'background: linear-gradient(90deg, #218332 0%, #145320 100%); border-color: #4ade80; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(33,131,50,0.26) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(33,131,50,0.48);',
        jobs: ['Priest', 'High Priest']
      },
      {
        familyKey: 'monk',
        label: 'Monk',
        role: 'dps',
        hexMain: '#288d36',
        hexDark: '#15521e',
        hexBorder: '#86efac',
        namePillStyle: 'background: linear-gradient(90deg, #288d36 0%, #175921 100%); border-color: #86efac; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(40,141,54,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(40,141,54,0.45);',
        jobs: ['Monk', 'Champion']
      },
      {
        familyKey: 'assassin',
        label: 'Assassin',
        sub: 'Assassin Cross',
        role: 'dps',
        hexMain: '#6b2fb5',
        hexDark: '#3f1770',
        hexBorder: '#c084fc',
        namePillStyle: 'background: linear-gradient(90deg, #6b2fb5 0%, #441a7a 100%); border-color: #c084fc; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(107,47,181,0.26) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(107,47,181,0.48);',
        jobs: ['Assassin', 'Assassin Cross']
      },
      {
        familyKey: 'rogue',
        label: 'Rogue',
        sub: 'Stalker',
        role: 'dps',
        hexMain: '#7c3aed',
        hexDark: '#4c1d95',
        hexBorder: '#d8b4fe',
        namePillStyle: 'background: linear-gradient(90deg, #7c3aed 0%, #5b21b6 100%); border-color: #d8b4fe; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(124,58,237,0.26) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(168,85,247,0.48);',
        jobs: ['Rogue', 'Stalker', 'โร้ก']
      },
      {
        familyKey: 'blacksmith',
        label: 'Blacksmith',
        role: 'dps',
        hexMain: '#ad4f22',
        hexDark: '#692b0e',
        hexBorder: '#fdba74',
        namePillStyle: 'background: linear-gradient(90deg, #ad4f22 0%, #733112 100%); border-color: #fdba74; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(173,79,34,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(173,79,34,0.45);',
        jobs: ['Blacksmith', 'Whitesmith']
      },
      {
        familyKey: 'alchemist',
        label: 'Alchemist',
        role: 'dps',
        hexMain: '#a65422',
        hexDark: '#632e0e',
        hexBorder: '#fcd34d',
        namePillStyle: 'background: linear-gradient(90deg, #a65422 0%, #6e3512 100%); border-color: #fcd34d; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(166,84,34,0.25) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(166,84,34,0.45);',
        jobs: ['Alchemist', 'Creator']
      },
      {
        familyKey: 'rebel',
        label: 'Rebel',
        sub: 'Night Walker',
        role: 'dps',
        hexMain: '#6c352c',
        hexDark: '#421d17',
        hexBorder: '#fca5a5',
        namePillStyle: 'background: linear-gradient(90deg, #6c352c 0%, #47201a 100%); border-color: #fca5a5; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(108,53,44,0.28) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(108,53,44,0.50);',
        jobs: ['Rebel', 'Night Walker', 'Gunslinger']
      },
      {
        familyKey: 'kanos',
        label: 'คานอส',
        role: 'dps',
        hexMain: '#296e67',
        hexDark: '#16403b',
        hexBorder: '#5eead4',
        namePillStyle: 'background: linear-gradient(90deg, #296e67 0%, #194742 100%); border-color: #5eead4; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(41,110,103,0.28) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(41,110,103,0.50);',
        jobs: ['คานอส', 'อาลิเทีย', 'Kanos', 'Alithea']
      }
    ];

    const JOB_LOOKUP = {};
    JOB_FAMILIES.forEach(fam => {
      fam.jobs.forEach(jName => {
        JOB_LOOKUP[jName.toLowerCase()] = fam;
      });
    });

    function getJobFamily(jobName) {
      const key = (jobName || '').trim().toLowerCase();
      if (JOB_LOOKUP[key]) return JOB_LOOKUP[key];
      for (const fam of JOB_FAMILIES) {
        if (fam.jobs.some(j => key.includes(j.toLowerCase()))) return fam;
      }
      return {
        familyKey: 'novice',
        label: jobName || 'Novice',
        role: 'dps',
        hexMain: '#475569',
        hexDark: '#1e293b',
        hexBorder: '#94a3b8',
        namePillStyle: 'background: linear-gradient(90deg, #475569 0%, #1e293b 100%); border-color: #94a3b8; color: #ffffff;',
        cardTintStyle: 'background: linear-gradient(90deg, rgba(71,85,105,0.20) 0%, rgba(15,23,42,0.95) 85%); border-color: rgba(71,85,105,0.40);',
        jobs: ['Novice']
      };
    }

    function getJobInnerSymbolSVG(familyKey) {
      switch (familyKey) {
        case 'knight':
          return '<path d="M19 45 L44 20 M40 18 L46 18 L46 24" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M23 35 L29 41 M18 46 L22 42" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/><path d="M45 45 L20 20 M24 18 L18 18 L18 24" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M41 35 L35 41 M46 46 L42 42" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>';
        case 'crusader':
          return '<path d="M32 16 L45 21 V32 C45 40.5 39 46.5 32 49 C25 46.5 19 40.5 19 32 V21 L32 16 Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 22 V42 M24 29 H40" stroke="#ffffff" stroke-width="3.6" stroke-linecap="round"/>';
        case 'wizard':
          return '<path d="M24 46 L37 29" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 28 C30 21 36 16 42 19 C47 22 45 30 39 31 C36 31.5 35 28 37 26" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" fill="none"/><circle cx="39" cy="24" r="2.6" fill="#ffffff"/>';
        case 'sage':
          return '<path d="M32 33 C28 28 29 21 34 16 C33 21 38 22 37 28 C39 26 40 23 39 20 C42 24 41 31 35 34 Z" fill="#ffffff"/><path d="M18 33 C23 33 28 35 32 39 C36 35 41 33 46 33 V43 C41 43 36 45 32 49 C28 45 23 43 18 43 Z" fill="rgba(255,255,255,0.2)" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="round"/><path d="M21 29 C25 29 29 31 32 35 C35 31 39 29 43 29" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" fill="none"/><line x1="32" y1="38" x2="32" y2="48" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>';
        case 'hunter':
          return '<path d="M24 18 C38 21 41 41 24 46" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/><line x1="24" y1="19" x2="24" y2="45" stroke="#ffffff" stroke-width="2" stroke-opacity="0.85"/><path d="M19 32 H45 M39 26 L46 32 L39 38" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
        case 'bard':
          return '<path d="M22 20 C22 34 25 44 33 44 C41 44 43 34 42 22" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" fill="none"/><path d="M20 20 H44" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/><line x1="29" y1="22" x2="29" y2="42" stroke="#ffffff" stroke-width="2.2"/><line x1="35" y1="22" x2="35" y2="42" stroke="#ffffff" stroke-width="2.2"/>';
        case 'dancer':
          return '<path d="M22 45 L29 36" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/><path d="M29 36 C38 35 45 27 41 20 C37 15 27 19 29 26 C31 32 42 33 45 41" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" fill="none"/><circle cx="21" cy="45" r="2.5" fill="#ffffff"/>';
        case 'priest':
          return '<path d="M32 16 V48 M18 30 H46" stroke="#ffffff" stroke-width="4.4" stroke-linecap="round"/><circle cx="32" cy="30" r="5" fill="#218332" stroke="#ffffff" stroke-width="2.6"/><path d="M29 18 H35 M29 46 H35 M20 27 V33 M44 27 V33" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>';
        case 'monk':
          return '<path d="M22 29 C22 23 26 20 32 20 C38 20 42 23 42 29 V37 C42 42 38 45 32 45 C26 45 22 42 22 37 Z" fill="#ffffff"/><path d="M32 26 L33.8 30.2 L38 32 L33.8 33.8 L32 38 L30.2 33.8 L26 32 L30.2 30.2 Z" fill="#288d36"/>';
        case 'assassin':
          return '<path d="M32 16 L42 37 L32 33 L22 37 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/><path d="M21 41 H43 M25 45 H39" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round"/>';
        case 'rogue':
          return '<path d="M22 19 C21 29 25 37 31 39 L30 35 L35 37 L38 33 C31 30 26 25 22 19 Z" fill="#ffffff" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/><path d="M34 41 L40 31" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M37 37 L43 41 C44.5 42 44.5 44 43 45 C41.5 46 39.5 45 38.5 43.5 L35.5 39" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>';
        case 'blacksmith':
          return '<line x1="32" y1="17" x2="32" y2="47" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 22 C24 18 18 22 18 28 C18 34 24 38 32 34 Z" fill="#ffffff"/><path d="M32 22 C40 18 46 22 46 28 C46 34 40 38 32 34 Z" fill="#ffffff"/>';
        case 'alchemist':
          return '<path d="M28 18 H36 M30 18 V26 L21 41 C19.5 43.5 21.5 46 24.5 46 H39.5 C42.5 46 44.5 43.5 43 41 L34 26 V18" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M24 38 H40 L42 42 H22 Z" fill="#ffffff"/>';
        case 'rebel':
          return '<path d="M19 25 H43 V31 H32 L29 43 H22 L25 31 H19 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="31" cy="28" r="2.4" fill="#6c352c"/>';
        case 'kanos':
          return '<path d="M32 46 V26" stroke="#ffffff" stroke-width="3.8" stroke-linecap="round"/><path d="M32 34 C25 34 21 29 22 24 C23 19 28 17 32 21 C36 17 41 19 42 24 C43 29 39 34 32 34 Z" fill="none" stroke="#ffffff" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 46 H39" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>';
        default:
          return '<circle cx="32" cy="32" r="9" fill="#ffffff"/>';
      }
    }

    function renderJobEmblem(jobName, sizePx = 30) {
      const fam = getJobFamily(jobName);
      const innerSvg = getJobInnerSymbolSVG(fam.familyKey);
      return `<svg width="${sizePx}" height="${sizePx}" style="width:${sizePx}px;height:${sizePx}px;min-width:${sizePx}px;" viewBox="0 0 64 64" class="shrink-0 drop-shadow" xmlns="http://www.w3.org/2000/svg"><rect x="11" y="11" width="42" height="42" rx="6" transform="rotate(22.5 32 32)" fill="${fam.hexDark}" stroke="rgba(255,255,255,0.75)" stroke-width="2"/><rect x="11" y="11" width="42" height="42" rx="6" transform="rotate(67.5 32 32)" fill="${fam.hexMain}" stroke="rgba(255,255,255,0.9)" stroke-width="2"/><polygon points="24,9 40,9 55,24 55,40 40,55 24,55 9,40 9,24" fill="${fam.hexMain}" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"/><polygon points="26,14 38,14 50,26 50,38 38,50 26,50 14,38 14,26" fill="${fam.hexDark}" stroke="rgba(255,255,255,0.45)" stroke-width="1.3" stroke-linejoin="round"/>${innerSvg}</svg>`;
    }

    function renderColoredMemberName(member, extraClasses = '') {
      const fam = getJobFamily(member.job);
      const strikeClass = member.status === 'leave' ? 'line-through opacity-75' : '';
      return `<span style="${fam.namePillStyle}" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border font-semibold text-xs shadow-sm ${strikeClass} ${extraClasses}"><span class="truncate">${member.name}</span></span>`;
    }

    function getJobMeta(job) {
      const fam = getJobFamily(job);
      return {
        role: fam.role,
        familyKey: fam.familyKey,
        label: fam.label,
        hexMain: fam.hexMain,
        hexDark: fam.hexDark,
        hexBorder: fam.hexBorder,
        namePillStyle: fam.namePillStyle,
        cardTintStyle: fam.cardTintStyle,
        badgeStyle: `background-color: ${fam.hexDark}; border-color: ${fam.hexBorder}; color: #ffffff;`
      };
    }

    // ============================================================================
    // 3. APPLICATION STATE & DAILY LEAVE DATE MANAGEMENT
    // ============================================================================
    function getLocalDateISO(dateObj = new Date()) {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    function formatThaiDateFull(isoDateStr) {
      if (!isoDateStr) return '';
      const [y, m, d] = isoDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatThaiDateShort(isoDateStr) {
      if (!isoDateStr) return '';
      const [y, m, d] = isoDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    }

    function getDayNameShort(isoDateStr) {
      const [y, m, d] = isoDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('th-TH', { weekday: 'short' });
    }

    let guildName = "Moonz";
    let fileTimestamp = "ยังไม่มีข้อมูล";
    let selectedDate = getLocalDateISO(); // Active date in YYYY-MM-DD
    let activeLeaveSubView = 'dailyList';
    let members = [];
    let teams = [];
    let parties = [];
    let rawPolarityParties = [];
    let rawSiegeParties = [];
    let rawPresetParties = [];
    let currentTeamFilter = 'all';
    let activeJobBarFamily = 'all';
    let selectedSource = null;
    let selectedMemberIds = new Set();

    // Ensure every member has a valid `leaveHistory` object without overwriting cancellations
    function ensureLeaveHistoryObject(m) {
      if (!m.leaveHistory || typeof m.leaveHistory !== 'object' || Array.isArray(m.leaveHistory)) {
        m.leaveHistory = {};
      }
    }

    // One-time migration for legacy data loaded from Cloud/CSV that had status='leave' but no leaveHistory
    function migrateLegacyLeaveOnce(m) {
      ensureLeaveHistoryObject(m);
      if (!m._leaveMigrated) {
        if (m.status === 'leave' && Object.keys(m.leaveHistory).length === 0) {
          m.leaveHistory[selectedDate] = {
            status: 'leave',
            type: m.leaveType || 'ลากิลด์วอร์ GVG',
            reason: m.leaveReason || 'ติดธุระส่วนตัว',
            updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
          };
        }
        m._leaveMigrated = true;
      }
    }

    // Strictly derive `m.status`, `m.leaveReason`, `m.leaveType` ONE-WAY from `m.leaveHistory[selectedDate]`
    function syncMembersStatusForSelectedDate() {
      members.forEach(m => {
        ensureLeaveHistoryObject(m);
        const rec = m.leaveHistory[selectedDate];
        if (rec && rec.status !== 'ready') {
          m.status = 'leave';
          m.leaveType = rec.type || 'ลากิลด์วอร์ GVG';
          m.leaveReason = rec.reason || 'ติดธุระส่วนตัว';
        } else {
          m.status = 'ready';
          m.leaveType = '';
          m.leaveReason = '';
        }
      });
    }

    function changeSelectedDate(newDateStr) {
      if (!newDateStr) return;
      selectedDate = newDateStr;
      const headerInput = document.getElementById('headerDateInput');
      const leaveInput = document.getElementById('leaveDatePicker');
      const startInput = document.getElementById('leaveFormStartDate');
      const endInput = document.getElementById('leaveFormEndDate');
      if (headerInput) headerInput.value = selectedDate;
      if (leaveInput) leaveInput.value = selectedDate;
      if (startInput) startInput.value = selectedDate;
      if (endInput) endInput.value = selectedDate;

      syncMembersStatusForSelectedDate();
      renderAll();
    }

    function shiftSelectedDate(deltaDays) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + deltaDays);
      changeSelectedDate(getLocalDateISO(dt));
    }

    function setSelectedDateToToday() {
      changeSelectedDate(getLocalDateISO(new Date()));
      showToast(`📅 สลับไปยังข้อมูลวันนี้ (${formatThaiDateFull(selectedDate)})`, 'info');
    }

    function showToast(msg, type = 'info') {
      const container = document.getElementById('toastContainer');
      const el = document.createElement('div');
      const colorClass = type === 'danger'
        ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
        : (type === 'success' ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200' : 'bg-slate-900/95 border-indigo-500/50 text-slate-100');
      el.className = `px-4 py-2.5 rounded-xl border shadow-xl text-xs sm:text-sm font-medium transition-all duration-300 ${colorClass}`;
      el.textContent = msg;
      container.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
      }, 2800);
    }

    // Custom Dialog Helper (replaces alert, confirm, prompt)
    function openCustomDialog({ title, message, showCustomHtml = false, customHtml = '', showInput = false, inputType = 'text', defaultInput = '', showColorPicker = false, defaultColor = 'rose', showFieldPicker = false, defaultField = 'main', confirmText = 'ตกลง', cancelText = 'ยกเลิก', hideCancel = false, onConfirm, onCancel = null }) {
      const modal = document.getElementById('customDialogModal');
      document.getElementById('dialogTitle').textContent = title || 'แจ้งเตือน';
      document.getElementById('dialogMessage').textContent = message || '';

      const customWrap = document.getElementById('dialogCustomHtmlWrapper');
      if (customWrap) {
        if (showCustomHtml) {
          customWrap.classList.remove('hidden');
          customWrap.innerHTML = customHtml || '';
        } else {
          customWrap.classList.add('hidden');
          customWrap.innerHTML = '';
        }
      }

      const inputWrap = document.getElementById('dialogInputWrapper');
      const inputEl = document.getElementById('dialogInput');
      if (showInput) {
        inputWrap.classList.remove('hidden');
        inputEl.type = inputType;
        inputEl.value = defaultInput;
        setTimeout(() => inputEl.focus(), 60);
      } else {
        inputWrap.classList.add('hidden');
      }

      let pickedField = defaultField || 'main';
      const fieldWrap = document.getElementById('dialogFieldPickerWrapper');
      const fieldOptionsEl = document.getElementById('dialogFieldOptions');
      if (showFieldPicker && fieldWrap && fieldOptionsEl) {
        fieldWrap.classList.remove('hidden');
        const renderFieldBtns = () => {
          fieldOptionsEl.innerHTML = FIELD_ZONES.map(fz => `
            <button type="button" data-field="${fz.key}" class="dialog-field-btn flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${pickedField === fz.key ? 'border-amber-400 bg-indigo-950/80 text-white ring-2 ring-amber-400/60 shadow' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'}">
              <span>${fz.icon}</span>
              <span>${fz.name}</span>
            </button>
          `).join('');
          fieldOptionsEl.querySelectorAll('.dialog-field-btn').forEach(btn => {
            btn.onclick = () => {
              pickedField = btn.getAttribute('data-field');
              renderFieldBtns();
            };
          });
        };
        renderFieldBtns();
      } else if (fieldWrap) {
        fieldWrap.classList.add('hidden');
      }

      let pickedColor = defaultColor;
      const colorWrap = document.getElementById('dialogColorPickerWrapper');
      const colorOptionsEl = document.getElementById('dialogColorOptions');
      if (showColorPicker) {
        colorWrap.classList.remove('hidden');
        const renderPickerDots = () => {
          colorOptionsEl.innerHTML = Object.values(TEAM_COLORS).map(c => `
            <button type="button" data-color="${c.key}" class="dialog-color-btn flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${pickedColor === c.key ? 'border-white bg-slate-800 text-white ring-2 ring-indigo-400' : 'border-slate-700 bg-slate-950 text-slate-400 hover:text-white'}">
              <span class="w-3 h-3 rounded-full ${c.dotClass}"></span>
              <span>${c.name}</span>
            </button>
          `).join('');
          colorOptionsEl.querySelectorAll('.dialog-color-btn').forEach(btn => {
            btn.onclick = () => {
              pickedColor = btn.getAttribute('data-color');
              renderPickerDots();
            };
          });
        };
        renderPickerDots();
      } else {
        colorWrap.classList.add('hidden');
      }

      const cancelBtn = document.getElementById('dialogCancelBtn');
      cancelBtn.textContent = cancelText;
      cancelBtn.classList.toggle('hidden', hideCancel);
      cancelBtn.onclick = () => {
        closeCustomDialog();
        if (typeof onCancel === 'function') onCancel();
      };

      const confirmBtn = document.getElementById('dialogConfirmBtn');
      confirmBtn.textContent = confirmText;
      confirmBtn.onclick = () => {
        const val = inputEl.value;
        closeCustomDialog();
        if (onConfirm) onConfirm(val, pickedColor, pickedField);
      };

      inputEl.onkeydown = (e) => {
        if (e.key === 'Enter') confirmBtn.click();
      };

      modal.classList.remove('hidden');
    }

    function closeCustomDialog() {
      document.getElementById('customDialogModal').classList.add('hidden');
    }

    // Initialize Default Teams: สนามหลัก (ทีม A) & สนามรอง (ทีม B, ทีม C) สามารถสลับสนามได้อิสระ
    function initDefaultTeamsAndParties() {
      teams = [
        { id: 'team_a', name: 'ทีม A', color: 'rose', field: 'main' },
        { id: 'team_b', name: 'ทีม B', color: 'blue', field: 'sub' },
        { id: 'team_c', name: 'ทีม C', color: 'emerald', field: 'sub' }
      ];
      parties = [];
      teams.forEach(t => {
        for (let i = 1; i <= 4; i++) {
          parties.push({
            id: `${t.id}_p${i}_${Math.random().toString(36).slice(2, 6)}`,
            name: `ปาร์ตี้ ${i}`,
            teamId: t.id,
            teamName: t.name,
            teamColor: t.color,
            teamField: t.field,
            raid: t.field,
            slots: [null, null, null, null, null]
          });
        }
      });
    }

    function syncTeamMetadataToParties() {
      teams.forEach(t => {
        if (!t.field || (t.field !== 'main' && t.field !== 'sub')) {
          t.field = t.id === 'team_a' ? 'main' : 'sub';
        }
      });
      parties.forEach(p => {
        let team = teams.find(t => t.id === p.teamId);
        if (!team) {
          team = teams[0] || { id: 'team_a', name: 'ทีม A', color: 'rose', field: 'main' };
          if (!teams.length) teams.push(team);
          p.teamId = team.id;
        }
        p.teamName = team.name;
        p.teamColor = team.color;
        p.teamField = team.field;
        p.raid = team.field;
      });
    }

    function rebuildTeamsFromLoadedParties(loadedParties) {
      if (!Array.isArray(loadedParties) || loadedParties.length === 0) {
        initDefaultTeamsAndParties();
        return;
      }

      const hasTeamMetadata = loadedParties.some(p => p.teamId && p.teamName);
      if (hasTeamMetadata) {
        const teamMap = new Map();
        loadedParties.forEach(p => {
          if (!teamMap.has(p.teamId)) {
            const rawField = p.teamField || p.raid || (p.teamId === 'team_a' ? 'main' : 'sub');
            teamMap.set(p.teamId, {
              id: p.teamId,
              name: p.teamName || 'ทีม A',
              color: p.teamColor || 'rose',
              field: (rawField === 'main' || rawField === 'sub') ? rawField : 'main'
            });
          }
        });
        teams = Array.from(teamMap.values());
        parties = loadedParties.map(p => ({
          ...p,
          slots: Array.isArray(p.slots) ? p.slots : [null, null, null, null, null]
        }));
      } else {
        teams = [
          { id: 'team_a', name: 'ทีม A', color: 'rose', field: 'main' },
          { id: 'team_b', name: 'ทีม B', color: 'blue', field: 'sub' },
          { id: 'team_c', name: 'ทีม C', color: 'emerald', field: 'sub' }
        ];
        parties = loadedParties.map((p, idx) => {
          const teamIdx = Math.min(Math.floor(idx / 3), teams.length - 1);
          const assignedTeam = teams[teamIdx];
          const partyNumInTeam = (idx % 3) + 1;
          return {
            id: p.id || `p_${idx}`,
            name: p.name || `ปาร์ตี้ ${partyNumInTeam}`,
            teamId: assignedTeam.id,
            teamName: assignedTeam.name,
            teamColor: assignedTeam.color,
            teamField: assignedTeam.field,
            raid: assignedTeam.field,
            slots: Array.isArray(p.slots) ? p.slots : [null, null, null, null, null]
          };
        });
      }
      syncTeamMetadataToParties();
    }

    function getDatesBetween(startIso, endIso) {
      const dates = [];
      const [sy, sm, sd] = startIso.split('-').map(Number);
      const [ey, em, ed] = endIso.split('-').map(Number);
      const cur = new Date(sy, sm - 1, sd);
      const last = new Date(ey, em - 1, ed);
      if (last < cur) return [startIso];

      let safety = 0;
      while (cur <= last && safety < 60) {
        dates.push(getLocalDateISO(cur));
        cur.setDate(cur.getDate() + 1);
        safety++;
      }
      return dates;
    }

// Member Add/Import/Export Modal & Logic
    // ============================================================================
    // 8. MEMBER MANUAL ADD, DELETE & CSV IMPORT/EXPORT
    // ============================================================================
    function openAddMemberModal() {
      document.getElementById('newMemName').value = '';
      document.getElementById('addMemberModal').classList.remove('hidden');
      setTimeout(() => document.getElementById('newMemName').focus(), 50);
    }

    function closeAddMemberModal() {
      document.getElementById('addMemberModal').classList.add('hidden');
    }


    function openEditMemberModal(memberId) {
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      const jobList = [
        'Lord Knight', 'Knight', 'Paladin', 'Crusader',
        'High Wizard', 'Wizard', 'Professor', 'Scholar', 'Sage',
        'Sniper', 'Hunter', 'Clown', 'Bard', 'Gypsy', 'Dancer',
        'High Priest', 'Priest', 'Champion', 'Monk',
        'Assassin Cross', 'Assassin', 'Stalker', 'Rogue',
        'Whitesmith', 'Blacksmith', 'Creator', 'Alchemist',
        'Night Walker', 'Rebel', 'Gunslinger', 'คานอส', 'อาลิเทีย', 'Novice'
      ];
      const jobOptions = jobList.map(j => `<option value="${j}" ${m.job === j ? 'selected' : ''}>${j}</option>`).join('');

      const formHtml = `
        <div class="space-y-3 text-xs sm:text-sm text-left">
          <div>
            <label class="block text-slate-400 mb-1">ชื่อตัวละคร *</label>
            <input type="text" id="editMemName" value="${m.name}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-semibold">
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">สายอาชีพ</label>
              <select id="editMemJob" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                ${jobOptions}
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1">เลเวล (Lv.)</label>
              <input type="number" id="editMemLv" value="${m.lv || 90}" min="1" max="150" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-slate-400 mb-1">คะแนน Gear</label>
              <input type="number" id="editMemGear" value="${m.gear || 0}" step="500" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
            <div>
              <label class="block text-slate-400 mb-1">ตำแหน่งในกิลด์</label>
              <input type="text" id="editMemPos" value="${m.position || 'สมาชิก'}" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
            </div>
          </div>
        </div>
      `;

      openCustomDialog({
        title: `✏️ แก้ไขข้อมูลสมาชิก: ${m.name}`,
        message: 'ปรับแต่งข้อมูลสมาชิกและระบบจะบันทึกขึ้น Cloud ให้ทันทีอัตโนมัติ:',
        showCustomHtml: true,
        customHtml: formHtml,
        confirmText: '💾 บันทึกการแก้ไข',
        onConfirm: async () => {
          const newName = (document.getElementById('editMemName')?.value || '').trim();
          if (!newName) {
            showToast('ชื่อตัวละครต้องไม่เว้นว่างครับ', 'danger');
            return;
          }
          m.name = newName;
          m.job = document.getElementById('editMemJob')?.value || m.job;
          m.lv = parseInt(document.getElementById('editMemLv')?.value, 10) || m.lv;
          m.gear = parseInt(document.getElementById('editMemGear')?.value, 10) || m.gear;
          m.position = (document.getElementById('editMemPos')?.value || '').trim() || m.position;

          populateClassFilterDropdown();
          renderAll();
          showToast(`✏️ อัปเดตข้อมูลของ "${m.name}" และบันทึก Cloud อัตโนมัติเรียบร้อย`, 'success');
          await triggerAutoSaveImmediate(`แก้ไขข้อมูล: ${m.name}`);
        }
      });
    }
    window.openEditMemberModal = openEditMemberModal;

    async function confirmAddMember() {
      const name = document.getElementById('newMemName').value.trim();
      if (!name) {
        showToast('กรุณากรอกชื่อตัวละครก่อนบันทึกครับ', 'danger');
        return;
      }
      const job = document.getElementById('newMemJob').value;
      const lv = parseInt(document.getElementById('newMemLv').value, 10) || 90;
      const gear = parseInt(document.getElementById('newMemGear').value, 10) || 30000;
      const pos = document.getElementById('newMemPos').value.trim() || 'สมาชิก';
      const nextCsvId = members.length ? Math.max(...members.map(m => m.csvId || 0)) + 1 : 1;

      const newMem = {
        id: 'm_custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        csvId: nextCsvId,
        name,
        lv,
        job,
        title: '-',
        gender: '-',
        position: pos,
        gear,
        weeklyActivity: 0,
        weeklyContrib: 0,
        totalContrib: 0,
        onlineStatus: '[ออนไลน์]',
        status: 'ready',
        leaveReason: '',
        leaveHistory: {}
      };

      if (teams.length === 0 || parties.length === 0) initDefaultTeamsAndParties();
      members.unshift(newMem);
      fileTimestamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      closeAddMemberModal();
      populateClassFilterDropdown();
      renderAll();
      showToast(`➕ เพิ่มสมาชิก "${name}" (${job}) แล้ว`, 'success');
      await triggerAutoSaveImmediate(`เพิ่มสมาชิก: ${name}`);
    }

    function deleteMember(memberId) {
      const idx = members.findIndex(m => m.id === memberId);
      if (idx === -1) return;
      const target = members[idx];
      openCustomDialog({
        title: '🗑️ ยืนยันการลบสมาชิก',
        message: `ต้องการลบ "${target.name}" (${target.job} • Gear ${target.gear.toLocaleString()}) ออกจากรายชื่อกิลด์ใช่หรือไม่?`,
        confirmText: 'ลบสมาชิก',
        onConfirm: async () => {
          parties.forEach(p => {
            const sIdx = p.slots.indexOf(memberId);
            if (sIdx !== -1) p.slots[sIdx] = null;
          });
          if (selectedSource && selectedSource.memberId === memberId) selectedSource = null;
          selectedMemberIds.delete(memberId);
          members.splice(idx, 1);
          populateClassFilterDropdown();
          renderAll();
          showToast(`🗑️ ลบสมาชิก "${target.name}" ออกจากกิลด์แล้ว`, 'danger');
          await triggerAutoSaveImmediate(`ลบสมาชิก: ${target.name}`);
        }
      });
    }

    function clearAllGuildData() {
      openCustomDialog({
        title: '🗑️ ล้างข้อมูลบนหน้าจอทั้งหมด',
        message: 'ต้องการล้างรายชื่อสมาชิกและรีเซ็ตทีม A, B, C ใหม่ทั้งหมดใช่หรือไม่?',
        confirmText: 'ล้างข้อมูล',
        onConfirm: async () => {
          members = [];
          selectedMemberIds.clear();
          selectedSource = null;
          fileTimestamp = 'ล้างข้อมูลแล้ว';
          initDefaultTeamsAndParties();
          populateClassFilterDropdown();
          renderAll();
          showToast('🗑️ ล้างรายชื่อสมาชิกและรีเซ็ตปาร์ตี้ทั้งหมดแล้ว', 'danger');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate('ล้างข้อมูลและรีเซ็ตทีมทั้งหมด');
          }
        }
      });
    }

    function parseCSVText(text) {
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return [];
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 4) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] !== undefined ? cols[idx] : ''; });
        rows.push(obj);
      }
      return rows;
    }

    function handleCSVUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const baseName = file.name.replace(/\.csv$/i, '');
      const parts = baseName.split('_');
      if (parts.length >= 2) {
        guildName = guildName;
        if (parts[1].length === 8) {
          const y = parts[1].slice(0, 4), m = parts[1].slice(4, 6), d = parts[1].slice(6, 8);
          const timePart = parts[2] && parts[2].length === 4 ? ` ${parts[2].slice(0, 2)}:${parts[2].slice(2, 4)}` : '';
          fileTimestamp = `${d}/${m}/${y}${timePart}`;
        }
      } else {
        fileTimestamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        const rows = parseCSVText(e.target.result);
        if (!rows.length) {
          showToast('ไม่สามารถอ่านข้อมูลจากไฟล์ CSV ได้ กรุณาตรวจสอบไฟล์', 'danger');
          event.target.value = '';
          return;
        }

        const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
        const importedMembers = rows.map((r, idx) => {
          const onlineStr = (r['สถานะออนไลน์'] || '[ออนไลน์]').trim();
          const isLongOffline = ['ออฟไลน์ 4 วัน', 'ออฟไลน์ 5 วัน', 'ออฟไลน์ 6 วัน', 'ออฟไลน์เกิน 7 วัน'].includes(onlineStr);
          const leaveHist = {};
          if (isLongOffline) {
            leaveHist[selectedDate] = {
              type: 'ลาทั้งวัน (ไม่เข้าเกม)',
              reason: onlineStr,
              updatedAt: nowStamp
            };
          }
          return {
            id: 'm_csv_' + Date.now() + '_' + (r['ID'] || (idx + 1)),
            csvId: parseInt(r['ID'] || (idx + 1), 10),
            name: (r['ชื่อผู้เล่น'] || 'Unknown').trim(),
            lv: parseInt(r['Lv.'] || '1', 10) || 1,
            job: (r['คลาส'] || 'Novice').trim(),
            title: (r['Title'] || '-').trim(),
            gender: (r['เพศ'] || '-').trim(),
            position: (r['ตำแหน่ง'] || 'สมาชิก').trim(),
            gear: parseInt(r['คะแนน Gear'] || '0', 10) || 0,
            weeklyActivity: parseInt(r['กิจกรรมสัปดาห์นี้'] || '0', 10) || 0,
            weeklyContrib: parseInt(r['แต้มสนับสนุนสัปดาห์นี้'] || '0', 10) || 0,
            totalContrib: parseInt(r['แต้มสนับสนุนสะสม'] || '0', 10) || 0,
            onlineStatus: onlineStr,
            status: isLongOffline ? 'leave' : 'ready',
            leaveReason: isLongOffline ? onlineStr : '',
            leaveHistory: leaveHist,
            weeklyEvents: {}
          };
        });

        const applyMerge = async () => {
          const existingByName = new Map(members.map(m => [m.name.toLowerCase(), m]));
          let addedCount = 0;
          let updatedCount = 0;
          importedMembers.forEach(imp => {
            const key = imp.name.toLowerCase();
            if (existingByName.has(key)) {
              const ex = existingByName.get(key);
              ex.lv = imp.lv;
              ex.job = imp.job;
              ex.title = imp.title;
              ex.gender = imp.gender;
              ex.position = imp.position;
              ex.gear = imp.gear;
              ex.weeklyActivity = imp.weeklyActivity;
              ex.weeklyContrib = imp.weeklyContrib;
              ex.totalContrib = imp.totalContrib;
              ex.onlineStatus = imp.onlineStatus;
              ensureLeaveHistoryObject(ex);
              ensureWeeklyEventsObject(ex);
              ex._leaveMigrated = true;
              updatedCount++;
            } else {
              imp._leaveMigrated = true;
              members.push(imp);
              addedCount++;
            }
          });
          if (teams.length === 0 || parties.length === 0) initDefaultTeamsAndParties();
          syncMembersStatusForSelectedDate();
          populateClassFilterDropdown();
          renderAll();
          showToast(`📂 รวมไฟล์ CSV สำเร็จ! (อัปเดต ${updatedCount} คน, เพิ่มใหม่ ${addedCount} คน)`, 'success');
          await triggerAutoSaveImmediate('นำเข้า CSV (รวมข้อมูล)');
          await loadFromDatabase(false);
        };

        const applyReplace = async () => {
          importedMembers.forEach(imp => { imp._leaveMigrated = true; });
          members = importedMembers;
          selectedMemberIds.clear();
          if (teams.length === 0 || parties.length === 0) initDefaultTeamsAndParties();
          syncMembersStatusForSelectedDate();
          populateClassFilterDropdown();
          if (typeof autoAssignByGearAndRole === 'function') {
            autoAssignByGearAndRole();
          }
          renderAll();
          showToast(`📂 นำเข้าไฟล์ CSV สำเร็จ! โหลดสมาชิก ${members.length} คน`, 'success');
          await triggerAutoSaveImmediate('นำเข้า CSV (ทับข้อมูลใหม่)');
          await loadFromDatabase(false);
        };

        if (members.length > 0) {
          openCustomDialog({
            title: '📂 พบรายชื่อสมาชิกเดิมในระบบ',
            message: `ตอนนี้มีรายชื่อสมาชิกอยู่แล้ว ${members.length} คน\nกด "รวมข้อมูลและอัปเดต Gear" เพื่อรักษาการจัดปาร์ตี้และประวัติการลาเดิมไว้`,
            confirmText: 'รวมข้อมูลและอัปเดต Gear',
            cancelText: 'ทับข้อมูลใหม่ทั้งหมด',
            onConfirm: () => applyMerge(),
            onCancel: () => applyReplace()
          });
        } else {
          applyReplace();
        }

        event.target.value = '';
      };
      reader.readAsText(file, 'utf-8');
    }

// Common KPI & Party info helpers
    function findMemberPartyInfo(memberId) {
      for (const p of parties) {
        const idx = p.slots.indexOf(memberId);
        if (idx !== -1) {
          const team = teams.find(t => t.id === p.teamId) || {
            id: 'team_a',
            name: p.teamName || 'ทีม A',
            color: p.teamColor || 'rose',
            field: p.teamField || p.raid || 'main'
          };
          const fieldZone = getFieldZone(team.field);
          return { party: p, team, fieldZone, slotIndex: idx };
        }
      }
      return null;
    }

    function findMemberPolarityPartyInfo(memberId) {
      const pList = (typeof polarityParties !== 'undefined' && polarityParties.length)
        ? polarityParties
        : (rawPolarityParties || []);
      for (const p of pList) {
        const idx = (p.slots || []).indexOf(memberId);
        if (idx !== -1) {
          return { party: p, teamName: p.teamName || 'ทีมดาว', teamColor: p.teamColor || 'amber', slotIndex: idx };
        }
      }
      return null;
    }

        function findMemberPresetPartyInfo(memberId) {
      const pList = (typeof presetParties !== 'undefined' && presetParties.length)
        ? presetParties
        : (rawPresetParties || []);
      for (const p of pList) {
        const idx = (p.slots || []).indexOf(memberId);
        if (idx !== -1) {
          return { party: p, partyName: p.name || 'ตี้ประจำ', color: p.color || 'indigo', slotIndex: idx };
        }
      }
      return null;
    }

    function findMemberSiegePartyInfo(memberId) {
      const pList = (typeof siegeParties !== 'undefined' && siegeParties.length)
        ? siegeParties
        : (rawSiegeParties || []);
      for (const p of pList) {
        const idx = (p.slots || []).indexOf(memberId);
        if (idx !== -1) {
          return { party: p, teamName: p.teamName || 'ทัพชิงปราสาท', teamColor: p.teamColor || 'rose', slotIndex: idx };
        }
      }
      return null;
    }

    function getAssignedSet() {
      const set = new Set();
      parties.forEach(p => p.slots.forEach(id => { if (id) set.add(id); }));
      return set;
    }

    function formatGearBadge(gear) {
      if (gear >= 40000) return `<span class="mono px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">★ ${gear.toLocaleString()}</span>`;
      if (gear >= 30000) return `<span class="mono px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">${gear.toLocaleString()}</span>`;
      if (gear >= 20000) return `<span class="mono px-1.5 py-0.5 rounded text-[11px] font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30">${gear.toLocaleString()}</span>`;
      return `<span class="mono px-1.5 py-0.5 rounded text-[11px] text-slate-300 bg-slate-800/90">${gear.toLocaleString()}</span>`;
    }

    function updateKPIs() {
      syncMembersStatusForSelectedDate();
      const elGuild = document.getElementById('guildTitleDisplay');
      if (elGuild) elGuild.textContent = guildName;
      const elMeta = document.getElementById('fileMetaBadge');
      if (elMeta) elMeta.textContent = fileTimestamp;

      const readyList = members.filter(m => m.status === 'ready');
      const leaveList = members.filter(m => m.status === 'leave');
      const assignedSet = getAssignedSet();
      const avgGear = readyList.length
        ? Math.round(readyList.reduce((acc, m) => acc + m.gear, 0) / readyList.length)
        : 0;

      const elTotal = document.getElementById('statTotal');
      if (elTotal) elTotal.textContent = members.length;
      const elReady = document.getElementById('statReady');
      if (elReady) elReady.textContent = readyList.length;
      const elLeave = document.getElementById('statLeave');
      if (elLeave) elLeave.textContent = leaveList.length;
      const elAssigned = document.getElementById('statAssigned');
      if (elAssigned) elAssigned.textContent = `${assignedSet.size} / ${parties.length * 5}`;
      const elAvgGear = document.getElementById('statAvgGear');
      if (elAvgGear) elAvgGear.textContent = avgGear.toLocaleString();

      const elBtnRoster = document.getElementById('tabBtn-roster');
      if (elBtnRoster) elBtnRoster.textContent = `📋 ตารางสมาชิก (${members.length} คน)`;
      const elBtnLeave = document.getElementById('tabBtn-leave');
      if (elBtnLeave) elBtnLeave.textContent = `🏖️ ระบบบันทึกการลา (${leaveList.length})`;

      let totalJoinedEvents = 0;
      const maxEventsPossible = members.length * WEEKLY_EVENTS_CONFIG.length;
      members.forEach(m => {
        WEEKLY_EVENTS_CONFIG.forEach(ev => {
          if (getMemberEventRecord(m, selectedWeekMonday, ev.key).status === 'joined') {
            totalJoinedEvents++;
          }
        });
      });
      const weeklyEventPct = maxEventsPossible > 0 ? Math.round((totalJoinedEvents / maxEventsPossible) * 100) : 0;
      const statEventsEl = document.getElementById('statWeeklyEvents');
      if (statEventsEl) statEventsEl.textContent = `${weeklyEventPct}% (${totalJoinedEvents}/${maxEventsPossible})`;
      const evBtn = document.getElementById('tabBtn-events');
      if (evBtn) evBtn.textContent = `🏆 กิจกรรมประจำสัปดาห์ (${weeklyEventPct}%)`;

      if (typeof updateBulkDeleteButton === 'function') {
        updateBulkDeleteButton();
      }
    }

    function exportLineupCSV() {
      if (members.length === 0) {
        showToast('ยังไม่มีข้อมูลสมาชิกให้ส่งออก CSV ครับ', 'danger');
        return;
      }
      syncMembersStatusForSelectedDate();
      const headers = ['ID','ชื่อผู้เล่น','Lv.','คลาส','Title','เพศ','ตำแหน่ง','คะแนน Gear','กิจกรรมสัปดาห์นี้','แต้มสนับสนุนสัปดาห์นี้','แต้มสนับสนุนสะสม','สถานะออนไลน์','สนาม (หลัก/รอง)','ทีม','ปาร์ตี้กิลด์วอร์',`สถานะวันที่ (${selectedDate})`];
      const rows = members.map(m => {
        const pInfo = findMemberPartyInfo(m.id);
        const fieldStr = pInfo ? pInfo.fieldZone.name : '-';
        const teamStr = pInfo ? pInfo.team.name : '-';
        const partyStr = pInfo ? pInfo.party.name : 'ไม่ได้ลงตี้';
        const statusStr = m.status === 'ready' ? 'พร้อมวอร์' : `ลา (${m.leaveType || ''} - ${m.leaveReason || ''})`;
        return [
          m.csvId, m.name, m.lv, m.job, m.title, m.gender, m.position,
          m.gear, m.weeklyActivity, m.weeklyContrib, m.totalContrib, m.onlineStatus,
          fieldStr, teamStr, partyStr, statusStr.replace(/,/g, ' ')
        ].join(',');
      });
      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ผังทัพ_${guildName.replace(/\s+/g, '_')}_${selectedDate}.csv`;
      a.click();
    }

// Weekly events core config & date helpers
    // WEEKLY EVENT ATTENDANCE SYSTEM (6 กิจกรรมหลัก แยก Guild League อังคาร/พฤหัสบดี)
    // ============================================================================
    const WEEKLY_EVENTS_CONFIG = [
      {
        key: 'mirror_world',
        name: 'Mirror World',
        shortName: 'Mirror World',
        icon: '🪞',
        accentClass: 'border-cyan-500/40 bg-cyan-950/25 text-cyan-300',
        btnActiveClass: 'bg-cyan-600 hover:bg-cyan-500 text-white'
      },
      {
        key: 'hazy_maze',
        name: 'The Hazy Maze Forest',
        shortName: 'Hazy Maze',
        icon: '🌲',
        accentClass: 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300',
        btnActiveClass: 'bg-emerald-600 hover:bg-emerald-500 text-white'
      },
      {
        key: 'guild_league_tue',
        name: 'Guild League (อังคาร)',
        shortName: 'GL (อังคาร)',
        icon: '⚔️',
        accentClass: 'border-amber-500/40 bg-amber-950/25 text-amber-300',
        btnActiveClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950'
      },
      {
        key: 'guild_league_thu',
        name: 'Guild League (พฤหัสบดี)',
        shortName: 'GL (พฤหัสฯ)',
        icon: '🛡️',
        accentClass: 'border-orange-500/40 bg-orange-950/25 text-orange-300',
        btnActiveClass: 'bg-orange-500 hover:bg-orange-400 text-white'
      },
      {
        key: 'polarity_zone',
        name: 'Polarity Zone',
        shortName: 'Polarity Zone',
        icon: '⚡',
        accentClass: 'border-purple-500/40 bg-purple-950/25 text-purple-300',
        btnActiveClass: 'bg-purple-600 hover:bg-purple-500 text-white'
      },
      {
        key: 'castle_siege',
        name: 'ศึกชิงปราสาท',
        shortName: 'ศึกชิงปราสาท',
        icon: '🏰',
        accentClass: 'border-rose-500/40 bg-rose-950/25 text-rose-300',
        btnActiveClass: 'bg-rose-600 hover:bg-rose-500 text-white'
      }
    ];

    function getWeekMondayISO(dateInput = new Date()) {
      let dt;
      if (typeof dateInput === 'string' && dateInput.includes('-')) {
        const [y, m, d] = dateInput.split('-').map(Number);
        dt = new Date(y, m - 1, d);
      } else {
        dt = new Date(dateInput);
      }
      const day = dt.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      dt.setDate(dt.getDate() + diffToMonday);
      return getLocalDateISO(dt);
    }

    function getWeekSundayISO(mondayIso) {
      const [y, m, d] = mondayIso.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 6);
      return getLocalDateISO(dt);
    }

    function formatThaiWeekRange(mondayIso) {
      if (!mondayIso) return '';
      const sunIso = getWeekSundayISO(mondayIso);
      return `${formatThaiDateShort(mondayIso)} - ${formatThaiDateFull(sunIso)}`;
    }

    let selectedWeekMonday = getWeekMondayISO(new Date());
    let activeEventSubView = 'matrix';

    function ensureWeeklyEventsObject(m) {
      if (!m.weeklyEvents || typeof m.weeklyEvents !== 'object' || Array.isArray(m.weeklyEvents)) {
        m.weeklyEvents = {};
      }
      if (!m.weeklyEvents[selectedWeekMonday] || typeof m.weeklyEvents[selectedWeekMonday] !== 'object') {
        m.weeklyEvents[selectedWeekMonday] = {};
      }
    }

    // ดึงข้อมูลสถานะแต่ละกิจกรรม (พร้อมรองรับข้อมูลเก่าจาก key 'guild_league' เดิมอัตโนมัติ)
    function getMemberEventRecord(m, weekKey, eventKey) {
      if (!m.weeklyEvents || !m.weeklyEvents[weekKey]) return { status: 'none', note: '' };
      if (m.weeklyEvents[weekKey][eventKey]) return m.weeklyEvents[weekKey][eventKey];
      if ((eventKey === 'guild_league_tue' || eventKey === 'guild_league_thu') && m.weeklyEvents[weekKey]['guild_league']) {
        return m.weeklyEvents[weekKey]['guild_league'];
      }
      return { status: 'none', note: '' };
    }

    function getMemberWeeklyEventSummaryAllWeeks(m) {
      let joined = 0, leave = 0, absent = 0;
      if (m.weeklyEvents && typeof m.weeklyEvents === 'object') {
        Object.keys(m.weeklyEvents).forEach(wKey => {
          const wObj = m.weeklyEvents[wKey];
          if (!wObj || typeof wObj !== 'object') return;
          WEEKLY_EVENTS_CONFIG.forEach(ev => {
            const st = getMemberEventRecord(m, wKey, ev.key).status;
            if (st === 'joined') joined++;
            else if (st === 'leave') leave++;
            else if (st === 'absent') absent++;
          });
        });
      }
      return { joined, leave, absent, leaveAndAbsent: leave + absent };
    }

    async function setMemberDailyLeaveQuick(memberId, dateStr, leaveType, defaultReason = 'แจ้งลาด่วน') {
      const targetDate = dateStr || selectedDate;
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      ensureLeaveHistoryObject(m);
      m._leaveMigrated = true;

      if (!leaveType || leaveType === 'ready') {
        delete m.leaveHistory[targetDate];
        if (targetDate === selectedDate) {
          m.status = 'ready';
          m.leaveReason = '';
          m.leaveType = '';
        }
        syncMembersStatusForSelectedDate();
        renderAll();
        showToast(`✅ ตั้งสถานะ "${m.name}" เป็นพร้อมวอร์ (${formatThaiDateShort(targetDate)})`, 'success');
        await saveLeaveToDatabaseSilent(`ยกเลิกการลา: ${m.name}`);
      } else {
        const existingReason = m.leaveHistory[targetDate]?.reason;
        m.leaveHistory[targetDate] = {
          status: 'leave',
          type: leaveType,
          reason: existingReason || defaultReason,
          updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
        };
        syncMembersStatusForSelectedDate();
        renderAll();
        showToast(`🏖️ บันทึก "${m.name}" เป็น "${leaveType}" (${formatThaiDateShort(targetDate)})`, 'info');
        await saveLeaveToDatabaseSilent(`อัปเดตการลา: ${m.name}`);
      }
    }

    function editMemberDailyLeaveReason(memberId, dateStr) {
      const targetDate = dateStr || selectedDate;
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      ensureLeaveHistoryObject(m);
      const rec = m.leaveHistory[targetDate] || { type: 'ลากิลด์วอร์ GVG', reason: '' };

      const searchEl = document.getElementById('leaveFormMemberSearch');
      if (searchEl) searchEl.value = '';
      if (typeof populateLeaveMemberSelect === 'function') populateLeaveMemberSelect();
      const selectEl = document.getElementById('leaveFormMemberSelect');
      if (selectEl) selectEl.value = m.id;
      const startEl = document.getElementById('leaveFormStartDate');
      const endEl = document.getElementById('leaveFormEndDate');
      if (startEl) startEl.value = targetDate;
      if (endEl) endEl.value = targetDate;
      const radios = document.querySelectorAll('input[name="leaveTypeRadio"]');
      radios.forEach(r => { r.checked = (r.value === rec.type); });
      if (typeof updateLeaveTypeRadioStyles === 'function') updateLeaveTypeRadioStyles();
      const reasonInput = document.getElementById('leaveFormReasonInput');
      if (reasonInput) reasonInput.value = rec.reason || '';

      openCustomDialog({
        title: `✏️ แก้ไขเหตุผลการลา (${formatThaiDateFull(targetDate)})`,
        message: `สมาชิก: ${m.name} (${m.job})\nประเภท: ${rec.type}\nระบุเหตุผลการลาใหม่:`,
        showInput: true,
        defaultInput: rec.reason || '',
        confirmText: '💾 บันทึกการแก้ไข',
        onConfirm: async (newReason) => {
          m.leaveHistory[targetDate] = {
            status: 'leave',
            type: rec.type,
            reason: (newReason || '').trim() || 'ติดธุระส่วนตัว',
            updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
          };
          syncMembersStatusForSelectedDate();
          renderAll();
          showToast(`✏️ อัปเดตเหตุผลการลาของ "${m.name}" แล้ว`, 'success');
          await saveLeaveToDatabaseSilent(`แก้ไขการลา: ${m.name}`);
        }
      });
    }

    async function removeMemberLeaveOnDate(memberId, dateStr) {
      const targetDate = dateStr || selectedDate;
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;

      ensureLeaveHistoryObject(m);
      m._leaveMigrated = true;

      delete m.leaveHistory[targetDate];
      if (targetDate === selectedDate) {
        m.status = 'ready';
        m.leaveReason = '';
        m.leaveType = '';
      }

      syncMembersStatusForSelectedDate();
      renderAll();
      showToast(`✅ ยกเลิกการลาของ "${m.name}" ในวันที่ ${formatThaiDateShort(targetDate)} เปลี่ยนเป็นพร้อมวอร์แล้ว`, 'success');
      await saveLeaveToDatabaseSilent(`ยกเลิกการลา: ${m.name}`);
    }

// ============================================================================
// SUPABASE CLOUD DATABASE INTEGRATION
// ============================================================================
    const SUPABASE_URL = 'https://lzlrlnmphtjotgeumqht.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_YjR6DcMPq2OD3l0JVVMzPg_tigMFS6H';
    const ADMIN_PIN = 'Moonz';

    function getNormalizedSupabaseUrl(rawUrl) {
      const trimmed = (rawUrl || '').trim();
      if (!trimmed) return null;
      if (!trimmed.startsWith('http')) return `https://${trimmed}.supabase.co`;
      return trimmed;
    }

    let supabaseClient = null;

    function getSupabaseClient() {
      if (supabaseClient) return supabaseClient;
      const validSupabaseUrl = getNormalizedSupabaseUrl(SUPABASE_URL);
      if (validSupabaseUrl && window.supabase && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(validSupabaseUrl, SUPABASE_KEY);
      }
      return supabaseClient;
    }

    // Try initializing right away
    getSupabaseClient();

    function setCloudStatus(text, isOnline) {
      const badge = document.getElementById('cloudStatusBadge');
      if (!badge) return;
      badge.textContent = text;
      badge.className = isOnline
        ? 'px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        : 'px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }

    let autoSaveTimer = null;

    function triggerAutoSave(actionLabel = 'บันทึกอัตโนมัติ', delayMs = 600) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      setCloudStatus('⏳ มีการแก้ไข รอเซฟ...', false);
      autoSaveTimer = setTimeout(async () => {
        autoSaveTimer = null;
        await saveToDatabaseSilent(actionLabel);
      }, delayMs);
    }
    window.triggerAutoSave = triggerAutoSave;

    async function triggerAutoSaveImmediate(actionLabel = 'บันทึกอัตโนมัติ') {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
      await saveToDatabaseSilent(actionLabel);
    }
    window.triggerAutoSaveImmediate = triggerAutoSaveImmediate;

    // Automatically flush pending auto-save when user leaves or closes page
    window.addEventListener('beforeunload', () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
        saveToDatabaseSilent('เซฟอัตโนมัติก่อนเปลี่ยนหน้า');
      }
    });

    async function saveToDatabaseSilent(actionLabel = 'บันทึกอัตโนมัติ') {
      const client = getSupabaseClient();
      if (!client) return;
      const syncBadge = document.getElementById('leaveDbSyncBadge');
      const eventSyncBadge = document.getElementById('eventDbSyncBadge');
      try {
        [syncBadge, eventSyncBadge].forEach(b => {
          if (b) {
            b.textContent = '⏳ กำลังบันทึกลง Database...';
            b.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30';
          }
        });
        setCloudStatus('⏳ กำลังบันทึก...', false);

        const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
        fileTimestamp = nowStr;
        syncTeamMetadataToParties();

        const gvgPartiesToSave = parties.filter(p => p.category !== 'polarity' && p.category !== 'siege' && p.category !== 'preset' && p.category !== '__system__').map(p => ({ ...p, category: 'gvg' }));
        const polarityPartiesToSave = (typeof window.getActivePolarityParties === 'function')
          ? window.getActivePolarityParties()
          : (rawPolarityParties || []);
        const siegePartiesToSave = (typeof window.getActiveSiegeParties === 'function')
          ? window.getActiveSiegeParties()
          : (rawSiegeParties || []);
        const presetPartiesToSave = (typeof window.getActivePresetParties === 'function')
          ? window.getActivePresetParties()
          : (rawPresetParties || []);
        const authEntry = {
          id: '__guild_auth_config__',
          category: '__system__',
          pin: currentGuildPin || localStorage.getItem('Moonz_guild_pin') || 'Moonz',
          updatedAt: new Date().toISOString()
        };
        const combinedParties = [...gvgPartiesToSave, ...polarityPartiesToSave, ...siegePartiesToSave, ...presetPartiesToSave, authEntry];

        const { error } = await client
          .from('guild_state')
          .upsert({
            id: 1,
            guild_name: guildName,
            file_timestamp: fileTimestamp,
            members: members,
            parties: combinedParties,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        [syncBadge, eventSyncBadge].forEach(b => {
          if (b) {
            b.textContent = `☁️ บันทึกลง Database แล้ว (${nowStr})`;
            b.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
          }
        });
        setCloudStatus(`☁️ บันทึกออโต้แล้ว (${nowStr})`, true);
        const metaBadge = document.getElementById('fileMetaBadge');
        if (metaBadge) metaBadge.textContent = `${guildName} • ${fileTimestamp} (${members.length} คน)`;
      } catch (err) {
        console.error('Auto Save Error:', err);
        if (syncBadge) {
          syncBadge.textContent = '⚠️ บันทึกอัตโนมัติไม่สำเร็จ';
          syncBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30';
        }
        setCloudStatus('⚠️ บันทึกอัตโนมัติไม่สำเร็จ', false);
      }
    }
    const saveLeaveToDatabaseSilent = saveToDatabaseSilent;
    window.saveToDatabaseSilent = saveToDatabaseSilent;
    window.saveLeaveToDatabaseSilent = saveToDatabaseSilent;

    async function loadFromDatabase(manualRefresh = false) {
      const client = getSupabaseClient();
      if (!client) {
        setCloudStatus('⚠️ ไม่ได้เชื่อมต่อ Supabase', false);
        initDefaultTeamsAndParties();
        populateClassFilterDropdown();
        renderAll();
        return;
      }

      let fetchedData = null;
      try {
        setCloudStatus('🔄 กำลังโหลดฐานข้อมูล...', false);
        const { data, error } = await client
          .from('guild_state')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;
        fetchedData = data;
      } catch (err) {
        console.error('Database Load Error:', err);
        setCloudStatus('⚠️ เชื่อมต่อฐานข้อมูลไม่สำเร็จ', false);
        if (!parties.length) initDefaultTeamsAndParties();
        populateClassFilterDropdown();
        renderAll();
        if (manualRefresh) {
          showToast('⚠️ โหลดจาก Cloud ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ', 'danger');
        }
        return;
      }

      try {
        if (fetchedData && Array.isArray(fetchedData.members) && Array.isArray(fetchedData.parties)) {
          guildName = fetchedData.guild_name || guildName;
          fileTimestamp = fetchedData.file_timestamp || 'ซิงค์จาก Cloud ล่าสุด';
          members = fetchedData.members;
          members.forEach(m => migrateLegacyLeaveOnce(m));
          syncMembersStatusForSelectedDate();
          const authEntry = fetchedData.parties.find(p => p.id === '__guild_auth_config__');
          if (authEntry && authEntry.pin) {
            currentGuildPin = authEntry.pin;
            localStorage.setItem('Moonz_guild_pin', authEntry.pin);
          }
          const gvgLoadedParties = fetchedData.parties.filter(p => p.category !== 'polarity' && p.category !== 'siege' && p.category !== 'preset' && p.category !== '__system__');
          const polarityLoadedParties = fetchedData.parties.filter(p => p.category === 'polarity');
          const siegeLoadedParties = fetchedData.parties.filter(p => p.category === 'siege');
          const presetLoadedParties = fetchedData.parties.filter(p => p.category === 'preset');
          rawPolarityParties = polarityLoadedParties && polarityLoadedParties.length ? polarityLoadedParties : getDefaultPolarityParties();
          rawSiegeParties = siegeLoadedParties && siegeLoadedParties.length ? siegeLoadedParties : getDefaultSiegeParties();
          rawPresetParties = presetLoadedParties && presetLoadedParties.length ? presetLoadedParties : getDefaultPresetParties();

          rebuildTeamsFromLoadedParties(gvgLoadedParties);
          if (typeof window.rebuildPolarityTeamsFromLoadedParties === 'function') {
            window.rebuildPolarityTeamsFromLoadedParties(polarityLoadedParties);
          }
          if (typeof window.rebuildSiegeTeamsFromLoadedParties === 'function') {
            window.rebuildSiegeTeamsFromLoadedParties(siegeLoadedParties);
          }
          if (typeof window.rebuildPresetPartiesFromLoadedParties === 'function') {
            window.rebuildPresetPartiesFromLoadedParties(presetLoadedParties);
          }
          populateClassFilterDropdown();
          renderAll();
          setCloudStatus(`☁️ ซิงค์แล้ว (${members.length} คน)`, true);
          if (manualRefresh) {
            showToast(`☁️ โหลดข้อมูลและการลาจากฐานข้อมูลสำเร็จ (${members.length} คน)`, 'success');
          }
        } else {
          members = [];
          initDefaultTeamsAndParties();
          populateClassFilterDropdown();
          renderAll();
          setCloudStatus('☁️ พร้อมใช้งาน (ยังไม่มีข้อมูลบน Cloud)', true);
          if (manualRefresh) {
            showToast('ยังไม่มีข้อมูลบน Cloud กรุณาเพิ่มสมาชิกหรือนำเข้าไฟล์ CSV แล้วกดบันทึกผังทัพ', 'info');
          }
        }
      } catch (renderErr) {
        console.error('Post Load Render Error:', renderErr);
      }
    }

    async function saveToDatabase() {
      const client = getSupabaseClient();
      if (!client) {
        showToast('ไม่สามารถเชื่อมต่อ Supabase ได้', 'danger');
        return;
      }

      try {
        setCloudStatus('⏳ กำลังบันทึก...', false);
        const nowStr = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
        fileTimestamp = nowStr;
        syncTeamMetadataToParties();

        const gvgPartiesToSave = parties.filter(p => p.category !== 'polarity' && p.category !== 'siege' && p.category !== 'preset' && p.category !== '__system__').map(p => ({ ...p, category: 'gvg' }));
        const polarityPartiesToSave = (typeof window.getActivePolarityParties === 'function')
          ? window.getActivePolarityParties()
          : (rawPolarityParties || []);
        const siegePartiesToSave = (typeof window.getActiveSiegeParties === 'function')
          ? window.getActiveSiegeParties()
          : (rawSiegeParties || []);
        const presetPartiesToSave = (typeof window.getActivePresetParties === 'function')
          ? window.getActivePresetParties()
          : (rawPresetParties || []);
        const authEntry = {
          id: '__guild_auth_config__',
          category: '__system__',
          pin: currentGuildPin || localStorage.getItem('Moonz_guild_pin') || 'Moonz',
          updatedAt: new Date().toISOString()
        };
        const combinedParties = [...gvgPartiesToSave, ...polarityPartiesToSave, ...siegePartiesToSave, ...presetPartiesToSave, authEntry];

        const { error } = await client
          .from('guild_state')
          .upsert({
            id: 1,
            guild_name: guildName,
            file_timestamp: fileTimestamp,
            members: members,
            parties: combinedParties,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        renderAll();
        setCloudStatus(`☁️ บันทึกล่าสุด: ${nowStr} (${members.length} คน)`, true);
        showToast('☁️ บันทึกผังทัพและประวัติการลาขึ้นฐานข้อมูลเรียบร้อย!', 'success');
      } catch (err) {
        console.error('Database Save Error:', err);
        setCloudStatus('⚠️ บันทึกไม่สำเร็จ', false);
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล', 'danger');
      }
    }

// Universal Safe renderAll Dispatcher
function renderAll() {
  syncMembersStatusForSelectedDate();
  if (typeof updateKPIs === 'function') updateKPIs();
  if (typeof renderBoard === 'function') {
    if (typeof renderJobEmblemBar === 'function') renderJobEmblemBar();
    renderBoard();
  }
  if (typeof renderPolarityBoard === 'function') {
    if (typeof renderPolarityJobEmblemBar === 'function') renderPolarityJobEmblemBar();
    renderPolarityBoard();
  }
  if (typeof renderSiegeBoard === 'function') {
    if (typeof renderSiegeJobEmblemBar === 'function') renderSiegeJobEmblemBar();
    renderSiegeBoard();
  }
  if (typeof renderPresetBoard === 'function') {
    if (typeof renderPresetJobEmblemBar === 'function') renderPresetJobEmblemBar();
    renderPresetBoard();
  }
  if (typeof renderLeaveSection === 'function') {
    renderLeaveSection();
  }
  if (typeof renderWeeklyEventsSection === 'function') {
    renderWeeklyEventsSection();
  }
  if (typeof renderRosterTable === 'function') {
    renderRosterTable();
  }
  if (typeof renderMemberQuickCheck === 'function') {
    renderMemberQuickCheck();
  }
  const previewEl = document.getElementById('summaryPreviewText');
  if (previewEl && typeof generateSummaryText === 'function') {
    previewEl.value = generateSummaryText();
  }
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', () => {
  const todayIso = getLocalDateISO(new Date());
  selectedDate = todayIso;
  if (document.getElementById('headerDateInput')) document.getElementById('headerDateInput').value = todayIso;
  if (document.getElementById('leaveDatePicker')) document.getElementById('leaveDatePicker').value = todayIso;
  if (document.getElementById('leaveFormStartDate')) document.getElementById('leaveFormStartDate').value = todayIso;
  if (document.getElementById('leaveFormEndDate')) document.getElementById('leaveFormEndDate').value = todayIso;
  selectedWeekMonday = getWeekMondayISO(todayIso);
  const evPicker = document.getElementById('eventWeekDatePicker');
  if (evPicker) evPicker.value = selectedWeekMonday;

  initDefaultTeamsAndParties();
  if (typeof initDefaultPolarityTeamsAndParties === 'function') initDefaultPolarityTeamsAndParties();
  if (typeof initDefaultSiegeTeamsAndParties === 'function') initDefaultSiegeTeamsAndParties();
  if (typeof initDefaultPresetParties === 'function') initDefaultPresetParties();
  populateClassFilterDropdown();
  renderAll();
  loadFromDatabase();

  // Inject Pin Change & Logout Buttons into Header
  setTimeout(() => {
    const headerBtnBars = document.querySelectorAll('header .flex.flex-wrap.items-center.gap-2');
    if (headerBtnBars.length > 0) {
      const targetBar = headerBtnBars[headerBtnBars.length - 1];

      if (!document.getElementById('changePinBtn')) {
        const pinBtn = document.createElement('button');
        pinBtn.id = 'changePinBtn';
        pinBtn.type = 'button';
        pinBtn.onclick = openChangeGuildPasswordModal;
        pinBtn.className = 'px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-indigo-600/25 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm';
        pinBtn.title = 'เปลี่ยนรหัสผ่านกิลด์ (ซิงค์ผ่าน Cloud)';
        pinBtn.innerHTML = '<span>🔑 รหัสกิลด์</span>';
        targetBar.appendChild(pinBtn);
      }

      if (!document.getElementById('logoutGuildBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutGuildBtn';
        logoutBtn.type = 'button';
        logoutBtn.onclick = logoutGuild;
        logoutBtn.className = 'px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs sm:text-sm font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm';
        logoutBtn.title = 'ออกจากระบบกิลด์';
        logoutBtn.innerHTML = '<span>🔒 ออกจากระบบ</span>';
        targetBar.appendChild(logoutBtn);
      }
    }
  }, 50);
});

// ============================================================================
// UNIVERSAL PRESET SQUAD SHARING (Import Preset into GVG / Siege / Polarity)
// ============================================================================
window.openImportPresetModal = function(targetPartyId, mode) {
  const currentPresets = (typeof presetParties !== 'undefined' && presetParties.length)
    ? presetParties
    : (rawPresetParties || []);

  if (!currentPresets.length) {
    showToast('ยังไม่มีตี้ประจำในระบบ กรุณาไปที่หน้า "จัดตี้ประจำ" เพื่อสร้างตี้ก่อนครับ', 'info');
    return;
  }

  const optionsHtml = currentPresets.map((p, idx) => {
    const filledCount = (p.slots || []).filter(Boolean).length;
    const memberNames = (p.slots || []).map(id => {
      const m = members.find(x => x.id === id);
      return m ? m.name : 'ว่าง';
    }).join(', ');
    return `<option value="${p.id}">${p.name || `ตี้ประจำ ${idx+1}`} (${filledCount}/5 คน) — [${memberNames}]</option>`;
  }).join('');

  openCustomDialog({
    title: '📥 ดึงสมาชิกจาก "ตี้ประจำ"',
    message: `เลือกตี้ประจำที่ต้องการนำมาใส่ในปาร์ตี้นี้:\n(สมาชิก 5 ช่องในปาร์ตี้นี้จะถูกแทนที่ด้วยสมาชิกจากตี้ประจำที่เลือก)`,
    showCustomHtml: true,
    customHtml: `
      <div class="space-y-3 mt-2 text-left">
        <label class="block text-xs font-semibold text-slate-300">เลือกตี้ประจำ:</label>
        <select id="importPresetSelectEl" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
          ${optionsHtml}
        </select>
      </div>
    `,
    confirmText: '📥 นำเข้าตี้ประจำนี้',
    onConfirm: async () => {
      const selectEl = document.getElementById('importPresetSelectEl');
      if (!selectEl) return;
      const chosenPresetId = selectEl.value;
      const chosenPreset = currentPresets.find(p => p.id === chosenPresetId);
      if (!chosenPreset) return;

      // Apply slots to the target party
      let targetParty = null;
      if (mode === 'gvg') {
        targetParty = parties.find(p => p.id === targetPartyId);
      } else if (mode === 'polarity') {
        if (typeof polarityParties !== 'undefined') {
          targetParty = polarityParties.find(p => p.id === targetPartyId);
        } else if (rawPolarityParties) {
          targetParty = rawPolarityParties.find(p => p.id === targetPartyId);
        }
      } else if (mode === 'siege') {
        if (typeof siegeParties !== 'undefined') {
          targetParty = siegeParties.find(p => p.id === targetPartyId);
        } else if (rawSiegeParties) {
          targetParty = rawSiegeParties.find(p => p.id === targetPartyId);
        }
      }

      if (targetParty) {
        targetParty.slots = [...chosenPreset.slots];
        while (targetParty.slots.length < 5) targetParty.slots.push(null);
        renderAll();
        showToast(`✅ นำสมาชิกจาก "${chosenPreset.name}" เข้าสู่ "${targetParty.name}" เรียบร้อยแล้ว`, 'success');
        if (typeof saveLeaveToDatabaseSilent === 'function') {
          await saveLeaveToDatabaseSilent(`นำเข้าตี้ประจำ: ${chosenPreset.name} -> ${targetParty.name}`);
        }
      }
    }
  });
};
