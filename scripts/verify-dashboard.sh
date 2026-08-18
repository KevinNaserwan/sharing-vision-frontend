#!/usr/bin/env sh
set -eu

API_URL="${API_URL:-https://be-sharing-vision.meetsin.id}"
FE_URL="${FE_URL:-https://sharing-vision-frontend-two.vercel.app}"

printf "[1/5] Load backend list (pagination)\n"
curl -sS -m 20 "$API_URL/article/10/0" >/tmp/sv_articles.json
wc -c /tmp/sv_articles.json

sample_id="$(jq -r 'first.id // empty' /tmp/sv_articles.json)"
if [ -n "$sample_id" ]; then
  printf "[2/5] Load by id %s\n" "$sample_id"
  curl -sS -m 20 "$API_URL/article/$sample_id" | head -c 220
else
  printf "[2/5] Sample article not found in first page\n"
fi
printf "\n"

printf "[3/5] UI render check\n"
curl -sS -m 20 "$FE_URL/?api=$API_URL" | head -n 20

printf "[4/5] Vercel proxy check\n"
curl -sS -m 20 "$FE_URL/api/article/10/0" | head -c 200

printf "[5/5] Draft one payload check through API\n"
curl -sS -X POST "$API_URL/article/" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Pemeriksaan Uji Integrasi Dasar","content":"Artikel ini dipakai untuk pengecekan integrasi dan validasi alur API yang stabil. Konten sengaja disiapkan panjang untuk menutup batas minimal, memastikan request create dan update tidak menolak karena aturan minimal content. Isi artikel ini digunakan sebagai payload real untuk verifikasi fitur dashboard.","category":"Integrasi","status":"draft"}' | cat
printf "\nDone\n"
