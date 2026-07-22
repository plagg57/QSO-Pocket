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
- Real email sending for password reset via Resend (with fallback to UI link display)

## Tech Stack
- Frontend: React 18, Tailwind CSS, Phosphor Icons, Axios, react-i18next, Shadcn/UI
- Backend: FastAPI, PyMongo, JWT Auth, httpx, Resend (email)
- Database: MongoDB
- Offline: IndexedDB, Service Worker (stale-while-revalidate)

## Backlog
### P3
- Full App.js refactoring into separate component files (foundation files created: config.js, AuthContext.jsx, shared.jsx)
- Configure Resend with verified custom domain for production email sending
- QSO Map (countries contacted visualization) — user said "peut-être une prochaine fois"

## Mocked/Limited Features
- Password reset emails: Resend in test mode only sends to verified emails. With `onboarding@resend.dev` sender, unverified recipients get fallback (link displayed in UI). Production needs verified domain.
