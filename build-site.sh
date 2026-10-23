#!/usr/bin/env bash
# Construit le dossier public/ publié par Render (Static Site).
# Seuls les fichiers du site sont copiés : backend/, anciens dossiers et fichiers internes restent privés.
set -euo pipefail

rm -rf public
mkdir -p public

cp ./*.html yames.js yames.css robots.txt sitemap.xml favicon.ico public/
cp -r img public/
find public/img -name '*.crdownload' -delete

echo "Site prêt dans public/ : $(find public -type f | wc -l) fichiers"
