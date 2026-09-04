# QSO Pocket — Product Requirements Document

## Original Problem Statement
"Crée moi une application pour mettre mes QSO dedans pour les avoir sous la main directement."

## Product Description
QSO Pocket is a multi-user, mobile-friendly radio logbook supporting **Radioamateurs**, **CB operators (Cibistes)** and **SWL listeners**.

## All Features — DONE
- Custom auth (email/callsign + password) with admin role
- Multi-user-type registration: Radioamateur, Cibiste, SWL with adaptive form
- SWL auto-ID generation: SWL-FR-XXXX for users without callsign
- 3 separate logbooks: Radioamateur, CB, SWL — each with independent QSOs, stats, imports/exports
- Logbook selector: dropdown in header to switch between logbooks
- Adaptive QSO modal: CB=FM/SSB/AM only, SWL=no RST sent/QSL sent
- Multi-callsign profile: manage Radio, CB, SWL callsigns on one account
- QSO CRUD with auto band calculation from frequency
- Callsign grouping with history, anti-duplicate detection
- **Comprehensive DXCC/ITU prefix database** (~350+ prefixes) with country flag detection
- Selective ADIF Export: modal with checkboxes, select all/deselect, date filter
- ADIF Import per logbook (file upload + paste text fallback)
- **Clear logbook**: delete all QSOs in a logbook with double confirmation
- Wavelog API bidirectional sync
- Admin Panel (global summary)
- Internationalization (i18n) — FR, EN, DE, IT
- PWA offline mode with auto-sync
- Real email sending for password reset via Resend
- Modular backend architecture (routes/, utils/)
- Capacitor configured for Google Play (Android)
- **Improved ContactDetail**: compact stats, bigger edit/delete buttons, better visual hierarchy

## Architecture
```
/app/backend/
├── server.py               (~120 lines - orchestrator, startup, CORS)
├── routes/
│   ├── auth.py             (register, login, password reset, callsign mgmt)
│   ├── qso.py              (CRUD, grouped, export/import ADIF, clear logbook)
│   ├── admin.py            (admin stats, user mgmt)
│   └── wavelog.py          (wavelog sync, config, import)
├── utils/
│   ├── db.py               (MongoDB connection)
│   ├── auth.py             (JWT, password hashing, get_current_user)
│   └── helpers.py          (ADIF parsing, callsign validation, freq_to_band)

/app/frontend/src/
├── App.js                  (router)
├── config.js               (shared constants)
├── context/AuthContext.jsx  (auth with offline caching)
├── components/
│   ├── shared.jsx          (LanguageSelector, OfflineBanner)
│   ├── Dashboard.jsx       (logbook selector, export modal, clear logbook, stats)
│   ├── auth/               (LoginPage, RegisterPage, Forgot, Reset)
│   ├── qso/                (AddQSOModal, ContactDetail)
│   ├── profile/            (ProfilePage, WavelogSection)
│   └── admin/              (AdminPanel)
├── i18n/                   (fr.json, en.json, de.json, it.json)
└── utils/                  (exportAdif.js, offlineQueue.js, bands.js, callsignFlags.js)
```

## DB Schema
- users: {id, email, password_hash, callsign, callsigns:{radioamateur,cb,swl}, user_type, role}
- qsos: {id, owner_id, callsign, date, time_utc, frequency, band, mode, rst_*, qsl_*, logbook, ...}

## Deployment
- Frontend: Vercel | Backend: Render | DB: MongoDB
- CORS: allow_credentials=False, Bearer token auth only (no cookies)
- Capacitor: appId=com.qsopocket.app, webDir=build, capacitor.config.json

## Upcoming Tasks
- P3: QSO Map (carte des pays contactés)
- P2: Publish on Google Play via Capacitor (config ready, needs Android Studio build)
