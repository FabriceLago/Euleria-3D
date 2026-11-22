# Missions 3D — Conception

- **Date** : 2026-11-22
- **Statut** : validé section par section, en attente de relecture du document
- **Branche** : `feat/missions-3d` (part de `feat/i18n-fr-en-nl`)

## 1. Objectif

Rendre l'étude ludique en faisant **répondre l'élève en manipulant la scène 3D**, avec un retour immédiat et satisfaisant. Aujourd'hui, les 42 scènes Three.js illustrent le cours mais sont séparées des exercices (on regarde la 3D, puis on répond à un QCM à côté).

**Critères de réussite du pilote**
- 6 scènes (une par matière) proposent chacune 3 missions jouables (guidé, autonome, chrono).
- Chaque mission est aussi bonne à la souris qu'au doigt.
- 60 images/s sur PC, ≥ 30 images/s sur mobile d'entrée de gamme en mission.
- Étoiles, XP, Carnet d'erreurs, BKT et badges existants sont alimentés par les missions.
- Hors mode mission, les scènes se comportent exactement comme avant.

**Hors périmètre** : les 36 autres scènes (phase 2), la refonte en React Three Fiber, une carte d'aventure, des mini-jeux arcade.

## 2. Décisions

| Décision | Choix | Raison |
|---|---|---|
| Type d'expérience | Missions dans la scène | Le geste est le concept : c'est la 3D qui apprend, pas un décor |
| Appareils | PC et mobile à égalité | Gestes communs (glisser, toucher, tourner), pas de survol ni clic droit obligatoire |
| Pilote | 1 scène par matière | Valide le cadre sur tous les types de contenus |
| Approche technique | Couche `src/missions/` branchée sur `MathSceneEngine` | Réutilise les 42 scènes, aucune nouvelle dépendance, le fichier moteur de 4 960 lignes ne grossit pas de logique de jeu |

Approches écartées : réécriture en React Three Fiber (réécrire 6 puis 42 scènes, deux moteurs en parallèle, deux dépendances) ; fausse 3D CSS (ne répond pas au besoin).

## 3. Architecture

Constat : chaque scène est pilotée par `SceneParams` (`a`, `b`, `c`, `explode`) via `engine.updateParams()`, et `computeReadout()` donne la valeur affichée. Une mission s'exprime donc comme « amener la scène dans le bon état » ou « toucher le bon objet ».

```
src/missions/
  types.ts         MissionDef, MissionControl, MissionResult (données pures)
  catalog/         fractions.ts, refraction.ts, adn.ts, frise.ts, narratif.ts, temps.ts
  runner.ts        machine à états d'une mission
  gestures.ts      Pointer Events → changements de paramètres ou sélection
  fx.ts            tweens, particules, fantôme, mouvements de caméra
  MissionHUD.tsx   consigne, étoiles, chrono, indice, son on/off
```

### 3.1 Définition d'une mission

```ts
type MissionKind = 'adjust' | 'identify';

interface MissionControl {
  param: 'a' | 'b' | 'c';
  gesture: 'drag-x' | 'drag-y' | 'dial';
  min: number; max: number; step: number;   // doivent respecter getParamMetadataForPreset(preset)
}

interface MissionDef {
  id: string;                     // 'fractions-1'
  preset: string;                 // 'fractions_3d'
  level: 1 | 2 | 3;               // 1 guidé · 2 autonome · 3 chrono
  kind: MissionKind;
  prompt: string;                 // français ; traduit par le dictionnaire i18n
  hint: string;
  start: Partial<SceneParams>;
  controls?: MissionControl[];    // missions 'adjust'
  targetTag?: string;             // missions 'identify' (userData.tag de l'objet attendu)
  goal?: (p: SceneParams) => boolean;
  rounds?: () => Array<Pick<MissionDef, 'prompt' | 'start' | 'goal' | 'targetTag'>>; // niveau 3
  timeLimitS?: number;
}
```

### 3.2 Points d'accroche ajoutés au moteur (sans logique de jeu)

- `getParams(): SceneParams`
- `pick(clientX, clientY): string | null` : raycasting limité aux objets portant `userData.tag`
- `setOrbitEnabled(enabled: boolean)`
- `getFxContext()` : accès à la scène, à la caméra et à un abonnement à la boucle de rendu (`onFrame(cb)`) pour `fx.ts`
- `projectToScreen(obj)` : position écran d'un objet (départ des orbes d'XP vers le HUD)

### 3.3 Machine à états (`runner.ts`)

`idle → intro → playing → (success | fail) → reward → idle`, avec `paused` atteignable depuis `playing` (onglet masqué, perte du contexte WebGL) et `aborted` (changement de chapitre ou bouton quitter, sans pénalité). Au niveau 3, `success` d'une manche enchaîne la manche suivante jusqu'à la fin de la série ou du chrono.

### 3.4 Intégration

- Bouton « ▶ Missions » sur la scène, dans Programme et Atelier 3D. Même scène, le HUD change. Pas de nouvel écran.
- **XP** : même calcul et même plafond serveur que les quiz (durcissement anti-triche existant). Le client envoie `{ missionId, stars, timeMs }`.
- **Échec** : entrée dans le Carnet d'erreurs existant.
- **BKT et badges** : mis à jour comme pour un exercice réussi ou raté du chapitre.
- **Étoiles** : enregistrées dans la progression (Supabase) si connecté, sinon en local puis synchronisées à la connexion.
- **Langues** : les consignes et indices sont ajoutés aux dictionnaires EN/NL et passent par le traducteur DOM.

## 4. Les 6 missions pilotes

Notation : ★★★ réussi au premier essai sans indice · ★★ avec indice ou en 2 essais · ★ réussi.

| Scène (preset) | ① Guidé | ② Autonome | ③ Chrono |
|---|---|---|---|
| Fractions (`fractions_3d`) | « Montre 3/4 » : glisser a, b fixé à 4 | « Représente 2/3 avec 12 tranches » → a = 8, b = 12 | Série de fractions : a en glissé horizontal, b en glissé vertical |
| Réfraction (`pc_optics_3d`) | n₁ = 1,00, n₂ = 1,33 : molette sur i₁ pour i₂ = 30° (±1°) → i₁ ≈ 42° | n₁ = 1,33, n₂ = 1,00 (eau → air) : trouver l'angle limite (±1°) → i₁ ≈ 48,8° | Identifier le bon matériau (eau, verre, diamant) pour une déviation demandée |
| ADN (`svt_dna_3d`) | « G = 30 % » → b (%A) = 20 | « 10 paires, 25 % d'adénine » → a = 10, b = 25 | Série de cibles %G ou %C → régler b |
| Frise (`hg_timeline_3d`) | Glisser la fin sur 1789 | Durée 1789 → 1848 : b = 1789, a = 1848 | Série d'événements à placer (1914, 1945, 1957, 1989…) |
| Schéma narratif (`fr_narrative_3d`) | « Schéma complet » → a = 5 | Identifier l'élément perturbateur (étiquette `step-2`) | Identifier l'étape correspondant à un extrait de conte |
| Temps anglais (`en_tense_3d`) | « Action en cours » → a = 2 | Sphère du passé et antériorité → c = 2, a = 6 | Une phrase s'affiche, identifier ou régler le temps (ex. « I have lived here since 2010 » → a = 4) |

Les valeurs cibles exactes des angles sont calculées par la loi de Snell-Descartes dans le catalogue, pas codées en dur. Les indices n₁/n₂ d'une mission sont fixés par `start` (hors des crans du curseur, c'est voulu : ils ne sont pas manipulés) ; seuls les paramètres listés dans `controls` doivent respecter bornes et crans.

**Modifications de scènes nécessaires** : étiqueter les objets à identifier (`userData.tag`) dans les constructeurs de `fr_narrative_3d` (étapes), `en_tense_3d` (sphères/temps) et `pc_optics_3d` (blocs de matériau ; si la scène n'en a qu'un, ajout de 3 blocs sélectionnables en mode mission).

**Phase 2 notée** : ADN avec placement base par base (rendre chaque base sélectionnable).

## 5. Animations et rendu

Principe : réponse à chaque geste en moins de 100 ms ; mise en scène de réussite d'environ 1,2 s, passable d'un toucher.

- **Pendant le geste** : aimantation sur chaque cran avec léger rebond et « tic » sonore ; surbrillance (liseré et pulsation de la couleur d'accent) de l'objet touché ou survolé ; flèche animée au niveau 1, masquée au premier mouvement.
- **Réussite** : léger zoom caméra avant/arrière ; rebond avec dépassement (`easeOutBack`) de l'objet de la réponse ; orbes d'XP qui volent de la scène vers le compteur du HUD ; étoiles allumées une par une avec note montante ; flamme de combo en série.
- **Erreur** : flash ambré discret, sans tremblement ; fantôme translucide de la bonne configuration animé jusqu'à l'état correct ; nouvel essai.
- **Son** : Web Audio synthétisé (aucun fichier), volume bas, bouton couper mémorisé.
- **Vibration** : `navigator.vibrate` quand disponible (Android).
- **Accessibilité** : `prefers-reduced-motion` coupe zoom caméra et particules (couleurs et son conservés) ; équivalent clavier pour tout geste (flèches pour régler, Tab/Entrée pour identifier).
- **Technique** : tweens maison dans `fx.ts` sur la boucle de rendu existante ; particules en un seul `InstancedMesh` d'environ 64 orbes réutilisés ; fantôme cloné à la demande puis libéré ; animations d'interface avec `motion` (déjà installé).

## 6. Performances et robustesse

- Budget : logique et effets ≤ 2 ms par image ; 60 images/s PC, ≥ 30 mobile.
- Rendu logiciel (`isSoftwareGl`) ou `prefers-reduced-motion` : particules et fantôme allégés.
- Aucune allocation pendant le jeu ; `dispose()` du fantôme à la fin de chaque mission.
- `pick()` ne teste que les objets étiquetés, uniquement au toucher ou au déplacement.
- Gestes : Pointer Events avec capture du pointeur ; `touch-action: none` sur la scène en mission uniquement (hors mission, la page défile normalement et la molette ne capte plus le défilement par erreur) ; rotation de caméra coupée pendant un geste de mission ; zones de toucher ≥ 44 px.
- Perte du contexte WebGL : mission en pause, reprise sans perte.
- Onglet masqué : chrono en pause (`visibilitychange`). Changement de chapitre : abandon propre, sans pénalité.
- Hors ligne ou non connecté : jouable, étoiles et XP gardés en local puis synchronisés.

## 7. Tests

1. `scripts/missions.check.ts` (assertions `node:assert`, lancé par `npx tsx`) :
   - chaque mission est atteignable dans les bornes et crans de `getParamMetadataForPreset(preset)` ;
   - `start` ne satisfait pas `goal` ;
   - transitions de la machine à états (dont pause, abandon, reprise, enchaînement des manches) ;
   - calcul des étoiles et des XP (plafond) ;
   - conversion glissé en pixels → cran de paramètre, bornes respectées.
2. Consignes et indices traduits : `scripts/i18n.check.ts` et `scripts/i18n.grade.ts` restent verts.
3. Navigateur : 3 niveaux d'au moins 2 scènes, à la souris puis en vue mobile émulée ; images/s et console vérifiées.
4. Non-régression : `tsc --noEmit`, `npm run build`, scène hors mission identique.
