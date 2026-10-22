// ============================================================================

// DAILY LEAVE RECORDING SYSTEM LOGIC

// ============================================================================

    function syncLeaveEndDateMin() {

      const startEl = document.getElementById('leaveFormStartDate');

      const endEl = document.getElementById('leaveFormEndDate');

      if (!startEl || !endEl) return;

      if (endEl.value < startEl.value) {

        endEl.value = startEl.value;

      }

    }

    function setLeaveFormSingleDay() {

      const startEl = document.getElementById('leaveFormStartDate');

      const endEl = document.getElementById('leaveFormEndDate');

      if (startEl && endEl) {

        endEl.value = startEl.value || selectedDate;

      }

    }

    function setQuickLeaveReason(reasonText) {

      const input = document.getElementById('leaveFormReasonInput');

      if (input) input.value = reasonText;

    }

    function updateLeaveTypeRadioStyles() {

      const radios = document.querySelectorAll('input[name="leaveTypeRadio"]');

      radios.forEach(r => {

        const label = r.closest('label');

        if (!label) return;

        if (r.checked) {

          label.className = 'cursor-pointer flex items-center gap-2 p-2.5 rounded-xl border border-amber-400/70 bg-amber-500/15 text-white text-xs font-semibold transition shadow';

        } else {

          label.className = 'cursor-pointer flex items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs font-medium transition hover:border-slate-700';

        }

      });

    }

    function populateLeaveMemberSelect() {
      const select = document.getElementById('leaveFormMemberSelect');

      if (!select) return;

      const q = (document.getElementById('leaveFormMemberSearch')?.value || '').trim().toLowerCase();

      const prevVal = select.value;

      const filtered = members

        .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q))

        .sort((a, b) => a.name.localeCompare(b.name, 'th'));

      if (filtered.length === 0) {

        select.innerHTML = `<option value="" disabled>ไม่พบรายชื่อสมาชิก (${members.length === 0 ? 'กรุณานำเข้าหรือเพิ่มสมาชิกก่อน' : 'ลองค้นหาคำอื่น'})</option>`;

        return;

      }

      select.innerHTML = filtered.map((m, idx) => {

        const pInfo = findMemberPartyInfo(m.id);

        const teamText = pInfo ? `${pInfo.team.name} • ${pInfo.party.name}` : 'ยังไม่ลงตี้';

        const hasLeaveOnSelected = m.leaveHistory && m.leaveHistory[selectedDate];

        const statusMark = hasLeaveOnSelected ? '🏖️ (ลาวันนี้)' : '✅';

        const isSelected = prevVal ? (m.id === prevVal) : (idx === 0);

        return `<option value="${m.id}" ${isSelected ? 'selected' : ''} class="py-1 px-2 rounded hover:bg-slate-800">${statusMark} ${m.name} — ${m.job} [${teamText}]</option>`;

      }).join('');

    }

    async function submitDailyLeaveForm() {

      if (members.length === 0) {

        showToast('กรุณาเพิ่มสมาชิกหรือนำเข้าไฟล์ CSV ก่อนบันทึกการลาครับ', 'danger');

        return;

      }

      const memberId = document.getElementById('leaveFormMemberSelect')?.value;

      const member = members.find(m => String(m.id) === String(memberId));

      if (!member) {

        showToast('กรุณาคลิกเลือกสมาชิกที่ต้องการแจ้งลาจากรายการก่อนครับ', 'danger');

        return;

      }

      const startIso = document.getElementById('leaveFormStartDate')?.value || selectedDate;

      const endIso = document.getElementById('leaveFormEndDate')?.value || startIso;

      const checkedRadio = document.querySelector('input[name="leaveTypeRadio"]:checked');

      const leaveType = checkedRadio ? checkedRadio.value : 'ลากิลด์วอร์ GVG';

      const reasonInput = document.getElementById('leaveFormReasonInput');

      const leaveReason = (reasonInput?.value || '').trim() || 'ติดธุระส่วนตัว';

      const targetDates = getDatesBetween(startIso, endIso);

      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

      ensureLeaveHistoryObject(member);

      member._leaveMigrated = true;

      targetDates.forEach(dStr => {

        member.leaveHistory[dStr] = {

          status: 'leave',

          type: leaveType,

          reason: leaveReason,

          updatedAt: nowStamp

        };

      });

      selectedDate = startIso;

      document.getElementById('headerDateInput').value = selectedDate;

      document.getElementById('leaveDatePicker').value = selectedDate;

      if (reasonInput) reasonInput.value = '';

      syncMembersStatusForSelectedDate();

      renderAll();

      const dayRangeMsg = targetDates.length > 1

        ? `${targetDates.length} วัน (${formatThaiDateShort(startIso)} - ${formatThaiDateShort(endIso)})`

        : `วันที่ ${formatThaiDateFull(startIso)}`;

      showToast(`🏖️ บันทึกการลาของ "${member.name}" (${dayRangeMsg}) แล้ว กำลังซิงค์ลง Database...`, 'success');

      await saveLeaveToDatabaseSilent(`บันทึกการลา: ${member.name}`);

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

      populateLeaveMemberSelect();

      const selectEl = document.getElementById('leaveFormMemberSelect');

      if (selectEl) selectEl.value = m.id;

      const startEl = document.getElementById('leaveFormStartDate');

      const endEl = document.getElementById('leaveFormEndDate');

      if (startEl) startEl.value = targetDate;

      if (endEl) endEl.value = targetDate;

      const radios = document.querySelectorAll('input[name="leaveTypeRadio"]');

      radios.forEach(r => { r.checked = (r.value === rec.type); });

      updateLeaveTypeRadioStyles();

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

    function clearMemberAllLeaveHistory(memberId) {

      const m = members.find(x => String(x.id) === String(memberId));

      if (!m) return;

      const count = m.leaveHistory ? Object.keys(m.leaveHistory).length : 0;

      if (count === 0) return;

      openCustomDialog({

        title: `🗑️ ล้างประวัติการลาทั้งหมดของ "${m.name}"`,

        message: `ต้องการลบประวัติการลาสะสมทั้งหมด ${count} วัน ของ "${m.name}" ออกจากฐานข้อมูลใช่หรือไม่?`,

        confirmText: 'ล้างประวัติการลา',

        onConfirm: async () => {

          m.leaveHistory = {};

          m._leaveMigrated = true;

          m.status = 'ready';

          m.leaveReason = '';

          m.leaveType = '';

          syncMembersStatusForSelectedDate();

          renderAll();

          showToast(`🗑️ ล้างประวัติการลาของ "${m.name}" เรียบร้อยแล้ว`, 'danger');

          await saveLeaveToDatabaseSilent(`ล้างประวัติการลา: ${m.name}`);

        }

      });

    }

    function clearAllLeaveForSelectedDate() {

      openCustomDialog({

        title: `✅ ตั้งทุกคนพร้อมวอร์ในวันที่ ${formatThaiDateFull(selectedDate)}`,

        message: `ต้องการยกเลิกรายการลาทั้งหมดของวันที่ ${formatThaiDateFull(selectedDate)} และตั้งให้ทุกคนพร้อมวอร์ใช่หรือไม่?`,

        confirmText: 'ตั้งทุกคนพร้อมวอร์วันนี้',

        onConfirm: async () => {

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

          showToast(`✅ ตั้งสมาชิกทุกคนพร้อมวอร์สำหรับวันที่ ${formatThaiDateShort(selectedDate)} แล้ว`, 'success');

          await saveLeaveToDatabaseSilent(`รีเซ็ตการลาประจำวันที่ ${selectedDate}`);

        }

      });

    }

    function switchLeaveSubView(viewName) {

      activeLeaveSubView = viewName;

      ['dailyList', 'quickCheckin', 'statsHistory'].forEach(v => {

        const el = document.getElementById('leaveSubView-' + v);

        const btn = document.getElementById('leaveSubBtn-' + v);

        if (el) el.classList.toggle('hidden', v !== viewName);

        if (btn) {

          btn.className = v === viewName

            ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white transition shadow'

            : 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition';

        }

      });

      renderLeaveSection();

    }

    function getLeaveTypeBadgeHtml(typeStr) {

      const t = typeStr || 'ลากิลด์วอร์ GVG';

      if (t.includes('Polarity') || t.includes('ทีมดาว')) {

        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">⚡ ${t}</span>`;

      }

      if (t.includes('Siege War')) {

        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">🏰 ${t}</span>`;

      }

      if (t.includes('ศึกชิงปราสาท')) {

        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">🏰 ${t}</span>`;

      }

      if (t.includes('กิลด์วอร์') || t.includes('GBG') || t.includes('GVG')) {

        return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">⚔️ ${t}</span>`;

      }

      return `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">📋 ${t}</span>`;

    }

    function renderLeaveCalendarStrip() {

      const strip = document.getElementById('leaveCalendarStrip');

      if (!strip) return;

      const [y, m, d] = selectedDate.split('-').map(Number);

      const centerDate = new Date(y, m - 1, d);

      const todayIso = getLocalDateISO(new Date());

      const daysHtml = [];

      for (let offset = -2; offset <= 4; offset++) {

        const dt = new Date(centerDate);

        dt.setDate(dt.getDate() + offset);

        const iso = getLocalDateISO(dt);

        const isSelected = iso === selectedDate;

        const isToday = iso === todayIso;

        const leaveCount = members.filter(mem => mem.leaveHistory && mem.leaveHistory[iso]).length;

        const cardStyle = isSelected

          ? 'bg-gradient-to-b from-indigo-600/40 to-slate-900 border-indigo-400 ring-2 ring-indigo-500/40 text-white'

          : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800 text-slate-300';

        daysHtml.push(`

          <button onclick="changeSelectedDate('${iso}')" class="p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${cardStyle}">

            <div class="flex items-center justify-between w-full">

              <span class="text-[11px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}">${getDayNameShort(iso)}</span>

              ${isToday ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">วันนี้</span>` : ''}

            </div>

            <div class="my-1 font-bold text-xs sm:text-sm text-white">${formatThaiDateShort(iso)}</div>

            <div class="flex items-center justify-between w-full pt-1 border-t border-slate-800/80">

              <span class="text-[10px] text-slate-400">แจ้งลา:</span>

              <span class="mono px-1.5 py-0.2 rounded-full text-[10px] font-bold ${leaveCount > 0 ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'}">

                ${leaveCount} คน

              </span>

            </div>

          </button>

        `);

      }

      strip.innerHTML = daysHtml.join('');

    }

    function renderLeaveSection() {

      const badgeEl = document.getElementById('leaveTabDateThaiBadge');

      if (badgeEl) badgeEl.textContent = `📅 ${formatThaiDateFull(selectedDate)}`;

      const headerInput = document.getElementById('headerDateInput');

      const leaveInput = document.getElementById('leaveDatePicker');

      if (headerInput && headerInput.value !== selectedDate) headerInput.value = selectedDate;

      if (leaveInput && leaveInput.value !== selectedDate) leaveInput.value = selectedDate;

      renderLeaveCalendarStrip();

      populateLeaveMemberSelect();

      const onLeaveList = members.filter(m => m.leaveHistory && m.leaveHistory[selectedDate]);

      const readyCount = members.length - onLeaveList.length;

      const absentCount = onLeaveList.filter(m => {

        const t = m.leaveHistory[selectedDate]?.type || '';

        return t.includes('กิลด์วอร์') || t.includes('ทั้งวัน');

      }).length;

      const lateOrEventCount = onLeaveList.length - absentCount;

      const assignedSet = getAssignedSet();

      const inPartyLeaveCount = onLeaveList.filter(m => assignedSet.has(m.id)).length;

      document.getElementById('leaveStatReadyDay').textContent = `${readyCount} คน`;

      document.getElementById('leaveStatAbsentDay').textContent = `${absentCount} คน`;

      document.getElementById('leaveStatLateDay').textContent = `${lateOrEventCount} คน`;

      document.getElementById('leaveStatInPartyDay').textContent = `${inPartyLeaveCount} คน`;

      document.getElementById('leaveDailyCountLabel').textContent = onLeaveList.length;

      const btnClearAllDaily = document.getElementById('btnClearAllDailyLeave');

      if (btnClearAllDaily) {

        btnClearAllDaily.classList.toggle('hidden', onLeaveList.length === 0);

      }

      const dailyContainer = document.getElementById('dailyLeaveCardsContainer');

      if (dailyContainer) {

        if (onLeaveList.length === 0) {

          dailyContainer.innerHTML = `

            <div class="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">

              <div class="text-2xl">🎉</div>

              <div class="text-sm font-semibold text-emerald-400">ไม่มีสมาชิกแจ้งลาในวันที่ ${formatThaiDateFull(selectedDate)}</div>

              <div class="text-xs text-slate-400">สมาชิกทุกคนพร้อมเข้าร่วมกิลด์วอร์และกิจกรรมกิลด์ หรือสามารถบันทึกการลาได้ที่ฟอร์มด้านซ้าย</div>

            </div>

          `;

        } else {

          dailyContainer.innerHTML = onLeaveList.map(m => {

            const rec = m.leaveHistory[selectedDate];

            const meta = getJobMeta(m.job);

            const pInfo = findMemberPartyInfo(m.id);

            let partyHtml = `<span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">ไม่ได้ลงตี้</span>`;

            if (pInfo) {

              const tTheme = getTeamTheme(pInfo.team.color);

              partyHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${tTheme.badgeClass}">${pInfo.team.name} • ${pInfo.party.name}</span>`;

            }

            return `

              <div style="${meta.cardTintStyle}" class="p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3">

                <div class="flex items-center gap-3 min-w-0">

                  ${renderJobEmblem(m.job, 38)}

                  <div class="min-w-0">

                    <div class="flex items-center gap-2 flex-wrap">

                      <span style="${meta.namePillStyle}" class="px-2.5 py-0.5 rounded-lg border font-bold text-xs">${m.name}</span>

                      <span style="${meta.badgeStyle}" class="px-2 py-0.5 rounded text-[10px] font-medium border">${m.job}</span>

                      ${partyHtml}

                      ${getLeaveTypeBadgeHtml(rec.type)}

                    </div>

                    <div class="text-xs text-slate-200 mt-1.5 flex items-center gap-2 flex-wrap">

                      <span>💬 เหตุผล: <strong class="text-amber-300">${rec.reason || 'ไม่ระบุ'}</strong></span>

                      ${rec.updatedAt ? `<span class="text-[10px] text-slate-400">(บันทึกเมื่อ ${rec.updatedAt})</span>` : ''}

                    </div>

                  </div>

                </div>

                <div class="flex items-center gap-1.5 shrink-0">

                  <button onclick="editMemberDailyLeaveReason('${m.id}', '${selectedDate}')" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition">

                    ✏️ แก้ไข

                  </button>

                  <button onclick="removeMemberLeaveOnDate('${m.id}', '${selectedDate}')" class="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition">

                    ✅ ยกเลิกการลาวันนี้

                  </button>

                </div>

              </div>

            `;

          }).join('');

        }

      }

      if (activeLeaveSubView === 'quickCheckin') {

        renderLeaveQuickCheckin();

      } else if (activeLeaveSubView === 'statsHistory') {

        renderLeaveStatsTable();

      }

    }

    function renderLeaveQuickCheckin() {

      const container = document.getElementById('quickCheckinListContainer');

      if (!container) return;

      const q = (document.getElementById('quickCheckinSearch')?.value || '').trim().toLowerCase();

      const filtered = members.filter(m => {

        if (activeJobBarFamily !== 'all' && getJobFamily(m.job).familyKey !== activeJobBarFamily) return false;

        if (!q) return true;

        const pInfo = findMemberPartyInfo(m.id);

        const teamStr = pInfo ? `${pInfo.team.name} ${pInfo.party.name}`.toLowerCase() : '';

        return m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || teamStr.includes(q);

      });

      if (filtered.length === 0) {

        container.innerHTML = `<div class="py-8 text-center text-xs text-slate-500">ไม่พบรายชื่อสมาชิกที่ค้นหา</div>`;

        return;

      }

      container.innerHTML = filtered.map(m => {

        const rec = m.leaveHistory ? m.leaveHistory[selectedDate] : null;

        const curType = rec ? rec.type : 'ready';

        const pInfo = findMemberPartyInfo(m.id);

        const teamBadge = pInfo

          ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${getTeamTheme(pInfo.team.color).badgeClass}">${pInfo.team.name} • ${pInfo.party.name}</span>`

          : `<span class="text-[10px] text-slate-500">ยังไม่ลงตี้</span>`;

        const btnReadyClass = curType === 'ready'

          ? 'bg-emerald-600 text-white font-bold shadow'

          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800';

        const btnGvgClass = (curType.includes('กิลด์วอร์') || curType.includes('GBG') || curType.includes('GVG'))

          ? 'bg-rose-600 text-white font-bold shadow'

          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800';

        const btnGeneralClass = (curType === 'ลา' || curType.includes('ทั้งวัน'))

          ? 'bg-orange-600 text-white font-bold shadow'

          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800';

        const btnSiegeWarClass = (curType.includes('Siege War') || curType.includes('ศึกชิงปราสาท'))

          ? 'bg-amber-600 text-white font-bold shadow'

          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800';

        const btnPolarityClass = (curType.includes('Polarity') || curType.includes('ทีมดาว'))

          ? 'bg-indigo-600 text-white font-bold shadow'

          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800';

        return `

          <div class="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-2">

            <div class="flex items-center gap-2.5 min-w-0">

              ${renderJobEmblem(m.job, 30)}

              <div class="min-w-0">

                <div class="flex items-center gap-1.5 flex-wrap">

                  ${renderColoredMemberName(m)}

                  <span class="text-[11px] text-slate-400">${m.job}</span>

                  ${teamBadge}

                </div>

                ${rec ? `<div class="text-[11px] text-rose-300 mt-0.5">เหตุผล: ${rec.reason}</div>` : ''}

              </div>

            </div>

            <div class="flex flex-wrap items-center gap-1">
              <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ready')" class="px-2.5 py-1 rounded-lg text-[11px] transition ${btnReadyClass}">
                ✅ พร้อม
              </button>
              <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ลากิลด์วอร์ GVG', 'ลากิลด์วอร์ GVG')" class="px-2 py-1 rounded-lg text-[11px] transition ${btnGvgClass}">
                ⚔️ ลา GBG
              </button>
              <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ลาSiege War (ศึกชิงปราสาท)', 'ลาSiege War (ศึกชิงปราสาท)')" class="px-2 py-1 rounded-lg text-[11px] transition ${btnSiegeWarClass}">
                🏰 ลาSiege War
              </button>
              <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ลาPolarity', 'ลาPolarity')" class="px-2 py-1 rounded-lg text-[11px] transition ${btnPolarityClass}">
                ⚡ ลาPolarity
              </button>
              <button onclick="setMemberDailyLeaveQuick('${m.id}', '${selectedDate}', 'ลา', 'แจ้งลา')" class="px-2 py-1 rounded-lg text-[11px] transition ${btnGeneralClass}">
                📋 ลา
              </button>
            </div>

          </div>

        `;

      }).join('');

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

    function renderLeaveStatsTable() {

      const tbody = document.getElementById('leaveStatsTableBody');

      if (!tbody) return;

      const q = (document.getElementById('leaveStatsSearch')?.value || '').trim().toLowerCase();

      const sortMode = document.getElementById('leaveStatsSortSelect')?.value || 'daily_desc';

      const rowsData = members

        .filter(m => !q || m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q))

        .map(m => {

          ensureLeaveHistoryObject(m);

          const dates = Object.keys(m.leaveHistory).sort().reverse();

          const evSummary = getMemberWeeklyEventSummaryAllWeeks(m);

          return {

            member: m,

            dates,

            count: dates.length,

            evSummary

          };

        })

        .sort((a, b) => {

          if (sortMode === 'event_leave_absent_desc') {

            return b.evSummary.leaveAndAbsent - a.evSummary.leaveAndAbsent || b.count - a.count || b.member.gear - a.member.gear;

          }

          if (sortMode === 'event_absent_desc') {

            return b.evSummary.absent - a.evSummary.absent || b.evSummary.leave - a.evSummary.leave || b.count - a.count;

          }

          if (sortMode === 'total_all_desc') {

            return (b.count + b.evSummary.leaveAndAbsent) - (a.count + a.evSummary.leaveAndAbsent) || b.member.gear - a.member.gear;

          }

          return b.count - a.count || b.evSummary.leaveAndAbsent - a.evSummary.leaveAndAbsent || b.member.gear - a.member.gear;

        });

      if (rowsData.length === 0) {

        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500">ไม่พบข้อมูลสมาชิก</td></tr>`;

        return;

      }

      tbody.innerHTML = rowsData.map(({ member: m, dates, count, evSummary }) => {

        const pInfo = findMemberPartyInfo(m.id);

        const teamHtml = pInfo

          ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${getTeamTheme(pInfo.team.color).badgeClass}">${pInfo.team.name} • ${pInfo.party.name}</span>`

          : `<span class="text-slate-500 text-[11px]">-</span>`;

        const historyPills = dates.length

          ? dates.map(dStr => {

              const r = m.leaveHistory[dStr];

              return `

                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-slate-200 mr-1 mb-1">

                  <span onclick="changeSelectedDate('${dStr}')" title="คลิกเพื่อสลับไปดูวันที่ ${formatThaiDateFull(dStr)}" class="cursor-pointer hover:underline">

                    <strong class="mono text-amber-300">${formatThaiDateShort(dStr)}</strong>

                    <span class="text-slate-400">(${r.reason || r.type})</span>

                  </span>

                  <button onclick="removeMemberLeaveOnDate('${m.id}', '${dStr}')" title="ยกเลิกการลาของวันที่ ${formatThaiDateShort(dStr)}" class="text-rose-400 hover:text-rose-200 font-bold px-1 rounded hover:bg-rose-500/20 transition">✕</button>

                </span>

              `;

            }).join('')

          : `<span class="text-slate-500 text-[11px]">ไม่เคยลารายวัน (เข้าครบทุกวัน)</span>`;

        const evStatsBadge = `

          <div class="inline-flex items-center gap-1.5 flex-wrap justify-center">

            <span class="mono px-2 py-0.5 rounded-md text-[11px] font-semibold ${evSummary.leave > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}">

              🏖️ ลา: ${evSummary.leave}

            </span>

            <span class="mono px-2 py-0.5 rounded-md text-[11px] font-semibold ${evSummary.absent > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'}">

              ❌ ขาด: ${evSummary.absent}

            </span>

          </div>

        `;

        return `

          <tr class="hover:bg-slate-800/40 transition">

            <td class="py-2.5 px-3">

              <div class="flex items-center gap-2">

                ${renderJobEmblem(m.job, 26)}

                <div>

                  ${renderColoredMemberName(m)}

                  <div class="text-[10px] text-slate-400 mt-0.5">${m.job}</div>

                </div>

              </div>

            </td>

            <td class="py-2.5 px-3">${teamHtml}</td>

            <td class="py-2.5 px-3 text-center">

              <span class="mono px-2.5 py-0.5 rounded-full text-xs font-bold ${count > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}">

                ${count} วัน

              </span>

            </td>

            <td class="py-2.5 px-3 text-center">${evStatsBadge}</td>

            <td class="py-2.5 px-3 max-w-md">${historyPills}</td>

            <td class="py-2.5 px-3 text-right">

              ${count > 0 ? `

                <button onclick="clearMemberAllLeaveHistory('${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] transition">

                  ล้างประวัติ

                </button>

              ` : '-'}

            </td>

          </tr>

        `;

      }).join('');

    }

    function copyDailyLeaveReport() {

      const onLeaveList = members.filter(m => m.leaveHistory && m.leaveHistory[selectedDate]);

      const lines = [];

      lines.push(`🏖️ สรุปรายชื่อคนลาประจำวัน — ${guildName}`);

      lines.push(`📅 ประจำวันที่: ${formatThaiDateFull(selectedDate)}`);

      lines.push(`✅ พร้อมวอร์: ${members.length - onLeaveList.length} คน | 🚨 แจ้งลา: ${onLeaveList.length} คน`);

      lines.push(`========================================`);

      if (onLeaveList.length === 0) {

        lines.push(`🎉 ไม่มีสมาชิกแจ้งลาในวันนี้ (พร้อมวอร์ครบทุกคน!)`);

      } else {

        onLeaveList.forEach((m, idx) => {

          const rec = m.leaveHistory[selectedDate];

          const pInfo = findMemberPartyInfo(m.id);

          const teamText = pInfo ? `[${pInfo.team.name} - ${pInfo.party.name}]` : `[ไม่ได้ลงตี้]`;

          lines.push(`${idx + 1}. ${m.name} (${m.job}) ${teamText} — ${rec.type} (เหตุผล: ${rec.reason || '-'})`);

        });

      }

      const tempArea = document.createElement('textarea');

      tempArea.value = lines.join('\n');

      document.body.appendChild(tempArea);

      tempArea.select();

      document.execCommand('copy');

      tempArea.remove();

      showToast(`📋 คัดลอกสรุปรายชื่อคนลาประจำวันที่ ${formatThaiDateShort(selectedDate)} แล้ว!`, 'success');

    }

    function exportLeaveHistoryCSV() {

      const headers = ['วันที่ลา (YYYY-MM-DD)', 'วันที่ (ไทย)', 'ชื่อตัวละคร', 'คลาสอาชีพ', 'คะแนน Gear', 'ทีม', 'ปาร์ตี้', 'ประเภทการลา', 'เหตุผลการลา', 'เวลาที่บันทึก'];

      const rows = [];

      members.forEach(m => {

        ensureLeaveHistoryObject(m);

        const pInfo = findMemberPartyInfo(m.id);

        const teamStr = pInfo ? pInfo.team.name : '-';

        const partyStr = pInfo ? pInfo.party.name : 'ไม่ได้ลงตี้';

        Object.keys(m.leaveHistory).sort().forEach(dateKey => {

          const rec = m.leaveHistory[dateKey];

          rows.push([

            dateKey,

            formatThaiDateFull(dateKey).replace(/,/g, ' '),

            m.name,

            m.job,

            m.gear,

            teamStr,

            partyStr,

            (rec.type || '').replace(/,/g, ' '),

            (rec.reason || '').replace(/,/g, ' '),

            (rec.updatedAt || '-').replace(/,/g, ' ')

          ].join(','));

        });

      });

      if (rows.length === 0) {

        showToast('ยังไม่มีประวัติการลาในระบบให้ส่งออก CSV ครับ', 'info');

        return;

      }

      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      const a = document.createElement('a');

      a.href = URL.createObjectURL(blob);

      a.download = `ประวัติการลา_${guildName.replace(/\s+/g, '_')}_${selectedDate}.csv`;

      a.click();

      showToast(`📥 ส่งออกไฟล์ CSV ประวัติการลาทั้งหมด (${rows.length} รายการ) สำเร็จ!`, 'success');

    }
