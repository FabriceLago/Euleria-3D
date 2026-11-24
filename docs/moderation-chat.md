# Modération du chat — décision

**Décidé le 24 novembre 2026 par Fabrice Lago (éditeur d'Euleria 3D).**

## Qui modère, et en combien de temps

- **Modérateur : Fabrice Lago**, seul modérateur à ce jour.
- **Délai : chaque signalement est examiné sous 24 heures** (revue quotidienne).
- Entre deux revues, la protection est automatique : un message signalé par **3 élèves différents** est masqué pour tout le monde et retiré en direct des écrans.

## Ce qui protège les élèves en permanence

| Mesure | Fonctionnement |
|---|---|
| Pas de HTML interprété | Les messages sont affichés comme du texte brut : une balise ou un script ne s'exécute jamais. |
| Limite de débit | 10 messages par minute et par élève (et 60 par minute par adresse IP). |
| Signaler | Bouton sous chaque message d'un autre élève. Un signalement par élève et par message. |
| Masquage automatique | Au 3ᵉ signalement d'élèves différents, le message est masqué pour tous. |
| Masquer pour soi | Chaque élève peut cacher un message pour lui seul. |
| Pas de messages privés | Aucune conversation privée entre élèves : tout se passe dans des salons visibles. |
| Pseudonymes | Les élèves n'apparaissent que sous un pseudonyme tiré au sort, jamais sous leur nom. |

## Revue quotidienne (Supabase → SQL Editor)

**1. Messages signalés, du plus signalé au moins signalé :**

```sql
SELECT m.id, m.content, m.created_at, m.hidden_at, COUNT(r.id) AS signalements
FROM public.chat_messages m
JOIN public.chat_message_reports r ON r.message_id = m.id
GROUP BY m.id
ORDER BY signalements DESC, m.created_at DESC;
```

**2. Masquer un message (remplacer 123 par son identifiant) :**

```sql
UPDATE public.chat_messages SET hidden_at = NOW() WHERE id = 123;
```

**3. Rétablir un message masqué à tort :**

```sql
UPDATE public.chat_messages SET hidden_at = NULL WHERE id = 123;
```

**4. Retrouver tous les messages d'un même auteur** (pour un comportement répété) :

```sql
SELECT m.id, m.content, m.created_at, m.hidden_at
FROM public.chat_messages m
WHERE m.user_id = (SELECT user_id FROM public.chat_messages WHERE id = 123)
ORDER BY m.created_at DESC;
```

## En cas de contenu grave

Harcèlement, menace, contenu sexuel ou mise en danger d'un mineur : masquer immédiatement le message, conserver une trace (capture + identifiant), prévenir les parents ou l'établissement concernés, et signaler aux autorités si nécessaire (en France : 3018 ; en Belgique : Child Focus 116 000).
