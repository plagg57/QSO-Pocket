# QSO Pocket — Product Requirements Document

## Original Problem Statement
"Crée moi une application pour mettre mes QSO dedans pour les avoir sous la main directement."

## Product Description
QSO Pocket is a multi-user, mobile-friendly radio logbook supporting **Radioamateurs**, **CB operators (Cibistes)** and **SWL listeners**.

## All Features — DONE
- Custom auth (email/callsign + password) with admin role
- **Multi-user-type registration**: Radioamateur, Cibiste, SWL with adaptive form
- **SWL auto-ID generation**: SWL-FR-XXXX for users without callsign
- **3 separate logbooks**: 📡 Radioamateur, 🚛 CB, 🎧 SWL — each with independent QSOs, stats, imports/exports
- **Logbook selector**: dropdown in header to switch between logbooks
- **Adaptive QSO modal**: CB=FM/SSB/AM only, SWL=no RST sent/QSL sent
- **Multi-callsign profile**: manage Radio, CB, SWL callsigns on one account
- QSO CRUD with auto band calculation from frequency
- Callsign grouping with history, anti-duplicate detection
- Country flag detection from 150+ amateur radio prefixes
- ADIF Export/Import per logbook
- Wavelog API bidirectional sync
- Admin Panel (global summary)
- Internationalization (i18n) — FR, EN, DE, IT
- PWA offline mode with auto-sync
- Real email sending for password reset via Resend
- Modular codebase (12 component files)

## Architecture
```
/app/frontend/src/
├── App.js                  (64 lines - router)
├── config.js               (shared constants, axios, formatApiError)
├── context/AuthContext.jsx  (auth with user_type/callsigns support)
├── components/
│   ├── shared.jsx           (LanguageSelector, OfflineBanner)
│   ├── Dashboard.jsx        (logbook selector, filtered stats/QSOs)
│   ├── auth/                (LoginPage, RegisterPage with type selector, Forgot, Reset)
│   ├── qso/                 (AddQSOModal with adaptive modes, ContactDetail)
│   ├── profile/             (ProfilePage with multi-callsign, WavelogSection)
│   └── admin/               (AdminPanel with global summary)
```

## DB Schema
- users: {id, email, password_hash, callsign, callsigns:{radioamateur,cb,swl}, user_type, role}
- qsos: {id, owner_id, callsign, date, time_utc, frequency, band, mode, rst_*, qsl_*, logbook, ...}

## Deployment
- Frontend: Vercel | Backend: Render | DB: MongoDB
- requirements.txt: 12 essential packages only
- CORS: allow_credentials=False, Bearer token auth only (no cookies)
