#!/usr/bin/env bash
# Test de restauration de la dernière sauvegarde (voir docs/sauvegarde-base.md).
#   1. Télécharge la dernière sauvegarde réussie (GitHub Actions)
#   2. La déchiffre avec la phrase secrète (demandée au clavier, jamais affichée)
#   3. La restaure dans un PostgreSQL 17 jetable (Docker), compte les lignes de chaque table
#   4. Efface tout : conteneur et fichiers (ils contiennent des données d'élèves)
# Prérequis : gh (connecté), docker, openssl.   Lancement : bash scripts/db-restore-test.sh
set -euo pipefail

CONTAINER=euleria-restore-test
docker info >/dev/null 2>&1 || { echo "Docker ne répond pas : démarre Docker Desktop puis relance."; exit 1; }
WORK=$(mktemp -d)
cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "1/4 Téléchargement de la dernière sauvegarde réussie…"
RUN_ID=$(gh run list --workflow db-backup.yml --status success --limit 1 --json databaseId -q '.[0].databaseId')
[ -n "$RUN_ID" ] || { echo "Aucune sauvegarde réussie trouvée."; exit 1; }
gh run download "$RUN_ID" --dir "$WORK"
ENC=$(find "$WORK" -name 'euleria-*.dump.enc' | head -1)
echo "   Sauvegarde : $(basename "$ENC") (exécution $RUN_ID)"
(cd "$(dirname "$ENC")" && sha256sum -c "$(basename "$ENC").sha256")

echo "2/4 Déchiffrement…"
if [ -z "${BACKUP_PASSPHRASE:-}" ]; then
  read -rsp "   Phrase secrète de sauvegarde : " BACKUP_PASSPHRASE; echo
fi
# Un collage sous Windows ajoute souvent un retour chariot invisible : on retire \r et les espaces de bord
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE//$'\r'/}"
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE#"${BACKUP_PASSPHRASE%%[![:space:]]*}"}"
BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE%"${BACKUP_PASSPHRASE##*[![:space:]]}"}"
echo "   (phrase reçue : ${#BACKUP_PASSPHRASE} caractères)"
export BACKUP_PASSPHRASE
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in "$ENC" -out "$WORK/backup.dump"
unset BACKUP_PASSPHRASE

echo "3/4 Restauration dans un PostgreSQL 17 vide…"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=restore-test postgres:17 >/dev/null
for _ in $(seq 1 60); do docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break; sleep 1; done
docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 || { echo "PostgreSQL n'a pas démarré en 60 s."; exit 1; }
# Ce que Supabase fournit et que les politiques RLS du dump utilisent
docker exec -i "$CONTAINER" psql -q -U postgres -v ON_ERROR_STOP=1 <<'SQL'
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
SQL
docker cp "$WORK/backup.dump" "$CONTAINER:/backup.dump"
# MSYS_NO_PATHCONV : sous Git Bash (Windows), « /backup.dump » serait réécrit en chemin Windows
MSYS_NO_PATHCONV=1 docker exec "$CONTAINER" pg_restore -U postgres -d postgres --no-owner --no-privileges --clean --if-exists /backup.dump \
  || echo "   (avertissements de pg_restore ci-dessus : vérifier qu'aucun ne concerne une table)"

TABLES=$(docker exec "$CONTAINER" psql -U postgres -At -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
[ "$TABLES" -gt 0 ] || { echo "ÉCHEC : aucune table restaurée."; exit 1; }
echo "4/4 Nombre de lignes par table restaurée ($TABLES tables) :"
docker exec -i "$CONTAINER" psql -q -U postgres -At <<'SQL'
DO $$
DECLARE t text; n bigint;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY 1 LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
    RAISE NOTICE '%', rpad(t, 28) || n;
  END LOOP;
END $$;
SQL
echo "Restauration terminée. Comparer ces nombres avec la production, puis noter la date dans docs/sauvegarde-base.md."
