export type JobRole = 'tank' | 'dps' | 'healer' | 'bard';

export interface JobFamilyMeta {
  familyKey: string;
  label: string;
  sub?: string;
  role: JobRole;
  hexMain: string;
  hexDark: string;
  hexBorder: string;
  namePillStyle: string;
  cardTintStyle: string;
  jobs: string[];
}

export interface Member {
  id: string;
  name: string;
  job: string;
  status: 'ready' | 'leave';
  leaveReason?: string;
  onlineStatus?: string;
  gear?: number;
  lv?: number;
  csvId?: number;
  title?: string;
  gender?: string;
  position?: string;
  weeklyActivity?: number;
  weeklyContrib?: number;
  totalContrib?: number;
  weeklyEvents?: Record<string, Record<string, { status: string; note?: string; updatedAt?: string }>>;
  leaveHistory?: Record<string, { type?: string; reason?: string }>;
  updatedAt?: string;
}

