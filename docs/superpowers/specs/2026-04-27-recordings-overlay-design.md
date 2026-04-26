# Overlay des enregistrements PVR sur la grille EPG

**Date** : 2026-04-27
**Statut** : design validé, prêt pour planification

## Objectif

Visualiser, par-dessus la grille EPG, les enregistrements PVR (programmés, en
cours, terminés récents). Chaque enregistrement apparaît comme une cellule
fine (10 % de la hauteur d'une rangée), collée en bas de la rangée de sa
chaîne, sur sa plage horaire `[start, end]`. Le survol expose un tooltip
détaillé ; le clic ouvre une modale d'édition réutilisant `RecordModal`.

## Périmètre des données affichées

L'overlay agrège deux ressources de l'API Freebox PVR :

- `/pvr/programmed/` — tous les enregistrements programmés (incluant les
  occurrences générées par les enregistrements récurrents, qui apparaissent
  ici avec un `generator_id` non nul).
- `/pvr/finished/` — filtré côté client : `end >= now - 6h`. Les
  enregistrements terminés depuis plus de 6 heures sont exclus.

Un enregistrement dont la chaîne est masquée par le filtre utilisateur, ou
absente du bouquet, est ignoré silencieusement.

## Couche API

### Endpoints (`src/api/endpoints.js`)

Existants :

- `pvrProgrammedPath()` — `GET` (liste), `POST` (création).
- `pvrConfigPath()`, `pvrMediaPath()`.

Ajouts :

- `pvrProgrammedItemPath(id)` → `/pvr/programmed/{id}` — `PUT` édition,
  `DELETE` suppression.
- `pvrFinishedPath()` → `/pvr/finished/` — `GET`.
- `pvrFinishedItemPath(id)` → `/pvr/finished/{id}` — `PUT` (rename/move),
  `DELETE`.
- `pvrGeneratorItemPath(id)` → `/pvr/generator/{id}` — `GET` (lazy, pour
  enrichir le tooltip).

### Hooks (`src/hooks/usePvr.js` étendu)

- `usePvrProgrammed()` — `useQuery`, `staleTime: 5 * 60_000`,
  `refetchOnWindowFocus: true`. Pas de `refetchInterval`.
- `usePvrFinished()` — idem ; `select` filtre à `end >= now - 6h`.
- `useUpdateRecording()` — `useMutation` `PUT`, invalide
  `['pvr', 'programmed']` ET `['pvr', 'finished']`.
- `useDeleteRecording()` — `useMutation` `DELETE`, mêmes invalidations.
- `usePvrGenerator(id)` — `useQuery` lazy (`enabled: !!id`).

Existants conservés : `usePvrConfig`, `usePvrMedia`, `useCreateRecording`.

### Transformer (`src/api/transformers.js`)

Nouveau `transformRecording(raw, kind)` produit le modèle unifié :

```
{
  id, kind: 'programmed' | 'finished',
  channelUuid, channelName,
  name, subname, start, end,
  state,            // 'waiting' | 'running' | 'failed' | 'finished' | 'disabled'
  generatorId,      // null si non récurrent
  raw,              // payload original, conservé pour l'édition
}
```

L'état `running` est dérivé localement quand `kind === 'programmed'` et
`now ∈ [start, end]`, même si l'API renvoie encore `waiting`.

## Architecture de l'overlay

### Approche retenue

Couche absolue unique rendue dans `EpgGrid`, par-dessus la zone scrollable.
Évite tout couplage à `ChannelRow` / `ProgramCell` et préserve les
optimisations de mémoïsation existantes.

### Hiérarchie

```
EpgGrid
├── ChannelSidebar             (existant)
├── TimeHeader                 (existant)
├── scrollable viewport        (existant)
│   ├── ChannelRow[]           (existant, virtualisé)
│   ├── NowIndicator           (existant)
│   └── RecordingsOverlay      (nouveau)
└── RecordModal                (étendu : mode édition)
```

### `RecordingsOverlay.jsx`

Props : `visibleChannels` (array ordonné des chaînes filtrées),
`pixelsPerMinute`, `rowHeight`, `timeOriginLeftEdge` (timestamp
correspondant à `left = 0` de la zone scrollable).

Consomme `useRecordingsByChannel()` et rend, pour chaque chaîne dans la
fenêtre virtualisée (+ overscan), les `RecordingCell` qui tombent dans le
viewport temporel. Recordings hors viewport (`end < leftEdge` ou
`start > rightEdge`) sont skippés.

Racine : `position: absolute; top: 0; left: 0; pointer-events: none;`.
Cellules : `position: absolute; pointer-events: auto;`.

### Hook `useRecordingsByChannel`

Combine `usePvrProgrammed()` et `usePvrFinished()`, indexe par
`channelUuid` dans une `Map`, trie par `start` ascendant. Mémoïsé : la
référence reste stable tant que les entrées sont équivalentes.

### Helper pur `recordingPosition.js`

```
left   = (recording.start - timeOriginLeftEdge) * pixelsPerMinute / 60
width  = max(OVERLAY_MIN_WIDTH_PX, (recording.end - recording.start) * pixelsPerMinute / 60)
top    = rowIndex * rowHeight + rowHeight * (1 - OVERLAY_HEIGHT_RATIO)
height = rowHeight * OVERLAY_HEIGHT_RATIO
```

### Constantes (`src/utils/constants.js`)

- `OVERLAY_HEIGHT_RATIO = 0.10`
- `OVERLAY_MIN_WIDTH_PX = 24`
- `OVERLAY_BORDER_LEFT_PX = 3`

### Z-index

```
NowIndicator       z: 30
RecordingsOverlay  z: 20
ProgramCell        z: 10
ChannelRow         z:  0
```

## Rendu visuel d'une cellule

`RecordingCell.jsx` :

- Fond unique translucide.
- Bordure gauche colorée par état (le seul code couleur) :
  - `waiting` → bleu
  - `running` → rouge
  - `failed` / `disabled` → gris (avec icône warning pour `failed`)
  - `finished` → vert
- Icône d'état à gauche + `name` tronqué via `text-overflow: ellipsis`.
  Mapping : `waiting` → point ; `running` → point plein animé (pulse
  léger) ; `failed` → ⚠ ; `disabled` → cercle barré ; `finished` → ✓.
- Pas de matérialisation des marges : la cellule couvre exactement
  `[start, end]` brut de l'API.
- Icône poubelle à droite, visible au `:hover` (desktop seulement, opacité
  0 → 1). Clic → `window.confirm` → `useDeleteRecording()`. Stop
  propagation pour ne pas ouvrir la modale.

## Tooltip

`RecordingTooltip.jsx` (wrap `Tooltip` MUI, pattern de `ProgramCell`) :

- nom, sous-titre (si présent),
- nom de chaîne,
- plage horaire `HH:MM–HH:MM` + durée formatée,
- état détaillé localisé (« En attente », « En cours », « Échec : <error> »
  en rouge si `state === 'failed'`, « Désactivé », « Terminé »),
- qualité,
- badge **« Récurrent »** si `generatorId != null`.

Pas de chemin / support / taille : ces détails vivent dans la modale.

## Modale d'édition

### Stratégie : extension de `RecordModal`

`RecordModal` accepte une nouvelle prop `recording` (mode édition) en
alternative à `program / channelUuid / channelName` (mode création) :

```jsx
<RecordModal open onClose program={...} channelUuid={...} channelName={...} />
<RecordModal open onClose recording={...} />
```

Les champs sont identiques entre les deux modes ; le comportement adaptatif
gère les verrous selon le `kind` et le `state`.

### Champs verrouillés selon le contexte

| Cas | Champs éditables | Boutons |
|---|---|---|
| `programmed` + `waiting` (unitaire) | tous | Enregistrer · Supprimer · Annuler |
| `programmed` + `waiting` + occurrence (`generatorId`) | name, subname | Enregistrer · Supprimer · Annuler + message « Cet enregistrement fait partie d'une programmation récurrente. Modifier la série pour changer les autres champs. » |
| `programmed` + `running` | end, subname | Enregistrer · **Arrêter** · Annuler |
| `programmed` + `failed` / `disabled` | tous | Enregistrer · Supprimer · Annuler |
| `finished` | name, subname, path | Enregistrer · Supprimer · Annuler |

### Mutations

- Submit en mode édition → `useUpdateRecording()` → `PUT
  /pvr/programmed/{id}` ou `/pvr/finished/{id}` selon `recording.kind`.
  Body = `recording.raw` patché avec les champs modifiés (préserve les
  champs inconnus).
- Suppression → confirmation in-modale (Alert + bouton « Confirmer la
  suppression », pattern existant), puis `useDeleteRecording()` →
  `DELETE`. Pas de Dialog imbriquée.
- Toute mutation invalide les deux queries PVR.
- Erreurs API affichées via `<Alert severity="error">`, pattern
  identique au mode création.

## Refresh & état temps réel

- `staleTime: 5 * 60_000` + `refetchOnWindowFocus`. Pas de polling.
- L'état perçu (`waiting` → `running`) se dérive du temps actuel via
  `useCurrentTime()` (déjà tick chaque minute pour `NowIndicator`). Aucun
  appel réseau additionnel pour cette transition.
- Le filtre 6h des `finished` utilise aussi `useCurrentTime` : la fenêtre
  glisse à chaque tick, sans refetch.
- Le passage `programmed → finished` côté serveur tolère un délai jusqu'au
  prochain focus / mutation.

## Cas limites

- **Chaîne du recording masquée ou absente du bouquet** → ignoré
  silencieusement. (Une future page « Liste des enregistrements » couvrira
  ce cas, hors scope ici.)
- **Recording extrêmement court (<1 min)** → largeur clampée à
  `OVERLAY_MIN_WIDTH_PX` (24 px), affiche l'icône d'état seule.
- **Recordings se chevauchant sur la même chaîne** (rare) → empilement par
  ordre `start` ascendant ; le dernier rendu passe au-dessus. Pas de
  stacking vertical.
- **`finished` sortant de la fenêtre 6h pendant la session** → disparaît
  au tick minute suivant.
- **Mutation refusée par la Freebox** (champ verrouillé pendant
  `running`) → erreur affichée dans `<Alert>`. Pas de pré-validation
  client au-delà du `disabled` des champs.
- **Suppression d'un `running`** → la Freebox interprète comme « stop ».
  Le bouton porte le label « Arrêter ».
- **`generatorId` introuvable** (generator supprimé, occurrences
  persistantes) → badge « Récurrent » affiché ; `usePvrGenerator` lazy
  retourne 404 → pas de détails additionnels, pas de crash.

## Tests

### Unit (logique pure)

- `transformers.test.js` étendu — `transformRecording` mappe correctement
  les champs, dérive `kind`, gère `generator_id` null/absent, normalise
  `state`.
- `recordingPosition.test.js` — calcul `left/width/top/height`, clamp
  `MIN_WIDTH_PX`, recordings hors viewport.
- `useRecordingsByChannel.test.js` — combinaison programmed + finished,
  filtrage 6h, indexation par `channelUuid`, tri par `start`,
  mémoïsation stable.

### Integration (Testing Library)

- `RecordingsOverlay` — rend les cellules pour les chaînes visibles,
  ignore les chaînes masquées, repositionne au changement de
  `pixelsPerMinute`.
- `RecordingCell` — icône d'état correcte, bordure colorée selon état,
  tooltip au survol, ouvre `RecordModal` au clic, icône poubelle au hover
  déclenche confirmation puis `DELETE`.
- `RecordModal` mode édition — pré-remplissage depuis `recording`,
  désactivation des bons champs selon `kind`/`state`, submit appelle
  `PUT` (mock), bouton supprimer appelle `DELETE` (mock), libellé
  « Arrêter » pour running.

### Non testé (vérifié à la main)

- Synchronisation visuelle au scroll.
- Rendering pixel-perfect.

## Critères de complétion

1. `npm test` passe ; nouveaux tests présents.
2. `npm run lint` passe.
3. À l'usage : créer un enregistrement via une `ProgramCell` → la cellule
   overlay apparaît immédiatement sur la grille à la bonne position. La
   modifier → reflet immédiat. La supprimer via icône poubelle →
   disparaît. Survol → tooltip détaillé.
4. Un recording `running` apparaît avec bordure rouge et icône
   appropriée ; un `finished` <6 h reste visible avec bordure verte ; un
   `finished` >6 h n'apparaît pas.

## Hors scope (itérations futures)

- Page « Liste de tous les enregistrements » (incluant les chaînes
  masquées et les `finished` >6 h).
- Édition des `generator` (récurrence) en tant que tels.
- Drag pour ajuster `start` / `end` visuellement.
- Stacking vertical des recordings qui se chevauchent.

## Fichiers touchés

```
src/api/endpoints.js                          (étendu)
src/api/transformers.js                       (étendu)
src/api/transformers.test.js                  (étendu)
src/hooks/usePvr.js                           (étendu)
src/hooks/useRecordingsByChannel.js           (nouveau)
src/hooks/useRecordingsByChannel.test.js      (nouveau)
src/components/epg/RecordingsOverlay.jsx      (nouveau)
src/components/epg/RecordingCell.jsx          (nouveau)
src/components/epg/RecordingTooltip.jsx       (nouveau)
src/components/epg/RecordModal.jsx            (étendu : mode édition)
src/components/epg/EpgGrid.jsx                (montage de RecordingsOverlay)
src/utils/recordingPosition.js                (nouveau, pur)
src/utils/recordingPosition.test.js           (nouveau)
src/utils/constants.js                        (étendu : OVERLAY_*)
```
