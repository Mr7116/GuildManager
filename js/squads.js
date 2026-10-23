// ============================================================================
// PRESET SQUADS (ตี้ประจำ) MANAGEMENT & MULTI-MODE DEPLOYMENT
// ============================================================================

let presetParties = [];
let activePresetJobBarFamily = 'all';
let selectedPresetSource = null;
let currentExportPresetId = null;
let currentExportMode = 'gvg';

// Initialize default 8 Core Preset Squads
function initDefaultPresetParties() {
  const defaultColors = ['rose', 'blue', 'amber', 'emerald', 'purple', 'cyan', 'rose', 'blue'];
  presetParties = [];
  for (let i = 1; i <= 8; i++) {
    const c = defaultColors[(i - 1) % defaultColors.length];
    presetParties.push({
      id: `preset_p_${Date.now()}_${i}`,
      name: `ตี้ประจำ ${i}`,
      color: c,
      category: 'preset',
      slots: [null, null, null, null, null]
    });
  }
}

window.getActivePresetParties = function() {
  return presetParties.map(p => ({
    ...p,
    category: 'preset',
    slots: Array.isArray(p.slots) ? p.slots.slice(0, 5) : [null, null, null, null, null]
  }));
};

window.rebuildPresetPartiesFromLoadedParties = function(loadedParties) {
  if (!Array.isArray(loadedParties) || loadedParties.length === 0) {
    initDefaultPresetParties();
    return;
  }

  presetParties = loadedParties.map((p, idx) => {
    let slots = Array.isArray(p.slots) ? [...p.slots] : [null, null, null, null, null];
    while (slots.length < 5) slots.push(null);
    if (slots.length > 5) slots = slots.slice(0, 5);

    return {
      id: p.id || `preset_p_${idx}_${Date.now()}`,
      name: p.name || `ตี้ประจำ ${idx + 1}`,
      color: p.color || 'indigo',
      category: 'preset',
      slots: slots
    };
  });
};

function selectPresetJobBarFamily(familyKey) {
  activePresetJobBarFamily = (activePresetJobBarFamily === familyKey) ? 'all' : familyKey;
  renderPresetJobEmblemBar();
  renderPresetBoard();
}

function renderPresetJobEmblemBar() {
  const bar = document.getElementById('presetJobEmblemBarContainer');
  if (!bar) return;

  const assignedSet = getPresetAssignedSet();
  const unassignedMembers = members.filter(m => !assignedSet.has(m.id));

  const familyCounts = {};
  JOB_FAMILIES.forEach(f => { familyCounts[f.familyKey] = 0; });
  unassignedMembers.forEach(m => {
    const fam = getJobFamily(m.job);
    const fKey = fam ? fam.familyKey : 'other';
    if (familyCounts[fKey] !== undefined) familyCounts[fKey]++;
  });

  const resetBtn = document.getElementById('resetPresetJobBarBtn');
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', activePresetJobBarFamily === 'all');
  }

  bar.innerHTML = JOB_FAMILIES.map(fam => {
    const count = familyCounts[fam.familyKey] || 0;
    const isSelected = activePresetJobBarFamily === fam.familyKey;
    const activeClasses = isSelected
      ? 'bg-[#363d4e] border-slate-500 ring-2 ring-amber-400/80 shadow-lg'
      : 'bg-transparent border-transparent hover:bg-[#272c3a]';

    return `
      <button onclick="selectPresetJobBarFamily('${fam.familyKey}')" class="group relative flex flex-col items-center justify-center min-w-[74px] sm:min-w-[82px] px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${activeClasses}" title="${fam.label} (${fam.jobs.join(' / ')}) — ว่าง ${count} คน">
        ${count > 0 ? `<span class="absolute top-1 right-1.5 mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-950/90 text-amber-300 border border-slate-700">${count}</span>` : ''}
        <div class="transform group-hover:scale-110 transition duration-200">
          ${renderJobEmblem(fam.jobs[0], 42)}
        </div>
        <span class="mt-1.5 text-xs font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}">${fam.label}</span>
      </button>
    `;
  }).join('');
}

function getPresetAssignedSet() {
  const set = new Set();
  presetParties.forEach(p => {
    (p.slots || []).forEach(mId => {
      if (mId) set.add(mId);
    });
  });
  return set;
}

function renderPresetBoard() {
  renderPresetJobEmblemBar();

  const assignedSet = getPresetAssignedSet();
  const q = (document.getElementById('presetPoolSearch')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('presetPoolRoleFilter')?.value || 'all';

  const unassigned = members
    .filter(m => !assignedSet.has(m.id))
    .filter(m => roleFilter === 'all' ? true : getJobMeta(m.job).role === roleFilter)
    .filter(m => activePresetJobBarFamily === 'all' ? true : getJobFamily(m.job).familyKey === activePresetJobBarFamily)
    .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || (m.position || '').toLowerCase().includes(q))
    .sort((a, b) => b.gear - a.gear);

  const badgeEl = document.getElementById('presetUnassignedCountBadge');
  if (badgeEl) badgeEl.textContent = unassigned.length;

  const poolEl = document.getElementById('presetUnassignedPoolList');
  if (poolEl) {
    poolEl.innerHTML = unassigned.map(m => {
      const meta = getJobMeta(m.job);
      const isSelected = selectedPresetSource && selectedPresetSource.memberId === m.id;
      return `
        <div onclick="handlePresetPoolClick('${m.id}')"
             draggable="true"
             data-preset-source="pool"
             data-preset-id="${m.id}"
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
        <div>ไม่มีสมาชิกที่ตรงกับเงื่อนไข หรือจัดลงตี้ประจำครบทุกคนแล้ว</div>
      </div>
    `;
  }

  // Render Preset Squad Cards
  const container = document.getElementById('presetPartiesContainer');
  if (!container) return;

  if (!presetParties.length) {
    container.innerHTML = `
      <div class="py-12 text-center text-slate-400 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 col-span-full">
        <div class="text-3xl mb-2">👥</div>
        <div class="font-bold text-white text-base">ยังไม่มีตี้ประจำในระบบ</div>
        <p class="text-xs text-slate-400 mt-1">สร้างตี้ประจำเพื่อจัดกลุ่มสมาชิกไว้ล่วงหน้า แล้วสามารถส่งไปใส่ใน GVG, Siege War หรือ Polarity ได้ทันที</p>
        <button onclick="addPresetParty()" class="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition">
          ➕ สร้างตี้ประจำใหม่
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = presetParties.map((p, pIdx) => renderPresetPartyCardHtml(p, pIdx)).join('');
  bindPresetDragAndDrop();
}

function renderPresetPartyCardHtml(p, pIdx) {
  const theme = getTeamTheme(p.color || 'indigo');
  const presentMembers = (p.slots || []).map(id => members.find(m => m.id === id) || null).filter(Boolean);
  const hasHealer = presentMembers.some(m => getJobMeta(m.job).role === 'healer');
  const totalPartyGear = presentMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

  const colorDotsHtml = Object.values(TEAM_COLORS).map(c => `
    <button onclick="setPresetPartyColor('${p.id}', '${c.key}')" title="เปลี่ยนสีเป็น ${c.name}" class="w-3.5 h-3.5 rounded-full ${c.dotClass} transition transform hover:scale-125 ${(p.color || 'indigo') === c.key ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}"></button>
  `).join('');

  const slotsHtml = (p.slots || []).map((mId, slotIdx) => {
    const m = members.find(x => x.id === mId);
    const isSelected = selectedPresetSource && selectedPresetSource.partyId === p.id && selectedPresetSource.slotIndex === slotIdx;

    if (!m) {
      return `
        <div onclick="handlePresetSlotClick('${p.id}', ${slotIdx})"
             data-preset-drop-target="slot"
             data-preset-party-id="${p.id}"
             data-preset-slot-index="${slotIdx}"
             class="h-11 rounded-xl border border-dashed border-slate-700/80 hover:border-amber-400/70 bg-slate-950/50 px-2.5 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer transition ${isSelected ? 'slot-selected' : ''}">
          <span class="truncate">+ ช่องว่างที่ ${slotIdx + 1} (แตะวางคน)</span>
          <span class="text-[10px] opacity-60 shrink-0 ml-1">ช่อง ${slotIdx + 1}</span>
        </div>
      `;
    }

    const meta = getJobMeta(m.job);
    return `
      <div onclick="handlePresetSlotClick('${p.id}', ${slotIdx})"
           draggable="true"
           data-preset-source="slot"
           data-preset-party-id="${p.id}"
           data-preset-slot-index="${slotIdx}"
           data-preset-id="${m.id}"
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
          <button onclick="event.stopPropagation(); removeMemberFromPresetSlot('${p.id}', ${slotIdx})" title="ถอดออกจากตี้" class="w-5 h-5 rounded hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs flex items-center justify-center">✕</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-slate-950/90 border-2 ${theme.containerBorder} rounded-2xl p-3.5 flex flex-col justify-between shadow-xl space-y-3 transition">
      <!-- Party Card Header -->
      <div class="border-b border-slate-800/90 pb-2.5 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-3 h-3 rounded-full ${theme.dotClass} shadow"></span>
            <h4 class="font-bold text-sm text-white truncate">${p.name || `ตี้ประจำ ${pIdx + 1}`}</h4>
            <button onclick="renamePresetParty('${p.id}')" title="เปลี่ยนชื่อตี้ประจำ" class="text-slate-400 hover:text-white text-xs">✏️</button>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <div class="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800">
              ${colorDotsHtml}
            </div>
            ${presentMembers.length > 0 ? `<button onclick="clearSinglePresetParty('${p.id}')" title="ถอดคนในตี้นี้ออกทั้งหมด" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">ล้าง</button>` : ''}
            <button onclick="deletePresetParty('${p.id}')" title="ลบตี้ประจำนี้" class="px-2 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] transition">🗑️</button>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400">
          <div class="flex items-center gap-1.5">
            <span>ผลรวม Gear: <strong class="mono text-amber-300">${totalPartyGear.toLocaleString()}</strong></span>
            <span>• ${presentMembers.length}/5 คน</span>
          </div>
          <div>
            ${!hasHealer && presentMembers.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚠️ ขาดพระ</span>` : ''}
          </div>
        </div>
      </div>

      <!-- 5 Member Slots -->
      <div class="space-y-1.5 flex-1">
        ${slotsHtml}
      </div>

      <!-- Bottom Quick Deploy Button -->
      <div class="pt-2 border-t border-slate-800/80">
        <button onclick="openExportPresetModal('${p.id}')"
                class="w-full py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5">
          <span>🚀 ส่งตี้ไปใส่ใน GVG / Siege / Polarity</span>
        </button>
      </div>
    </div>
  `;
}

// Click to select & swap
function handlePresetPoolClick(mId) {
  if (selectedPresetSource && selectedPresetSource.type === 'pool' && selectedPresetSource.memberId === mId) {
    selectedPresetSource = null;
  } else {
    selectedPresetSource = { type: 'pool', memberId: mId };
  }
  renderPresetBoard();
}

function handlePresetSlotClick(partyId, slotIndex) {
  const targetParty = presetParties.find(p => p.id === partyId);
  if (!targetParty) return;

  if (selectedPresetSource) {
    if (selectedPresetSource.type === 'pool') {
      targetParty.slots[slotIndex] = selectedPresetSource.memberId;
      selectedPresetSource = null;
      renderPresetBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดตี้ประจำ');
      return;
    }

    if (selectedPresetSource.type === 'slot') {
      const srcParty = presetParties.find(p => p.id === selectedPresetSource.partyId);
      if (srcParty) {
        const temp = targetParty.slots[slotIndex];
        targetParty.slots[slotIndex] = srcParty.slots[selectedPresetSource.slotIndex];
        srcParty.slots[selectedPresetSource.slotIndex] = temp;
      }
      selectedPresetSource = null;
      renderPresetBoard();
      if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดตี้ประจำ');
      return;
    }
  }

  // Click on a filled slot selects it
  if (targetParty.slots[slotIndex]) {
    selectedPresetSource = { type: 'slot', partyId, slotIndex };
  }
  renderPresetBoard();
}

function removeMemberFromPresetSlot(partyId, slotIndex) {
  const p = presetParties.find(x => x.id === partyId);
  if (p) {
    p.slots[slotIndex] = null;
    renderPresetBoard();
    if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากตี้ประจำ');
  }
}

// Party Management
function addPresetParty() {
  const count = presetParties.length;
  const colorKeys = Object.keys(TEAM_COLORS);
  const colorKey = colorKeys[count % colorKeys.length] || 'indigo';
  const newParty = {
    id: `preset_p_${Date.now()}_${count + 1}`,
    name: `ตี้ประจำ ${count + 1}`,
    color: colorKey,
    category: 'preset',
    slots: [null, null, null, null, null]
  };
  presetParties.push(newParty);
  renderPresetBoard();
  showToast(`เพิ่ม "${newParty.name}" เรียบร้อยแล้ว`, 'success');
  if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เพิ่ม "${newParty.name}"`);
}

function renamePresetParty(partyId) {
  const p = presetParties.find(x => x.id === partyId);
  if (!p) return;
  openCustomDialog({
    title: '✏️ เปลี่ยนชื่อตี้ประจำ',
    message: 'กรอกชื่อตี้ประจำใหม่ (เช่น: ตี้ประจำ 1 (หน่วยบุก), ตี้ประจำ 2 (เฝ้าหิน)):',
    showInput: true,
    defaultInput: p.name,
    confirmText: 'บันทึก',
    onConfirm: (newName) => {
      if (newName && newName.trim()) {
        p.name = newName.trim();
        renderPresetBoard();
        showToast('เปลี่ยนชื่อตี้ประจำสำเร็จ', 'success');
        if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนชื่อตี้ประจำ "${p.name}"`);
      }
    }
  });
}

function setPresetPartyColor(partyId, colorKey) {
  const p = presetParties.find(x => x.id === partyId);
  if (p && TEAM_COLORS[colorKey]) {
    p.color = colorKey;
    renderPresetBoard();
    if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`เปลี่ยนสีตี้ประจำ "${p.name}"`);
  }
}

function deletePresetParty(partyId) {
  const p = presetParties.find(x => x.id === partyId);
  if (!p) return;
  openCustomDialog({
    title: '⚠️ ยืนยันการลบตี้ประจำ',
    message: `คุณต้องการลบ "${p.name}" หรือไม่?\nสมาชิกในตี้นี้จะถูกย้ายกลับกองกลาง`,
    confirmText: 'ลบตี้ประจำ',
    onConfirm: async () => {
      presetParties = presetParties.filter(x => x.id !== partyId);
      renderPresetBoard();
      showToast(`ลบ "${p.name}" เรียบร้อยแล้ว`, 'info');
      if (typeof triggerAutoSaveImmediate === 'function') await triggerAutoSaveImmediate(`ลบ "${p.name}"`);
    }
  });
}

function clearSinglePresetParty(partyId) {
  const p = presetParties.find(x => x.id === partyId);
  if (p) {
    p.slots = [null, null, null, null, null];
    renderPresetBoard();
    showToast(`ปลดสมาชิกทุกคนออกจาก "${p.name}" แล้ว`, 'info');
    if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate(`ล้างคนใน "${p.name}"`);
  }
}

function clearAllPresetParties() {
  openCustomDialog({
    title: '🧹 ปลดสมาชิกออกจากทุกตี้ประจำ',
    message: 'คุณต้องการปลดสมาชิกออกจากตี้ประจำทั้งหมดใช่หรือไม่?\n(โครงสร้างตี้ประจำจะยังคงอยู่)',
    confirmText: 'ปลดทุกคน',
    onConfirm: () => {
      presetParties.forEach(p => {
        p.slots = [null, null, null, null, null];
      });
      selectedPresetSource = null;
      renderPresetBoard();
      showToast('ปลดสมาชิกออกจากทุกตี้ประจำเรียบร้อย', 'info');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('ปลดสมาชิกออกจากทุกตี้ประจำ');
    }
  });
}

function resetDefaultPresetPartiesStructure() {
  openCustomDialog({
    title: '🔄 รีเซ็ตตี้ประจำเริ่มต้น',
    message: 'ต้องการรีเซ็ตกลับเป็น 8 ตี้ประจำเริ่มต้นมาตรฐาน (ตี้ประจำ 1 ถึง 8) หรือไม่?',
    confirmText: 'ยืนยันรีเซ็ต',
    onConfirm: () => {
      initDefaultPresetParties();
      selectedPresetSource = null;
      renderPresetBoard();
      showToast('รีเซ็ตเป็น 8 ตี้ประจำเริ่มต้นเรียบร้อยแล้ว', 'success');
      if (typeof triggerAutoSaveImmediate === 'function') triggerAutoSaveImmediate('รีเซ็ตตี้ประจำเริ่มต้น');
    }
  });
}

// ============================================================================
// EXPORT PRESET TO GVG, SIEGE, OR POLARITY (DEDICATED MODAL)
// ============================================================================
function openExportPresetModal(presetPartyId) {
  currentExportPresetId = presetPartyId;
  const preset = presetParties.find(p => p.id === presetPartyId);
  if (!preset) return;

  const filledMembers = (preset.slots || []).map(id => members.find(m => m.id === id) || null).filter(Boolean);
  if (filledMembers.length === 0) {
    showToast('ตี้นี้ยังไม่มีสมาชิก กรุณาจัดคนลงตี้ประจำก่อนส่งออกครับ', 'warning');
    return;
  }

  const modal = document.getElementById('exportPresetModal');
  const previewEl = document.getElementById('exportPresetPreview');
  if (!modal || !previewEl) return;

  previewEl.innerHTML = `
    <div class="flex items-center justify-between pb-1 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
        <span class="font-bold text-sm text-white">${preset.name}</span>
      </div>
      <span class="mono text-xs text-amber-300 font-semibold">${filledMembers.length}/5 คน</span>
    </div>
    <div class="grid grid-cols-5 gap-1.5 pt-1">
      ${preset.slots.map((id, sIdx) => {
        const m = members.find(x => x.id === id);
        if (!m) {
          return `<div class="p-1 rounded-lg border border-dashed border-slate-800 text-[10px] text-center text-slate-600">ว่าง</div>`;
        }
        return `
          <div class="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-center flex flex-col items-center">
            ${renderJobEmblem(m.job, 24)}
            <span class="text-[10px] text-white font-bold truncate w-full mt-0.5">${m.name}</span>
            <span class="text-[9px] text-slate-400 truncate w-full">${m.job}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  selectExportTargetMode('gvg');
  modal.classList.remove('hidden');
}

function closeExportPresetModal() {
  const modal = document.getElementById('exportPresetModal');
  if (modal) modal.classList.add('hidden');
  currentExportPresetId = null;
}

function selectExportTargetMode(mode) {
  currentExportMode = mode;
  ['gvg', 'siege', 'polarity'].forEach(m => {
    const btn = document.getElementById(`btnTargetMode-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className = 'export-mode-btn p-2.5 rounded-xl border text-center transition border-indigo-500 bg-indigo-950/60 text-white font-semibold text-xs ring-2 ring-indigo-400/50';
      } else {
        btn.className = 'export-mode-btn p-2.5 rounded-xl border text-center transition border-slate-800 bg-slate-950 text-slate-400 hover:text-white font-medium text-xs';
      }
    }
  });

  const dropdown = document.getElementById('exportTargetPartyDropdown');
  if (!dropdown) return;

  let targetList = [];
  if (mode === 'gvg') {
    if (!parties || !parties.length) initDefaultTeamsAndParties();
    targetList = parties.filter(p => p.category !== 'polarity' && p.category !== 'siege' && p.category !== 'preset');
  } else if (mode === 'siege') {
    if (typeof siegeParties !== 'undefined' && siegeParties.length) {
      targetList = siegeParties;
    } else {
      if (!rawSiegeParties || !rawSiegeParties.length) {
        rawSiegeParties = (typeof getDefaultSiegeParties === 'function') ? getDefaultSiegeParties() : [];
      }
      targetList = rawSiegeParties;
    }
  } else if (mode === 'polarity') {
    if (typeof polarityParties !== 'undefined' && polarityParties.length) {
      targetList = polarityParties;
    } else {
      if (!rawPolarityParties || !rawPolarityParties.length) {
        rawPolarityParties = (typeof getDefaultPolarityParties === 'function') ? getDefaultPolarityParties() : [];
      }
      targetList = rawPolarityParties;
    }
  }

  if (!targetList.length) {
    dropdown.innerHTML = '<option value="">(ไม่พบปาร์ตี้ในโหมดนี้)</option>';
    return;
  }

  dropdown.innerHTML = targetList.map((p, idx) => {
    const teamLabel = p.teamName || (p.teamId ? p.teamId : 'ทีม');
    const filled = (p.slots || []).filter(Boolean).length;
    const currentMemberNames = (p.slots || []).map(id => {
      const m = members.find(x => x.id === id);
      return m ? m.name : 'ว่าง';
    }).join(', ');
    return `<option value="${p.id}">${teamLabel} • ${p.name || `ตี้ ${idx + 1}`} (${filled}/5 คน) — [${currentMemberNames}]</option>`;
  }).join('');
}

async function confirmExportPresetSquad() {
  if (!currentExportPresetId) return;
  const preset = presetParties.find(p => p.id === currentExportPresetId);
  if (!preset) return;

  const dropdown = document.getElementById('exportTargetPartyDropdown');
  if (!dropdown || !dropdown.value) {
    showToast('กรุณาเลือกปาร์ตี้ปลายทางก่อนครับ', 'warning');
    return;
  }
  const targetPartyId = dropdown.value;

  let targetParty = null;
  let modeName = '';

  if (currentExportMode === 'gvg') {
    modeName = 'GVG';
    targetParty = parties.find(p => p.id === targetPartyId);
  } else if (currentExportMode === 'siege') {
    modeName = 'Siege War';
    targetParty = (typeof siegeParties !== 'undefined' && siegeParties.length)
      ? siegeParties.find(p => p.id === targetPartyId)
      : (rawSiegeParties || []).find(p => p.id === targetPartyId);
  } else if (currentExportMode === 'polarity') {
    modeName = 'Polarity Zone';
    targetParty = (typeof polarityParties !== 'undefined' && polarityParties.length)
      ? polarityParties.find(p => p.id === targetPartyId)
      : (rawPolarityParties || []).find(p => p.id === targetPartyId);
  }

  if (targetParty) {
    targetParty.slots = [...preset.slots];
    while (targetParty.slots.length < 5) targetParty.slots.push(null);

    closeExportPresetModal();
    showToast(`✅ นำสมาชิกจาก "${preset.name}" ใส่ใน "${targetParty.name || 'ปาร์ตี้'}" ของ ${modeName} สำเร็จ!`, 'success');
    if (typeof saveLeaveToDatabaseSilent === 'function') {
      await saveLeaveToDatabaseSilent(`ส่งออกตี้ประจำ: ${preset.name} -> ${modeName}`);
    }
  }
}

// Bulk Sync: Sequential deploy
function openBulkSyncPresetsModal() {
  const modalHtml = `
    <div class="space-y-3 text-left">
      <p class="text-xs text-slate-300 leading-relaxed">
        ระบบจะนำ <strong>ตี้ประจำ 1, 2, 3...</strong> ไปใส่ในปาร์ตี้ของโหมดที่ท่านเลือกเรียงตามลำดับ (ตี้ประจำ 1 ใส่ ตี้ 1, ตี้ประจำ 2 ใส่ ตี้ 2...) โดยอัตโนมัติ
      </p>
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-300">เลือกโหมดปลายทาง:</label>
        <select id="bulkSyncTargetMode" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500">
          <option value="gvg">🛡️ กระดานจัดทีม GVG (เรียงเข้า ตี้ 1, ตี้ 2... ของ GVG)</option>
          <option value="siege">🏰 Siege War (ศึกชิงปราสาท) (เรียงเข้า ตี้ของทัพต่างๆ)</option>
          <option value="polarity">⚡ Polarity Zone (ทีมดาว) (เรียงเข้า ตี้ของทีมดาว)</option>
        </select>
      </div>
    </div>
  `;

  openCustomDialog({
    title: '⚡ ซิงค์ตี้ประจำทั้งหมดเข้าสู่โหมดอื่น',
    message: '',
    showCustomHtml: true,
    customHtml: modalHtml,
    confirmText: '⚡ ยืนยันการซิงค์',
    onConfirm: async () => {
      const modeSelect = document.getElementById('bulkSyncTargetMode');
      if (!modeSelect) return;
      const mode = modeSelect.value;

      let targetParties = [];
      let modeName = '';
      if (mode === 'gvg') {
        modeName = 'GVG';
        if (!parties || !parties.length) initDefaultTeamsAndParties();
        targetParties = parties.filter(p => p.category !== 'polarity' && p.category !== 'siege' && p.category !== 'preset');
      } else if (mode === 'siege') {
        modeName = 'Siege War';
        if (!rawSiegeParties || !rawSiegeParties.length) rawSiegeParties = getDefaultSiegeParties();
        targetParties = (typeof siegeParties !== 'undefined' && siegeParties.length) ? siegeParties : rawSiegeParties;
      } else if (mode === 'polarity') {
        modeName = 'Polarity Zone';
        if (!rawPolarityParties || !rawPolarityParties.length) rawPolarityParties = getDefaultPolarityParties();
        targetParties = (typeof polarityParties !== 'undefined' && polarityParties.length) ? polarityParties : rawPolarityParties;
      }

      let syncedCount = 0;
      presetParties.forEach((preset, idx) => {
        if (targetParties[idx]) {
          targetParties[idx].slots = [...preset.slots];
          while (targetParties[idx].slots.length < 5) targetParties[idx].slots.push(null);
          syncedCount++;
        }
      });

      showToast(`⚡ ซิงค์ตี้ประจำจำนวน ${syncedCount} ตี้เข้าสู่ ${modeName} เรียบร้อยแล้ว`, 'success');
      if (typeof saveLeaveToDatabaseSilent === 'function') {
        await saveLeaveToDatabaseSilent(`ซิงค์ตี้ประจำชุดใหญ่ -> ${modeName}`);
      }
    }
  });
}

// Drag & Drop
function bindPresetDragAndDrop() {
  const poolCards = document.querySelectorAll('[data-preset-source="pool"]');
  poolCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      const mId = card.getAttribute('data-preset-id');
      e.dataTransfer.setData('text/plain', JSON.stringify({ presetSource: 'pool', mId }));
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  const slotCards = document.querySelectorAll('[data-preset-source="slot"]');
  slotCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      const pId = card.getAttribute('data-preset-party-id');
      const slotIdx = parseInt(card.getAttribute('data-preset-slot-index'));
      const mId = card.getAttribute('data-preset-id');
      e.dataTransfer.setData('text/plain', JSON.stringify({ presetSource: 'slot', pId, slotIdx, mId }));
      e.dataTransfer.effectAllowed = 'move';
    });
  });

  const dropTargets = document.querySelectorAll('[data-preset-drop-target="slot"], [data-preset-source="slot"]');
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
        const targetPartyId = slotEl.getAttribute('data-preset-party-id');
        const targetSlotIndex = parseInt(slotEl.getAttribute('data-preset-slot-index'));

        const targetParty = presetParties.find(x => x.id === targetPartyId);
        if (!targetParty) return;

        if (payload.presetSource === 'pool') {
          targetParty.slots[targetSlotIndex] = payload.mId;
          renderPresetBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดตี้ประจำ');
          return;
        }

        if (payload.presetSource === 'slot') {
          const srcParty = presetParties.find(x => x.id === payload.pId);
          if (srcParty) {
            const temp = targetParty.slots[targetSlotIndex];
            targetParty.slots[targetSlotIndex] = srcParty.slots[payload.slotIdx];
            srcParty.slots[payload.slotIdx] = temp;
          }
          renderPresetBoard();
          if (typeof triggerAutoSave === 'function') triggerAutoSave('จัดตี้ประจำ');
        }
      } catch (err) {}
    });
  });

  // Drop back to Unassigned Pool to remove member from slot
  const poolZone = document.getElementById('presetUnassignedPoolList');
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
        if (payload.presetSource === 'slot') {
          const srcParty = presetParties.find(x => x.id === payload.pId);
          if (srcParty) {
            srcParty.slots[payload.slotIdx] = null;
            renderPresetBoard();
            if (typeof triggerAutoSave === 'function') triggerAutoSave('นำคนออกจากตี้ประจำ');
          }
        }
      } catch (err) {}
    });
  }
}
