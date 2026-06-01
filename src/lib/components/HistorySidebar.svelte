<script lang="ts">
  import Icon from './Icon.svelte';
  import {
    ui, toggleHistory, setSortKey, setSortDir, sortMetas,
  } from '../stores/settings.svelte.ts';
  import {
    sessionState, loadSession, deleteSession, clearCurrentSession,
  } from '../stores/sessions.svelte.ts';
  import type { SortKey } from '../types';

  // ─── Sort dropdown ────────────────────────────────────────────────────────
  let dropdownOpen = $state(false);
  let dropdownEl = $state<HTMLElement | undefined>();

  $effect(() => {
    if (!dropdownOpen) return;

    function onOutsideClick(e: MouseEvent) {
      if (dropdownEl && !dropdownEl.contains(e.target as Node)) {
        dropdownOpen = false;
      }
    }

    document.addEventListener('pointerdown', onOutsideClick, true);
    return () => document.removeEventListener('pointerdown', onOutsideClick, true);
  });

  const sorted = $derived(sortMetas(sessionState.metas, ui.sortKey, ui.sortDir));

  const SORT_LABELS: Record<SortKey, string> = {
    name:         'Session Name',
    createdAt:    'Time Created',
    lastModified: 'Last Modified',
  };

  function formatDate(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  async function handleLoad(id: string) {
    await loadSession(id);
    // On mobile, collapse the sidebar after loading
    if (window.innerWidth <= 768) toggleHistory();
  }

  let confirmDelete = $state<string | null>(null);

  async function handleDelete(e: MouseEvent, id: string) {
    e.stopPropagation();
    if (confirmDelete === id) {
      await deleteSession(id);
      confirmDelete = null;
    } else {
      confirmDelete = id;
      setTimeout(() => { if (confirmDelete === id) confirmDelete = null; }, 3000);
    }
  }
</script>

<aside class="sidebar">
  <!-- ─── Header ─────────────────────────────────────────────────────────── -->
  <div class="sidebar-header">
    <div class="sidebar-title">
      <Icon name="history" size={16} />
      <h3>History</h3>
    </div>

    <div class="header-actions">
      <!-- Sort button + dropdown -->
      <div class="sort-wrapper" bind:this={dropdownEl}>
        <button
          class="btn-icon"
          class:active={dropdownOpen}
          onclick={() => (dropdownOpen = !dropdownOpen)}
          title="Sort by"
          aria-label="Sort by"
          aria-expanded={dropdownOpen}
        >
          <Icon name="arrows-up-down" size={16} />
        </button>

        {#if dropdownOpen}
          <div class="dropdown" role="menu">
            <!-- Section 1: direction toggle -->
            <div class="dropdown-section">
              <button
                class="dropdown-item dir-toggle"
                onclick={() => {
                  setSortDir(ui.sortDir === 'asc' ? 'desc' : 'asc');
                  dropdownOpen = false;
                }}
              >
                <Icon name={ui.sortDir === 'asc' ? 'arrow-down' : 'arrow-up'} size={14} />
                {ui.sortDir === 'asc' ? 'Descending' : 'Ascending'}
              </button>
            </div>

            <div class="dropdown-divider"></div>

            <!-- Section 2: sort key -->
            <div class="dropdown-section">
              {#each Object.entries(SORT_LABELS) as [key, label]}
                <button
                  class="dropdown-item"
                  class:selected={ui.sortKey === key}
                  onclick={() => {
                    setSortKey(key as SortKey);
                    dropdownOpen = false;
                  }}
                >
                  {#if ui.sortKey === key}
                    <Icon name="check-circle" size={13} />
                  {:else}
                    <span class="dot-spacer"></span>
                  {/if}
                  {label}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- New session -->
      <button
        class="btn-icon"
        onclick={() => { clearCurrentSession(); if (window.innerWidth <= 768) toggleHistory(); }}
        title="New session"
        aria-label="New session"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  </div>

  <!-- ─── Session list ───────────────────────────────────────────────────── -->
  <div class="session-list">
    {#if sorted.length === 0}
      <p class="empty-state">No sessions yet.<br />Upload a CSV to get started.</p>
    {:else}
      {#each sorted as meta (meta.id)}
        {@const isActive = sessionState.currentData?.id === meta.id}
        <div
          class="session-item"
          class:active={isActive}
          role="button"
          tabindex="0"
          onclick={() => handleLoad(meta.id)}
          onkeydown={(e) => e.key === 'Enter' && handleLoad(meta.id)}
        >
          <div class="session-info">
            <span class="session-name truncate">{meta.name}</span>
            <span class="session-date">{formatDate(meta.lastModified)}</span>
          </div>
          <button
            class="btn-icon delete-btn"
            class:confirming={confirmDelete === meta.id}
            onclick={(e) => handleDelete(e, meta.id)}
            title={confirmDelete === meta.id ? 'Click again to confirm delete' : 'Delete session'}
            aria-label="Delete session"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      {/each}
    {/if}
  </div>

  <!-- ─── Warning callout ────────────────────────────────────────────────── -->
  <div class="storage-warning">
    <Icon name="alert-triangle" size={14} />
    <p>
      All session data is stored in <strong>this browser only</strong>.
      Clearing browser data or switching browsers will remove your history.
    </p>
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border);
    overflow: hidden;
    transition: background 0.2s ease;
    min-width: 0;
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

  .sidebar-title {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--text-muted);
  }

  .sidebar-title h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.06em;
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    position: relative;
  }

  /* ─── Sort dropdown ─────────────────────────────────────────────────────── */
  .sort-wrapper {
    position: relative;
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 200;
    min-width: 160px;
    overflow: hidden;
    animation: dropIn 0.15s var(--ease-sidebar) both;
  }

  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dropdown-section { padding: 4px; }

  .dropdown-divider {
    height: 1px;
    background: var(--border);
    margin: 0;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    transition: background 0.1s;
    text-align: left;
  }
  .dropdown-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
  .dropdown-item.selected { color: var(--accent); font-weight: 600; }
  .dropdown-item.dir-toggle { color: var(--text-primary); font-weight: 500; }

  .dot-spacer { width: 13px; flex-shrink: 0; }

  /* ─── Session list ─────────────────────────────────────────────────────── */
  .session-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
  }

  .empty-state {
    padding: 24px 12px;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .session-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.12s ease;
    outline: none;
  }
  .session-item:hover    { background: var(--bg-hover); }
  .session-item:focus-visible { box-shadow: 0 0 0 2px var(--accent); }
  .session-item.active {
    background: var(--accent-dim);
    border-left: 3px solid var(--accent);
    padding-left: 7px;
  }

  .session-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .session-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .session-date {
    font-size: 11px;
    color: var(--text-muted);
  }

  .delete-btn {
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
    color: var(--text-muted);
  }
  .session-item:hover .delete-btn { opacity: 1; }
  .delete-btn.confirming {
    opacity: 1;
    color: var(--color-error) !important;
    background: var(--bg-error);
  }
  .delete-btn:hover { color: var(--color-error) !important; }

  /* ─── Storage warning ──────────────────────────────────────────────────── */
  .storage-warning {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    margin: 6px;
    border-radius: var(--radius-md);
    background: var(--bg-warning);
    color: var(--text-warning);
    font-size: 11.5px;
    line-height: 1.5;
    border: 1px solid var(--color-warning);
    flex-shrink: 0;
  }

  .storage-warning p { flex: 1; }
</style>
