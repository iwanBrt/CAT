"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT, KATEGORI_LABEL } from "@/lib/constants";
import WordToolbarEditor from "@/components/WordToolbarEditor";
import ExcelImportModal from "@/components/ExcelImportModal";
import RenderOpsiContent from "@/components/RenderOpsiContent";
import CatImageLightbox from "@/components/CatImageLightbox";
import { compressImageFile, extractFirstImageUrl, extractCleanText } from "@/lib/imageUtils";
import { SOAL_DEMO_BKN } from "@/lib/dataSoalBkn";

export default function AdminSoalPage() {
  const supabase = createClient();

  const [kategoriTab, setKategoriTab] = useState("ALL"); // ALL | TWK | TIU | TKP
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AKTIF | NONAKTIF
  const [searchKeyword, setSearchKeyword] = useState("");
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Modal / Form States
  const [editingSoal, setEditingSoal] = useState(undefined); // undefined = closed, null = create new, object = editing
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [lightboxImg, setLightboxImg] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }

  async function muatDaftarSoal() {
    setLoading(true);
    let query = supabase.from("soal").select("*").order("created_at", { ascending: true });

    const { data, error } = await query;
    if (!error && data) {
      // Hitung nomor urut per kategori & nomor urut global
      const catCount = { TWK: 0, TIU: 0, TKP: 0 };
      const enriched = data.map((item, idx) => {
        catCount[item.kategori] = (catCount[item.kategori] || 0) + 1;
        return {
          ...item,
          noKategori: catCount[item.kategori],
          noGlobal: idx + 1,
        };
      });
      setSoalList(enriched);
    }
    setLoading(false);
  }

  useEffect(() => {
    muatDaftarSoal();
  }, []);

  // Filtered Questions with Smart Keyword Support (e.g. 'tkp 12', 'tiu 5', 'twk 1')
  const filteredSoal = useMemo(() => {
    const rawQuery = searchKeyword.trim().toLowerCase();

    // Regex untuk mendeteksi pola seperti "tkp 12", "tkp no 12", "tkp #12", "tkp-12", "tkp12"
    const catNoPattern = /^(twk|tiu|tkp)\s*(?:no\.?|nomor|#|-)?\s*(\d+)$/i;
    const catNoMatch = rawQuery.match(catNoPattern);

    // Regex untuk mendeteksi hanya nomor, misal "no 12", "#12", "12"
    const onlyNoPattern = /^(?:no\.?|nomor|#)\s*(\d+)$/i;
    const onlyNoMatch = rawQuery.match(onlyNoPattern);

    return soalList.filter((s) => {
      // Jika user mencari dengan pola spesifik kategori ("tkp 12"), abaikan filter tab agar langsung ditemukan
      if (!catNoMatch && kategoriTab !== "ALL" && s.kategori !== kategoriTab) return false;
      if (statusFilter === "AKTIF" && !s.aktif) return false;
      if (statusFilter === "NONAKTIF" && s.aktif) return false;

      if (!rawQuery) return true;

      // 1. Jika query seperti "tkp 12", "tiu 5", "twk 1"
      if (catNoMatch) {
        const targetCat = catNoMatch[1].toUpperCase();
        const targetNo = parseInt(catNoMatch[2], 10);
        return s.kategori === targetCat && (s.noKategori === targetNo || s.noGlobal === targetNo);
      }

      // 2. Jika query seperti "no 12" atau "#12"
      if (onlyNoMatch) {
        const targetNo = parseInt(onlyNoMatch[1], 10);
        return s.noKategori === targetNo || s.noGlobal === targetNo;
      }

      // 3. Pencarian teks umum (isi teks soal, opsi jawaban, pembahasan, badge nomor)
      const inTeks = s.teks?.toLowerCase().includes(rawQuery);
      const inOpsi = s.opsi?.some((o) => o.toLowerCase().includes(rawQuery));
      const inPembahasan = s.pembahasan?.toLowerCase().includes(rawQuery);
      const inKategoriBadge = `${s.kategori?.toLowerCase()} ${s.noKategori}`.includes(rawQuery) || `${s.kategori?.toLowerCase()} #${s.noKategori}`.includes(rawQuery);
      const inNoGlobal = `#${s.noGlobal}`.includes(rawQuery);

      return inTeks || inOpsi || inPembahasan || inKategoriBadge || inNoGlobal;
    });
  }, [soalList, kategoriTab, statusFilter, searchKeyword]);

  // Statistics counts
  const counts = useMemo(() => {
    const total = soalList.length;
    const twk = soalList.filter((s) => s.kategori === "TWK").length;
    const tiu = soalList.filter((s) => s.kategori === "TIU").length;
    const tkp = soalList.filter((s) => s.kategori === "TKP").length;
    const aktif = soalList.filter((s) => s.aktif).length;
    return { total, twk, tiu, tkp, aktif };
  }, [soalList]);

  async function toggleAktif(s) {
    const newStatus = !s.aktif;
    await supabase.from("soal").update({ aktif: newStatus }).eq("id", s.id);
    setSoalList((prev) => prev.map((item) => (item.id === s.id ? { ...item, aktif: newStatus } : item)));
    showToast(`Soal berhasil di-${newStatus ? "aktifkan" : "nonaktifkan"}.`);
  }

  async function hapusSoal(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus butir soal ini?")) return;
    await supabase.from("soal").delete().eq("id", id);
    setSoalList((prev) => prev.filter((item) => item.id !== id));
    showToast("Soal berhasil dihapus.");
  }

  // Export current question bank to XLSX
  function exportToExcel() {
    if (soalList.length === 0) {
      alert("Tidak ada data soal untuk diekspor.");
      return;
    }

    const rows = soalList.map((s, idx) => ({
      No: idx + 1,
      Kategori: s.kategori,
      "Teks Soal": s.teks?.replace(/<[^>]*>?/gm, ""), // strip html for clean sheet
      "Opsi A": s.opsi?.[0] || "",
      "Opsi B": s.opsi?.[1] || "",
      "Opsi C": s.opsi?.[2] || "",
      "Opsi D": s.opsi?.[3] || "",
      "Opsi E": s.opsi?.[4] || "",
      "Kunci Jawaban": s.kategori === "TKP" ? "" : String.fromCharCode(65 + (s.kunci || 0)),
      "Bobot TKP": s.kategori === "TKP" ? s.bobot?.join(", ") : "",
      Pembahasan: s.pembahasan?.replace(/<[^>]*>?/gm, "") || "",
      Status: s.aktif ? "Aktif" : "Nonaktif",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bank_Soal_CAT");
    XLSX.writeFile(workbook, `Bank_Soal_CAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Function to load 110 standard BKN demo questions
  async function handleMuatDemoSoal() {
    if (soalList.length > 0) {
      if (!confirm(`Saat ini sudah ada ${soalList.length} butir soal. Apakah Anda ingin menambahkan 110 butir soal standar BKN (30 TWK, 35 TIU, 45 TKP) ke dalam database?`)) {
        return;
      }
    }

    setSeedingLoading(true);
    try {
      // Clean structure for database (match Supabase table columns)
      const payload = SOAL_DEMO_BKN.map((item) => {
        const row = {
          kategori: item.kategori,
          teks: item.teks,
          opsi: item.opsi,
          aktif: true,
        };
        if (item.kategori === "TKP") {
          row.bobot = item.bobot;
          row.kunci = null;
        } else {
          row.kunci = item.kunci;
          row.bobot = null;
        }
        return row;
      });

      // Insert in chunks of 20 to avoid large payload limits
      const CHUNK_SIZE = 20;
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from("soal").insert(chunk);
        if (error) throw error;
      }

      showToast("Berhasil memuat 110 butir soal standar BKN!");
      await muatDaftarSoal();
    } catch (err) {
      console.error("Gagal muat soal demo:", err);
      alert(`Gagal memuat soal: ${err.message || "Pastikan Anda login sebagai admin."}`);
    } finally {
      setSeedingLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }} suppressHydrationWarning>
      {/* 1. Header & Quick Actions */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Kelola Bank Soal CAT
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Manajemen butir soal SKD (TWK, TIU, TKP) dengan editor lengkap dan impor file spreadsheet.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Quick Demo Seed Button */}
          

          {/* Export Button */}
          <button
            type="button"
            className="btn btn-secondary"
            suppressHydrationWarning
            onClick={exportToExcel}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Ekspor Excel</span>
          </button>

          {/* Import Excel Button */}
          <button
            type="button"
            className="btn btn-secondary"
            suppressHydrationWarning
            onClick={() => setShowExcelImport(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
              background: "#ECFDF5",
              color: "#059669",
              borderColor: "#A7F3D0",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span>Impor dari Excel</span>
          </button>

          {/* Add Question Button */}
          <button
            type="button"
            className="btn btn-primary"
            suppressHydrationWarning
            onClick={() => setEditingSoal(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>+ Buat Soal Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Category Statistic Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}>
        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-forest-700)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Total Soal</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-dark-900)" }}>{counts.total}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
            TWK
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Wawasan Kebangsaan</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-dark-900)" }}>{counts.twk}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#F0FDF4", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
            TIU
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Intelijensia Umum</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-dark-900)" }}>{counts.tiu}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
            TKP
          </div>
          <div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Karakteristik Pribadi</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-dark-900)" }}>{counts.tkp}</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "ALL", label: "Semua Kategori" },
              { id: "TWK", label: "TWK (Kebangsaan)" },
              { id: "TIU", label: "TIU (Intelijensia)" },
              { id: "TKP", label: "TKP (Kepribadian)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${kategoriTab === tab.id ? "btn-primary" : "btn-secondary"}`}
                style={{ fontWeight: 700 }}
                onClick={() => setKategoriTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Status Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, maxWidth: 500, minWidth: 280 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Cari... (misal: 'tkp 12', 'tiu 5', 'twk 1')"
                  style={{ paddingLeft: 34, fontSize: 13 }}
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 130, fontSize: 13 }}
              >
                <option value="ALL">Semua Status</option>
                <option value="AKTIF">Hanya Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
              </select>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)", paddingLeft: 2 }}>
              💡 <em>Ketik <strong>&quot;tkp 12&quot;</strong>, <strong>&quot;tiu 5&quot;</strong>, atau <strong>&quot;twk 1&quot;</strong> untuk mencari nomor soal tertentu.</em>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Question Cards List */}
      <div>
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
            <p className="muted" style={{ fontWeight: 600 }}>Memuat daftar soal...</p>
          </div>
        ) : filteredSoal.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--text-dim)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </div>
            <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--c-dark-900)" }}>Tidak ada soal yang sesuai</h3>
            <p className="muted" style={{ fontSize: 13, margin: "0 0 16px" }}>
              Silakan sesuaikan filter pencarian atau tambahkan soal baru.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setEditingSoal(null)}>
              + Buat Soal Sekarang
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="muted" style={{ fontSize: 12.5, paddingLeft: 4 }}>
              Menampilkan <b>{filteredSoal.length}</b> butir soal
            </div>

            {filteredSoal.map((soal, idx) => (
              <div key={soal.id} className="soal-card-item">
                <div className="flex-between" style={{ marginBottom: 12, alignItems: "flex-start", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Badge Nomor Spesifik Kategori */}
                    <span style={{
                      fontWeight: 800,
                      fontSize: 13,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: soal.kategori === "TWK" ? "#EFF6FF" : soal.kategori === "TIU" ? "#F0FDF4" : "#FEF3C7",
                      color: soal.kategori === "TWK" ? "#1D4ED8" : soal.kategori === "TIU" ? "#15803D" : "#B45309",
                      border: `1px solid ${soal.kategori === "TWK" ? "#BFDBFE" : soal.kategori === "TIU" ? "#BBF7D0" : "#FDE68A"}`
                    }}>
                      {soal.kategori} #{soal.noKategori || idx + 1}
                    </span>

                    <span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-dim)" }}>
                      (Global #{soal.noGlobal || idx + 1})
                    </span>

                    <span className={`pill ${soal.kategori === "TWK" ? "pill-primary" : soal.kategori === "TIU" ? "pill-good" : "pill-warn"}`} style={{ fontWeight: 800 }}>
                      {KATEGORI_LABEL[soal.kategori] || soal.kategori}
                    </span>

                    <span className={`pill ${soal.aktif ? "pill-good" : "pill-bad"}`}>
                      {soal.aktif ? "● Aktif" : "○ Nonaktif"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      suppressHydrationWarning
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSoal(soal);
                      }}
                      style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      suppressHydrationWarning
                      onClick={() => toggleAktif(soal)}
                      title={soal.aktif ? "Nonaktifkan Soal" : "Aktifkan Soal"}
                    >
                      {soal.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      suppressHydrationWarning
                      onClick={() => hapusSoal(soal.id)}
                      title="Hapus Soal"
                      style={{ padding: "5px 8px" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Text (Supports Rich HTML from Word Toolbar) */}
                <div
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: "var(--c-dark-900)",
                    fontWeight: 600,
                    marginBottom: 14,
                    cursor: "default",
                  }}
                  dangerouslySetInnerHTML={{ __html: soal.teks }}
                  onClick={(e) => {
                    if (e.target && e.target.tagName === "IMG") {
                      setLightboxImg(e.target.src);
                    }
                  }}
                />

                {/* Options List */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {soal.opsi?.map((op, oIdx) => {
                    const isCorrect = soal.kategori !== "TKP" && soal.kunci === oIdx;
                    const bobotVal = soal.kategori === "TKP" && soal.bobot?.[oIdx];
                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          fontSize: 13,
                          background: isCorrect ? "var(--good-bg)" : "var(--bg)",
                          border: isCorrect ? "1.5px solid var(--good)" : "1px solid var(--border)",
                        }}
                      >
                        <span style={{
                          fontWeight: 800,
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: isCorrect ? "var(--good)" : "var(--c-neutral-200)",
                          color: isCorrect ? "#FFF" : "var(--text)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11.5,
                          flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <div style={{ flex: 1, color: isCorrect ? "var(--good-text)" : "var(--text)", fontWeight: isCorrect ? 700 : 400, minWidth: 0 }}>
                          <RenderOpsiContent content={op} imageMaxHeight={90} />
                        </div>
                        {soal.kategori === "TKP" && bobotVal !== undefined && (
                          <span className="pill pill-warn" style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", flexShrink: 0 }}>
                            Skor: {bobotVal}
                          </span>
                        )}
                        {isCorrect && (
                          <span style={{ color: "var(--good)", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                            ✓ Kunci
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pembahasan snippet if present */}
                {soal.pembahasan && (
                  <div style={{
                    fontSize: 12.5,
                    padding: "8px 12px",
                    background: "var(--c-neutral-100)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-dim)",
                    borderLeft: "3px solid var(--c-forest-600)"
                  }}>
                    <b>Pembahasan:</b> <span dangerouslySetInnerHTML={{ __html: soal.pembahasan }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Complete Microsoft Word Style Question Form Modal */}
      {editingSoal !== undefined && (
        <FormSoalWordModal
          key={editingSoal ? editingSoal.id : "baru"}
          soal={editingSoal}
          kategoriAwal={kategoriTab === "ALL" ? "TWK" : kategoriTab}
          onClose={() => setEditingSoal(undefined)}
          onSaved={(savedSoal) => {
            setEditingSoal(undefined);
            muatDaftarSoal();
            showToast("Butir soal berhasil disimpan ke bank soal.");
          }}
        />
      )}

      {/* 6. Excel Importer Modal */}
      {showExcelImport && (
        <ExcelImportModal
          onClose={() => setShowExcelImport(false)}
          onImportSuccess={(count) => {
            setShowExcelImport(false);
            muatDaftarSoal();
            showToast(`Sukses mengimpor ${count} butir soal dari Excel!`);
          }}
        />
      )}

      {/* Lightbox Zoom Gambar */}
      {lightboxImg && (
        <CatImageLightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />
      )}

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}

// Helpers for safe parsing in modal
function parseOpsiList(val) {
  if (Array.isArray(val)) return val.map((x) => (typeof x === "string" ? x : String(x ?? "")));
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((x) => (typeof x === "string" ? x : String(x ?? "")));
    } catch {}
  }
  return ["", "", "", "", ""];
}

function parseBobotList(val, length = 5) {
  if (Array.isArray(val)) return val.map((x) => parseInt(x, 10) || 1);
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map((x) => parseInt(x, 10) || 1);
    } catch {}
  }
  const defaultBobot = [5, 4, 3, 2, 1];
  return Array.from({ length }, (_, i) => defaultBobot[i] ?? 3);
}

// =========================================================================
// Option Image Picker (File Upload & URL with Preview & Delete)
// =========================================================================
function OptionImagePicker({ image, onChange, letter }) {
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 500, maxHeight: 500, quality: 0.85 });
      onChange(dataUrl);
      setShowInput(false);
    } catch (err) {
      alert("Gagal memproses gambar: " + err.message);
    }
  }

  function handleUrl() {
    if (!url.trim()) return;
    onChange(url.trim());
    setUrl("");
    setShowInput(false);
  }

  if (image) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={`Gambar Pilihan ${letter}`}
          style={{
            width: 44,
            height: 44,
            objectFit: "contain",
            borderRadius: 6,
            border: "1.5px solid var(--c-forest-600)",
            background: "#FFFFFF",
          }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange("")}
          title="Hapus gambar pilihan ini"
          style={{ padding: "4px 8px", fontSize: 11, color: "var(--bad)", fontWeight: 700 }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => setShowInput(!showInput)}
        title={`Tambah gambar untuk pilihan ${letter}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11.5,
          padding: "5px 8px",
          fontWeight: 600,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span>+ Gambar</span>
      </button>

      {showInput && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          zIndex: 150,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-md)",
          padding: 10,
          width: 250,
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-dark-900)" }}>
            Gambar Pilihan {letter}
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 3 }}>
              Pilih File Komputer
            </label>
            <input
              type="file"
              ref={fileRef}
              accept="image/*"
              onChange={handleFile}
              style={{ fontSize: 11, width: "100%" }}
            />
          </div>

          <div style={{ height: 1, background: "var(--border)" }} />

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 3 }}>
              Atau Link/URL Gambar
            </label>
            <div style={{ display: "flex", gap: 4 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                style={{ fontSize: 11, padding: "3px 6px", flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleUrl}
                style={{ fontSize: 11, padding: "3px 8px" }}
              >
                OK
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowInput(false)}
            style={{ fontSize: 10.5, padding: "2px 6px" }}
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Complete Microsoft Word Style Question Creator / Editor Modal
// =========================================================================
function FormSoalWordModal({ soal, kategoriAwal, onClose, onSaved }) {
  const supabase = createClient();
  const isEdit = !!soal;

  const [activeTab, setActiveTab] = useState("editor"); // "editor" | "preview"

  // Form State
  const [kategori, setKategori] = useState(soal?.kategori || kategoriAwal);
  const [teks, setTeks] = useState(soal?.teks || "");

  // Options split into Text and Image for intuitive editing
  const initialParsed = useMemo(() => parseOpsiList(soal?.opsi), [soal]);
  const [opsiTexts, setOpsiTexts] = useState(() => initialParsed.map((item) => extractCleanText(item)));
  const [opsiImages, setOpsiImages] = useState(() => initialParsed.map((item) => extractFirstImageUrl(item) || ""));

  const [kunci, setKunci] = useState(() => (typeof soal?.kunci === "number" ? soal.kunci : 0));
  const [bobot, setBobot] = useState(() => parseBobotList(soal?.bobot, soal?.opsi?.length || 5));
  const [pembahasan, setPembahasan] = useState(soal?.pembahasan || "");
  const [aktif, setAktif] = useState(soal ? soal.aktif : true);
  const [saving, setSaving] = useState(false);

  // Live CAT Preview selected answer state
  const [previewJawaban, setPreviewJawaban] = useState(null);

  function ubahOpsiText(idx, val) {
    const next = [...opsiTexts];
    next[idx] = val;
    setOpsiTexts(next);
  }

  function ubahOpsiImage(idx, val) {
    const next = [...opsiImages];
    next[idx] = val;
    setOpsiImages(next);
  }

  function ubahBobot(idx, val) {
    const next = [...bobot];
    next[idx] = Math.max(1, Math.min(5, parseInt(val, 10) || 1));
    setBobot(next);
  }

  function tambahOpsi() {
    if (opsiTexts.length >= 6) return;
    setOpsiTexts([...opsiTexts, ""]);
    setOpsiImages([...opsiImages, ""]);
    setBobot([...bobot, 3]);
  }

  function hapusOpsi(idx) {
    if (opsiTexts.length <= 2) return;
    setOpsiTexts(opsiTexts.filter((_, i) => i !== idx));
    setOpsiImages(opsiImages.filter((_, i) => i !== idx));
    setBobot(bobot.filter((_, i) => i !== idx));
    if (kunci >= opsiTexts.length - 1) setKunci(0);
  }

  function buildCombinedOpsi() {
    return opsiTexts.map((txt, idx) => {
      const img = opsiImages[idx];
      const t = (txt || "").trim();
      if (img && t) {
        return `<div class="cat-opsi-item"><img src="${img}" alt="Pilihan" style="max-height:110px; max-width:100%; border-radius:6px; object-fit:contain; display:block; margin-bottom:6px;" /><span style="display:block;">${t}</span></div>`;
      }
      if (img) {
        return `<img src="${img}" alt="Pilihan" style="max-height:110px; max-width:100%; border-radius:6px; object-fit:contain; display:block;" />`;
      }
      return t;
    });
  }

  async function handleSimpan() {
    const combinedOpsi = buildCombinedOpsi();

    if (!teks.trim() || combinedOpsi.some((o, i) => !opsiTexts[i]?.trim() && !opsiImages[i])) {
      alert("Harap lengkapi pertanyaan soal dan setiap pilihan jawaban (berupa teks atau gambar).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        kategori,
        teks: teks.trim(),
        opsi: combinedOpsi,
        aktif,
        kunci: kategori === "TKP" ? null : kunci,
        bobot: kategori === "TKP" ? (Array.isArray(bobot) ? bobot.slice(0, combinedOpsi.length) : [5, 4, 3, 2, 1]) : null,
      };

      if (isEdit) {
        const { error } = await supabase.from("soal").update(payload).eq("id", soal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("soal").insert(payload);
        if (error) throw error;
      }

      onSaved(payload);
    } catch (err) {
      alert("Gagal menyimpan soal: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 880, maxHeight: "92vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header Modal */}
        <div className="flex-between" style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--c-forest-600)",
              color: "#FFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800
            }}>
              {isEdit ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 2px", color: "var(--c-dark-900)" }}>
                {isEdit ? "Edit Butir Soal" : "Buat Butir Soal Baru"}
              </h2>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                Lengkapi pertanyaan, pilihan jawaban (teks/gambar), bobot penilaian, dan pembahasan.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: "flex", background: "var(--c-neutral-100)", padding: 3, borderRadius: "var(--radius-md)" }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "editor" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("editor")}
              style={{ border: "none", borderRadius: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Form Editor</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "preview" ? "btn-primary" : ""}`}
              onClick={() => setActiveTab("preview")}
              style={{ border: "none", borderRadius: 6, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Pratinjau Ujian</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 0" }}>
          {activeTab === "editor" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Row 1: Kategori & Status */}
              <div className="row" style={{ alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontWeight: 700 }}>Kategori Ujian SKD</label>
                  <select value={kategori} onChange={(e) => setKategori(e.target.value)}>
                    {KATEGORI_URUT.map((k) => (
                      <option key={k} value={k}>
                        {k} - {KATEGORI_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontWeight: 700 }}>Status Publikasi Soal</label>
                  <select value={aktif ? "true" : "false"} onChange={(e) => setAktif(e.target.value === "true")}>
                    <option value="true">Aktif (Dapat Diujikan)</option>
                    <option value="false">Nonaktif (Disembunyikan)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Pertanyaan Soal dengan Word Toolbar */}
              <div>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <label style={{ fontWeight: 700, margin: 0 }}>
                    Pertanyaan / Teks Soal <span style={{ color: "var(--bad)" }}>*</span>
                  </label>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    Gunakan tombol <strong>+ Gambar</strong> di toolbar untuk menyisipkan diagram/figural, atau tempel (Ctrl+V) langsung.
                  </span>
                </div>
                <WordToolbarEditor
                  value={teks}
                  onChange={setTeks}
                  placeholder="Ketik pertanyaan soal di sini. Anda juga bisa menyisipkan gambar pola, diagram, atau simbol matematika..."
                  minHeight={150}
                />
              </div>

              {/* Row 3: Opsi Pilihan Jawaban (Mendukung Teks dan Gambar) */}
              <div>
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 700, margin: 0 }}>
                    {kategori === "TKP"
                      ? "Pilihan Jawaban & Bobot Nilai (1 - 5) - Mendukung Teks / Gambar"
                      : "Pilihan Jawaban (Pilih Radio Button untuk Kunci Jawaban Benar)"}
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={tambahOpsi}
                    disabled={opsiTexts.length >= 6}
                    style={{ fontSize: 12, padding: "3px 10px", fontWeight: 700 }}
                  >
                    + Tambah Opsi
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {opsiTexts.map((opText, idx) => {
                    const isSelectedKey = kategori !== "TKP" && kunci === idx;
                    const letter = String.fromCharCode(65 + idx);
                    const hasImage = !!opsiImages[idx];

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: "var(--radius-md)",
                          background: isSelectedKey ? "var(--good-bg)" : "var(--surface)",
                          border: isSelectedKey ? "1.5px solid var(--good)" : "1px solid var(--border)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {/* Radio for TWK / TIU */}
                        {kategori !== "TKP" && (
                          <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0, cursor: "pointer", flexShrink: 0 }}>
                            <input
                              type="radio"
                              name="kunciJawaban"
                              checked={kunci === idx}
                              onChange={() => setKunci(idx)}
                              style={{ width: 18, height: 18, accentColor: "var(--good)", cursor: "pointer" }}
                            />
                            <span style={{ fontWeight: 800, width: 20, fontSize: 14 }}>
                              {letter}.
                            </span>
                          </label>
                        )}

                        {/* Letter badge for TKP */}
                        {kategori === "TKP" && (
                          <span style={{
                            fontWeight: 800,
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: "var(--c-neutral-200)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            flexShrink: 0
                          }}>
                            {letter}
                          </span>
                        )}

                        {/* Option Text Input */}
                        <input
                          type="text"
                          value={opText}
                          onChange={(e) => ubahOpsiText(idx, e.target.value)}
                          placeholder={hasImage ? `(Opsional) Keterangan Gambar Pilihan ${letter}` : `Teks Pilihan ${letter}`}
                          style={{
                            flex: 1,
                            borderColor: isSelectedKey ? "var(--good)" : "var(--border)",
                            background: isSelectedKey ? "#FFFFFF" : "var(--surface)",
                          }}
                        />

                        {/* Image Picker for Option */}
                        <OptionImagePicker
                          image={opsiImages[idx]}
                          onChange={(newImg) => ubahOpsiImage(idx, newImg)}
                          letter={letter}
                        />

                        {/* TKP Weight Score input (1-5) */}
                        {kategori === "TKP" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)" }}>Skor:</span>
                            <select
                              value={bobot[idx] || 3}
                              onChange={(e) => ubahBobot(idx, e.target.value)}
                              style={{ width: 68, fontWeight: 800, textAlign: "center" }}
                            >
                              <option value="5">5 poin</option>
                              <option value="4">4 poin</option>
                              <option value="3">3 poin</option>
                              <option value="2">2 poin</option>
                              <option value="1">1 poin</option>
                            </select>
                          </div>
                        )}

                        {/* Remove Option Button */}
                        {opsiTexts.length > 2 && (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => hapusOpsi(idx)}
                            title="Hapus opsi ini"
                            style={{ padding: "6px 8px", flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Pembahasan Soal dengan Word Toolbar */}
              <div>
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <label style={{ fontWeight: 700, margin: 0 }}>
                    Pembahasan / Kunci Jawaban Lengkap (Opsional)
                  </label>
                  <span className="muted" style={{ fontSize: 11.5 }}>
                    Ditampilkan kepada peserta pada ringkasan hasil ujian atau evaluasi.
                  </span>
                </div>
                <WordToolbarEditor
                  value={pembahasan}
                  onChange={setPembahasan}
                  placeholder="Tuliskan pembahasan dan rumus penyelesaian secara detail di sini..."
                  minHeight={110}
                />
              </div>
            </div>
          ) : (
            /* Live CAT Exam Preview Tab */
            <div style={{ background: "var(--bg)", borderRadius: "var(--radius-lg)", padding: 20, border: "1px solid var(--border)" }}>
              <div className="flex-between" style={{ marginBottom: 14 }}>
                <span className="pill pill-primary" style={{ fontWeight: 800 }}>
                  Pratinjau Ujian Siswa ({kategori})
                </span>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  Waktu Tersisa: 01:39:50
                </span>
              </div>

              <div style={{
                background: "var(--surface)",
                padding: "20px 24px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                marginBottom: 16
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-forest-600)", marginBottom: 8 }}>
                  SOAL NOMOR 1
                </div>
                <div
                  style={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "var(--c-dark-900)" }}
                  dangerouslySetInnerHTML={{ __html: teks || "<i>(Belum ada teks pertanyaan)</i>" }}
                />
              </div>

              {/* Option Radios with RenderOpsiContent */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {buildCombinedOpsi().map((op, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewJawaban(idx)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: "var(--radius-md)",
                      background: previewJawaban === idx ? "var(--c-mint-100)" : "var(--surface)",
                      border: previewJawaban === idx ? "1.5px solid var(--c-forest-600)" : "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="radio"
                      checked={previewJawaban === idx}
                      onChange={() => setPreviewJawaban(idx)}
                      style={{ width: 18, height: 18, accentColor: "var(--c-forest-600)", marginTop: 2, flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 800, width: 22, color: "var(--c-forest-700)", marginTop: 2, flexShrink: 0 }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <div style={{ fontSize: 14, color: "var(--text)", flex: 1 }}>
                      <RenderOpsiContent content={op} imageMaxHeight={110} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-between" style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleSimpan}
            disabled={saving}
            style={{ fontWeight: 800, padding: "10px 24px" }}
          >
            {saving ? "Menyimpan ke Database..." : isEdit ? "Simpan Perubahan Soal" : "Tambahkan Soal ke Bank Soal"}
          </button>
        </div>
      </div>
    </div>
  );
}
