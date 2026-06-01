import type {
  SessionMeta, SessionData, Player,
  GameType, ToggleSettings, PresetItemData, GeneratedPreset,
} from '../types';
import * as db from '../utils/db';
import { generatePairings, pairingsToCsv } from '../utils/pairingsGenerator';

const MAX_GENERATED = 5;

// ─── Reactive state ───────────────────────────────────────────────────────────

export const sessionState = $state({
  metas:       [] as SessionMeta[],
  currentData: null as SessionData | null,
  showPlayers: false,
  playersTab:  'men' as 'men' | 'women',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip Svelte 5 reactive proxy wrappers before writing to IndexedDB */
function raw<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function buildToggles(players: Player[]): ToggleSettings {
  const menLevels  = [...new Set(players.filter((p) => p.gender === 'M').map((p) => p.level))];
  const womenLevels= [...new Set(players.filter((p) => p.gender === 'F').map((p) => p.level))];
  return {
    men:   Object.fromEntries(menLevels.map((l) => [l, true])),
    women: Object.fromEntries(womenLevels.map((l) => [l, true])),
  };
}

async function persistCurrent(): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;

  await db.saveSessionData(raw(data));

  const meta = sessionState.metas.find((m) => m.id === data.id);
  if (meta) {
    meta.lastModified = Date.now();
    await db.saveSessionMeta(raw(meta));
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadMetas(): Promise<void> {
  sessionState.metas = await db.getAllMetas();
}

export async function createSession(players: Player[]): Promise<void> {
  const id  = crypto.randomUUID();
  const now = Date.now();

  const data: SessionData = {
    id,
    players,
    levelToggles:    buildToggles(players),
    presetItems:     [],
    generatedPresets:[],
  };

  const meta: SessionMeta = {
    id,
    name:         `Session ${new Date(now).toLocaleDateString('en-GB')}`,
    createdAt:    now,
    lastModified: now,
  };

  await db.saveSessionMeta(meta);
  await db.saveSessionData(raw(data));

  sessionState.metas = [...sessionState.metas, meta];
  sessionState.currentData = data;
}

export async function loadSession(id: string): Promise<void> {
  const data = await db.getSessionData(id);
  if (data) sessionState.currentData = data;
}

export function clearCurrentSession(): void {
  sessionState.currentData = null;
  sessionState.showPlayers  = false;
}

export async function renameSession(id: string, name: string): Promise<void> {
  const meta = sessionState.metas.find((m) => m.id === id);
  if (!meta) return;
  meta.name         = name;
  meta.lastModified = Date.now();
  await db.saveSessionMeta(raw(meta));
}

export async function deleteSession(id: string): Promise<void> {
  await db.deleteSession(id);
  sessionState.metas = sessionState.metas.filter((m) => m.id !== id);
  if (sessionState.currentData?.id === id) {
    sessionState.currentData = null;
    sessionState.showPlayers  = false;
  }
}

// ─── Level toggles ────────────────────────────────────────────────────────────

export async function toggleLevel(gender: 'men' | 'women', level: number): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;
  data.levelToggles[gender][level] = !data.levelToggles[gender][level];
  await persistCurrent();
}

// ─── Preset management ────────────────────────────────────────────────────────

export async function addPresetItem(gameType: GameType): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;

  const gameLabels: Record<GameType, string> = { mens: "Men's", womens: "Women's", mixed: 'Mixed' };
  const count = data.presetItems.filter((p) => p.gameType === gameType).length + 1;

  const item: PresetItemData = {
    id:             crypto.randomUUID(),
    name:           `${gameLabels[gameType]} Preset ${count}`,
    gameType,
    toggleSettings: raw(data.levelToggles), // snapshot at time of creation
  };

  data.presetItems.push(item);
  await persistCurrent();
}

export async function removePresetItem(presetId: string): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;
  data.presetItems      = data.presetItems.filter((p) => p.id !== presetId);
  data.generatedPresets = data.generatedPresets.filter((g) => g.presetId !== presetId);
  await persistCurrent();
}

export async function renamePresetItem(presetId: string, name: string): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;
  const item = data.presetItems.find((p) => p.id === presetId);
  if (item) item.name = name;
  await persistCurrent();
}

export async function generatePreset(presetId: string): Promise<void> {
  const data = sessionState.currentData;
  if (!data) return;

  const item = data.presetItems.find((p) => p.id === presetId);
  if (!item) return;

  const pairs      = generatePairings(data.players, item.gameType, item.toggleSettings);
  const csvContent = pairingsToCsv(pairs);

  const entry: GeneratedPreset = { presetId, csvContent, generatedAt: Date.now() };

  // Replace existing entry for this preset if it was already generated
  data.generatedPresets = data.generatedPresets.filter((g) => g.presetId !== presetId);
  data.generatedPresets.push(entry);

  // Evict oldest if over the cap
  if (data.generatedPresets.length > MAX_GENERATED) {
    data.generatedPresets.sort((a, b) => a.generatedAt - b.generatedAt);
    data.generatedPresets.splice(0, data.generatedPresets.length - MAX_GENERATED);
  }

  await persistCurrent();
}

export function getGeneratedPreset(presetId: string): GeneratedPreset | undefined {
  return sessionState.currentData?.generatedPresets.find((g) => g.presetId === presetId);
}
