"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_LABEL, DEFAULT_CONFIG, TOTAL_DURASI_MENIT } from "@/lib/constants";
import { fmtTime, hitungSkor } from "@/lib/scoring";
import CatLogo from "@/components/CatLogo";
import RenderOpsiContent from "@/components/RenderOpsiContent";
import CatImageLightbox from "@/components/CatImageLightbox";

export default function UjianPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [sesi, setSesi] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG.kategori);
  const [loading, setLoading] = useState(true);
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [lightboxImg, setLightboxImg] = useState(null);

  // Navigasi & state soal
  const [nomorIndex, setNomorIndex] = useState(0);

  // Modals
  const [confirmSelesai, setConfirmSelesai] = useState(false);
  const [setujuSelesai, setSetujuSelesai] = useState(false);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const writeLock = useRef(Promise.resolve());
  const finishing = useRef(false);

  // Inisialisasi sesi & user
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("nama, role")
          .eq("id", user.id)
          .maybeSingle();

        const { data: cfgRow } = await supabase.from("config").select("kategori").eq("id", "default").maybeSingle();
        const { data: sesiRow } = await supabase.from("sesi_aktif").select("data").eq("user_id", user.id).maybeSingle();

        if (ignore) return;
        if (!sesiRow?.data || sesiRow.data.status !== "berjalan") {
          router.push("/peserta/ujian");
          return;
        }

        setUserId(user.id);
        setUserProfile({ id: user.id, email: user.email, nama: profile?.nama || user.email?.split("@")[0] || "Peserta" });
        setConfig(cfgRow?.kategori || DEFAULT_CONFIG.kategori);

        const sData = sesiRow.data;
        if (!sData.soalUrut || sData.soalUrut.length === 0) {
          sData.soalUrut = [
            ...(sData.soalIds?.TWK || []),
            ...(sData.soalIds?.TIU || []),
            ...(sData.soalIds?.TKP || []),
          ];
        }
        setSesi(sData);
        setNomorIndex(sData.nomorSekarang || 0);
      } catch (err) {
        console.error("Error initializing exam session:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  // Simpan patch sesi ke database
  const simpanSesi = useCallback(
    (patch) => {
      setSesi((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        writeLock.current = writeLock.current.then(() =>
          supabase
            .from("sesi_aktif")
            .update({ data: next, updated_at: new Date().toISOString() })
            .eq("user_id", userId)
        );
        return next;
      });
    },
    [userId, supabase]
  );

  // Selesaikan Ujian
  const selesaikanUjian = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setIsSubmitting(true);

    try {
      await writeLock.current;

      const hasil = hitungSkor(sesi, config);
      const { error: insertErr } = await supabase.from("hasil").insert({
        user_id: userId,
        waktu_mulai: sesi.waktuMulaiUjian,
        waktu_selesai: new Date().toISOString(),
        per_kategori: hasil.perKategori,
        jawaban: sesi.jawaban,
        skor_total: hasil.skorTotal,
        lulus: hasil.lulus,
      });

      if (insertErr) {
        throw insertErr;
      }

      await supabase.from("sesi_aktif").delete().eq("user_id", userId);
      router.push("/peserta/riwayat?selesai=1");
    } catch (err) {
      console.error("Gagal menyelesaikan ujian:", err);
      alert("Gagal menyimpan hasil ujian: " + (err.message || "Silakan periksa koneksi Anda dan coba lagi."));
      finishing.current = false;
      setIsSubmitting(false);
    }
  }, [sesi, config, userId, supabase, router]);

  // Timer Countdown
  useEffect(() => {
    if (!sesi) return;
    const durasiTotalMenit = sesi.durasiTotalMenit || TOTAL_DURASI_MENIT;
    const mulai = new Date(sesi.waktuMulaiUjian).getTime();

    function tick() {
      const elapsed = (Date.now() - mulai) / 1000;
      const sisa = durasiTotalMenit * 60 - elapsed;
      setSisaWaktu(sisa);

      if (sisa <= 0) {
        clearInterval(handle);
        selesaikanUjian();
      }
    }

    tick();
    const handle = setInterval(tick, 1000);
    return () => clearInterval(handle);
  }, [sesi, selesaikanUjian]);

  // Anti-Cheating
  useEffect(() => {
    if (loading || !sesi) return;

    function handleVisibility() {
      if (document.hidden) {
        simpanSesi({ pelanggaranTab: (sesi.pelanggaranTab || 0) + 1 });
        setShowTabWarning(true);
      }
    }

    function handleContextMenu(e) {
      e.preventDefault();
    }

    function handleKeyDown(e) {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U"))
      ) {
        e.preventDefault();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, sesi, simpanSesi]);

  function pilihOpsi(opsiIdx) {
    if (!sesi) return;
    const currentId = sesi.soalUrut[nomorIndex];
    const prevEntry = sesi.jawaban?.[currentId];
    const prevRagu = typeof prevEntry === "object" && prevEntry !== null ? prevEntry.ragu : false;

    const nextJawaban = {
      ...sesi.jawaban,
      [currentId]: { opsiIdx, ragu: prevRagu },
    };
    simpanSesi({ jawaban: nextJawaban });
  }

  function toggleRagu() {
    if (!sesi) return;
    const currentId = sesi.soalUrut[nomorIndex];
    const prevEntry = sesi.jawaban?.[currentId];
    const prevIdx = typeof prevEntry === "object" && prevEntry !== null ? prevEntry.opsiIdx : typeof prevEntry === "number" ? prevEntry : null;
    const prevRagu = typeof prevEntry === "object" && prevEntry !== null ? prevEntry.ragu : false;

    const nextJawaban = {
      ...sesi.jawaban,
      [currentId]: { opsiIdx: prevIdx, ragu: !prevRagu },
    };
    simpanSesi({ jawaban: nextJawaban });
  }

  function pindahNomor(idx) {
    if (!sesi) return;
    if (idx < 0 || idx >= sesi.soalUrut.length) return;
    setNomorIndex(idx);
    simpanSesi({ nomorSekarang: idx });
  }

  if (loading || !sesi) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--c-forest-600)", borderTopColor: "transparent", margin: "0 auto 16px" }} />
        <p className="muted" style={{ fontWeight: 600 }}>Menyiapkan lembar soal ujian…</p>
      </div>
    );
  }

  const soalUrut = sesi.soalUrut || [];
  const totalJumlahSoal = soalUrut.length;
  const currentId = soalUrut[nomorIndex];
  const currentSoal = sesi.bankSoal?.[currentId];

  const currentJawabanEntry = sesi.jawaban?.[currentId];
  const selectedOpsi =
    typeof currentJawabanEntry === "object" && currentJawabanEntry !== null
      ? currentJawabanEntry.opsiIdx
      : typeof currentJawabanEntry === "number"
      ? currentJawabanEntry
      : null;
  const isRagu = typeof currentJawabanEntry === "object" && currentJawabanEntry !== null ? !!currentJawabanEntry.ragu : false;

  // Hitung progres kategori saat ini
  const kat = currentSoal?.kategori || "TWK";
  const idsKategori = sesi.soalIds?.[kat] || [];
  const indexInKategori = idsKategori.indexOf(currentId) + 1;
  const totalInKategori = idsKategori.length || 30;
  const pctKategori = Math.round((indexInKategori / totalInKategori) * 100);

  // Grouping Soal by Category for Navigation Palette
  const groups = {
    TWK: (sesi.soalIds?.TWK || []).map((id) => ({ id, globalIdx: soalUrut.indexOf(id) })),
    TIU: (sesi.soalIds?.TIU || []).map((id) => ({ id, globalIdx: soalUrut.indexOf(id) })),
    TKP: (sesi.soalIds?.TKP || []).map((id) => ({ id, globalIdx: soalUrut.indexOf(id) })),
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* Header CAT Dark (Image 1) */}
      <header className="cat-dark-topbar">
        <CatLogo size={32} showText={true} subtitle="" light={true} />

        <div className="user-actions">
          <div className="user-pill">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>{userProfile?.nama || "Peserta 123456"}</span>
          </div>

          <button
            type="button"
            className="btn-logout"
            onClick={() => setConfirmSelesai(true)}
            title="Keluar / Akhiri Ujian"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Exam Grid: Left Question, Right Navigation */}
      <main className="exam-main-container">
        {/* Kolom Kiri: Soal & Pilihan */}
        <section className="exam-card-question">
          {/* Top Info Bar */}
          <div className="exam-top-info">
            <div className="exam-category-title">
              <div className="category-letter-icon">
                {kat.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--c-dark-900)" }}>
                  {KATEGORI_LABEL[kat] || kat} ({kat}) {indexInKategori}/{totalInKategori}
                </div>
                <div className="exam-progress-bar-wrap">
                  <div className="exam-progress-bar-fill" style={{ width: `${pctKategori}%` }} />
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 2 }}>
                Sisa Waktu
              </div>
              <div className={`exam-timer-display ${sisaWaktu < 300 ? "timer-danger" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{fmtTime(sisaWaktu)}</span>
              </div>
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="exam-question-content">
            <div className="exam-question-number">
              No. {nomorIndex + 1}
            </div>

            <div
              className="exam-question-statement"
              dangerouslySetInnerHTML={{ __html: currentSoal ? currentSoal.teks : "Memuat soal..." }}
              onClick={(e) => {
                if (e.target && e.target.tagName === "IMG") {
                  setLightboxImg(e.target.src);
                }
              }}
              style={{ cursor: "default" }}
            />

            <div className="exam-options-stack">
              {currentSoal?.opsi?.map((opsiText, idx) => {
                const isSelected = selectedOpsi === idx;
                const letter = String.fromCharCode(65 + idx);

                return (
                  <div
                    key={idx}
                    className={`exam-option-row ${isSelected ? "selected" : ""}`}
                    onClick={() => pilihOpsi(idx)}
                  >
                    <div className="option-radio-circle" style={{ marginTop: 2, flexShrink: 0 }}>
                      {isSelected && <div className="option-radio-dot" />}
                    </div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text)", flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <b style={{ color: "var(--c-dark-900)", marginTop: 2, flexShrink: 0 }}>{letter}.</b>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <RenderOpsiContent content={opsiText} imageMaxHeight={125} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="exam-actions-footer">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={nomorIndex === 0}
              onClick={() => pindahNomor(nomorIndex - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Soal Sebelumnya</span>
            </button>

            <button
              type="button"
              className={`btn ${isRagu ? "btn-warn" : "btn-ghost"}`}
              onClick={toggleRagu}
              style={{ fontSize: 13 }}
            >
              <input
                type="checkbox"
                checked={isRagu}
                onChange={() => {}}
                style={{ width: "auto", margin: 0, cursor: "pointer", accentColor: "var(--warn)" }}
              />
              <span>Ragu-ragu</span>
            </button>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {nomorIndex < totalJumlahSoal - 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => pindahNomor(nomorIndex + 1)}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span>Soal Berikutnya</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: "#16A34A",
                  borderColor: "#15803D",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.3)"
                }}
                onClick={() => setConfirmSelesai(true)}
              >
                <span>Selesai Ujian</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Kolom Kanan: Navigasi Soal (Image 1) */}
        <aside className="navigasi-palette-card">
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 14 }}>
            Navigasi Soal
          </div>

          {/* Group TWK */}
          <div>
            <div className="palette-section-title">TWK</div>
            <div className="palette-subgrid">
              {groups.TWK.map(({ id, globalIdx }) => {
                const j = sesi.jawaban?.[id];
                const hasAns = (typeof j === "object" && j !== null && j.opsiIdx !== null && j.opsiIdx !== undefined) || (typeof j === "number");
                const rg = typeof j === "object" && j !== null && j.ragu;
                const isCurrent = globalIdx === nomorIndex;

                let cls = "";
                if (isCurrent) cls = "pal-active";
                else if (rg) cls = "pal-ragu";
                else if (hasAns) cls = "pal-answered";

                return (
                  <button
                    key={id}
                    type="button"
                    className={`pal-btn ${cls}`}
                    onClick={() => pindahNomor(globalIdx)}
                  >
                    {globalIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group TIU */}
          <div>
            <div className="palette-section-title">TIU</div>
            <div className="palette-subgrid">
              {groups.TIU.map(({ id, globalIdx }) => {
                const j = sesi.jawaban?.[id];
                const hasAns = (typeof j === "object" && j !== null && j.opsiIdx !== null && j.opsiIdx !== undefined) || (typeof j === "number");
                const rg = typeof j === "object" && j !== null && j.ragu;
                const isCurrent = globalIdx === nomorIndex;

                let cls = "";
                if (isCurrent) cls = "pal-active";
                else if (rg) cls = "pal-ragu";
                else if (hasAns) cls = "pal-answered";

                return (
                  <button
                    key={id}
                    type="button"
                    className={`pal-btn ${cls}`}
                    onClick={() => pindahNomor(globalIdx)}
                  >
                    {globalIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group TKP */}
          <div>
            <div className="palette-section-title">TKP</div>
            <div className="palette-subgrid">
              {groups.TKP.map(({ id, globalIdx }) => {
                const j = sesi.jawaban?.[id];
                const hasAns = (typeof j === "object" && j !== null && j.opsiIdx !== null && j.opsiIdx !== undefined) || (typeof j === "number");
                const rg = typeof j === "object" && j !== null && j.ragu;
                const isCurrent = globalIdx === nomorIndex;

                let cls = "";
                if (isCurrent) cls = "pal-active";
                else if (rg) cls = "pal-ragu";
                else if (hasAns) cls = "pal-answered";

                return (
                  <button
                    key={id}
                    type="button"
                    className={`pal-btn ${cls}`}
                    onClick={() => pindahNomor(globalIdx)}
                  >
                    {globalIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Legend (Image 1) */}
          <div className="palette-status-legend">
            <div className="legend-row">
              <span className="legend-square green" />
              <span>Sudah dijawab</span>
            </div>
            <div className="legend-row">
              <span className="legend-square blue" />
              <span>Sedang dikerjakan</span>
            </div>
            <div className="legend-row">
              <span className="legend-square gray" />
              <span>Belum dijawab</span>
            </div>
            <div className="legend-row">
              <span className="legend-square yellow" />
              <span>Ragu-ragu</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: "100%",
              marginTop: 18,
              background: "#16A34A",
              borderColor: "#15803D",
              color: "#FFFFFF",
              fontWeight: 800,
              padding: "12px 16px",
              boxShadow: "0 2px 8px rgba(22, 163, 74, 0.25)"
            }}
            onClick={() => setConfirmSelesai(true)}
          >
            🏁 Selesai & Kumpulkan Ujian
          </button>
        </aside>
      </main>

      {/* Modal Konfirmasi Akhiri Ujian */}
      {confirmSelesai && (
        <div className="modal-bg" onClick={() => !isSubmitting && setConfirmSelesai(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                🏁
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)", margin: 0 }}>
                  Konfirmasi Selesai Ujian
                </h2>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>Simulasi CAT BKN</div>
              </div>
            </div>

            <p className="muted" style={{ fontSize: 13.5, margin: "0 0 16px", lineHeight: 1.5 }}>
              Apakah Anda yakin ingin mengakhiri simulasi ini? Seluruh jawaban yang telah Anda pilih akan dinilai secara otomatis dan hasil ujian langsung ditampilkan.
            </p>

            <div style={{
              background: setujuSelesai ? "#F0FDF4" : "#FFFBEB",
              border: `1.5px solid ${setujuSelesai ? "#86EFAC" : "#FDE68A"}`,
              borderRadius: "var(--radius-md)",
              padding: "14px 16px",
              marginBottom: 20,
              transition: "all 0.2s ease"
            }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13.5, userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={setujuSelesai}
                  onChange={(e) => setSetujuSelesai(e.target.checked)}
                  style={{ width: 20, height: 20, marginTop: 1, accentColor: "#16A34A", cursor: "pointer" }}
                />
                <span style={{ fontWeight: 700, color: "var(--c-dark-900)", lineHeight: 1.4 }}>
                  Saya telah selesai memeriksa dan yakin mengakhiri ujian sekarang.
                </span>
              </label>
              {!setujuSelesai && (
                <div style={{ fontSize: 12, color: "#B45309", marginTop: 8, fontWeight: 600, paddingLeft: 30 }}>
                  👉 Centang kotak di atas untuk mengaktifkan tombol selesai di bawah.
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, fontWeight: 600 }}
                disabled={isSubmitting}
                onClick={() => setConfirmSelesai(false)}
              >
                Batal & Lanjutkan
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  flex: 1.2,
                  background: setujuSelesai ? "#16A34A" : "#9CA3AF",
                  borderColor: setujuSelesai ? "#15803D" : "#9CA3AF",
                  cursor: setujuSelesai ? "pointer" : "not-allowed",
                  fontWeight: 800,
                  boxShadow: setujuSelesai ? "0 2px 8px rgba(22, 163, 74, 0.35)" : "none"
                }}
                disabled={!setujuSelesai || isSubmitting}
                onClick={selesaikanUjian}
              >
                {isSubmitting ? "⏳ Menyimpan Hasil..." : "Ya, Selesaikan Ujian"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Warning Anti-Cheating */}
      {showTabWarning && (
        <div className="modal-bg" onClick={() => setShowTabWarning(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "var(--bad)", margin: "0 0 8px" }}>⚠️ Peringatan Integritas!</h2>
            <p style={{ fontSize: 13.5, margin: "0 0 16px" }}>
              Anda terdeteksi berpindah tab atau aplikasi. Seluruh aktivitas ini dicatat di server pengawas ujian CAT.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() => setShowTabWarning(false)}
            >
              Saya Mengerti & Lanjutkan Ujian
            </button>
          </div>
        </div>
      )}
      {/* Lightbox Zoom Detail Gambar */}
      {lightboxImg && (
        <CatImageLightbox src={lightboxImg} onClose={() => setLightboxImg(null)} />
      )}
    </div>
  );
}
