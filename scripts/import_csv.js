const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lzlrlnmphtjotgeumqht.supabase.co',
  'sb_publishable_YjR6DcMPq2OD3l0JVVMzPg_tigMFS6H'
);

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = [];
    let inQuotes = false;
    let cur = '';
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        cols.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}

async function run() {
  const csvText = fs.readFileSync('data/tumdood_members.csv', 'utf-8');
  const rows = parseCSV(csvText);
  console.log('Parsed rows count:', rows.length);
  console.log('First row:', rows[0]);
  console.log('Last row:', rows[rows.length - 1]);

  // Fetch current members for Guild 2
  const { data: currentData } = await supabase
    .from('guild_members')
    .select('*')
    .eq('id', 2)
    .maybeSingle();
  const existingMembers = currentData?.members || [];
  console.log('Existing members in Guild 2:', existingMembers.length);

  // Map by csvId
  const existingMap = new Map();
  existingMembers.forEach((m) => {
    if (m.csvId) existingMap.set(Number(m.csvId), m);
  });

  const updatedMembers = rows.map((r, idx) => {
    const csvId = parseInt(r['ID'] || `${idx + 1}`, 10);
    const existing = existingMap.get(csvId);

    const name = (r['ชื่อตัวละคร'] || r['ชื่อผู้เล่น'] || r['ชื่อ'] || '').trim();
    const onlineStr = (r['สถานะการออนไลน์'] || r['สถานะออนไลน์'] || '[ออนไลน์]').trim();
    const isLongOffline = [
      'ออฟไลน์ 4 วัน',
      'ออฟไลน์ 5 วัน',
      'ออฟไลน์ 6 วัน',
      'ออฟไลน์เกิน 7 วัน',
    ].includes(onlineStr);

    const id = existing?.id || `m_csv_${Date.now()}_${csvId}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      id,
      csvId,
      name,
      lv: parseInt(r['Lv.'] || r['Lv'] || '93', 10),
      job: (r['อาชีพ'] || r['คลาส'] || 'Novice').trim(),
      title: (r['Title'] || '-').trim(),
      gender: (r['เพศ'] || '-').trim(),
      position: (r['ตำแหน่ง'] || 'คนธรรมดา').trim(),
      gear: parseInt(r['คะแนน Gear'] || '0', 10) || 0,
      weeklyActivity: parseInt(r['กิจกรรมกิลด์รายสัปดาห์'] || '0', 10) || 0,
      weeklyContrib: parseInt(r['คะแนนบริจาคสัปดาห์'] || '0', 10) || 0,
      totalContrib: parseInt(r['คะแนนบริจาครวม'] || '0', 10) || 0,
      onlineStatus: onlineStr,
      status: isLongOffline ? 'leave' : 'ready',
      leaveReason: isLongOffline ? onlineStr : undefined,
      weeklyEvents: existing?.weeklyEvents || {},
    };
  });

  console.log('Sample updated member 1:', updatedMembers[0]);
  console.log('Sample updated member 6 (Ouranophile):', updatedMembers[5]);

  // Save to Supabase for Guild 2 (TUMDOOD)
  const now = new Date().toISOString();
  const { error: errMembers } = await supabase.from('guild_members').upsert({
    id: 2,
    members: updatedMembers,
    updated_at: now,
  });
  if (errMembers) {
    console.error('Error updating guild_members for Guild 2:', errMembers);
  } else {
    console.log('Successfully updated guild_members for Guild 2 in Supabase!');
  }

  // Also update timestamp in guild_settings for Guild 2
  await supabase.from('guild_settings').upsert({
    id: 2,
    file_timestamp: new Date().toLocaleString('th-TH', {
      dateStyle: 'short',
      timeStyle: 'short',
    }),
    updated_at: now,
  });

  console.log('All done!');
}

run();

