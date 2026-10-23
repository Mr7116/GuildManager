// ============================================================================
// GVG TACTICAL BOARD & PARTY BUILDER LOGIC
// ============================================================================

let selectedSlot = null;

    // ============================================================================
    // 4. IMAGE EXPORT (PNG) MODAL & HTML2CANVAS GENERATOR (GROUPED BY สนามหลัก / สนามรอง)
    // ============================================================================
    function openExportImageModal(initialFilter = 'all') {
      syncTeamMetadataToParties();
      syncMembersStatusForSelectedDate();

      const mainTeams = teams.filter(t => t.field === 'main');
      const subTeams = teams.filter(t => t.field === 'sub');

      const selectEl = document.getElementById('exportTeamSelect');
      if (selectEl) {
        selectEl.innerHTML =
          `<option value="all">ทุกสนาม & ทุกทีมทั้งหมด (${teams.length} ทีม)</option>` +
          `<option value="field_main">🏟️ เฉพาะสนามหลัก (${mainTeams.length} ทีม)</option>` +
          `<option value="field_sub">🚩 เฉพาะสนามรอง (${subTeams.length} ทีม)</option>` +
          teams.map(t => `<option value="${t.id}">เฉพาะ ${t.name} (${getFieldZone(t.field).name})</option>`).join('');

        const validValues = new Set(['all', 'field_main', 'field_sub', ...teams.map(t => t.id)]);
        selectEl.value = validValues.has(initialFilter) ? initialFilter : 'all';
      }

      document.getElementById('exportImageModal').classList.remove('hidden');
      renderExportPosterPreview();
    }

    function closeExportImageModal() {
      document.getElementById('exportImageModal').classList.add('hidden');
    }

    function renderExportTeamBlockHtml(team, showGear, showStatus) {
      const theme = getTeamTheme(team.color);
      const fZone = getFieldZone(team.field);
      const teamParties = parties.filter(p => p.teamId === team.id);
      const teamMembers = [];
      teamParties.forEach(p => {
        p.slots.forEach(mId => {
          const m = members.find(x => x.id === mId);
          if (m) teamMembers.push(m);
        });
      });
      const teamTotalGear = teamMembers.reduce((s, m) => s + (m.gear || 0), 0);

      const partyCardsHtml = teamParties.map(p => {
        const presentMembers = p.slots.map(id => members.find(m => m.id === id)).filter(Boolean);
        const totalPartyGear = presentMembers.reduce((s, m) => s + (m.gear || 0), 0);

        const slotsRowsHtml = p.slots.map((mId, sIdx) => {
          const m = members.find(x => x.id === mId);
          if (!m) {
            return `
              <div style="background: rgba(15, 23, 42, 0.55); border: 1px dashed rgba(71, 85, 105, 0.6);" class="h-12 rounded-xl px-3.5 flex items-center justify-between text-xs text-slate-500">
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
            ? `<span style="background: rgba(15,23,42,0.85); border: 1px solid rgba(148,163,184,0.3); color: #fde68a;" class="mono px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">${m.gear.toLocaleString()}</span>`
            : '';

          return `
            <div style="${meta.cardTintStyle}" class="py-2 px-3 rounded-xl border flex items-center justify-between gap-2.5">
              <div class="flex items-center gap-2.5 min-w-0 flex-1">
                ${renderJobEmblem(m.job, 34)}
                <div class="min-w-0 flex-1 space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span style="${meta.namePillStyle}" class="px-2.5 py-2 rounded-md border font-bold text-2xl truncate ${isLeave ? 'line-through opacity-75' : ''}">${m.name}</span>
                    <span class="mono text-[11px] text-slate-300 font-semibold shrink-0">Lv.${m.lv}</span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span style="${meta.badgeStyle};align-content: center;align-items: center;align-self: center;" class="px-2 py-2 rounded text-[10px] font-medium border truncate">${m.job}</span>
                    <div class="shrink-0">${statusPill}</div>
                  </div>
                </div>
              </div>
              ${gearPill}
            </div>
          `;
        }).join('');

        return `
          <div style="background: rgba(9, 13, 24, 0.92); border: 1px solid ${theme.hexAccent}66;" class="rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div style="background: ${theme.hexHeaderBg}; border-bottom: 1px solid ${theme.hexAccent}44;" class="-mx-3.5 -mt-3.5 px-4 py-2.5 rounded-t-2xl flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span style="background: ${theme.hexAccent}; color: #ffffff;" class="px-2 py-0.5 rounded text-[11px] font-bold">${team.name}</span>
                <span class="font-bold text-sm text-white">${p.name}</span>
              </div>
              <div class="text-xs text-slate-200">
                ${showGear ? `ผลรวม <strong class="mono text-amber-300">${totalPartyGear.toLocaleString()}</strong> • ` : ''}<span>${presentMembers.length}/5 คน</span>
              </div>
            </div>
            <div class="space-y-2">
              ${slotsRowsHtml}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div style="background: ${theme.hexBgSoft}; border: 2px solid ${theme.hexAccent}88;" class="rounded-3xl p-5 space-y-4">
          <div style="background: ${theme.hexHeaderBg}; border: 1px solid ${theme.hexAccent}66;" class="px-5 py-3 rounded-2xl flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span style="background: ${theme.hexAccent};" class="w-4 h-4 rounded-full inline-block"></span>
              <h3 class="text-lg font-bold text-white tracking-wide">${team.name} (สี${theme.name})</h3>
              <span style="background: rgba(15, 23, 42, 0.75); border: 1px solid ${fZone.hexAccent}88; color: #f8fafc;" class="px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                ${fZone.icon} ${fZone.name}
              </span>
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/75 px-4 py-1.5 rounded-xl border border-slate-800">
              <span>จำนวนปาร์ตี้: <strong class="text-white">${teamParties.length} ตี้</strong></span>
              <span>•</span>
              <span>สมาชิกในทีม: <strong class="text-emerald-400">${teamMembers.length}/${teamParties.length * 5} คน</strong></span>
              ${showGear ? `<span>•</span><span>ผลรวม Gear ทีม: <strong class="mono text-amber-300">${teamTotalGear.toLocaleString()}</strong></span>` : ''}
            </div>
          </div>

          <div class="grid grid-cols-4 gap-4">
            ${partyCardsHtml}
          </div>
        </div>
      `;
    }

    function renderExportPosterPreview() {
      syncTeamMetadataToParties();
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

      const readyCount = members.filter(m => m.status === 'ready').length;
      const leaveList = members.filter(m => m.status === 'leave');
      const assignedSet = getAssignedSet();

      let targetTeams = teams;
      if (teamFilterVal === 'field_main') {
        targetTeams = teams.filter(t => t.field === 'main');
      } else if (teamFilterVal === 'field_sub') {
        targetTeams = teams.filter(t => t.field === 'sub');
      } else if (teamFilterVal !== 'all') {
        targetTeams = teams.filter(t => t.id === teamFilterVal);
      }

      const fieldSectionsHtml = FIELD_ZONES.map(fZone => {
        const fTeams = targetTeams.filter(t => t.field === fZone.key);
        if (fTeams.length === 0) return '';

        const fParties = parties.filter(p => fTeams.some(t => t.id === p.teamId));
        const fMembers = [];
        fParties.forEach(p => {
          p.slots.forEach(mId => {
            const m = members.find(x => x.id === mId);
            if (m) fMembers.push(m);
          });
        });
        const fTotalGear = fMembers.reduce((s, m) => s + (m.gear || 0), 0);

        const innerTeamsHtml = fTeams.map(t => renderExportTeamBlockHtml(t, showGear, showStatus)).join('');

        return `
          <div style="background: ${fZone.hexBgSoft}; border: 2px solid ${fZone.hexAccent}aa;" class="rounded-[28px] p-6 space-y-5 shadow-2xl">
            <div style="background: ${fZone.hexHeaderBg}; border: 1px solid ${fZone.hexAccent}88;" class="px-6 py-4 rounded-2xl flex items-center justify-between">
              <div class="flex items-center gap-3.5">
                <span class="text-2xl">${fZone.icon}</span>
                <div>
                  <div class="flex items-center gap-2.5">
                    <h2 class="text-xl font-bold text-white tracking-wide">${fZone.fullName}</h2>
                    <span style="background: ${fZone.hexAccent}; color: #090d16;" class="px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                      ครอบคลุม ${fTeams.length} ทีม (${fTeams.map(t => t.name).join(', ')})
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 mt-0.5">${fZone.subtitle}</p>
                </div>
              </div>
              <div class="flex items-center gap-3 text-xs text-slate-200 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
                <span>ทีมใน${fZone.name}: <strong class="text-white">${fTeams.length} ทีม</strong></span>
                <span>•</span>
                <span>ปาร์ตี้รวม: <strong class="text-white">${fParties.length} ตี้</strong></span>
                <span>•</span>
                <span>สมาชิกใน${fZone.name}: <strong class="text-emerald-400">${fMembers.length}/${fParties.length * 5} คน</strong></span>
                ${showGear ? `<span>•</span><span>ผลรวม Gear ${fZone.name}: <strong class="mono text-amber-300">${fTotalGear.toLocaleString()}</strong></span>` : ''}
              </div>
            </div>
            <div class="space-y-5">
              ${innerTeamsHtml}
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

      let leaveFooterHtml = '';
      if (showLeaveFooter && leaveList.length > 0) {
        const leaveChips = leaveList.map(m => {
          const pInfo = findMemberPartyInfo(m.id);
          const teamTag = pInfo ? `[${pInfo.fieldZone.name}•${pInfo.team.name}-${pInfo.party.name}]` : '';
          return `
            <span style="background: rgba(136, 19, 55, 0.35); border: 1px solid rgba(244, 63, 94, 0.45);" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-rose-200">
              ${renderJobEmblem(m.job, 20)}
              <strong class="text-white">${m.name}</strong>
              <span class="text-rose-300 text-[11px]">${teamTag} (${m.leaveReason || 'แจ้งลา'})</span>
            </span>
          `;
        }).join('');

        leaveFooterHtml = `
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(244, 63, 94, 0.4);" class="rounded-2xl p-4 space-y-2">
            <div class="text-xs font-bold text-rose-300 flex items-center gap-2">
              <span>🏖️ รายชื่อสมาชิกที่แจ้งลาประจำวันที่ ${formatThaiDateFull(selectedDate)} (${leaveList.length} คน):</span>
            </div>
            <div class="flex flex-wrap gap-2">
              ${leaveChips}
            </div>
          </div>
        `;
      }

      boardEl.innerHTML = `
        <div style="background: linear-gradient(90deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);" class="rounded-2xl border border-slate-700 p-5 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #e11d48 100%);" class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg">
              ⚔️
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-2xl font-bold text-white tracking-wide">ผังทัพกิลด์วอร์ (สนามหลัก & สนามรอง) — ${guildName}</h1>
                <span style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.5); color: #c7d2fe;" class="px-3 py-0.5 rounded-full text-xs font-semibold">
                  📅 ประจำวันที่ ${formatThaiDateFull(selectedDate)}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1">RO Guild Tactical Lineup & Field Assignment (Main / Sub Field) • อัปเดตข้อมูล: ${fileTimestamp}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 text-xs">
            <div class="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-center">
              <div class="text-[10px] text-slate-400">สมาชิกทั้งหมด</div>
              <div class="mono font-bold text-base text-white">${members.length} คน</div>
            </div>
            <div class="bg-slate-900 border border-emerald-500/40 rounded-xl px-4 py-2 text-center">
              <div class="text-[10px] text-emerald-300">พร้อมวอร์วันนี้</div>
              <div class="mono font-bold text-base text-emerald-400">${readyCount} คน</div>
            </div>
            <div class="bg-slate-900 border border-rose-500/40 rounded-xl px-4 py-2 text-center">
              <div class="text-[10px] text-rose-300">แจ้งลาวันนี้</div>
              <div class="mono font-bold text-base text-rose-400">${leaveList.length} คน</div>
            </div>
            <div class="bg-slate-900 border border-amber-500/40 rounded-xl px-4 py-2 text-center">
              <div class="text-[10px] text-amber-300">จัดลงปาร์ตี้แล้ว</div>
              <div class="mono font-bold text-base text-amber-400">${assignedSet.size} คน</div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          ${fieldSectionsHtml}
        </div>

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
        showToast('📸 กำลังประมวลผลรูปภาพผังทัพความละเอียดสูง...', 'info');

        const canvas = await generatePosterCanvas();
        const dataUrl = canvas.toDataURL('image/png');

        const selectEl = document.getElementById('exportTeamSelect');
        const filterVal = selectEl ? selectEl.value : 'all';
        let teamSuffix = '_ทุกสนาม';
        if (filterVal === 'field_main') teamSuffix = '_สนามหลัก';
        else if (filterVal === 'field_sub') teamSuffix = '_สนามรอง';
        else {
          const teamObj = teams.find(t => t.id === filterVal);
          if (teamObj) teamSuffix = `_${teamObj.name.replace(/\s+/g, '')}`;
        }

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `ผังทัพ_${guildName.replace(/\s+/g, '')}${teamSuffix}_${selectedDate}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        showToast('✅ ดาวน์โหลดรูปภาพผังทัพ (.PNG) สำเร็จแล้ว!', 'success');
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

    // ============================================================================
    // 6. TEAM, FIELD (สนามหลัก / สนามรอง) & PARTY CRUD OPERATIONS
    // ============================================================================
    function setTeamColor(teamId, colorKey) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      team.color = colorKey;
      syncTeamMetadataToParties();
      renderAll();
      showToast(`🎨 เปลี่ยนสี "${team.name}" เป็นโทนสี${getTeamTheme(colorKey).name}แล้ว`, 'success');
    }

    function setTeamField(teamId, fieldKey) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      team.field = (fieldKey === 'sub') ? 'sub' : 'main';
      syncTeamMetadataToParties();
      renderAll();
      const fz = getFieldZone(team.field);
      showToast(`${fz.icon} ย้าย "${team.name}" ไปยัง 【${fz.name}】 เรียบร้อยแล้ว`, 'success');
    }

    function openCreateTeamModal(defaultFieldKey = 'main') {
      const nextLetter = String.fromCharCode(65 + teams.length);
      const colorKeys = Object.keys(TEAM_COLORS);
      const defaultColor = colorKeys[teams.length % colorKeys.length];
      const initField = (defaultFieldKey === 'sub' || currentTeamFilter === 'field_sub') ? 'sub' : 'main';

      openCustomDialog({
        title: '➕ สร้างทีมใหม่เข้าสนามรบ',
        message: 'ตั้งชื่อทีมใหม่ และเลือกสนาม (สนามหลัก / สนามรอง)\nระบบจะสร้าง ปาร์ตี้ 1 ถึง ปาร์ตี้ 4 ให้ในทีมอัตโนมัติ:',
        showInput: true,
        defaultInput: `ทีม ${nextLetter}`,
        showFieldPicker: true,
        defaultField: initField,
        showColorPicker: true,
        defaultColor: defaultColor,
        confirmText: 'สร้างทีม',
        onConfirm: async (val, pickedColor, pickedField) => {
          const name = (val || '').trim() || `ทีม ${nextLetter}`;
          const newTeamId = 'team_' + Date.now();
          const fKey = (pickedField === 'sub') ? 'sub' : 'main';
          const newTeam = { id: newTeamId, name, color: pickedColor || 'purple', field: fKey };
          teams.push(newTeam);
          for (let i = 1; i <= 4; i++) {
            parties.push({
              id: `${newTeamId}_p${i}_${Math.random().toString(36).slice(2, 5)}`,
              name: `ปาร์ตี้ ${i}`,
              teamId: newTeamId,
              teamName: name,
              teamColor: newTeam.color,
              teamField: fKey,
              raid: fKey,
              slots: [null, null, null, null, null]
            });
          }
          renderAll();
          const fz = getFieldZone(fKey);
          showToast(`➕ สร้าง "${name}" ใน 【${fz.name}】 พร้อมปาร์ตี้ 1-4 เรียบร้อยแล้ว`, 'success');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate(`สร้างทีมใหม่: ${name}`);
          }
        }
      });
    }

    function renameTeam(teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      openCustomDialog({
        title: '✏️ เปลี่ยนชื่อทีม',
        message: `กรอกชื่อใหม่สำหรับ "${team.name}":`,
        showInput: true,
        defaultInput: team.name,
        confirmText: 'บันทึกชื่อทีม',
        onConfirm: async (val) => {
          if (val && val.trim()) {
            team.name = val.trim();
            syncTeamMetadataToParties();
            renderAll();
            showToast(`✏️ เปลี่ยนชื่อทีมเป็น "${team.name}" แล้ว`, 'success');
            if (typeof triggerAutoSaveImmediate === 'function') {
              await triggerAutoSaveImmediate(`เปลี่ยนชื่อทีม: ${team.name}`);
            }
          }
        }
      });
    }

    function deleteTeam(teamId) {
      if (teams.length <= 1) {
        showToast('ต้องมีอย่างน้อย 1 ทีมในระบบครับ', 'danger');
        return;
      }
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      openCustomDialog({
        title: `🗑️ ยืนยันการลบ "${team.name}"`,
        message: `คุณต้องการลบ "${team.name}" และปาร์ตี้ทั้งหมดในทีมนี้ใช่หรือไม่?\n(สมาชิกที่อยู่ในทีมนี้จะถูกย้ายกลับไปที่รายชื่อรอจัดตี้)`,
        confirmText: 'ลบทีมนี้',
        onConfirm: async () => {
          teams = teams.filter(t => t.id !== teamId);
          parties = parties.filter(p => p.teamId !== teamId);
          if (currentTeamFilter === teamId) currentTeamFilter = 'all';
          renderAll();
          showToast(`🗑️ ลบ "${team.name}" เรียบร้อยแล้ว`, 'danger');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate(`ลบทีม: ${team.name}`);
          }
        }
      });
    }

    function addPartyToTeam(teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      const teamPartiesCount = parties.filter(p => p.teamId === teamId).length;
      const newParty = {
        id: `${teamId}_p_${Date.now()}`,
        name: `ปาร์ตี้ ${teamPartiesCount + 1}`,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamField: team.field || 'main',
        raid: team.field || 'main',
        slots: [null, null, null, null, null]
      };
      parties.push(newParty);
      renderAll();
      showToast(`➕ เพิ่ม "${newParty.name}" ใน ${team.name} แล้ว`, 'success');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate(`เพิ่มปาร์ตี้: ${newParty.name} ใน ${team.name}`);
      }
    }

    function renumberPartiesInTeam(teamId) {
      const team = teams.find(t => t.id === teamId);
      if (!team) return;
      const teamParties = parties.filter(p => p.teamId === teamId);
      teamParties.forEach((p, idx) => {
        p.name = `ปาร์ตี้ ${idx + 1}`;
      });
      renderAll();
      showToast(`🔢 รันเลขปาร์ตี้ 1-${teamParties.length} ใน ${team.name} เรียบร้อยแล้ว`, 'success');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate(`รันเลขปาร์ตี้ใน ${team.name}`);
      }
    }

    function movePartyToTeam(partyId, targetTeamId) {
      const party = parties.find(p => p.id === partyId);
      const targetTeam = teams.find(t => t.id === targetTeamId);
      if (!party || !targetTeam) return;
      party.teamId = targetTeam.id;
      party.teamName = targetTeam.name;
      party.teamColor = targetTeam.color;
      party.teamField = targetTeam.field || 'main';
      party.raid = targetTeam.field || 'main';
      renderAll();
      showToast(`ย้าย "${party.name}" ไปยัง ${targetTeam.name} (${getFieldZone(targetTeam.field).name}) เรียบร้อยแล้ว`, 'info');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate(`ย้าย "${party.name}" ไปยัง ${targetTeam.name}`);
      }
    }

    function renameParty(partyId) {
      const p = parties.find(x => x.id === partyId);
      if (!p) return;
      openCustomDialog({
        title: '✏️ เปลี่ยนชื่อปาร์ตี้',
        message: `ตั้งชื่อใหม่ให้ "${p.name}" (${p.teamName}):`,
        showInput: true,
        defaultInput: p.name,
        confirmText: 'บันทึก',
        onConfirm: async (val) => {
          if (val && val.trim()) {
            p.name = val.trim();
            renderAll();
            showToast(`✏️ เปลี่ยนชื่อเป็น "${p.name}" แล้ว`, 'success');
            if (typeof triggerAutoSaveImmediate === 'function') {
              await triggerAutoSaveImmediate(`เปลี่ยนชื่อปาร์ตี้: ${p.name}`);
            }
          }
        }
      });
    }

    function deleteParty(partyId) {
      const idx = parties.findIndex(p => p.id === partyId);
      if (idx === -1) return;
      const target = parties[idx];
      parties.splice(idx, 1);
      renderAll();
      showToast(`🗑️ ลบ "${target.name}" (${target.teamName}) แล้ว`, 'danger');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate(`ลบปาร์ตี้: ${target.name}`);
      }
    }

    function clearSingleParty(partyId) {
      const p = parties.find(x => x.id === partyId);
      if (!p) return;
      p.slots = [null, null, null, null, null];
      renderAll();
      showToast(`ถอดสมาชิกออกจาก "${p.name}" (${p.teamName}) แล้ว`, 'info');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate(`ถอดคนออกจาก "${p.name}"`);
      }
    }

    function clearAllParties() {
      openCustomDialog({
        title: 'ล้างคนในปาร์ตี้ทั้งหมด',
        message: 'ต้องการถอดสมาชิกทุกคนออกจากทุกปาร์ตี้ใช่หรือไม่? (โครงสร้างสนาม ทีม และปาร์ตี้จะยังอยู่ครบ)',
        confirmText: 'ถอดทุกคนออก',
        onConfirm: async () => {
          parties.forEach(p => p.slots = [null, null, null, null, null]);
          renderAll();
          showToast('ถอดสมาชิกออกจากทุกปาร์ตี้เรียบร้อยแล้ว', 'info');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate('ถอดสมาชิกออกจากทุกปาร์ตี้ GVG');
          }
        }
      });
    }

    function resetDefaultTeamsStructure() {
      openCustomDialog({
        title: '🔄 ตั้งค่าโครงสร้างเริ่มต้น (สนามหลัก: ทีม A | สนามรอง: ทีม B, C)',
        message: 'ต้องการจัดโครงสร้างเป็น สนามหลัก (ทีม A) และ สนามรอง (ทีม B, ทีม C) ทีมละ 4 ปาร์ตี้ ใช่หรือไม่?',
        confirmText: 'รีเซ็ตโครงสร้างทีม',
        onConfirm: async () => {
          initDefaultTeamsAndParties();
          renderAll();
          showToast('🔄 ตั้งค่าโครงสร้าง สนามหลัก (ทีม A) & สนามรอง (ทีม B, C) เรียบร้อยแล้ว', 'success');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate('รีเซ็ตโครงสร้างทีม GVG');
          }
        }
      });
    }

    function setTeamFilter(teamId) {
      currentTeamFilter = teamId;
      renderAll();
    }

    // ============================================================================
    // 7. SMART AUTO-ASSIGN BY GEAR & ROLE (PRIORITIZES สนามหลัก THEN สนามรอง)
    // ============================================================================
    function autoAssignByGearAndRole() {
      if (members.length === 0) {
        showToast('ยังไม่มีข้อมูลสมาชิกให้จัดตี้ กรุณาเพิ่มสมาชิกหรือนำเข้าไฟล์ CSV ก่อนครับ', 'info');
        return;
      }
      if (teams.length === 0 || parties.length === 0) {
        initDefaultTeamsAndParties();
      } else {
        parties.forEach(p => p.slots = [null, null, null, null, null]);
      }

      syncTeamMetadataToParties();
      syncMembersStatusForSelectedDate();

      const readyMembers = members
        .filter(m => m.status === 'ready')
        .sort((a, b) => b.gear - a.gear);

      const tanks = readyMembers.filter(m => getJobMeta(m.job).role === 'tank');
      const healers = readyMembers.filter(m => getJobMeta(m.job).role === 'healer');
      const bards = readyMembers.filter(m => getJobMeta(m.job).role === 'bard');
      const usedIds = new Set();

      const orderedTeams = [
        ...teams.filter(t => t.field === 'main'),
        ...teams.filter(t => t.field !== 'main')
      ];

      const orderedParties = [];
      orderedTeams.forEach(t => {
        parties.filter(p => p.teamId === t.id).forEach(p => orderedParties.push(p));
      });

      orderedParties.forEach(p => {
        const h = healers.find(m => !usedIds.has(m.id));
        if (h) { p.slots[0] = h.id; usedIds.add(h.id); }
      });

      orderedParties.forEach(p => {
        const t = tanks.find(m => !usedIds.has(m.id));
        if (t) { p.slots[1] = t.id; usedIds.add(t.id); }
      });

      orderedParties.forEach(p => {
        const b = bards.find(m => !usedIds.has(m.id));
        if (b) { p.slots[2] = b.id; usedIds.add(b.id); }
      });

      const remainingReady = readyMembers.filter(m => !usedIds.has(m.id));
      orderedParties.forEach(p => {
        for (let s = 0; s < 5; s++) {
          if (!p.slots[s]) {
            const nextM = remainingReady.find(m => !usedIds.has(m.id));
            if (nextM) {
              p.slots[s] = nextM.id;
              usedIds.add(nextM.id);
            }
          }
        }
      });

      renderAll();
      showToast(`⚡ จัดสมาชิกที่พร้อมวอร์เข้า 【สนามหลัก】 และ 【สนามรอง】 ตาม Gear เรียบร้อยแล้ว`, 'success');
      if (typeof triggerAutoSaveImmediate === 'function') {
        triggerAutoSaveImmediate('จัดตี้สมดุลอัตโนมัติ GVG');
      }
    }

    // ============================================================================
    // 9. RENDERING UI (JOB BAR, TACTICAL BOARD, TEAMS, ROSTER, QUICK CHECK)
    // ============================================================================
    function selectJobBarFamily(familyKey) {
      activeJobBarFamily = (activeJobBarFamily === familyKey) ? 'all' : familyKey;
      const resetBtn = document.getElementById('resetJobBarBtn');
      if (resetBtn) resetBtn.classList.toggle('hidden', activeJobBarFamily === 'all');
      renderAll();
    }

    function renderJobEmblemBar() {
      const bar = document.getElementById('jobEmblemBarContainer');
      if (!bar) return;

      bar.innerHTML = JOB_FAMILIES.map(fam => {
        const count = members.filter(m => getJobFamily(m.job).familyKey === fam.familyKey).length;
        const isSelected = activeJobBarFamily === fam.familyKey;
        const activeClasses = isSelected
          ? 'bg-[#363d4e] border-slate-500 ring-2 ring-amber-400/80 shadow-lg'
          : 'bg-transparent border-transparent hover:bg-[#272c3a]';

        return `
          <button onclick="selectJobBarFamily('${fam.familyKey}')" class="group relative flex flex-col items-center justify-center min-w-[74px] sm:min-w-[82px] px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${activeClasses}" title="${fam.label} (${fam.jobs.join(' / ')}) — ${count} คน">
            ${count > 0 ? `<span class="absolute top-1 right-1.5 mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-950/90 text-amber-300 border border-slate-700">${count}</span>` : ''}
            <div class="transform group-hover:scale-110 transition duration-200">
              ${renderJobEmblem(fam.jobs[0], 42)}
            </div>
            <span class="mt-1.5 text-xs font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}">${fam.label}</span>
          </button>
        `;
      }).join('');
    }

    function renderTeamFilterBar() {
      const bar = document.getElementById('teamFilterButtons');
      if (!bar) return;

      const mainTeams = teams.filter(t => t.field === 'main');
      const subTeams = teams.filter(t => t.field === 'sub');
      const mainPartiesCount = parties.filter(p => mainTeams.some(t => t.id === p.teamId)).length;
      const subPartiesCount = parties.filter(p => subTeams.some(t => t.id === p.teamId)).length;

      const allBtnClass = currentTeamFilter === 'all'
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700';

      const mainBtnClass = currentTeamFilter === 'field_main'
        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
        : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/40';

      const subBtnClass = currentTeamFilter === 'field_sub'
        ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
        : 'bg-sky-950/40 text-sky-300 hover:bg-sky-900/50 border border-sky-500/40';

      let html = `
        <button onclick="setTeamFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${allBtnClass}">
          ทุกสนาม (${teams.length} ทีม • ${parties.length} ตี้)
        </button>
        <button onclick="setTeamFilter('field_main')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${mainBtnClass}">
          <span>🏟️ สนามหลัก (${mainTeams.length} ทีม • ${mainPartiesCount} ตี้)</span>
        </button>
        <button onclick="setTeamFilter('field_sub')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${subBtnClass}">
          <span>🚩 สนามรอง (${subTeams.length} ทีม • ${subPartiesCount} ตี้)</span>
        </button>
        <span class="text-slate-700 hidden sm:inline">|</span>
      `;

      teams.forEach(t => {
        const theme = getTeamTheme(t.color);
        const fz = getFieldZone(t.field);
        const tParties = parties.filter(p => p.teamId === t.id);
        const isSelected = currentTeamFilter === t.id;
        const btnClass = isSelected
          ? `${theme.buttonClass} shadow-md`
          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700';

        html += `
          <button onclick="setTeamFilter('${t.id}')" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${btnClass}">
            <span class="w-2.5 h-2.5 rounded-full ${theme.dotClass}"></span>
            <span>${t.name}</span>
            <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-950/60 text-slate-300">${fz.shortName}•${tParties.length}ตี้</span>
          </button>
        `;
      });

      bar.innerHTML = html;
    }

    function renderTeamCardHtml(team) {
      const theme = getTeamTheme(team.color);
      const teamParties = parties.filter(p => p.teamId === team.id);

      const teamMembers = [];
      teamParties.forEach(p => {
        p.slots.forEach(mId => {
          const m = members.find(x => x.id === mId);
          if (m) teamMembers.push(m);
        });
      });
      const teamTotalGear = teamMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

      const colorDotsHtml = Object.values(TEAM_COLORS).map(c => `
        <button onclick="setTeamColor('${team.id}', '${c.key}')" title="เปลี่ยนสีทีมเป็น ${c.name}" class="w-4 h-4 rounded-full ${c.dotClass} transition transform hover:scale-125 ${team.color === c.key ? 'ring-2 ring-white scale-110' : 'opacity-65 hover:opacity-100'}"></button>
      `).join('');

      const partiesCardsHtml = teamParties.map(p => {
        const partyMembers = p.slots.map(id => members.find(m => m.id === id) || null);
        const presentMembers = partyMembers.filter(Boolean);
        const hasHealer = presentMembers.some(m => getJobMeta(m.job).role === 'healer' && m.status === 'ready');
        const leaveMembers = presentMembers.filter(m => m.status === 'leave');
        const totalPartyGear = presentMembers.reduce((sum, m) => sum + (m.gear || 0), 0);

        const moveOptionsHtml = teams.map(tOpt => `
          <option value="${tOpt.id}" ${tOpt.id === team.id ? 'selected' : ''}>ย้ายไป: ${tOpt.name} (${getFieldZone(tOpt.field).shortName})</option>
        `).join('');

        const slotsHtml = p.slots.map((mId, sIdx) => {
          const m = members.find(x => x.id === mId);
          const isSelected = selectedSource && selectedSource.partyId === p.id && selectedSource.slotIndex === sIdx;
          if (!m) {
            return `
              <div onclick="handleSlotClick('${p.id}', ${sIdx})" class="h-11 rounded-xl border border-dashed border-slate-700/80 hover:border-amber-400/70 bg-slate-950/50 px-2.5 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer transition ${isSelected ? 'slot-selected' : ''}">
                <span class="truncate">+ ช่องว่างที่ ${sIdx + 1} (แตะวาง)</span>
                <span class="text-[10px] opacity-60 shrink-0 ml-1">${team.name}</span>
              </div>
            `;
          }
          const meta = getJobMeta(m.job);
          return `
            <div onclick="handleSlotClick('${p.id}', ${sIdx})" style="${meta.cardTintStyle}" class="py-1.5 rounded-xl border px-2 flex items-center justify-between gap-1.5 cursor-pointer transition hover:brightness-110 ${isSelected ? 'slot-selected' : ''}">
              <div class="flex items-center gap-1.5 min-w-0">
                ${renderJobEmblem(m.job, 28)}
                <div class="min-w-0">
                  <div class="flex items-center gap-1">
                    ${renderColoredMemberName(m, 'px-2 py-0 text-[11px]')}
                    <span class="mono text-[10px] text-slate-300 shrink-0">Lv.${m.lv}</span>
                  </div>
                  <div class="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span style="${meta.badgeStyle}" class="px-1.5 rounded text-[9px] border">${m.job}</span>
                    ${m.status === 'leave'
                      ? `<span class="px-1 rounded text-[9px] font-semibold bg-rose-500/30 text-rose-200 border border-rose-500/40 truncate max-w-[100px]">🏖️ ลา (${m.leaveReason || 'วันนี้'})</span>`
                      : `<span class="text-[9px] truncate ${m.onlineStatus === '[ออนไลน์]' ? 'text-emerald-300' : 'text-slate-400'}">${m.onlineStatus}</span>`
                    }
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                ${formatGearBadge(m.gear)}
                <button onclick="event.stopPropagation(); removeMemberFromSlot('${p.id}', ${sIdx})" title="ถอดออกจากตี้" class="w-5 h-5 rounded hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs flex items-center justify-center">✕</button>
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
                  <button onclick="renameParty('${p.id}')" title="เปลี่ยนชื่อปาร์ตี้" class="text-slate-400 hover:text-white text-xs shrink-0">✏️</button>
                </div>

                <div class="flex items-center gap-1 shrink-0">
                  ${presentMembers.length > 0 ? `<button onclick="clearSingleParty('${p.id}')" title="ถอดคนในตี้นี้ออกทั้งหมด" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition">ล้าง</button>` : ''}
                  <button onclick="deleteParty('${p.id}')" title="ลบปาร์ตี้นี้" class="px-1.5 py-0.5 rounded bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] transition">🗑️</button>
                </div>
              </div>

              <!-- Row 2: 📥 ตี้ประจำ + ย้ายไป dropdown -->
              <div class="flex items-center justify-between gap-1.5 pt-0.5">
                <button onclick="openImportPresetModal('${p.id}', 'gvg')" title="ดึงสมาชิกจากตี้ประจำ" class="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition flex items-center gap-1">
                  <span>📥 ตี้ประจำ</span>
                </button>
                <div class="flex items-center gap-1 min-w-0">
                  <select onchange="movePartyToTeam('${p.id}', this.value)" class="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none max-w-[130px] truncate">
                    ${moveOptionsHtml}
                  </select>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-slate-400">
                <div class="flex items-center gap-1.5">
                  <span>ผลรวม Gear: <strong class="mono text-indigo-300">${totalPartyGear.toLocaleString()}</strong></span>
                  <span>• ${presentMembers.length}/5 คน</span>
                </div>
                <div class="flex items-center gap-1">
                  ${!hasHealer && presentMembers.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">⚠️ ขาดพระ</span>` : ''}
                  ${leaveMembers.length > 0 ? `<span class="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">🚨 ลา ${leaveMembers.length}</span>` : ''}
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
          <div class="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border ${theme.headerBg}">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full ${theme.dotClass} shadow"></span>
                <h3 class="text-base sm:text-lg font-bold text-white tracking-wide">${team.name}</h3>
                <button onclick="renameTeam('${team.id}')" title="เปลี่ยนชื่อทีม" class="text-slate-300 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800/70">✏️ เปลี่ยนชื่อ</button>
              </div>

              <!-- ปุ่มสลับสนามประจำทีม (สนามหลัก / สนามรอง) -->
              <div class="inline-flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button onclick="setTeamField('${team.id}', 'main')" class="px-2.5 py-1 rounded-lg transition ${team.field === 'main' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}" title="กำหนดให้ ${team.name} อยู่ในสนามหลัก">
                  🏟️ สนามหลัก
                </button>
                <button onclick="setTeamField('${team.id}', 'sub')" class="px-2.5 py-1 rounded-lg transition ${team.field === 'sub' ? 'bg-sky-400 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'}" title="กำหนดให้ ${team.name} อยู่ในสนามรอง">
                  🚩 สนามรอง
                </button>
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/60 px-3 py-1 rounded-xl border border-slate-800">
                <span>ปาร์ตี้ในทีม: <strong class="text-white">${teamParties.length} ตี้</strong></span>
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
                <button onclick="openExportImageModal('${team.id}')" class="px-2.5 py-1.5 rounded-xl bg-fuchsia-600/25 hover:bg-fuchsia-600/40 text-fuchsia-200 border border-fuchsia-500/40 text-xs font-semibold transition flex items-center gap-1" title="ส่งออกรูปภาพเฉพาะ ${team.name}">
                  📸 รูป${team.name}
                </button>
                <button onclick="addPartyToTeam('${team.id}')" class="px-3 py-1.5 rounded-xl text-xs font-semibold transition ${theme.buttonClass} shadow">
                  + เพิ่มปาร์ตี้ใน ${team.name}
                </button>
                <button onclick="renumberPartiesInTeam('${team.id}')" title="รันเลขปาร์ตี้ 1, 2, 3, 4 ใหม่" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">
                  🔢 รันเลขตี้ 1-N
                </button>
                <button onclick="deleteTeam('${team.id}')" title="ลบทีมนี้" class="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs transition">
                  🗑️ ลบทีม
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
            ${partiesCardsHtml || `
              <div class="col-span-full py-8 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                ยังไม่มีปาร์ตี้ใน ${team.name} — กดปุ่ม <strong>"+ เพิ่มปาร์ตี้ใน ${team.name}"</strong> ด้านบนได้เลยครับ
              </div>
            `}
          </div>
        </div>
      `;
    }

    function renderBoard() {
      syncTeamMetadataToParties();
      syncMembersStatusForSelectedDate();
      renderTeamFilterBar();

      const assignedSet = getAssignedSet();
      const q = (document.getElementById('poolSearch').value || '').toLowerCase();
      const roleFilter = document.getElementById('poolRoleFilter').value;
      const statusFilter = document.getElementById('poolStatusFilter').value;

      const unassigned = members
        .filter(m => !assignedSet.has(m.id))
        .filter(m => statusFilter === 'all' ? true : m.status === 'ready')
        .filter(m => roleFilter === 'all' ? true : getJobMeta(m.job).role === roleFilter)
        .filter(m => activeJobBarFamily === 'all' ? true : getJobFamily(m.job).familyKey === activeJobBarFamily)
        .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || m.position.toLowerCase().includes(q))
        .sort((a, b) => b.gear - a.gear);

      document.getElementById('unassignedCountBadge').textContent = unassigned.length;

      const poolEl = document.getElementById('unassignedPoolList');
      poolEl.innerHTML = unassigned.map(m => {
        const meta = getJobMeta(m.job);
        const isSelected = selectedSource && selectedSource.memberId === m.id;
        return `
          <div onclick="handlePoolClick('${m.id}')" style="${meta.cardTintStyle}" class="p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 group hover:brightness-110 ${isSelected ? 'slot-selected' : ''}">
            <div class="flex items-center gap-2.5 min-w-0">
              ${renderJobEmblem(m.job, 34)}
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  ${renderColoredMemberName(m)}
                  <span class="mono text-[10px] text-slate-300 font-semibold">Lv.${m.lv}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span style="${meta.badgeStyle}" class="px-1.5 py-0.2 rounded text-[10px] font-medium border">${m.job}</span>
                  ${m.status === 'leave'
                    ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-500/25 text-rose-300 border border-rose-500/40">🏖️ ${m.leaveReason || 'ลาวันนี้'}</span>`
                    : `<span class="text-[10px] ${m.onlineStatus === '[ออนไลน์]' ? 'text-emerald-300' : 'text-slate-400'}">${m.onlineStatus}</span>`
                  }
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
          <div>${members.length === 0 ? 'ยังไม่มีรายชื่อสมาชิกในระบบ' : 'ไม่มีสมาชิกที่ตรงกับเงื่อนไข'}</div>
          ${members.length === 0 ? `<div class="text-[11px] text-slate-400">กดปุ่ม <strong>"➕ เพิ่มสมาชิก"</strong> หรือ <strong>"📂 นำเข้า .CSV"</strong> ด้านบนเพื่อเริ่มต้น</div>` : ''}
        </div>
      `;

      const container = document.getElementById('teamsHierarchyContainer');

      const zonesToRender = FIELD_ZONES.filter(fz => {
        if (currentTeamFilter === 'field_main') return fz.key === 'main';
        if (currentTeamFilter === 'field_sub') return fz.key === 'sub';
        if (currentTeamFilter !== 'all') {
          const targetTeam = teams.find(t => t.id === currentTeamFilter);
          return targetTeam ? targetTeam.field === fz.key : true;
        }
        return true;
      });

      container.innerHTML = zonesToRender.map(fZone => {
        const fieldTeams = teams
          .filter(t => t.field === fZone.key)
          .filter(t => (currentTeamFilter === 'all' || currentTeamFilter === 'field_main' || currentTeamFilter === 'field_sub') ? true : t.id === currentTeamFilter);

        const allFieldParties = parties.filter(p => fieldTeams.some(t => t.id === p.teamId));
        const allFieldMembers = [];
        allFieldParties.forEach(p => {
          p.slots.forEach(mId => {
            const m = members.find(x => x.id === mId);
            if (m) allFieldMembers.push(m);
          });
        });
        const readyInField = allFieldMembers.filter(m => m.status === 'ready').length;
        const leaveInField = allFieldMembers.filter(m => m.status === 'leave').length;
        const fieldTotalGear = allFieldMembers.reduce((s, m) => s + (m.gear || 0), 0);
        const fieldAvgGear = allFieldMembers.length
          ? Math.round(fieldTotalGear / allFieldMembers.length)
          : 0;

        const teamsCardsHtml = fieldTeams.length > 0
          ? fieldTeams.map(team => renderTeamCardHtml(team)).join('')
          : `
            <div class="py-10 px-4 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50 space-y-2.5">
              <div class="text-2xl">${fZone.icon}</div>
              <div class="text-sm font-bold text-slate-300">ยังไม่มีทีมใน ${fZone.name}</div>
              <p class="text-xs text-slate-400">คุณสามารถกดปุ่ม <strong>"➕ สร้างทีมใน${fZone.name}"</strong> ด้านบน หรือกดสลับปุ่ม <strong>"${fZone.icon} ${fZone.name}"</strong> บนหัวการ์ดของทีมที่มีอยู่เพื่อย้ายทีมเข้ามาในสนามนี้ได้ทันที</p>
              <button onclick="openCreateTeamModal('${fZone.key}')" class="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition">
                ➕ สร้างทีมใหม่ใน${fZone.name}
              </button>
            </div>
          `;

        return `
          <div class="rounded-[32px] border-2 ${fZone.wrapperBorder} ${fZone.wrapperBg} p-4 sm:p-6 space-y-5 shadow-2xl">
            <!-- Outer Field Header (สนามหลัก / สนามรอง ครอบคลุมทีม) -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${fZone.headerClass} shadow-lg">
              <div class="flex items-center gap-3.5 flex-wrap">
                <div class="w-11 h-11 rounded-2xl bg-slate-950/80 border border-slate-700/80 flex items-center justify-center text-2xl shadow-inner">
                  ${fZone.icon}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h2 class="text-lg sm:text-xl font-extrabold text-white tracking-wide">${fZone.fullName}</h2>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${fZone.badgeClass}">
                      ครอบคลุม ${fieldTeams.length} ทีม ${fieldTeams.length ? `(${fieldTeams.map(t => t.name).join(', ')})` : ''}
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 mt-0.5">${fZone.subtitle} • สามารถกดย้ายทีมระหว่างสนามหลักและสนามรองได้ที่หัวการ์ดของแต่ละทีม</p>
                </div>
              </div>

              <!-- Field KPIs & Quick Actions -->
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-200 bg-slate-950/85 px-3.5 py-2 rounded-xl border border-slate-800">
                  <span>ทีม: <strong class="text-white">${fieldTeams.length}</strong></span>
                  <span>•</span>
                  <span>ปาร์ตี้รวม: <strong class="text-white">${allFieldParties.length} ตี้</strong></span>
                  <span>•</span>
                  <span>สมาชิก: <strong class="text-emerald-400">${allFieldMembers.length}/${allFieldParties.length * 5} คน</strong> <span class="text-[10px] text-slate-400">(พร้อม ${readyInField} / ลา ${leaveInField})</span></span>
                  <span>•</span>
                  <span>ผลรวม Gear ${fZone.name}: <strong class="mono text-amber-300">${fieldTotalGear.toLocaleString()}</strong></span>
                </div>

                <div class="flex items-center gap-1.5">
                  <button onclick="openExportImageModal('field_${fZone.key}')" class="px-3 py-2 rounded-xl bg-fuchsia-600/25 hover:bg-fuchsia-600/40 text-fuchsia-200 border border-fuchsia-500/40 text-xs font-semibold transition flex items-center gap-1" title="ส่งออกรูปภาพเฉพาะ ${fZone.name}">
                    <span>📸 รูป${fZone.name}</span>
                  </button>
                  <button onclick="openCreateTeamModal('${fZone.key}')" class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition flex items-center gap-1">
                    <span>➕ สร้างทีมใน${fZone.name}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Teams enclosed inside this Field -->
            <div class="space-y-5 pl-0 sm:pl-2">
              ${teamsCardsHtml}
            </div>
          </div>
        `;
      }).join('');
    }

    function handlePoolClick(memberId) {
      if (selectedSource && selectedSource.memberId === memberId) {
        selectedSource = null;
      } else {
        selectedSource = { type: 'pool', memberId };
      }
      renderBoard();
    }

    function handleSlotClick(partyId, slotIndex) {
      const party = parties.find(p => p.id === partyId);
      if (!party) return;
      const targetMemberId = party.slots[slotIndex];

      if (!selectedSource) {
        if (targetMemberId) {
          selectedSource = { type: 'slot', partyId, slotIndex, memberId: targetMemberId };
          renderBoard();
        }
        return;
      }

      if (selectedSource.type === 'pool') {
        parties.forEach(p => {
          const i = p.slots.indexOf(selectedSource.memberId);
          if (i !== -1) p.slots[i] = null;
        });
        party.slots[slotIndex] = selectedSource.memberId;
        selectedSource = null;
      } else if (selectedSource.type === 'slot') {
        const srcParty = parties.find(p => p.id === selectedSource.partyId);
        if (srcParty) {
          const temp = party.slots[slotIndex];
          party.slots[slotIndex] = selectedSource.memberId;
          srcParty.slots[selectedSource.slotIndex] = temp;
        }
        selectedSource = null;
      }
      renderAll();
      if (typeof triggerAutoSave === 'function') {
        triggerAutoSave('จัดผังทัพ GVG');
      }
    }

    function removeMemberFromSlot(partyId, slotIndex) {
      const party = parties.find(p => p.id === partyId);
      if (party) party.slots[slotIndex] = null;
      renderAll();
      if (typeof triggerAutoSave === 'function') {
        triggerAutoSave('นำคนออกจากตี้ GVG');
      }
    }

    async function markOfflineAsLeave() {
      const longOfflineList = ['ออฟไลน์ 4 วัน', 'ออฟไลน์ 5 วัน', 'ออฟไลน์ 6 วัน', 'ออฟไลน์เกิน 7 วัน'];
      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      let markedCount = 0;

      members.forEach(m => {
        ensureLeaveHistoryObject(m);
        m._leaveMigrated = true;
        if (longOfflineList.includes(m.onlineStatus)) {
          m.leaveHistory[selectedDate] = {
            status: 'leave',
            type: 'ลาทั้งวัน (ไม่เข้าเกม)',
            reason: m.onlineStatus,
            updatedAt: nowStamp
          };
          markedCount++;
        }
      });

      syncMembersStatusForSelectedDate();
      renderAll();
      showToast(`💤 บันทึกคนออฟไลน์ตั้งแต่ 4 วันขึ้นไป (${markedCount} คน) เป็น "ลา" ในวันที่ ${formatThaiDateShort(selectedDate)} แล้ว`, 'info');
      await saveLeaveToDatabaseSilent('ตั้งคนออฟไลน์เป็นลาประจำวัน');
    }

    async function markAllReady() {
      members.forEach(m => {
        ensureLeaveHistoryObject(m);
        m._leaveMigrated = true;
        if (m.leaveHistory[selectedDate]) {
          delete m.leaveHistory[selectedDate];
        }
        m.status = 'ready';
        m.leaveReason = '';
        m.leaveType = '';
      });
      syncMembersStatusForSelectedDate();
      renderAll();
      showToast(`✅ ตั้งสมาชิกทุกคนเป็นสถานะ "พร้อมวอร์" สำหรับวันที่ ${formatThaiDateShort(selectedDate)} แล้ว`, 'success');
      await saveLeaveToDatabaseSilent('ตั้งทุกคนพร้อมวอร์ประจำวัน');
    }

// Drag & Drop Functionality
(function () {
  let dragPayload = null;

  // ล้างสถานะการคลิกค้างไว้ก่อนหน้า เพื่อไม่ให้ชนกับการลากวาง
  function resetActiveSelections() {
    try {
      if (typeof selectedMemberId !== 'undefined') selectedMemberId = null;
      if (typeof selectedPoolMemberId !== 'undefined') selectedPoolMemberId = null;
      if (typeof selectedSlot !== 'undefined') selectedSlot = null;
      if (typeof activeSlot !== 'undefined') activeSlot = null;
    } catch (e) {}

    document.querySelectorAll('.slot-selected').forEach(el => {
      el.classList.remove('slot-selected');
    });
  }

  // ดึงพารามิเตอร์จาก onclick="handlePoolClick('id')" และ onclick="handleSlotClick('partyId', idx)"
  function parsePoolId(el) {
    const attr = el.getAttribute('onclick') || '';
    const match = attr.match(/handlePoolClick\(\s*['"]([^'"]+)['"]\s*\)/);
    return match ? match[1] : null;
  }

  function parseSlotInfo(el) {
    const attr = el.getAttribute('onclick') || '';
    const match = attr.match(/handleSlotClick\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*\)/);
    return match ? { partyId: match[1], slotIndex: parseInt(match[2], 10) } : null;
  }

  function isSlotOccupied(slotEl) {
    return !!slotEl.querySelector('[onclick*="removeMemberFromSlot"]');
  }

  // ผูก Event Drag & Drop ให้การ์ดรายชื่อและช่องในปาร์ตี้ทั้งหมด
  function bindDragAndDrop() {
    // 1. รายชื่อสมาชิกฝั่งซ้าย (Unassigned Pool)
    const poolCards = document.querySelectorAll('#unassignedPoolList [onclick*="handlePoolClick"]');
    poolCards.forEach(card => {
      if (card.dataset.dndBound === '1') return;
      const memberId = parsePoolId(card);
      if (!memberId) return;

      card.dataset.dndBound = '1';
      card.setAttribute('draggable', 'true');

      card.addEventListener('dragstart', (e) => {
        dragPayload = { type: 'pool', memberId };
        card.classList.add('dnd-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dnd-dragging');
        clearDropHighlights();
        dragPayload = null;
      });
    });

    // 2. ช่องสมาชิกในแต่ละปาร์ตี้ (Party Slots)
    const slotCards = document.querySelectorAll('#teamsHierarchyContainer [onclick*="handleSlotClick"]');
    slotCards.forEach(slotEl => {
      if (slotEl.dataset.dndBound === '1') return;
      const info = parseSlotInfo(slotEl);
      if (!info) return;

      slotEl.dataset.dndBound = '1';
      const occupied = isSlotOccupied(slotEl);

      // ถ้ารายชื่ออยู่ในช่องปาร์ตี้แล้ว ให้สามารถลากเพื่อย้ายหรือสลับช่องได้
      if (occupied) {
        slotEl.setAttribute('draggable', 'true');
        slotEl.addEventListener('dragstart', (e) => {
          dragPayload = {
            type: 'slot',
            partyId: info.partyId,
            slotIndex: info.slotIndex
          };
          slotEl.classList.add('dnd-dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
        });

        slotEl.addEventListener('dragend', () => {
          slotEl.classList.remove('dnd-dragging');
          clearDropHighlights();
          dragPayload = null;
        });
      }

      // เปิดให้ทุกช่องในปาร์ตี้รับการวาง (Drop Target)
      slotEl.addEventListener('dragover', (e) => {
        if (!dragPayload) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        slotEl.classList.add('dnd-drop-target');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('dnd-drop-target');
      });

      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slotEl.classList.remove('dnd-drop-target');

        const payload = dragPayload || safeParsePayload(e.dataTransfer.getData('text/plain'));
        if (!payload) return;

        // กรณีที่ 1: ลากจากรายชื่อฝั่งซ้าย มาลงช่องในปาร์ตี้
        if (payload.type === 'pool' && payload.memberId) {
          resetActiveSelections();
          handlePoolClick(payload.memberId);
          handleSlotClick(info.partyId, info.slotIndex);
        }
        // กรณีที่ 2: ลากจากช่องในปาร์ตี้ มาสลับหรือย้ายไปอีกช่อง
        else if (payload.type === 'slot') {
          if (payload.partyId === info.partyId && payload.slotIndex === info.slotIndex) return;
          resetActiveSelections();
          handleSlotClick(payload.partyId, payload.slotIndex);
          handleSlotClick(info.partyId, info.slotIndex);
        }

        dragPayload = null;
      });
    });

    // 3. รองรับการลากไปปล่อยบนกรอบการ์ดปาร์ตี้โดยตรง (หาช่องว่างช่องแรกให้อัตโนมัติ)
    const partyCards = document.querySelectorAll('#teamsHierarchyContainer [onclick*="clearSingleParty"]');
    partyCards.forEach(clearBtn => {
      const partyCard = clearBtn.closest('.rounded-2xl');
      if (!partyCard || partyCard.dataset.dndPartyBound === '1') return;
      partyCard.dataset.dndPartyBound = '1';

      partyCard.addEventListener('dragover', (e) => {
        if (!dragPayload || dragPayload.type !== 'pool') return;
        e.preventDefault();
        partyCard.classList.add('dnd-drop-target');
      });

      partyCard.addEventListener('dragleave', (e) => {
        if (!partyCard.contains(e.relatedTarget)) {
          partyCard.classList.remove('dnd-drop-target');
        }
      });

      partyCard.addEventListener('drop', (e) => {
        if (!dragPayload || dragPayload.type !== 'pool') return;
        e.preventDefault();
        partyCard.classList.remove('dnd-drop-target');

        // ค้นหาช่องว่างช่องแรกในปาร์ตี้นี้ (ถ้าเต็มแล้วจะลงช่องที่ 1)
        const slotsInParty = Array.from(partyCard.querySelectorAll('[onclick*="handleSlotClick"]'));
        const targetSlot = slotsInParty.find(s => !isSlotOccupied(s)) || slotsInParty[0];
        if (!targetSlot) return;

        const targetInfo = parseSlotInfo(targetSlot);
        if (targetInfo) {
          resetActiveSelections();
          handlePoolClick(dragPayload.memberId);
          handleSlotClick(targetInfo.partyId, targetInfo.slotIndex);
        }
        dragPayload = null;
      });
    });

    // 4. ลากจากปาร์ตี้กลับมาปล่อยที่กล่องรายชื่อฝั่งซ้าย เพื่อถอดออกจากตี้
    const poolContainer = document.getElementById('unassignedPoolList');
    if (poolContainer && poolContainer.dataset.dndPoolBound !== '1') {
      poolContainer.dataset.dndPoolBound = '1';

      poolContainer.addEventListener('dragover', (e) => {
        if (!dragPayload || dragPayload.type !== 'slot') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        poolContainer.classList.add('dnd-pool-target');
      });

      poolContainer.addEventListener('dragleave', (e) => {
        if (!poolContainer.contains(e.relatedTarget)) {
          poolContainer.classList.remove('dnd-pool-target');
        }
      });

      poolContainer.addEventListener('drop', (e) => {
        poolContainer.classList.remove('dnd-pool-target');
        const payload = dragPayload || safeParsePayload(e.dataTransfer.getData('text/plain'));
        if (!payload || payload.type !== 'slot') return;

        e.preventDefault();
        resetActiveSelections();
        if (typeof removeMemberFromSlot === 'function') {
          removeMemberFromSlot(payload.partyId, payload.slotIndex);
        }
        dragPayload = null;
      });
    }
  }

  function safeParsePayload(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  function clearDropHighlights() {
    document.querySelectorAll('.dnd-drop-target, .dnd-pool-target').forEach(el => {
      el.classList.remove('dnd-drop-target', 'dnd-pool-target');
    });
  }

  // ดักจับการ Re-render ของกระดานจัดตี้ด้วย MutationObserver
  function initDragObserver() {
    bindDragAndDrop();
    const targets = [
      document.getElementById('unassignedPoolList'),
      document.getElementById('teamsHierarchyContainer')
    ].filter(Boolean);

    const observer = new MutationObserver(() => {
      bindDragAndDrop();
    });

    targets.forEach(t => observer.observe(t, { childList: true, subtree: true }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDragObserver);
  } else {
    initDragObserver();
  }
})();
