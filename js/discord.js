// ============================================================================
// DISCORD & LINE BROADCAST SUMMARY LOGIC
// ============================================================================

    function generateSummaryText() {
      syncMembersStatusForSelectedDate();
      const lines = [];
      lines.push(`⚔️ สรุปผังทัพกิลด์วอร์ — ${guildName}`);
      lines.push(`📅 ประจำวันที่: ${formatThaiDateFull(selectedDate)}`);
      const readyCount = members.filter(m => m.status === 'ready').length;
      const leaveList = members.filter(m => m.status === 'leave');
      lines.push(`✅ พร้อมวอร์: ${readyCount} คน | 🏖️ แจ้งลาวันนี้: ${leaveList.length} คน`);
      lines.push(`========================================`);

      FIELD_ZONES.forEach(fz => {
        const fieldTeams = teams.filter(t => t.field === fz.key);
        if (!fieldTeams.length) return;
        lines.push(`\n${fz.icon} ====== 【 ${fz.name} (${fieldTeams.map(t => t.name).join(', ')}) 】 ======`);
        fieldTeams.forEach(team => {
          const theme = getTeamTheme(team.color);
          const teamParties = parties.filter(p => p.teamId === team.id);
          lines.push(`\n  🚩 【 ${team.name} (สี${theme.name} • ${fz.name}) 】`);
          let hasAnyMember = false;
          teamParties.forEach(p => {
            const pMembers = p.slots.map(id => members.find(m => m.id === id)).filter(Boolean);
            if (!pMembers.length) return;
            hasAnyMember = true;
            const avgG = Math.round(pMembers.reduce((s, m) => s + m.gear, 0) / pMembers.length);
            const names = pMembers.map(m => {
              const leaveTag = m.status === 'leave' ? `[ลา: ${m.leaveReason}] ` : '';
              return `${leaveTag}${m.name} (${m.job} • ${(m.gear/1000).toFixed(1)}k)`;
            }).join(' | ');
            lines.push(`    • ${p.name} [เฉลี่ย ${avgG.toLocaleString()}]: ${names}`);
          });
          if (!hasAnyMember) {
            lines.push(`    • (ยังไม่มีสมาชิกในทีมนี้)`);
          }
        });
      });

      if (leaveList.length > 0) {
        lines.push(`\n🏖️ 【 รายชื่อคนแจ้งลาประจำวันที่ ${formatThaiDateShort(selectedDate)} (${leaveList.length} คน) 】`);
        leaveList.forEach((m, idx) => {
          const rec = m.leaveHistory?.[selectedDate];
          lines.push(`  ${idx + 1}. ${m.name} (${m.job}) — ${rec?.type || 'ลา'} : ${m.leaveReason || '-'}`);
        });
      }

      return lines.join('\n');
    }

    function copySummaryText() {
      const textarea = document.getElementById('summaryPreviewText');
      textarea.select();
      document.execCommand('copy');
      showToast('📋 คัดลอกข้อความสรุปผังทัพเรียบร้อยแล้ว!', 'success');
    }

    async function sendToDiscordWebhook() {
      const url = document.getElementById('discordWebhookInput').value.trim();
      if (!url) {
        showToast('กรุณาวางลิงก์ Discord Webhook URL ก่อนครับ', 'danger');
        return;
      }
      const content = document.getElementById('summaryPreviewText').value;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.slice(0, 1990) })
        });
        if (res.ok) showToast('🚀 ส่งผังทัพเข้า Discord สำเร็จ!', 'success');
        else showToast('ส่งไม่สำเร็จ กรุณาตรวจสอบลิงก์ Webhook', 'danger');
      } catch (err) {
        showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ Discord Webhook', 'danger');
      }
    }
