# sharing-vision-frontend

Dashboard CRUD artikel untuk use case **Post Article**.

## Fitur Utama
- **All Posts**
  - Tabs: `Published`, `Drafts`, `Trashed`
  - Tabel `title`, `category`, `action`
  - Action berisi `Edit` dan `Thrashed`
- **Edit Article**
  - Mengubah `title`, `content`, `category`
  - Tombol aksi `Publish` dan `Draft`
- **Add New**
  - Form `Title`, `Content`, `Category`
  - Tombol aksi `Publish` dan `Draft`
- **Preview**
  - Menampilkan artikel dengan status `publish`
  - Navigasi `Previous` dan `Next` (pagination)

## Konfigurasi API

Frontend mengambil base URL API dari urutan prioritas berikut:
1. Query string: `?api=...`
2. Meta tag: `<meta name="api-base" ...>`
3. Fallback default:
  - `/api` saat FE dijalankan dari Vercel (melalui rewrite internal)
  - `http://be-sharing-vision.meetsin.id:8000` untuk environment lain

> Catatan: pada Vercel, endpoint diproxy lewat route `/api/*` ke
> `be-sharing-vision.meetsin.id:8000`.

## Menjalankan Secara Lokal

```bash
cd sharing-vision-frontend
python -m http.server 5173
```

Buka: `http://localhost:5173`

Opsional untuk API lokal:
`http://localhost:5173/?api=http://localhost:8000`

## Deployment (Vercel)

- Project static (HTML/CSS/JS)
- Framework preset: **Other** (atau auto-detect)
- Build command: kosong
- Output directory: `.`

Domain production saat ini:
- `https://sharing-vision-frontend-two.vercel.app`

## Daftar Pemeriksaan Manual (Runtime)

- Navigasi menu:
  - `All Posts`, `Add New`, `Preview`
- Tabs di All Posts:
  - Filter ke `Published`, `Drafts`, `Trashed`
- Tombol:
  - `Publish` / `Draft` saat tambah dan edit
- Aksi:
  - Klik icon edit → membuka form edit
  - Klik icon trash → status berubah ke `thrash`
- Pagination:
  - `Previous` dan `Next` aktif/nonaktif sesuai offset
