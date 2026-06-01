import type { SortKey, SortDir, SessionMeta } from '../types';

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function lsSet(key: string, val: string): void {
  try { localStorage.setItem(key, val); } catch { }
}

// ─── Reactive state ───────────────────────────────────────────────────────────

export const ui = $state({
  darkMode: lsGet('darkMode', 'false') === 'true',
  showHistory: lsGet('showHistory', 'true') === 'true',
  sortKey: lsGet('sortKey', 'lastModified') as SortKey,
  sortDir: lsGet('sortDir', 'desc') as SortDir,
});

// ─── Actions ──────────────────────────────────────────────────────────────────

export function toggleDark(): void {
  ui.darkMode = !ui.darkMode;
  lsSet('darkMode', String(ui.darkMode));
}

export function toggleHistory(): void {
  ui.showHistory = !ui.showHistory;
  lsSet('showHistory', String(ui.showHistory));
}

export function setSortKey(key: SortKey): void {
  ui.sortKey = key;
  lsSet('sortKey', key);
}

export function setSortDir(dir: SortDir): void {
  ui.sortDir = dir;
  lsSet('sortDir', dir);
}

// ─── Pure sorting helper (used in HistorySidebar) ────────────────────────────

export function sortMetas(
  metas: SessionMeta[],
  key: SortKey,
  dir: SortDir
): SessionMeta[] {
  return [...metas].sort((a, b) => {
    let cmp: number;
    if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'createdAt') cmp = a.createdAt - b.createdAt;
    else cmp = a.lastModified - b.lastModified;
    return dir === 'asc' ? cmp : -cmp;
  });
}
