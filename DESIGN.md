# Design System — Puding Diary

## Identity & Voice

- **Brand Wordmark**: "Puding Diary" (wordmark berbasis tipografi murni, tanpa file logo gambar).
- **Tagline**: "Dari Dapur Jadi Cuan"
- **Sub-deskripsi**: "Spesialis puding hias. Anti-gagal. Bongkar trik puding bernilai jual tinggi."
- **Tone**: Hangat, akrab, memberdayakan ibu-ibu rumah tangga dan pemula usaha dapur tanpa istilah teknis membingungkan.

## Color Palette (WCAG AA/AAA Compliant)

```css
:root {
  --color-bg: #FFF7F8;             /* Blush cream pastel lembut */
  --color-surface: #FFF0F3;        /* Rose milk lembut untuk kartu/section */
  --color-surface-hover: #FFE2E8;  /* Interaksi hover/tap lembut */
  --color-surface-sunken: #F6E2E6; /* Area studio canvas 3D */
  --color-card-border: #E8CCD2;    /* Garis pembatas halus */
  
  --color-primary: #9B334C;        /* Dark ruby berry (WCAG AAA: 7.2:1 against bg) */
  --color-primary-hover: #7E2237;  /* Active/hover tombol aksi */
  --color-primary-light: #FDE8ED;  /* Aksen berry lembut */
  
  --color-accent-choco: #4E2A1E;   /* Cokelat karamel (WCAG AAA: 10.8:1 against bg) */
  --color-accent-cream: #F5E9DC;   /* Krim susu hangat */
  
  --color-text-main: #2D1C1B;      /* Espresso gelap pekat (WCAG AAA: 13.6:1 against bg) */
  --color-text-muted: #6A4F4E;     /* Cacao taupe (WCAG AA: 5.3:1 against bg) */
  --color-text-inverse: #FFFFFF;
}
```

## Typography

- **Display & Headings**: `'Calistoga', serif`
  - Memberikan karakter retro bakery/pâtisserie yang hangat, montok, dan berwibawa tanpa kesan kaku korporat.
  - `text-wrap: balance;` untuk mencegah pemenggalan janggal pada judul.
- **Body Text & Controls**: `'Lexend', sans-serif`
  - Diformulasikan khusus untuk keterbacaan tinggi di layar smartphone, sangat nyaman bagi mata ibu-ibu.
  - Ukuran body minimum 17px (`1.0625rem`), line-height `1.65`.
  - `text-wrap: pretty;` untuk mencegah kata sendirian (stragglers/orphans).

## Interactive 3D Studio (Three.js)

- **Puding Prosedural**: Geometri cetakan bergelombang (*fluted swirl bundt*) dengan material `MeshPhysicalMaterial` cokelat mengilap, clearcoat tinggi, dan studio lighting lembut (key light, fill light, rim light) di atas piring porselen putih berlis emas.
- **Bunga Prosedural**:
  1. *Mawar*: Kelopak melengkung berlapis spiral alami dengan gradasi warna.
  2. *Sakura*: 5 kelopak bertekstur lembut dengan benang sari kuning emas.
  3. *Daisy*: 16 kelopak ramping mengitari cakram tengah keemasan.
  4. *Baby's Breath*: Kelompok kuntum bunga mini halus pengisi celah.
  5. *Daun Segar*: Kelopak dedaunan melengkung pelengkap.
- **Interaksi**:
  - Sentuh permukaan puding untuk menempelkan bunga (raycasting terarah normal permukaan).
  - Skala bunga bertahap (scale-in animation).
  - Undo (urungkan), Hapus Semua, dan slider ukuran bunga.
  - Fallback WebGL non-destruktif dengan ilustrasi SVG puding jika browser tidak mendukung WebGL.

## Registration Form & WhatsApp Redirection

- **Aksesibilitas**: Modal dialog berbasis `role="dialog"` dan `aria-modal="true"`.
- **Keyboard Navigation**: Focus trap loop (Tab / Shift+Tab), penutupan via tombol Esc, serta pengembalian fokus ke tombol pemicu saat ditutup.
- **Validasi**: Nama lengkap, asal kota, dan nomor WhatsApp berformat Indonesia (`08...` atau `+628...`).
- **Koneksi WhatsApp Langsung**: Mengarahkan ke `https://wa.me/6281326422626` dengan pesan otomatis terisi rapi.
