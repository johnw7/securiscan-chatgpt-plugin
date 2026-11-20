#!/usr/bin/env bash
# =============================================================================
# NOAMIS 360° — sauvegarde logique de la base (schéma + données + comptes).
# Usage : SUPABASE_DB_URL="postgresql://postgres.[ref]:[mot-de-passe]@[hôte]:5432/postgres" ./scripts/backup.sh
# (chaîne de connexion « Session pooler » du tableau de bord Supabase ; ne jamais la versionner)
# Produit dans ./backups/AAAA-MM-JJ/ : schema.sql, public.dump, auth.dump, sha256sum.txt
# La restauration est décrite et a été vérifiée : docs/OPERATIONS.md § Restauration.
# =============================================================================
set -euo pipefail
: "${SUPABASE_DB_URL:?Variable SUPABASE_DB_URL requise}"
DIR="backups/$(date -u +%F)"
mkdir -p "$DIR"
umask 077

pg_dump "$SUPABASE_DB_URL" --schema-only --schema=public --schema=private --no-owner --file="$DIR/schema.sql"
pg_dump "$SUPABASE_DB_URL" --data-only --schema=public --format=custom --file="$DIR/public.dump"
pg_dump "$SUPABASE_DB_URL" --data-only -t auth.users -t auth.identities -t auth.mfa_factors --format=custom --file="$DIR/auth.dump"
( cd "$DIR" && sha256sum schema.sql public.dump auth.dump > sha256sum.txt )

echo "Sauvegarde écrite dans $DIR (à chiffrer et stocker hors site, ex. coffre chiffré)."
echo "Les fichiers du stockage (documents, photos) se sauvegardent séparément : voir docs/OPERATIONS.md."
