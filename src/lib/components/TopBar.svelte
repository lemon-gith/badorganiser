<script lang="ts">
  import Icon from "./Icon.svelte";
  import { ui, toggleDark, toggleHistory } from "../stores/settings.svelte.ts";
</script>

<header class="topbar">
  <button
    class="btn-icon topbar-btn"
    onclick={toggleHistory}
    title="Toggle history panel"
    aria-label="Toggle history panel"
  >
    <Icon name="menu" size={20} />
  </button>

  <div class="topbar-title">
    <span class="title-main">Team Organiser</span>
    <span class="title-sub">Badminton Pairing Generator</span>
  </div>

  <div class="topbar-right">
    <button
      class="btn-icon topbar-btn"
      onclick={toggleDark}
      title={ui.darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={ui.darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {#if ui.darkMode}
        <Icon name="sun" size={18} />
      {:else}
        <Icon name="moon" size={18} />
      {/if}
    </button>

    <a
      class="btn-icon topbar-btn"
      href="https://github.com/lemon-gith/redblue-pairs"
      target="_blank"
      rel="noopener noreferrer"
      title="View source on GitHub"
      aria-label="View source on GitHub"
    >
      <Icon name="github" size={18} />
    </a>
  </div>
</header>

<style>
  .topbar {
    height: var(--topbar-h);
    background: var(--bg-topbar);
    color: var(--text-topbar);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    flex-shrink: 0;
    box-shadow: var(--shadow-md);
    z-index: 100;
    position: relative;
    transition: background 0.2s ease;
  }

  .topbar-title {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 10px;
    overflow: hidden;
  }

  .title-main {
    font-family: "Bebas Neue", sans-serif;
    font-size: 1.5rem;
    letter-spacing: 0.08em;
    white-space: nowrap;
    color: var(--text-topbar);
  }

  .title-sub {
    font-size: 11px;
    font-weight: 400;
    opacity: 0.55;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .topbar-btn {
    color: var(--text-topbar);
    opacity: 0.8;
    border-radius: var(--radius-sm);
    padding: 6px;
  }
  .topbar-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.12);
  }

  :global(.dark) .topbar-btn:hover {
    background: rgba(212, 168, 71, 0.15);
  }
</style>
