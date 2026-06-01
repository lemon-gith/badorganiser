<script lang="ts">
  import { onMount } from "svelte";
  import TopBar from "./lib/components/TopBar.svelte";
  import HistorySidebar from "./lib/components/HistorySidebar.svelte";
  import PlayersSidebar from "./lib/components/PlayersSidebar.svelte";
  import StartPage from "./lib/components/StartPage.svelte";
  import SessionPage from "./lib/components/SessionPage.svelte";
  import Banner from "./lib/components/Banner.svelte";

  import { ui } from "./lib/stores/settings.svelte.ts";
  import { sessionState, loadMetas } from "./lib/stores/sessions.svelte.ts";

  // ─── Apply dark mode class to <html> ─────────────────────────────────────
  $effect(() => {
    document.documentElement.classList.toggle("dark", ui.darkMode);
  });

  // ─── Load session history from IndexedDB on first mount ──────────────────
  onMount(async () => {
    await loadMetas();
  });

  // ─── Derived layout flags ─────────────────────────────────────────────────
  const showPlayersPanel = $derived(
    sessionState.showPlayers && sessionState.currentData !== null,
  );

  // ─── Mobile backdrop — close sidebar on outside click ────────────────────
  function onHistoryBackdropClick() {
    ui.showHistory = false;
  }
  function onPlayersBackdropClick() {
    sessionState.showPlayers = false;
  }
</script>

<div class="app-root">
  <TopBar />

  <div class="layout">
    <!-- ─── History Sidebar (desktop: sibling | mobile: fixed overlay) ──── -->
    <div
      class="sidebar-slot sidebar-left"
      class:sidebar-visible={ui.showHistory}
      aria-hidden={!ui.showHistory}
    >
      <HistorySidebar />
    </div>

    <!-- ─── Mobile backdrop for history ─────────────────────────────────── -->
    {#if ui.showHistory}
      <div
        class="mobile-backdrop"
        role="button"
        tabindex="-1"
        aria-label="Close history panel"
        onclick={onHistoryBackdropClick}
        onkeydown={(e) => e.key === "Escape" && onHistoryBackdropClick()}
      ></div>
    {/if}

    <!-- ─── Main content ─────────────────────────────────────────────────── -->
    <main class="main-content">
      {#if sessionState.currentData !== null}
        <SessionPage />
      {:else}
        <StartPage />
      {/if}
    </main>

    <!-- ─── Players Sidebar (session page only) ──────────────────────────── -->
    {#if sessionState.currentData !== null}
      <div
        class="sidebar-slot sidebar-right"
        class:sidebar-visible={showPlayersPanel}
        aria-hidden={!showPlayersPanel}
      >
        <PlayersSidebar />
      </div>

      <!-- Mobile backdrop for players -->
      {#if showPlayersPanel}
        <div
          class="mobile-backdrop mobile-backdrop-right"
          role="button"
          tabindex="-1"
          aria-label="Close players panel"
          onclick={onPlayersBackdropClick}
          onkeydown={(e) => e.key === "Escape" && onPlayersBackdropClick()}
        ></div>
      {/if}
    {/if}
  </div>

  <!-- ─── Banners (always on top) ─────────────────────────────────────── -->
  <Banner />
</div>

<style>
  .app-root {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-app);
    transition: background 0.2s ease;
  }

  /* ─── Layout row ─────────────────────────────────────────────────────────── */
  .layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  /* ─── Main content ───────────────────────────────────────────────────────── */
  .main-content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    transition: none;
  }

  /* ─── Sidebar slots (desktop: in-flow siblings) ──────────────────────────── */
  .sidebar-slot {
    flex-shrink: 0;
    width: var(--sidebar-w);
    max-width: 300px;
    min-width: 0; /* collapsed state: 0 width via overflow:hidden */
    overflow: hidden;
    transition:
      width 0.28s var(--ease-sidebar),
      max-width 0.28s var(--ease-sidebar),
      opacity 0.2s ease;
    opacity: 0;
    /* Collapsed by default */
    width: 0;
  }

  .sidebar-slot.sidebar-visible {
    width: var(--sidebar-w);
    max-width: 300px;
    opacity: 1;
  }

  .mobile-backdrop {
    display: none;
  }

  /* ─── Mobile — sidebars become fixed overlays ────────────────────────────── */
  @media (max-width: 768px) {
    .sidebar-slot {
      position: fixed;
      top: var(--topbar-h);
      bottom: 0;
      width: 82% !important;
      max-width: 320px !important;
      z-index: 300;
      /* Override in-flow size animation with transform */
      opacity: 1;
      overflow: hidden;
      transition: transform 0.28s var(--ease-sidebar);
    }

    .sidebar-left {
      left: 0;
      transform: translateX(-100%);
    }
    .sidebar-left.sidebar-visible {
      transform: translateX(0);
    }

    .sidebar-right {
      right: 0;
      transform: translateX(100%);
    }
    .sidebar-right.sidebar-visible {
      transform: translateX(0);
    }

    /* Dim backdrop */
    .mobile-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      top: var(--topbar-h);
      background: rgba(0, 0, 0, 0.45);
      z-index: 299;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  }
</style>
