# Puding Diary — Dari Dapur Jadi Cuan

Landing page statis (HTML, CSS, JavaScript murni) untuk kelas puding hias komersial **Puding Diary**.

> "Spesialis puding hias. Anti-gagal. Bongkar trik puding bernilai jual tinggi."

---

## 🍮 Fitur Utama

- **100% Visual Berbasis Kode**: Tidak menggunakan logo gambar maupun foto stok; seluruh identitas merek ditegakkan oleh tipografi wordmark (`Calistoga` & `Lexend`), palet warna pastel & cokelat susu, aksen SVG prosedural, serta puding 3D interaktif.
- **Hias Pudingmu (Three.js 3D Interactive Studio)**:
  - Puding cokelat berbentuk cetakan klasik bergelombang (*fluted swirl bundt*) dengan material cokelat mengilap dan bayangan lembut di atas piring porselen.
  - 5 jenis bunga prosedural realistis: Mawar, Sakura, Daisy, Baby's Breath, dan Daun Segar.
  - Pilihan warna alami (Putih Salju, Soft Pink, Warm Peach, Kuning Mentega, Lavender, Merah Mawar).
  - Interaksi drag putar 360°, zoom, klik/sentuh permukaan puding untuk menempelkan bunga (raycasting), undo, clear all, dan slider ukuran bunga.
  - Fallback grafis otomatis jika browser tidak mendukung WebGL.
- **Formulir Pendaftaran Langsung ke WhatsApp**:
  - Validasi ramah Bahasa Indonesia untuk nama lengkap, domisili kota, dan format nomor telepon Indonesia.
  - Langsung mengarahkan ke nomor WhatsApp resmi `0813-2642-2626` dengan pesan otomatis terisi rapi.
- **Mobile-First & Ramah Aksesibilitas**:
  - Ukuran touch target tombol/input minimal 48–56px untuk kemudahan navigasi ibu-ibu di ponsel.
  - Lolos uji kontras WCAG AA/AAA.
  - Keyboard focus trap dan penutupan modal via tombol Esc.

---

## 🚀 Menjalankan Secara Lokal

Website ini sepenuhnya statis tanpa memerlukan build step. Cukup jalankan server lokal:

```bash
# Menggunakan Node.js
node server.js
```

Buka browser di: `http://localhost:3000`

---

## 📂 Struktur Berkas

```
puding-diary/
├── index.html       # Struktur halaman semantik & modal pendaftaran
├── style.css        # Desain token, palet warna, tipografi, dan tata letak
├── script.js        # Engine 3D Three.js, raycasting, kontrol bunga, & validasi form
├── server.js        # Server HTTP statis minimal
├── PRODUCT.md       # Dokumentasi produk & target audiens
└── DESIGN.md        # Dokumentasi design system
```

---

Dibuat dengan penuh cinta untuk memberdayakan dapur rumahan menghasilkan cuan nyata.
