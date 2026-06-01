import type { Player, GameType, ToggleSettings } from '../types';

// ─── Combinatorics ────────────────────────────────────────────────────────────

/** All unique unordered pairs from an array — mirrors Python's itertools.combinations(arr, 2) */
function combinations(names: string[]): [string, string][] {
  const result: [string, string][] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      result.push([names[i], names[j]]);
    }
  }
  return result;
}

// ─── Filtering helpers ────────────────────────────────────────────────────────

function levelOn(toggles: Record<number, boolean>, level: number): boolean {
  // A level absent from the map is treated as enabled (default-on)
  return toggles[level] !== false;
}

function men(players: Player[], toggles: ToggleSettings, matchKey: 'levelMatches' | 'mixedMatches') {
  return players.filter(
    (p) => p.gender === 'M' && p[matchKey] && levelOn(toggles.men, p.level)
  );
}

function women(players: Player[], toggles: ToggleSettings, matchKey: 'levelMatches' | 'mixedMatches') {
  return players.filter(
    (p) => p.gender === 'F' && p[matchKey] && levelOn(toggles.women, p.level)
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generatePairings(
  players: Player[],
  gameType: GameType,
  toggles: ToggleSettings
): [string, string][] {
  if (gameType === 'mens') {
    return combinations(men(players, toggles, 'levelMatches').map((p) => p.name));
  }

  if (gameType === 'womens') {
    return combinations(women(players, toggles, 'levelMatches').map((p) => p.name));
  }

  // Mixed — cartesian product
  const mNames = men(players, toggles, 'mixedMatches').map((p) => p.name);
  const wNames = women(players, toggles, 'mixedMatches').map((p) => p.name);
  const pairs: [string, string][] = [];
  for (const m of mNames) {
    for (const w of wNames) {
      pairs.push([m, w]);
    }
  }
  return pairs;
}

export function pairingsToCsv(pairs: [string, string][]): string {
  if (pairs.length === 0) return '';
  return pairs.map(([a, b]) => `${a},${b}`).join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
