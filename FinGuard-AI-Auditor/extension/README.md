# FinGuard Chrome Extension

Premium AI-powered Chrome Extension that automatically scans Terms & Conditions,
payment, and subscription pages for risky clauses — and highlights them directly
on the page with explanatory tooltips.

---

## Features

- **Auto-detection** — recognises Terms & Conditions, payment, subscription, and privacy policy pages
- **Floating scan widget** — appears on every page with a "Scan this page" button
- **Inline highlights** — risky clauses are underlined red (High Risk) or amber (Suspicious) directly in the DOM
- **Hover tooltips** — hover any highlighted clause to see the risk explanation
- **Toolbar popup** — click the extension icon for a full risk summary
- **API status badge** — live indicator showing backend connectivity
- **Settings** — configurable API URL, toggle for auto-scan

---

## Folder Structure

```
finguard-extension/
├── manifest.json                   ← Manifest V3
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── src/
    ├── background/
    │   └── background.js           ← Service worker: API calls, tab detection, routing
    ├── content/
    │   ├── content.js              ← Injected into pages: text extraction, highlighting, widget
    │   └── content.css             ← Widget and highlight styles (namespaced)
    └── popup/
        ├── popup.html              ← Toolbar popup
        ├── popup.css               ← Popup styles
        └── popup.js               ← Popup logic
```

---

## Prerequisites

**FinGuard Backend must be running:**

```bash
cd finguard_app
uvicorn finguard.api.panic_api:app --host 0.0.0.0 --port 8000 --reload
```

The extension talks to `http://localhost:8000` by default. You can change this in Settings.

---

## Installation

### Developer mode (local)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `finguard-extension/` folder
5. The FinGuard shield icon appears in your toolbar ✅

### Production (Chrome Web Store)

1. Zip the entire `finguard-extension/` folder
2. Upload to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)

---

## How It Works

### Architecture

```
Page Load
    │
    ▼
content.js (injected)
    ├── Detects page type (T&C / payment / subscription)
    ├── Mounts floating widget (FAB + panel)
    └── On scan trigger:
            │
            ├── extractTextNodes() — walks DOM, collects paragraphs
            ├── chunkSegments()    — splits into ≤4800 char chunks
            │
            ▼
        background.js (service worker)
            ├── POST /api/v1/panic/batch  → FinGuard FastAPI
            └── Returns {results, summary, verdict}
                    │
                    ▼
            content.js
                ├── Wraps flagged nodes in <span class="fg-highlight">
                ├── Adds severity badge (HIGH RISK / SUSPICIOUS)
                └── Attaches tooltip on hover
```

### API Integration

The extension uses two FinGuard API endpoints:

| Endpoint | Used for |
|---|---|
| `GET /api/v1/health` | Connectivity check (every 30s) |
| `POST /api/v1/panic/batch` | Scan page text chunks (up to 50 per request) |

**Request format:**
```json
{
  "messages": [
    "This agreement auto-renews annually unless cancelled 90 days prior...",
    "A processing fee of $149 and convenience fee of 3.5% apply..."
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "verdict": "SUSPICIOUS",
      "confidence": 72,
      "reasons": ["Auto-renewal trap detected", "90-day notice window"],
      "extracted_urls": [],
      "extracted_phones": [],
      "latency_ms": 4
    }
  ],
  "summary": { "total": 2, "scam": 0, "suspicious": 1, "safe": 1 },
  "total_latency_ms": 12
}
```

---

## Page Type Detection

The extension auto-detects risky pages by matching URL patterns:

| Type | URL patterns matched |
|---|---|
| `terms` | `/terms-of-service`, `/privacy-policy`, `/tos`, `/eula`, `/legal` |
| `payment` | `/checkout`, `/billing`, `/payment`, `/cart`, `/pay/` |
| `subscription` | `/subscribe`, `/signup`, `/pricing`, `/plans`, `/membership`, `/trial` |

When a risky page is detected:
- The extension badge turns amber with a `!` indicator
- The floating widget pulses to alert the user
- Auto-scan fires if enabled in Settings

---

## Configuration

Click the ⚙ gear icon in the popup to access Settings:

| Setting | Default | Description |
|---|---|---|
| **API URL** | `http://localhost:8000` | FinGuard backend URL |
| **Auto-scan risky pages** | On | Automatically scan detected T&C/payment pages |

Settings are persisted via `chrome.storage.sync`.

---

## Development

### Reload after changes

After editing any file:
1. Go to `chrome://extensions`
2. Click the 🔄 refresh button on the FinGuard extension card
3. Reload the page you're testing on

### Debugging

| Component | How to debug |
|---|---|
| Background service worker | `chrome://extensions` → FinGuard → "Service Worker" → DevTools |
| Content script | Open DevTools on any page → Console (look for `[FinGuard]` logs) |
| Popup | Right-click the toolbar icon → "Inspect popup" |

### Key files to modify

- **Add new risk patterns** → `src/background/background.js` → `RISKY_PAGE_PATTERNS`
- **Change highlight colours** → `src/content/content.css` + `content.js` → `SEVERITY_CONFIG`
- **Add new API endpoints** → `src/background/background.js` → `handleMessage()`
- **Change widget layout** → `src/content/content.js` → `buildWidget()`

---

## Security Notes

- The extension only reads page text — it never modifies form data or intercepts network requests
- API calls go through the background service worker (avoids CORS restrictions)
- All API keys / settings stored via `chrome.storage.sync` (encrypted by Chrome profile)
- Host permissions: `https://*/*` (required to run on all pages) + `localhost:8000` for the API

---

## Permissions

| Permission | Why |
|---|---|
| `activeTab` | Read the current tab's URL |
| `storage` | Persist settings and scan count |
| `scripting` | Inject content scripts programmatically |
| `host_permissions: https://*/*` | Run on all HTTPS pages |
| `host_permissions: localhost:8000` | Connect to local FinGuard API |
