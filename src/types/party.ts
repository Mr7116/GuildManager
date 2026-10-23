export type FieldZoneKey = 'main' | 'sub';
export type LaneKey = 'lane_mid' | 'lane_left' | 'lane_right' | 'roam_left' | 'roam_right';

export interface FieldZoneMeta {
  key: FieldZoneKey;
  name: string;
  shortName: string;
  fullName: string;
  subtitle: string;
  icon: string;
  hexAccent: string;
  hexBgSoft: string;
  hexHeaderBg: string;
}

export interface GvgLaneMeta {
  key: LaneKey;
  name: string;
  shortName: string;
  fullName: string;
  subtitle: string;
  icon: string;
  hexAccent: string;
  badgeClass: string;
  activeClass: string;
}

export interface Party {
  id: string;
  name: string;
  teamId: string;
  teamName?: string;
  teamColor?: string;
  teamField?: FieldZoneKey;
  category?: 'gvg' | 'siege' | 'polarity' | 'preset' | string;
  lane?: LaneKey;
  slots: (string | null)[]; // Array of 5 member IDs
}

export interface Team {
  id: string;
  name: string;
  color: string;
  field: FieldZoneKey;
}

