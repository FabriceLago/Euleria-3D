# Accessibilité (audit 3.7) — 28/11/2026

## Lighthouse — accessibilité (mobile)

| Section | Avant (site en ligne) | Après |
|---|---|---|
| Programme | 95 | 100 |
| Quiz & Examens | 95 | 100 |
| Atelier 3D | 100 | 100 |
| Bilan & Rang | 93 | 100 |
| Entraide | 100 | 100 |

Corrigé : contraste insuffisant de petits textes gris (compteurs « 21 chapitres », « 0/5 », détails du quiz,
« / 400 XP ») et un niveau de titre sauté dans le plan de révision (h3 → h2).

## Test au clavier (sans souris)

| Vérification | Résultat |
|---|---|
| Premier Tab : lien « Aller au contenu », visible, Entrée envoie le focus sur le contenu | OK |
| Ordre de Tab : logo → menu → langue → connexion → personnalisation → matières → chapitres | OK, logique |
| Focus visible partout (contour indigo 2 px, clair en mode sombre ; rien au clic souris) | OK |
| Menu et chapitres : vrais liens, Entrée suit le lien | OK |
| Panneau « Personnalisation » : le focus entre, Tab/Maj+Tab restent dedans, Échap ferme, le focus revient au bouton | OK |
| Mêmes règles pour les règles du chat et le guide d'installation ; écran d'âge : focus piégé, pas d'Échap (étape obligatoire, bouton Annuler) | OK |
| Curseurs de la scène 3D : champs natifs, flèches du clavier | OK |
