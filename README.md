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

## Testing

### Unit Test Frontend (pure utility)

```bash
cd sharing-vision-frontend
npm test
```

### Real Test (Dashboard Workflow)

1) Buka halaman: `https://sharing-vision-frontend-two.vercel.app/?api=https://be-sharing-vision.meetsin.id:8000`
2) All Posts → verifikasi tab `Published`, `Drafts`, `Trashed`
3) Add New → isi title/content/category, klik Publish/Draft
4) Klik Edit pada row → edit title/content/category, update status via Publish/Draft
5) Klik Trash icon → status berpindah ke tab Trashed
6) Preview → pastikan hanya menampilkan status `Publish` dan `Previous/Next` aktif berdasarkan data

### Command untuk smoke test endpoint API (melalui FE proxy)

```bash
curl -sS https://sharing-vision-frontend-two.vercel.app/api/article/10/0
```

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
