// ─── Domain Types ────────────────────────────────────────────────────────────

export interface Player {
  name: string;
  gender: 'M' | 'F';
  level: number;
  levelMatches: boolean;
  mixedMatches: boolean;
}

// ─── Session Types ────────────────────────────────────────────────────────────

/** Lightweight record stored in the history list */
export interface SessionMeta {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
}

export type GameType = 'mens' | 'womens' | 'mixed';

export interface ToggleSettings {
  men: Record<number, boolean>;
  women: Record<number, boolean>;
}

export interface PresetItemData {
  id: string;
  name: string;
  gameType: GameType;
  /** Snapshot of level toggles taken at the moment the preset was queued */
  toggleSettings: ToggleSettings;
}

export interface GeneratedPreset {
  presetId: string;
  csvContent: string;
  generatedAt: number;
}

/** Full session record stored in IndexedDB */
export interface SessionData {
  id: string;
  players: Player[];
  levelToggles: ToggleSettings;
  presetItems: PresetItemData[];
  /** Capped queue of the 5 most recently generated presets */
  generatedPresets: GeneratedPreset[];
}

// ─── UI / Settings Types ──────────────────────────────────────────────────────

export type SortKey = 'name' | 'createdAt' | 'lastModified';
export type SortDir = 'asc' | 'desc';

export type BannerType = 'success' | 'error' | 'warning' | 'info';
export interface BannerItem {
  id: string;
  type: BannerType;
  message: string;
}
