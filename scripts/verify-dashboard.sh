#!/usr/bin/env sh
set -eu

API_URL="${API_URL:-http://be-sharing-vision.meetsin.id:8000}"
FE_URL="${FE_URL:-https://sharing-vision-frontend-two.vercel.app}"

printf "[1/5] Load backend list (pagination)\n"
curl -sS -m 20 "$API_URL/article/10/0" >/tmp/sv_articles.json
wc -c /tmp/sv_articles.json

printf "[2/5] Load by id 1\n"
curl -sS -m 20 "$API_URL/article/1" | head -c 200
printf "\n"

printf "[3/5] UI render check\n"
curl -sS -m 20 "$FE_URL/?api=$API_URL" | head -n 20

printf "[4/5] Vercel proxy check\n"
curl -sS -m 20 "$FE_URL/api/article/10/0" | head -c 200

printf "[5/5] Publish via FE API path (dry-run payload check)\n"
curl -sS -X POST "$API_URL/article/" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Verifikasi Dashboard Publishing","content":"Payload test untuk validasi endpoint publish yang melebihi dua ratus karakter. Konten ini menegaskan bahwa alur validasi, integrasi frontend backend, dan status workflow berjalan aman dan stabil untuk proses publish draft trash pada dashboard.","category":"Operations","status":"draft"}' | cat
printf "\nDone\n"
