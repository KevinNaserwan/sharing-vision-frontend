# sharing-vision-frontend

Frontend dashboard artikel untuk use case Sharing Vision.

## Fitur

- **All Posts**
  - Tabs: `Published`, `Drafts`, `Trashed`
  - Tabel menampilkan `title`, `category`, dan `action`
  - `Action`: icon Edit dan icon Thrashed
- **Edit Article**
  - Edit `title`, `content`, `category`
  - Tombol `Publish` dan `Draft`
- **Add New**
  - Form `Title`, `Content`, `Category`
  - Tombol `Publish` dan `Draft`
- **Preview**
  - Menampilkan artikel dengan `status = publish` dan pagination

## Konfigurasi API

Aplikasi membaca API base dari urutan berikut:

1. `<meta name="api-base" content="...">` di `index.html`
2. Query string `?api=https://your-backend.com`
3. Fallback `https://be-sharing-vision.meetsin.id`

## Running Lokal

```bash
cd sharing-vision-frontend
python -m http.server 5173
```

Buka: `http://localhost:5173`

Untuk mengarah ke backend lokal: `http://localhost:5173/?api=http://localhost:8000`

## Deploy ke Vercel

Production URL:
- https://sharing-vision-frontend-two.vercel.app

1. Push repo ke GitHub.
2. Import di Vercel.
3. Framework preset: **Other**.
4. Build Command: ` ` (kosong).
5. Output Directory: `.`.
6. Deploy.

## Repo

- Frontend: https://github.com/KevinNaserwan/sharing-vision-frontend
