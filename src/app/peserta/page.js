"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT, KATEGORI_LABEL, DEFAULT_CONFIG, TOTAL_DURASI_MENIT, TOTAL_SOAL, MAX_SKOR } from "@/lib/constants";
import { fmtTanggal } from "@/lib/scoring";

export default function DashboardPeserta() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [hasilList, setHasilList] = useState([]);
  const [sesiAktif, setSesiAktif] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          router.push("/login");
          return;
        }
        if (ignore) return;
        setUser(authUser);

        const { data: prof } = await supabase.from("profiles").select("nama, role").eq("id", authUser.id).maybeSingle();
        if (!ignore && prof) setProfile(prof);

        const { data: hasil } = await supabase
          .from("hasil")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (!ignore) setHasilList(hasil || []);

        const { data: sesi } = await supabase.from("sesi_aktif").select("data").eq("user_id", authUser.id).maybeSingle();
        if (!ignore) setSesiAktif(sesi?.data || null);
      } catch (err) {
        console.error("Error loading peserta dashboard:", err);
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
        <p className="muted" style={{ fontWeight: 600 }}>Memuat dashboard…</p>
      </div>
    );
  }

  const totalUjian = hasilList.length;
  const totalLulus = hasilList.filter(h => h.lulus).length;
  const skorTertinggi = totalUjian > 0 ? Math.max(...hasilList.map(h => h.skor_total || 0)) : 0;
  const rataRata = totalUjian > 0 ? Math.round(hasilList.reduce((a, h) => a + (h.skor_total || 0), 0) / totalUjian) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Selamat Datang, {profile?.nama || "Peserta"}
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Berikut ringkasan aktivitas simulasi CAT Anda.
          </p>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "8px 16px", borderRadius: "var(--radius-md)",
          fontSize: 13, fontWeight: 600, color: "var(--text-dim)", boxShadow: "var(--shadow-sm)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--c-forest-600)" }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Sesi Aktif Warning */}
      {sesiAktif && sesiAktif.status === "berjalan" && (
        <div style={{
          background: "var(--warn-bg)", border: "1.5px solid var(--warn-border)",
          borderRadius: "var(--radius-lg)", padding: "18px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap"
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "var(--warn-text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "var(--warn-text)" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Anda Memiliki Sesi Ujian yang Sedang Berjalan!</span>
            </div>
            <div style={{ fontSize: 13.5, color: "var(--warn-text)" }}>
              Timer ujian tetap berjalan. Segera lanjutkan untuk menyelesaikan soal.
            </div>
          </div>
          <button className="btn btn-primary" style={{ fontWeight: 700, padding: "10px 22px" }} onClick={() => router.push("/peserta/ujian/mengerjakan")}>
            Lanjutkan Ujian &rarr;
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="admin-metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#E0F2FE", color: "#0284C7" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Total Ujian Selesai</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>{totalUjian}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>sesi pengerjaan</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "var(--c-mint-100)", color: "var(--c-forest-600)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Tingkat Kelulusan</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: totalLulus > 0 ? "var(--good)" : "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>
              {totalUjian > 0 ? Math.round((totalLulus / totalUjian) * 100) : 0}%
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{totalLulus} dari {totalUjian} lulus PG</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#F3E8FF", color: "#9333EA" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Skor Tertinggi</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>{skorTertinggi}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>dari maks. {MAX_SKOR.TOTAL}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#FEF3C7", color: "#D97706" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              <path d="M4 22h16" /><path d="M10 14.66V17" /><path d="M14 14.66V17" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Rata-rata Skor</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>{rataRata}</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>dari seluruh percobaan</div>
          </div>
        </div>
      </div>

      {/* Quick Actions + Info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 16px" }}>
            Menu Cepat
          </h2>
          <div className="quick-menu-stack">
            <Link href="/peserta/ujian" className="quick-menu-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#2563EB" }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Masuk Ujian dengan PIN</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", color: "var(--text-dim)" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            <Link href="/peserta/riwayat" className="quick-menu-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#16A34A" }}>
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Lihat Riwayat Ujian</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", color: "var(--text-dim)" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
            <Link href="/peserta/hasil" className="quick-menu-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#9333EA" }}>
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span>Analisis Hasil &amp; Skor</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", color: "var(--text-dim)" }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Info Ujian CAT */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 16px" }}>
            Informasi Ujian CAT
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="question-comp-item">
              <span style={{ fontWeight: 600 }}>Total Soal</span>
              <span style={{ fontWeight: 700 }}>{TOTAL_SOAL} butir</span>
            </div>
            <div className="question-comp-item">
              <span style={{ fontWeight: 600 }}>Durasi Pengerjaan</span>
              <span style={{ fontWeight: 700 }}>{TOTAL_DURASI_MENIT} menit</span>
            </div>
            <div className="question-comp-item">
              <span style={{ fontWeight: 600 }}>Skor Maksimal</span>
              <span style={{ fontWeight: 700 }}>{MAX_SKOR.TOTAL} poin</span>
            </div>
            {KATEGORI_URUT.map(k => (
              <div key={k} className="question-comp-item" style={{ background: "transparent", border: "1px dashed var(--border)" }}>
                <span style={{ fontWeight: 600, fontSize: 12.5 }}>{k} – {KATEGORI_LABEL[k]}</span>
                <span style={{ fontWeight: 700, fontSize: 12.5 }}>PG: {DEFAULT_CONFIG.kategori[k].passingGrade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Riwayat Ujian Terakhir */}
      {hasilList.length > 0 && (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
              Riwayat Ujian Terakhir
            </h2>
            <Link href="/peserta/riwayat" style={{ fontSize: 12.5, fontWeight: 600 }}>
              Lihat Semua &rarr;
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>TWK</th>
                  <th>TIU</th>
                  <th>TKP</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hasilList.slice(0, 5).map(h => {
                  const pk = h.per_kategori || {};
                  return (
                    <tr key={h.id}>
                      <td style={{ fontSize: 12.5 }}>{fmtTanggal(h.waktu_selesai || h.created_at)}</td>
                      <td>{pk.TWK?.skor ?? "-"}</td>
                      <td>{pk.TIU?.skor ?? "-"}</td>
                      <td>{pk.TKP?.skor ?? "-"}</td>
                      <td><b>{h.skor_total}</b></td>
                      <td>
                        <span className={`pill ${h.lulus ? "pill-good" : "pill-bad"}`}>
                          {h.lulus ? "✓ Lulus" : "✕ Gagal"}
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
