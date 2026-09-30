"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function fmt(n) { return (n ?? 0).toLocaleString("id-ID"); }
function fmtDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function PesertaPageInner() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [pesertaList, setPesertaList] = useState([]);
  const [hasilMap, setHasilMap] = useState({}); // user_id → latest hasil
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");

  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | LULUS | TIDAK | BELUM
  const [sortBy, setSortBy] = useState("created_at"); // created_at | nama | skor
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const PER_PAGE = 20;

  function showToast(msg, type = "success") {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(""), 3500);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: hasil }] = await Promise.all([
      supabase.from("profiles").select("id, nama, role, created_at").order("created_at", { ascending: false }),
      supabase.from("hasil").select("user_id, skor_total, lulus, created_at, per_kategori").order("created_at", { ascending: false }),
    ]);

    // Map latest hasil per user
    const hMap = {};
    (hasil || []).forEach(h => {
      if (!hMap[h.user_id]) hMap[h.user_id] = h;
    });

    setPesertaList((profiles || []).filter(p => p.role === "peserta"));
    setHasilMap(hMap);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let list = [...pesertaList];

    // Filter search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.nama?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
    }

    // Filter status ujian
    if (filterStatus === "LULUS") list = list.filter(p => hasilMap[p.id]?.lulus === true);
    if (filterStatus === "TIDAK") list = list.filter(p => hasilMap[p.id] && hasilMap[p.id].lulus === false);
    if (filterStatus === "BELUM") list = list.filter(p => !hasilMap[p.id]);

    // Sort
    list.sort((a, b) => {
      let va, vb;
      if (sortBy === "nama") { va = a.nama || ""; vb = b.nama || ""; }
      else if (sortBy === "skor") { va = hasilMap[a.id]?.skor_total ?? -1; vb = hasilMap[b.id]?.skor_total ?? -1; }
      else { va = a.created_at || ""; vb = b.created_at || ""; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [pesertaList, hasilMap, search, filterStatus, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  }

  async function handleDelete(userId) {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) { showToast("Gagal hapus: " + error.message, "error"); }
    else {
      setPesertaList(prev => prev.filter(p => p.id !== userId));
      showToast("Peserta berhasil dihapus.");
    }
    setShowDeleteConfirm(null);
  }

  async function handleSaveEdit(updated) {
    const { error } = await supabase.from("profiles")
      .update({ nama: updated.nama })
      .eq("id", updated.id);
    if (error) { showToast("Gagal menyimpan: " + error.message, "error"); return; }
    setPesertaList(prev => prev.map(p => p.id === updated.id ? { ...p, nama: updated.nama } : p));
    setEditingUser(null);
    showToast("Data peserta berhasil diperbarui.");
  }

  // Summary counts
  const totalLulus = pesertaList.filter(p => hasilMap[p.id]?.lulus === true).length;
  const totalTidak = pesertaList.filter(p => hasilMap[p.id] && !hasilMap[p.id].lulus).length;
  const totalBelum = pesertaList.filter(p => !hasilMap[p.id]).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Kelola Peserta
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Manajemen data peserta, pantau status ujian, dan lihat hasil nilai.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={loadData}
          style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Peserta", value: pesertaList.length, color: "#2563EB", bg: "#EFF6FF" },
          { label: "Sudah Ujian", value: totalLulus + totalTidak, color: "#7C3AED", bg: "#EDE9FE" },
          { label: "Lulus SKD", value: totalLulus, color: "#16A34A", bg: "#F0FDF4" },
          { label: "Belum Ujian", value: totalBelum, color: "#D97706", bg: "#FFFBEB" },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
              {loading ? "·" : fmt(s.value)}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama peserta atau ID..."
              style={{ paddingLeft: 34, fontSize: 13 }}
            />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Status Filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Semua" },
              { id: "LULUS", label: "Lulus" },
              { id: "TIDAK", label: "Tidak Lulus" },
              { id: "BELUM", label: "Belum Ujian" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${filterStatus === tab.id ? "btn-primary" : "btn-secondary"}`}
                style={{ fontWeight: 700 }}
                onClick={() => { setFilterStatus(tab.id); setPage(1); }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginLeft: "auto" }}>
            {filtered.length} peserta ditemukan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
            <p className="muted" style={{ fontWeight: 600 }}>Memuat data peserta...</p>
          </div>
        ) : paged.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: "var(--text-dim)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--c-dark-900)" }}>Tidak ada peserta</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>Belum ada peserta terdaftar atau sesuaikan filter pencarian.</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>No</th>
                    <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("nama")}>
                      Nama {sortBy === "nama" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th>Status Ujian</th>
                    <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("skor")}>
                      Skor Total {sortBy === "skor" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th>TWK / TIU / TKP</th>
                    <th style={{ cursor: "pointer", userSelect: "none" }} onClick={() => toggleSort("created_at")}>
                      Daftar {sortBy === "created_at" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th style={{ width: 110 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p, idx) => {
                    const h = hasilMap[p.id];
                    const pk = h?.per_kategori || {};
                    return (
                      <tr key={p.id}>
                        <td style={{ color: "var(--text-dim)", fontWeight: 600, fontSize: 12 }}>
                          {(page - 1) * PER_PAGE + idx + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "var(--c-dark-900)", fontSize: 13.5 }}>{p.nama || "-"}</div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "monospace" }}>{p.id.slice(0, 16)}...</div>
                        </td>
                        <td>
                          {!h ? (
                            <span className="pill" style={{ background: "#FEF3C7", color: "#D97706", fontSize: 11.5, padding: "3px 10px", borderRadius: 6 }}>
                              Belum Ujian
                            </span>
                          ) : h.lulus ? (
                            <span className="pill" style={{ background: "var(--good-bg)", color: "var(--good-text)", fontSize: 11.5, padding: "3px 10px", borderRadius: 6 }}>
                              LULUS
                            </span>
                          ) : (
                            <span className="pill" style={{ background: "#FEE2E2", color: "#DC2626", fontSize: 11.5, padding: "3px 10px", borderRadius: 6 }}>
                              Tidak Lulus
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: 800, fontSize: 16, color: h ? "var(--c-dark-900)" : "var(--text-dim)" }}>
                            {h ? h.skor_total : "—"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                          {h ? `${pk.TWK?.skor ?? "—"} / ${pk.TIU?.skor ?? "—"} / ${pk.TKP?.skor ?? "—"}` : "— / — / —"}
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-dim)" }}>{fmtDate(p.created_at)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingUser({ ...p })}
                              style={{ padding: "4px 8px", fontSize: 12 }}
                              title="Edit data peserta"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setShowDeleteConfirm(p)}
                              style={{ padding: "4px 8px", fontSize: 12 }}
                              title="Hapus peserta"
                            >
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
                <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
                  Halaman {page} dari {totalPages} · {filtered.length} peserta
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <button
                        key={pg}
                        className={`btn btn-sm ${page === pg ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => setPage(pg)}
                        style={{ minWidth: 34 }}
                      >
                        {pg}
                      </button>
                    );
                  })}
                  <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditPesertaModal
          peserta={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-bg">
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px", color: "var(--c-dark-900)" }}>
              Hapus Peserta?
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--text-dim)", margin: "0 0 20px" }}>
              Anda akan menghapus peserta <b style={{ color: "var(--c-dark-900)" }}>{showDeleteConfirm.nama}</b>. 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data hasil ujian peserta ini.
            </p>
            <div className="flex-between">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm.id)}>
                Ya, Hapus Peserta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="toast" style={{ background: toastMsg.type === "error" ? "#DC2626" : undefined }}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}

function EditPesertaModal({ peserta, onClose, onSave }) {
  const [nama, setNama] = useState(peserta.nama || "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nama.trim()) return;
    setSaving(true);
    await onSave({ ...peserta, nama: nama.trim() });
    setSaving(false);
  }

  return (
    <div className="modal-bg">
      <div className="modal" style={{ maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "var(--c-forest-600)" }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
            Edit Data Peserta
          </h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 6, fontSize: 13 }}>Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="Nama lengkap peserta"
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontWeight: 700, display: "block", marginBottom: 6, fontSize: 13 }}>ID Peserta</label>
            <input value={peserta.id} disabled style={{ opacity: 0.6, fontFamily: "monospace", fontSize: 12 }} />
          </div>
          <div className="flex-between" style={{ marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Batal</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !nama.trim()}>
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPesertaPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 12px" }} />
        <p style={{ color: "var(--text-dim)", fontWeight: 600 }}>Memuat data peserta...</p>
      </div>
    }>
      <PesertaPageInner />
    </Suspense>
  );
}
