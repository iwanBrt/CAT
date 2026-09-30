"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT, KATEGORI_LABEL, MAX_SKOR, DEFAULT_CONFIG } from "@/lib/constants";
import { fmtTanggal } from "@/lib/scoring";

export default function HasilUjianPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasilList, setHasilList] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        if (ignore) return;

        const { data } = await supabase
          .from("hasil")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (!ignore) {
          setHasilList(data || []);
          if (data && data.length > 0) setSelected(data[0]);
        }
      } catch (err) {
        console.error("Error loading hasil ujian:", err);
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

  if (hasilList.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>🏆 Hasil Ujian</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Analisis detail hasil ujian Anda</p>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p className="muted" style={{ fontSize: 15, marginBottom: 16 }}>Belum ada hasil ujian yang tersedia.</p>
          <Link href="/peserta/ujian" className="btn btn-primary">Mulai Ujian Sekarang</Link>
        </div>
      </div>
    );
  }

  const pk = selected?.per_kategori || {};
  const totalLulus = hasilList.filter(h => h.lulus).length;
  const avgSkor = Math.round(hasilList.reduce((a, h) => a + (h.skor_total || 0), 0) / hasilList.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>🏆 Hasil Ujian</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Analisis detail hasil ujian Anda</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            padding: "10px 18px", borderRadius: "var(--radius-md)",
            background: "var(--surface)", border: "1px solid var(--border)",
            textAlign: "center", boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--c-forest-600)" }}>{totalLulus}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>Lulus PG</div>
          </div>
          <div style={{
            padding: "10px 18px", borderRadius: "var(--radius-md)",
            background: "var(--surface)", border: "1px solid var(--border)",
            textAlign: "center", boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--c-dark-900)" }}>{avgSkor}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>Rata-rata</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20 }}>
        {/* Left: Result List */}
        <div className="card" style={{ padding: 0, overflow: "hidden", maxHeight: 600, overflowY: "auto" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: 14, color: "var(--c-dark-900)" }}>
            Daftar Hasil ({hasilList.length})
          </div>
          {hasilList.map((h, idx) => (
            <div
              key={h.id}
              onClick={() => setSelected(h)}
              style={{
                padding: "14px 18px", borderBottom: "1px solid var(--border)",
                cursor: "pointer", transition: "all 0.15s ease",
                background: selected?.id === h.id ? "var(--c-mint-100)" : "transparent",
                borderLeft: selected?.id === h.id ? "3px solid var(--c-forest-600)" : "3px solid transparent",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--c-dark-900)", marginBottom: 3 }}>
                Ujian #{hasilList.length - idx}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{fmtTanggal(h.waktu_selesai || h.created_at)}</span>
                <span className={`pill ${h.lulus ? "pill-good" : "pill-bad"}`} style={{ fontSize: 10, padding: "3px 8px" }}>
                  {h.lulus ? "Lulus" : "Gagal"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Detail View */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Score Overview */}
          <div className="card" style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 16px" }}>
              Ringkasan Skor
            </h2>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginBottom: 20 }}>
              {/* Score circle */}
              <div style={{
                width: 120, height: 120, borderRadius: "50%",
                background: `conic-gradient(${selected?.lulus ? "var(--good)" : "var(--bad)"} ${Math.round((selected?.skor_total / MAX_SKOR.TOTAL) * 360)}deg, var(--surface-3) 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "inset 0 0 0 12px var(--surface)"
              }}>
                <div style={{
                  width: 96, height: 96, borderRadius: "50%", background: "var(--surface)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
                }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1 }}>{selected?.skor_total}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>/{MAX_SKOR.TOTAL}</div>
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <span className={`pill ${selected?.lulus ? "pill-good" : "pill-bad"}`} style={{ fontSize: 14, padding: "8px 18px", fontWeight: 700 }}>
                  {selected?.lulus ? "✓ Lulus Passing Grade" : "✕ Tidak Lulus PG"}
                </span>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 8 }}>
                  {fmtTanggal(selected?.waktu_selesai || selected?.created_at)}
                </div>
              </div>
            </div>
          </div>

          {/* Per-Category Detail */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {KATEGORI_URUT.map(k => {
              const data = pk[k] || {};
              const pct = data.skor ? Math.round((data.skor / MAX_SKOR[k]) * 100) : 0;
              const passed = data.skor >= (DEFAULT_CONFIG.kategori[k]?.passingGrade || 0);

              return (
                <div key={k} className="card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-dark-900)" }}>{k}</div>
                    <span className={`pill ${passed ? "pill-good" : "pill-bad"}`} style={{ fontSize: 10, padding: "3px 8px" }}>
                      {passed ? "Lulus" : "Gagal"} PG
                    </span>
                  </div>

                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1, margin: "0 0 4px" }}>
                    {data.skor ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 12 }}>
                    dari {MAX_SKOR[k]} (PG: {DEFAULT_CONFIG.kategori[k].passingGrade})
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: 6, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{
                      height: "100%", borderRadius: 3, width: `${pct}%`,
                      background: passed ? "var(--good)" : "var(--bad)", transition: "width 0.5s ease"
                    }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, fontSize: 11.5, textAlign: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--good)" }}>{data.benar ?? "-"}</div>
                      <div style={{ color: "var(--text-dim)" }}>Benar</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--bad)" }}>{data.salah ?? "-"}</div>
                      <div style={{ color: "var(--text-dim)" }}>Salah</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--text-dim)" }}>{data.kosong ?? "-"}</div>
                      <div style={{ color: "var(--text-dim)" }}>Kosong</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
