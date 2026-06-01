<script lang="ts">
  import Icon from "./Icon.svelte";
  import { sessionState } from "../stores/sessions.svelte.ts";

  const players = $derived(sessionState.currentData?.players ?? []);

  const men = $derived(
    players
      .filter((p) => p.gender === "M")
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
  );
  const women = $derived(
    players
      .filter((p) => p.gender === "F")
      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
  );

  const displayed = $derived(sessionState.playersTab === "men" ? men : women);

  function levelLabel(level: number): string {
    return `L${level}`;
  }
</script>

<aside class="players-sidebar">
  <!-- ─── Header ──────────────────────────────────────────────────────────── -->
  <div class="sidebar-header">
    <div class="header-left">
      <Icon name="users" size={16} />
      <h3>Players</h3>
      <span class="player-count">{players.length}</span>
    </div>

    <button
      class="btn-icon close-btn"
      onclick={() => (sessionState.showPlayers = false)}
      aria-label="Close players panel"
    >
      <Icon name="x" size={16} />
    </button>
  </div>

  <!-- ─── Tabs ─────────────────────────────────────────────────────────────── -->
  <div class="tabs">
    <button
      class="tab"
      class:active={sessionState.playersTab === "men"}
      onclick={() => (sessionState.playersTab = "men")}
    >
      Men
      <span class="tab-count">{men.length}</span>
    </button>
    <button
      class="tab"
      class:active={sessionState.playersTab === "women"}
      onclick={() => (sessionState.playersTab = "women")}
    >
      Women
      <span class="tab-count">{women.length}</span>
    </button>
  </div>

  <!-- ─── Player list ─────────────────────────────────────────────────────── -->
  <div class="player-list">
    {#if displayed.length === 0}
      <p class="empty-state">
        No {sessionState.playersTab} players in this session.
      </p>
    {:else}
      {#each displayed as player (player.name)}
        <div class="player-row">
          <span class="level-badge">{levelLabel(player.level)}</span>
          <span class="player-name truncate">{player.name}</span>
          <span class="match-icons">
            {#if player.levelMatches}
              <span class="match-dot match-level" title="Level matches">L</span>
            {/if}
            {#if player.mixedMatches}
              <span class="match-dot match-mixed" title="Mixed matches">M</span>
            {/if}
          </span>
        </div>
      {/each}
    {/if}
  </div>

  <!-- ─── Legend ──────────────────────────────────────────────────────────── -->
  <div class="legend">
    <span class="match-dot match-level">L</span> Level matches &nbsp;
    <span class="match-dot match-mixed">M</span> Mixed matches
  </div>
</aside>

<style>
  .players-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-sidebar);
    border-left: 1px solid var(--border);
    overflow: hidden;
    min-width: 0;
    transition: background 0.2s ease;
  }

  /* ─── Header ────────────────────────────────────────────────────────────── */
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 12px 10px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-muted);
  }

  .header-left h3 {
    font-family: "Bebas Neue", sans-serif;
    font-size: 1rem;
    letter-spacing: 0.06em;
    color: var(--text-primary);
  }

  .player-count {
    font-size: 11px;
    font-weight: 600;
    background: var(--accent-dim);
    color: var(--accent);
    padding: 1px 6px;
    border-radius: 99px;
    line-height: 1.6;
  }

  .close-btn {
    color: var(--text-muted);
  }
  .close-btn:hover {
    color: var(--text-primary);
  }

  /* ─── Tabs ──────────────────────────────────────────────────────────────── */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    padding: 9px 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    border-bottom: 2px solid transparent;
    transition:
      color 0.15s,
      border-color 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .tab:hover {
    color: var(--text-primary);
  }
  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .tab-count {
    font-size: 11px;
    background: var(--border);
    border-radius: 99px;
    padding: 1px 6px;
    line-height: 1.6;
  }
  .tab.active .tab-count {
    background: var(--accent-dim);
    color: var(--accent);
  }

  /* ─── Player list ───────────────────────────────────────────────────────── */
  .player-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .empty-state {
    padding: 24px 12px;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
  }

  .player-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border-radius: var(--radius-sm);
    transition: background 0.1s;
  }
  .player-row:hover {
    background: var(--bg-hover);
  }

  .level-badge {
    font-size: 10px;
    font-weight: 700;
    font-family: "Bebas Neue", sans-serif;
    letter-spacing: 0.05em;
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: var(--radius-sm);
    padding: 2px 5px;
    flex-shrink: 0;
  }

  .player-name {
    flex: 1;
    font-size: 13px;
    color: var(--text-primary);
  }

  .match-icons {
    display: flex;
    gap: 3px;
    flex-shrink: 0;
  }

  .match-dot {
    font-size: 9px;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1.6;
  }

  .match-level {
    background: var(--bg-info);
    color: var(--text-info);
  }

  .match-mixed {
    background: var(--accent-dim);
    color: var(--accent);
  }

  /* ─── Legend ────────────────────────────────────────────────────────────── */
  .legend {
    padding: 8px 12px;
    font-size: 11px;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
</style>
