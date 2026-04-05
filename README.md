# Vite React MUI Template

Un template moderne et optimisé pour créer des applications React avec Vite, Material-UI et les meilleures pratiques de développement.

## 🚀 Technologies incluses

- **[React 19](https://react.dev/)** - Dernière version avec hooks modernes
- **[Vite 7](https://vitejs.dev/)** - Build tool rapide et moderne
- **[Material-UI (MUI) v7](https://mui.com/)** - Composants React avec Material Design
- **[TanStack Query v5](https://tanstack.com/query)** - Gestion des données et cache intelligent
- **[React Router v7](https://reactrouter.com/)** - Navigation côté client
- **[Oxlint](https://oxc.rs/)** - Linter JavaScript/TypeScript ultra-rapide

## ✨ Fonctionnalités

- 🎨 **Thème personnalisable** et support du mode sombre automatique
- 🛡️ **Error Boundary** pour une gestion d'erreurs
- 📱 **Design responsive** avec breakpoints Material-UI
- ⚡ **Configuration optimisée** de TanStack Query avec DevTools
- 🧪 **Tests unitaires** avec Vitest et React Testing Library
- 🔧 **Configuration Oxlint complète** avec règles strictes
- 🎨 **Layout réutilisable** avec AppBar et Footer
- 🌐 **Support HTTPS** en développement (optionnel)
- 📦 **Variables d'environnement** avec `.env.example`

## 🛠️ Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build de production
npm run build

# Aperçu du build
npm run serve

# Linting
npm run lint
```

## 📁 Structure du projet

```
src/
├── components/
│   ├── ErrorBoundary.jsx   # Gestion globale des erreurs
│   ├── Layout.jsx          # Layout principal avec AppBar/Footer
│   ├── Home.jsx            # Page d'accueil exemple
│   └── Home.test.jsx       # Tests du composant Home
├── setupTests.js           # Configuration des tests
├── App.jsx                 # Composant principal avec routing
└── main.jsx                # Point d'entrée avec providers
```

## 🎨 Personnalisation du thème

Le thème Material-UI est configuré dans `src/main.jsx` avec :

- **Mode sombre automatique** basé sur les préférences système
- **Couleurs personnalisées** (primary: #adb31b, secondary: #ff6b35)

## 🔧 Configuration

### Variables d'environnement

Copiez le fichier `.env.example` en `.env.local` pour personnaliser votre configuration :

```bash
cp .env.example .env.local
```

Variables disponibles :

- `VITE_APP_TITLE` - Titre de l'application
- `VITE_API_URL` - URL de votre API backend
- `VITE_HTTPS` - Active/désactive HTTPS en développement (`true`/`false`)

**Note** : Les variables doivent commencer par `VITE_` pour être accessibles dans l'application.

### HTTPS en développement (optionnel)

Le template inclut une configuration HTTPS pour le développement. Pour l'utiliser :

1. Créez un dossier `~/https/` avec vos certificats SSL
2. Ajoutez `key.pem` et `cert.pem` dans ce dossier
3. Définissez `VITE_HTTPS=true` dans votre `.env.local`

### TanStack Query

Configuration par défaut optimisée :

- 1 seul retry en cas d'échec
- Pas de refetch automatique lors du focus
- Cache de 5 minutes

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Aperçu du build
- `npm test` - Lance les tests en mode watch
- `npm run test:ui` - Interface graphique pour les tests
- `npm run test:coverage` - Rapport de couverture des tests
- `npm run lint` - Analyse du code avec Oxlint
- `npm run lint:fix` - Correction automatique des erreurs
- `npm run start` - Alias pour `npm run dev`

## 🔍 Bonnes pratiques incluses

- **Composants fonctionnels** avec hooks
- **Gestion d'erreurs** avec Error Boundary
- **Accessibilité** avec attributs ARIA appropriés
- **SEO** avec meta tags optimisés
- **Performance** avec lazy loading et optimisations
- **Code quality** avec oxlint

## 🚦 Node.js

Ce projet utilise Node.js version **24** (voir `.nvmrc`).

Si vous utilisez nvm :

```bash
nvm use
```
