/**
 * FinGuard Extension — Content Script
 * =====================================
 * Injected into every page. Responsible for:
 *  - Extracting text from the DOM in meaningful chunks (paragraph-level)
 *  - Sending chunks to background for analysis
 *  - Highlighting risky nodes directly in the DOM
 *  - Rendering tooltips on hover
 *  - Mounting the floating scan widget
 *
 * No external dependencies — pure vanilla JS.
 */

(function () {
  'use strict';

  // Guard against double-injection
  if (window.__finguardInjected) return;
  window.__finguardInjected = true;

  // ── State ────────────────────────────────────────────────────────────────────

  const STATE = {
    scanning: false,
    scanned: false,
    results: [],
    highlights: [],
    pageTypes: [],
    summary: null,
    widgetOpen: false,
  };

  // ── Text extraction ───────────────────────────────────────────────────────────

  /**
   * Walk the DOM and extract visible text paragraphs.
   * Returns [{node, text, rect}] where text is ≥ 40 chars.
   */
  function extractTextNodes() {
    const TARGET_TAGS = new Set([
      'P', 'LI', 'DIV', 'SPAN', 'SECTION', 'ARTICLE',
      'TD', 'TH', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'LABEL', 'A', 'STRONG', 'EM',
    ]);
    const SKIP_TAGS = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS',
      'IFRAME', 'TEMPLATE', 'HEAD', 'META', 'LINK',
    ]);

    const segments = [];
    const seen = new Set();

    function walk(node) {
      if (!node || SKIP_TAGS.has(node.tagName)) return;

      // Skip hidden elements
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;

      if (TARGET_TAGS.has(node.tagName)) {
        const text = node.innerText?.trim() || '';
        if (text.length >= 40 && !seen.has(text)) {
          seen.add(text);
          const rect = node.getBoundingClientRect();
          if (rect.width > 0 || rect.height > 0) {
            segments.push({ node, text, rect });
          }
        }
      }

      for (const child of node.children) {
        walk(child);
      }
    }

    walk(document.body);
    return segments;
  }

  /**
   * Split long segments into API-safe chunks (≤ 4800 chars each).
   */
  function chunkSegments(segments) {
    const MAX = 4800;
    const chunks = [];
    const chunkNodeMap = []; // chunk index → [segment indices]

    let current = '';
    let currentIndices = [];

    segments.forEach((seg, i) => {
      const line = seg.text.slice(0, 500); // cap each line
      if ((current + '\n' + line).length > MAX) {
        if (current) {
          chunks.push(current.trim());
          chunkNodeMap.push([...currentIndices]);
        }
        current = line;
        currentIndices = [i];
      } else {
        current += (current ? '\n' : '') + line;
        currentIndices.push(i);
      }
    });

    if (current) {
      chunks.push(current.trim());
      chunkNodeMap.push([...currentIndices]);
    }

    return { chunks, chunkNodeMap };
  }

  // ── Highlighting ──────────────────────────────────────────────────────────────

  const SEVERITY_CONFIG = {
    SCAM: {
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.7)',
      dot: '#ef4444',
      label: 'HIGH RISK',
      badgeClass: 'fg-badge-red',
    },
    SUSPICIOUS: {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.7)',
      dot: '#f59e0b',
      label: 'SUSPICIOUS',
      badgeClass: 'fg-badge-amber',
    },
    SAFE: null, // no highlight
  };

  function highlightNode(node, result, reasons) {
    if (!node || !node.parentNode) return null;

    const verdict = result.verdict?.toUpperCase() || 'SUSPICIOUS';
    const config = SEVERITY_CONFIG[verdict];
    if (!config) return null;

    // Wrap node in a highlight container
    const wrapper = document.createElement('span');
    wrapper.className = `fg-highlight fg-highlight-${verdict.toLowerCase()}`;
    wrapper.style.cssText = `
      background: ${config.bg};
      border-bottom: 2px solid ${config.border};
      border-radius: 3px;
      position: relative;
      display: inline;
      cursor: help;
    `;

    // Badge
    const badge = document.createElement('span');
    badge.className = `fg-badge ${config.badgeClass}`;
    badge.textContent = config.label;
    badge.style.cssText = `
      font-size: 9px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace, sans-serif;
      letter-spacing: 0.5px;
      padding: 1px 5px;
      border-radius: 3px;
      margin-left: 4px;
      vertical-align: middle;
      white-space: nowrap;
      cursor: help;
    `;

    // Tooltip data
    wrapper.dataset.fgVerdict = verdict;
    wrapper.dataset.fgReasons = JSON.stringify(reasons || result.reasons || []);
    wrapper.dataset.fgConfidence = result.confidence || 0;

    // Inject into DOM
    try {
      node.parentNode.insertBefore(wrapper, node);
      wrapper.appendChild(node);
      wrapper.appendChild(badge);
    } catch {
      return null;
    }

    // Hover events
    wrapper.addEventListener('mouseenter', showTooltip);
    wrapper.addEventListener('mouseleave', hideTooltip);
    badge.addEventListener('mouseenter', showTooltip);
    badge.addEventListener('mouseleave', hideTooltip);

    STATE.highlights.push(wrapper);
    return wrapper;
  }

  // ── Tooltip ───────────────────────────────────────────────────────────────────

  let tooltipEl = null;
  let tooltipTimeout = null;

  function getOrCreateTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'fg-tooltip';
      tooltipEl.className = 'fg-tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(e) {
    clearTimeout(tooltipTimeout);
    const target = e.currentTarget.closest('[data-fg-verdict]') || e.currentTarget;
    const verdict = target.dataset.fgVerdict;
    const reasons = JSON.parse(target.dataset.fgReasons || '[]');
    const confidence = target.dataset.fgConfidence;

    const config = SEVERITY_CONFIG[verdict] || SEVERITY_CONFIG.SUSPICIOUS;
    const tip = getOrCreateTooltip();

    tip.innerHTML = `
      <div class="fg-tip-header">
        <span class="fg-tip-dot" style="background:${config.dot}"></span>
        <strong>${config.label}</strong>
        <span class="fg-tip-conf">${confidence}% risk</span>
      </div>
      <div class="fg-tip-divider"></div>
      ${reasons.length > 0
        ? `<ul class="fg-tip-reasons">${reasons.slice(0, 4).map(r =>
            `<li>${escHtml(r)}</li>`).join('')}</ul>`
        : '<p class="fg-tip-empty">Flagged by FinGuard risk engine</p>'
      }
      <div class="fg-tip-footer">Powered by FinGuard AI</div>
    `;

    tip.style.display = 'block';
    tip.style.opacity = '0';

    // Position below mouse
    const x = e.clientX + window.scrollX;
    const y = e.clientY + window.scrollY + 18;
    tip.style.left = Math.min(x, window.innerWidth - 280 + window.scrollX) + 'px';
    tip.style.top = y + 'px';

    requestAnimationFrame(() => {
      tip.style.opacity = '1';
    });
  }

  function hideTooltip() {
    tooltipTimeout = setTimeout(() => {
      if (tooltipEl) {
        tooltipEl.style.opacity = '0';
        setTimeout(() => {
          if (tooltipEl) tooltipEl.style.display = 'none';
        }, 150);
      }
    }, 100);
  }

  // ── Clear highlights ───────────────────────────────────────────────────────────

  function clearHighlights() {
    STATE.highlights.forEach(wrapper => {
      if (!wrapper.parentNode) return;
      // Unwrap: move children back to parent
      const parent = wrapper.parentNode;
      const badge = wrapper.querySelector('.fg-badge');
      if (badge) badge.remove();
      while (wrapper.firstChild) {
        parent.insertBefore(wrapper.firstChild, wrapper);
      }
      parent.removeChild(wrapper);
    });
    STATE.highlights = [];
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // ── Scanning orchestration ────────────────────────────────────────────────────

  async function scanPage() {
    if (STATE.scanning) return;
    STATE.scanning = true;

    updateWidget({ scanning: true, message: 'Extracting page text…' });

    try {
      const segments = extractTextNodes();
      if (segments.length === 0) {
        updateWidget({ scanning: false, message: 'No readable text found on this page.', result: null });
        return;
      }

      updateWidget({ scanning: true, message: `Analysing ${segments.length} text blocks…` });

      const { chunks, chunkNodeMap } = chunkSegments(segments);

      const response = await chrome.runtime.sendMessage({
        type: 'SCAN_PAGE',
        chunks,
        url: window.location.href,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      STATE.results = response.results || [];
      STATE.summary = response.summary || {};
      STATE.pageTypes = response.pageTypes || [];
      STATE.scanned = true;

      // Clear old highlights
      clearHighlights();

      // Apply highlights
      let highlightCount = 0;
      response.results.forEach((result, chunkIdx) => {
        const verdict = result.verdict?.toUpperCase();
        if (verdict === 'SAFE' || !verdict) return;

        const nodeIndices = chunkNodeMap[chunkIdx] || [];
        nodeIndices.forEach(ni => {
          const seg = segments[ni];
          if (seg && seg.node) {
            highlightNode(seg.node, result, result.reasons);
            highlightCount++;
          }
        });
      });

      updateWidget({
        scanning: false,
        result: response.verdict,
        summary: response.summary,
        highlightCount,
        pageTypes: response.pageTypes,
      });

    } catch (err) {
      console.error('[FinGuard] Scan error:', err);
      updateWidget({
        scanning: false,
        error: err.message,
        message: `Error: ${err.message}`,
      });
    } finally {
      STATE.scanning = false;
    }
  }

  // ── Floating Widget ────────────────────────────────────────────────────────────

  let widgetEl = null;

  function buildWidget() {
    if (widgetEl) return;

    widgetEl = document.createElement('div');
    widgetEl.id = 'fg-widget';
    widgetEl.innerHTML = `
      <div id="fg-widget-fab" title="FinGuard AI Auditor">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span id="fg-fab-dot"></span>
      </div>

      <div id="fg-widget-panel">
        <div id="fg-panel-header">
          <div id="fg-panel-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>FinGuard</span>
          </div>
          <div id="fg-panel-controls">
            <button id="fg-clear-btn" title="Clear highlights">✕ Clear</button>
            <button id="fg-close-btn" title="Close">╳</button>
          </div>
        </div>

        <div id="fg-panel-body">
          <div id="fg-status-idle">
            <div id="fg-page-type-indicator"></div>
            <p id="fg-idle-msg">Ready to scan this page for risky clauses.</p>
            <button id="fg-scan-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Scan this page
            </button>
          </div>

          <div id="fg-status-scanning" style="display:none">
            <div class="fg-spinner"></div>
            <p id="fg-scanning-msg">Scanning…</p>
          </div>

          <div id="fg-status-result" style="display:none">
            <div id="fg-result-verdict"></div>
            <div id="fg-result-stats"></div>
            <div id="fg-result-page-types"></div>
            <button id="fg-rescan-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              Re-scan
            </button>
          </div>

          <div id="fg-status-error" style="display:none">
            <div class="fg-error-icon">⚠</div>
            <p id="fg-error-msg">Could not reach FinGuard API.</p>
            <p class="fg-error-hint">Is the backend running at <code>localhost:8000</code>?</p>
            <button id="fg-retry-btn">Retry</button>
          </div>
        </div>

        <div id="fg-panel-footer">
          <span id="fg-api-status">
            <span class="fg-status-dot" id="fg-api-dot"></span>
            <span id="fg-api-label">Checking API…</span>
          </span>
          <span id="fg-scan-count"></span>
        </div>
      </div>
    `;

    document.body.appendChild(widgetEl);

    // Events
    document.getElementById('fg-widget-fab').addEventListener('click', togglePanel);
    document.getElementById('fg-close-btn').addEventListener('click', closePanel);
    document.getElementById('fg-clear-btn').addEventListener('click', () => {
      clearHighlights();
      resetToIdle();
    });
    document.getElementById('fg-scan-btn').addEventListener('click', () => scanPage());
    document.getElementById('fg-rescan-btn')?.addEventListener('click', () => scanPage());
    document.getElementById('fg-retry-btn')?.addEventListener('click', () => scanPage());

    // Make widget draggable
    makeDraggable(widgetEl, document.getElementById('fg-panel-header'));

    // Check API status
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
  }

  function togglePanel() {
    const panel = document.getElementById('fg-widget-panel');
    if (!panel) return;
    STATE.widgetOpen = !STATE.widgetOpen;
    panel.style.display = STATE.widgetOpen ? 'flex' : 'none';

    if (STATE.widgetOpen) {
      checkPageType();
    }
  }

  function closePanel() {
    const panel = document.getElementById('fg-widget-panel');
    if (panel) panel.style.display = 'none';
    STATE.widgetOpen = false;
  }

  function resetToIdle() {
    showSection('idle');
    STATE.scanned = false;
    STATE.results = [];
    STATE.summary = null;
  }

  function showSection(name) {
    ['idle', 'scanning', 'result', 'error'].forEach(n => {
      const el = document.getElementById(`fg-status-${n}`);
      if (el) el.style.display = n === name ? (n === 'idle' || n === 'result' ? 'block' : 'flex') : 'none';
    });
  }

  function updateWidget({ scanning, message, result, summary, highlightCount, pageTypes, error }) {
    if (!widgetEl) return;

    if (error) {
      showSection('error');
      const el = document.getElementById('fg-error-msg');
      if (el) el.textContent = error;
      return;
    }

    if (scanning) {
      showSection('scanning');
      const el = document.getElementById('fg-scanning-msg');
      if (el) el.textContent = message || 'Scanning…';
      return;
    }

    if (result !== undefined && result !== null) {
      showSection('result');
      renderResult({ result, summary, highlightCount, pageTypes });
      return;
    }

    showSection('idle');
    if (message) {
      const el = document.getElementById('fg-idle-msg');
      if (el) el.textContent = message;
    }
  }

  const VERDICT_CONFIG = {
    scam: {
      icon: '🚨',
      label: 'High Risk Detected',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.3)',
    },
    suspicious: {
      icon: '⚠️',
      label: 'Suspicious Content',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      border: 'rgba(245,158,11,0.3)',
    },
    safe: {
      icon: '✅',
      label: 'No Risks Found',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.3)',
    },
    unknown: {
      icon: '❓',
      label: 'Inconclusive',
      color: '#9ba3b5',
      bg: 'rgba(155,163,181,0.12)',
      border: 'rgba(155,163,181,0.3)',
    },
  };

  function renderResult({ result, summary, highlightCount, pageTypes }) {
    const cfg = VERDICT_CONFIG[result] || VERDICT_CONFIG.unknown;

    const verdictEl = document.getElementById('fg-result-verdict');
    if (verdictEl) {
      verdictEl.innerHTML = `
        <div class="fg-verdict-pill" style="border-color:${cfg.border};background:${cfg.bg};color:${cfg.color}">
          <span class="fg-v-icon">${cfg.icon}</span>
          <span class="fg-v-label">${cfg.label}</span>
        </div>
      `;
    }

    const statsEl = document.getElementById('fg-result-stats');
    if (statsEl && summary) {
      const total = summary.total || 0;
      const risky = (summary.scam || 0) + (summary.suspicious || 0);
      statsEl.innerHTML = `
        <div class="fg-stats">
          <div class="fg-stat">
            <span class="fg-stat-val" style="color:#ef4444">${summary.scam || 0}</span>
            <span class="fg-stat-key">High Risk</span>
          </div>
          <div class="fg-stat">
            <span class="fg-stat-val" style="color:#f59e0b">${summary.suspicious || 0}</span>
            <span class="fg-stat-key">Suspicious</span>
          </div>
          <div class="fg-stat">
            <span class="fg-stat-val" style="color:#22c55e">${summary.safe || 0}</span>
            <span class="fg-stat-key">Clean</span>
          </div>
        </div>
        ${highlightCount > 0
          ? `<p class="fg-highlight-note">${highlightCount} clause${highlightCount !== 1 ? 's' : ''} highlighted on page • hover to see details</p>`
          : '<p class="fg-highlight-note">No clauses flagged</p>'
        }
      `;
    }

    const ptEl = document.getElementById('fg-result-page-types');
    if (ptEl && pageTypes?.length > 0) {
      ptEl.innerHTML = `
        <div class="fg-page-types">
          ${pageTypes.map(t => `<span class="fg-pt-chip">${t}</span>`).join('')}
        </div>
      `;
    }
  }

  async function checkPageType() {
    const response = await chrome.runtime.sendMessage({
      type: 'CLASSIFY_URL',
      url: window.location.href,
    });
    const types = response?.pageTypes || [];

    const indicator = document.getElementById('fg-page-type-indicator');
    const idleMsg = document.getElementById('fg-idle-msg');

    if (indicator) {
      if (types.length > 0) {
        indicator.innerHTML = `
          <div class="fg-type-badge">
            <span class="fg-type-icon">⚡</span>
            ${types.map(t => `<span class="fg-pt-chip fg-pt-chip-warn">${t}</span>`).join('')} page detected
          </div>
        `;
        if (idleMsg) idleMsg.textContent = 'This page may contain risky clauses.';
      } else {
        indicator.innerHTML = '';
        if (idleMsg) idleMsg.textContent = 'Ready to scan this page for risky clauses.';
      }
    }
  }

  async function checkApiStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_HEALTH' });
      const dot = document.getElementById('fg-api-dot');
      const label = document.getElementById('fg-api-label');

      if (response?.online) {
        if (dot) { dot.style.background = '#22c55e'; }
        if (label) label.textContent = 'API online';
      } else {
        if (dot) { dot.style.background = '#ef4444'; }
        if (label) label.textContent = 'API offline';
      }
    } catch { /* extension context invalidated */ }
  }

  // ── Drag support ───────────────────────────────────────────────────────────────

  function makeDraggable(container, handle) {
    let dragging = false;
    let startX, startY, startLeft, startBottom;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      handle.style.cursor = 'grabbing';
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      startLeft = rect.left;
      startBottom = window.innerHeight - rect.bottom;
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 300, startLeft + dx));
      const newBottom = Math.max(0, Math.min(window.innerHeight - 60, startBottom - dy));
      container.style.left = newLeft + 'px';
      container.style.right = 'auto';
      container.style.bottom = newBottom + 'px';
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
      handle.style.cursor = 'grab';
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Message listener ──────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'AUTO_SCAN_TRIGGER') {
      STATE.pageTypes = message.pageTypes || [];
      // Show the fab with an alert pulse
      const fab = document.getElementById('fg-widget-fab');
      const dot = document.getElementById('fg-fab-dot');
      if (fab) fab.classList.add('fg-fab-alert');
      if (dot) dot.style.display = 'block';
      sendResponse({ ok: true });
    }

    if (message.type === 'TRIGGER_SCAN') {
      scanPage();
      sendResponse({ ok: true });
    }

    if (message.type === 'CLEAR_HIGHLIGHTS') {
      clearHighlights();
      resetToIdle();
      sendResponse({ ok: true });
    }

    return true;
  });

  // ── Init ───────────────────────────────────────────────────────────────────────

  function init() {
    buildWidget();

    // Auto-detect page type on load
    checkPageType().then(() => {
      // If it's a known risky page and widget isn't open, pulse the fab
      chrome.runtime.sendMessage({ type: 'GET_PAGE_TYPE' }).then(response => {
        const types = response?.pageTypes || [];
        if (types.length > 0) {
          const dot = document.getElementById('fg-fab-dot');
          if (dot) dot.style.display = 'block';
        }
      }).catch(() => {});
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
