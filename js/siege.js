// ============================================================================
// SIEGE WAR (ศึกชิงปราสาท) TACTICAL BOARD & FORMATION BUILDER
// ============================================================================

let siegeTeams = [];
let siegeParties = [];
let currentSiegeTeamFilter = 'all';
let activeSiegeJobBarFamily = 'all';
let selectedSiegeSource = null;

// Initialize default Siege War Tactical Teams
function initDefaultSiegeTeamsAndParties() {
  siegeTeams = [
    { id: 'siege_team_1', name: '🏰 ทัพบุกหลัก / ตีหิน (Main Breaker)', color: 'rose' },
    { id: 'siege_team_2', name: '🛡️ ทัพป้องกัน / เฝ้าหิน (Castle Defense)', color: 'blue' },
    { id: 'siege_team_3', name: '⚡ ทัพดักหน้าวาป / ตัดกำลัง (Warp Interceptor)', color: 'amber' },
    { id: 'siege_team_4', name: '🎯 ทัพเคลื่อนที่เร็ว / กองหนุน (Mobile Scout)', color: 'emerald' }
  ];

  siegeParties = [];
  siegeTeams.forEach((t) => {
    for (let pNum = 1; pNum <= 2; pNum++) {
      siegeParties.push({
        id: `siege_p_${t.id}_${pNum}`,
        name: `ปาร์ตี้ ${pNum}`,
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        category: 'siege',
        slots: [null, null, null, null, null]
      });
    }
  });
}

function syncSiegeTeamMetadataToParties() {
  siegeParties.forEach(p => {
    p.category = 'siege';
    const parentTeam = siegeTeams.find(t => t.id === p.teamId);
    if (parentTeam) {
      p.teamName = parentTeam.name;
      p.teamColor = parentTeam.color;
    }
  });
}

window.getActiveSiegeParties = function() {
  syncSiegeTeamMetadataToParties();
  return siegeParties.map(p => ({ ...p, category: 'siege' }));
};

window.rebuildSiegeTeamsFromLoadedParties = function(loadedParties) {
  if (!Array.isArray(loadedParties) || loadedParties.length === 0) {
    initDefaultSiegeTeamsAndParties();
    return;
  }

  const teamMap = new Map();
  loadedParties.forEach(p => {
    p.category = 'siege';
    if (!p.slots || !Array.isArray(p.slots)) {
      p.slots = [null, null, null, null, null];
    }
    while (p.slots.length < 5) p.slots.push(null);
    if (p.slots.length > 5) p.slots = p.slots.slice(0, 5);

    if (!teamMap.has(p.teamId)) {
      teamMap.set(p.teamId, {
        id: p.teamId,
        name: p.teamName || '🏰 ทัพปราสาท',
        color: p.teamColor || 'rose'
      });
    }
  });

  siegeTeams = Array.from(teamMap.values());
  if (!siegeTeams.length) {
    initDefaultSiegeTeamsAndParties();
    return;
  }

  siegeParties = loadedParties.map((p, idx) => ({
    id: p.id || `siege_p_${idx}`,
    name: p.name || `ปาร์ตี้ ${(idx % 2) + 1}`,
    teamId: p.teamId || siegeTeams[0].id,
    teamName: p.teamName || siegeTeams[0].name,
    teamColor: p.teamColor || siegeTeams[0].color,
    category: 'siege',
    slots: Array.isArray(p.slots) ? p.slots : [null, null, null, null, null]
  }));
  syncSiegeTeamMetadataToParties();
};

// Job Emblem Bar for Siege War
function selectSiegeJobBarFamily(familyKey) {
  activeSiegeJobBarFamily = (activeSiegeJobBarFamily === familyKey) ? 'all' : familyKey;
  renderSiegeJobEmblemBar();
  renderSiegeBoard();
}

function renderSiegeJobEmblemBar() {
  const bar = document.getElementById('siegeJobEmblemBarContainer');
  if (!bar) return;

  const assignedSet = getSiegeAssignedSet();
  const unassignedMembers = members.filter(m => !assignedSet.has(m.id));

  const familyCounts = {};
  JOB_FAMILIES.forEach(f => { familyCounts[f.familyKey] = 0; });
  unassignedMembers.forEach(m => {
    const fam = getJobFamily(m.job);
    const fKey = fam ? fam.familyKey : 'other';
    if (familyCounts[fKey] !== undefined) familyCounts[fKey]++;
  });

  const resetBtn = document.getElementById('resetSiegeJobBarBtn');
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', activeSiegeJobBarFamily === 'all');
  }

  bar.innerHTML = JOB_FAMILIES.map(fam => {
    const count = familyCounts[fam.familyKey] || 0;
    const isSelected = activeSiegeJobBarFamily === fam.familyKey;
    const activeClasses = isSelected
      ? 'bg-[#363d4e] border-slate-500 ring-2 ring-amber-400/80 shadow-lg'
      : 'bg-transparent border-transparent hover:bg-[#272c3a]';

    return `
      <button onclick="selectSiegeJobBarFamily('${fam.familyKey}')" class="group relative flex flex-col items-center justify-center min-w-[74px] sm:min-w-[82px] px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${activeClasses}" title="${fam.label} (${fam.jobs.join(' / ')}) — ${count} คน">
        ${count > 0 ? `<span class="absolute top-1 right-1.5 mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-950/90 text-amber-300 border border-slate-700">${count}</span>` : ''}
        <div class="transform group-hover:scale-110 transition duration-200">
          ${renderJobEmblem(fam.jobs[0], 42)}
        </div>
        <span class="mt-1.5 text-xs font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}">${fam.label}</span>
      </button>
    `;
  }).join('');
}

function getSiegeAssignedSet() {
  const set = new Set();
  siegeParties.forEach(p => {
    p.slots.forEach(mId => {
      if (mId) set.add(mId);
    });
  });
  return set;
}

function setSiegeTeamFilter(teamId) {
  currentSiegeTeamFilter = teamId;
  renderSiegeFilterBar();
  renderSiegeBoard();
}

function renderSiegeFilterBar() {
  const container = document.getElementById('siegeTeamFilterButtons');
  if (!container) return;

  const totalAssigned = siegeParties.reduce((acc, p) => acc + p.slots.filter(Boolean).length, 0);
  const totalCapacity = siegeParties.length * 5;

  let html = `
    <button onclick="setSiegeTeamFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${currentSiegeTeamFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'}">
      ทุกทัพชิงปราสาท (${siegeTeams.length} ทัพ • ${totalAssigned}/${totalCapacity} คน)
    </button>
  `;

  siegeTeams.forEach(t => {
    const isAct = (currentSiegeTeamFilter === t.id);
    const theme = getTeamTheme(t.color);
    const pInTeam = siegeParties.filter(p => p.teamId === t.id);
    let countInTeam = 0;
    pInTeam.forEach(p => p.slots.forEach(s => { if (s) countInTeam++; }));

    html += `
      <button onclick="setSiegeTeamFilter('${t.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${isAct ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'}">
        <span class="w-2 h-2 rounded-full ${theme.dotClass}"></span>
        <span>${t.name} (${countInTeam}/${pInTeam.length * 5})</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function renderSiegeBoard() {
  syncSiegeTeamMetadataToParties();
  renderSiegeFilterBar();

  const assignedSet = getSiegeAssignedSet();
  const q = (document.getElementById('siegePoolSearch')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('siegePoolRoleFilter')?.value || 'all';

  const unassigned = members
    .filter(m => !assignedSet.has(m.id))
    .filter(m => roleFilter === 'all' ? true : getJobMeta(m.job).role === roleFilter)
    .filter(m => activeSiegeJobBarFamily === 'all' ? true : getJobFamily(m.job).familyKey === activeSiegeJobBarFamily)
    .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || (m.position || '').toLowerCase().includes(q))
    .sort((a, b) => b.gear - a.gear);

  const badgeEl = document.getElementById('siegeUnassignedCountBadge');
  if (badgeEl) badgeEl.textContent = unassigned.length;

  const poolEl = document.getElementById('siegeUnassignedPoolList');
  if (poolEl) {
    poolEl.innerHTML = unassigned.map(m => {
      const meta = getJobMeta(m.job);
      const isSelected = selectedSiegeSource && selectedSiegeSource.memberId === m.id;
      return `
        <div onclick="handleSiegePoolClick('${m.id}')"
             draggable="true"
             data-siege-source="pool"
             data-siege-id="${m.id}"
             style="${meta.cardTintStyle}"
             class="p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 group hover:brightness-110 ${isSelected ? 'slot-selected' : ''}">
          <div class="flex items-center gap-2.5 min-w-0">
            ${renderJobEmblem(m.job, 34)}
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                ${renderColoredMemberName(m)}
                <span class="mono text-[10px] text-slate-300 font-semibold">Lv.${m.lv}</span>
              </div>
              <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                <span style="${meta.badgeStyle}" class="px-1.5 py-0.2 rounded text-[10px] font-medium border">${m.job}</span>
                <span class="text-[10px] ${m.onlineStatus === '[ออนไลน์]' ? 'text-emerald-300' : 'text-slate-400'}">${m.onlineStatus || '[ออนไลน์]'}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            ${formatGearBadge(m.gear)}
          </div>
        </div>
      `;
    }).join('') || `
      <div class="text-center text-xs text-slate-500 py-8 space-y-2">
        <div>ไม่มีสมาชิกที่ตรงกับเงื่อนไข</div>
      </div>
    `;
  }

  // Render Siege Teams Cards with Image 1 layout
  const container = document.getElementById('siegeTeamsHierarchyContainer');
  if (!container) return;

  const filteredTeams = (currentSiegeTeamFilter === 'all')
    ? siegeTeams
    : siegeTeams.filter(t => t.id === currentSiegeTeamFilter);

  container.innerHTML = filteredTeams.map(team => renderSiegeTeamCardHtml(team)).join('') || `
    <div class="py-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <div class="text-3xl mb-2">🏰</div>
      <div class="font-bold text-white">ยังไม่มีทัพชิงปราสาทในรายการนี้</div>
      <button onclick="openCreateSiegeTeamModal()" class="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition">
        ➕ สร้างทัพใหม่
      </button>
    </div>
  `;

  bindSiegeDragAndDrop();
}

// Layout structured exactly like Image 1 (vertical party cards with 5 slots)
function renderSiegeTeamCardHtml(team) {
  const theme = getTeamTheme(team.color);
  const teamParties = siegeParties.filter(p => p.teamId === team.id);

  const teamMembers = [];
  teamParties.forEach(p => {
    p.slots.forEach(mId => {
      const m = members.find(x => x.id === mId);
      if (m) teamMembers.push(m);
    });
  });

  const teamTotalGear = teamMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

  const colorDotsHtml = Object.values(TEAM_COLORS).map(c => `
    <button onclick="setSiegeTeamColor('${team.id}', '${c.key}')" title="เปลี่ยนสีทัพเป็น ${c.name}" class="w-4 h-4 rounded-full ${c.dotClass} transition transform hover:scale-125 ${team.color === c.key ? 'ring-2 ring-white scale-110' : 'opacity-65 hover:opacity-100'}"></button>
  `).join('');

  const partiesCardsHtml = teamParties.map(p => {
    const presentMembers = p.slots.map(id => members.find(m => m.id === id) || null).filter(Boolean);
    const hasHealer = presentMembers.some(m => getJobMeta(m.job).role === 'healer');
    const totalPartyGear = presentMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

    const moveOptionsHtml = siegeTeams.map(tOpt => `
      <option value="${tOpt.id}" ${tOpt.id === team.id ? 'selected' : ''}>ย้ายไป: ${tOpt.name}</option>
    `).join('');

    const slotsHtml = p.slots.map((mId, slotIdx) => {
      const m = members.find(x => x.id === mId);
      const isSelected = selectedSiegeSource && selectedSiegeSource.partyId === p.id && selectedSiegeSource.slotIndex === slotIdx;

      if (!m) {
        return `
          <div onclick="handleSiegeSlotClick('${p.id}', ${slotIdx})"
               data-siege-drop-target="slot"
               data-siege-party-id="${p.id}"
               data-siege-slot-index="${slotIdx}"
               class="h-11 rounded-xl border border-dashed border-slate-700/80 hover:border-amber-400/70 bg-slate-950/50 px-2.5 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer transition ${isSelected ? 'slot-selected' : ''}">
            <span class="truncate">+ ช่องว่างที่ ${slotIdx + 1} (แตะวาง)</span>
            <span class="text-[10px] opacity-60 shrink-0 ml-1">${team.name}</span>
          </div>
        `;
      }

      const meta = getJobMeta(m.job);
      return `
        <div onclick="handleSiegeSlotClick('${p.id}', ${slotIdx})"
             draggable="true"
             data-siege-source="slot"
             data-siege-party-id="${p.id}"
             data-siege-slot-index="${slotIdx}"
             data-siege-id="${m.id}"
             style="${meta.cardTintStyle}"
             class="h-11 rounded-xl border px-2.5 flex items-center justify-between gap-1.5 cursor-pointer transition group hover:brightness-110 relative ${isSelected ? 'slot-selected' : ''}">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            ${renderJobEmblem(m.job, 30)}
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                ${renderColoredMemberName(m)}
                <span class="mono text-[10px] text-slate-300 font-semibold">Lv.${m.lv}</span>
              </div>
              <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                <span style="${meta.badgeStyle}" class="px-1.5 rounded text-[9px] border">${m.job}</span>
                <span class="text-[9px] truncate ${m.onlineStatus === '[ออนไลน์]' ? 'text-emerald-300' : 'text-slate-400'}">${m.onlineStatus || '[ออนไลน์]'}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            ${formatGearBadge(m.gear)}
            <button onclick="event.stopPropagation(); removeMemberFromSiegeSlot('${p.id}', ${slotIdx})" title="ถอดออกจากตี้" class="w-5 h-5 rounded hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs flex items-center justify-center">✕</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="bg-slate-950/90 border ${theme.partyBorder} rounded-2xl p-3 flex flex-col gap-2.5 shadow-lg transition">
        <div class="flex flex-col gap-1.5 border-b border-slate-800/90 pb-2 ${theme.partyHeaderBg} -mx-3 -mt-3 px-3 pt-2.5 rounded-t-2xl">
          <!-- Row 1: Team & Party Name, Clean, Delete -->
          <div class="flex items-center justify-between gap-1.5">
            <div class="flex items-center gap-1.5 min-w-0 flex-1">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${theme.badgeClass}">
                ${team.name}
              </span>
              <h4 class="font-bold text-xs sm:text-sm text-white truncate">${p.name}</h4>
              <button onclick="renameSiegeParty('${p.id}')" title="เปลี่ยนชื่อปาร์ตี้" class="text-slate-400 hover:text-white text-xs shrink-0">✏️</button>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              ${presentMembers.length > 0 ? `<button onclick="clearSingleSiegeParty('${p.id}')" title="ถอดคนในตี้นี้ออกทั้งหมด" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">ล้าง</button>` : ''}
              <button onclick="deleteSiegeParty('${p.id}')" title="ลบปาร์ตี้นี้" class="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] transition">🗑️</button>
            </div>
          </div>

          <!-- Row 2: 📥 ตี้ประจำ + ย้ายไป dropdown -->
          <div class="flex items-center justify-between gap-1.5 pt-0.5">
            <button onclick="openImportPresetModal('${p.id}', 'siege')" title="ดึงสมาชิกจากตี้ประจำ" class="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition flex items-center gap-1">
              <span>📥 ตี้ประจำ</span>
            </button>
            <div class="flex items-center gap-1 min-w-0">
              <select onchange="movePartyToSiegeTeam('${p.id}', this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[130px] truncate">
                ${moveOptionsHtml}
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <div class="flex items-center gap-1.5">
              <span>ผลรวม Gear: <strong class="mono text-amber-300">${totalPartyGear.toLocaleString()}</strong></span>
              <span>• ${presentMembers.length}/5 คน</span>
            </div>
            <div class="flex items-center gap-1">
              ${!hasHealer && presentMembers.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚠️ ขาดพระ</span>` : ''}
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          ${slotsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="rounded-3xl border-2 ${theme.containerBorder} ${theme.containerBg} p-4 sm:p-5 space-y-4 shadow-xl">
      <!-- Team Header (Image 1 style) -->
      <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${theme.headerBg}">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full ${theme.dotClass} shadow"></span>
            <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">${team.name}</h3>
            <button onclick="renameSiegeTeam('${team.id}')" title="เปลี่ยนชื่อทัพ" class="text-slate-300 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/70">✏️ เปลี่ยนชื่อ</button>
            <button onclick="openExportImageModal('${team.id}')" title="ส่งออกรูปเฉพาะทัพนี้" class="text-slate-300 hover:text-rose-300 text-xs px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/80 transition flex items-center gap-1">📸 รูปทัพนี้</button>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
            <span>สมาชิก: <strong class="text-white">${teamMembers.length}/${teamParties.length * 5}</strong> คน</span>
            <span>• ผลรวม Gear: <strong class="mono text-amber-300">${teamTotalGear.toLocaleString()}</strong></span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 bg-slate-950/60 px-2 py-1 rounded-xl border border-slate-800">
            ${colorDotsHtml}
          </div>

          <button onclick="addPartyToSiegeTeam('${team.id}')" class="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition flex items-center gap-1">
            <span>➕ เพิ่มปาร์ตี้</span>
          </button>
          <button onclick="deleteSiegeTeam('${team.id}')" title="ลบทัพนี้" class="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs transition">
            🗑️ ลบทัพ
          </button>
        </div>
      </div>

      <!-- Parties Grid: Vertical cards with 5 slots each (Image 1 layout) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
        ${partiesCardsHtml}
      </div>
    </div>
  `;
}

// Click to select & swap
function handleSiegePoolClick(mId) {
  if (selectedSiegeSource && selectedSiegeSource.type === 'pool' && selectedSiegeSource.memberId === mId) {
    selectedSiegeSource = null;
  } else {
    selectedSiegeSource = { type: 'pool', memberId: mId };
  }
  renderSiegeBoard();
}

function handleSiegeSlotClick(partyId, slotIndex) {
  const targetParty = siegeParties.find(p => p.id === partyId);
  if (!targetParty) return;

  if (selectedSiegeSource) {
    if (selectedSiegeSource.type === 'pool') {
      targetParty.slots[slotIndex] = selectedSiegeSource.memberId;
      selectedSiegeSource = null;
      renderSiegeBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดผังทัพ Siege War');
      return;
    }

    if (selectedSiegeSource.type === 'slot') {
      const srcParty = siegeParties.find(p => p.id === selectedSiegeSource.partyId);
      if (srcParty) {
        const temp = targetParty.slots[slotIndex];
        targetParty.slots[slotIndex] = srcParty.slots[selectedSiegeSource.slotIndex];
        srcParty.slots[selectedSiegeSource.slotIndex] = temp;
      }
      selectedSiegeSource = null;
      renderSiegeBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดผังทัพ Siege War');
      return;
    }
  }

  // Click on a filled slot selects it
  if (targetParty.slots[slotIndex]) {
    selectedSiegeSource = { type: 'slot', partyId, slotIndex };
  }
  renderSiegeBoard();
}

function removeMemberFromSiegeSlot(partyId, slotIndex) {
  const p = siegeParties.find(x => x.id === partyId);
  if (p) {
    p.slots[slotIndex] = null;
    renderSiegeBoard();
    if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากตี้ Siege War');
  }
}

// Team Actions
function openCreateSiegeTeamModal() {
  openCustomDialog({
    title: '🏰 สร้างทัพ Siege War ใหม่',
    message: 'กรุณากรอกชื่อทัพชิงปราสาทใหม่ (เช่น: ทัพตีหิน 2, ทัพคุ้มกันห้องหิน):',
    showInput: true,
    defaultInput: `🏰 ทัพปราสาท ${siegeTeams.length + 1}`,
    confirmText: 'สร้างทัพ',
    onConfirm: (teamName) => {
      const cleanName = (teamName || '').trim();
      if (!cleanName) return;
      const newId = `siege_team_${Date.now()}`;
      const colorKeys = Object.keys(TEAM_COLORS);
      const chosenColor = colorKeys[siegeTeams.length % colorKeys.length] || 'rose';

      siegeTeams.push({
        id: newId,
        name: cleanName,
        color: chosenColor
      });

      for (let i = 1; i <= 2; i++) {
        siegeParties.push({
          id: `siege_p_${newId}_${i}`,
          name: `ปาร์ตี้ ${i}`,
          teamId: newId,
          teamName: cleanName,
          teamColor: chosenColor,
          category: 'siege',
          slots: [null, null, null, null, null]
        });
      }

      renderSiegeBoard();
      showToast(`สร้าง "${cleanName}" พร้อม 2 ปาร์ตี้เรียบร้อย`, 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`สร้างทัพ "${cleanName}"`);
    }
  });
}

function renameSiegeTeam(teamId) {
  const team = siegeTeams.find(t => t.id === teamId);
  if (!team) return;
  openCustomDialog({
    title: '✏️ เปลี่ยนชื่อทัพชิงปราสาท',
    message: 'กรอกชื่อทัพใหม่:',
    showInput: true,
    defaultInput: team.name,
    confirmText: 'บันทึกชื่อ',
    onConfirm: (newName) => {
      if (newName && newName.trim()) {
        team.name = newName.trim();
        syncSiegeTeamMetadataToParties();
        renderSiegeBoard();
        showToast('เปลี่ยนชื่อทัพสำเร็จ', 'success');
        if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนชื่อทัพ "${team.name}"`);
      }
    }
  });
}

function setSiegeTeamColor(teamId, colorKey) {
  const team = siegeTeams.find(t => t.id === teamId);
  if (team && TEAM_COLORS[colorKey]) {
    team.color = colorKey;
    syncSiegeTeamMetadataToParties();
    renderSiegeBoard();
    if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนสีทัพ "${team.name}"`);
  }
}

function deleteSiegeTeam(teamId) {
  const team = siegeTeams.find(t => t.id === teamId);
  if (!team) return;

  openCustomDialog({
    title: '⚠️ ยืนยันการลบทัพชิงปราสาท',
    message: `คุณต้องการลบ "${team.name}" หรือไม่?\nสมาชิกในทัพนี้ทั้งหมดจะถูกย้ายกลับไปกองกลาง`,
    confirmText: 'ยืนยันลบ',
    onConfirm: () => {
      siegeTeams = siegeTeams.filter(t => t.id !== teamId);
      siegeParties = siegeParties.filter(p => p.teamId !== teamId);
      if (currentSiegeTeamFilter === teamId) currentSiegeTeamFilter = 'all';
      renderSiegeBoard();
      showToast(`ลบทัพ "${team.name}" เรียบร้อย`, 'info');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ลบทัพ "${team.name}"`);
    }
  });
}

// Party Actions
function addPartyToSiegeTeam(teamId) {
  const team = siegeTeams.find(t => t.id === teamId);
  if (!team) return;
  const countInTeam = siegeParties.filter(p => p.teamId === teamId).length;
  const newPartyId = `siege_p_${teamId}_${Date.now()}`;

  siegeParties.push({
    id: newPartyId,
    name: `ปาร์ตี้ ${countInTeam + 1}`,
    teamId: team.id,
    teamName: team.name,
    teamColor: team.color,
    category: 'siege',
    slots: [null, null, null, null, null]
  });

  renderSiegeBoard();
  showToast(`เพิ่มปาร์ตี้ใหม่ใน "${team.name}" เรียบร้อย`, 'success');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เพิ่มปาร์ตี้ใน "${team.name}"`);
}

function movePartyToSiegeTeam(partyId, targetTeamId) {
  const party = siegeParties.find(p => p.id === partyId);
  const targetTeam = siegeTeams.find(t => t.id === targetTeamId);
  if (!party || !targetTeam) return;

  party.teamId = targetTeam.id;
  party.teamName = targetTeam.name;
  party.teamColor = targetTeam.color;
  renderSiegeBoard();
  showToast(`ย้าย "${party.name}" ไปยัง "${targetTeam.name}" เรียบร้อย`, 'success');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ย้าย "${party.name}" ไปยัง "${targetTeam.name}"`);
}

function renameSiegeParty(partyId) {
  const p = siegeParties.find(x => x.id === partyId);
  if (!p) return;
  openCustomDialog({
    title: '✏️ เปลี่ยนชื่อปาร์ตี้',
    message: 'กรอกชื่อปาร์ตี้ใหม่:',
    showInput: true,
    defaultInput: p.name,
    confirmText: 'บันทึก',
    onConfirm: (val) => {
      if (val && val.trim()) {
        p.name = val.trim();
        renderSiegeBoard();
        if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนชื่อปาร์ตี้ "${p.name}"`);
      }
    }
  });
}

function deleteSiegeParty(partyId) {
  const party = siegeParties.find(p => p.id === partyId);
  if (!party) return;

  openCustomDialog({
    title: '⚠️ ยืนยันการลบปาร์ตี้',
    message: `คุณต้องการลบ "${party.name}" หรือไม่?\nสมาชิกในปาร์ตี้นี้จะถูกย้ายกลับไปกองกลาง`,
    confirmText: 'ยืนยันลบ',
    onConfirm: () => {
      siegeParties = siegeParties.filter(p => p.id !== partyId);
      renderSiegeBoard();
      showToast(`ลบ "${party.name}" เรียบร้อย`, 'info');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ลบปาร์ตี้ "${party.name}"`);
    }
  });
}

function clearSingleSiegeParty(partyId) {
  const p = siegeParties.find(x => x.id === partyId);
  if (p) {
    p.slots = [null, null, null, null, null];
    renderSiegeBoard();
    showToast(`ถอดสมาชิกใน "${p.name}" ออกทั้งหมดแล้ว`, 'info');
    if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ถอดคนออกจาก "${p.name}"`);
  }
}

function clearAllSiegeParties() {
  openCustomDialog({
    title: '🧹 ถอดสมาชิกในทัพชิงปราสาททั้งหมด',
    message: 'คุณต้องการถอดสมาชิกทุกคนออกจากทัพ Siege War กลับไปกองกลางใช่หรือไม่?\n(โครงสร้างทัพและปาร์ตี้จะยังคงอยู่)',
    confirmText: 'ยืนยันถอดทุกคน',
    onConfirm: async () => {
      siegeParties.forEach(p => {
        p.slots = [null, null, null, null, null];
      });
      selectedSiegeSource = null;
      renderSiegeBoard();
      showToast('ถอดสมาชิกออกจากทัพชิงปราสาททั้งหมดเรียบร้อย', 'info');
      if (typeof triggerAutoSaveImmediate === 'function') await triggerAutoSaveImmediate('ถอดทุกคนออกจากทัพ Siege War');
    }
  });
}

function resetDefaultSiegeTeamsStructure() {
  openCustomDialog({
    title: '🔄 รีเซ็ตโครงสร้างทัพ Siege War',
    message: 'ต้องการรีเซ็ตโครงสร้างทัพกลับเป็น 4 ทัพมาตรฐาน (ทัพบุกหลัก, ทัพป้องกัน, ทัพดักหน้าวาป, ทัพกองหนุน) หรือไม่?\n(สมาชิกจะถูกย้ายกลับกองกลาง)',
    confirmText: 'ยืนยันรีเซ็ต',
    onConfirm: () => {
      initDefaultSiegeTeamsAndParties();
      currentSiegeTeamFilter = 'all';
      selectedSiegeSource = null;
      renderSiegeBoard();
      showToast('รีเซ็ตโครงสร้าง 4 ทัพมาตรฐานเรียบร้อย', 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('รีเซ็ตโครงสร้างทัพ Siege War');
    }
  });
}

// Smart Auto-Assign for Siege War
function autoAssignSiegeByGearAndRole() {
  openCustomDialog({
    title: '⚡ จัดทัพ Siege War สมดุลอัตโนมัติ',
    message: 'ระบบจะจัดสรรสมาชิกตามบทบาทกลยุทธ์ชิงปราสาท:\n• ทัพบุกหลัก: Top DPS (Assassin, Sniper, LK) + พระ + แทงค์\n• ทัพป้องกันห้องหิน: พระ + พาลาดิน + วิซาร์ดเวทกว้าง + แดนเซอร์\n• ทัพดักหน้าวาป: คลาวด์ + สตอล์กเกอร์ + ไวท์สมิธ\nต้องการเริ่มจัดสมดุลหรือไม่?',
    confirmText: 'เริ่มจัดอัตโนมัติ',
    onConfirm: () => {
      siegeParties.forEach(p => { p.slots = [null, null, null, null, null]; });

      const sortedMembers = [...members].sort((a, b) => b.gear - a.gear);
      const healers = sortedMembers.filter(m => getJobMeta(m.job).role === 'healer');
      const tanks = sortedMembers.filter(m => getJobMeta(m.job).role === 'tank');
      const bards = sortedMembers.filter(m => getJobMeta(m.job).role === 'bard');
      const dps = sortedMembers.filter(m => getJobMeta(m.job).role === 'dps');

      // 1. Give 1 Healer per party
      siegeParties.forEach(p => {
        if (healers.length && p.slots[0] === null) {
          p.slots[0] = healers.shift().id;
        }
      });

      // 2. Put 1 Tank in Defense parties first, then others
      siegeParties.forEach(p => {
        const isDefense = (p.teamName || '').includes('ป้องกัน') || (p.teamName || '').includes('Defense');
        if (isDefense && tanks.length && p.slots[1] === null) {
          p.slots[1] = tanks.shift().id;
        }
      });
      siegeParties.forEach(p => {
        if (tanks.length && p.slots[1] === null) {
          p.slots[1] = tanks.shift().id;
        }
      });

      // 3. Put Bards / Dancers
      siegeParties.forEach(p => {
        if (bards.length) {
          const emptyIdx = p.slots.indexOf(null);
          if (emptyIdx !== -1) p.slots[emptyIdx] = bards.shift().id;
        }
      });

      // 4. Fill remaining slots with remaining pool by Gear
      const remaining = [...dps, ...healers, ...tanks, ...bards].sort((a, b) => b.gear - a.gear);
      siegeParties.forEach(p => {
        for (let i = 0; i < 5; i++) {
          if (p.slots[i] === null && remaining.length) {
            p.slots[i] = remaining.shift().id;
          }
        }
      });

      renderSiegeBoard();
      showToast('จัดทัพ Siege War อัตโนมัติสำเร็จ', 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('จัดทัพ Siege War อัตโนมัติ');
    }
  });
}

// Drag & Drop
function bindSiegeDragAndDrop() {
  const poolCards = document.querySelectorAll('[data-siege-source="pool"]');
  poolCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      const mId = card.getAttribute('data-siege-id');
      e.dataTransfer.setData('text/plain', JSON.stringify({ siegeSource: 'pool', mId }));
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  const slotCards = document.querySelectorAll('[data-siege-source="slot"]');
  slotCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      const pId = card.getAttribute('data-siege-party-id');
      const slotIdx = parseInt(card.getAttribute('data-siege-slot-index'));
      const mId = card.getAttribute('data-siege-id');
      e.dataTransfer.setData('text/plain', JSON.stringify({ siegeSource: 'slot', pId, slotIdx, mId }));
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  const dropTargets = document.querySelectorAll('[data-siege-drop-target="slot"], [data-siege-source="slot"]');
  dropTargets.forEach(slotEl => {
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      slotEl.classList.add('ring-2', 'ring-amber-400');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('ring-2', 'ring-amber-400');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('ring-2', 'ring-amber-400');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        const targetPartyId = slotEl.getAttribute('data-siege-party-id');
        const targetSlotIndex = parseInt(slotEl.getAttribute('data-siege-slot-index'));

        const targetParty = siegeParties.find(x => x.id === targetPartyId);
        if (!targetParty) return;

        if (payload.siegeSource === 'pool') {
          targetParty.slots[targetSlotIndex] = payload.mId;
          renderSiegeBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดผังทัพ Siege War');
          return;
        }

        if (payload.siegeSource === 'slot') {
          const srcParty = siegeParties.find(x => x.id === payload.pId);
          if (srcParty) {
            const temp = targetParty.slots[targetSlotIndex];
            targetParty.slots[targetSlotIndex] = srcParty.slots[payload.slotIdx];
            srcParty.slots[payload.slotIdx] = temp;
          }
          renderSiegeBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดผังทัพ Siege War');
        }
      } catch (err) {}
    });
  });

  // Drop back to Unassigned Pool to remove member from slot
  const poolZone = document.getElementById('siegeUnassignedPoolList');
  if (poolZone) {
    poolZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      poolZone.classList.add('ring-2', 'ring-amber-400');
    });

    poolZone.addEventListener('dragleave', () => {
      poolZone.classList.remove('ring-2', 'ring-amber-400');
    });

    poolZone.addEventListener('drop', (e) => {
      e.preventDefault();
      poolZone.classList.remove('ring-2', 'ring-amber-400');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        if (payload.siegeSource === 'slot') {
          const srcParty = siegeParties.find(x => x.id === payload.pId);
          if (srcParty) {
            srcParty.slots[payload.slotIdx] = null;
            renderSiegeBoard();
            if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากตี้ Siege War');
          }
        }
      } catch (err) {}
    });
  }
}

// ============================================================================
// SIEGE WAR (ศึกชิงปราสาท) IMAGE EXPORT (PNG) GENERATOR
// ============================================================================
function openExportImageModal(initialFilter = 'all') {
  syncSiegeTeamMetadataToParties();
  syncMembersStatusForSelectedDate();

  const selectEl = document.getElementById('exportTeamSelect');
  if (selectEl) {
    selectEl.innerHTML =
      `<option value="all">🏰 ทัพศึกชิงปราสาทรวม (1 ทีม 8 ปาร์ตี้)</option>` +
      `<option value="split_teams">📋 แยกตาม 4 ทัพกลยุทธ์ (ทัพละ 2 ปาร์ตี้)</option>` +
      siegeTeams.map(t => `<option value="${t.id}">เฉพาะ ${t.name} (${siegeParties.filter(p => p.teamId === t.id).length} ตี้)</option>`).join('');

    const validValues = new Set(['all', 'split_teams', ...siegeTeams.map(t => t.id)]);
    selectEl.value = validValues.has(initialFilter) ? initialFilter : 'all';
  }

  const modal = document.getElementById('exportImageModal');
  if (modal) modal.classList.remove('hidden');
  renderExportPosterPreview();
}

function closeExportImageModal() {
  const modal = document.getElementById('exportImageModal');
  if (modal) modal.classList.add('hidden');
}

function renderSiegeExportTeamBlockHtml(team, showGear, showStatus) {
  const theme = getTeamTheme(team.color);
  const teamParties = siegeParties.filter(p => p.teamId === team.id);
  const teamMembers = [];
  teamParties.forEach(p => {
    (p.slots || []).forEach(mId => {
      const m = members.find(x => x.id === mId);
      if (m) teamMembers.push(m);
    });
  });
  const teamTotalGear = teamMembers.reduce((s, m) => s + (m.gear || 0), 0);

  const partyCardsHtml = teamParties.map(p => {
    const presentMembers = (p.slots || []).map(id => members.find(m => m.id === id)).filter(Boolean);
    const totalPartyGear = presentMembers.reduce((s, m) => s + (m.gear || 0), 0);

    const slotsRowsHtml = (p.slots || []).map((mId, sIdx) => {
      const m = members.find(x => x.id === mId);
      if (!m) {
        return `
          <div style="background: rgba(15, 23, 42, 0.55); border: 1px dashed rgba(71, 85, 105, 0.6);" class="h-11 rounded-xl px-3 flex items-center justify-between text-xs text-slate-500">
            <span>ช่องว่างที่ ${sIdx + 1}</span>
            <span class="text-[10px] opacity-60">-</span>
          </div>
        `;
      }

      const meta = getJobMeta(m.job);
      const isLeave = m.status === 'leave';

      let statusPill = '';
      if (showStatus) {
        if (isLeave) {
          statusPill = `<span style="background: rgba(244,63,94,0.25); border: 1px solid rgba(244,63,94,0.5); color: #fecdd3;" class="px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap">🏖️ ลา: ${m.leaveReason || 'วันนี้'}</span>`;
        } else {
          statusPill = `<span style="color: #6ee7b7;" class="text-[10px] font-medium whitespace-nowrap">● พร้อมวอร์</span>`;
        }
      }

      const gearPill = showGear
        ? `<span style="background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.3); color: #fde68a;" class="mono px-2 py-0.5 rounded-lg text-xs font-bold shrink-0">${m.gear.toLocaleString()}</span>`
        : '';

      return `
        <div style="${meta.cardTintStyle}" class="py-1.5 px-3 rounded-xl border flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            ${renderJobEmblem(m.job, 32)}
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="flex items-center justify-between gap-2">
                <span style="${meta.namePillStyle}" class="px-2 py-0.5 rounded font-bold text-sm truncate ${isLeave ? 'line-through opacity-75' : ''}">${m.name}</span>
                <span class="mono text-[10px] text-slate-300 font-semibold shrink-0">Lv.${m.lv}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span style="${meta.badgeStyle}" class="px-1.5 py-0.2 rounded text-[9px] font-medium border truncate">${m.job}</span>
                <div class="shrink-0">${statusPill}</div>
              </div>
            </div>
          </div>
          ${gearPill}
        </div>
      `;
    }).join('');

    return `
      <div style="background: rgba(9, 13, 24, 0.92); border: 1px solid ${theme.hexAccent}66;" class="rounded-2xl p-3 flex flex-col gap-2">
        <div style="background: ${theme.hexHeaderBg}; border-bottom: 1px solid ${theme.hexAccent}44;" class="-mx-3 -mt-3 px-3.5 py-2 rounded-t-2xl flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span style="background: ${theme.hexAccent}; color: #ffffff;" class="px-2 py-0.5 rounded text-[10px] font-bold">${team.name}</span>
            <span class="font-bold text-xs sm:text-sm text-white">${p.name}</span>
          </div>
          <div class="text-[11px] text-slate-200">
            ${showGear ? `ผลรวม <strong class="mono text-amber-300">${totalPartyGear.toLocaleString()}</strong> • ` : ''}<span>${presentMembers.length}/5 คน</span>
          </div>
        </div>
        <div class="space-y-1.5">
          ${slotsRowsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="background: ${theme.hexBgSoft}; border: 2px solid ${theme.hexAccent}88;" class="rounded-3xl p-5 space-y-4 shadow-xl">
      <div style="background: ${theme.hexHeaderBg}; border: 1px solid ${theme.hexAccent}66;" class="px-5 py-3 rounded-2xl flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <span style="background: ${theme.hexAccent};" class="w-4 h-4 rounded-full inline-block shadow"></span>
          <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">${team.name}</h3>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/75 px-3 py-1 rounded-xl border border-slate-800">
          <span>ปาร์ตี้: <strong class="text-white">${teamParties.length} ตี้</strong></span>
          <span>•</span>
          <span>สมาชิก: <strong class="text-amber-400">${teamMembers.length}/${teamParties.length * 5} คน</strong></span>
          ${showGear ? `<span>•</span><span>ผลรวม Gear: <strong class="mono text-amber-300">${teamTotalGear.toLocaleString()}</strong></span>` : ''}
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        ${partyCardsHtml}
      </div>
    </div>
  `;
}

function renderSiegeExportUnified8PartiesBlockHtml(showGear, showStatus) {
  const rowLayoutVal = document.getElementById('exportRowLayoutSelect')?.value || '8';
  const is8Cols = rowLayoutVal === '8';

  const allSiegeMembers = [];
  siegeParties.forEach(p => {
    (p.slots || []).forEach(mId => {
      const m = members.find(x => x.id === mId);
      if (m) allSiegeMembers.push(m);
    });
  });
  const totalSiegeGear = allSiegeMembers.reduce((s, m) => s + (m.gear || 0), 0);

  const partyCardsHtml = siegeParties.map((p, pIdx) => {
    const parentTeam = siegeTeams.find(t => t.id === p.teamId) || { name: 'ทัพชิงปราสาท', color: 'rose' };
    const theme = getTeamTheme(parentTeam.color || 'rose');
    const presentMembers = (p.slots || []).map(id => members.find(m => m.id === id)).filter(Boolean);
    const totalPartyGear = presentMembers.reduce((s, m) => s + (m.gear || 0), 0);

    const slotsRowsHtml = (p.slots || []).map((mId, sIdx) => {
      const m = members.find(x => x.id === mId);
      if (!m) {
        return `
          <div style="background: rgba(15, 23, 42, 0.55); border: 1px dashed rgba(71, 85, 105, 0.6);" class="${is8Cols ? 'h-9 px-2 text-[10px]' : 'h-11 px-3 text-xs'} rounded-xl flex items-center justify-between text-slate-500">
            <span>ช่องว่าง #${sIdx + 1}</span>
            <span class="text-[9px] opacity-60">-</span>
          </div>
        `;
      }

      const meta = getJobMeta(m.job);
      const isLeave = m.status === 'leave';

      let statusPill = '';
      if (showStatus) {
        if (isLeave) {
          statusPill = `<span style="background: rgba(244,63,94,0.25); border: 1px solid rgba(244,63,94,0.5); color: #fecdd3;" class="${is8Cols ? 'px-1 text-[8px]' : 'px-1.5 py-0.5 text-[10px]'} rounded font-semibold whitespace-nowrap">🏖️ ลา</span>`;
        } else {
          statusPill = `<span style="color: #6ee7b7;" class="${is8Cols ? 'text-[8.5px]' : 'text-[10px]'} font-medium whitespace-nowrap">● พร้อม</span>`;
        }
      }

      const gearPill = showGear
        ? `<span style="background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.3); color: #fde68a;" class="mono ${is8Cols ? 'px-1 py-0.2 text-[9px]' : 'px-2 py-0.5 text-xs'} rounded-lg font-bold shrink-0">${m.gear.toLocaleString()}</span>`
        : '';

      return `
        <div style="${meta.cardTintStyle}" class="${is8Cols ? 'py-1 px-1.5' : 'py-1.5 px-3'} rounded-xl border flex items-center justify-between gap-1.5">
          <div class="flex items-center gap-1.5 min-w-0 flex-1">
            ${renderJobEmblem(m.job, is8Cols ? 24 : 32)}
            <div class="min-w-0 flex-1 space-y-0.5">
              <div class="flex items-center justify-between gap-1">
                <span style="${meta.namePillStyle}" class="${is8Cols ? 'px-1 py-0.2 text-xs' : 'px-2 py-0.5 text-sm'} rounded font-bold truncate ${isLeave ? 'line-through opacity-75' : ''}">${m.name}</span>
                <span class="mono ${is8Cols ? 'text-[9px]' : 'text-[10px]'} text-slate-300 font-semibold shrink-0">Lv.${m.lv}</span>
              </div>
              <div class="flex items-center justify-between gap-1">
                <span style="${meta.badgeStyle}" class="${is8Cols ? 'px-1 text-[8px]' : 'px-1.5 py-0.2 text-[9px]'} rounded font-medium border truncate">${m.job}</span>
                <div class="shrink-0">${statusPill}</div>
              </div>
            </div>
          </div>
          ${gearPill}
        </div>
      `;
    }).join('');

    const shortRole = parentTeam.name.replace(/^[^\s]+\s+/, '').split('/')[0].trim();

    return `
      <div style="background: rgba(9, 13, 24, 0.92); border: 1px solid ${theme.hexAccent}66;" class="rounded-2xl ${is8Cols ? 'p-2 gap-1.5' : 'p-3 gap-2'} flex flex-col shadow-md">
        <div style="background: ${theme.hexHeaderBg}; border-bottom: 1px solid ${theme.hexAccent}44;" class="${is8Cols ? '-mx-2 -mt-2 px-2.5 py-1.5' : '-mx-3 -mt-3 px-3.5 py-2'} rounded-t-2xl flex items-center justify-between gap-1">
          <div class="flex items-center gap-1 min-w-0">
            <span style="background: ${theme.hexAccent}; color: #ffffff;" class="px-1.5 py-0.2 rounded text-[9px] font-bold truncate max-w-[95px]" title="${parentTeam.name}">${shortRole || parentTeam.name}</span>
            <span class="font-bold ${is8Cols ? 'text-[11px]' : 'text-xs sm:text-sm'} text-white truncate">${p.name || `ปาร์ตี้ ${pIdx + 1}`}</span>
          </div>
          <div class="${is8Cols ? 'text-[9.5px]' : 'text-[11px]'} text-slate-200 shrink-0">
            ${showGear ? `<strong class="mono text-amber-300">${totalPartyGear.toLocaleString()}</strong> • ` : ''}<span>${presentMembers.length}/5</span>
          </div>
        </div>
        <div class="space-y-1">
          ${slotsRowsHtml}
        </div>
      </div>
    `;
  }).join('');

  const gridContainerStyle = is8Cols
    ? 'display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 8px;'
    : 'display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;';

  return `
    <div style="background: rgba(15, 23, 42, 0.78); border: 2px solid rgba(244, 63, 94, 0.7);" class="rounded-3xl p-5 space-y-4 shadow-2xl">
      <div style="background: linear-gradient(135deg, rgba(244,63,94,0.35) 0%, rgba(30,41,59,0.95) 100%); border: 1px solid rgba(244, 63, 94, 0.55);" class="px-5 py-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-950/80 border border-rose-500/50 flex items-center justify-center text-2xl shadow">
            🏰
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base sm:text-lg font-extrabold text-white tracking-wide">ทัพศึกชิงปราสาท (Siege War)</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow">
                ${is8Cols ? '1 แถว 8 ปาร์ตี้เต็มอัตรา' : '1 ทีม 8 ปาร์ตี้เต็มอัตรา'} (${siegeParties.length} ปาร์ตี้)
              </span>
            </div>
            <p class="text-xs text-rose-200/80">ผังจัดทัพกลยุทธ์ชิงปราสาทครอบคลุมทั้ง ${siegeParties.length} ปาร์ตี้ (${siegeParties.length * 5} สล็อต)</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/85 px-4 py-2 rounded-xl border border-slate-800">
          <span>ปาร์ตี้: <strong class="text-white">${siegeParties.length} ตี้</strong></span>
          <span>•</span>
          <span>สมาชิกในทัพ: <strong class="text-amber-400">${allSiegeMembers.length}/${siegeParties.length * 5} คน</strong></span>
          ${showGear ? `<span>•</span><span>ผลรวม Gear: <strong class="mono text-amber-300">${totalSiegeGear.toLocaleString()}</strong></span>` : ''}
        </div>
      </div>

      <div style="${gridContainerStyle}">
        ${partyCardsHtml}
      </div>
    </div>
  `;
}

function renderExportPosterPreview() {
  syncSiegeTeamMetadataToParties();
  syncMembersStatusForSelectedDate();

  const teamFilterVal = document.getElementById('exportTeamSelect')?.value || 'all';
  const posterWidth = parseInt(document.getElementById('exportWidthSelect')?.value || '1680', 10);
  const showGear = document.getElementById('exportOptShowGear')?.checked ?? true;
  const showStatus = document.getElementById('exportOptShowStatus')?.checked ?? true;
  const showLeaveFooter = document.getElementById('exportOptShowLeaveFooter')?.checked ?? true;

  const boardEl = document.getElementById('exportPosterBoard');
  if (!boardEl) return;

  boardEl.style.width = `${posterWidth}px`;
  boardEl.style.minWidth = `${posterWidth}px`;

  const assignedSet = getSiegeAssignedSet();
  const leaveList = members.filter(m => m.status === 'leave');

  let teamsHtml = '';
  if (teamFilterVal === 'all') {
    teamsHtml = renderSiegeExportUnified8PartiesBlockHtml(showGear, showStatus);
  } else if (teamFilterVal === 'split_teams') {
    teamsHtml = siegeTeams.map(t => renderSiegeExportTeamBlockHtml(t, showGear, showStatus)).join('');
  } else {
    const targetTeams = siegeTeams.filter(t => t.id === teamFilterVal);
    teamsHtml = targetTeams.map(t => renderSiegeExportTeamBlockHtml(t, showGear, showStatus)).join('');
  }

  let leaveFooterHtml = '';
  if (showLeaveFooter && leaveList.length > 0) {
    leaveFooterHtml = `
      <div style="background: rgba(244, 63, 94, 0.08); border: 2px solid rgba(244, 63, 94, 0.35);" class="rounded-2xl p-4 space-y-2.5">
        <div class="flex items-center justify-between border-b border-rose-500/30 pb-2">
          <span class="font-bold text-sm text-rose-300 flex items-center gap-1.5">
            <span>🏖️ สรุปรายชื่อสมาชิกที่แจ้งลาประจำวัน (${selectedDate})</span>
          </span>
          <span class="mono text-xs font-bold text-rose-400">${leaveList.length} คน</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          ${leaveList.map(lm => `
            <div class="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span class="font-medium text-slate-200 truncate">${lm.name}</span>
              <span class="text-[10px] text-rose-300 truncate">${lm.leaveReason || 'ลา'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  boardEl.innerHTML = `
    <!-- Poster Top Header -->
    <div class="flex items-center justify-between border-b border-slate-700/80 pb-5">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🏰</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-300">
            ผังทัพศึกชิงปราสาท (Siege War) — กิลด์ ${guildName}
          </h1>
        </div>
        <p class="text-xs text-slate-400">
          ประจำวันที่: <strong class="text-rose-300">${formatThaiDateFull(selectedDate)}</strong> • ไฟล์ซิงค์: ${fileTimestamp}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
          <div class="text-[10px] text-slate-400">สมาชิกทั้งหมด</div>
          <div class="mono font-bold text-base text-white">${members.length} คน</div>
        </div>
        <div class="bg-slate-900 border border-rose-500/40 rounded-xl px-4 py-2 text-center">
          <div class="text-[10px] text-rose-300">จัดลงทัพแล้ว</div>
          <div class="mono font-bold text-base text-rose-400">${assignedSet.size} คน</div>
        </div>
      </div>
    </div>

    <!-- Teams Hierarchy Section -->
    <div class="space-y-6">
      ${teamsHtml}
    </div>

    <!-- Leave Summary Footer -->
    ${leaveFooterHtml}
  `;
}

async function generatePosterCanvas() {
  const boardEl = document.getElementById('exportPosterBoard');
  if (!boardEl || typeof html2canvas === 'undefined') {
    throw new Error('ไม่พบไลบรารีสร้างรูปภาพ');
  }
  const posterWidth = parseInt(document.getElementById('exportWidthSelect')?.value || '1680', 10);
  return await html2canvas(boardEl, {
    scale: 2,
    backgroundColor: '#0b0f19',
    useCORS: true,
    logging: false,
    width: posterWidth,
    windowWidth: posterWidth + 200
  });
}

async function downloadExportedTeamImage() {
  const btn = document.getElementById('btnDownloadExportImg');
  const origHtml = btn ? btn.innerHTML : '';
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳ กำลังสร้างรูปภาพ...</span>`;
    }
    showToast('📸 กำลังประมวลผลรูปภาพผังทัพชิงปราสาทความละเอียดสูง...', 'info');

    const canvas = await generatePosterCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    const selectEl = document.getElementById('exportTeamSelect');
    const filterVal = selectEl ? selectEl.value : 'all';
    let teamSuffix = '_1ทีม8ปาร์ตี้';
    if (filterVal === 'split_teams') {
      teamSuffix = '_แยกตามทัพกลยุทธ์';
    } else if (filterVal !== 'all') {
      const teamObj = siegeTeams.find(t => t.id === filterVal);
      if (teamObj) teamSuffix = `_${teamObj.name.replace(/\s+/g, '')}`;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ผังทัพชิงปราสาท_SiegeWar_${guildName.replace(/\s+/g, '')}${teamSuffix}_${selectedDate}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('✅ ดาวน์โหลดรูปภาพผังทัพชิงปราสาท (.PNG) สำเร็จแล้ว!', 'success');
  } catch (err) {
    console.error('Export Image Error:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างรูปภาพ กรุณาลองใหม่อีกครั้ง', 'danger');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  }
}
