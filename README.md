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

Aplikasi membaca API base dari salah satu urutan:
1. `<meta name="api-base" content="...">` pada `index.html`
2. Query string `?api=https://domain-backend.com`
3. Fallback `http://localhost:8000`

Contoh:

```text
https://nama-project.vercel.app/?api=https://your-backend-domain.com
```

## Deploy Frontend ke Vercel (Gratis)

Langkah cepat:

1. Pastikan project sudah di GitHub.
2. Buka [vercel.com/import](https://vercel.com/import).
3. Import repo `sharing-vision-frontend`.
4. Framework preset: **Other**.
5. Build Command: (kosong), Output Directory: `.`.
6. Deploy.

Opsional: gunakan Vercel CLI:

```bash
cd sharing-vision-frontend
vercel
```

## Repo

- Frontend: https://github.com/KevinNaserwan/sharing-vision-frontend
