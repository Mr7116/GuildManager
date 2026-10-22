// ============================================================================
// WEEKLY EVENTS & ABSENCE ANALYTICS LOGIC
// ============================================================================

    function changeSelectedWeekByDate(dateVal) {
      if (!dateVal) return;
      selectedWeekMonday = getWeekMondayISO(dateVal);
      const picker = document.getElementById('eventWeekDatePicker');
      if (picker) picker.value = selectedWeekMonday;
      renderAll();
    }

    function shiftSelectedWeek(deltaWeeks) {
      const [y, m, d] = selectedWeekMonday.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + deltaWeeks * 7);
      changeSelectedWeekByDate(getLocalDateISO(dt));
    }

    function setSelectedWeekToCurrent() {
      changeSelectedWeekByDate(getLocalDateISO(new Date()));
      showToast(`📅 สลับไปยังสัปดาห์ปัจจุบัน (${formatThaiWeekRange(selectedWeekMonday)})`, 'info');
    }

    function switchEventSubView(viewName) {
      activeEventSubView = viewName;
      ['matrix', 'ranking'].forEach(v => {
        const el = document.getElementById('eventSubView-' + v);
        const btn = document.getElementById('eventSubBtn-' + v);
        if (el) el.classList.toggle('hidden', v !== viewName);
        if (btn) {
          btn.className = v === viewName
            ? 'px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow transition flex items-center gap-1.5'
            : 'px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5';
        }
      });
      renderWeeklyEventsSection();
    }

    async function handleEventCellClick(memberId, eventKey) {
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      ensureWeeklyEventsObject(m);

      const mode = document.getElementById('eventClickModeSelect')?.value || 'joined';
      const curRec = getMemberEventRecord(m, selectedWeekMonday, eventKey);
      const evConf = WEEKLY_EVENTS_CONFIG.find(e => e.key === eventKey);
      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

      if (mode === 'note') {
        openCustomDialog({
          title: `💬 หมายเหตุกิจกรรม ${evConf ? evConf.name : eventKey}`,
          message: `สมาชิก: ${m.name} (${m.job})\nสัปดาห์: ${formatThaiWeekRange(selectedWeekMonday)}\nระบุหมายเหตุ (เช่น มาสาย, ลงรอบซ้อม, ติดธุระ):`,
          showInput: true,
          defaultInput: curRec.note || '',
          confirmText: '💾 บันทึกหมายเหตุ',
          onConfirm: async (noteVal) => {
            m.weeklyEvents[selectedWeekMonday][eventKey] = {
              status: curRec.status === 'none' ? 'joined' : curRec.status,
              note: (noteVal || '').trim(),
              updatedAt: nowStamp
            };
            renderAll();
            await saveLeaveToDatabaseSilent(`บันทึกหมายเหตุกิจกรรม: ${m.name}`);
          }
        });
        return;
      }

      let nextStatus = 'joined';
      if (mode === 'cycle') {
        const order = ['none', 'joined', 'leave', 'absent'];
        const nextIdx = (order.indexOf(curRec.status || 'none') + 1) % order.length;
        nextStatus = order[nextIdx];
      } else {
        nextStatus = (curRec.status === mode) ? 'none' : mode;
      }

      if (nextStatus === 'none') {
        delete m.weeklyEvents[selectedWeekMonday][eventKey];
      } else {
        m.weeklyEvents[selectedWeekMonday][eventKey] = {
          status: nextStatus,
          note: curRec.note || '',
          updatedAt: nowStamp
        };
      }

      renderAll();
      await saveLeaveToDatabaseSilent(`อัปเดตกิจกรรม ${evConf?.shortName || eventKey}: ${m.name}`);
    }

    async function setMemberAllEventsInWeek(memberId, targetStatus) {
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      ensureWeeklyEventsObject(m);
      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

      if (targetStatus === 'none') {
        m.weeklyEvents[selectedWeekMonday] = {};
      } else {
        WEEKLY_EVENTS_CONFIG.forEach(ev => {
          m.weeklyEvents[selectedWeekMonday][ev.key] = {
            status: targetStatus,
            note: m.weeklyEvents[selectedWeekMonday][ev.key]?.note || '',
            updatedAt: nowStamp
          };
        });
      }
      renderAll();
      showToast(`✅ อัปเดตทั้ง ${WEEKLY_EVENTS_CONFIG.length} กิจกรรมของ "${m.name}" เรียบร้อยแล้ว`, 'success');
      await saveLeaveToDatabaseSilent(`อัปเดต ${WEEKLY_EVENTS_CONFIG.length} กิจกรรม: ${m.name}`);
    }

    async function bulkSetSingleEventForGuild(eventKey, targetStatus) {
      const evConf = WEEKLY_EVENTS_CONFIG.find(e => e.key === eventKey);
      if (!evConf || members.length === 0) return;

      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      members.forEach(m => {
        ensureWeeklyEventsObject(m);
        if (targetStatus === 'none') {
          delete m.weeklyEvents[selectedWeekMonday][eventKey];
        } else {
          const cur = getMemberEventRecord(m, selectedWeekMonday, eventKey);
          if (cur.status !== 'leave') {
            m.weeklyEvents[selectedWeekMonday][eventKey] = {
              status: targetStatus,
              note: cur.note || '',
              updatedAt: nowStamp
            };
          }
        }
      });

      renderAll();
      showToast(`🏆 อัปเดตกิจกรรม "${evConf.name}" ทั้งกิลด์และบันทึกลง Database แล้ว`, 'success');
      await saveLeaveToDatabaseSilent(`เช็คชื่อทั้งกิลด์: ${evConf.name}`);
    }

    async function markAllMembersAllEvents(targetStatus) {
      if (members.length === 0) return;
      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      members.forEach(m => {
        ensureWeeklyEventsObject(m);
        WEEKLY_EVENTS_CONFIG.forEach(ev => {
          const cur = getMemberEventRecord(m, selectedWeekMonday, ev.key);
          if (cur.status !== 'leave') {
            m.weeklyEvents[selectedWeekMonday][ev.key] = {
              status: targetStatus,
              note: cur.note || '',
              updatedAt: nowStamp
            };
          }
        });
      });
      renderAll();
      showToast(`✅ ตั้งสมาชิกทุกคนเข้าร่วมครบทั้ง ${WEEKLY_EVENTS_CONFIG.length} กิจกรรมในสัปดาห์นี้แล้ว`, 'success');
      await saveLeaveToDatabaseSilent('ตั้งเข้าครบทุกกิจกรรมทั้งกิลด์');
    }

    function clearAllEventsForSelectedWeek() {
      openCustomDialog({
        title: `🗑️ ล้างข้อมูลการเข้ากิจกรรมประจำสัปดาห์`,
        message: `ต้องการล้างข้อมูลเช็คชื่อทั้ง ${WEEKLY_EVENTS_CONFIG.length} กิจกรรมของสัปดาห์ ${formatThaiWeekRange(selectedWeekMonday)} ใช่หรือไม่?`,
        confirmText: 'ล้างข้อมูลสัปดาห์นี้',
        onConfirm: async () => {
          members.forEach(m => {
            if (m.weeklyEvents && m.weeklyEvents[selectedWeekMonday]) {
              delete m.weeklyEvents[selectedWeekMonday];
            }
          });
          renderAll();
          showToast(`🗑️ ล้างข้อมูลกิจกรรมของสัปดาห์ที่เลือกเรียบร้อยแล้ว`, 'danger');
          await saveLeaveToDatabaseSilent('ล้างข้อมูลกิจกรรมประจำสัปดาห์');
        }
      });
    }

    // ดึงข้อมูลวันลารายวันในสัปดาห์นั้นมาจับคู่เข้ากับ Guild League (อังคาร / พฤหัสบดี) และศึกชิงปราสาทอัตโนมัติ
    async function syncWeeklyEventsFromDailyLeave() {
      const weekDates = getDatesBetween(selectedWeekMonday, getWeekSundayISO(selectedWeekMonday));
      const nowStamp = new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
      let syncedCount = 0;

      members.forEach(m => {
        ensureLeaveHistoryObject(m);
        ensureWeeklyEventsObject(m);

        weekDates.forEach(dStr => {
          const leaveRec = m.leaveHistory[dStr];
          if (!leaveRec) return;

          const [y, mo, da] = dStr.split('-').map(Number);
          const dayOfWeek = new Date(y, mo - 1, da).getDay(); // 2 = อังคาร, 4 = พฤหัสบดี
          const lType = leaveRec.type || '';
          const noteText = `ลาวันที่ ${formatThaiDateShort(dStr)}: ${leaveRec.reason || ''}`;

          if (lType.includes('ศึกชิงปราสาท')) {
            const cur = getMemberEventRecord(m, selectedWeekMonday, 'castle_siege');
            if (cur.status === 'none') {
              m.weeklyEvents[selectedWeekMonday]['castle_siege'] = {
                status: 'leave',
                note: noteText,
                updatedAt: nowStamp
              };
              syncedCount++;
            }
          } else if (dayOfWeek === 2 && (lType.includes('กิลด์วอร์') || lType.includes('กิจกรรม') || lType.includes('ทั้งวัน'))) {
            // แจ้งลาตรงกับวันอังคาร -> ซิงค์เข้า Guild League (อังคาร)
            const cur = getMemberEventRecord(m, selectedWeekMonday, 'guild_league_tue');
            if (cur.status === 'none') {
              m.weeklyEvents[selectedWeekMonday]['guild_league_tue'] = {
                status: 'leave',
                note: noteText,
                updatedAt: nowStamp
              };
              syncedCount++;
            }
          } else if (dayOfWeek === 4 && (lType.includes('กิลด์วอร์') || lType.includes('กิจกรรม') || lType.includes('ทั้งวัน'))) {
            // แจ้งลาตรงกับวันพฤหัสบดี -> ซิงค์เข้า Guild League (พฤหัสบดี)
            const cur = getMemberEventRecord(m, selectedWeekMonday, 'guild_league_thu');
            if (cur.status === 'none') {
              m.weeklyEvents[selectedWeekMonday]['guild_league_thu'] = {
                status: 'leave',
                note: noteText,
                updatedAt: nowStamp
              };
              syncedCount++;
            }
          } else if (lType.includes('กิจกรรม') || lType.includes('ทั้งวัน')) {
            WEEKLY_EVENTS_CONFIG.forEach(ev => {
              const cur = getMemberEventRecord(m, selectedWeekMonday, ev.key);
              if (cur.status === 'none') {
                m.weeklyEvents[selectedWeekMonday][ev.key] = {
                  status: 'leave',
                  note: noteText,
                  updatedAt: nowStamp
                };
              }
            });
            syncedCount++;
          }
        });
      });

      renderAll();
      showToast(`🔗 ซิงค์ข้อมูลคนแจ้งลา (แยก Guild League อังคาร/พฤหัสฯ) แล้ว (${syncedCount} รายการ)`, 'success');
      await saveLeaveToDatabaseSilent('ซิงค์วันลาเข้าตารางกิจกรรมรายสัปดาห์');
    }

    function renderEventCellButtonHtml(m, eventKey) {
      const rec = getMemberEventRecord(m, selectedWeekMonday, eventKey);
      const st = rec.status || 'none';
      const noteBadge = rec.note
        ? `<div class="text-[9px] text-amber-200 truncate max-w-[115px] mt-0.5" title="${rec.note}">💬 ${rec.note}</div>`
        : '';

      if (st === 'joined') {
        return `
          <button onclick="handleEventCellClick('${m.id}', '${eventKey}')" class="w-full py-1.5 px-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] transition flex flex-col items-center justify-center shadow-sm">
            <span>✅ เข้าร่วม</span>
            ${noteBadge}
          </button>
        `;
      }
      if (st === 'leave') {
        return `
          <button onclick="handleEventCellClick('${m.id}', '${eventKey}')" class="w-full py-1.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[11px] transition flex flex-col items-center justify-center">
            <span>🏖️ แจ้งลา</span>
            ${noteBadge}
          </button>
        `;
      }
      if (st === 'absent') {
        return `
          <button onclick="handleEventCellClick('${m.id}', '${eventKey}')" class="w-full py-1.5 px-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-[11px] transition flex flex-col items-center justify-center">
            <span>❌ ขาด</span>
            ${noteBadge}
          </button>
        `;
      }
      return `
        <button onclick="handleEventCellClick('${m.id}', '${eventKey}')" class="w-full py-1.5 px-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-500 hover:text-slate-300 text-[11px] transition flex flex-col items-center justify-center">
          <span>⚪ รอเช็ค</span>
          ${noteBadge}
        </button>
      `;
    }

    function renderWeeklyEventsSection() {
      const badgeEl = document.getElementById('eventWeekLabelBadge');
      if (badgeEl) badgeEl.textContent = `📅 สัปดาห์: ${formatThaiWeekRange(selectedWeekMonday)}`;

      const pickerEl = document.getElementById('eventWeekDatePicker');
      if (pickerEl && pickerEl.value !== selectedWeekMonday) pickerEl.value = selectedWeekMonday;

      ['eventTeamFilterSelect', 'eventRankingTeamFilter'].forEach(selId => {
        const teamSelect = document.getElementById(selId);
        if (teamSelect) {
          const prevTeam = teamSelect.value || 'all';
          teamSelect.innerHTML =
            `<option value="all">ทุกสนาม & ทุกทีม (${teams.length} ทีม)</option>` +
            `<option value="field_main">🏟️ เฉพาะสนามหลัก</option>` +
            `<option value="field_sub">🚩 เฉพาะสนามรอง</option>` +
            teams.map(t => `<option value="${t.id}">เฉพาะ ${t.name} (${getFieldZone(t.field).shortName})</option>`).join('') +
            `<option value="unassigned">เฉพาะคนยังไม่มีปาร์ตี้</option>`;
          if (['all', 'field_main', 'field_sub', 'unassigned'].includes(prevTeam) || teams.some(t => t.id === prevTeam)) {
            teamSelect.value = prevTeam;
          }
        }
      });

      let allWeeksLeaveAbsentTotal = 0;
      members.forEach(m => {
        const s = getMemberWeeklyEventSummaryAllWeeks(m);
        allWeeksLeaveAbsentTotal += s.leaveAndAbsent;
      });
      const subBadge = document.getElementById('eventSubBtnLeaveAbsentBadge');
      if (subBadge) {
        subBadge.textContent = `ลา/ขาด ${allWeeksLeaveAbsentTotal}`;
      }

      // 1. Render 6-Week Calendar Strip
      const stripEl = document.getElementById('eventWeekStripContainer');
      if (stripEl) {
        const [y, m, d] = selectedWeekMonday.split('-').map(Number);
        const centerMonday = new Date(y, m - 1, d);
        const currentMondayIso = getWeekMondayISO(new Date());
        const cards = [];

        for (let offset = -3; offset <= 2; offset++) {
          const dt = new Date(centerMonday);
          dt.setDate(dt.getDate() + offset * 7);
          const monIso = getLocalDateISO(dt);
          const sunIso = getWeekSundayISO(monIso);
          const isSelected = monIso === selectedWeekMonday;
          const isCurrent = monIso === currentMondayIso;

          let joinedTotal = 0, leaveTotal = 0, absentTotal = 0;
          const totalPossible = members.length * WEEKLY_EVENTS_CONFIG.length;
          members.forEach(mem => {
            WEEKLY_EVENTS_CONFIG.forEach(ev => {
              const st = getMemberEventRecord(mem, monIso, ev.key).status;
              if (st === 'joined') joinedTotal++;
              else if (st === 'leave') leaveTotal++;
              else if (st === 'absent') absentTotal++;
            });
          });
          const pct = totalPossible > 0 ? Math.round((joinedTotal / totalPossible) * 100) : 0;

          const cardClass = isSelected
            ? 'bg-gradient-to-b from-indigo-600/40 to-slate-900 border-indigo-400 ring-2 ring-indigo-500/40 text-white'
            : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800 text-slate-300';

          cards.push(`
            <button onclick="changeSelectedWeekByDate('${monIso}')" class="p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${cardClass}">
              <div class="flex items-center justify-between w-full">
                <span class="text-[10px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}">จันทร์ - อาทิตย์</span>
                ${isCurrent ? `<span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">สัปดาห์นี้</span>` : ''}
              </div>
              <div class="my-1 font-bold text-xs text-white truncate">${formatThaiDateShort(monIso)} - ${formatThaiDateShort(sunIso)}</div>
              <div class="flex items-center justify-between w-full pt-1 border-t border-slate-800/80 text-[10px]">
                <span class="mono font-bold ${pct >= 70 ? 'text-emerald-400' : (pct > 0 ? 'text-amber-300' : 'text-slate-500')}">✅ ${pct}%</span>
                <span class="mono text-[10px] ${(leaveTotal + absentTotal) > 0 ? 'text-rose-300 font-semibold' : 'text-slate-500'}">🏖️${leaveTotal} ❌${absentTotal}</span>
              </div>
            </button>
          `);
        }
        stripEl.innerHTML = cards.join('');
      }

      // 2. Render 6 Activity Summary Cards for Selected Week
      const summaryGrid = document.getElementById('eventSummaryCardsGrid');
      if (summaryGrid) {
        summaryGrid.innerHTML = WEEKLY_EVENTS_CONFIG.map(ev => {
          let joined = 0, leave = 0, absent = 0, none = 0;
          members.forEach(m => {
            const st = getMemberEventRecord(m, selectedWeekMonday, ev.key).status;
            if (st === 'joined') joined++;
            else if (st === 'leave') leave++;
            else if (st === 'absent') absent++;
            else none++;
          });
          const pct = members.length > 0 ? Math.round((joined / members.length) * 100) : 0;

          return `
            <div class="bg-slate-900 border ${ev.accentClass} rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 shadow-lg">
              <div>
                <div class="flex items-center justify-between gap-1.5">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="text-lg shrink-0">${ev.icon}</span>
                    <h3 class="font-bold text-xs sm:text-sm text-white truncate" title="${ev.name}">${ev.name}</h3>
                  </div>
                  <span class="mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-950/80 text-white border border-slate-700 shrink-0">${pct}%</span>
                </div>
                <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-2 flex">
                  <div class="h-full bg-emerald-400 transition-all duration-300" style="width: ${members.length ? (joined/members.length)*100 : 0}%"></div>
                  <div class="h-full bg-amber-400 transition-all duration-300" style="width: ${members.length ? (leave/members.length)*100 : 0}%"></div>
                  <div class="h-full bg-rose-500 transition-all duration-300" style="width: ${members.length ? (absent/members.length)*100 : 0}%"></div>
                </div>
                <div class="grid grid-cols-3 gap-1 text-[11px] mt-2.5 text-center">
                  <div class="bg-slate-950/70 rounded-lg py-1 border border-emerald-500/20">
                    <div class="text-slate-400 text-[10px]">เข้าร่วม</div>
                    <div class="mono font-bold text-emerald-400">${joined}</div>
                  </div>
                  <div class="bg-slate-950/70 rounded-lg py-1 border border-amber-500/20">
                    <div class="text-slate-400 text-[10px]">แจ้งลา</div>
                    <div class="mono font-bold text-amber-300">${leave}</div>
                  </div>
                  <div class="bg-slate-950/70 rounded-lg py-1 border border-rose-500/20">
                    <div class="text-slate-400 text-[10px]">ขาด (${none})</div>
                    <div class="mono font-bold text-rose-400">${absent}</div>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <button onclick="bulkSetSingleEventForGuild('${ev.key}', 'joined')" class="flex-1 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-200 text-[11px] font-semibold transition">
                  ✅ เช็คมาทั้งกิลด์
                </button>
                <button onclick="bulkSetSingleEventForGuild('${ev.key}', 'none')" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition" title="ล้างข้อมูลเฉพาะกิจกรรมนี้">
                  ↺
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      // 3. Render Weekly Matrix Table
      const tbody = document.getElementById('eventMatrixTableBody');
      if (tbody) {
        const q = (document.getElementById('eventSearchInput')?.value || '').trim().toLowerCase();
        const teamFilter = document.getElementById('eventTeamFilterSelect')?.value || 'all';
        const compFilter = document.getElementById('eventCompletionFilterSelect')?.value || 'all';
        const sortBy = document.getElementById('eventSortSelect')?.value || 'team_asc';

        let rows = members.map(m => {
          const pInfo = findMemberPartyInfo(m.id);
          let joinedCount = 0, leaveCount = 0, absentCount = 0;
          WEEKLY_EVENTS_CONFIG.forEach(ev => {
            const st = getMemberEventRecord(m, selectedWeekMonday, ev.key).status;
            if (st === 'joined') joinedCount++;
            else if (st === 'leave') leaveCount++;
            else if (st === 'absent') absentCount++;
          });
          return { member: m, pInfo, joinedCount, leaveCount, absentCount, leaveAndAbsent: leaveCount + absentCount };
        }).filter(item => {
          const { member: m, pInfo, joinedCount, leaveCount, absentCount, leaveAndAbsent } = item;
          if (activeJobBarFamily !== 'all' && getJobFamily(m.job).familyKey !== activeJobBarFamily) return false;
          if (teamFilter === 'unassigned' && pInfo) return false;
          if (teamFilter === 'field_main' && (!pInfo || pInfo.team.field !== 'main')) return false;
          if (teamFilter === 'field_sub' && (!pInfo || pInfo.team.field !== 'sub')) return false;
          if (!['all', 'unassigned', 'field_main', 'field_sub'].includes(teamFilter) && (!pInfo || pInfo.team.id !== teamFilter)) return false;
          if (compFilter === 'has_leave_or_absent' && leaveAndAbsent === 0) return false;
          if (compFilter === 'has_absent' && absentCount === 0) return false;
          if (compFilter === 'has_leave' && leaveCount === 0) return false;
          if (compFilter === 'full' && joinedCount < WEEKLY_EVENTS_CONFIG.length) return false;
          if (compFilter === 'partial' && (joinedCount === 0 || joinedCount === WEEKLY_EVENTS_CONFIG.length)) return false;
          if (compFilter === 'zero' && joinedCount > 0) return false;
          if (!q) return true;
          const teamStr = pInfo ? `${pInfo.team.name} ${pInfo.party.name}`.toLowerCase() : '';
          return m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || teamStr.includes(q);
        });

        rows.sort((a, b) => {
          if (sortBy === 'leave_absent_desc') return b.leaveAndAbsent - a.leaveAndAbsent || b.absentCount - a.absentCount || b.member.gear - a.member.gear;
          if (sortBy === 'absent_desc') return b.absentCount - a.absentCount || b.leaveCount - a.leaveCount || b.member.gear - a.member.gear;
          if (sortBy === 'leave_desc') return b.leaveCount - a.leaveCount || b.absentCount - a.absentCount || b.member.gear - a.member.gear;
          if (sortBy === 'score_desc') return b.joinedCount - a.joinedCount || b.member.gear - a.member.gear;
          if (sortBy === 'score_asc') return a.joinedCount - b.joinedCount || b.member.gear - a.member.gear;
          if (sortBy === 'gear_desc') return b.member.gear - a.member.gear;
          if (sortBy === 'name_asc') return a.member.name.localeCompare(b.member.name, 'th');
          const tA = a.pInfo ? `${a.pInfo.team.name}_${a.pInfo.party.name}` : 'zzz';
          const tB = b.pInfo ? `${b.pInfo.team.name}_${b.pInfo.party.name}` : 'zzz';
          return tA.localeCompare(tB, 'th') || b.member.gear - a.member.gear;
        });

        if (rows.length === 0) {
          tbody.innerHTML = `<tr><td colspan="10" class="py-10 text-center text-slate-500">ไม่พบรายชื่อสมาชิกที่ตรงกับเงื่อนไข</td></tr>`;
        } else {
          tbody.innerHTML = rows.map(({ member: m, pInfo, joinedCount, leaveCount, absentCount }) => {
            const totalEv = WEEKLY_EVENTS_CONFIG.length;
            const teamBadge = pInfo
              ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${getTeamTheme(pInfo.team.color).badgeClass}">${pInfo.team.name} • ${pInfo.party.name}</span>`
              : `<span class="text-[11px] text-slate-500">ยังไม่ลงตี้</span>`;

            const eventCells = WEEKLY_EVENTS_CONFIG.map(ev => `
              <td class="py-2 px-1.5 text-center">${renderEventCellButtonHtml(m, ev.key)}</td>
            `).join('');

            const scoreBadgeClass = joinedCount === totalEv
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : (joinedCount >= 4 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-300 border-slate-700');

            return `
              <tr class="hover:bg-slate-800/40 transition">
                <td class="py-2.5 px-3">
                  <div class="flex items-center gap-2">
                    ${renderJobEmblem(m.job, 28)}
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5">
                        ${renderColoredMemberName(m)}
                        <span class="mono text-[10px] text-slate-400">Lv.${m.lv}</span>
                      </div>
                      <div class="text-[10px] text-slate-400 mt-0.5">${m.job} • Gear ${m.gear.toLocaleString()}</div>
                    </div>
                  </div>
                </td>
                <td class="py-2.5 px-2.5">${teamBadge}</td>
                ${eventCells}
                <td class="py-2.5 px-3 text-center">
                  <div class="flex items-center justify-center gap-1 flex-wrap">
                    <span class="mono px-2 py-0.5 rounded-md text-[11px] font-bold border ${scoreBadgeClass}" title="เข้าร่วม">
                      ✅ ${joinedCount}/${totalEv}
                    </span>
                    ${leaveCount > 0 ? `<span class="mono px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40" title="แจ้งลา">🏖️ ${leaveCount}</span>` : ''}
                    ${absentCount > 0 ? `<span class="mono px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40" title="ขาดกิจกรรม">❌ ${absentCount}</span>` : ''}
                  </div>
                </td>
                <td class="py-2.5 px-2.5 text-right">
                  <div class="inline-flex items-center gap-1">
                    <button onclick="setMemberAllEventsInWeek('${m.id}', 'joined')" title="ตั้งเข้าครบ ${totalEv} กิจกรรม" class="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition">✅ ครบ ${totalEv}</button>
                    <button onclick="setMemberAllEventsInWeek('${m.id}', 'none')" title="ล้างข้อมูลสัปดาห์นี้ของคนนี้" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] transition">✕</button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }

      renderWeeklyEventsRankingTable();
    }

    function getTargetWeeksForStats() {
      const scope = document.getElementById('eventRankingScopeSelect')?.value || 'all_weeks';
      if (scope === 'selected_week') {
        return [selectedWeekMonday];
      }
      const allWeeksSet = new Set([selectedWeekMonday]);
      members.forEach(m => {
        if (m.weeklyEvents && typeof m.weeklyEvents === 'object') {
          Object.keys(m.weeklyEvents).forEach(w => {
            if (m.weeklyEvents[w] && Object.keys(m.weeklyEvents[w]).length > 0) {
              allWeeksSet.add(w);
            }
          });
        }
      });
      return Array.from(allWeeksSet).sort().reverse();
    }

    function computeLeaveAbsentAnalyticsData() {
      const targetWeeks = getTargetWeeksForStats();
      const totalWeeks = targetWeeks.length;
      const maxPossiblePerMember = totalWeeks * WEEKLY_EVENTS_CONFIG.length;

      const eventTotals = {};
      WEEKLY_EVENTS_CONFIG.forEach(ev => {
        eventTotals[ev.key] = { joined: 0, leave: 0, absent: 0, none: 0 };
      });

      let guildTotalJoined = 0;
      let guildTotalLeave = 0;
      let guildTotalAbsent = 0;
      let guildTotalDailyLeaveDays = 0;

      const memberStats = members.map(m => {
        ensureLeaveHistoryObject(m);
        const dailyLeaveDates = Object.keys(m.leaveHistory).sort().reverse();
        const dailyLeaveCount = dailyLeaveDates.length;
        guildTotalDailyLeaveDays += dailyLeaveCount;

        const byEvent = {};
        WEEKLY_EVENTS_CONFIG.forEach(ev => {
          byEvent[ev.key] = { joined: 0, leave: 0, absent: 0 };
        });

        let totalJoined = 0;
        let totalLeave = 0;
        let totalAbsent = 0;
        const leaveAbsentDetails = [];

        targetWeeks.forEach(wKey => {
          WEEKLY_EVENTS_CONFIG.forEach(ev => {
            const rec = getMemberEventRecord(m, wKey, ev.key);
            const st = rec.status || 'none';
            if (st === 'joined') {
              byEvent[ev.key].joined++;
              totalJoined++;
              eventTotals[ev.key].joined++;
              guildTotalJoined++;
            } else if (st === 'leave') {
              byEvent[ev.key].leave++;
              totalLeave++;
              eventTotals[ev.key].leave++;
              guildTotalLeave++;
              leaveAbsentDetails.push({
                weekKey: wKey,
                eventKey: ev.key,
                eventName: ev.shortName,
                eventIcon: ev.icon,
                status: 'leave',
                note: rec.note || ''
              });
            } else if (st === 'absent') {
              byEvent[ev.key].absent++;
              totalAbsent++;
              eventTotals[ev.key].absent++;
              guildTotalAbsent++;
              leaveAbsentDetails.push({
                weekKey: wKey,
                eventKey: ev.key,
                eventName: ev.shortName,
                eventIcon: ev.icon,
                status: 'absent',
                note: rec.note || ''
              });
            } else {
              eventTotals[ev.key].none++;
            }
          });
        });

        const totalLeaveAndAbsent = totalLeave + totalAbsent;
        const joinRate = maxPossiblePerMember > 0 ? Math.round((totalJoined / maxPossiblePerMember) * 100) : 0;
        const pInfo = findMemberPartyInfo(m.id);

        return {
          member: m,
          pInfo,
          byEvent,
          totalJoined,
          totalLeave,
          totalAbsent,
          totalLeaveAndAbsent,
          dailyLeaveCount,
          dailyLeaveDates,
          joinRate,
          leaveAbsentDetails
        };
      });

      return {
        targetWeeks,
        totalWeeks,
        maxPossiblePerMember,
        eventTotals,
        guildTotalJoined,
        guildTotalLeave,
        guildTotalAbsent,
        guildTotalDailyLeaveDays,
        memberStats
      };
    }

    function renderWeeklyEventsRankingTable() {
      const tbody = document.getElementById('eventRankingTableBody');
      if (!tbody) return;

      const data = computeLeaveAbsentAnalyticsData();
      const {
        totalWeeks,
        maxPossiblePerMember,
        eventTotals,
        guildTotalJoined,
        guildTotalLeave,
        guildTotalAbsent,
        guildTotalDailyLeaveDays,
        memberStats
      } = data;

      const kpiContainer = document.getElementById('eventLeaveAbsentKpiCards');
      if (kpiContainer) {
        let topLeaveEv = WEEKLY_EVENTS_CONFIG[0], topAbsentEv = WEEKLY_EVENTS_CONFIG[0];
        WEEKLY_EVENTS_CONFIG.forEach(ev => {
          if (eventTotals[ev.key].leave > eventTotals[topLeaveEv.key].leave) topLeaveEv = ev;
          if (eventTotals[ev.key].absent > eventTotals[topAbsentEv.key].absent) topAbsentEv = ev;
        });

        const membersWithLeaveOrAbsent = memberStats.filter(x => x.totalLeaveAndAbsent > 0).length;
        const topOffenders = [...memberStats]
          .filter(x => x.totalLeaveAndAbsent > 0)
          .sort((a, b) => b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.totalAbsent - a.totalAbsent)
          .slice(0, 3)
          .map(x => `${x.member.name} (${x.totalLeaveAndAbsent})`)
          .join(', ') || 'ยังไม่มีคนลา/ขาด';

        kpiContainer.innerHTML = `
          <div class="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 space-y-1.5 shadow-lg">
            <div class="flex items-center justify-between text-xs text-amber-300 font-semibold">
              <span>🏖️ รวมแจ้งลากิจกรรม</span>
              <span class="px-2 py-0.5 rounded-full bg-amber-500/15 text-[10px]">${totalWeeks} สัปดาห์</span>
            </div>
            <div class="mono text-2xl font-bold text-amber-400">${guildTotalLeave.toLocaleString()} <span class="text-xs font-normal text-slate-400">ครั้ง</span></div>
            <div class="text-[11px] text-slate-400 truncate">
              ลามากสุด: <strong class="text-amber-200">${eventTotals[topLeaveEv.key].leave > 0 ? `${topLeaveEv.icon} ${topLeaveEv.shortName} (${eventTotals[topLeaveEv.key].leave} ครั้ง)` : '-'}</strong>
            </div>
          </div>

          <div class="bg-slate-950/90 border border-rose-500/40 rounded-2xl p-4 space-y-1.5 shadow-lg">
            <div class="flex items-center justify-between text-xs text-rose-300 font-semibold">
              <span>❌ รวมขาดกิจกรรม (ไม่แจ้งลา)</span>
              <span class="px-2 py-0.5 rounded-full bg-rose-500/15 text-[10px]">${totalWeeks} สัปดาห์</span>
            </div>
            <div class="mono text-2xl font-bold text-rose-400">${guildTotalAbsent.toLocaleString()} <span class="text-xs font-normal text-slate-400">ครั้ง</span></div>
            <div class="text-[11px] text-slate-400 truncate">
              ขาดมากสุด: <strong class="text-rose-200">${eventTotals[topAbsentEv.key].absent > 0 ? `${topAbsentEv.icon} ${topAbsentEv.shortName} (${eventTotals[topAbsentEv.key].absent} ครั้ง)` : '-'}</strong>
            </div>
          </div>

          <div class="bg-slate-950/90 border border-fuchsia-500/40 rounded-2xl p-4 space-y-1.5 shadow-lg">
            <div class="flex items-center justify-between text-xs text-fuchsia-300 font-semibold">
              <span>🚨 สมาชิกที่มีประวัติ ลา / ขาด</span>
              <span class="px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-[10px]">จาก ${members.length} คน</span>
            </div>
            <div class="mono text-2xl font-bold text-fuchsia-400">${membersWithLeaveOrAbsent} <span class="text-xs font-normal text-slate-400">คน</span></div>
            <div class="text-[11px] text-slate-400 truncate" title="${topOffenders}">
              สูงสุด: <strong class="text-fuchsia-200">${topOffenders}</strong>
            </div>
          </div>

          <div class="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 space-y-1.5 shadow-lg">
            <div class="flex items-center justify-between text-xs text-emerald-300 font-semibold">
              <span>✅ รวมเข้ากิจกรรม & ลารายวัน</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/15 text-[10px]">Cloud Sync</span>
            </div>
            <div class="mono text-2xl font-bold text-emerald-400">${guildTotalJoined.toLocaleString()} <span class="text-xs font-normal text-slate-400">ครั้งที่เข้า</span></div>
            <div class="text-[11px] text-slate-400 truncate">
              วันลารายวันสะสมทั้งกิลด์: <strong class="text-amber-300">${guildTotalDailyLeaveDays} วัน</strong>
            </div>
          </div>
        `;
      }

      const breakdownGrid = document.getElementById('eventLeaveBreakdownGrid');
      if (breakdownGrid) {
        const totalSlotsPerEvent = members.length * totalWeeks;
        breakdownGrid.innerHTML = WEEKLY_EVENTS_CONFIG.map(ev => {
          const t = eventTotals[ev.key];
          const jPct = totalSlotsPerEvent > 0 ? Math.round((t.joined / totalSlotsPerEvent) * 100) : 0;
          const lPct = totalSlotsPerEvent > 0 ? Math.round((t.leave / totalSlotsPerEvent) * 100) : 0;
          const aPct = totalSlotsPerEvent > 0 ? Math.round((t.absent / totalSlotsPerEvent) * 100) : 0;

          return `
            <div class="bg-slate-900/95 border border-slate-800 rounded-xl p-3 space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-white flex items-center gap-1">${ev.icon} ${ev.shortName}</span>
                <span class="mono text-[10px] text-rose-300 font-semibold">ลา+ขาด: ${t.leave + t.absent}</span>
              </div>
              <div class="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
                <div class="h-full bg-emerald-400" style="width: ${jPct}%" title="เข้าร่วม ${t.joined} ครั้ง"></div>
                <div class="h-full bg-amber-400" style="width: ${lPct}%" title="แจ้งลา ${t.leave} ครั้ง"></div>
                <div class="h-full bg-rose-500" style="width: ${aPct}%" title="ขาด ${t.absent} ครั้ง"></div>
              </div>
              <div class="flex items-center justify-between text-[10px] pt-0.5">
                <span class="text-emerald-400 font-semibold">✅ ${t.joined}</span>
                <span class="text-amber-300 font-semibold">🏖️ ${t.leave} (${lPct}%)</span>
                <span class="text-rose-400 font-semibold">❌ ${t.absent} (${aPct}%)</span>
              </div>
            </div>
          `;
        }).join('');
      }

      const q = (document.getElementById('eventRankingSearchInput')?.value || '').trim().toLowerCase();
      const teamFilter = document.getElementById('eventRankingTeamFilter')?.value || 'all';
      const statusFilter = document.getElementById('eventRankingStatusFilter')?.value || 'all';
      const sortBy = document.getElementById('eventRankingSortSelect')?.value || 'leave_absent_desc';

      const filteredRows = memberStats.filter(item => {
        const { member: m, pInfo, totalLeave, totalAbsent, totalLeaveAndAbsent, dailyLeaveCount } = item;
        if (activeJobBarFamily !== 'all' && getJobFamily(m.job).familyKey !== activeJobBarFamily) return false;
        if (teamFilter === 'unassigned' && pInfo) return false;
        if (teamFilter === 'field_main' && (!pInfo || pInfo.team.field !== 'main')) return false;
        if (teamFilter === 'field_sub' && (!pInfo || pInfo.team.field !== 'sub')) return false;
        if (!['all', 'unassigned', 'field_main', 'field_sub'].includes(teamFilter) && (!pInfo || pInfo.team.id !== teamFilter)) return false;

        if (statusFilter === 'has_leave_or_absent' && totalLeaveAndAbsent === 0) return false;
        if (statusFilter === 'has_absent' && totalAbsent === 0) return false;
        if (statusFilter === 'has_leave' && totalLeave === 0) return false;
        if (statusFilter === 'has_daily_leave' && dailyLeaveCount === 0) return false;
        if (statusFilter === 'perfect' && (totalLeaveAndAbsent > 0 || dailyLeaveCount > 0)) return false;

        if (!q) return true;
        const teamStr = pInfo ? `${pInfo.team.name} ${pInfo.party.name}`.toLowerCase() : '';
        return m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || teamStr.includes(q);
      });

      filteredRows.sort((a, b) => {
        if (sortBy === 'leave_absent_desc') {
          return b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.totalAbsent - a.totalAbsent || b.dailyLeaveCount - a.dailyLeaveCount || b.member.gear - a.member.gear;
        }
        if (sortBy === 'absent_desc') {
          return b.totalAbsent - a.totalAbsent || b.totalLeave - a.totalLeave || b.member.gear - a.member.gear;
        }
        if (sortBy === 'leave_desc') {
          return b.totalLeave - a.totalLeave || b.totalAbsent - a.totalAbsent || b.member.gear - a.member.gear;
        }
        if (sortBy === 'daily_leave_desc') {
          return b.dailyLeaveCount - a.dailyLeaveCount || b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.member.gear - a.member.gear;
        }
        return b.totalJoined - a.totalJoined || a.totalLeaveAndAbsent - b.totalLeaveAndAbsent || b.member.gear - a.member.gear;
      });

      if (filteredRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" class="py-10 text-center text-slate-500">ไม่พบข้อมูลสมาชิกที่ตรงกับตัวกรองสถิติการลา/ขาด</td></tr>`;
        return;
      }

      tbody.innerHTML = filteredRows.map((item, idx) => {
        const {
          member: m,
          pInfo,
          byEvent,
          totalJoined,
          totalLeave,
          totalAbsent,
          totalLeaveAndAbsent,
          dailyLeaveCount,
          joinRate,
          leaveAbsentDetails
        } = item;

        const teamHtml = pInfo
          ? `<span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${getTeamTheme(pInfo.team.color).badgeClass}">${pInfo.team.name} • ${pInfo.party.name}</span>`
          : `<span class="text-slate-500 text-[11px]">ยังไม่ลงตี้</span>`;

        const evCols = WEEKLY_EVENTS_CONFIG.map(ev => {
          const c = byEvent[ev.key];
          return `
            <td class="py-2.5 px-1.5 text-center">
              <div class="inline-flex items-center justify-center gap-1 bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1 mono text-[11px]">
                <span class="text-emerald-400 font-bold" title="เข้าร่วม ${c.joined} ครั้ง">${c.joined}</span>
                <span class="text-slate-600">/</span>
                <span class="${c.leave > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}" title="แจ้งลา ${c.leave} ครั้ง">${c.leave}</span>
                <span class="text-slate-600">/</span>
                <span class="${c.absent > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}" title="ขาด ${c.absent} ครั้ง">${c.absent}</span>
              </div>
            </td>
          `;
        }).join('');

        const detailPillsHtml = leaveAbsentDetails.length > 0
          ? leaveAbsentDetails.slice(0, 6).map(d => {
              const isAbs = d.status === 'absent';
              const pillStyle = isAbs
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-200';
              const tagLabel = isAbs ? '❌ ขาด' : '🏖️ ลา';
              const noteStr = d.note ? ` • ${d.note}` : '';
              return `
                <button onclick="changeSelectedWeekByDate('${d.weekKey}'); switchEventSubView('matrix');" title="คลิกเพื่อเปิดตารางสัปดาห์ ${formatThaiDateShort(d.weekKey)}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] mr-1 mb-1 hover:brightness-125 transition ${pillStyle}">
                  <span>${tagLabel} <strong>${d.eventName}</strong> (${formatThaiDateShort(d.weekKey)}${noteStr})</span>
                </button>
              `;
            }).join('') + (leaveAbsentDetails.length > 6 ? `<span class="text-[10px] text-slate-400">+อีก ${leaveAbsentDetails.length - 6} รายการ</span>` : '')
          : `<span class="text-[11px] text-emerald-400/80">🌟 ไม่มีประวัติลาหรือขาดกิจกรรม</span>`;

        return `
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                <span class="mono text-xs text-slate-400 w-6">#${idx + 1}</span>
                ${renderJobEmblem(m.job, 26)}
                <div>
                  ${renderColoredMemberName(m)}
                  <div class="text-[10px] text-slate-400 mt-0.5">${m.job} • ${(m.gear/1000).toFixed(1)}k</div>
                </div>
              </div>
            </td>
            <td class="py-2.5 px-2.5">${teamHtml}</td>
            ${evCols}
            <td class="py-2.5 px-2 text-center">
              <span class="mono px-2.5 py-0.5 rounded-full text-xs font-bold ${totalLeave > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-900 text-slate-500'}">
                ${totalLeave} ครั้ง
              </span>
            </td>
            <td class="py-2.5 px-2 text-center">
              <span class="mono px-2.5 py-0.5 rounded-full text-xs font-bold ${totalAbsent > 0 ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-500'}">
                ${totalAbsent} ครั้ง
              </span>
            </td>
            <td class="py-2.5 px-2.5 text-center">
              <div class="flex flex-col items-center gap-0.5">
                <span class="mono px-2.5 py-0.5 rounded-full text-xs font-bold ${totalLeaveAndAbsent > 0 ? 'bg-rose-600/30 text-rose-200 border border-rose-500/50' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}">
                  รวม ${totalLeaveAndAbsent} ครั้ง
                </span>
                ${dailyLeaveCount > 0 ? `<span class="text-[10px] text-amber-300 font-medium">📅 ลารายวัน ${dailyLeaveCount} วัน</span>` : `<span class="text-[10px] text-slate-500">ลารายวัน 0 วัน</span>`}
              </div>
            </td>
            <td class="py-2.5 px-2.5 text-center">
              <div class="flex flex-col items-center">
                <span class="mono font-bold text-emerald-400 text-xs">${totalJoined}/${maxPossiblePerMember}</span>
                <span class="mono text-[10px] text-slate-400">(${joinRate}%)</span>
              </div>
            </td>
            <td class="py-2.5 px-3 max-w-xs">${detailPillsHtml}</td>
          </tr>
        `;
      }).join('');
    }

    function copyLeaveAbsentStatsReport() {
      const data = computeLeaveAbsentAnalyticsData();
      const scope = document.getElementById('eventRankingScopeSelect')?.value || 'all_weeks';
      const scopeLabel = scope === 'selected_week'
        ? `เฉพาะสัปดาห์ ${formatThaiWeekRange(selectedWeekMonday)}`
        : `สะสมทั้งหมด ${data.totalWeeks} สัปดาห์`;

      const lines = [];
      lines.push(`🚨 สรุปสถิติของการลา / ขาดกิจกรรม — ${guildName}`);
      lines.push(`📅 ขอบเขตข้อมูล: ${scopeLabel}`);
      lines.push(`✅ เข้าร่วมรวม: ${data.guildTotalJoined} ครั้ง | 🏖️ แจ้งลารวม: ${data.guildTotalLeave} ครั้ง | ❌ ขาดรวม: ${data.guildTotalAbsent} ครั้ง`);
      lines.push(`========================================`);

      lines.push(`\n📌 【 สถิติการลา / ขาด แยกตาม 6 กิจกรรม 】`);
      WEEKLY_EVENTS_CONFIG.forEach(ev => {
        const t = data.eventTotals[ev.key];
        lines.push(`  ${ev.icon} ${ev.name}: ✅ เข้า ${t.joined} | 🏖️ ลา ${t.leave} | ❌ ขาด ${t.absent}`);
      });

      const offenders = [...data.memberStats]
        .filter(x => x.totalLeaveAndAbsent > 0 || x.dailyLeaveCount > 0)
        .sort((a, b) => b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.totalAbsent - a.totalAbsent || b.dailyLeaveCount - a.dailyLeaveCount);

      if (offenders.length === 0) {
        lines.push(`\n🎉 ไม่มีสมาชิกที่มีประวัติลาหรือขาดกิจกรรมเลย!`);
      } else {
        lines.push(`\n🚨 【 รายชื่อสมาชิกที่มีประวัติ ลา / ขาด (${offenders.length} คน) 】`);
        offenders.forEach((item, idx) => {
          const teamTag = item.pInfo ? `[${item.pInfo.team.name}-${item.pInfo.party.name}]` : `[ยังไม่ลงตี้]`;
          const detailsStr = item.leaveAbsentDetails.map(d => `${d.status === 'absent' ? '❌ขาด' : '🏖️ลา'}:${d.eventName}`).join(', ');
          lines.push(`  ${idx + 1}. ${item.member.name} (${item.member.job}) ${teamTag} — 🏖️ ลากิจกรรม ${item.totalLeave} ครั้ง | ❌ ขาด ${item.totalAbsent} ครั้ง | 📅 ลารายวัน ${item.dailyLeaveCount} วัน ${detailsStr ? `(${detailsStr})` : ''}`);
        });
      }

      const tempArea = document.createElement('textarea');
      tempArea.value = lines.join('\n');
      document.body.appendChild(tempArea);
      tempArea.select();
      document.execCommand('copy');
      tempArea.remove();
      showToast(`📋 คัดลอกรายงานสถิติการลา/ขาดเรียบร้อยแล้ว!`, 'success');
    }

    function exportLeaveAbsentStatsCSV() {
      if (members.length === 0) {
        showToast('ยังไม่มีข้อมูลสมาชิกให้ส่งออก CSV ครับ', 'danger');
        return;
      }
      const data = computeLeaveAbsentAnalyticsData();
      const headers = [
        'อันดับ', 'ชื่อตัวละคร', 'คลาสอาชีพ', 'คะแนน Gear', 'ทีม', 'ปาร์ตี้',
        'Mirror World (เข้า/ลา/ขาด)', 'The Hazy Maze Forest (เข้า/ลา/ขาด)',
        'Guild League อังคาร (เข้า/ลา/ขาด)', 'Guild League พฤหัสบดี (เข้า/ลา/ขาด)',
        'Polarity Zone (เข้า/ลา/ขาด)', 'ศึกชิงปราสาท (เข้า/ลา/ขาด)',
        'รวมลากิจกรรม (ครั้ง)', 'รวมขาดกิจกรรม (ครั้ง)', 'รวม ลา+ขาด กิจกรรม (ครั้ง)',
        'วันลารายวันสะสม (วัน)', 'รวมเข้าร่วมกิจกรรม (ครั้ง)', 'อัตราเข้าร่วม (%)', 'รายละเอียดกิจกรรมที่ลาหรือขาด'
      ];

      const sortedStats = [...data.memberStats].sort(
        (a, b) => b.totalLeaveAndAbsent - a.totalLeaveAndAbsent || b.totalAbsent - a.totalAbsent || b.dailyLeaveCount - a.dailyLeaveCount
      );

      const rows = sortedStats.map((item, idx) => {
        const m = item.member;
        const teamStr = item.pInfo ? item.pInfo.team.name : '-';
        const partyStr = item.pInfo ? item.pInfo.party.name : 'ไม่ได้ลงตี้';
        const evCols = WEEKLY_EVENTS_CONFIG.map(ev => {
          const c = item.byEvent[ev.key];
          return `เข้า ${c.joined} / ลา ${c.leave} / ขาด ${c.absent}`;
        });
        const detailText = item.leaveAbsentDetails
          .map(d => `${d.status === 'absent' ? 'ขาด' : 'ลา'} ${d.eventName} (${d.weekKey}${d.note ? ' ' + d.note : ''})`)
          .join(' | ')
          .replace(/,/g, ' ');

        return [
          idx + 1, m.name, m.job, m.gear, teamStr, partyStr,
          ...evCols,
          item.totalLeave, item.totalAbsent, item.totalLeaveAndAbsent,
          item.dailyLeaveCount, item.totalJoined, `${item.joinRate}%`, detailText || '-'
        ].join(',');
      });

      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `สถิติการลาและขาดกิจกรรม_${guildName.replace(/\s+/g, '_')}_${selectedWeekMonday}.csv`;
      a.click();
      showToast(`📥 ส่งออกไฟล์ CSV สถิติการลาและขาดกิจกรรมสำเร็จ!`, 'success');
    }

    function copyWeeklyEventReport() {
      const lines = [];
      lines.push(`🏆 สรุปการเข้ากิจกรรมประจำสัปดาห์ — ${guildName}`);
      lines.push(`📅 สัปดาห์: ${formatThaiWeekRange(selectedWeekMonday)}`);
      lines.push(`========================================`);

      WEEKLY_EVENTS_CONFIG.forEach(ev => {
        const joinedList = members.filter(m => getMemberEventRecord(m, selectedWeekMonday, ev.key).status === 'joined');
        const leaveList = members.filter(m => getMemberEventRecord(m, selectedWeekMonday, ev.key).status === 'leave');
        const absentList = members.filter(m => getMemberEventRecord(m, selectedWeekMonday, ev.key).status === 'absent');
        lines.push(`${ev.icon} ${ev.name}: ✅ เข้าร่วม ${joinedList.length}/${members.length} คน | 🏖️ ลา ${leaveList.length} คน | ❌ ขาด ${absentList.length} คน`);
      });

      const tempArea = document.createElement('textarea');
      tempArea.value = lines.join('\n');
      document.body.appendChild(tempArea);
      tempArea.select();
      document.execCommand('copy');
      tempArea.remove();
      showToast(`📋 คัดลอกสรุปการเข้ากิจกรรมประจำสัปดาห์แล้ว!`, 'success');
    }

    function exportWeeklyEventsCSV() {
      if (members.length === 0) {
        showToast('ยังไม่มีข้อมูลสมาชิกให้ส่งออก CSV ครับ', 'danger');
        return;
      }
      const headers = [
        'สัปดาห์ (จันทร์)', 'ชื่อตัวละคร', 'คลาสอาชีพ', 'คะแนน Gear', 'ทีม', 'ปาร์ตี้',
        'Mirror World', 'The Hazy Maze Forest', 'Guild League (อังคาร)', 'Guild League (พฤหัสบดี)',
        'Polarity Zone', 'ศึกชิงปราสาท', 'รวมเข้าร่วม (จาก 6)', 'รวมแจ้งลา (จาก 6)', 'รวมขาด (จาก 6)'
      ];
      const statusMapThai = { joined: 'เข้าร่วม', leave: 'แจ้งลา', absent: 'ขาด', none: 'รอเช็ค' };

      const rows = members.map(m => {
        const pInfo = findMemberPartyInfo(m.id);
        const teamStr = pInfo ? pInfo.team.name : '-';
        const partyStr = pInfo ? pInfo.party.name : 'ไม่ได้ลงตี้';
        let joinedCount = 0, leaveCount = 0, absentCount = 0;
        const evCells = WEEKLY_EVENTS_CONFIG.map(ev => {
          const rec = getMemberEventRecord(m, selectedWeekMonday, ev.key);
          if (rec.status === 'joined') joinedCount++;
          else if (rec.status === 'leave') leaveCount++;
          else if (rec.status === 'absent') absentCount++;
          const label = statusMapThai[rec.status || 'none'];
          return rec.note ? `${label} (${rec.note.replace(/,/g, ' ')})` : label;
        });
        return [
          selectedWeekMonday, m.name, m.job, m.gear, teamStr, partyStr,
          ...evCells, `${joinedCount}/${WEEKLY_EVENTS_CONFIG.length}`, leaveCount, absentCount
        ].join(',');
      });

      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `สรุปกิจกรรมรายสัปดาห์_${guildName.replace(/\s+/g, '_')}_${selectedWeekMonday}.csv`;
      a.click();
      showToast(`📥 ส่งออกไฟล์ CSV กิจกรรมประจำสัปดาห์สำเร็จ!`, 'success');
    }
