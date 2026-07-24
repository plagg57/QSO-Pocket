# QSO Pocket — Product Requirements Document

## Original Problem Statement
"Crée moi une application pour mettre mes QSO dedans pour les avoir sous la main directement."

## Product Description
QSO Pocket is a multi-user, mobile-friendly amateur radio logbook web application.

## All Features — DONE
- Custom auth (email/callsign + password) with admin role
- QSO CRUD with auto band calculation from frequency
- Callsign grouping with history, anti-duplicate detection
- Country flag detection from 150+ amateur radio prefixes
- ADIF Export with Capacitor/Web Share API fallback for Android
- ADIF Import via JSON text payload
- Wavelog API bidirectional sync (push + import from Wavelog)
- Admin Panel (manage users, view/delete QSOs)
- Profile Page (change password, email, Wavelog config)
- Dark-theme retro-terminal UI
- Internationalization (i18n) — FR, EN, DE, IT with persistent language selector
- PWA offline mode — Service Worker + IndexedDB offline QSO queue + auto-sync
- Real email sending for password reset via Resend (with fallback)
- Modular codebase — App.js refactored from 1860 to 64 lines across 12 component files

## Architecture (Post-Refactoring)
```
/app/frontend/src/
├── App.js                  (64 lines - router only)
├── config.js               (shared constants, axios setup, formatApiError)
├── context/
│   └── AuthContext.jsx      (auth provider + login/register/logout)
├── components/
│   ├── shared.jsx           (LanguageSelector, OfflineBanner, useOnlineStatus)
│   ├── Dashboard.jsx        (main dashboard with stats, search, QSO list)
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   ├── qso/
│   │   ├── AddQSOModal.jsx
│   │   └── ContactDetail.jsx
│   ├── profile/
│   │   ├── ProfilePage.jsx
│   │   └── WavelogSection.jsx
│   └── admin/
│       └── AdminPanel.jsx
├── i18n/                   (fr.json, en.json, de.json, it.json)
└── utils/                  (offlineQueue, exportAdif, callsignFlags, bands)
```

## Deployment
- Frontend: Vercel (static build)
- Backend: Render (Python/FastAPI)
- requirements.txt cleaned to 12 essential packages only

## Backlog
- Configure Resend with verified custom domain for production emails
- QSO Map (countries contacted visualization)
