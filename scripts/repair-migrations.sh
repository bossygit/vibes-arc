#!/usr/bin/env bash
# Répare l'historique des migrations Supabase quand les timestamps locaux
# ne correspondent plus aux versions distantes (fichiers renommés).
#
# Usage: ./scripts/repair-migrations.sh
# Prérequis: supabase CLI connecté au projet (supabase link)

set -euo pipefail

echo "→ Réversion des anciennes migrations distantes orphelines..."
supabase migration repair --status reverted \
  20260321184711 20260321200757 \
  20260421093709 20260421103957 20260421105828

echo "→ Marquage des migrations locales consolidées comme déjà appliquées..."
supabase migration repair --status applied 20260321 20260421 20260422

echo "→ Push des nouvelles migrations..."
supabase db push

echo "→ État final:"
supabase migration list
