<script lang="ts">
  import Icon from "./Icon.svelte";
  import type { PresetItemData, GeneratedPreset } from "../types";

  let {
    preset,
    generatedPreset,
    onGenerate,
    onDownload,
    onRename,
    onDelete,
  }: {
    preset: PresetItemData;
    generatedPreset: GeneratedPreset | undefined;
    onGenerate: (id: string) => void;
    onDownload: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onDelete: (id: string) => void;
  } = $props();

  // ─── Editable name ────────────────────────────────────────────────────────
  let editing = $state(false);
  let nameVal = $state("");
  let nameEl = $state<HTMLInputElement | undefined>();

  // Keep nameVal in sync with the prop whenever we're not actively editing
  $effect(() => {
    if (!editing) nameVal = preset.name;
  });

  function startEdit() {
    editing = true;
    // Focus after DOM update
    setTimeout(() => nameEl?.select(), 0);
  }

  function commitEdit() {
    editing = false;
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== preset.name) {
      onRename(preset.id, trimmed);
    } else {
      nameVal = preset.name; // revert if blank or unchanged
    }
  }

  function onNameKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    }
    if (e.key === "Escape") {
      editing = false;
      nameVal = preset.name;
    }
  }

  // ─── Description ─────────────────────────────────────────────────────────
  const GAME_LABELS: Record<string, string> = {
    mens: "Men's Doubles",
    womens: "Women's Doubles",
    mixed: "Mixed Doubles",
  };

  function toggleDesc(t: Record<number, boolean>): string {
    return Object.entries(t)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([l, on]) => `L${l}${on ? "✓" : "✗"}`)
      .join(" ");
  }

  const description = $derived.by((): string => {
    const { gameType, toggleSettings: ts } = preset;
    const base = GAME_LABELS[gameType];
    if (gameType === "mens") return `${base} · ${toggleDesc(ts.men)}`;
    if (gameType === "womens") return `${base} · ${toggleDesc(ts.women)}`;
    return `${base} · Men: ${toggleDesc(ts.men)} · Women: ${toggleDesc(ts.women)}`;
  });

  // ─── Generated status ─────────────────────────────────────────────────────
  const isGenerated = $derived(generatedPreset !== undefined);

  let generating = $state(false);

  async function handleGenerate() {
    generating = true;
    await onGenerate(preset.id);
    generating = false;
  }

  const GAME_TYPE_CLASS: Record<string, string> = {
    mens: "tag-mens",
    womens: "tag-womens",
    mixed: "tag-mixed",
  };

  const GAME_TYPE_SHORT: Record<string, string> = {
    mens: "Men's",
    womens: "Women's",
    mixed: "Mixed",
  };
</script>

<div class="preset-item" class:is-generated={isGenerated}>
  <!-- ─── Type tag ──────────────────────────────────────────────────────── -->
  <span class="type-tag {GAME_TYPE_CLASS[preset.gameType]}">
    {GAME_TYPE_SHORT[preset.gameType]}
  </span>

  <!-- ─── Name + description ───────────────────────────────────────────── -->
  <div class="preset-body">
    {#if editing}
      <input
        bind:this={nameEl}
        bind:value={nameVal}
        class="name-input"
        onblur={commitEdit}
        onkeydown={onNameKeydown}
        aria-label="Preset name"
      />
    {:else}
      <button
        class="preset-name"
        ondblclick={startEdit}
        title="Double-click to rename"
      >
        {preset.name}
      </button>
    {/if}
    <p class="preset-desc truncate" title={description}>
      {description}
    </p>
  </div>

  <!-- ─── Actions ──────────────────────────────────────────────────────── -->
  <div class="preset-actions">
    {#if isGenerated}
      <button
        class="btn btn-primary action-btn"
        onclick={() => onDownload(preset.id)}
        title="Download CSV"
        aria-label="Download CSV"
      >
        <Icon name="download" size={15} />
        Download
      </button>
    {:else}
      <button
        class="btn btn-ghost action-btn"
        onclick={handleGenerate}
        disabled={generating}
        title="Generate pairings"
        aria-label="Generate pairings"
      >
        {#if generating}
          <Icon name="loader" size={15} class="spin" />
        {:else}
          <Icon name="zap" size={15} />
        {/if}
        Generate
      </button>
    {/if}

    <button
      class="btn-icon rename-btn"
      onclick={startEdit}
      title="Rename"
      aria-label="Rename preset"
    >
      <Icon name="edit" size={14} />
    </button>

    <button
      class="btn-icon delete-btn"
      onclick={() => onDelete(preset.id)}
      title="Delete preset"
      aria-label="Delete preset"
    >
      <Icon name="trash" size={14} />
    </button>
  </div>
</div>

<style>
  .preset-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
    min-width: 0;
  }

  .preset-item:hover {
    border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
  }

  .preset-item.is-generated {
    border-color: var(--accent);
    border-left: 3px solid var(--accent);
  }

  /* ─── Type tag ──────────────────────────────────────────────────────────── */
  .type-tag {
    font-size: 10px;
    font-weight: 700;
    font-family: "Bebas Neue", sans-serif;
    letter-spacing: 0.06em;
    padding: 3px 7px;
    border-radius: var(--radius-sm);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .tag-mens {
    background: var(--bg-info);
    color: var(--text-info);
  }
  .tag-womens {
    background: var(--bg-warning);
    color: var(--text-warning);
  }
  .tag-mixed {
    background: var(--accent-dim);
    color: var(--accent);
  }

  /* ─── Body ──────────────────────────────────────────────────────────────── */
  .preset-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .preset-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    text-align: left;
    padding: 0;
    cursor: text;
    border-radius: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .preset-name:hover {
    color: var(--accent);
  }

  .name-input {
    font-size: 13px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    width: 100%;
  }

  .preset-desc {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* ─── Actions ───────────────────────────────────────────────────────────── */
  .preset-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .action-btn {
    font-size: 12px;
    padding: 5px 10px;
    white-space: nowrap;
  }

  .rename-btn,
  .delete-btn {
    color: var(--text-muted);
    opacity: 0.5;
    transition:
      opacity 0.15s,
      color 0.15s;
  }

  .preset-item:hover .rename-btn,
  .preset-item:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--color-error) !important;
  }
  .rename-btn:hover {
    color: var(--accent) !important;
  }
</style>
