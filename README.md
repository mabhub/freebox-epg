# Freebox EPG

Guide électronique des programmes (EPG) pour Freebox, avec grille horaire interactive, filtrage des chaînes, détail des programmes et planification d'enregistrements PVR.

L'application consomme l'API de Freebox OS et s'utilise aussi bien sur desktop qu'en mobile tactile.

## Fonctionnalités

- Grille EPG virtualisée (défilement horizontal temporel, vertical entre chaînes) avec synchronisation de la timeline
- Drag-to-scroll souris + scroll tactile natif, tooltips désactivés sur mobile
- Sidebar des chaînes avec recherche, toggle individuel et raccourcis « tout afficher / tout masquer / TNT uniquement »
- Persistance localStorage des chaînes masquées
- Détail d'un programme et planification d'enregistrement sur le PVR Freebox
- Indicateur temps réel (ligne « maintenant ») qui se déplace chaque minute

## Stack

- React 19 + Vite 8 (plugin SWC)
- Material-UI v7 + Emotion
- Redux Toolkit (state filtres) + TanStack Query v5 (cache API)
- React Router v7
- Oxlint + Vitest / Testing Library

## Démarrage

```bash
nvm use                  # Node 24 (cf. .nvmrc)
npm install
cp .env.example .env
# éditer .env pour renseigner FREEBOX_API_TARGET
npm run dev
```

## Configuration

Variables d'environnement (`.env`) :

| Variable | Rôle |
|----------|------|
| `VITE_APP_TITLE` | Titre affiché dans l'app |
| `FREEBOX_API_TARGET` | Host Freebox (`https://host:port`). Utilisée par le proxy Vite en dev et, côté Netlify, par `scripts/generate-redirects.js` (hook `prebuild`) pour écrire `public/_redirects`. Jamais exposée dans le bundle client. |
| `VITE_HTTPS` | Active HTTPS en dev (nécessite `~/https/key.pem` et `cert.pem`) |

L'authentification utilise le mot de passe de la Freebox : une page de login interne (`LoginPage`) envoie les identifiants à l'API Freebox OS, qui renvoie un cookie de session réutilisé pour les appels suivants. Un token CSRF (`X-FBX-FREEBOX0S`) est ajouté automatiquement sur chaque requête.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur Vite avec proxy vers la Freebox |
| `npm run build` | Build de prod (génère `public/_redirects` à partir de `FREEBOX_API_TARGET` via le hook `prebuild`) |
| `npm run preview` | Preview du build |
| `npm test` | Tests Vitest |
| `npm run test:ui` | Interface Vitest |
| `npm run test:coverage` | Couverture v8 |
| `npm run lint` | Oxlint |
| `npm run lint:fix` | Oxlint avec auto-fix |

## Déploiement Netlify

`netlify.toml` définit `npm run build` comme commande et `dist` comme dossier publié. Le fichier `public/_redirects` est généré au build à partir de `FREEBOX_API_TARGET` (à définir comme variable de site Netlify) pour relayer les appels `/api/*` vers la Freebox. Les miniatures programmes (`/api/latest/tv/img/*`) sont cachées 7 jours via les headers Netlify.

## Structure

```
src/
├── api/                 # Client HTTP Freebox (CSRF, cookies)
├── components/
│   ├── epg/             # Grille, sidebar, cellules, tooltip, modales
│   ├── ErrorBoundary.jsx
│   ├── Layout.jsx
│   ├── LoginPage.jsx
│   └── NotFound.jsx
├── hooks/               # useChannels, useEpgByChannel, useDragScroll, usePvr…
├── store/               # Redux slices (epg, channels) + persistance localStorage
├── utils/               # Formatage temps, couleurs catégories, constantes
├── App.jsx              # Routing
└── main.jsx             # Providers (Redux, Query, MUI theme, Router)
scripts/
└── generate-redirects.js  # Génère public/_redirects depuis FREEBOX_API_TARGET
```
