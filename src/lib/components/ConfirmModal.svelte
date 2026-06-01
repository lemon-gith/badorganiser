<script lang="ts">
  import Icon from "./Icon.svelte";

  let {
    message,
    confirmLabel = "Yes",
    cancelLabel = "No",
    onConfirm,
    onCancel,
  }: {
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();

  // ─── Keyboard handling ────────────────────────────────────────────────────
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
    }
  }

  // ─── Focus trap — auto-focus the No button so Enter-to-confirm is opt-in ─
  let cancelBtn = $state<HTMLButtonElement | undefined>();
  $effect(() => {
    cancelBtn?.focus();
  });
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Backdrop -->
<div
  class="backdrop"
  role="presentation"
  onclick={onCancel}
  aria-hidden="true"
></div>

<!-- Dialog -->
<div
  class="modal"
  role="alertdialog"
  aria-modal="true"
  aria-labelledby="modal-msg"
>
  <div class="modal-icon">
    <Icon name="alert-triangle" size={28} />
  </div>

  <p class="modal-message" id="modal-msg">{message}</p>

  <div class="modal-actions">
    <button
      bind:this={cancelBtn}
      class="btn btn-ghost modal-btn"
      onclick={onCancel}
    >
      <Icon name="x" size={15} />
      {cancelLabel}
    </button>

    <button class="btn btn-danger modal-btn" onclick={onConfirm}>
      <Icon name="check-circle" size={15} />
      {confirmLabel}
    </button>
  </div>
</div>

<style>
  /* ─── Backdrop ─────────────────────────────────────────────────────────── */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 800;
    animation: fadeIn 0.15s ease both;
    cursor: pointer;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  /* ─── Dialog card ──────────────────────────────────────────────────────── */
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 801;

    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;

    padding: 28px 32px 24px;
    width: min(420px, calc(100vw - 48px));

    animation: popIn 0.18s var(--ease-sidebar) both;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* ─── Icon ─────────────────────────────────────────────────────────────── */
  .modal-icon {
    color: var(--color-warning);
    background: var(--bg-warning);
    border-radius: 50%;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* ─── Message ──────────────────────────────────────────────────────────── */
  .modal-message {
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
    text-align: center;
    line-height: 1.5;
    max-width: 320px;
  }

  /* ─── Buttons ──────────────────────────────────────────────────────────── */
  .modal-actions {
    display: flex;
    gap: 10px;
    width: 100%;
    justify-content: center;
    margin-top: 4px;
  }

  .modal-btn {
    flex: 1;
    max-width: 150px;
    justify-content: center;
    padding: 9px 16px;
    font-size: 14px;
    font-weight: 600;
  }
</style>
