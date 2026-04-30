/**
 * FinGuard Extension — Background Service Worker
 * ================================================
 * Handles:
 *  - API calls to FinGuard backend (avoids CORS issues from content script)
 *  - Storage of user settings (API URL, preferences)
 *  - Message routing between popup ↔ content script
 *  - Page-type detection badge updates
 */

// ── Constants ─────────────────────────────────────────────────────────────────

// ✅ FIX: Changed from localhost to a cloud URL so real users can use the extension.
// When you deploy your backend, replace this with your actual URL.
// e.g. 'https://finguard-api.railway.app' or 'https://finguard.onrender.com'
// Users can also override this in the extension Settings panel.
const DEFAULT_API_URL = 'https://finguard-api.railway.app';

const RISKY_PAGE_PATTERNS = {
  terms: [
    /terms[-_\s]?(of[-_\s]?service|and[-_\s]?conditions?|of[-_\s]?use)/i,
    /privacy[-_\s]?policy/i,
    /legal[-_\s]?(notice|agreement|terms)/i,
    /eula/i,
    /user[-_\s]?agreement/i,
    /\/tos\b/i,
    /\/toc\b/i,
  ],
  payment: [
    /checkout/i,
    /payment/i,
    /billing/i,
    /purchase/i,
    /cart/i,
    /order[-_\s]?confirmation/i,
    /pay[-_\s]?now/i,
    /\/pay\//i,
  ],
  subscription: [
    /subscri(be|ption)/i,
    /sign[-_\s]?up/i,
    /register/i,
    /free[-_\s]?trial/i,
    /pricing/i,
    /plans?/i,
    /membership/i,
    /upgrade/i,
  ],
};

// ── Storage helpers ────────────────────────────────────────────────────────────

async function getSettings() {
  const defaults = {
    apiUrl: DEFAULT_API_URL,
    apiKey: '',             // ✅ FIX: store the FINGUARD_API_KEY for protected endpoints
    autoScan: true,
    highlightLevel: 'all',  // 'high' | 'all'
    showTooltips: true,
    scanCount: 0,
  };
  const stored = await chrome.storage.sync.get(defaults);
  return stored;
}

async function saveSettings(updates) {
  await chrome.storage.sync.set(updates);
}

// ── Page classification ────────────────────────────────────────────────────────

function classifyUrl(url) {
  try {
    const u = new URL(url);
    const full = u.href + ' ' + u.pathname + ' ' + u.hostname;
    const detected = [];
    for (const [type, patterns] of Object.entries(RISKY_PAGE_PATTERNS)) {
      if (patterns.some(p => p.test(full))) {
        detected.push(type);
      }
    }
    return detected;
  } catch {
    return [];
  }
}

// ── API calls ──────────────────────────────────────────────────────────────────

// ✅ FIX: All API calls now include X-API-Key header so protected endpoints work.
function buildHeaders(apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;
  return headers;
}

async function callFinguardAPI(text, apiUrl, apiKey) {
  const response = await fetch(`${apiUrl}/api/v1/panic/check`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({ text: text.slice(0, 4900) }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function callFinguardBatchAPI(chunks, apiUrl, apiKey) {
  const response = await fetch(`${apiUrl}/api/v1/panic/batch`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    body: JSON.stringify({ messages: chunks }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Batch API error: ${response.status}`);
  return response.json();
}

async function checkHealth(apiUrl) {
  // Health endpoint is unprotected — no API key needed
  const response = await fetch(`${apiUrl}/api/v1/health`, {
    signal: AbortSignal.timeout(3000),
  });
  return response.json();
}

// ── Message handlers ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('[FinGuard BG] Error:', err);
    sendResponse({ error: err.message || 'Unknown error' });
  });
  return true; // keep channel open for async
});

async function handleMessage(message, sender) {
  const settings = await getSettings();

  switch (message.type) {

    case 'SCAN_PAGE': {
      const { chunks, url } = message;
      const pageTypes = classifyUrl(url);

      const validChunks = chunks
        .filter(c => c.trim().length > 20)
        .slice(0, 50);

      if (validChunks.length === 0) {
        return { results: [], pageTypes, verdict: 'clean' };
      }

      // ✅ FIX: pass apiKey through to batch call
      const batchResult = await callFinguardBatchAPI(validChunks, settings.apiUrl, settings.apiKey);

      await saveSettings({ scanCount: (settings.scanCount || 0) + 1 });

      return {
        results: batchResult.results,
        summary: batchResult.summary,
        pageTypes,
        verdict: determineOverallVerdict(batchResult.summary),
      };
    }

    case 'CHECK_HEALTH': {
      try {
        const health = await checkHealth(settings.apiUrl);
        return { online: true, health };
      } catch {
        return { online: false };
      }
    }

    case 'GET_SETTINGS': {
      return settings;
    }

    case 'SAVE_SETTINGS': {
      await saveSettings(message.settings);
      return { ok: true };
    }

    case 'CLASSIFY_URL': {
      return { pageTypes: classifyUrl(message.url) };
    }

    case 'GET_PAGE_TYPE': {
      const tab = sender.tab;
      if (tab) return { pageTypes: classifyUrl(tab.url) };
      return { pageTypes: [] };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// ── Tab change detection ───────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const pageTypes = classifyUrl(tab.url);
  const isRisky = pageTypes.length > 0;

  if (isRisky) {
    await chrome.action.setBadgeText({ text: '!', tabId });
    await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId });
    await chrome.action.setTitle({
      title: `FinGuard — ${pageTypes.join(', ')} page detected`,
      tabId,
    });
  } else {
    await chrome.action.setBadgeText({ text: '', tabId });
    await chrome.action.setTitle({ title: 'FinGuard AI Auditor', tabId });
  }

  const settings = await getSettings();
  if (settings.autoScan && isRisky) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'AUTO_SCAN_TRIGGER', pageTypes });
    } catch {
      // Tab not ready yet — content script will handle on load
    }
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function determineOverallVerdict(summary) {
  if (!summary) return 'unknown';
  if (summary.scam > 0) return 'scam';
  if (summary.suspicious > 0) return 'suspicious';
  return 'safe';
}

console.log('[FinGuard] Background service worker started.');