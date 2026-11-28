# Performance mobile et repli sans 3D (audit 3.8) — 28/11/2026

## Mesure

Chargement à froid (sans cache ni service worker), mobile 412 × 823, réseau « Slow 4G », processeur ralenti ×4
(réglages mobiles de Lighthouse). Build servi compressé avec les vraies données de l'API. Le score est **estimé** à partir des
5 métriques et des courbes de notation de Lighthouse ; le score officiel se lit sur PageSpeed Insights après mise en ligne.

| Métrique | Avant | Après |
|---|---|---|
| Premier affichage (FCP) | 6,2 s | 1,9 – 2,8 s |
| Plus grand élément (LCP) | 8,0 s | 1,9 – 2,8 s |
| Temps de blocage (TBT) | 1,9 s | 0,4 – 0,9 s |
| Décalage de mise en page (CLS) | 0,10 | 0,00 |
| JavaScript au démarrage | 518 Ko | 222 Ko |
| **Score estimé** | **≈ 29** | **≈ 77 – 83** |

## Corrections

1. **3D chargée à la demande** (`src/components/Viewport3D.tsx`) : Three.js et la scène (~250 Ko compressés) ne sont plus
   téléchargés au démarrage, seulement quand la carte 3D approche de l'écran.
2. **Supabase chargé au premier usage** (`getSupabase()` dans `src/lib/supabase.ts`) : la bibliothèque de secours (~55 Ko)
   sort du démarrage.
3. **Coquille de premier affichage** dans `index.html` : l'élève voit le titre tout de suite, avant le JavaScript.
4. **Pied de page** : la zone de contenu fait au moins un écran de haut, le pied de page n'est plus repoussé (CLS).
5. **Polices** `display=optional` : à la première visite lente, le texte reste dans la police système au lieu de basculer en
   cours de route (chaque bascule recalculait toute la page) ; les polices servent aux visites suivantes.

## Repli sans WebGL

Testé en désactivant WebGL : la carte « La 3D n'est pas disponible sur cet appareil » remplace la scène, Three.js n'est
jamais téléchargé, le cours, la fiche, les flashcards et les exercices restent utilisables. Traduit en anglais et néerlandais.
Three.js r187 exige WebGL 2 : c'est ce qui est testé.

## Piste suivante si le score officiel reste sous 80

Les données du programme (~90 Ko compressés) sont encore chargées au démarrage alors qu'elles ne servent qu'en mode hors
ligne : les séparer des constantes (matières, classes) retirerait leur analyse du démarrage.
