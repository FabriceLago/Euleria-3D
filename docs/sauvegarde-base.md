# Sauvegarde et restauration de la base de données

**Responsable : Fabrice Lago.** Base : Supabase, projet « Euleria -D » (PostgreSQL 17, plan gratuit, sans sauvegarde automatique fournie par Supabase).

## Procédure de sauvegarde

| | |
|---|---|
| Quoi | Tout le schéma `public` : comptes élèves, progression, messages du chat, signalements, examens… |
| Quand | Automatiquement chaque nuit à 02:17 UTC (GitHub Actions, workflow « Sauvegarde de la base ») ; déclenchable à la main |
| Comment | `pg_dump` 17 (format custom), puis **chiffrement AES-256** (OpenSSL, PBKDF2 600 000 itérations) avant tout stockage |
| Où | Artefacts GitHub Actions du dépôt, **chiffrés** (le dépôt est public) |
| Combien de temps | 30 jours, puis suppression automatique |
| Contrôle d'intégrité | Empreinte SHA-256 stockée avec chaque sauvegarde ; le workflow échoue si le dump est vide |

### Secrets nécessaires (GitHub → Settings → Secrets and variables → Actions)

| Secret | Valeur |
|---|---|
| `BACKUP_PGHOST` | hôte du *Session pooler* Supabase (même valeur que `SQL_HOST` dans hPanel) |
| `BACKUP_PGPORT` | `5432` |
| `BACKUP_PGUSER` | même valeur que `SQL_USER` |
| `BACKUP_PGPASSWORD` | même valeur que `SQL_PASSWORD` |
| `BACKUP_PGDATABASE` | même valeur que `SQL_DB_NAME` (en général `postgres`) |
| `BACKUP_PASSPHRASE` | phrase secrète de chiffrement (≥ 20 caractères, générée par un gestionnaire de mots de passe) |

> ⚠️ **La phrase secrète doit être conservée hors de GitHub** (gestionnaire de mots de passe). Sans elle, aucune sauvegarde n'est récupérable.

## Procédure de restauration

**Test (à faire au moins une fois par trimestre)** — sur une base jetable, sans toucher à la production :

1. Démarrer Docker Desktop.
2. Lancer `bash scripts/db-restore-test.sh` à la racine du dépôt et saisir la phrase secrète.
3. Le script télécharge la dernière sauvegarde, vérifie son empreinte, la déchiffre, la restaure dans un PostgreSQL 17 vide, affiche le nombre de lignes de chaque table, puis **efface tout**.
4. Comparer les nombres avec la production (Supabase → SQL Editor, `SELECT count(*) FROM public.users;` etc.).
5. Noter la date et le résultat dans le registre ci-dessous.

**En cas de perte réelle de données** : mêmes étapes 1 à 3 pour récupérer le dump déchiffré, puis restauration vers Supabase avec `pg_restore --no-owner --no-privileges --clean --if-exists` sur la chaîne de connexion du projet (de préférence dans un projet Supabase neuf, que l'on vérifie avant de basculer l'application dessus).

## Registre des tests de restauration

| Date | Sauvegarde testée | Résultat | Par |
|---|---|---|---|
| 28 novembre 2026 | `euleria-2026-11-28T0025Z.dump.enc` (exécution GitHub Actions 46087741536) | ✅ Réussi : empreinte SHA-256 vérifiée, déchiffrement OK, 12 tables restaurées sans erreur, nombre de lignes identique à la production pour les 12 tables (users 2, chapters 126, exercises 378, chat_messages 1…) | Fabrice Lago |

## Limites connues

- Les sauvegardes ne couvrent pas les comptes de connexion (gérés par Firebase Authentication) : un élève restauré retrouve sa progression en se reconnectant avec le même compte Google.
- GitHub désactive les tâches planifiées d'un dépôt public sans activité pendant 60 jours : vérifier que le workflow tourne toujours.
- Perte de données possible : au plus 24 h (depuis la dernière sauvegarde nocturne).
