"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CONFIG, TOTAL_DURASI_MENIT } from "@/lib/constants";

function fmt(n) { return (n ?? 0).toLocaleString("id-ID"); }

function fmtDate(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

// Format datetime-local value from ISO/timestamp
function toDatetimeLocal(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Check if current time is within exam window
function checkSesiDalamJadwal(sesiMulai, sesiSelesai) {
  const now = new Date();
  if (sesiMulai && new Date(sesiMulai) > now) return "belum";     // belum mulai
  if (sesiSelesai && new Date(sesiSelesai) < now) return "berakhir"; // sudah berakhir
  return "dalam";   // dalam rentang waktu
}

export default function AdminUjianPage() {
  const supabase = createClient();

  const [config, setConfig] = useState(null);
  const [hasilList, setHasilList] = useState([]);
  const [sesiPeserta, setSesiPeserta] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingPin, setSavingPin] = useState(false);
  const [savingSesi, setSavingSesi] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showResetModal, setShowResetModal] = useState(null);
  const [showNonaktifModal, setShowNonaktifModal] = useState(false);

  // Sesi ujian config (status + waktu)
  const [sesiStatus, setSesiStatus] = useState("tutup"); // "buka" | "tutup"
  const [sesiMulai, setSesiMulai] = useState("");
  const [sesiSelesai, setSesiSelesai] = useState("");
  const [editingJadwal, setEditingJadwal] = useState(false);

  function showToast(msg, type = "success") {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(""), 3500);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cfgRes, hasilRes, sesiRes, profilesRes] = await Promise.all([
      supabase.from("config").select("*").eq("id", "default").maybeSingle(),
      supabase.from("hasil").select("id, user_id, skor_total, lulus, created_at, waktu_mulai, per_kategori").order("created_at", { ascending: false }).limit(50),
      supabase.from("sesi_aktif").select("user_id, updated_at"),
      supabase.from("profiles").select("id, nama"),
    ]);

    const cfg = cfgRes.data;
    const hasil = hasilRes.data;
    const sesi = sesiRes.data;
    const profiles = profilesRes.data;

    const pMap = {};
    (profiles || []).forEach(p => { pMap[p.id] = p; });

    const activePin = cfg?.pin_ujian || cfg?.kategori?._pin || "123456";
    setConfig(cfg);
    setNewPin(activePin);
    setHasilList(hasil || []);
    setSesiPeserta(sesi || []);
    setProfileMap(pMap);

    // Load sesi status
    const kat = cfg?.kategori || {};
    setSesiStatus(kat._sesi_status || "tutup");
    setSesiMulai(kat._sesi_mulai || "");
    setSesiSelesai(kat._sesi_selesai || "");

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // --- PIN ---
  async function handleUpdatePin() {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      showToast("PIN harus 6 digit angka.", "error"); return;
    }
    setSavingPin(true);
    const currentKategori = config?.kategori || DEFAULT_CONFIG.kategori;
    const updatedKategori = { ...currentKategori, _pin: newPin };

    let { error } = await supabase.from("config").upsert({
      id: "default",
      nama_ujian: config?.nama_ujian || DEFAULT_CONFIG.namaUjian,
      kategori: updatedKategori,
      pin_ujian: newPin,
    });

    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("pin_ujian"))) {
      const fallbackRes = await supabase.from("config").upsert({
        id: "default",
        nama_ujian: config?.nama_ujian || DEFAULT_CONFIG.namaUjian,
        kategori: updatedKategori,
      });
      error = fallbackRes.error;
    }

    setSavingPin(false);
    if (error) { showToast("Gagal memperbarui PIN: " + error.message, "error"); return; }
    setConfig(prev => ({ ...prev, pin_ujian: newPin, kategori: updatedKategori }));
    showToast("PIN Ujian berhasil diperbarui ke " + newPin);
  }

  function generateNewPin() {
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPin(pin);
  }

  // --- STATUS SESI UJIAN ---
  async function handleBukaSesi() {
    setSavingSesi(true);
    const currentKategori = config?.kategori || DEFAULT_CONFIG.kategori;
    const updatedKategori = {
      ...currentKategori,
      _sesi_status: "buka",
      _sesi_mulai: sesiMulai || new Date().toISOString(),
      _sesi_selesai: sesiSelesai || "",
    };
    await saveSesiConfig(updatedKategori);
    setSesiStatus("buka");
    setSavingSesi(false);
    setEditingJadwal(false);
    showToast("Sesi ujian berhasil dibuka.");
  }

  async function handleTutupSesi() {
    // Tutup sesi: nonaktifkan akses ujian
    setSavingSesi(true);
    const currentKategori = config?.kategori || DEFAULT_CONFIG.kategori;
    const updatedKategori = {
      ...currentKategori,
      _sesi_status: "tutup",
    };
    await saveSesiConfig(updatedKategori);
    setSesiStatus("tutup");
    setSavingSesi(false);
    setShowNonaktifModal(false);
    showToast("Sesi ujian ditutup. Ubah PIN untuk membuka sesi baru.");
  }

  async function saveSesiConfig(updatedKategori) {
    let { error } = await supabase.from("config").upsert({
      id: "default",
      nama_ujian: config?.nama_ujian || DEFAULT_CONFIG.namaUjian,
      kategori: updatedKategori,
      pin_ujian: config?.pin_ujian || newPin,
    });
    if (error && (error.code === "PGRST204" || error.code === "42703" || error.message?.includes("pin_ujian"))) {
      await supabase.from("config").upsert({
        id: "default",
        nama_ujian: config?.nama_ujian || DEFAULT_CONFIG.namaUjian,
        kategori: updatedKategori,
      });
    }
    setConfig(prev => ({ ...prev, kategori: updatedKategori }));
  }

  async function handleSimpanJadwal() {
    setSavingSesi(true);
    const currentKategori = config?.kategori || DEFAULT_CONFIG.kategori;
    const updatedKategori = {
      ...currentKategori,
      _sesi_mulai: sesiMulai,
      _sesi_selesai: sesiSelesai,
      _sesi_status: sesiStatus,
    };
    await saveSesiConfig(updatedKategori);
    setSavingSesi(false);
    setEditingJadwal(false);
    showToast("Jadwal sesi ujian berhasil disimpan.");
  }

  async function handleKickSesi(userId) {
    const { error } = await supabase.from("sesi_aktif").delete().eq("user_id", userId);
    if (error) { showToast("Gagal hapus sesi: " + error.message, "error"); return; }
    setSesiPeserta(prev => prev.filter(s => s.user_id !== userId));
    showToast("Sesi peserta berhasil dihentikan.");
  }

  async function handleHapusHasil(hasilId) {
    const { error } = await supabase.from("hasil").delete().eq("id", hasilId);
    if (error) { showToast("Gagal hapus: " + error.message, "error"); return; }
    setHasilList(prev => prev.filter(h => h.id !== hasilId));
    setShowResetModal(null);
    showToast("Data hasil ujian berhasil dihapus.");
  }

  // Stats
  const totalLulus = hasilList.filter(h => h.lulus).length;
  const totalTidak = hasilList.length - totalLulus;
  const cfgKategori = config?.kategori || DEFAULT_CONFIG.kategori;
  const durasi = config?.durasi_total_menit || TOTAL_DURASI_MENIT;
  const now = Date.now();
  const staleSesi = sesiPeserta.filter(s => now - new Date(s.updated_at).getTime() > 2 * 60 * 60 * 1000);

  const jadwalStatus = checkSesiDalamJadwal(sesiMulai, sesiSelesai);

  // Determine effective exam gate status
  const gateOpen = sesiStatus === "buka";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex-between" style={{ flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Kelola Ujian
          </h1>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
            Atur status sesi, jadwal, PIN ujian, dan pantau hasil peserta.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={loadData} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
            <span>Refresh</span>
          </button>
          <Link href="/admin/pengaturan" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            <span>Pengaturan Soal & Durasi</span>
          </Link>
        </div>
      </div>

      {/* ── PANEL UTAMA: STATUS SESI + PIN ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Kartu Status Sesi Ujian */}
        <div className="card" style={{
          padding: 0, overflow: "hidden",
          border: `2px solid ${gateOpen ? "#16A34A" : "#E5E7EB"}`,
          boxShadow: gateOpen ? "0 0 0 4px rgba(22,163,74,0.12)" : undefined,
          transition: "all 0.3s ease"
        }}>
          {/* Header strip */}
          <div style={{
            padding: "14px 20px",
            background: gateOpen
              ? "linear-gradient(135deg, #0B2B26, #166534)"
              : "linear-gradient(135deg, #1F2937, #374151)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: gateOpen ? "#4ADE80" : "#9CA3AF",
                boxShadow: gateOpen ? "0 0 10px #4ADE80" : "none",
                animation: gateOpen ? "pulse 2s infinite" : "none",
              }} />
              <span style={{ fontWeight: 800, fontSize: 14.5, color: "#FFFFFF" }}>
                Status Sesi Ujian
              </span>
            </div>
            <span style={{
              padding: "3px 12px", borderRadius: 99, fontSize: 11.5, fontWeight: 800,
              background: gateOpen ? "rgba(74,222,128,0.25)" : "rgba(156,163,175,0.2)",
              color: gateOpen ? "#4ADE80" : "#9CA3AF",
              border: `1px solid ${gateOpen ? "#4ADE80" : "#4B5563"}`,
              letterSpacing: "0.06em", textTransform: "uppercase"
            }}>
              {loading ? "..." : gateOpen ? "DIBUKA" : "DITUTUP"}
            </span>
          </div>

          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Jadwal */}
            {!editingJadwal ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", marginBottom: 8 }}>JADWAL SESI</div>
                {sesiMulai || sesiSelesai ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-forest-600)" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ color: "var(--text-dim)" }}>Mulai:</span>
                      <b style={{ color: "var(--c-dark-900)" }}>{sesiMulai ? fmtDate(sesiMulai) : "—"}</b>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      <span style={{ color: "var(--text-dim)" }}>Selesai:</span>
                      <b style={{ color: "var(--c-dark-900)" }}>{sesiSelesai ? fmtDate(sesiSelesai) : "—"}</b>
                    </div>
                    {/* Badge status jadwal */}
                    {gateOpen && (
                      <div style={{ marginTop: 4 }}>
                        {jadwalStatus === "belum" && (
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#FEF3C7", color: "#B45309", fontWeight: 700 }}>
                            Sesi belum dimulai sesuai jadwal
                          </span>
                        )}
                        {jadwalStatus === "dalam" && (
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#DCFCE7", color: "#16A34A", fontWeight: 700 }}>
                            Sedang dalam jadwal ujian
                          </span>
                        )}
                        {jadwalStatus === "berakhir" && (
                          <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}>
                            Waktu ujian telah habis
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="muted" style={{ fontSize: 13, margin: 0 }}>Belum ada jadwal waktu yang diatur. Sesi manual (tidak terbatas waktu).</p>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingJadwal(true)}
                  style={{ fontSize: 12, marginTop: 10, display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit Jadwal Sesi
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", marginBottom: 10 }}>EDIT JADWAL SESI</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Jam Mulai Ujian</label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocal(sesiMulai)}
                      onChange={e => setSesiMulai(e.target.value ? new Date(e.target.value).toISOString() : "")}
                      style={{ width: "100%", fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Jam Selesai Ujian</label>
                    <input
                      type="datetime-local"
                      value={toDatetimeLocal(sesiSelesai)}
                      onChange={e => setSesiSelesai(e.target.value ? new Date(e.target.value).toISOString() : "")}
                      style={{ width: "100%", fontSize: 13 }}
                    />
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                  Peserta hanya bisa masuk dalam rentang waktu ini. Kosongkan keduanya untuk sesi tidak terbatas.
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={handleSimpanJadwal} disabled={savingSesi} style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
                    {savingSesi ? "Menyimpan..." : "Simpan Jadwal"}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setEditingJadwal(false)} style={{ fontSize: 13 }}>
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Tombol Buka / Tutup */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", gap: 10 }}>
              {!gateOpen ? (
                <button
                  className="btn btn-primary"
                  onClick={handleBukaSesi}
                  disabled={savingSesi}
                  style={{ flex: 1, fontWeight: 800, fontSize: 14, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "linear-gradient(135deg, #16A34A, #15803D)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 11V7a6 6 0 0 0-12 0v4"/><rect x="2" y="11" width="20" height="11" rx="2"/></svg>
                  {savingSesi ? "Membuka..." : "Buka Sesi Ujian"}
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={() => setShowNonaktifModal(true)}
                  disabled={savingSesi}
                  style={{ flex: 1, fontWeight: 800, fontSize: 14, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Tutup Sesi Ujian
                </button>
              )}
            </div>

            {/* Info jadwal otomatis */}
            {gateOpen && sesiSelesai && (
              <div style={{
                padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: jadwalStatus === "berakhir" ? "#FEE2E2" : "#FEF3C7",
                color: jadwalStatus === "berakhir" ? "#DC2626" : "#B45309",
                display: "flex", alignItems: "center", gap: 6
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {jadwalStatus === "berakhir"
                  ? "Waktu ujian habis. Peserta tidak bisa masuk walaupun sesi masih dibuka."
                  : `Sesi otomatis ditutup pada ${fmtDate(sesiSelesai)}`
                }
              </div>
            )}
          </div>
        </div>

        {/* Kartu PIN Ujian */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", background: "linear-gradient(135deg, #0B2B26 0%, #163832 100%)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#8EB69B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>PIN Ujian Aktif</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.25em", fontFamily: "monospace" }}>
              {loading ? "······" : (config?.pin_ujian || config?.kategori?._pin || "123456")}
            </div>
            <div style={{ fontSize: 12, color: "#DAF1DE", marginTop: 2 }}>bagikan kepada peserta sebelum ujian dimulai</div>
          </div>

          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-dim)", marginBottom: 8 }}>UBAH PIN SESI</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  type="text"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  style={{ fontWeight: 800, letterSpacing: "0.25em", textAlign: "center", fontSize: 20, flex: 1 }}
                  placeholder="6 digit"
                />
                <button type="button" className="btn btn-secondary" onClick={generateNewPin} style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontWeight: 700 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /></svg>
                  Acak
                </button>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpdatePin}
                disabled={savingPin || !newPin || newPin.length !== 6}
                style={{ width: "100%", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                {savingPin ? "Menyimpan..." : "Simpan PIN Baru"}
              </button>
            </div>

            <div style={{
              padding: "10px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              background: "var(--c-mint-50)", color: "var(--c-forest-700)",
              border: "1px solid var(--c-sage-300)"
            }}>
              Setelah sesi ditutup, ubah PIN ini agar peserta sesi lama tidak bisa masuk lagi.
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Peserta Aktif</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: sesiPeserta.length > 0 ? "#16A34A" : "var(--text-dim)" }}>
            {loading ? "·" : sesiPeserta.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>sedang mengerjakan</div>
          {staleSesi.length > 0 && (
            <div style={{ fontSize: 11.5, color: "#D97706", marginTop: 4, fontWeight: 600 }}>
              {staleSesi.length} sesi stale ({">"}2 jam)
            </div>
          )}
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Total Selesai</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--c-dark-900)" }}>{loading ? "·" : fmt(hasilList.length)}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>sesi tercatat</div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Lulus SKD</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#16A34A" }}>{loading ? "·" : fmt(totalLulus)}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{totalTidak} tidak lulus</div>
        </div>
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Konfigurasi Soal</div>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {["TWK", "TIU", "TKP"].map(k => (
              <div key={k} style={{ textAlign: "center", flex: 1, background: "var(--surface-2)", borderRadius: 6, padding: "4px 2px", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: "var(--c-forest-600)" }}>{k}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-dark-900)" }}>{cfgKategori[k]?.jumlahSoal ?? "—"}</div>
              </div>
            ))}
          </div>
          <Link href="/admin/pengaturan" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--c-forest-600)", display: "block", marginTop: 8 }}>Edit pengaturan →</Link>
        </div>
      </div>

      {/* Sesi Peserta Aktif */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: sesiPeserta.length > 0 ? "#16A34A" : "var(--text-dim)",
              boxShadow: sesiPeserta.length > 0 ? "0 0 8px #16A34A" : "none"
            }} />
            <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
              Peserta Sedang Mengerjakan Ujian
            </h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto 8px" }} />
            <p className="muted" style={{ fontSize: 13 }}>Memuat...</p>
          </div>
        ) : sesiPeserta.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-dim)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--c-neutral-200)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p style={{ fontSize: 13, margin: 0 }}>Tidak ada peserta yang sedang mengerjakan ujian saat ini.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Peserta</th>
                  <th>Update Terakhir</th>
                  <th>Status</th>
                  <th style={{ width: 130 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sesiPeserta.map(s => {
                  const isStale = now - new Date(s.updated_at).getTime() > 2 * 60 * 60 * 1000;
                  const nama = profileMap[s.user_id]?.nama || "Peserta";
                  return (
                    <tr key={s.user_id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--c-dark-900)" }}>{nama}</div>
                        <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "monospace" }}>{s.user_id.slice(0, 20)}...</div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-dim)" }}>{fmtDate(s.updated_at)}</td>
                      <td>
                        <span className="pill" style={{
                          fontSize: 11.5, padding: "3px 10px", borderRadius: 6,
                          background: isStale ? "#FEF3C7" : "#DCFCE7",
                          color: isStale ? "#D97706" : "#16A34A"
                        }}>
                          {isStale ? "Stale" : "Aktif"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => { if (confirm(`Hentikan sesi ujian ${nama}?`)) handleKickSesi(s.user_id); }}
                          style={{ fontSize: 12 }}
                        >
                          Hentikan Sesi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hasil Ujian Terbaru */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "var(--c-dark-900)" }}>
            Hasil Ujian Terbaru (50 Terakhir)
          </h2>
          <Link href="/admin/laporan" style={{ fontSize: 12.5, fontWeight: 600 }}>
            Lihat Semua Laporan →
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div className="spinner" style={{ width: 24, height: 24, margin: "0 auto 8px" }} />
          </div>
        ) : hasilList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-dim)" }}>
            <p style={{ fontSize: 13, margin: 0 }}>Belum ada hasil ujian yang terekam.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Peserta</th>
                  <th>TWK</th>
                  <th>TIU</th>
                  <th>TKP</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th style={{ width: 70 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {hasilList.map((h, idx) => {
                  const pk = h.per_kategori || {};
                  const nama = profileMap[h.user_id]?.nama || "Peserta";
                  return (
                    <tr key={h.id}>
                      <td style={{ color: "var(--text-dim)", fontWeight: 600, fontSize: 12 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: "var(--c-dark-900)", fontSize: 13 }}>{nama}</td>
                      <td style={{ fontWeight: 700, color: pk.TWK?.lulus ? "#16A34A" : "#DC2626", fontSize: 13 }}>{pk.TWK?.skor ?? "—"}</td>
                      <td style={{ fontWeight: 700, color: pk.TIU?.lulus ? "#16A34A" : "#DC2626", fontSize: 13 }}>{pk.TIU?.skor ?? "—"}</td>
                      <td style={{ fontWeight: 700, color: pk.TKP?.lulus ? "#16A34A" : "#DC2626", fontSize: 13 }}>{pk.TKP?.skor ?? "—"}</td>
                      <td style={{ fontWeight: 900, fontSize: 15, color: h.lulus ? "#16A34A" : "var(--c-dark-900)" }}>{h.skor_total}</td>
                      <td>
                        <span className="pill" style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 6, background: h.lulus ? "var(--good-bg)" : "#FEE2E2", color: h.lulus ? "var(--good-text)" : "#DC2626" }}>
                          {h.lulus ? "LULUS" : "Tidak Lulus"}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
                        {new Date(h.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setShowResetModal(h)}
                          style={{ padding: "4px 8px", fontSize: 12 }}
                          title="Hapus hasil ini"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Konfirmasi Tutup Sesi */}
      {showNonaktifModal && (
        <div className="modal-bg">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Tutup Sesi Ujian?</h2>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-dim)", margin: "0 0 10px" }}>
              Setelah sesi ditutup, <b>peserta tidak bisa masuk</b> ke ruang ujian meskipun mengetahui PIN yang sama.
            </p>
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF3C7", border: "1px solid #FCD34D", fontSize: 13, color: "#B45309", marginBottom: 20 }}>
              <b>Rekomendasi:</b> Setelah menutup sesi, segera ganti PIN ujian agar peserta yang mengetahui PIN lama tidak bisa digunakan di sesi berikutnya.
            </div>
            <div className="flex-between">
              <button className="btn btn-secondary" onClick={() => setShowNonaktifModal(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleTutupSesi} disabled={savingSesi} style={{ fontWeight: 700 }}>
                {savingSesi ? "Menutup..." : "Ya, Tutup Sesi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Hapus Hasil */}
      {showResetModal && (
        <div className="modal-bg">
          <div className="modal" style={{ maxWidth: 420 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>Hapus Hasil Ujian?</h2>
            <p style={{ fontSize: 13.5, color: "var(--text-dim)", margin: "0 0 20px" }}>
              Anda akan menghapus data hasil ujian peserta <b>{profileMap[showResetModal.user_id]?.nama || "ini"}</b> dengan skor{" "}
              <b>{showResetModal.skor_total}</b>. Peserta bisa mengerjakan ulang setelah dihapus.
            </p>
            <div className="flex-between">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleHapusHasil(showResetModal.id)}>
                Ya, Hapus & Izinkan Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="toast" style={{ background: toastMsg.type === "error" ? "#DC2626" : undefined }}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
