<script lang="ts">
  import Icon from "./Icon.svelte";
  import { parseCSV } from "../utils/csvParser";
  import { createSession } from "../stores/sessions.svelte.ts";
  import { showBanner } from "../stores/banners.svelte.ts";

  // ─── Greeting ─────────────────────────────────────────────────────────────
  function greeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good Morning";
    if (h >= 12 && h < 17) return "Good Afternoon";
    if (h >= 17 && h < 21) return "Good Evening";
    return "Good Night";
  }

  // ─── Upload state ─────────────────────────────────────────────────────────
  type UploadState = "idle" | "processing" | "done" | "error";
  let uploadState = $state<UploadState>("idle");
  let fileInput = $state<HTMLInputElement | undefined>();

  function triggerUpload() {
    fileInput?.click();
  }

  async function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!fileInput) return;
    fileInput.value = ""; // allow re-uploading same file

    if (!file) return;

    // Basic format check
    if (
      !file.name.endsWith(".csv") &&
      file.type !== "text/csv" &&
      file.type !== "text/plain"
    ) {
      showBanner(
        "error",
        "Please upload a CSV file (.csv extension required).",
      );
      return;
    }

    uploadState = "processing";

    try {
      const text = await file.text();

      // Consistency check (non-empty, consistent columns)
      const { players, errors } = parseCSV(text);

      if (errors.length > 0 && players.length === 0) {
        // Fatal parse error
        uploadState = "error";
        showBanner("error", errors[0], 0);
        setTimeout(() => {
          uploadState = "idle";
        }, 1500);
        return;
      }

      if (errors.length > 0) {
        // Partial parse — warn but continue
        errors.forEach((msg) => showBanner("warning", msg, 6000));
      }

      if (players.length === 0) {
        uploadState = "error";
        showBanner("error", "No valid player rows found in the uploaded file.");
        setTimeout(() => {
          uploadState = "idle";
        }, 1500);
        return;
      }

      showBanner(
        "success",
        `CSV uploaded — ${players.length} player(s) loaded successfully.`,
      );
      await createSession(players);
      uploadState = "done";
    } catch (err) {
      uploadState = "error";
      showBanner("error", `Failed to read file: ${(err as Error).message}`);
      setTimeout(() => {
        uploadState = "idle";
      }, 1500);
    }
  }
</script>

<section class="start-page">
  <div class="start-card">
    <!-- Greeting -->
    <div class="greeting-block">
      <p class="greeting-text">{greeting()},</p>
      <h1 class="greeting-prompt">Please upload a CSV<br />to get started.</h1>
    </div>

    <!-- Upload button -->
    <div class="upload-area">
      <input
        bind:this={fileInput}
        type="file"
        accept=".csv,text/csv,text/plain"
        onchange={handleFile}
        class="sr-only"
        aria-label="Upload CSV file"
      />

      <button
        class="btn btn-primary upload-btn"
        onclick={triggerUpload}
        disabled={uploadState === "processing" || uploadState === "done"}
      >
        {#if uploadState === "processing"}
          <Icon name="loader" size={16} class="spin" />
          Processing…
        {:else if uploadState === "done"}
          <Icon name="check-circle" size={16} />
          Loaded
        {:else}
          <Icon name="upload" size={16} />
          Upload CSV
        {/if}
      </button>

      <a
        class="btn btn-ghost download-link"
        href="./example.csv"
        download="example.csv"
      >
        <Icon name="download" size={15} />
        Download example CSV
      </a>
    </div>

    <!-- Format reference -->
    <div class="format-ref">
      <h4 class="format-title">
        <Icon name="file-text" size={14} />
        Expected CSV format
      </h4>
      <p class="format-note">
        The file must have five columns in the order below. A header row is
        optional — if present, column names are matched fuzzily so minor
        variations are fine. Extra columns are ignored.
      </p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>name</th>
              <th>gender</th>
              <th>level</th>
              <th>level_matches</th>
              <th>mixed_matches</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice Chen</td>
              <td>F</td>
              <td>3</td>
              <td>true</td>
              <td>true</td>
            </tr>
            <tr>
              <td>Bob Smith</td>
              <td>M</td>
              <td>2</td>
              <td>true</td>
              <td>false</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="format-notes-list">
        <li>
          <strong>gender</strong> — M / F, Male / Female (case-insensitive)
        </li>
        <li><strong>level</strong> — any integer (e.g. 1, 2, 3…)</li>
        <li>
          <strong>level_matches / mixed_matches</strong> — true / false, yes / no,
          1 / 0
        </li>
      </ul>
    </div>
  </div>
</section>

<style>
  .start-page {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    overflow-y: auto;
  }

  .start-card {
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* ─── Greeting ──────────────────────────────────────────────────────────── */
  .greeting-block {
    line-height: 1.2;
  }

  .greeting-text {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 4px;
  }

  .greeting-prompt {
    font-family: "Bebas Neue", sans-serif;
    font-size: clamp(2rem, 5vw, 3rem);
    letter-spacing: 0.04em;
    color: var(--text-heading);
    line-height: 1.05;
  }

  /* ─── Upload area ────────────────────────────────────────────────────────── */
  .upload-area {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .upload-btn {
    font-size: 15px;
    padding: 10px 22px;
    border-radius: var(--radius-lg);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .download-link {
    font-size: 13px;
    padding: 8px 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    transition:
      background 0.15s,
      border-color 0.15s;
    text-decoration: none;
  }
  .download-link:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    text-decoration: none;
  }

  /* ─── Format reference ───────────────────────────────────────────────────── */
  .format-ref {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: var(--shadow-sm);
  }

  .format-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: "Bebas Neue", sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    color: var(--text-primary);
  }

  .format-note {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .table-wrapper {
    overflow-x: auto;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
    white-space: nowrap;
  }

  th {
    background: var(--bg-sidebar);
    color: var(--text-muted);
    font-weight: 600;
    padding: 7px 12px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 7px 12px;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border);
  }
  tr:last-child td {
    border-bottom: none;
  }
  tbody tr:nth-child(even) {
    background: var(--bg-app);
  }

  .format-notes-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12.5px;
    color: var(--text-muted);
    padding-left: 4px;
  }

  .format-notes-list li::before {
    content: "·  ";
    color: var(--accent);
    font-weight: 700;
  }
</style>
