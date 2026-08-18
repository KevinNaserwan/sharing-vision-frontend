# sharing-vision-frontend

Dashboard artikel (Vanilla JS) sesuai spesifikasi:

- All Posts: tabs `Published`, `Drafts`, `Trashed`
- Setiap tab menampilkan tabel (`title`, `category`, `action`)
- Action: icon edit dan icon thrash
- Edit artikel: form title/content/category + tombol Publish & Draft
- Add New: form title/content/category + tombol Publish & Draft
- Preview: menampilkan artikel dengan status `publish` dan pagination

## Menjalankan

```bash
cd sharing-vision-frontend
python -m http.server 5173
```

Akses `http://localhost:5173`.

Backend API default: `http://localhost:8000`.

Untuk menghubungkan backend jika host berbeda, ubah `API_BASE` di `script.js`.
