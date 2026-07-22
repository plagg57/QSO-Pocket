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
- Wavelog API synchronization (push/export)
- Admin Panel (manage users, view/delete QSOs)
- Profile Page (change password, email, Wavelog config)
- Dark-theme retro-terminal UI
- **Internationalization (i18n)** — FR, EN, DE, IT with persistent top-right language selector (DONE Feb 2026)

## Tech Stack
- Frontend: React 18, Tailwind CSS, Phosphor Icons, Axios, react-i18next, Shadcn/UI
- Backend: FastAPI, PyMongo, JWT Auth
- Database: MongoDB (collections: users, qsos, password_reset_tokens)
- Mobile: Capacitor compatibility (@capacitor/filesystem, @capacitor/share)

## Architecture
```
/app/frontend/src/App.js — Monolithic (~1735 lines) containing all components
/app/frontend/src/i18n/ — Translation files (fr.json, en.json, de.json, it.json, index.js)
/app/frontend/src/utils/ — exportAdif.js, callsignFlags.js, bands.js
/app/backend/server.py — FastAPI backend with all API routes
```

## Key API Endpoints
- POST /api/auth/register | POST /api/auth/login | GET /api/auth/me
- GET /api/qso/grouped | POST /api/qso | PUT /api/qso/{id} | DELETE /api/qso/{id}
- POST /api/qso/import/adif-text (JSON payload of ADIF string)
- GET /api/wavelog/config | PUT /api/wavelog/config | POST /api/wavelog/sync
- GET /api/admin/users | DELETE /api/admin/qso/{id}

## Backlog (Prioritized)
### P2
- Real email sending for "Forgot Password" (currently simulated via UI token display)
- Offline mode (PWA/Service Worker) to save QSOs without internet and sync upon return

### P3
- Bidirectional Wavelog sync (import from Wavelog)
- App.js refactoring into separate component files

## Mocked Features
- "Forgot password" email sending — displays reset link in UI instead of sending email
