// ============================================================================
// MEMBER SELF-LOOKUP & QUICK LEAVE
// ============================================================================

    function renderMemberQuickCheck() {
      syncMembersStatusForSelectedDate();
      const q = (document.getElementById('memberQuickSearch').value || '').trim().toLowerCase();
      const resEl = document.getElementById('memberQuickResult');
      if (!q) {
        resEl.innerHTML = `<div class="text-center text-xs text-slate-500 py-4">กรุณาพิมพ์ชื่อตัวละครด้านบนเพื่อตรวจสอบทีม ปาร์ตี้ และแจ้งลาประจำวัน (${formatThaiDateFull(selectedDate)})</div>`;
        return;
      }
      const matches = members.filter(m => m.name.toLowerCase().includes(q));
      if (!matches.length) {
        resEl.innerHTML = `<div class="text-center text-sm text-rose-400 py-4">ไม่พบชื่อตัวละครนี้ในรายชื่อกิลด์</div>`;
        return;
      }
      resEl.innerHTML = matches.map(m => {
        const meta = getJobMeta(m.job);
        const rec = m.leaveHistory ? m.leaveHistory[selectedDate] : null;
        const pInfo = findMemberPartyInfo(m.id);
        const siegeInfo = (typeof findMemberSiegePartyInfo === 'function') ? findMemberSiegePartyInfo(m.id) : null;
        const polarityInfo = (typeof findMemberPolarityPartyInfo === 'function') ? findMemberPolarityPartyInfo(m.id) : null;
        const presetInfo = (typeof findMemberPresetPartyInfo === 'function') ? findMemberPresetPartyInfo(m.id) : null;
        const selfLeaveControlsHtml = `
          <div class="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div class="text-xs text-slate-300">
              <span>📅 สถานะวันที่ <strong>${formatThaiDateFull(selectedDate)}</strong>:</span>
              ${rec
                ? `<span class="ml-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">🏖️ ${rec.type} (${rec.reason})</span>`
                : `<span class="ml-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">✅ พร้อมวอร์</span>`
              }
            </div>
            <div class="flex items-center gap-1.5">
              ${rec ? `
                <button onclick="editMemberDailyLeaveReason('${m.id}', '${selectedDate}')" class="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">✏️ แก้เหตุผล</button>
                <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ready')" class="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition">✅ เปลี่ยนเป็นพร้อมวอร์</button>
              ` : `
                <button onclick="promptMemberSelfLeave('${m.id}')" class="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition">🏖️ แจ้งลาวันนี้ (บันทึกลง Cloud)</button>
              `}
            </div>
          </div>
        `;

        const assignmentsHtml = `
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <!-- GVG -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span class="font-bold text-indigo-400">🛡️ GVG:</span>
              ${pInfo
                ? `<span class="text-white font-medium">${pInfo.team.name} • <strong>${pInfo.party.name}</strong> (ช่อง ${pInfo.slotIndex + 1})</span>`
                : `<span class="text-slate-500">ยังไม่มีตี้</span>`
              }
            </div>
            <!-- Siege War -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span class="font-bold text-rose-400">🏰 Siege War:</span>
              ${siegeInfo
                ? `<span class="text-white font-medium">${siegeInfo.teamName} • <strong>${siegeInfo.party.name}</strong> (ช่อง ${siegeInfo.slotIndex + 1})</span>`
                : `<span class="text-slate-500">ยังไม่มีตี้</span>`
              }
            </div>
            <!-- Polarity -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span class="font-bold text-amber-400">⚡ Polarity:</span>
              ${polarityInfo
                ? `<span class="text-white font-medium">${polarityInfo.teamName} • <strong>${polarityInfo.party.name}</strong> (ช่อง ${polarityInfo.slotIndex + 1})</span>`
                : `<span class="text-slate-500">ยังไม่มีตี้</span>`
              }
            </div>
            <!-- Preset Squad -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span class="font-bold text-teal-400">👥 ตี้ประจำ:</span>
              ${presetInfo
                ? `<span class="text-white font-medium"><strong>${presetInfo.partyName}</strong> (ช่อง ${presetInfo.slotIndex + 1})</span>`
                : `<span class="text-slate-500">ยังไม่มีตี้</span>`
              }
            </div>
          </div>
        `;

        if (!pInfo) {
          return `
            <div style="${meta.cardTintStyle}" class="p-4 rounded-2xl border mb-3 space-y-2">
              <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex items-center gap-3">
                  ${renderJobEmblem(m.job, 42)}
                  <div>
                    <div class="flex items-center gap-2">
                      ${renderColoredMemberName(m, 'text-sm')}
                      <span class="text-xs text-slate-300">(Lv.${m.lv} ${m.job})</span>
                    </div>
                    <div class="text-xs text-slate-300 mt-1">คะแนน Gear: ${m.gear.toLocaleString()}</div>
                  </div>
                </div>
                ${formatGearBadge(m.gear)}
              </div>
              ${assignmentsHtml}
              ${selfLeaveControlsHtml}
            </div>
          `;
        }
        const tTheme = getTeamTheme(pInfo.team.color);
        const teammates = pInfo.party.slots.map(id => members.find(x => x.id === id)).filter(Boolean);
        return `
          <div class="p-4 rounded-2xl border-2 ${tTheme.containerBorder} ${tTheme.containerBg} mb-3 space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-3">
                ${renderJobEmblem(m.job, 44)}
                <div>
                  <div class="flex items-center gap-1.5 flex-wrap mb-1">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${pInfo.fieldZone.badgeClass}">
                      <span>${pInfo.fieldZone.icon} ${pInfo.fieldZone.name}</span>
                    </span>
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${tTheme.badgeClass}">
                      <span class="w-2 h-2 rounded-full ${tTheme.dotClass}"></span>
                      <span>${pInfo.team.name}</span>
                    </span>
                  </div>
                  <h3 class="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                    ${renderColoredMemberName(m, 'text-sm')}
                    <span>อยู่ใน <span class="underline decoration-amber-400">${pInfo.party.name}</span> (ช่องที่ ${pInfo.slotIndex + 1})</span>
                  </h3>
                </div>
              </div>
              ${formatGearBadge(m.gear)}
            </div>
            ${assignmentsHtml}
            <div class="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
              ${teammates.map(tm => {
                const tmMeta = getJobMeta(tm.job);
                return `
                  <div style="${tmMeta.cardTintStyle}" class="p-2.5 rounded-xl border ${tm.id === m.id ? 'ring-2 ring-amber-400' : ''} text-xs flex items-center gap-2">
                    ${renderJobEmblem(tm.job, 28)}
                    <div class="min-w-0">
                      <div class="truncate">${renderColoredMemberName(tm, 'px-1.5 py-0 text-[11px]')}</div>
                      <div class="text-[10px] text-slate-300 mt-0.5 truncate">${tm.job} • ${(tm.gear/1000).toFixed(1)}k</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            ${selfLeaveControlsHtml}
          </div>
        `;
      }).join('');
    }

    function promptMemberSelfLeave(memberId) {
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      openCustomDialog({
        title: `🏖️ แจ้งลาประจำวันที่ ${formatThaiDateFull(selectedDate)}`,
        message: `ตัวละคร: ${m.name} (${m.job})\nกรุณาระบุเหตุผลการลา (จะถูกบันทึกลงฐานข้อมูลทันที):`,
        showInput: true,
        defaultInput: 'ติดธุระส่วนตัว',
        confirmText: '💾 บันทึกการลา',
        onConfirm: async (reasonVal) => {
          ensureLeaveHistoryObject(m);
          m._leaveMigrated = true;
          m.leaveHistory[selectedDate] = {
            status: 'leave',
            type: 'ลากิลด์วอร์ GBG',
            reason: (reasonVal || '').trim() || 'ติดธุระส่วนตัว',
            updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
          };
          syncMembersStatusForSelectedDate();
          renderAll();
          showToast(`🏖️ บันทึกการลาของ "${m.name}" ลง Database เรียบร้อยแล้ว`, 'success');
          await saveLeaveToDatabaseSilent(`ลูกกิลด์แจ้งลา: ${m.name}`);
        }
      });
    }
