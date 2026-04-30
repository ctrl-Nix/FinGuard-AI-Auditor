/**
 * FinGuard Extension — Popup Script
 * ====================================
 * Controls the toolbar popup UI.
 * Communicates with: background.js (via runtime.sendMessage)
 *                    content.js (via tabs.sendMessage)
 */

'use strict';

// ── State ────────────────────────────────────────────────────────────────────

const STATE = {
  scanning: false,
  settings: null,
  currentTab: null,
  apiOnline: false,
};

const VERDICT_CONFIG = {
  scam: {
    icon: '🚨',
    label: 'High Risk Detected',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.28)',
  },
  suspicious: {
    icon: '⚠️',
    label: 'Suspicious Content',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.28)',
  },
  safe: {
    icon: '✅',
    label: 'No Risks Found',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.28)',
  },
  unknown: {
    icon: '❓',
    label: 'Inconclusive',
    color: '#9ba3b5',
    bg: 'rgba(155,163,181,0.10)',
    border: 'rgba(155,163,181,0.28)',
  },
  clean: {
    icon: '✅',
    label: 'No Risks Found',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.28)',
  },
};

// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    STATE.currentTab = tab;

    // Load settings
    STATE.settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });

    // Render page host
    if (tab?.url) {
      try {
        const host = new URL(tab.url).hostname;
        document.getElementById('page-host').textContent = host;
      } catch { /* opaque url */ }
    }

    // Detect page type
    await detectPageType(tab?.url);

    // Check API health
    await checkApiHealth();

    // Update scan count
    updateScanCount();

    // Settings panel
    if (STATE.settings) {
      document.getElementById('api-url-input').value = STATE.settings.apiUrl || 'http://localhost:8000';
      document.getElementById('auto-scan-toggle').checked = STATE.settings.autoScan !== false;
    }

    // Wire events
    wireEvents();

  } catch (err) {
    console.error('[FinGuard Popup]', err);
    showState('error');
    document.getElementById('error-msg').textContent = 'Extension error: ' + err.message;
  }
});

// ── Event wiring ──────────────────────────────────────────────────────────────

function wireEvents() {
  document.getElementById('scan-btn')?.addEventListener('click', triggerScan);
  document.getElementById('rescan-btn')?.addEventListener('click', triggerScan);
  document.getElementById('retry-btn')?.addEventListener('click', triggerScan);

  document.getElementById('clear-btn')?.addEventListener('click', async () => {
    await sendToContent({ type: 'CLEAR_HIGHLIGHTS' });
    showState('idle');
  });

  document.getElementById('settings-toggle-btn')?.addEventListener('click', () => {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', async () => {
    const newUrl = document.getElementById('api-url-input').value.trim();
    const autoScan = document.getElementById('auto-scan-toggle').checked;

    await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings: { apiUrl: newUrl, autoScan },
    });

    STATE.settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    document.getElementById('settings-panel').style.display = 'none';

    // Re-check health with new URL
    await checkApiHealth();
  });
}

// ── Page type detection ───────────────────────────────────────────────────────

async function detectPageType(url) {
  if (!url) return;

  const response = await chrome.runtime.sendMessage({ type: 'CLASSIFY_URL', url });
  const types = response?.pageTypes || [];

  const banner = document.getElementById('page-banner');
  const typesList = document.getElementById('page-types-list');
  const bannerText = document.getElementById('banner-text');

  if (types.length > 0) {
    banner.style.display = 'flex';
    bannerText.textContent = types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ') + ' page detected';
    typesList.innerHTML = types.map(t =>
      `<span class="chip chip-warn">${t}</span>`
    ).join('');
  } else {
    banner.style.display = 'none';
    typesList.innerHTML = '';
  }
}

// ── Scanning ──────────────────────────────────────────────────────────────────

async function triggerScan() {
  if (STATE.scanning) return;
  STATE.scanning = true;
  showState('scanning');

  try {
    // Trigger scan in the content script
    const response = await sendToContent({ type: 'TRIGGER_SCAN' });

    if (response?.error) {
      throw new Error(response.error);
    }

    // The content script runs the scan asynchronously and updates its own widget.
    // For the popup, we poll briefly then show a "check the page" message.
    setTimeout(() => {
      // If still in scanning state, content script will update via widget.
      // Popup closes soon anyway in normal use.
      STATE.scanning = false;
    }, 500);

  } catch (err) {
    STATE.scanning = false;
    showState('error');
    document.getElementById('error-msg').textContent = err.message || 'Could not scan this page.';
  }
}

// ── API health check ──────────────────────────────────────────────────────────

async function checkApiHealth() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_HEALTH' });
    const online = response?.online;
    STATE.apiOnline = online;

    const dot = document.getElementById('api-dot');
    const label = document.getElementById('api-label');

    if (online) {
      dot.style.background = '#22c55e';
      label.textContent = 'API online';
      label.style.color = '#22c55e';
    } else {
      dot.style.background = '#ef4444';
      label.textContent = 'API offline';
      label.style.color = '#ef4444';
    }
  } catch {
    const dot = document.getElementById('api-dot');
    const label = document.getElementById('api-label');
    dot.style.background = '#4a5060';
    label.textContent = 'Unknown';
  }
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showState(name) {
  ['idle', 'scanning', 'result', 'error'].forEach(n => {
    const el = document.getElementById(`state-${n}`);
    if (el) el.style.display = n === name ? (n === 'scanning' || n === 'error' ? 'flex' : 'block') : 'none';
  });
}

function renderResult({ verdict, summary, highlightCount, pageTypes }) {
  showState('result');

  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.unknown;

  // Verdict pill
  document.getElementById('verdict-pill').innerHTML = `
    <div class="vp-inner" style="border-color:${cfg.border};background:${cfg.bg};color:${cfg.color}">
      <span class="vp-icon">${cfg.icon}</span>
      <span class="vp-label">${cfg.label}</span>
    </div>
  `;

  // Stats grid
  const stats = summary || {};
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <span class="stat-val" style="color:#ef4444">${stats.scam || 0}</span>
      <span class="stat-key">High Risk</span>
    </div>
    <div class="stat-card">
      <span class="stat-val" style="color:#f59e0b">${stats.suspicious || 0}</span>
      <span class="stat-key">Suspicious</span>
    </div>
    <div class="stat-card">
      <span class="stat-val" style="color:#22c55e">${stats.safe || 0}</span>
      <span class="stat-key">Clean</span>
    </div>
  `;

  // Highlight note
  const note = document.getElementById('highlight-note');
  note.textContent = highlightCount > 0
    ? `${highlightCount} clause${highlightCount !== 1 ? 's' : ''} highlighted on page — hover to see details`
    : 'No clauses flagged on this page.';
}

function updateScanCount() {
  const count = STATE.settings?.scanCount || 0;
  const el = document.getElementById('scan-count-label');
  if (el && count > 0) {
    el.textContent = `${count} scan${count !== 1 ? 's' : ''} total`;
  }
}

// ── Content script messaging ──────────────────────────────────────────────────

async function sendToContent(message) {
  const tab = STATE.currentTab;
  if (!tab?.id) throw new Error('No active tab');

  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    // Content script not yet injected on this page (e.g. chrome:// pages)
    throw new Error('Cannot run on this page. Try a regular webpage.');
  }
}
