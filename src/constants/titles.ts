export interface TitleMeta {
  key: string;
  name: string;
  tier: number;
  image: string;
  iconImage: string;
}

export const TITLE_LIST: TitleMeta[] = [
  // Traveler I – V
  { key: 'traveler_1', name: 'Traveler I', tier: 1, image: '/titles/traveler_1.png', iconImage: '/titles/traveler_1_icon.png' },
  { key: 'traveler_2', name: 'Traveler II', tier: 2, image: '/titles/traveler_2.png', iconImage: '/titles/traveler_2_icon.png' },
  { key: 'traveler_3', name: 'Traveler III', tier: 3, image: '/titles/traveler_3.png', iconImage: '/titles/traveler_3_icon.png' },
  { key: 'traveler_4', name: 'Traveler IV', tier: 4, image: '/titles/traveler_4.png', iconImage: '/titles/traveler_4_icon.png' },
  { key: 'traveler_5', name: 'Traveler V', tier: 5, image: '/titles/traveler_5.png', iconImage: '/titles/traveler_5_icon.png' },

  // Explorer I – V
  { key: 'explorer_1', name: 'Explorer I', tier: 1, image: '/titles/explorer_1.png', iconImage: '/titles/explorer_1_icon.png' },
  { key: 'explorer_2', name: 'Explorer II', tier: 2, image: '/titles/explorer_2.png', iconImage: '/titles/explorer_2_icon.png' },
  { key: 'explorer_3', name: 'Explorer III', tier: 3, image: '/titles/explorer_3.png', iconImage: '/titles/explorer_3_icon.png' },
  { key: 'explorer_4', name: 'Explorer IV', tier: 4, image: '/titles/explorer_4.png', iconImage: '/titles/explorer_4_icon.png' },
  { key: 'explorer_5', name: 'Explorer V', tier: 5, image: '/titles/explorer_5.png', iconImage: '/titles/explorer_5_icon.png' },

  // Pathfinder I – V
  { key: 'pathfinder_1', name: 'Pathfinder I', tier: 1, image: '/titles/pathfinder_1.png', iconImage: '/titles/pathfinder_1_icon.png' },
  { key: 'pathfinder_2', name: 'Pathfinder II', tier: 2, image: '/titles/pathfinder_2.png', iconImage: '/titles/pathfinder_2_icon.png' },
  { key: 'pathfinder_3', name: 'Pathfinder III', tier: 3, image: '/titles/pathfinder_3.png', iconImage: '/titles/pathfinder_3_icon.png' },
  { key: 'pathfinder_4', name: 'Pathfinder IV', tier: 4, image: '/titles/pathfinder_4.png', iconImage: '/titles/pathfinder_4_icon.png' },
  { key: 'pathfinder_5', name: 'Pathfinder V', tier: 5, image: '/titles/pathfinder_5.png', iconImage: '/titles/pathfinder_5_icon.png' },

  // Trailblazer I – V
  { key: 'trailblazer_1', name: 'Trailblazer I', tier: 1, image: '/titles/trailblazer_1.png', iconImage: '/titles/trailblazer_1_icon.png' },
  { key: 'trailblazer_2', name: 'Trailblazer II', tier: 2, image: '/titles/trailblazer_2.png', iconImage: '/titles/trailblazer_2_icon.png' },
  { key: 'trailblazer_3', name: 'Trailblazer III', tier: 3, image: '/titles/trailblazer_3.png', iconImage: '/titles/trailblazer_3_icon.png' },
  { key: 'trailblazer_4', name: 'Trailblazer IV', tier: 4, image: '/titles/trailblazer_4.png', iconImage: '/titles/trailblazer_4_icon.png' },
  { key: 'trailblazer_5', name: 'Trailblazer V', tier: 5, image: '/titles/trailblazer_5.png', iconImage: '/titles/trailblazer_5_icon.png' },

  // ผู้บุกเบิก I – V (Pioneer)
  { key: 'pioneer_1', name: 'ผู้บุกเบิก I', tier: 1, image: '/titles/pioneer_1.png', iconImage: '/titles/pioneer_1_icon.png' },
  { key: 'pioneer_2', name: 'ผู้บุกเบิก II', tier: 2, image: '/titles/pioneer_2.png', iconImage: '/titles/pioneer_2_icon.png' },
  { key: 'pioneer_3', name: 'ผู้บุกเบิก III', tier: 3, image: '/titles/pioneer_3.png', iconImage: '/titles/pioneer_3_icon.png' },
  { key: 'pioneer_4', name: 'ผู้บุกเบิก IV', tier: 4, image: '/titles/pioneer_4.png', iconImage: '/titles/pioneer_4_icon.png' },
  { key: 'pioneer_5', name: 'ผู้บุกเบิก V', tier: 5, image: '/titles/pioneer_5.png', iconImage: '/titles/pioneer_5_icon.png' },

  // ผู้เบิกอรุณ / ผู้บุกเบิกอรุณ I – V (Dawn Pioneer)
  { key: 'dawn_1', name: 'ผู้เบิกอรุณ I', tier: 1, image: '/titles/pioneer_1.png', iconImage: '/titles/pioneer_1_icon.png' },
  { key: 'dawn_2', name: 'ผู้เบิกอรุณ II', tier: 2, image: '/titles/pioneer_2.png', iconImage: '/titles/pioneer_2_icon.png' },
  { key: 'dawn_3', name: 'ผู้เบิกอรุณ III', tier: 3, image: '/titles/pioneer_3.png', iconImage: '/titles/pioneer_3_icon.png' },
  { key: 'dawn_4', name: 'ผู้เบิกอรุณ IV', tier: 4, image: '/titles/pioneer_4.png', iconImage: '/titles/pioneer_4_icon.png' },
  { key: 'dawn_5', name: 'ผู้เบิกอรุณ V', tier: 5, image: '/titles/pioneer_5.png', iconImage: '/titles/pioneer_5_icon.png' },
  { key: 'dawn_b_1', name: 'ผู้บุกเบิกอรุณ I', tier: 1, image: '/titles/pioneer_1.png', iconImage: '/titles/pioneer_1_icon.png' },
  { key: 'dawn_b_2', name: 'ผู้บุกเบิกอรุณ II', tier: 2, image: '/titles/pioneer_2.png', iconImage: '/titles/pioneer_2_icon.png' },
  { key: 'dawn_b_3', name: 'ผู้บุกเบิกอรุณ III', tier: 3, image: '/titles/pioneer_3.png', iconImage: '/titles/pioneer_3_icon.png' },
  { key: 'dawn_b_4', name: 'ผู้บุกเบิกอรุณ IV', tier: 4, image: '/titles/pioneer_4.png', iconImage: '/titles/pioneer_4_icon.png' },
  { key: 'dawn_b_5', name: 'ผู้บุกเบิกอรุณ V', tier: 5, image: '/titles/pioneer_5.png', iconImage: '/titles/pioneer_5_icon.png' },
];

/**
 * Normalizes title string and finds matching TitleMeta
 */
export function getTitleMeta(rawTitle?: string | null): TitleMeta | null {
  if (!rawTitle) return null;
  const clean = rawTitle.trim().toLowerCase();

  // Determine family - check "อรุณ" before "ผู้บุกเบิก"
  let family = '';
  if (clean.includes('อรุณ') || clean.includes('dawn')) family = 'dawn';
  else if (clean.includes('ผู้บุกเบิก') || clean.includes('pioneer')) family = 'pioneer';
  else if (clean.includes('trailblazer') || clean.includes('เทรลเบลเซอร์') || clean.includes('เทรลเบล')) family = 'trailblazer';
  else if (clean.includes('pathfinder') || clean.includes('พาธไฟน์เดอร์') || clean.includes('พาธไฟน์')) family = 'pathfinder';
  else if (clean.includes('explorer') || clean.includes('เอ็กซ์พลอเรอร์') || clean.includes('เอ็กซ์พลอ')) family = 'explorer';
  else if (clean.includes('traveler') || clean.includes('ทราเวลเลอร์') || clean.includes('ทราเวล')) family = 'traveler';

  if (!family) return null;

  // Determine rank / tier (1 to 5) - check 'iv' before 'v'
  let tier = 1;
  if (clean.includes(' iv') || clean.endsWith('iv') || clean.includes(' 4') || clean.endsWith('4')) tier = 4;
  else if (clean.includes(' v') || clean.endsWith('v') || clean.includes(' 5') || clean.endsWith('5')) tier = 5;
  else if (clean.includes(' iii') || clean.endsWith('iii') || clean.includes(' 3') || clean.endsWith('3')) tier = 3;
  else if (clean.includes(' ii') || clean.endsWith('ii') || clean.includes(' 2') || clean.endsWith('2')) tier = 2;
  else if (clean.includes(' i') || clean.endsWith('i') || clean.includes(' 1') || clean.endsWith('1')) tier = 1;

  const matchKey = `${family}_${tier}`;
  const found = TITLE_LIST.find((t) => t.key === matchKey);
  if (found) return found;

  // Fallback for dawn_b
  return TITLE_LIST.find((t) => t.key === `dawn_b_${tier}`) || null;
}

export function getTitleImage(rawTitle?: string | null): string | null {
  const meta = getTitleMeta(rawTitle);
  return meta ? meta.image : null;
}

export function getTitleRankWeight(rawTitle?: string | null): number {
  if (!rawTitle) return 0;
  const meta = getTitleMeta(rawTitle);
  if (!meta) return 0;
  const familyOrder: Record<string, number> = {
    traveler: 1,
    explorer: 2,
    pathfinder: 3,
    trailblazer: 4,
    pioneer: 5,
    dawn: 6,
  };
  const fam = meta.key.split('_')[0];
  const famRank = familyOrder[fam] || 1;
  return famRank * 10 + meta.tier;
}
