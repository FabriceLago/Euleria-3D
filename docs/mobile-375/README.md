# Test mobile 375 px (audit 3.6) — 28/11/2026

Build de production, Chrome en émulation mobile 375 × 812 (tactile, densité 2).

**Méthode** : pour chaque section (et chaque matière, chaque onglet de chapitre), un script mesure la largeur
de la page et liste tout élément qui dépasse 375 px hors zone défilante. Résultat final : largeur 375 px partout, 0 élément qui déborde.

| Problème trouvé | Correction |
|---|---|
| Barre du haut : bouton « Connexion Google » hors écran (page large de 429 px) | Libellé court « Connexion » sous 640 px, espacement réduit |
| Menu mobile : « Entraide » coupé | 5 colonnes égales, libellés sur deux lignes, cibles ≥ 44 px |
| Quiz : rangée de matières hors écran (page large de 631 px) | La rangée passe à la ligne |
| Onglets du chapitre (Cours / Fiche / Flashcards) : compteur hors écran | La rangée passe à la ligne |
| Scène 3D : réglages ouverts recouvrant tout le modèle ; boutons « Missions » et « Masquer » superposés | Réglages repliés au départ sur téléphone ; « Missions » en haut à droite, titre rétréci |
| Texte visible à travers la barre du haut | Barre opaque |

Captures : `1-programme` … `6-entraide`. Le bandeau « Mode hors ligne » vient de l'environnement de test
(base de données injoignable en local), pas du site en ligne.
