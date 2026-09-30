"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ_DATA = [
  {
    q: "Bagaimana cara memulai ujian?",
    a: "Untuk memulai ujian, buka menu 'Ujian Saya' di sidebar kiri, kemudian masukkan PIN 6 digit yang diberikan oleh admin/panitia penyelenggara. Setelah PIN terverifikasi, baca petunjuk ujian dengan seksama, centang persetujuan, lalu klik tombol 'Mulai Ujian Sekarang'."
  },
  {
    q: "Dari mana saya mendapatkan PIN ujian?",
    a: "PIN ujian diberikan oleh admin atau panitia penyelenggara CAT. Hubungi penyelenggara ujian Anda untuk mendapatkan PIN akses. Setiap sesi ujian memiliki PIN yang unik dan ditetapkan oleh admin melalui dashboard admin."
  },
  {
    q: "Apa yang terjadi jika waktu ujian habis?",
    a: "Jika waktu pengerjaan habis, ujian akan otomatis diakhiri oleh sistem. Seluruh jawaban yang telah Anda simpan akan dihitung dan disimpan ke dalam riwayat hasil ujian Anda. Pastikan Anda mengelola waktu dengan baik selama pengerjaan."
  },
  {
    q: "Apakah saya bisa kembali ke soal sebelumnya?",
    a: "Ya, Anda bebas menavigasi antar soal menggunakan tombol 'Soal Sebelumnya' dan 'Soal Berikutnya', atau dengan mengklik nomor soal di panel navigasi sebelah kanan. Anda juga bisa menandai soal sebagai 'Ragu-ragu' untuk ditinjau kembali nanti."
  },
  {
    q: "Apa itu passing grade (PG)?",
    a: "Passing grade adalah skor minimum yang harus dicapai di setiap kategori ujian (TWK, TIU, TKP) agar dinyatakan lulus. Untuk lulus ujian secara keseluruhan, Anda harus memenuhi passing grade di ketiga kategori secara bersamaan. TWK: 65, TIU: 80, TKP: 166."
  },
  {
    q: "Apakah jawaban saya disimpan otomatis?",
    a: "Ya, setiap kali Anda memilih jawaban pada suatu soal, jawaban tersebut langsung disimpan secara otomatis ke server. Anda tidak perlu khawatir kehilangan jawaban jika terjadi masalah koneksi sementara."
  },
  {
    q: "Apa yang dimaksud dengan peringatan integritas?",
    a: "Sistem CAT dilengkapi fitur anti-kecurangan (anti-cheating). Jika Anda berpindah tab, membuka aplikasi lain, atau mencoba membuka developer tools selama ujian, sistem akan mencatat pelanggaran tersebut dan memberikan peringatan. Pastikan Anda fokus pada pengerjaan ujian."
  },
  {
    q: "Bagaimana cara melihat hasil ujian saya?",
    a: "Anda dapat melihat hasil ujian melalui menu 'Hasil Ujian' di sidebar. Di halaman tersebut, Anda dapat melihat skor total, skor per kategori (TWK, TIU, TKP), status kelulusan, serta detail jawaban benar/salah/kosong untuk setiap kategori."
  },
  {
    q: "Bisakah saya mengulang ujian?",
    a: "Ya, Anda dapat mengulang ujian kapan saja selama admin menyediakan PIN ujian baru. Setiap percobaan ujian akan disimpan di riwayat Anda sehingga Anda dapat memantau perkembangan skor dari waktu ke waktu."
  },
  {
    q: "Siapa yang harus saya hubungi jika ada masalah?",
    a: "Jika Anda mengalami kendala teknis atau pertanyaan terkait ujian, hubungi admin atau panitia penyelenggara CAT di instansi Anda. Untuk masalah teknis pada sistem, sampaikan keluhan melalui admin penyelenggara."
  },
];

export default function BantuanPage() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>❓ Bantuan</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Pertanyaan umum dan panduan penggunaan sistem CAT</p>
      </div>

      {/* Quick Guide Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
            background: "var(--c-mint-100)", color: "var(--c-forest-600)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-dark-900)", marginBottom: 6 }}>Masukkan PIN</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
            Dapatkan PIN dari admin dan masukkan di halaman &ldquo;Ujian Saya&rdquo;.
          </div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
            background: "#DBEAFE", color: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-dark-900)", marginBottom: 6 }}>Kerjakan Ujian</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
            Jawab 110 soal dalam waktu 100 menit. Jawaban disimpan otomatis.
          </div>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 14px",
            background: "#FEF3C7", color: "#D97706",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-dark-900)", marginBottom: 6 }}>Lihat Hasil</div>
          <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
            Cek skor, status kelulusan, dan analisis per kategori di &ldquo;Hasil Ujian&rdquo;.
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 20px" }}>
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>

        <div>
          {FAQ_DATA.map((item, idx) => (
            <div key={idx} className="faq-item">
              <button
                type="button"
                className={`faq-question ${openIdx === idx ? "open" : ""}`}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openIdx === idx && (
                <div className="faq-answer">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card" style={{ textAlign: "center", padding: "32px", borderLeft: "4px solid var(--c-forest-600)" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 8 }}>
          Masih butuh bantuan?
        </div>
        <p className="muted" style={{ fontSize: 13.5, margin: "0 0 16px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          Hubungi admin atau panitia penyelenggara ujian CAT di instansi Anda untuk mendapatkan bantuan lebih lanjut.
        </p>
        <Link href="/peserta" className="btn btn-secondary">
          &larr; Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
