// ============================================================================
// GUILD MEMBER ROSTER & BULK ACTIONS LOGIC
// ============================================================================

    function toggleSelectMember(memberId, checked) {
      if (checked) selectedMemberIds.add(memberId);
      else selectedMemberIds.delete(memberId);
      updateBulkDeleteButton();
    }

    function toggleSelectAllVisible(checked) {
      const visibleCheckboxes = document.querySelectorAll('.member-row-checkbox');
      visibleCheckboxes.forEach(cb => {
        cb.checked = checked;
        const id = cb.getAttribute('data-id');
        if (checked) selectedMemberIds.add(id);
        else selectedMemberIds.delete(id);
      });
      updateBulkDeleteButton();
    }

    function updateBulkDeleteButton() {
      const btn = document.getElementById('btnDeleteSelected');
      if (!btn) return;
      if (selectedMemberIds.size > 0) {
        btn.classList.remove('hidden');
        btn.textContent = `🗑️ ลบที่เลือก (${selectedMemberIds.size} คน)`;
      } else {
        btn.classList.add('hidden');
      }
    }

    function deleteSelectedMembers() {
      const count = selectedMemberIds.size;
      if (count === 0) return;
      openCustomDialog({
        title: `🗑️ ลบสมาชิกที่เลือก (${count} คน)`,
        message: `ยืนยันการลบสมาชิกที่เลือกทั้งหมด ${count} คน ออกจากรายชื่อกิลด์?`,
        confirmText: 'ลบทั้งหมดที่เลือก',
        onConfirm: async () => {
          members = members.filter(m => !selectedMemberIds.has(m.id));
          parties.forEach(p => {
            p.slots = p.slots.map(id => (id && selectedMemberIds.has(id)) ? null : id);
          });
          selectedMemberIds.clear();
          const selectAllCb = document.getElementById('selectAllCheckbox');
          if (selectAllCb) selectAllCb.checked = false;
          populateClassFilterDropdown();
          renderAll();
          showToast(`🗑️ ลบสมาชิกที่เลือกจำนวน ${count} คน เรียบร้อยแล้ว`, 'danger');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate(`ลบสมาชิกที่เลือก ${count} คน`);
          }
        }
      });
    }

    function deleteOfflineMembers(mode) {
      const targetStatuses = mode === '7'
        ? ['ออฟไลน์เกิน 7 วัน']
        : ['ออฟไลน์ 4 วัน', 'ออฟไลน์ 5 วัน', 'ออฟไลน์ 6 วัน', 'ออฟไลน์เกิน 7 วัน'];
      const toDelete = members.filter(m => targetStatuses.includes(m.onlineStatus));
      if (toDelete.length === 0) {
        showToast('ไม่พบสมาชิกที่ตรงเงื่อนไขออฟไลน์ดังกล่าว', 'info');
        return;
      }
      const label = mode === '7' ? 'ออฟไลน์เกิน 7 วัน' : 'ออฟไลน์ตั้งแต่ 4 วันขึ้นไป';
      openCustomDialog({
        title: `🗑️ ลบคน${label}`,
        message: `พบสมาชิกที่ "${label}" จำนวน ${toDelete.length} คน\nต้องการลบออกจากรายชื่อกิลด์ทั้งหมดเลยหรือไม่?`,
        confirmText: `ลบ ${toDelete.length} คน`,
        onConfirm: async () => {
          const delIds = new Set(toDelete.map(m => m.id));
          members = members.filter(m => !delIds.has(m.id));
          parties.forEach(p => {
            p.slots = p.slots.map(id => (id && delIds.has(id)) ? null : id);
          });
          delIds.forEach(id => selectedMemberIds.delete(id));
          populateClassFilterDropdown();
          renderAll();
          showToast(`🗑️ ลบสมาชิกที่${label} จำนวน ${toDelete.length} คน เรียบร้อยแล้ว`, 'danger');
          if (typeof triggerAutoSaveImmediate === 'function') {
            await triggerAutoSaveImmediate(`ลบสมาชิกออฟไลน์ ${toDelete.length} คน`);
          }
        }
      });
    }

    const ROSTER_MAIN_CLASSES = [
      { name: 'High Priest', familyKey: 'priest', alt: ['Priest'] },
      { name: 'Lord Knight', familyKey: 'knight', alt: ['Knight'] },
      { name: 'Creator', familyKey: 'alchemist', alt: ['Alchemist'] },
      { name: 'Clown', familyKey: 'bard', alt: ['Bard'] },
      { name: 'Night Walker', familyKey: 'rebel', alt: ['Rebel', 'Gunslinger'] },
      { name: 'High Wizard', familyKey: 'wizard', alt: ['Wizard'] },
      { name: 'Assassin Cross', familyKey: 'assassin', alt: ['Assassin'] },
      { name: 'อาลิเทีย', familyKey: 'kanos', alt: ['คานอส', 'Kanos', 'Alithea'] },
      { name: 'Paladin', familyKey: 'crusader', alt: ['Crusader'] },
      { name: 'Sniper', familyKey: 'hunter', alt: ['Hunter'] },
      { name: 'Gypsy', familyKey: 'dancer', alt: ['Dancer'] },
      { name: 'Whitesmith', familyKey: 'blacksmith', alt: ['Blacksmith'] },
      { name: 'Champion', familyKey: 'monk', alt: ['Monk'] },
      { name: 'Scholar', familyKey: 'sage', alt: ['Professor', 'Sage', 'เซจ'] },
      { name: 'Stalker', familyKey: 'rogue', alt: ['Rogue', 'โร้ก'] }
    ];

    function populateClassFilterDropdown() {
      const select = document.getElementById('rosterClassFilter');
      if (!select) return;
      const currentVal = select.value || 'all';

      const itemMap = new Map();
      ROSTER_MAIN_CLASSES.forEach(item => {
        itemMap.set(item.name, {
          name: item.name,
          familyKey: item.familyKey,
          alt: item.alt,
          count: 0
        });
      });

      members.forEach(m => {
        const mJob = (m.job || '').trim();
        let matched = false;
        for (const [key, item] of itemMap.entries()) {
          if (mJob.toLowerCase() === item.name.toLowerCase() ||
              item.alt.some(a => a.toLowerCase() === mJob.toLowerCase()) ||
              (typeof getJobFamily === 'function' && getJobFamily(mJob).familyKey === item.familyKey)) {
            item.count++;
            matched = true;
            break;
          }
        }
        if (!matched && mJob) {
          if (!itemMap.has(mJob)) {
            itemMap.set(mJob, {
              name: mJob,
              familyKey: typeof getJobFamily === 'function' ? getJobFamily(mJob).familyKey : 'novice',
              alt: [],
              count: 0
            });
          }
          itemMap.get(mJob).count++;
        }
      });

      const items = Array.from(itemMap.values()).sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });

      select.innerHTML = `<option value="all">ทุกคลาสอาชีพ (15 คลาสหลัก)</option>` +
        items.map(it => `<option value="${it.name}">${it.name} (${it.count} คน)</option>`).join('');

      if (currentVal && (currentVal === 'all' || itemMap.has(currentVal))) {
        select.value = currentVal;
      }
    }

    function renderRosterTable() {
      syncMembersStatusForSelectedDate();
      const q = (document.getElementById('rosterSearch').value || '').toLowerCase();
      const cls = document.getElementById('rosterClassFilter').value;
      const sortBy = document.getElementById('rosterSortBy').value;

      let list = members.filter(m => {
        if (cls !== 'all') {
          const mJob = (m.job || '').trim().toLowerCase();
          const targetCls = cls.trim().toLowerCase();
          const cfg = ROSTER_MAIN_CLASSES.find(x => x.name.toLowerCase() === targetCls);
          let match = (mJob === targetCls);
          if (!match && cfg) {
            match = cfg.alt.some(a => a.toLowerCase() === mJob) ||
                    (typeof getJobFamily === 'function' && getJobFamily(m.job).familyKey === cfg.familyKey);
          }
          if (!match) return false;
        }
        if (activeJobBarFamily !== 'all' && getJobFamily(m.job).familyKey !== activeJobBarFamily) return false;
        if (!q) return true;
        return m.name.toLowerCase().includes(q) || m.job.toLowerCase().includes(q) || m.position.toLowerCase().includes(q) || m.title.toLowerCase().includes(q);
      });

      list.sort((a, b) => {
        if (sortBy === 'gear_desc') return b.gear - a.gear;
        if (sortBy === 'gear_asc') return a.gear - b.gear;
        if (sortBy === 'lv_desc') return b.lv - a.lv || b.gear - a.gear;
        if (sortBy === 'act_desc') return b.weeklyActivity - a.weeklyActivity;
        if (sortBy === 'contrib_desc') return b.totalContrib - a.totalContrib;
        return (a.csvId || 0) - (b.csvId || 0);
      });

      const tbody = document.getElementById('rosterTableBody');
      if (list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="11" class="py-12 text-center text-slate-500 text-xs sm:text-sm">
              ยังไม่มีข้อมูลสมาชิกที่ตรงเงื่อนไข — กดปุ่ม <strong>"➕ เพิ่มสมาชิก"</strong> หรือ <strong>"📂 นำเข้า .CSV"</strong> ด้านบนได้เลยครับ
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = list.map(m => {
        const meta = getJobMeta(m.job);
        const pInfo = findMemberPartyInfo(m.id);
        let partyBadge = `<span class="text-xs text-slate-500">ยังไม่ได้ลงตี้</span>`;
        if (pInfo) {
          const tTheme = getTeamTheme(pInfo.team.color);
          partyBadge = `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${tTheme.badgeClass}">
              <span class="w-2 h-2 rounded-full ${tTheme.dotClass}"></span>
              <span>${pInfo.fieldZone.icon} ${pInfo.fieldZone.shortName} • ${pInfo.team.name} • ${pInfo.party.name}</span>
            </span>
          `;
        }

        const onlineColor = m.onlineStatus === '[ออนไลน์]'
          ? 'text-emerald-400 font-semibold'
          : (m.onlineStatus.includes('วัน') && !['ออฟไลน์ 1 วัน', 'ออฟไลน์ 2 วัน', 'ออฟไลน์ 3 วัน'].includes(m.onlineStatus) ? 'text-rose-400' : 'text-sky-300');

        const isChecked = selectedMemberIds.has(m.id) ? 'checked' : '';

        return `
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-2.5 px-3">
              <input type="checkbox" data-id="${m.id}" ${isChecked} onchange="toggleSelectMember('${m.id}', this.checked)" class="member-row-checkbox rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer" />
            </td>
            <td class="py-2.5 px-3 mono text-xs text-slate-400">#${m.csvId || '-'}</td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2">
                ${renderJobEmblem(m.job, 28)}
                ${renderColoredMemberName(m)}
              </div>
            </td>
            <td class="py-2.5 px-3 mono text-xs">${m.lv}</td>
            <td class="py-2.5 px-3">
              <span style="${meta.badgeStyle}" class="px-2 py-0.5 rounded text-xs font-medium border">${m.job}</span>
            </td>
            <td class="py-2.5 px-3">${formatGearBadge(m.gear)}</td>
            <td class="py-2.5 px-3 text-xs text-slate-300">${m.position} <span class="text-slate-500">(${m.title})</span></td>
            <td class="py-2.5 px-3 mono text-xs text-slate-300">${m.weeklyActivity} / <span class="text-amber-300">${m.totalContrib.toLocaleString()}</span></td>
            <td class="py-2.5 px-3 text-xs ${onlineColor}">${m.onlineStatus}</td>
            <td class="py-2.5 px-3">${partyBadge}</td>
            <td class="py-2.5 px-3 text-right">
              <div class="inline-flex items-center gap-1.5">
                <button onclick="toggleMemberLeave('${m.id}')" class="px-2.5 py-1 rounded-lg text-xs font-medium transition ${m.status === 'ready' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'}">
                  ${m.status === 'ready' ? '✅ พร้อมวอร์' : `🏖️ ลา (${m.leaveReason || 'วันนี้'})`}
                </button>
                <button onclick="openEditMemberModal('${m.id}')" class="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-xs font-medium transition" title="แก้ไขข้อมูลผู้เล่น">
                  ✏️ แก้ไข
                </button>
                <button onclick="deleteMember('${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-medium transition">
                  🗑️ ลบ
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    async function toggleMemberLeave(memberId) {
      const m = members.find(x => String(x.id) === String(memberId));
      if (!m) return;
      ensureLeaveHistoryObject(m);
      m._leaveMigrated = true;
      if (!m.leaveHistory[selectedDate]) {
        const defaultReason = m.onlineStatus !== '[ออนไลน์]' ? m.onlineStatus : 'ติดธุระส่วนตัว';
        m.leaveHistory[selectedDate] = {
          status: 'leave',
          type: 'ลากิลด์วอร์ (GVG)',
          reason: defaultReason,
          updatedAt: new Date().toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
        };
        m.status = 'leave';
        m.leaveReason = defaultReason;
        m.leaveType = 'ลากิลด์วอร์ (GVG)';
        syncMembersStatusForSelectedDate();
        renderAll();
        showToast(`🏖️ บันทึกการลาของ "${m.name}" ในวันที่ ${formatThaiDateShort(selectedDate)} ลง Database แล้ว`, 'info');
        await saveLeaveToDatabaseSilent(`สลับสถานะลา: ${m.name}`);
      } else {
        delete m.leaveHistory[selectedDate];
        m.status = 'ready';
        m.leaveReason = '';
        m.leaveType = '';
        syncMembersStatusForSelectedDate();
        renderAll();
        showToast(`✅ ตั้ง "${m.name}" เป็นพร้อมวอร์ในวันที่ ${formatThaiDateShort(selectedDate)} แล้ว`, 'success');
        await saveLeaveToDatabaseSilent(`ยกเลิกการลา: ${m.name}`);
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
