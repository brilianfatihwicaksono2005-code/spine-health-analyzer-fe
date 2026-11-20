# Spine Health Biomechanical Analyzer - Frontend

Single-page application untuk analisis biomekanik tulang belakang melalui enam parameter spinopelvik: pelvic incidence, pelvic tilt, lumbar lordosis angle, sacral slope, pelvic radius, dan degree of spondylolisthesis.

## Fitur Utama

- **X-Ray Analyzer:** Unggah file `.dcm`, `.png`, `.jpg`, atau `.jpeg`; tempatkan dan geser tujuh landmark pada HTML5 Canvas; hitung parameter geometri secara real-time; lalu kirim fitur untuk prediksi.
- **Manual Input & What-If Simulator:** Atur enam parameter melalui input angka dan slider tersinkron, pilih preset klinis, dan gunakan Instant Predict atau kalkulasi manual.
- **Batch CSV Analysis:** Unggah CSV, tinjau ringkasan kelas, cari atau filter hasil, lalu ekspor baris yang ditampilkan sebagai CSV.
- **Anatomy & Landmark Guide:** Referensi definisi parameter, rentang klinis, urutan landmark, dan panduan penempatannya.

## Tech Stack

- React dan React DOM `^19.3.1`
- TypeScript `~7.0.2`
- Vite `^8.3.6` dengan `@vitejs/plugin-react` `^6.1.2`
- Tailwind CSS utility classes digunakan pada sumber UI; `tailwindcss` tidak tercantum sebagai dependency langsung di `package.json`
- Lucide React `^1.77.0` untuk ikon
- Oxlint `^1.90.0` untuk lint

## Struktur Direktori

```text
frontend/
├── public/
│   └── samples/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── spine.ts
│   ├── utils/
│   │   └── geometry.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── index.html
├── package.json
└── README.md
```

## Instalasi dan Menjalankan Secara Lokal

Clone repositori, masuk ke direktori frontend, lalu pasang dependensi:

```sh
git clone https://github.com/brilianfatihwicaksono2005-code/spine-health-analyzer-fe.git
cd spine-health-analyzer-fe/frontend
npm install
```

Salin `.env.example` menjadi `.env`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS atau Linux:

```sh
cp .env.example .env
```

Contoh konfigurasi:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true` memakai implementasi simulasi frontend dan tidak memerlukan backend.
- `VITE_USE_MOCK=false` mengirim request ke FastAPI pada `VITE_API_BASE_URL`. Nilai default URL adalah `http://localhost:8000`. Konfigurasikan CORS backend untuk menerima origin frontend `http://localhost:5173`.

Jalankan server pengembangan:

```sh
npm run dev
```

Buka URL yang ditampilkan Vite, biasanya `http://localhost:5173`.

### Script npm

| Script | Perintah | Kegunaan |
| --- | --- | --- |
| `npm run dev` | `vite` | Menjalankan server pengembangan. |
| `npm run build` | `tsc -b && vite build` | Memeriksa TypeScript dan membangun aset produksi. |
| `npm run lint` | `oxlint` | Menjalankan lint pada proyek. |
| `npm run preview` | `vite preview` | Menyajikan build produksi secara lokal. |

## Kontrak Endpoint Backend

Base URL berasal dari `VITE_API_BASE_URL`. Pada mode non-mock, frontend menggunakan endpoint berikut:

| Endpoint | Parameter utama | Fungsi |
| --- | --- | --- |
| `GET /api/health` | Tidak ada | Memeriksa status layanan; respons memuat `status` dan `model_loaded`. |
| `POST /api/xray/process` | `multipart/form-data`, field `file`; menerima DICOM atau gambar PNG/JPG/JPEG | Memproses citra. Respons memuat `image_base64`, `width`, `height`, `pixel_spacing_mm`, dan `is_dicom`. |
| `POST /api/predict` | JSON berisi `pelvic_incidence`, `pelvic_tilt`, `lumbar_lordosis_angle`, `sacral_slope`, `pelvic_radius`, `degree_spondylolisthesis` | Mengembalikan `prediction`, `probabilities`, dan `clinical_flags`. |
| `POST /api/predict/batch` | `multipart/form-data`, field `file` berisi CSV dengan enam kolom fitur yang sama seperti di atas | Mengembalikan `total_rows`, `summary`, dan `results`. Setiap hasil memuat `row_index`, enam nilai fitur, `prediction`, dan `confidence`. |

Kesalahan validasi atau request ditampilkan pada antarmuka. Untuk integrasi lokal non-mock, pastikan backend berjalan dan mengizinkan request dari origin Vite.
