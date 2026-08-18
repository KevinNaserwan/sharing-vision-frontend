# sharing-vision-frontend

Dashboard CRUD artikel untuk use case **Post Article**.

## Fitur Utama
- **All Posts**
  - Tabs: `Published`, `Drafts`, `Trashed`
  - Tabel `title`, `category`, `action`
  - Action berisi icon `Edit` dan `Trash`; tombol `Undo` hanya muncul di tab `Trashed` untuk kembalikan ke `Draft`
  - Search + filter title/category
  - Pagination numerik di atas dan di bawah tabel
  - Kontrol jumlah baris tampil
- **Edit Article**
  - Mengubah `title`, `content`, `category`
  - Tombol aksi `Publish` dan `Draft`
- **Add New**
  - Form `Title`, `Content`, `Category`
  - Tombol aksi `Publish` dan `Draft`
- **Preview**
  - Menampilkan artikel dengan status `publish`
  - Pagination numerik di atas dan di bawah daftar publish
  - Kontrol jumlah card per halaman
  - Klik "Baca selengkapnya" untuk membuka halaman artikel penuh (tanpa modal)
  - Tidak menampilkan id artikel pada kartu list

## Konfigurasi API

Frontend mengambil base URL API dari urutan prioritas berikut:
1. Query string: `?api=...`
2. Meta tag: `<meta name="api-base" ...>`
3. Fallback default:
  - `/api` saat FE dijalankan dari Vercel (melalui rewrite internal)
  - `https://be-sharing-vision.meetsin.id` untuk environment lain

> Catatan: pada Vercel, endpoint diproxy lewat route `/api/*` ke
> `https://be-sharing-vision.meetsin.id`.

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

1) Buka halaman: `https://sharing-vision-frontend-two.vercel.app/?api=https://be-sharing-vision.meetsin.id`
2) All Posts → verifikasi tab `Published`, `Drafts`, `Trashed`
3) Add New → isi title/content/category, klik Publish/Draft
4) Klik Edit pada row → edit title/content/category, update status via Publish/Draft
5) Klik Trash icon → status berpindah ke tab Trashed
6) Preview → pastikan hanya menampilkan status `Publish`, pagination numerik berfungsi, dan filter halaman berfungsi

### Command untuk smoke test endpoint API (melalui FE proxy)

```bash
curl -sS https://sharing-vision-frontend-two.vercel.app/api/article/10/0
```

## CI/CD

- Frontend CI tersedia di GitHub Actions: `.github/workflows/ci.yml`
- Pipeline memeriksa:
  - install dependencies Node
  - unit test (`npm test`)
- CI otomatis jalan pada setiap `push` dan `pull_request`.
- Untuk verifikasi full stack: pastikan workflow backend (`backend-ci`) juga berstatus ✅.

## Deployment status CI/CD

- Frontend: workflow `frontend-ci` di repo ini harus hijau.
- Backend: workflow `backend-ci` di repo `sharing-vision-backend` harus hijau.
- API proxy FE (`/api/...`) dan endpoint publik backend (`https://be-sharing-vision.meetsin.id`) valid jika end-to-end smoke test di README sebelumnya berhasil.

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
  - All Posts: angka halaman + batas jumlah baris
  - Preview: angka halaman + batas jumlah card per halaman
