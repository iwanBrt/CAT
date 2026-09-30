"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { KATEGORI_URUT, KATEGORI_LABEL, DEFAULT_CONFIG, TOTAL_DURASI_MENIT } from "@/lib/constants";

export default function AdminPengaturanPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [namaUjian, setNamaUjian] = useState(DEFAULT_CONFIG.namaUjian);
  const [durasiTotalMenit, setDurasiTotalMenit] = useState(TOTAL_DURASI_MENIT);
  const [kategori, setKategori] = useState(DEFAULT_CONFIG.kategori);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("config").select("*").eq("id", "default").maybeSingle();
      if (data) {
        setNamaUjian(data.nama_ujian || DEFAULT_CONFIG.namaUjian);
        if (data.kategori) setKategori(data.kategori);
      }
      setLoading(false);
    })();
  }, []);

  function ubah(k, field, val) {
    setKategori((prev) => ({ ...prev, [k]: { ...prev[k], [field]: val } }));
  }

  async function simpan() {
    setSaving(true);
    // Pertahankan _pin yang tersimpan jika ada di kategori
    const { data: cur } = await supabase.from("config").select("*").eq("id", "default").maybeSingle();
    const katToSave = { ...kategori };
    if (cur?.kategori?._pin) {
      katToSave._pin = cur.kategori._pin;
    }

    await supabase.from("config").upsert({
      id: "default",
      nama_ujian: namaUjian,
      kategori: katToSave,
    });
    setSaving(false);
    setToastMsg("Pengaturan Ujian berhasil disimpan.");
    setTimeout(() => setToastMsg(""), 2600);
  }

  if (loading) return <div className="card" style={{ textAlign: "center", padding: 30 }}><p className="muted">Memuat pengaturan…</p></div>;

  const totalSoal = (kategori.TWK?.jumlahSoal || 0) + (kategori.TIU?.jumlahSoal || 0) + (kategori.TKP?.jumlahSoal || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card">
        <h2 style={{ fontSize: 16, margin: "0 0 14px" }}>Pengaturan Umum Ujian SKD</h2>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 220 }}>
            <label>Nama Simulasi / Ujian</label>
            <input value={namaUjian} onChange={(e) => setNamaUjian(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label>Total Durasi (Menit)</label>
            <input
              type="number"
              value={durasiTotalMenit}
              onChange={(e) => setDurasiTotalMenit(parseInt(e.target.value, 10) || 100)}
            />
          </div>
        </div>
        <div style={{
          marginTop: 16, padding: "10px 14px", borderRadius: "var(--radius-sm)",
          background: "var(--c-mint-50)", border: "1px solid var(--c-sage-300)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--c-forest-700)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            <span>Pengaturan dan acak PIN Sesi Ujian dikelola terpusat di menu <b>Kelola Ujian</b>.</span>
          </div>
          <Link href="/admin/ujian" className="btn btn-secondary" style={{ fontSize: 12, padding: "6px 14px", fontWeight: 700 }}>
            Buka Kelola Ujian &rarr;
          </Link>
        </div>
      </div>

      {KATEGORI_URUT.map((k) => {
        const item = kategori[k] || DEFAULT_CONFIG.kategori[k];
        return (
          <div className="card" key={k}>
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{KATEGORI_LABEL[k]} ({k})</h3>
              <span className="pill pill-primary">{item.jumlahSoal} Soal</span>
            </div>
            <div className="row">
              <div style={{ flex: 1, minWidth: 120 }}>
                <label>Jumlah Soal</label>
                <input
                  type="number"
                  value={item.jumlahSoal}
                  onChange={(e) => ubah(k, "jumlahSoal", parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label>Passing Grade (Ambang Batas)</label>
                <input
                  type="number"
                  value={item.passingGrade}
                  onChange={(e) => ubah(k, "passingGrade", parseInt(e.target.value, 10) || 0)}
                />
              </div>
              {k !== "TKP" ? (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label>Poin Jawaban Benar</label>
                  <input
                    type="number"
                    value={item.skorBenar}
                    onChange={(e) => ubah(k, "skorBenar", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label>Aturan Penilaian</label>
                  <input disabled value="Bobot Bertingkat 1 - 5" style={{ opacity: 0.7 }} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button className="btn btn-primary btn-lg" style={{ width: "100%", fontWeight: 700 }} disabled={saving} onClick={simpan}>
        {saving ? "Menyimpan Pengaturan…" : "Simpan Pengaturan"}
      </button>

      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}
