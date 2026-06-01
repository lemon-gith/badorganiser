<script lang="ts">
  import Icon from './Icon.svelte';
  import { bannerState, dismissBanner } from '../stores/banners.svelte.ts';

  const iconMap = {
    success: 'check-circle',
    error:   'alert-circle',
    warning: 'alert-triangle',
    info:    'info',
  } as const;
</script>

<div class="banner-stack" aria-live="polite" aria-atomic="false">
  {#each bannerState.items as banner (banner.id)}
    <div class="banner banner--{banner.type}" role="alert">
      <Icon name={iconMap[banner.type]} size={16} />
      <span class="banner-msg">{banner.message}</span>
      <button
        class="btn-icon banner-close"
        onclick={() => dismissBanner(banner.id)}
        aria-label="Dismiss notification"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  {/each}
</div>

<style>
  .banner-stack {
    position: fixed;
    top: calc(var(--topbar-h) + 12px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 500;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(480px, calc(100vw - 32px));
    pointer-events: none;
  }

  .banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    box-shadow: var(--shadow-md);
    font-size: 13px;
    font-weight: 500;
    pointer-events: all;
    animation: slideDown 0.25s var(--ease-sidebar) both;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .banner--success {
    background: var(--bg-success);
    color: var(--text-success);
    border-color: var(--color-success);
  }
  .banner--error {
    background: var(--bg-error);
    color: var(--text-error);
    border-color: var(--color-error);
  }
  .banner--warning {
    background: var(--bg-warning);
    color: var(--text-warning);
    border-color: var(--color-warning);
  }
  .banner--info {
    background: var(--bg-info);
    color: var(--text-info);
    border-color: var(--color-info);
  }

  .banner-msg {
    flex: 1;
    line-height: 1.4;
  }

  .banner-close {
    color: inherit;
    opacity: 0.6;
    flex-shrink: 0;
  }
  .banner-close:hover { opacity: 1; }
</style>
