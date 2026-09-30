# Simulasi CAT CPNS/PPPK — Next.js + Supabase

Aplikasi simulasi ujian CAT (SKD: TWK, TIU, TKP) dengan role Admin & Peserta,
timer per kategori, bank soal, dan dashboard hasil.

## Techstack

- **Next.js 14** (App Router, JavaScript)
- **Supabase** — PostgreSQL + Auth (login email/password) + Row Level Security
- CSS murni (tanpa Tailwind), sudah mendukung dark mode otomatis

## 1. Siapkan project Supabase

1. Buat project baru gratis di https://supabase.com
2. Buka **SQL Editor** di dashboard Supabase, buka file `supabase/schema.sql`
   di folder ini, salin seluruh isinya, tempel ke SQL Editor, lalu klik **Run**.
   Ini akan membuat semua tabel, trigger, dan aturan keamanan (RLS) yang dibutuhkan.
3. Buka **Project Settings -> API**, salin:
   - `Project URL`
   - `anon public key`

## 2. Setup environment

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan URL & anon key dari langkah sebelumnya.

## 3. Install & jalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — kamu akan diarahkan ke halaman login.

## 4. Daftar akun & jadikan admin

1. Buka `/register`, daftar akun pertamamu (otomatis jadi role **peserta**).
2. Balik ke Supabase Dashboard -> **SQL Editor**, jalankan (ganti email-nya):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'emailkamu@contoh.com');
```

3. Login ulang / refresh halaman — akun itu sekarang masuk sebagai **Admin**
   dan melihat menu Dashboard, Bank Soal, dan Pengaturan.
4. Peserta lain tinggal daftar sendiri lewat `/register` — otomatis jadi peserta.

## 5. Isi bank soal

Masuk sebagai admin -> tab **Bank Soal** -> pilih kategori (TWK/TIU/TKP) ->
"+ Tambah Soal", atau pakai "Tambah Massal (JSON)" untuk impor banyak soal
sekaligus (format JSON dijelaskan di dalam form-nya).

Peserta baru bisa mulai ujian setelah jumlah soal aktif per kategori mencukupi
jumlah soal yang diset di tab **Pengaturan** (default: TWK 30, TIU 35, TKP 45).

## Struktur folder penting

```
src/
  app/
    login/, register/        -> halaman auth
    peserta/                  -> beranda, ujian berjalan, riwayat
    admin/                    -> dashboard, bank soal, pengaturan
  lib/
    supabase/client.js        -> koneksi Supabase sisi browser
    supabase/server.js        -> koneksi Supabase sisi server (Server Component)
    constants.js               -> konfigurasi default kategori SKD
    scoring.js                  -> logika penghitungan skor
  middleware.js                -> refresh sesi login otomatis
supabase/schema.sql            -> skema database + RLS (jalankan di Supabase)
```

## Catatan

- Skoring default mengikuti pola SKD CPNS terbaru: TWK/TIU benar = 5 poin/salah
  atau kosong = 0; TKP setiap opsi punya bobot 1-5 (tidak ada yang "salah").
  Semua ini bisa diubah lewat tab Pengaturan.
- Soal yang diambil untuk satu sesi ujian diacak & "dikunci" (disalin ke sesi
  peserta) supaya tidak berubah walau admin mengedit bank soal saat ujian
  sedang berlangsung, dan supaya tiap peserta dapat kombinasi soal berbeda.
- Ini scaffold fungsional, belum di-deploy/diuji end-to-end otomatis (dibuat
  tanpa akses `npm install` langsung). Kalau ada error saat `npm run dev`
  pertama kali, kemungkinan besar cuma versi paket (`@supabase/ssr`,
  `next`) yang perlu disesuaikan — cek pesan errornya lalu update versi di
  `package.json` sesuai kebutuhan.
