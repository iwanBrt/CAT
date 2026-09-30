"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT, KATEGORI_LABEL, DEFAULT_CONFIG } from "@/lib/constants";
import { fmtTanggal } from "@/lib/scoring";

function RiwayatContent() {
  const supabase = createClient();
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || ignore) return;

        const { data } = await supabase
          .from("hasil")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!ignore) setList(data || []);
      } catch (err) {
        console.error("Error loading riwayat ujian:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--c-forest-600)", borderTopColor: "transparent", margin: "0 auto 16px" }} />
        <p className="muted" style={{ fontWeight: 600 }}>Memuat hasil ujian…</p>
      </div>
    );
  }

  const terbaru = list.length > 0 ? list[0] : null;

  return (
    <div className="peserta-container" style={{ paddingBottom: 60 }}>
      {/* Kartu Ujian Selesai (Image 1 Bottom-Right) */}
      {terbaru ? (
        <div className="finish-card-wrap">
          <div className="trophy-badge">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          </div>

          <h1 className="finish-title">Ujian Selesai!</h1>
          <p className="finish-subtitle">
            Terima kasih telah mengikuti Computer Assisted Test (CAT).
          </p>

          {/* Skor Anda & Status Lulus */}
          <div className="finish-score-box">
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                Skor Anda
              </div>
              <div className="finish-score-num">
                {terbaru.skor_total}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                dari 550
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6 }}>
                Status
              </div>
              <span
                className="pill"
                style={{
                  fontSize: 14,
                  padding: "8px 18px",
                  borderRadius: 999,
                  fontWeight: 700,
                  background: terbaru.lulus ? "#2E7D32" : "var(--bad)",
                  color: "#FFFFFF",
                  border: "none",
                }}
              >
                {terbaru.lulus ? "✓ Lulus" : "✕ Tidak Lulus"}
              </span>
            </div>
          </div>

          {/* Rincian Nilai per Bagian */}
          <div className="finish-breakdown-card">
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 12 }}>
              Rincian Nilai per Bagian
            </div>

            <div className="breakdown-row">
              <span style={{ fontWeight: 600, color: "var(--text)" }}>TWK (Tes Wawasan Kebangsaan)</span>
              <span style={{ fontWeight: 700, color: "var(--c-dark-900)" }}>
                {terbaru.per_kategori?.TWK?.skor ?? 0} / 150
              </span>
            </div>

            <div className="breakdown-row">
              <span style={{ fontWeight: 600, color: "var(--text)" }}>TIU (Tes Intelegensi Umum)</span>
              <span style={{ fontWeight: 700, color: "var(--c-dark-900)" }}>
                {terbaru.per_kategori?.TIU?.skor ?? 0} / 175
              </span>
            </div>

            <div className="breakdown-row">
              <span style={{ fontWeight: 600, color: "var(--text)" }}>TKP (Tes Karakteristik Pribadi)</span>
              <span style={{ fontWeight: 700, color: "var(--c-dark-900)" }}>
                {terbaru.per_kategori?.TKP?.skor ?? 0} / 225
              </span>
            </div>
          </div>

          {/* Tombol Aksi (Image 1) */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: 160 }}
              onClick={() => setShowDetail(!showDetail)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>{showDetail ? "Tutup Detail Jawaban" : "Lihat Detail Jawaban"}</span>
            </button>

            <Link
              href="/peserta"
              className="btn btn-primary"
              style={{ flex: 1, minWidth: 160 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Kembali ke Beranda</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p className="muted">Belum ada hasil simulasi ujian yang tercatat.</p>
          <Link href="/peserta" className="btn btn-primary" style={{ marginTop: 14 }}>
            Mulai Ujian Sekarang
          </Link>
        </div>
      )}

      {/* Tabel Riwayat Semua Ujian */}
      {list.length > 0 && (
        <div className="card" style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 16px", color: "var(--c-dark-900)" }}>
            Riwayat Seluruh Hasil Ujian
          </h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal Selesai</th>
                  <th>TWK (Min 65)</th>
                  <th>TIU (Min 80)</th>
                  <th>TKP (Min 166)</th>
                  <th>Skor Total</th>
                  <th>Status Akhir</th>
                </tr>
              </thead>
              <tbody>
                {list.map((h) => {
                  const pk = h.per_kategori || {};
                  return (
                    <tr key={h.id}>
                      <td>{fmtTanggal(h.waktu_selesai || h.created_at)}</td>
                      <td>{pk.TWK?.skor ?? "-"}</td>
                      <td>{pk.TIU?.skor ?? "-"}</td>
                      <td>{pk.TKP?.skor ?? "-"}</td>
                      <td><b>{h.skor_total}</b></td>
                      <td>
                        <span className={`pill ${h.lulus ? "pill-good" : "pill-bad"}`}>
                          {h.lulus ? "✓ Lulus PG" : "✕ Gagal PG"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiwayatPage() {
  return (
    <Suspense fallback={<div className="peserta-container"><p className="muted">Memuat halaman riwayat…</p></div>}>
      <RiwayatContent />
    </Suspense>
  );
}
