import type { Player } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParseResult {
  players: Player[];
  errors: string[];
}

type ColKey = keyof Pick<Player, 'name' | 'gender' | 'level' | 'levelMatches' | 'mixedMatches'>;

// ─── Header matching ──────────────────────────────────────────────────────────

const HEADER_VARIANTS: Record<ColKey, string[]> = {
  name: ['name', 'playername', 'player name', 'player'],
  gender: ['gender', 'sex', 'g'],
  level: ['level', 'skill', 'skilllevel', 'skill level'],
  levelMatches: ['levelmatches', 'level matches', 'level_matches', 'samegender',
    'same gender', 'same gender matches', 'levelmatch', 'level match',
    'level doubles'],
  mixedMatches: ['mixedmatches', 'mixed matches', 'mixed_matches', 'mixed',
    'mixed doubles', 'mixedmatch', 'mixed match'],
};

const REQUIRED_KEYS: ColKey[] = ['name', 'gender', 'level', 'levelMatches', 'mixedMatches'];

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[\s_\-]+/g, '');
}

function matchHeader(cell: string): ColKey | null {
  const n = normalize(cell);
  for (const [key, variants] of Object.entries(HEADER_VARIANTS) as [ColKey, string[]][]) {
    if (variants.some((v) => normalize(v) === n)) return key;
  }
  return null;
}

// ─── Field parsers ────────────────────────────────────────────────────────────

function parseBool(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function parseGender(val: string): 'M' | 'F' {
  const v = val.toLowerCase().trim();
  if (['m', 'male', 'man', 'boy'].includes(v)) return 'M';
  if (['f', 'female', 'woman', 'girl'].includes(v)) return 'F';
  throw new Error(`Unrecognised gender value "${val}" — expected M/F, Male/Female, Man/Woman`);
}

// ─── RFC 4180-compatible row splitter ─────────────────────────────────────────

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseCSV(raw: string): ParseResult {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { players: [], errors: ['The CSV file is empty.'] };
  }

  const rows = lines.map(splitRow);
  const colCount = rows[0].length;

  // Validate consistent column count
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== colCount) {
      return {
        players: [],
        errors: [
          `Row ${i + 1} has ${rows[i].length} column(s) but the first row has ${colCount}. ` +
          'Please check for stray commas or unmatched quotes.',
        ],
      };
    }
  }

  if (colCount < 5) {
    return {
      players: [],
      errors: [
        `Expected at least 5 columns but found ${colCount}. ` +
        'Required columns: name, gender, level, level_matches, mixed_matches.',
      ],
    };
  }

  // Detect header row by counting fuzzy matches in the first row
  const firstRowMatches = rows[0].map(matchHeader);
  const hitCount = firstRowMatches.filter(Boolean).length;
  const hasHeader = hitCount >= 3;

  let columnOrder: (ColKey | null)[];
  let dataRows: string[][];

  if (hasHeader) {
    columnOrder = firstRowMatches;

    // Ensure all required columns are present
    const foundKeys = new Set(columnOrder.filter(Boolean) as ColKey[]);
    const missing = REQUIRED_KEYS.filter((k) => !foundKeys.has(k));
    if (missing.length > 0) {
      return {
        players: [],
        errors: [
          `Missing expected column(s): ${missing.join(', ')}. ` +
          'Please check your header row — all five columns are required.',
        ],
      };
    }

    dataRows = rows.slice(1);
  } else {
    // No header detected — assume canonical column order
    columnOrder = ['name', 'gender', 'level', 'levelMatches', 'mixedMatches'];
    dataRows = rows;
  }

  // Parse each data row
  const players: Player[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const lineNum = hasHeader ? i + 2 : i + 1;

    const get = (key: ColKey): string => {
      const idx = columnOrder.indexOf(key);
      return idx === -1 ? '' : (row[idx] ?? '');
    };

    try {
      const rawName = get('name');
      if (!rawName) throw new Error('Name field is empty');

      const level = parseInt(get('level'), 10);
      if (isNaN(level)) {
        throw new Error(`Level must be an integer, got "${get('level')}"`);
      }

      players.push({
        name: rawName,
        gender: parseGender(get('gender')),
        level,
        levelMatches: parseBool(get('levelMatches')),
        mixedMatches: parseBool(get('mixedMatches')),
      });
    } catch (err) {
      errors.push(`Row ${lineNum}: ${(err as Error).message}`);
    }
  }

  return { players, errors };
}
