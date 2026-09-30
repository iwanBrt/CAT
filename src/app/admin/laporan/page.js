"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

function fmt(n) { return (n ?? 0).toLocaleString("id-ID"); }

function fmtDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminLaporanPage() {
  const supabase = createClient();

  const [hasilList, setHasilList] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLulus, setFilterLulus] = useState("ALL"); // ALL | LULUS | TIDAK
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [detailHasil, setDetailHasil] = useState(null);

  const PER_PAGE = 25;

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: hasil }, { data: profiles }] = await Promise.all([
      supabase.from("hasil").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, nama"),
    ]);

    const pMap = {};
    (profiles || []).forEach(p => { pMap[p.id] = p; });

    setHasilList(hasil || []);
    setProfileMap(pMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filter + Sort
  let filtered = [...hasilList];
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(h => {
      const nama = profileMap[h.user_id]?.nama || "";
      return nama.toLowerCase().includes(q) || h.id.toLowerCase().includes(q);
    });
  }
  if (filterLulus === "LULUS") filtered = filtered.filter(h => h.lulus);
  if (filterLulus === "TIDAK") filtered = filtered.filter(h => !h.lulus);

  filtered.sort((a, b) => {
    let va, vb;
    if (sortBy === "skor") { va = a.skor_total; vb = b.skor_total; }
    else if (sortBy === "nama") { va = profileMap[a.user_id]?.nama || ""; vb = profileMap[b.user_id]?.nama || ""; }
    else { va = a.created_at; vb = b.created_at; }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
  }

  // Statistics
  const totalLulus = hasilList.filter(h => h.lulus).length;
  const totalTidak = hasilList.length - totalLulus;
  const avgSkor = hasilList.length > 0
    ? Math.round(hasilList.reduce((s, h) => s + (h.skor_total || 0), 0) / hasilList.length)
    : 0;
  const maxSkor = hasilList.length > 0
    ? Math.max(...hasilList.map(h => h.skor_total || 0))
    : 0;
  const pctLulus = hasilList.length > 0 ? Math.round((totalLulus / hasilList.length) * 100) : 0;

  async function handleExportExcel() {
    if (filtered.length === 0) { showToast("Tidak ada data untuk diekspor."); return; }
    setExporting(true);
    try {
      const rows = filtered.map((h, idx) => {
        const pk = h.per_kategori || {};
        const nama = profileMap[h.user_id]?.nama || "Peserta";
        return {
          No: idx + 1,
          "Nama Peserta": nama,
          "Skor TWK": pk.TWK?.skor ?? 0,
          "Skor TIU": pk.TIU?.skor ?? 0,
          "Skor TKP": pk.TKP?.skor ?? 0,
          "Skor Total": h.skor_total,
          "Status SKD": h.lulus ? "LULUS" : "TIDAK LULUS",
          "Lulus TWK": pk.TWK?.lulus ? "Ya" : "Tidak",
          "Lulus TIU": pk.TIU?.lulus ? "Ya" : "Tidak",
          "Lulus TKP": pk.TKP?.lulus ? "Ya" : "Tidak",
          "Waktu Selesai": fmtDate(h.created_at),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Hasil_Ujian_CAT");
      XLSX.writeFile(wb, `Laporan_Ujian_CAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast(`Berhasil mengekspor ${rows.length} data hasil ujian ke Excel.`);
    } catch (err) {
      showToast("Gagal ekspor: " + err.message);
    }
    setExporting(false);
  }

  async function handleExportCSV() {
    if (filtered.length === 0) { showToast("Tidak ada data untuk diekspor."); return; }
    const rows = filtered.map((h, idx) => {
      const pk = h.per_kategori || {};
      const nama = profileMap[h.user_id]?.nama || "Peserta";
      return [idx + 1, nama, pk.TWK?.skor ?? 0, pk.TIU?.skor ?? 0, pk.TKP?.skor ?? 0, h.skor_total, h.lulus ? "LULUS" : "TIDAK LULUS", fmtDate(h.created_at)].join(",");
    });
    const header = "No,Nama Peserta,TWK,TIU,TKP,Total,Status,Waktu";
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Ujian_CAT_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Berhasil mengekspor ke CSV.");
  }

  async function handleReset(hasilId) {
    if (!confirm("Hapus data hasil ujian ini? Tindakan ini tidak dapat dibatalkan.")) return;
    const { error } = await supabase.from("hasil").delete().eq("id", hasilId);
    if (error) { showToast("Gagal hapus: " + error.message); return; }
    setHasilList(prev => prev.filter(h => h.id !== hasilId));
    setDetailHasil(null);
    showToast("Data hasil ujian berhasil dihapus.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Hasil & Laporan Ujian
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Rekap nilai seluruh peserta, analisis kelulusan, dan ekspor laporan.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn btn-secondary" onClick={loadData}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            <span>Refresh</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleExportCSV}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span>Ekspor CSV</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExportExcel} disabled={exporting}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            <span>{exporting ? "Mengekspor..." : "Ekspor Excel"}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Ujian", value: hasilList.length, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Peserta Lulus", value: totalLulus, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Tidak Lulus", value: totalTidak, color: "#DC2626", bg: "#FEF2F2" },
          { label: "Rata-rata Skor", value: avgSkor, color: "#7C3AED", bg: "#EDE9FE" },
          { label: "Skor Tertinggi", value: maxSkor, color: "#D97706", bg: "#FFFBEB" },
          { label: "Tingkat Lulus", value: `${pctLulus}%`, color: "#0891B2", bg: "#ECFEFF" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>
              {loading ? "·" : typeof s.value === "number" ? fmt(s.value) : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama peserta..." style={{ paddingLeft: 34, fontSize: 13 }} />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ id: "ALL", label: "Semua" }, { id: "LULUS", label: "Lulus" }, { id: "TIDAK", label: "Tidak Lulus" }].map(tab => (
              <button key={tab.id} type="button"
                className={`btn btn-sm ${filterLulus === tab.id ? "btn-primary" : "btn-secondary"}`}
                style={{ fontWeight: 700 }}
                onClick={() => { setFilterLulus(tab.id); setPage(1); }}>
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginLeft: "auto" }}>
            {filtered.length} hasil ditemukan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
            <p className="muted" style={{ fontWeight: 600 }}>Memuat data hasil ujian...</p>
          </div>
        ) : paged.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--text-dim)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--c-dark-900)" }}>Belum ada data hasil ujian</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Hasil ujian peserta akan muncul di sini setelah mereka menyelesaikan sesi ujian.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th style={{ cursor: "pointer" }} onClick={() => toggleSort("nama")}>
                      Peserta {sortBy === "nama" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th>TWK</th>
                    <th>TIU</th>
                    <th>TKP</th>
                    <th style={{ cursor: "pointer" }} onClick={() => toggleSort("skor")}>
                      Total {sortBy === "skor" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th>Status SKD</th>
                    <th style={{ cursor: "pointer" }} onClick={() => toggleSort("created_at")}>
                      Waktu {sortBy === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th style={{ width: 90 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((h, idx) => {
                    const pk = h.per_kategori || {};
                    const nama = profileMap[h.user_id]?.nama || "Peserta";
                    const twkLulus = pk.TWK?.lulus;
                    const tiuLulus = pk.TIU?.lulus;
                    const tkpLulus = pk.TKP?.lulus;
                    return (
                      <tr key={h.id} style={{ cursor: "pointer" }} onClick={() => setDetailHasil(h)}>
                        <td style={{ color: "var(--text-dim)", fontWeight: 600, fontSize: 12 }}>
                          {(page - 1) * PER_PAGE + idx + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--c-dark-900)", fontSize: 13 }}>{nama}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: twkLulus ? "#16A34A" : pk.TWK?.skor !== undefined ? "#DC2626" : "var(--text-dim)" }}>
                            {pk.TWK?.skor ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: tiuLulus ? "#16A34A" : pk.TIU?.skor !== undefined ? "#DC2626" : "var(--text-dim)" }}>
                            {pk.TIU?.skor ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: tkpLulus ? "#16A34A" : pk.TKP?.skor !== undefined ? "#DC2626" : "var(--text-dim)" }}>
                            {pk.TKP?.skor ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 900, fontSize: 15, color: h.lulus ? "#16A34A" : "var(--c-dark-900)" }}>
                            {h.skor_total}
                          </span>
                        </td>
                        <td>
                          <span className="pill" style={{
                            fontSize: 11.5, padding: "3px 10px", borderRadius: 6,
                            background: h.lulus ? "var(--good-bg)" : "#FEE2E2",
                            color: h.lulus ? "var(--good-text)" : "#DC2626",
                          }}>
                            {h.lulus ? "LULUS" : "Tidak Lulus"}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-dim)" }}>
                          {fmtDate(h.created_at).split(",")[0]}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setDetailHasil(h)} title="Detail" style={{ padding: "4px 8px" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReset(h.id)} title="Hapus" style={{ padding: "4px 8px" }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0", borderTop: "1px solid var(--border)", marginTop: 8 }}>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>Halaman {page} dari {totalPages}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button key={pg} className={`btn btn-sm ${page === pg ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setPage(pg)} style={{ minWidth: 34 }}>{pg}</button>
                    );
                  })}
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {detailHasil && (
        <DetailHasilModal
          hasil={detailHasil}
          nama={profileMap[detailHasil.user_id]?.nama || "Peserta"}
          onClose={() => setDetailHasil(null)}
          onDelete={handleReset}
        />
      )}

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}

function DetailHasilModal({ hasil, nama, onClose, onDelete }) {
  const pk = hasil.per_kategori || {};
  const categories = [
    { key: "TWK", label: "Tes Wawasan Kebangsaan", pg: 65, max: 150 },
    { key: "TIU", label: "Tes Inteligensia Umum", pg: 80, max: 175 },
    { key: "TKP", label: "Tes Karakteristik Pribadi", pg: 166, max: 225 },
  ];

  return (
    <div className="modal-bg">
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 2px", color: "var(--c-dark-900)" }}>
              📋 Detail Hasil Ujian
            </h2>
            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>{nama}</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>✕ Tutup</button>
        </div>

        {/* Score summary */}
        <div style={{
          textAlign: "center", padding: "16px 0 20px",
          background: hasil.lulus ? "var(--good-bg)" : "#FEF2F2",
          borderRadius: "var(--radius-md)", marginBottom: 16,
          border: `1px solid ${hasil.lulus ? "var(--good-border)" : "#FECACA"}`
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: hasil.lulus ? "var(--good-text)" : "#DC2626", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            {hasil.lulus ? "✅ LULUS SKD" : "❌ TIDAK LULUS SKD"}
          </div>
          <div style={{ fontSize: 42, fontWeight: 900, color: hasil.lulus ? "#16A34A" : "#DC2626", lineHeight: 1 }}>
            {hasil.skor_total}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>Skor Total / 550</div>
        </div>

        {/* Per kategori breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {categories.map(cat => {
            const data = pk[cat.key] || {};
            const skor = data.skor ?? 0;
            const lulus = data.lulus;
            const pct = Math.round((skor / cat.max) * 100);
            return (
              <div key={cat.key} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 13 }}>{cat.key}</span>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", marginLeft: 6 }}>{cat.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 900, fontSize: 16, color: lulus ? "#16A34A" : "#DC2626" }}>{skor}</span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>/ {cat.max}</span>
                    <span className="pill" style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 5,
                      background: lulus ? "var(--good-bg)" : "#FEE2E2",
                      color: lulus ? "var(--good-text)" : "#DC2626"
                    }}>
                      {lulus ? "✅ Lulus" : `❌ PG ${cat.pg}`}
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: lulus ? "#16A34A" : "#DC2626", borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>
                  Ambang batas: {cat.pg} · Kamu: {skor} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 16 }}>
          Selesai: {new Date(hasil.created_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>

        <div className="flex-between">
          <button className="btn btn-danger btn-sm" onClick={() => { if (confirm("Hapus data hasil ini?")) onDelete(hasil.id); }}>
            🗑️ Hapus Data
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
