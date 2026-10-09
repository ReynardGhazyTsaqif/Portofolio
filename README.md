# Portofolio Reynard Ghazy Tsaqif

Situs portofolio dua bahasa (EN/ID) di [reynarddev.vercel.app](https://reynarddev.vercel.app), dengan konten dari Sanity.

- **Web:** Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4
- **Animasi:** GSAP 3.15 (ScrollTrigger, SplitText, Flip), Lenis, WebGL untuk hero Danau Maninjau
- **CMS:** Sanity Studio di folder `studio/`, di-deploy di `/studio`

## Menjalankan secara lokal

```bash
npm install
npm run dev          # http://localhost:3000 (otomatis diarahkan ke /en atau /id)
npm run build        # build produksi
npm run lint
npm run typecheck    # generate tipe route lalu tsc
```

Studio:

```bash
cd studio
npm install
npm run dev          # http://localhost:3333
```

## Variabel lingkungan

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | tidak | Bawaannya `yapgdhy0` (dataset publik, read-only). |
| `NEXT_PUBLIC_SANITY_DATASET` | tidak | Bawaannya `production`. |
| `SANITY_REVALIDATE_SECRET` | untuk webhook | Rahasia bersama dengan webhook Sanity, lihat di bawah. |

Untuk Studio: `SANITY_STUDIO_PROJECT_ID` dan `SANITY_STUDIO_DATASET` (lihat `studio/.env.example`).

## Konten di Sanity

Semua teks situs baru ada di grup **"Situs baru (v2)"** dan **"Studi kasus"** pada tiap dokumen. Field dua bahasa punya kolom English dan Bahasa Indonesia; kalau kolom Indonesia kosong, situs memakai versi English.

| Dokumen | Tampil di |
|---|---|
| Profile | Hero, About, Contact |
| Project | Home (rel karya), Work, `/work/<slug>` |
| Experience | Home, About (timeline) |
| Education, Achievement, Certificate | About |
| Technology | About (skill; isi Category agar masuk kelompok yang benar) |
| Note | Notes, `/notes/<slug>` (satu catatan per bahasa; hubungkan terjemahan lewat field Translation) |
| Playground item | Playground |

Dokumen draft tidak tampil sampai di-**Publish**.

Migrasi satu kali yang mengisi field v2 dari konten lama (aman diulang, tidak menimpa apa pun):

```bash
cd studio
npx sanity exec migrations/v2-content.mjs --with-user-token
```

## Perubahan konten langsung tampil (webhook)

Tanpa webhook, perubahan di Sanity muncul di situs dalam beberapa menit (cache). Supaya langsung:

1. Di Vercel, tambahkan environment variable `SANITY_REVALIDATE_SECRET` berisi string acak panjang, lalu redeploy.
2. Di [sanity.io/manage](https://www.sanity.io/manage) → project → **API → Webhooks → Create webhook**:
   - URL: `https://reynarddev.vercel.app/api/revalidate?secret=<rahasia yang sama>`
   - Dataset: `production`, Trigger on: Create, Update, Delete
   - HTTP method: `POST`, tanpa filter, tanpa projection
3. Simpan, lalu publish perubahan kecil untuk mengetes. Respons webhook `{"ok":true}` berarti berhasil.

## Struktur singkat

```
src/app/[lang]/        halaman per bahasa (root layout ada di sini)
src/app/api/revalidate webhook Sanity
src/components/hero/   hero Maninjau: scene.ts (bentuk & palet), renderer.ts (shader), handwriting.ts
src/components/        home, about, work, playground, motion (animasi), site (navbar, footer, dll.)
src/i18n/              kamus EN/ID dan pemilihan bahasa
src/lib/sanity/        client, query (di-cache), tipe
scripts/handwriting/   pembuat jalur tulisan tangan dari font Hershey Script
studio/                Sanity Studio dan migrasi
```

## Catatan teknis

- Animasi intro yang memakai GSAP selalu `fromTo` (efek bisa berjalan dua kali saat hidrasi).
- Jangan pakai kelas Tailwind `scale-*`/`translate-*` pada elemen yang dianimasikan GSAP: Tailwind 4 memakai properti CSS `scale`/`translate`, sedangkan GSAP memakai `transform`.
- `usePathname` harus di dalam `<Suspense>` (lihat `components/motion/Pathname.tsx`), aturan dari Cache Components.
- Setiap `generateStaticParams` harus mengembalikan minimal satu hasil (`staticSlugs()` di `lib/sanity/content.ts`).
