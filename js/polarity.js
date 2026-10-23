// ============================================================================
// POLARITY ZONE (ทีมดาว) TACTICAL BOARD & PARTY BUILDER LOGIC
// ============================================================================

let polarityTeams = [];
let polarityParties = [];
let currentPolarityTeamFilter = 'all';
let activePolarityJobBarFamily = 'all';
let selectedPolaritySource = null;
let selectedPolaritySlot = null;

// Initialize default Star Teams
function initDefaultPolarityTeamsAndParties() {
  polarityTeams = [
    { id: 'star_team_1', name: '🌟 ทีมดาว 1 (Star 1)', color: 'amber' },
    { id: 'star_team_2', name: '🌟 ทีมดาว 2 (Star 2)', color: 'purple' },
    { id: 'star_team_3', name: '🌟 ทีมดาว 3 (Star 3)', color: 'cyan' },
    { id: 'star_team_4', name: '🌟 ทีมดาว 4 (Star 4)', color: 'rose' }
  ];

  polarityParties = [];
  polarityTeams.forEach((t) => {
    for (let pNum = 1; pNum <= 2; pNum++) {
      polarityParties.push({
        id: `pol_p_${t.id}_${pNum}`,
        name: `ปาร์ตี้ ${pNum}`,
        teamId: t.id,
        teamName: t.name,
        teamColor: t.color,
        category: 'polarity',
        slots: [null, null, null, null, null]
      });
    }
  });
}

function syncPolarityTeamMetadataToParties() {
  polarityParties.forEach(p => {
    const parentTeam = polarityTeams.find(t => t.id === p.teamId);
    if (parentTeam) {
      p.teamName = parentTeam.name;
      p.teamColor = parentTeam.color;
      p.category = 'polarity';
    }
  });
}

window.getActivePolarityParties = function() {
  syncPolarityTeamMetadataToParties();
  return polarityParties.map(p => ({ ...p, category: 'polarity' }));
};

window.rebuildPolarityTeamsFromLoadedParties = function(loadedParties) {
  if (!Array.isArray(loadedParties) || loadedParties.length === 0) {
    initDefaultPolarityTeamsAndParties();
    return;
  }

  const teamMap = new Map();
  loadedParties.forEach(p => {
    if (!teamMap.has(p.teamId)) {
      teamMap.set(p.teamId, {
        id: p.teamId,
        name: p.teamName || '🌟 ทีมดาว 1',
        color: p.teamColor || 'amber'
      });
    }
  });

  polarityTeams = Array.from(teamMap.values());
  polarityParties = loadedParties.map((p, idx) => ({
    id: p.id || `pol_p_${idx}`,
    name: p.name || `ปาร์ตี้ ${(idx % 2) + 1}`,
    teamId: p.teamId || polarityTeams[0].id,
    teamName: p.teamName || polarityTeams[0].name,
    teamColor: p.teamColor || polarityTeams[0].color,
    category: 'polarity',
    slots: Array.isArray(p.slots) ? p.slots : [null, null, null, null, null]
  }));
  syncPolarityTeamMetadataToParties();
};

function selectPolarityJobBarFamily(familyKey) {
  activePolarityJobBarFamily = (activePolarityJobBarFamily === familyKey) ? 'all' : familyKey;
  renderPolarityJobEmblemBar();
  renderPolarityBoard();
}

function renderPolarityJobEmblemBar() {
  const bar = document.getElementById('polarityJobEmblemBarContainer');
  if (!bar) return;

  const assignedSet = getPolarityAssignedSet();
  const unassignedMembers = members.filter(m => !assignedSet.has(m.id));

  const familyCounts = {};
  JOB_FAMILIES.forEach(f => { familyCounts[f.familyKey] = 0; });
  unassignedMembers.forEach(m => {
    const fKey = getJobFamily(m.job).familyKey;
    if (familyCounts[fKey] !== undefined) familyCounts[fKey]++;
  });

  const resetBtn = document.getElementById('resetPolarityJobBarBtn');
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', activePolarityJobBarFamily === 'all');
  }

  bar.innerHTML = JOB_FAMILIES.map(fam => {
    const count = familyCounts[fam.familyKey] || 0;
    const isSelected = activePolarityJobBarFamily === fam.familyKey;
    const activeClasses = isSelected
      ? 'bg-[#363d4e] border-slate-500 ring-2 ring-amber-400/80 shadow-lg'
      : 'bg-transparent border-transparent hover:bg-[#272c3a]';

    return `
      <button onclick="selectPolarityJobBarFamily('${fam.familyKey}')" class="group relative flex flex-col items-center justify-center min-w-[74px] sm:min-w-[82px] px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${activeClasses}" title="${fam.label} (${fam.jobs.join(' / ')}) — ${count} คน">
        ${count > 0 ? `<span class="absolute top-1 right-1.5 mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-950/90 text-amber-300 border border-slate-700">${count}</span>` : ''}
        <div class="transform group-hover:scale-110 transition duration-200">
          ${renderJobEmblem(fam.jobs[0], 42)}
        </div>
        <span class="mt-1.5 text-xs font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}">${fam.label}</span>
      </button>
    `;
  }).join('');
}

function getPolarityAssignedSet() {
  const set = new Set();
  polarityParties.forEach(p => {
    p.slots.forEach(mId => {
      if (mId) set.add(mId);
    });
  });
  return set;
}

function setPolarityTeamFilter(teamId) {
  currentPolarityTeamFilter = teamId;
  renderPolarityFilterBar();
  renderPolarityBoard();
}

function renderPolarityFilterBar() {
  const container = document.getElementById('polarityTeamFilterButtons');
  if (!container) return;

  const totalAssigned = getPolarityAssignedSet().size;
  const totalCapacity = polarityParties.length * 5;

  let html = `
    <button onclick="setPolarityTeamFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${currentPolarityTeamFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'}">
      ทุกทีมดาว (${polarityTeams.length} ทีม • ${totalAssigned}/${totalCapacity} คน)
    </button>
  `;

  polarityTeams.forEach(t => {
    const isAct = (currentPolarityTeamFilter === t.id);
    const theme = getTeamTheme(t.color);
    const pInTeam = polarityParties.filter(p => p.teamId === t.id);
    let countInTeam = 0;
    pInTeam.forEach(p => p.slots.forEach(s => { if (s) countInTeam++; }));

    html += `
      <button onclick="setPolarityTeamFilter('${t.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${isAct ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'}">
        <span class="w-2 h-2 rounded-full ${theme.dotClass}"></span>
        <span>${t.name} (${countInTeam}/${pInTeam.length * 5})</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function renderPolarityBoard() {
  syncPolarityTeamMetadataToParties();
  renderPolarityFilterBar();

  const assignedSet = getPolarityAssignedSet();
  const q = (document.getElementById('polarityPoolSearch')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('polarityPoolRoleFilter')?.value || 'all';

  const unassigned = members
    .filter(m => !assignedSet.has(m.id))
    .filter(m => roleFilter === 'all' ? true : getJobMeta(m.job).role === roleFilter)
    .filter(m => activePolarityJobBarFamily === 'all' ? true : getJobFamily(m.job).familyKey === activePolarityJobBarFamily)
    .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || (m.position || '').toLowerCase().includes(q))
    .sort((a, b) => b.gear - a.gear);

  const badgeEl = document.getElementById('polarityUnassignedCountBadge');
  if (badgeEl) badgeEl.textContent = unassigned.length;

  const poolEl = document.getElementById('polarityUnassignedPoolList');
  if (poolEl) {
    poolEl.innerHTML = unassigned.map(m => {
      const meta = getJobMeta(m.job);
      const isSelected = selectedPolaritySource && selectedPolaritySource.memberId === m.id;
      return `
        <div onclick="handlePolarityPoolClick('${m.id}')"
             draggable="true"
             data-pol-source="pool"
             data-pol-id="${m.id}"
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

  // Render Polarity Teams Cards with Image 1 layout
  const container = document.getElementById('polarityTeamsHierarchyContainer');
  if (!container) return;

  const filteredTeams = (currentPolarityTeamFilter === 'all')
    ? polarityTeams
    : polarityTeams.filter(t => t.id === currentPolarityTeamFilter);

  container.innerHTML = filteredTeams.map(team => renderPolarityTeamCardHtml(team)).join('') || `
    <div class="py-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      <div class="text-3xl mb-2">⚡</div>
      <div class="font-bold text-white">ยังไม่มีทีมดาวในรายการนี้</div>
      <button onclick="openCreatePolarityTeamModal()" class="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition">
        ➕ สร้างทีมดาวใหม่
      </button>
    </div>
  `;

  bindPolarityDragAndDrop();
}

// Layout structured exactly like Image 1 (vertical party cards with 5 slots)
function renderPolarityTeamCardHtml(team) {
  const theme = getTeamTheme(team.color);
  const teamParties = polarityParties.filter(p => p.teamId === team.id);

  const teamMembers = [];
  teamParties.forEach(p => {
    p.slots.forEach(mId => {
      const m = members.find(x => x.id === mId);
      if (m) teamMembers.push(m);
    });
  });

  const teamTotalGear = teamMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

  const colorDotsHtml = Object.values(TEAM_COLORS).map(c => `
    <button onclick="setPolarityTeamColor('${team.id}', '${c.key}')" title="เปลี่ยนสีทีมเป็น ${c.name}" class="w-4 h-4 rounded-full ${c.dotClass} transition transform hover:scale-125 ${team.color === c.key ? 'ring-2 ring-white scale-110' : 'opacity-65 hover:opacity-100'}"></button>
  `).join('');

  const partiesCardsHtml = teamParties.map(p => {
    const presentMembers = p.slots.map(id => members.find(m => m.id === id) || null).filter(Boolean);
    const hasHealer = presentMembers.some(m => getJobMeta(m.job).role === 'healer');
    const totalPartyGear = presentMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

    const moveOptionsHtml = polarityTeams.map(tOpt => `
      <option value="${tOpt.id}" ${tOpt.id === team.id ? 'selected' : ''}>ย้ายไป: ${tOpt.name}</option>
    `).join('');

    const slotsHtml = p.slots.map((mId, slotIdx) => {
      const m = members.find(x => x.id === mId);
      const isSelected = selectedPolaritySource && selectedPolaritySource.partyId === p.id && selectedPolaritySource.slotIndex === slotIdx;

      if (!m) {
        return `
          <div onclick="handlePolaritySlotClick('${p.id}', ${slotIdx})"
               data-pol-drop-target="slot"
               data-pol-party-id="${p.id}"
               data-pol-slot-index="${slotIdx}"
               class="h-11 rounded-xl border border-dashed border-slate-700/80 hover:border-amber-400/70 bg-slate-950/50 px-2.5 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer transition ${isSelected ? 'slot-selected' : ''}">
            <span class="truncate">+ ช่องว่างที่ ${slotIdx + 1} (แตะวาง)</span>
            <span class="text-[10px] opacity-60 shrink-0 ml-1">${team.name}</span>
          </div>
        `;
      }

      const meta = getJobMeta(m.job);
      return `
        <div onclick="handlePolaritySlotClick('${p.id}', ${slotIdx})"
             draggable="true"
             data-pol-source="slot"
             data-pol-party-id="${p.id}"
             data-pol-slot-index="${slotIdx}"
             data-pol-id="${m.id}"
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
            <button onclick="event.stopPropagation(); removeMemberFromPolaritySlot('${p.id}', ${slotIdx})" title="ถอดออกจากตี้" class="w-5 h-5 rounded hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs flex items-center justify-center">✕</button>
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
              <button onclick="renamePolarityParty('${p.id}')" title="เปลี่ยนชื่อปาร์ตี้" class="text-slate-400 hover:text-white text-xs shrink-0">✏️</button>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              ${presentMembers.length > 0 ? `<button onclick="clearSinglePolarityParty('${p.id}')" title="ถอดคนในตี้นี้ออกทั้งหมด" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">ล้าง</button>` : ''}
              <button onclick="deletePolarityParty('${p.id}')" title="ลบปาร์ตี้นี้" class="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] transition">🗑️</button>
            </div>
          </div>

          <!-- Row 2: 📥 ตี้ประจำ + ย้ายไป dropdown -->
          <div class="flex items-center justify-between gap-1.5 pt-0.5">
            <button onclick="openImportPresetModal('${p.id}', 'polarity')" title="ดึงสมาชิกจากตี้ประจำ" class="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition flex items-center gap-1">
              <span>📥 ตี้ประจำ</span>
            </button>
            <div class="flex items-center gap-1 min-w-0">
              <select onchange="movePartyToPolarityTeam('${p.id}', this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[130px] truncate">
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
            <button onclick="renamePolarityTeam('${team.id}')" title="เปลี่ยนชื่อทีม" class="text-slate-300 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/70">✏️ เปลี่ยนชื่อ</button>
            <button onclick="openExportImageModal('${team.id}')" title="ส่งออกรูปเฉพาะทีมดาวนี้" class="text-slate-300 hover:text-amber-300 text-xs px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/80 transition flex items-center gap-1">📸 รูปทีมนี้</button>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
            <span>ปาร์ตี้ในทีมดาว: <strong class="text-white">${teamParties.length} ตี้</strong></span>
            <span>•</span>
            <span>สมาชิก: <strong class="text-emerald-400">${teamMembers.length}/${teamParties.length * 5} คน</strong></span>
            <span>•</span>
            <span>ผลรวม Gear: <strong class="mono text-amber-300">${teamTotalGear.toLocaleString()}</strong></span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span class="text-[11px] text-slate-400 mr-1">🎨 สีทีม:</span>
            ${colorDotsHtml}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button onclick="addPartyToPolarityTeam('${team.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${theme.buttonClass} shadow">
              + เพิ่มปาร์ตี้ใน ${team.name}
            </button>
            <button onclick="renumberPolarityPartiesInTeam('${team.id}')" title="รันเลขปาร์ตี้ 1, 2, 3, 4 ใหม่" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">
              🔢 รันเลขตี้ 1-N
            </button>
            <button onclick="deletePolarityTeam('${team.id}')" title="ลบทีมดาวนี้" class="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs transition">
              🗑️ ลบทีม
            </button>
          </div>
        </div>
      </div>

      <!-- Parties Grid: balanced columns (3 to 4 cols) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
        ${partiesCardsHtml || `
          <div class="col-span-full py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
            ยังไม่มีปาร์ตี้ใน ${team.name} — กดปุ่ม <strong>"+ เพิ่มปาร์ตี้ใน ${team.name}"</strong> ด้านบนได้เลยครับ
          </div>
        `}
      </div>
    </div>
  `;
}

function handlePolarityPoolClick(memberId) {
  if (selectedPolaritySource && selectedPolaritySource.type === 'pool' && selectedPolaritySource.memberId === memberId) {
    selectedPolaritySource = null;
  } else {
    selectedPolaritySource = { type: 'pool', memberId };
  }
  renderPolarityBoard();
}

function handlePolaritySlotClick(partyId, slotIndex) {
  const p = polarityParties.find(x => x.id === partyId);
  if (!p) return;

  if (selectedPolaritySource) {
    if (selectedPolaritySource.type === 'pool') {
      p.slots[slotIndex] = selectedPolaritySource.memberId;
      selectedPolaritySource = null;
      renderPolarityBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดทีม Polarity');
      return;
    }

    if (selectedPolaritySource.type === 'slot') {
      const srcParty = polarityParties.find(x => x.id === selectedPolaritySource.partyId);
      if (srcParty) {
        const temp = p.slots[slotIndex];
        p.slots[slotIndex] = srcParty.slots[selectedPolaritySource.slotIndex];
        srcParty.slots[selectedPolaritySource.slotIndex] = temp;
      }
      selectedPolaritySource = null;
      renderPolarityBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดทีม Polarity');
      return;
    }
  }

  if (p.slots[slotIndex]) {
    selectedPolaritySource = { type: 'slot', partyId, slotIndex };
  } else {
    selectedPolaritySource = null;
  }
  renderPolarityBoard();
}

function removeMemberFromPolaritySlot(partyId, slotIndex) {
  const p = polarityParties.find(x => x.id === partyId);
  if (p) {
    p.slots[slotIndex] = null;
    renderPolarityBoard();
    if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากทีม Polarity');
  }
}

function openCreatePolarityTeamModal() {
  openCustomDialog({
    title: '⚡ สร้างทีมดาว Polarity ใหม่',
    message: 'ตั้งชื่อทีมดาวของคุณ (เช่น 🌟 ทีมดาว 5, ทีมขั้วบวก, Star Team):',
    showInput: true,
    defaultInput: `🌟 ทีมดาว ${polarityTeams.length + 1}`,
    showColorPicker: true,
    defaultColor: 'amber',
    confirmText: 'ตกลงสร้างทีม',
    onConfirm: (name, color) => {
      const teamId = `pol_team_${Date.now()}`;
      polarityTeams.push({
        id: teamId,
        name: (name || '').trim() || `🌟 ทีมดาว ${polarityTeams.length + 1}`,
        color: color || 'amber'
      });
      for (let i = 1; i <= 2; i++) {
        polarityParties.push({
          id: `pol_p_${teamId}_${i}`,
          name: `ปาร์ตี้ ${i}`,
          teamId: teamId,
          teamName: name,
          teamColor: color,
          category: 'polarity',
          slots: [null, null, null, null, null]
        });
      }
      renderPolarityBoard();
      showToast('⚡ สร้างทีมดาวใหม่เรียบร้อยแล้ว!', 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`สร้างทีมดาว "${(name || '').trim() || 'ใหม่'}"`);
    }
  });
}

function renamePolarityTeam(teamId) {
  const t = polarityTeams.find(x => x.id === teamId);
  if (!t) return;
  openCustomDialog({
    title: '✏️ เปลี่ยนชื่อทีมดาว',
    message: 'ระบุชื่อใหม่สำหรับทีมดาวนี้:',
    showInput: true,
    defaultInput: t.name,
    confirmText: 'บันทึก',
    onConfirm: (newName) => {
      t.name = (newName || '').trim() || t.name;
      syncPolarityTeamMetadataToParties();
      renderPolarityBoard();
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนชื่อทีมดาว "${t.name}"`);
    }
  });
}

function setPolarityTeamColor(teamId, colorKey) {
  const t = polarityTeams.find(x => x.id === teamId);
  if (!t) return;
  t.color = colorKey;
  syncPolarityTeamMetadataToParties();
  renderPolarityBoard();
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนสีทีมดาว "${t.name}"`);
}

function deletePolarityTeam(teamId) {
  const t = polarityTeams.find(x => x.id === teamId);
  if (!t) return;
  openCustomDialog({
    title: '🗑️ ยืนยันการลบทีมดาว',
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${t.name}"?\nสมาชิกในทีมดาวนี้จะกลับไปอยู่ที่กล่องว่างโดยอัตโนมัติ`,
    confirmText: 'ยืนยันลบ',
    onConfirm: () => {
      polarityTeams = polarityTeams.filter(x => x.id !== teamId);
      polarityParties = polarityParties.filter(x => x.teamId !== teamId);
      if (currentPolarityTeamFilter === teamId) currentPolarityTeamFilter = 'all';
      renderPolarityBoard();
      showToast('🗑️ ลบทีมดาวเรียบร้อย', 'info');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ลบทีมดาว "${t.name}"`);
    }
  });
}

function addPartyToPolarityTeam(teamId) {
  const t = polarityTeams.find(x => x.id === teamId);
  if (!t) return;
  const count = polarityParties.filter(p => p.teamId === teamId).length;
  polarityParties.push({
    id: `pol_p_${teamId}_${Date.now()}`,
    name: `ปาร์ตี้ ${count + 1}`,
    teamId: teamId,
    teamName: t.name,
    teamColor: t.color,
    category: 'polarity',
    slots: [null, null, null, null, null]
  });
  renderPolarityBoard();
  showToast(`➕ เพิ่มปาร์ตี้ใน "${t.name}" สำเร็จ`, 'success');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เพิ่มปาร์ตี้ใน "${t.name}"`);
}

function renumberPolarityPartiesInTeam(teamId) {
  const pList = polarityParties.filter(p => p.teamId === teamId);
  pList.forEach((p, idx) => {
    p.name = `ปาร์ตี้ ${idx + 1}`;
  });
  renderPolarityBoard();
  showToast('🔢 รันเลขปาร์ตี้ 1-N เรียบร้อย', 'info');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('จัดเลขปาร์ตี้ Polarity');
}

function movePartyToPolarityTeam(partyId, targetTeamId) {
  const p = polarityParties.find(x => x.id === partyId);
  const targetTeam = polarityTeams.find(t => t.id === targetTeamId);
  if (!p || !targetTeam) return;

  p.teamId = targetTeam.id;
  p.teamName = targetTeam.name;
  p.teamColor = targetTeam.color;
  renderPolarityBoard();
  showToast(`➡️ ย้าย "${p.name}" ไปยัง "${targetTeam.name}" แล้ว`, 'info');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ย้าย "${p.name}" ไปยัง "${targetTeam.name}"`);
}

function renamePolarityParty(partyId) {
  const p = polarityParties.find(x => x.id === partyId);
  if (!p) return;
  openCustomDialog({
    title: '✏️ เปลี่ยนชื่อปาร์ตี้',
    message: 'ระบุชื่อปาร์ตี้ใหม่:',
    showInput: true,
    defaultInput: p.name,
    confirmText: 'บันทึก',
    onConfirm: (newName) => {
      p.name = (newName || '').trim() || p.name;
      renderPolarityBoard();
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนชื่อปาร์ตี้ "${p.name}"`);
    }
  });
}

function deletePolarityParty(partyId) {
  const p = polarityParties.find(x => x.id === partyId);
  if (!p) return;
  openCustomDialog({
    title: '🗑️ ยืนยันการลบปาร์ตี้',
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบ "${p.name}"?`,
    confirmText: 'ลบปาร์ตี้',
    onConfirm: () => {
      polarityParties = polarityParties.filter(x => x.id !== partyId);
      renderPolarityBoard();
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ลบปาร์ตี้ "${p.name}"`);
    }
  });
}

function clearSinglePolarityParty(partyId) {
  const p = polarityParties.find(x => x.id === partyId);
  if (p) {
    p.slots = [null, null, null, null, null];
    renderPolarityBoard();
    showToast('🧹 ล้างสมาชิกในปาร์ตี้เรียบร้อย', 'info');
    if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ล้างสมาชิกใน "${p.name}"`);
  }
}

function clearAllPolarityParties() {
  openCustomDialog({
    title: '⚠️ ล้างสมาชิกออกจากทุกทีมดาว',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการปลดสมาชิกทุกคนออกจากทีมดาว Polarity?\n(โครงสร้างทีมดาวจะยังคงอยู่)',
    confirmText: 'ล้างทุกคน',
    onConfirm: async () => {
      polarityParties.forEach(p => { p.slots = [null, null, null, null, null]; });
      renderPolarityBoard();
      showToast('🧹 ล้างสมาชิกออกจากทีมดาวทั้งหมดแล้ว', 'info');
      if (typeof triggerAutoSaveImmediate === 'function') await triggerAutoSaveImmediate('ล้างสมาชิกออกจากทุกทีมดาว Polarity');
    }
  });
}

function resetDefaultPolarityTeamsStructure() {
  openCustomDialog({
    title: '🔄 รีเซ็ตโครงสร้างทีมดาวเริ่มต้น',
    message: 'คุณต้องการรีเซ็ตทีมดาวกลับเป็น 4 ทีมดาว (ทีมละ 2 ปาร์ตี้) หรือไม่?',
    confirmText: 'รีเซ็ต',
    onConfirm: () => {
      initDefaultPolarityTeamsAndParties();
      renderPolarityBoard();
      showToast('🔄 รีเซ็ตโครงสร้างทีมดาวเรียบร้อย', 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('รีเซ็ตโครงสร้างทีม Polarity');
    }
  });
}

function autoAssignPolarityByGearAndRole() {
  const sorted = [...members].sort((a, b) => b.gear - a.gear);
  const healers = sorted.filter(m => getJobMeta(m.job).role === 'healer');
  const tanks = sorted.filter(m => getJobMeta(m.job).role === 'tank');
  const bards = sorted.filter(m => getJobMeta(m.job).role === 'bard');
  const dps = sorted.filter(m => getJobMeta(m.job).role === 'dps');

  polarityParties.forEach(p => { p.slots = [null, null, null, null, null]; });

  let hIdx = 0, tIdx = 0, bIdx = 0, dIdx = 0;
  polarityParties.forEach(p => {
    if (hIdx < healers.length) p.slots[0] = healers[hIdx++].id;
    if (tIdx < tanks.length) p.slots[1] = tanks[tIdx++].id;
    if (bIdx < bards.length) p.slots[2] = bards[bIdx++].id;
    for (let s = 3; s < 5; s++) {
      if (dIdx < dps.length) p.slots[s] = dps[dIdx++].id;
    }
  });

  const remaining = sorted.filter(m => !getPolarityAssignedSet().has(m.id));
  let remIdx = 0;
  polarityParties.forEach(p => {
    for (let s = 0; s < 5; s++) {
      if (!p.slots[s] && remIdx < remaining.length) {
        p.slots[s] = remaining[remIdx++].id;
      }
    }
  });

  renderPolarityBoard();
  showToast('⚡ จัดทีมดาว Polarity สมดุลอัตโนมัติตาม Gear เรียบร้อยแล้ว!', 'success');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('จัดทีมดาว Polarity อัตโนมัติ');
}

// Drag & Drop for Polarity
function bindPolarityDragAndDrop() {
  document.querySelectorAll('[draggable="true"][data-pol-id]').forEach(el => {
    el.addEventListener('dragstart', (e) => {
      const polSource = el.getAttribute('data-pol-source');
      const mId = el.getAttribute('data-pol-id');
      const pId = el.getAttribute('data-pol-party-id') || null;
      const slotIdx = el.getAttribute('data-pol-slot-index') !== null ? parseInt(el.getAttribute('data-pol-slot-index')) : null;

      e.dataTransfer.setData('text/plain', JSON.stringify({ polSource, mId, pId, slotIdx }));
      el.classList.add('dnd-dragging');
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dnd-dragging');
    });
  });

  // Target slots
  document.querySelectorAll('[data-pol-drop-target="slot"], [data-pol-source="slot"]').forEach(slotEl => {
    slotEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      slotEl.classList.add('dnd-drop-target');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('dnd-drop-target');
    });

    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('dnd-drop-target');

      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        const targetPartyId = slotEl.getAttribute('data-pol-party-id');
        const targetSlotIndex = parseInt(slotEl.getAttribute('data-pol-slot-index'));

        const targetParty = polarityParties.find(x => x.id === targetPartyId);
        if (!targetParty) return;

        if (payload.polSource === 'pool') {
          targetParty.slots[targetSlotIndex] = payload.mId;
          renderPolarityBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดทีม Polarity');
          return;
        }

        if (payload.polSource === 'slot') {
          const srcParty = polarityParties.find(x => x.id === payload.pId);
          if (srcParty) {
            const temp = targetParty.slots[targetSlotIndex];
            targetParty.slots[targetSlotIndex] = srcParty.slots[payload.slotIdx];
            srcParty.slots[payload.slotIdx] = temp;
          }
          renderPolarityBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดทีม Polarity');
        }
      } catch (err) {}
    });
  });

  // Drop back to Unassigned Pool to remove member from slot
  const poolZone = document.getElementById('polarityUnassignedPoolList');
  if (poolZone) {
    poolZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      poolZone.classList.add('ring-2', 'ring-indigo-400');
    });

    poolZone.addEventListener('dragleave', () => {
      poolZone.classList.remove('ring-2', 'ring-indigo-400');
    });

    poolZone.addEventListener('drop', (e) => {
      e.preventDefault();
      poolZone.classList.remove('ring-2', 'ring-indigo-400');
      const raw = e.dataTransfer.getData('text/plain');
      if (!raw) return;
      try {
        const payload = JSON.parse(raw);
        if (payload.polSource === 'slot') {
          const srcParty = polarityParties.find(x => x.id === payload.pId);
          if (srcParty) {
            srcParty.slots[payload.slotIdx] = null;
            renderPolarityBoard();
            if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากทีม Polarity');
          }
        }
      } catch (err) {}
    });
  }
}

// ============================================================================
// POLARITY ZONE (ทีมดาว) IMAGE EXPORT (PNG) GENERATOR
// ============================================================================
function openExportImageModal(initialFilter = 'all') {
  syncPolarityTeamMetadataToParties();
  syncMembersStatusForSelectedDate();

  const selectEl = document.getElementById('exportTeamSelect');
  if (selectEl) {
    selectEl.innerHTML =
      `<option value="all">⚡ ผังทีมดาว Polarity รวม (1 ทีม 8 ปาร์ตี้)</option>` +
      `<option value="split_teams">📋 แยกตาม 4 ทีมดาว (ทีมละ 2 ปาร์ตี้)</option>` +
      polarityTeams.map(t => `<option value="${t.id}">เฉพาะ ${t.name} (${polarityParties.filter(p => p.teamId === t.id).length} ตี้)</option>`).join('');

    const validValues = new Set(['all', 'split_teams', ...polarityTeams.map(t => t.id)]);
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

function renderPolarityExportTeamBlockHtml(team, showGear, showStatus) {
  const theme = getTeamTheme(team.color);
  const teamParties = polarityParties.filter(p => p.teamId === team.id);
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

function renderPolarityExportUnified8PartiesBlockHtml(showGear, showStatus) {
  const rowLayoutVal = document.getElementById('exportRowLayoutSelect')?.value || '8';
  const is8Cols = rowLayoutVal === '8';

  const allPolarityMembers = [];
  polarityParties.forEach(p => {
    (p.slots || []).forEach(mId => {
      const m = members.find(x => x.id === mId);
      if (m) allPolarityMembers.push(m);
    });
  });
  const totalPolarityGear = allPolarityMembers.reduce((s, m) => s + (m.gear || 0), 0);

  const partyCardsHtml = polarityParties.map((p, pIdx) => {
    const parentTeam = polarityTeams.find(t => t.id === p.teamId) || { name: 'ทีมดาว Polarity', color: 'amber' };
    const theme = getTeamTheme(parentTeam.color || 'amber');
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
    <div style="background: rgba(15, 23, 42, 0.78); border: 2px solid rgba(245, 158, 11, 0.7);" class="rounded-3xl p-5 space-y-4 shadow-2xl">
      <div style="background: linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(30,41,59,0.95) 100%); border: 1px solid rgba(245, 158, 11, 0.55);" class="px-5 py-3.5 rounded-2xl flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-950/80 border border-amber-500/50 flex items-center justify-center text-2xl shadow">
            ⚡
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base sm:text-lg font-extrabold text-white tracking-wide">ผังทีมดาว Polarity Zone</h3>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow">
                ${is8Cols ? '1 แถว 8 ปาร์ตี้เต็มอัตรา' : '1 ทีม 8 ปาร์ตี้เต็มอัตรา'} (${polarityParties.length} ปาร์ตี้)
              </span>
            </div>
            <p class="text-xs text-amber-200/80">ผังจัดทีมดาว Polarity ครอบคลุมทั้ง ${polarityParties.length} ปาร์ตี้ (${polarityParties.length * 5} สล็อต)</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/85 px-4 py-2 rounded-xl border border-slate-800">
          <span>ปาร์ตี้: <strong class="text-white">${polarityParties.length} ตี้</strong></span>
          <span>•</span>
          <span>สมาชิกในทัพ: <strong class="text-amber-400">${allPolarityMembers.length}/${polarityParties.length * 5} คน</strong></span>
          ${showGear ? `<span>•</span><span>ผลรวม Gear: <strong class="mono text-amber-300">${totalPolarityGear.toLocaleString()}</strong></span>` : ''}
        </div>
      </div>

      <div style="${gridContainerStyle}">
        ${partyCardsHtml}
      </div>
    </div>
  `;
}

function renderExportPosterPreview() {
  syncPolarityTeamMetadataToParties();
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

  const assignedSet = getPolarityAssignedSet();
  const leaveList = members.filter(m => m.status === 'leave');

  let teamsHtml = '';
  if (teamFilterVal === 'all') {
    teamsHtml = renderPolarityExportUnified8PartiesBlockHtml(showGear, showStatus);
  } else if (teamFilterVal === 'split_teams') {
    teamsHtml = polarityTeams.map(t => renderPolarityExportTeamBlockHtml(t, showGear, showStatus)).join('');
  } else {
    const targetTeams = polarityTeams.filter(t => t.id === teamFilterVal);
    teamsHtml = targetTeams.map(t => renderPolarityExportTeamBlockHtml(t, showGear, showStatus)).join('');
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
          <span class="text-2xl">⚡</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
            ผังจัดทีม Polarity Zone (ทีมดาว) — กิลด์ ${guildName}
          </h1>
        </div>
        <p class="text-xs text-slate-400">
          ประจำวันที่: <strong class="text-amber-300">${formatThaiDateFull(selectedDate)}</strong> • ไฟล์ซิงค์: ${fileTimestamp}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
          <div class="text-[10px] text-slate-400">สมาชิกทั้งหมด</div>
          <div class="mono font-bold text-base text-white">${members.length} คน</div>
        </div>
        <div class="bg-slate-900 border border-amber-500/40 rounded-xl px-4 py-2 text-center">
          <div class="text-[10px] text-amber-300">ลงทีมดาวแล้ว</div>
          <div class="mono font-bold text-base text-amber-400">${assignedSet.size} คน</div>
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
    showToast('📸 กำลังประมวลผลรูปภาพผังทีมดาวความละเอียดสูง...', 'info');

    const canvas = await generatePosterCanvas();
    const dataUrl = canvas.toDataURL('image/png');

    const selectEl = document.getElementById('exportTeamSelect');
    const filterVal = selectEl ? selectEl.value : 'all';
    let teamSuffix = '_1ทีม8ปาร์ตี้';
    if (filterVal === 'split_teams') {
      teamSuffix = '_แยกตามทีมดาว';
    } else if (filterVal !== 'all') {
      const teamObj = polarityTeams.find(t => t.id === filterVal);
      if (teamObj) teamSuffix = `_${teamObj.name.replace(/\s+/g, '')}`;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ผังทีมดาว_Polarity_${guildName.replace(/\s+/g, '')}${teamSuffix}_${selectedDate}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    showToast('✅ ดาวน์โหลดรูปภาพผังทีมดาว (.PNG) สำเร็จแล้ว!', 'success');
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
