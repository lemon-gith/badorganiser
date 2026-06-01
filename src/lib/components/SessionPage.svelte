<script lang="ts">
  import Icon from './Icon.svelte';
  import PresetItem from './PresetItem.svelte';
  import {
    sessionState,
    toggleLevel,
    addPresetItem,
    removePresetItem,
    renamePresetItem,
    generatePreset,
    getGeneratedPreset,
  } from '../stores/sessions.svelte.ts';
  import { showBanner } from '../stores/banners.svelte.ts';
  import { downloadCsv } from '../utils/pairingsGenerator';
  import type { GameType } from '../types';

  const data = $derived(sessionState.currentData!);

  // ─── Derived level lists ──────────────────────────────────────────────────
  const menLevels = $derived(
    [...new Set(data.players.filter((p) => p.gender === 'M').map((p) => p.level))].sort(
      (a, b) => a - b
    )
  );

  const womenLevels = $derived(
    [...new Set(data.players.filter((p) => p.gender === 'F').map((p) => p.level))].sort(
      (a, b) => a - b
    )
  );

  // ─── Preset actions ───────────────────────────────────────────────────────
  async function handleAddPreset(type: GameType) {
    await addPresetItem(type);
  }

  async function handleGenerate(presetId: string) {
    await generatePreset(presetId);
    const generated = getGeneratedPreset(presetId);
    if (generated !== undefined) {
      const pairCount = generated.csvContent
        ? generated.csvContent.split('\n').filter(Boolean).length
        : 0;
      showBanner('success', `Generated ${pairCount} pairing(s). Ready to download.`);
    }
  }

  function handleDownload(presetId: string) {
    const generated = getGeneratedPreset(presetId);
    if (!generated) return;
    const item = data.presetItems.find((p) => p.id === presetId);
    const filename = `${item?.name ?? 'pairings'}.csv`.replace(/[^\w\-. ]/g, '_');
    downloadCsv(filename, generated.csvContent);
  }

  // ─── Count active players per game type (for button subtitles) ────────────
  const activeMen = $derived(
    data.players.filter(
      (p) =>
        p.gender === 'M' &&
        p.levelMatches &&
        data.levelToggles.men[p.level] !== false
    ).length
  );

  const activeWomen = $derived(
    data.players.filter(
      (p) =>
        p.gender === 'F' &&
        p.levelMatches &&
        data.levelToggles.women[p.level] !== false
    ).length
  );

  const activeMenMixed = $derived(
    data.players.filter(
      (p) =>
        p.gender === 'M' &&
        p.mixedMatches &&
        data.levelToggles.men[p.level] !== false
    ).length
  );

  const activeWomenMixed = $derived(
    data.players.filter(
      (p) =>
        p.gender === 'F' &&
        p.mixedMatches &&
        data.levelToggles.women[p.level] !== false
    ).length
  );
</script>

<section class="session-page">
  <!-- ─── Explanation ────────────────────────────────────────────────────── -->
  <div class="intro">
    <p>
      Use the <strong>level filters</strong> below to include or exclude player tiers from
      pairings, then press one of the three game-type buttons to queue a preset.
      Each preset captures a snapshot of the current toggle settings.
      Click <strong>Generate</strong> to compute all valid pairings, then
      <strong>Download</strong> to save the result as a CSV. The last 5 generated
      presets are cached — older ones must be regenerated.
    </p>
  </div>

  <!-- ─── View Players button (hidden when sidebar is open) ─────────────── -->
  {#if !sessionState.showPlayers}
    <div class="view-players-row">
      <button
        class="btn btn-ghost view-players-btn"
        onclick={() => (sessionState.showPlayers = true)}
      >
        <Icon name="users" size={15} />
        View Players ({data.players.length})
      </button>
    </div>
  {/if}

  <!-- ─── Level Toggles ─────────────────────────────────────────────────── -->
  <div class="toggles-card">
    <h4 class="card-title">Level Filters</h4>
    <div class="toggles-grid">
      <!-- Men column -->
      <div class="toggle-col">
        <div class="col-label men-label">Men</div>
        {#if menLevels.length === 0}
          <p class="col-empty">No male players</p>
        {:else}
          {#each menLevels as level (level)}
            <label class="toggle-row">
              <span class="toggle-level-label">Level {level}</span>
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  checked={data.levelToggles.men[level] !== false}
                  onchange={() => toggleLevel('men', level)}
                  aria-label="Toggle men level {level}"
                />
                <div class="toggle-track"></div>
                <div class="toggle-knob"></div>
              </div>
            </label>
          {/each}
        {/if}
      </div>

      <!-- Women column -->
      <div class="toggle-col">
        <div class="col-label women-label">Women</div>
        {#if womenLevels.length === 0}
          <p class="col-empty">No female players</p>
        {:else}
          {#each womenLevels as level (level)}
            <label class="toggle-row">
              <span class="toggle-level-label">Level {level}</span>
              <div class="toggle-switch">
                <input
                  type="checkbox"
                  checked={data.levelToggles.women[level] !== false}
                  onchange={() => toggleLevel('women', level)}
                  aria-label="Toggle women level {level}"
                />
                <div class="toggle-track"></div>
                <div class="toggle-knob"></div>
              </div>
            </label>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- ─── Game Type Buttons ──────────────────────────────────────────────── -->
  <div class="game-type-row">
    <button
      class="game-btn game-btn--mens"
      onclick={() => handleAddPreset('mens')}
    >
      <span class="game-btn-label">Men's</span>
      <span class="game-btn-sub">{activeMen} player{activeMen !== 1 ? 's' : ''}</span>
    </button>

    <button
      class="game-btn game-btn--mixed"
      onclick={() => handleAddPreset('mixed')}
    >
      <span class="game-btn-label">Mixed</span>
      <span class="game-btn-sub">{activeMenMixed}M · {activeWomenMixed}F</span>
    </button>

    <button
      class="game-btn game-btn--womens"
      onclick={() => handleAddPreset('womens')}
    >
      <span class="game-btn-label">Women's</span>
      <span class="game-btn-sub">{activeWomen} player{activeWomen !== 1 ? 's' : ''}</span>
    </button>
  </div>

  <!-- ─── Preset List ────────────────────────────────────────────────────── -->
  <div class="preset-section">
    <h4 class="card-title">Presets</h4>

    {#if data.presetItems.length === 0}
      <div class="presets-empty">
        <Icon name="zap" size={28} />
        <p>No presets generated yet.</p>
        <p class="empty-hint">Press one of the game-type buttons above to queue your first preset.</p>
      </div>
    {:else}
      <div class="preset-list">
        {#each data.presetItems as preset (preset.id)}
          <PresetItem
            {preset}
            generatedPreset={getGeneratedPreset(preset.id)}
            onGenerate={handleGenerate}
            onDownload={handleDownload}
            onRename={renamePresetItem}
            onDelete={removePresetItem}
          />
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .session-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px 28px;
    overflow-y: auto;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
  }

  /* ─── Intro ─────────────────────────────────────────────────────────────── */
  .intro {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    font-size: 13.5px;
    color: var(--text-secondary);
    line-height: 1.7;
    box-shadow: var(--shadow-sm);
  }

  /* ─── View players button ────────────────────────────────────────────────── */
  .view-players-row { display: flex; }

  .view-players-btn {
    font-size: 13px;
    padding: 7px 14px;
  }

  /* ─── Toggles card ───────────────────────────────────────────────────────── */
  .toggles-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .card-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.06em;
    color: var(--text-primary);
  }

  .toggles-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 20px;
    max-height: 220px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .toggle-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .col-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 0 6px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }
  .men-label   { color: var(--text-info); }
  .women-label { color: var(--text-warning); }

  .col-empty {
    font-size: 12px;
    color: var(--text-muted);
    padding: 8px 0;
    font-style: italic;
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 4px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.1s;
    white-space: nowrap;
  }
  .toggle-row:hover { background: var(--bg-hover); }

  .toggle-level-label {
    font-size: 13px;
    color: var(--text-primary);
    font-weight: 500;
    flex-shrink: 0;
  }

  /* ─── Game-type buttons ──────────────────────────────────────────────────── */
  .game-type-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }

  .game-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 14px 10px;
    border-radius: var(--radius-lg);
    border: 2px solid transparent;
    font-family: 'DM Sans', sans-serif;
    transition: transform 0.12s, box-shadow 0.12s, background 0.12s;
  }

  .game-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .game-btn-label {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.2rem;
    letter-spacing: 0.06em;
  }

  .game-btn-sub {
    font-size: 11px;
    opacity: 0.75;
  }

  .game-btn--mens {
    background: var(--bg-info);
    color: var(--text-info);
    border-color: var(--color-info);
  }
  .game-btn--mens:hover:not(:disabled) { background: var(--color-info); color: white; }

  .game-btn--mixed {
    background: var(--accent-dim);
    color: var(--accent);
    border-color: var(--accent);
  }
  .game-btn--mixed:hover:not(:disabled) { background: var(--accent); color: var(--text-on-accent); }

  .game-btn--womens {
    background: var(--bg-warning);
    color: var(--text-warning);
    border-color: var(--color-warning);
  }
  .game-btn--womens:hover:not(:disabled) { background: var(--color-warning); color: white; }

  /* ─── Preset section ─────────────────────────────────────────────────────── */
  .preset-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: 16px;
  }

  .presets-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius-lg);
  }

  .empty-hint {
    font-size: 12.5px;
    max-width: 320px;
    line-height: 1.6;
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* ─── Responsive ─────────────────────────────────────────────────────────── */
  @media (max-width: 480px) {
    .session-page { padding: 16px; gap: 16px; }

    .game-type-row {
      grid-template-columns: 1fr;
    }

    .game-btn { flex-direction: row; justify-content: space-between; padding: 12px 16px; }

    .game-btn-label { font-size: 1rem; }
  }
</style>
