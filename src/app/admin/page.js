"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Utility ─────────────────────────────────────────────────────────────────
function fmt(n) {
  return (n ?? 0).toLocaleString("id-ID");
}

function getRealDateTime() {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const day = days[now.getDay()];
  const date = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return { tanggal: `${day}, ${date} ${month} ${year}`, jam: `${hh}:${mm} WIB` };
}

function formatRelative(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return "baru saja";
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

// ─── DASHBOARD OVERVIEW TAB ───────────────────────────────────────────────────
function DashboardTab() {
  const supabase = createClient();
  const [stats, setStats] = useState({ peserta: 0, soal: 0, ujianSelesai: 0, activePin: "······" });
  const [hasilList, setHasilList] = useState([]);
  const [aktivitas, setAktivitas] = useState([]);
  const [dateTime, setDateTime] = useState(getRealDateTime());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(getRealDateTime()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [soalRes, pesertaRes, hasilRes, cfgRes] =
      await Promise.all([
        supabase.from("soal").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "peserta"),
        supabase.from("hasil").select("id, user_id, skor_total, lulus, created_at, per_kategori").order("created_at", { ascending: false }).limit(10),
        supabase.from("config").select("*").eq("id", "default").maybeSingle(),
      ]);

    const totalSoal = soalRes.count;
    const totalPeserta = pesertaRes.count;
    const hasil = hasilRes.data;
    const cfg = cfgRes.data;

    setStats({
      peserta: totalPeserta || 0,
      soal: totalSoal || 0,
      ujianSelesai: hasil?.length || 0,
      activePin: cfg?.pin_ujian || cfg?.kategori?._pin || "123456",
    });
    setHasilList(hasil || []);

    // Build aktivitas from hasil
    const acts = (hasil || []).slice(0, 5).map((h, i) => ({
      id: h.id,
      title: h.lulus ? "Peserta Lulus Ujian" : "Ujian Selesai",
      desc: `Skor: ${h.skor_total} pts • ${h.lulus ? "LULUS" : "Tidak Lulus"}`,
      meta: formatRelative(h.created_at),
      color: h.lulus ? "#10B981" : "#6B7280",
    }));
    setAktivitas(acts);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute donut chart data from hasilList
  const lulus = hasilList.filter(h => h.lulus).length;
  const tidakLulus = hasilList.filter(h => !h.lulus).length;
  const totalHasil = hasilList.length;

  // Chart circumference
  const r = 38;
  const circ = 2 * Math.PI * r;
  const lulusArc = totalHasil > 0 ? (lulus / totalHasil) * circ : 0;
  const tidakArc = totalHasil > 0 ? (tidakLulus / totalHasil) * circ : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Page Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Dashboard Admin
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Ringkasan aktivitas sistem CAT hari ini secara real-time.
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "8px 16px", borderRadius: "var(--radius-md)", fontSize: 13,
          fontWeight: 600, color: "var(--text-dim)", boxShadow: "var(--shadow-sm)"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--c-forest-600)" }}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          <span>{dateTime.tanggal}</span>
          <span style={{ color: "var(--border-strong)" }}>|</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--c-forest-600)" }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span>{dateTime.jam}</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="admin-metric-grid">
        {/* Total Peserta */}
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#E0F2FE", color: "#0284C7" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Total Peserta</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>
              {loading ? "..." : fmt(stats.peserta)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>terdaftar di sistem</div>
          </div>
        </div>

        {/* Total Soal */}
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#F3E8FF", color: "#9333EA" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Bank Soal</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>
              {loading ? "..." : fmt(stats.soal)}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>butir soal aktif</div>
          </div>
        </div>

        {/* Ujian Selesai */}
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "#DCFCE7", color: "#16A34A" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>Ujian Selesai</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1.1, margin: "3px 0" }}>
              {loading ? "..." : fmt(stats.ujianSelesai)}
            </div>
            <div style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>{lulus} lulus · {tidakLulus} tidak lulus</div>
          </div>
        </div>

        {/* PIN Aktif */}
        <div className="metric-card" style={{ background: "linear-gradient(135deg, #0B2B26 0%, #163832 100%)", border: "1px solid #235347", color: "#FFFFFF" }}>
          <div className="metric-icon-box" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8EB69B", textTransform: "uppercase", letterSpacing: "0.05em" }}>PIN Ujian Aktif</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.1, margin: "3px 0", letterSpacing: "0.2em", fontFamily: "monospace" }}>
              {loading ? "······" : (stats.activePin || "123456")}
            </div>
            <Link href="/admin/ujian" style={{ fontSize: 12, color: "#DAF1DE", textDecoration: "underline" }}>
              Kelola PIN & Ujian →
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="admin-center-row">
        {/* Statistik Hasil */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
              Hasil Ujian Terbaru
            </h2>
            <Link href="/admin/laporan" style={{ fontSize: 12.5, fontWeight: 600 }}>
              Lihat Semua →
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto 8px" }} />
              <p className="muted" style={{ fontSize: 13 }}>Memuat data...</p>
            </div>
          ) : hasilList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-dim)" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--text-dim)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
              </div>
              <p style={{ fontSize: 13, margin: 0 }}>Belum ada data hasil ujian.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Skor Total</th>
                    <th>TWK</th>
                    <th>TIU</th>
                    <th>TKP</th>
                    <th>Status</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {hasilList.map((h, idx) => {
                    const pk = h.per_kategori || {};
                    return (
                      <tr key={h.id}>
                        <td style={{ color: "var(--text-dim)", fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: "var(--c-dark-900)", fontSize: 15 }}>{h.skor_total}</td>
                        <td style={{ fontWeight: 600 }}>{pk.TWK?.skor ?? "-"}</td>
                        <td style={{ fontWeight: 600 }}>{pk.TIU?.skor ?? "-"}</td>
                        <td style={{ fontWeight: 600 }}>{pk.TKP?.skor ?? "-"}</td>
                        <td>
                          <span className="pill" style={{
                            fontSize: 11.5, padding: "3px 10px", borderRadius: 6,
                            background: h.lulus ? "var(--good-bg)" : "#FEE2E2",
                            color: h.lulus ? "var(--good-text)" : "#DC2626",
                          }}>
                            {h.lulus ? "LULUS" : "Tidak Lulus"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-dim)", fontSize: 12 }}>{formatRelative(h.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Donut: Distribusi Lulus/Tidak */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="flex-between" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 15.5, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
              Distribusi Kelulusan
            </h2>
          </div>

          <div className="donut-wrap">
            <svg width="180" height="180" viewBox="0 0 100 100">
              {totalHasil === 0 ? (
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="var(--border)" strokeWidth="16" />
              ) : (
                <>
                  <circle cx="50" cy="50" r={r} fill="transparent"
                    stroke="#16A34A" strokeWidth="16"
                    strokeDasharray={`${lulusArc} ${circ}`}
                    strokeDashoffset={circ * 0.25}
                    strokeLinecap="butt"
                  />
                  <circle cx="50" cy="50" r={r} fill="transparent"
                    stroke="#DC2626" strokeWidth="16"
                    strokeDasharray={`${tidakArc} ${circ}`}
                    strokeDashoffset={circ * 0.25 - lulusArc}
                    strokeLinecap="butt"
                  />
                </>
              )}
            </svg>
            <div className="donut-center-text">
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)" }}>{fmt(totalHasil)}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600 }}>Total Ujian</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }} />
                <span>Lulus</span>
              </span>
              <b style={{ color: "#16A34A" }}>{fmt(lulus)}</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
                <span>Tidak Lulus</span>
              </span>
              <b style={{ color: "#DC2626" }}>{fmt(tidakLulus)}</b>
            </div>
            {totalHasil > 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                Tingkat kelulusan: <b style={{ color: "var(--c-forest-600)" }}>{Math.round((lulus / totalHasil) * 100)}%</b>
              </div>
            )}
          </div>
        </div>

        {/* Right: Aksi Cepat + Aktivitas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Link href="/admin/pengaturan" className="btn btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14.5, fontWeight: 700 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span>Buat / Atur Ujian</span>
          </Link>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 10 }}>
              Menu Cepat
            </div>
            <div className="quick-menu-stack">
              <Link href="/admin/peserta" className="quick-menu-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#2563EB" }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
                <span>Kelola Peserta</span>
              </Link>
              <Link href="/admin/soal" className="quick-menu-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#16A34A" }}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                <span>Bank Soal</span>
              </Link>
              <Link href="/admin/laporan" className="quick-menu-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#9333EA" }}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                <span>Laporan & Ekspor</span>
              </Link>
              <Link href="/admin/pengaturan" className="quick-menu-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#EAB308" }}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                <span>Pengaturan Sistem</span>
              </Link>
            </div>
          </div>

          {/* Aktivitas Terbaru */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 12 }}>
              Aktivitas Terbaru
            </div>
            {loading ? (
              <p className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>Memuat...</p>
            ) : aktivitas.length === 0 ? (
              <p className="muted" style={{ fontSize: 12.5, textAlign: "center" }}>Belum ada aktivitas.</p>
            ) : (
              <div className="timeline-list">
                {aktivitas.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-icon-box" style={{ background: `${item.color}18`, color: item.color }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--c-dark-900)" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.desc}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 1 }}>{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  return <DashboardTab />;
}
