# Master Blueprint & Spesifikasi Standar CAT BKN Nasional
## Aplikasi Simulasi CAT CPNS, PPPK & Sekolah Kedinasan

Dokumen ini merupakan acuan standar fitur, arsitektur, dan rencana implementasi pengembangan sistem CAT (Computer Assisted Test) agar 100% mematuhi regulasi BKN (Badan Kepegawaian Negara) dan Keputusan Menteri PAN-RB.

---

## 1. Standar Aturan & Regulasi SKD (PermenPAN-RB Terbaru)

### A. Komposisi Soal & Bobot Nilai
1. **Total Soal**: **110 butir** dikerjakan sekaligus dalam satu sesi:
   - **TWK (Tes Wawasan Kebangsaan)**: 30 Soal (Nomor 1 – 30)
     - Benar = 5, Salah = 0, Kosong = 0 (Nilai Max: 150)
     - Passing Grade (Nilai Ambang Batas): **65**
   - **TIU (Tes Inteligensia Umum)**: 35 Soal (Nomor 31 – 65)
     - Benar = 5, Salah = 0, Kosong = 0 (Nilai Max: 175)
     - Passing Grade (Nilai Ambang Batas): **80**
   - **TKP (Tes Karakteristik Pribadi)**: 45 Soal (Nomor 66 – 110)
     - Tidak ada jawaban salah. Opsi bernilai gradasi **1 s.d. 5**, Kosong = 0 (Nilai Max: 225)
     - Passing Grade (Nilai Ambang Batas): **166**
2. **Total Skor Maksimal**: **550 Poin**
3. **Syarat Kelulusan SKD**: Peserta dinyatakan **LULUS (P)** jika dan hanya jika memenuhi passing grade di **KETIGA** kategori sekaligus (TWK >= 65 DAN TIU >= 80 DAN TKP >= 166).

### B. Alur Pengerjaan & Waktu
1. **Timer Tunggal 100 Menit**:
   - Total durasi ujian adalah **100 menit** (130 menit untuk formasi khusus disabilitas).
   - Waktu berjalan mundur (*countdown*) untuk seluruh 110 soal secara bersamaan, **bukan dipisah per kategori**.
2. **Kebebasan Navigasi Soal**:
   - Peserta **bebas melompat** ke nomor berapa pun (1 s.d. 110) kapan saja tanpa terikat urutan.
   - Peserta dapat mengerjakan TKP terlebih dahulu, lalu kembali ke TWK/TIU.

---

## 2. Arsitektur Antarmuka (UI/UX) Standar CAT BKN

### A. Header Ujian Resmi
- **Panel Peserta (Kiri)**:
  - Foto Peserta & Nomor Peserta / NIK
  - Nama Lengkap
  - Formasi & Instansi yang dilamar
- **Panel Status & Timer (Kanan)**:
  - Timer Digital Countdown (Format: `JJ:MM:DD`).
  - Indikator warna timer: Normal (Netral), Kuning (< 15 menit), Merah berkedip (< 5 menit).
  - Status koneksi real-time: 🟢 *Terhubung* / 🟡 *Menyinkronkan* / 🔴 *Offline*.

### B. Lembar Soal & Kontrol Aksesibilitas
- Tombol penyesuaian ukuran font: **A-** (Kecil), **A** (Normal), **A+** (Besar).
- Label kategori soal aktif: *[TWK - Soal 14/30]* atau *[TKP - Soal 85/45]*.
- Dukungan gambar/ilustrasi soal (khususnya soal TIU Figural).
- Opsi jawaban radio button interaktif (A, B, C, D, E) dengan highlighting yang jelas.

### C. Navigasi 110 Soal
- Grid nomor 1 s.d. 110 dengan pembatas/penanda kategori:
  - No 1–30: TWK
  - No 31–65: TIU
  - No 66–110: TKP
- **3 Kode Status Visual**:
  - **Abu-abu / Putih**: Belum dijawab
  - **Hijau**: Sudah dijawab
  - **Kuning**: Ragu-ragu
- **Aksi Tombol**:
  - `[< Sebelumnya]`
  - `[Ragu-ragu]` (memberi flag ragu pada nomor aktif)
  - `[Simpan & Lanjutkan >]`
  - `[Selesai Ujian]` (hanya memicu modal konfirmasi)

### D. Modal Konfirmasi Selesai Ujian
- Merekapitulasi progres ujian sebelum peserta benar-benar mengakhiri:
  - Jumlah soal sudah terjawab
  - Jumlah soal belum dijawab
  - Jumlah soal masih ragu-ragu
- Konfirmasi ganda (*checkbox checklist*) untuk mencegah ketidaksengajaan.

---

## 3. Sistem Keamanan & Integritas Ujian (Anti-Cheating)

1. **PIN Sesi Ujian (Exam Session PIN)**:
   - Peserta wajib memasukkan token 6 karakter yang dibuka oleh pengawas/admin sebelum tombol "Mulai" aktif.
2. **Mode Fullscreen (Kiosk)**:
   - Memaksa ujian berjalan di mode fullscreen (`requestFullscreen`).
   - Peringatan jika peserta menekan ESC atau keluar dari layar penuh.
3. **Deteksi Perpindahan Tab (Tab Switch Violation)**:
   - Mencatat event `visibilitychange` dan `blur`.
   - Menghitung jumlah pelanggaran peserta meninggalkan tab ujian.
   - Peringatan bertingkat (Maksimal 3x pelanggaran sebelum sesi terkunci).
4. **Proteksi Keyboard & Mouse**:
   - Blokir klik kanan (`contextmenu`).
   - Blokir tombol F12, Ctrl+Shift+I (DevTools).
   - Blokir Copy, Cut, Paste (Ctrl+C, Ctrl+V).
5. **Session Lock (Single Login Enforcement)**:
   - Satu akun dilarang login dan mengerjakan dari dua tab/perangkat secara bersamaan.

---

## 4. Live Score Real-Time (Transparansi Publik BKN)

1. **Halaman Publik `/live-score`**:
   - Memanfaatkan **Supabase Realtime** untuk mendengarkan perubahan skor peserta.
   - Layar leaderboard otomatis bergerak live tanpa perlu refresh halaman:
     - *Peringkat | No. Peserta | Nama | TWK | TIU | TKP | Total Skor | Status PG (Lulus/Tidak)*
   - Opsi pencarian instan berdasarkan Nama atau Nomor Peserta.

---

## 5. Bank Soal & Pembahasan

1. **Dukungan Soal Figural (Gambar)**:
   - Field `gambar_url` pada database untuk soal-soal pola bangun datar, kubus, analogi visual.
2. **Pembahasan Lengkap**:
   - Kolom `pembahasan` pada tabel soal.
   - Riwayat ujian menyediakan tombol **"Lihat Pembahasan"** agar peserta dapat belajar dari kesalahan setelah ujian berakhir.
3. **Sub-Topik Kisi-Kisi PermenPAN-RB**:
   - Tagging sub-topik (Nasionalisme, Bela Negara, Silogisme, Figural, Pelayanan Publik, Anti-Radikalisme, dll).

---

## 6. Laporan, Ekspor, & Sertifikat Nilai

1. **Sertifikat Digital CAT (Download PDF / Print)**:
   - Format kartu nilai resmi lengkap dengan rincian nilai TWK, TIU, TKP, Nilai Ambang Batas, status kelulusan, dan QR Code verifikasi.
2. **Ekspor Rekapitulasi Nilai ke Excel (XLSX / CSV)**:
   - Admin dapat mengekspor seluruh peringkat nilai peserta sekali klik untuk pengolahan ranking SKD.

---

## 7. Rencana Tahapan Eksekusi (Roadmap)

### Tahap 1: Restrukturisasi Mesin Ujian (Core Engine BKN) - *PRIORITAS UTAMA*
- [x] Migrasi konfigurasi SKD: 100 menit total, 110 soal (30 TWK, 35 TIU, 45 TKP).
- [x] Penggabungan 110 nomor soal dalam 1 canvas ujian dengan navigasi bebas.
- [x] Implementasi 3 status jawaban (Belum dijawab, Terjawab [Hijau], Ragu-ragu [Kuning]).
- [x] Header ujian resmi (Biodata peserta, timer countdown 100 menit, indikator bahaya waktu).
- [x] Fitur aksesibilitas ukuran font (A- / A / A+).
- [x] Modal konfirmasi selesai ujian yang merangkum butir terjawab/belum/ragu.
- [x] Perhitungan skor resmi PermenPAN-RB (TWK min 65, TIU min 80, TKP min 166).

### Tahap 2: Keamanan & Integritas (Anti-Cheating)
- [ ] Deteksi pindah tab (*tab switch violation*) dengan counter peringatan.
- [ ] Mode layar penuh (*fullscreen lockdown*).
- [ ] Blokir klik kanan, inspect element, dan pintasan copy-paste.
- [ ] PIN / Token Sesi Ujian.

### Tahap 3: Live Score Real-time & Pembahasan Soal
- [ ] Halaman publik `/live-score` dengan Supabase Realtime broadcast.
- [ ] Dukungan kolom `pembahasan` dan `gambar_url` pada bank soal.
- [ ] Halaman review / pembahasan interaktif setelah ujian selesai.

### Tahap 4: Cetak Sertifikat & Ekspor Excel
- [ ] Template kartu hasil ujian CAT resmi (siap cetak / simpan PDF).
- [ ] Fitur ekspor CSV / Excel di panel Admin.
