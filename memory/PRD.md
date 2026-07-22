# QSO Pocket — Product Requirements Document

## Original Problem Statement
"Crée moi une application pour mettre mes QSO dedans pour les avoir sous la main directement."

## Product Description
QSO Pocket is a multi-user, mobile-friendly amateur radio logbook web application. It tracks callsigns, dates, UTC time, frequency, band, mode, RST (sent/received), QSL (sent/received), names, and comments.

## Core Features — All DONE
- Custom auth (email/callsign + password) with admin role
- QSO CRUD with auto band calculation from frequency
- Callsign grouping with history, anti-duplicate detection
- Country flag detection from 150+ amateur radio prefixes
- ADIF Export with robust Capacitor/Web Share API fallback for Android
- ADIF Import via JSON text payload (bypasses multipart issues)
- Wavelog API bidirectional sync (push/export + import from Wavelog)
- Admin Panel (manage users, view/delete QSOs)
- Profile Page (change password, email, Wavelog config)
- Dark-theme retro-terminal UI
- Internationalization (i18n) — FR, EN, DE, IT with persistent top-right language selector
- PWA offline mode — Service Worker + IndexedDB offline queue for QSO creation + auto-sync on reconnection

## Tech Stack
- Frontend: React 18, Tailwind CSS, Phosphor Icons, Axios, react-i18next, Shadcn/UI
- Backend: FastAPI, PyMongo, JWT Auth, httpx
- Database: MongoDB (collections: users, qsos, password_reset_tokens, wavelog_config, wavelog_sync_log)
- Mobile: Capacitor compatibility, PWA Service Worker
- Offline: IndexedDB for QSO queue

## Architecture
```
/app/frontend/src/
├── App.js           — Monolithic (~1840 lines) containing all components
├── config.js        — Extracted shared config (API URL, constants, formatApiError)
├── context/
│   └── AuthContext.jsx — Extracted auth context/provider (ready for future import)
├── components/
│   ├── shared.jsx   — Extracted LanguageSelector, OfflineBanner, useOnlineStatus
│   ├── ui/          — Shadcn UI components
│   ├── auth/        — (placeholder dirs for future refactoring)
│   ├── qso/
│   ├── admin/
│   └── profile/
├── i18n/            — Translation files (fr.json, en.json, de.json, it.json, index.js)
└── utils/
    ├── offlineQueue.js  — IndexedDB offline queue for QSOs
    ├── exportAdif.js    — ADIF export with Capacitor fallback
    ├── callsignFlags.js — 150+ prefix-to-flag mappings
    └── bands.js         — Band calculation from frequency
/app/frontend/public/
├── sw.js            — Service Worker (stale-while-revalidate caching)
└── manifest.json    — PWA manifest
/app/backend/
└── server.py        — FastAPI backend with all API routes
```

## Key API Endpoints
- POST /api/auth/register | POST /api/auth/login | GET /api/auth/me
- GET /api/qso/grouped | POST /api/qso | PUT /api/qso/{id} | DELETE /api/qso/{id}
- POST /api/qso/import/adif-text (JSON payload of ADIF string)
- GET /api/wavelog/config | PUT /api/wavelog/config
- POST /api/wavelog/sync | POST /api/wavelog/import (NEW - bidirectional)
- POST /api/wavelog/test
- GET /api/admin/users | DELETE /api/admin/qso/{id}

## Backlog (Prioritized)
### P2
- Real email sending for "Forgot Password" via Resend (waiting for user's API key)

### P3
- Full App.js refactoring into separate component files (foundation files created)

## Mocked Features
- "Forgot password" email sending — displays reset link in UI instead of sending email (awaiting Resend API key)
