# sharing-vision-frontend

Frontend Dashboard Artikel untuk use case Sharing Vision.

## Fitur

- **All Posts**
  - Tabs: `Published`, `Drafts`, `Trashed`
  - Table menampilkan `title`, `category`, dan `action`
  - Aksi action:
    - ✏️ Edit
    - 🗑️ Thrashed
- **Edit Article**
  - Edit `title`, `content`, `category`
  - Tombol aksi `Publish` dan `Draft`
- **Add New**
  - Form `Title`, `Content`, `Category`
  - Tombol `Publish` dan `Draft`
- **Preview**
  - Tampilkan artikel dengan `status = publish`
  - Pagination

## Cara Running Lokal

1. Pastikan backend berjalan di `http://localhost:8000`.
2. Jalankan static server:

```bash
cd sharing-vision-frontend
python -m http.server 5173
```

3. Buka: `http://localhost:5173`

## Konfigurasi API Endpoint

Default API base di file HTML: 
- `<meta name="api-base" content="http://localhost:8000">`

Untuk environment lain (mis. deployment), gunakan salah satu cara:

1. Ubah nilai meta `api-base` di `index.html`.
2. Akses dengan query param:

```text
https://<vercel-domain>.vercel.app/?api=https://your-backend-domain/api
```
3. Atau set global JS variable sebelum load script.

## Deploy Frontend ke Vercel (Gratis)

1. Buat repo frontend di GitHub (sudah disiapkan).
2. Buka https://vercel.com/import dan import repo `sharing-vision-frontend`.
3. Pilih **Framework Preset**: **Other**.
4. Build Command: **kosong** (karena static HTML).
5. Output Directory: `.`
6. Deploy.
7. Jika backend beda domain, edit `index.html` `meta api-base` atau gunakan URL `?api=...`.

