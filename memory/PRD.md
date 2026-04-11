# QSO Logbook - Product Requirements Document

## Problem Statement
Application de carnet de trafic radio amateur (QSO) pour enregistrer et consulter ses contacts facilement.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async)
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Base de données**: MongoDB (collection: qsos)

## User Persona
- Radioamateur souhaitant enregistrer ses contacts (QSO) de manière simple et rapide

## Core Requirements (Implemented)
- [x] CRUD complet pour QSO (Create, Read, Update, Delete)
- [x] Champs: Indicatif, Date, Fréquence, Nom
- [x] Recherche par indicatif ou nom
- [x] Statistiques (total QSOs)
- [x] Interface sombre style terminal radio

## Implementation Log
- **Janvier 2026**: MVP créé avec toutes les fonctionnalités de base

## API Endpoints
- `POST /api/qso` - Créer un QSO
- `GET /api/qso` - Liste des QSOs (avec filtres)
- `GET /api/qso/{id}` - Récupérer un QSO
- `PUT /api/qso/{id}` - Modifier un QSO
- `DELETE /api/qso/{id}` - Supprimer un QSO
- `GET /api/qso/stats/total` - Statistiques

## Prioritized Backlog
### P1 (Next Features)
- Export ADIF pour interopérabilité avec d'autres logiciels
- Champs additionnels: Mode, RST, Locator, Puissance

### P2 (Future Enhancements)
- Statistiques avancées (par bande, par pays)
- Carte géographique des contacts
- Import ADIF
