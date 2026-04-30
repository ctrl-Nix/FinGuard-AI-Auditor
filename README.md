# 🛡️ FinGuard AI Auditor 3.0

> **Professional-grade forensic financial auditor powered by AI.** Detect hidden fees, manipulation tactics, legal risks, and fraud signals instantly.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 🚀 Overview

FinGuard is a high-performance, multi-layered security platform designed to audit contracts, messages, and financial documents. It uses a hybrid approach:
1. **Layer 1: Local Regex Engine** (<5ms) — High-speed pattern matching.
2. **Layer 2: Scoring Engine** — Advanced risk weighting and heuristics.
3. **Layer 3: LLM Enrichment** — Deep semantic analysis using Google Gemini.

## 🏗️ Project Structure

- **`/frontend`**: Vite + React SPA. Ultra-modern "Cyber-Glass" UI.
- **`/backend`**: FastAPI (Python) high-performance audit engine.
- **`/extension`**: Chrome extension for real-time protection (experimental).

## 🌍 Deployment

### Frontend (Vercel)
The frontend is optimized for Vercel. 
- **Build Command**: `npm run build` (from root)
- **Output Directory**: `frontend/dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your backend URL.
  - `VITE_SUPABASE_URL`: Your Supabase project URL.
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase public key.

### Backend (Render)
The backend is designed to run as a Docker container or a Web Service on Render.
- **Environment Variables**:
  - `GEMINI_API_KEY`: Required for Layer 3 analysis.
  - `CORS_ORIGINS`: (Optional) Already set to `*` for easy setup.

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   # Root
   npm install
   # Frontend
   cd frontend && npm install
   # Backend
   cd backend && pip install -r requirements.txt
   ```

2. **Run Dev Servers**:
   ```bash
   # Frontend
   npm --prefix frontend run dev
   # Backend
   cd backend && uvicorn app:app --reload
   ```

---

## 🔒 Security & Privacy

FinGuard is built with privacy-first principles. The local JS engine analyzes documents instantly without sending data to any server unless "Full Audit" is requested.

## ⚖️ License

MIT License. Built with ❤️ by the FinGuard Team.
