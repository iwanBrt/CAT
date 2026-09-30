"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT, DEFAULT_CONFIG, TOTAL_DURASI_MENIT, TOTAL_SOAL, KATEGORI_LABEL } from "@/lib/constants";
import { shuffle } from "@/lib/scoring";

const PIN_LENGTH = 6;

export default function UjianSayaPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("pin"); // pin | instructions | starting
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [bankTersedia, setBankTersedia] = useState({ TWK: 0, TIU: 0, TKP: 0 });
  const [sesiAktif, setSesiAktif] = useState(null);
  const [hasilSelesai, setHasilSelesai] = useState(null);
  const [sesiGate, setSesiGate] = useState(null); // null=loading, {status,mulai,selesai}

  // PIN state
  const [pinValues, setPinValues] = useState(Array(PIN_LENGTH).fill(""));
  const [pinError, setPinError] = useState("");
  const [pinVerifying, setPinVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Instructions state
  const [setujuPetunjuk, setSetujuPetunjuk] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

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

        // Fetch Profile
        const { data: prof } = await supabase.from("profiles").select("nama, role").eq("id", authUser.id).maybeSingle();
        if (!ignore && prof) setProfile(prof);

        // Fetch Config
        const { data: cfgRow } = await supabase.from("config").select("*").eq("id", "default").maybeSingle();
        const activePin = cfgRow?.pin_ujian || cfgRow?.kategori?._pin || "123456";
        const cfg = cfgRow?.kategori
          ? { namaUjian: cfgRow.nama_ujian || DEFAULT_CONFIG.namaUjian, kategori: cfgRow.kategori, pin_ujian: activePin }
          : { ...DEFAULT_CONFIG, pin_ujian: activePin };
        if (!ignore) setConfig(cfg);

        // Baca status sesi ujian (dibuka/ditutup) dan jadwal
        if (!ignore) {
          const kat = cfgRow?.kategori || {};
          setSesiGate({
            status: kat._sesi_status || "tutup",
            mulai: kat._sesi_mulai || null,
            selesai: kat._sesi_selesai || null,
          });
        }

        // Fetch Bank Soal counts
        const counts = { TWK: 0, TIU: 0, TKP: 0 };
        for (const k of KATEGORI_URUT) {
          const { count } = await supabase
            .from("soal")
            .select("*", { count: "exact", head: true })
            .eq("kategori", k)
            .eq("aktif", true);
          counts[k] = count || 0;
        }
        if (!ignore) setBankTersedia(counts);

        // Fetch Sesi Aktif
        const { data: sesi } = await supabase.from("sesi_aktif").select("data").eq("user_id", authUser.id).maybeSingle();
        if (!ignore && sesi?.data && sesi.data.status === "berjalan") {
          setSesiAktif(sesi.data);
        }

        // Fetch Hasil Ujian Terakhir (Cek apakah peserta sudah pernah menyelesaikan ujian)
        const { data: latestHasil } = await supabase
          .from("hasil")
          .select("id, skor_total, lulus, waktu_selesai, created_at, per_kategori")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!ignore && latestHasil) {
          setHasilSelesai(latestHasil);
        }
      } catch (err) {
        console.error("Error loading ujian page data:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // PIN input handlers
  const handlePinChange = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newValues = [...pinValues];
    newValues[index] = value.slice(-1);
    setPinValues(newValues);
    setPinError("");

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [pinValues]);

  const handlePinKeyDown = useCallback((index, e) => {
    if (e.key === "Backspace" && !pinValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [pinValues]);

  const handlePinPaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    const newValues = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newValues[i] = pasted[i];
    }
    setPinValues(newValues);
    setPinError("");
    if (pasted.length === PIN_LENGTH) {
      inputRefs.current[PIN_LENGTH - 1]?.focus();
    } else {
      inputRefs.current[Math.min(pasted.length, PIN_LENGTH - 1)]?.focus();
    }
  }, []);

  const verifyPin = async () => {
    const enteredPin = pinValues.join("");
    if (enteredPin.length < PIN_LENGTH) {
      setPinError("Masukkan PIN lengkap 6 digit");
      return;
    }

    setPinVerifying(true);
    // Check PIN against config
    const { data: cfgRow } = await supabase.from("config").select("*").eq("id", "default").maybeSingle();
    const correctPin = cfgRow?.pin_ujian || cfgRow?.kategori?._pin || "123456";

    if (enteredPin === correctPin) {
      setPinError("");
      setStep("instructions");
    } else {
      setPinError("PIN salah! Periksa kembali PIN yang diberikan admin.");
      setPinValues(Array(PIN_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
    setPinVerifying(false);
  };

  // Start exam logic (moved from old peserta/page.js)
  const mulaiUjian = async () => {
    setStarting(true);
    setError("");
    try {
      const soalTerpilih = {};
      const bankSoal = {};
      const kategori = config.kategori || DEFAULT_CONFIG.kategori;

      for (const k of KATEGORI_URUT) {
        const jumlah = kategori[k]?.jumlahSoal || 30;
        const { data: rows } = await supabase
          .from("soal")
          .select("*")
          .eq("kategori", k)
          .eq("aktif", true);

        if (!rows || rows.length === 0) {
          setError(`Tidak ada soal ${k} tersedia di bank soal.`);
          setStarting(false);
          return;
        }

        const selected = shuffle(rows).slice(0, jumlah);
        soalTerpilih[k] = selected.map((s) => s.id);
        selected.forEach((s) => {
          bankSoal[s.id] = {
            kategori: s.kategori,
            teks: s.teks,
            opsi: s.opsi,
            kunci: s.kunci,
            bobot: s.bobot,
          };
        });
      }

      const soalUrut = [
        ...soalTerpilih.TWK,
        ...soalTerpilih.TIU,
        ...soalTerpilih.TKP,
      ];

      const sesiData = {
        status: "berjalan",
        waktuMulaiUjian: new Date().toISOString(),
        durasiTotalMenit: config.durasiTotalMenit || TOTAL_DURASI_MENIT,
        soalIds: soalTerpilih,
        soalUrut,
        bankSoal,
        jawaban: {},
        nomorSekarang: 0,
        pelanggaranTab: 0,
      };

      await supabase.from("sesi_aktif").upsert({
        user_id: user.id,
        data: sesiData,
        updated_at: new Date().toISOString(),
      });

      router.push("/peserta/ujian/mengerjakan");
    } catch (err) {
      setError("Terjadi kesalahan saat memulai ujian. Coba lagi.");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--c-forest-600)", borderTopColor: "transparent", margin: "0 auto 16px" }} />
        <p className="muted" style={{ fontWeight: 600 }}>Memuat halaman ujian…</p>
      </div>
    );
  }

  // Cek status gerbang sesi ujian (dibuka/ditutup & jadwal)
  const gateBlocked = (() => {
    if (!sesiGate) return null; // masih loading
    if (sesiGate.status !== "buka") return "tutup";
    const now2 = new Date();
    if (sesiGate.mulai && new Date(sesiGate.mulai) > now2) return "belum";
    if (sesiGate.selesai && new Date(sesiGate.selesai) < now2) return "berakhir";
    return null; // tidak diblokir
  })();

  // Jika sesi aktif peserta sendiri — izinkan lanjut meski gate tutup (sudah di tengah ujian)
  if (gateBlocked && !sesiAktif) {
    const fmtGate = (ts) => ts ? new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
    const msgMap = {
      tutup: { icon: "🔒", judul: "Sesi Ujian Ditutup", sub: "Admin telah menutup sesi ujian ini. Akses ujian tidak tersedia saat ini.", bg: "#1F2937", border: "#374151" },
      belum: { icon: "🕐", judul: "Ujian Belum Dibuka", sub: `Sesi ujian akan dibuka pada ${fmtGate(sesiGate.mulai)}. Harap tunggu sesuai jadwal yang ditentukan.`, bg: "#78350F", border: "#B45309" },
      berakhir: { icon: "🕔", judul: "Waktu Ujian Telah Habis", sub: `Sesi ujian telah ditutup pada ${fmtGate(sesiGate.selesai)}. Hubungi pengawas jika ada kendala.`, bg: "#7F1D1D", border: "#DC2626" },
    };
    const m = msgMap[gateBlocked] || msgMap["tutup"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560, margin: "0 auto", width: "100%" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: 0 }}>Ujian Saya</h1>
        <div className="card" style={{ textAlign: "center", padding: "48px 32px", background: `${m.bg}14`, border: `1.5px solid ${m.border}40` }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{m.icon}</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 10px" }}>{m.judul}</h2>
          <p className="muted" style={{ fontSize: 14, maxWidth: 420, marginInline: "auto", marginBottom: 24 }}>{m.sub}</p>
          {(sesiGate.mulai || sesiGate.selesai) && (
            <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, padding: "12px 20px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", fontSize: 13 }}>
              {sesiGate.mulai && <div><span style={{ color: "var(--text-dim)" }}>Mulai:</span> <b>{fmtGate(sesiGate.mulai)}</b></div>}
              {sesiGate.selesai && <div><span style={{ color: "var(--text-dim)" }}>Selesai:</span> <b>{fmtGate(sesiGate.selesai)}</b></div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user has active session, show resume option
  if (sesiAktif) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>📝 Ujian Saya</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Anda memiliki sesi ujian yang sedang berjalan.</p>
        </div>

        <div className="card" style={{ textAlign: "center", padding: "48px 32px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
            background: "var(--warn-bg)", border: "2px solid var(--warn-border)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 8px" }}>
            Sesi Ujian Aktif Ditemukan
          </h2>
          <p className="muted" style={{ fontSize: 14, margin: "0 0 24px", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Timer ujian Anda masih berjalan. Lanjutkan pengerjaan sekarang untuk menghindari waktu terbuang.
          </p>

          <button className="btn btn-primary" style={{ fontWeight: 700, padding: "14px 36px", fontSize: 15 }} onClick={() => router.push("/peserta/ujian/mengerjakan")}>
            Lanjutkan Ujian Sekarang &rarr;
          </button>
        </div>
      </div>
    );
  }

  // Jika peserta sudah pernah menyelesaikan ujian, kunci akses pengerjaan ulang
  if (hasilSelesai) {
    const formattedDate = new Date(hasilSelesai.waktu_selesai || hasilSelesai.created_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 800, margin: "0 auto", width: "100%" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
            Ujian Saya
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
            Status partisipasi simulasi CAT CPNS / PPPK
          </p>
        </div>

        <div className="card" style={{ padding: "40px 32px", textAlign: "center" }}>
          {/* Badge Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              margin: "0 auto 16px",
              background: hasilSelesai.lulus ? "var(--c-mint-100)" : "var(--warn-bg)",
              border: `2px solid ${hasilSelesai.lulus ? "var(--c-sage-400)" : "var(--warn-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {hasilSelesai.lulus ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--c-forest-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </div>

          <div
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: hasilSelesai.lulus ? "var(--c-mint-100)" : "var(--warn-bg)",
              color: hasilSelesai.lulus ? "var(--c-forest-700)" : "var(--warn)",
              marginBottom: 12,
            }}
          >
            {hasilSelesai.lulus ? "LULUS PASSING GRADE" : "BELUM LULUS PASSING GRADE"}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 8px" }}>
            Ujian Telah Diselesaikan & Terkunci
          </h2>
          <p className="muted" style={{ fontSize: 14, margin: "0 auto 24px", maxWidth: 540 }}>
            Anda telah menyelesaikan ujian pada <b>{formattedDate}</b>. Sesuai ketentuan sistem CAT BKN, setiap peserta hanya memiliki <b>1 (satu) kali kesempatan</b> pengerjaan. Akses ujian telah dikunci untuk akun Anda.
          </p>

          {/* Quick Score Overview */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 12,
              maxWidth: 580,
              margin: "0 auto 28px",
            }}
          >
            <div style={{ padding: "12px", background: "var(--c-mint-50)", borderRadius: 10, border: "1px solid var(--c-sage-300)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-forest-600)" }}>SKOR TOTAL</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--c-dark-900)" }}>{hasilSelesai.skor_total}</div>
            </div>
            <div style={{ padding: "12px", background: "var(--card-bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>TWK</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)" }}>{hasilSelesai.per_kategori?.TWK ?? "-"}</div>
            </div>
            <div style={{ padding: "12px", background: "var(--card-bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>TIU</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)" }}>{hasilSelesai.per_kategori?.TIU ?? "-"}</div>
            </div>
            <div style={{ padding: "12px", background: "var(--card-bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-dim)" }}>TKP</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)" }}>{hasilSelesai.per_kategori?.TKP ?? "-"}</div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              style={{ fontWeight: 700, padding: "12px 24px", fontSize: 14 }}
              onClick={() => router.push(`/peserta/hasil?id=${hasilSelesai.id}`)}
            >
              Lihat Rincian Hasil & Pembahasan &rarr;
            </button>
            <button
              className="btn btn-secondary"
              style={{ fontWeight: 600, padding: "12px 20px", fontSize: 14 }}
              onClick={() => router.push("/peserta/riwayat")}
            >
              Riwayat Ujian
            </button>
          </div>

          {/* Notice for Admin / Technical Reset */}
          <div
            style={{
              marginTop: 26,
              padding: "12px 18px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.02)",
              border: "1px dashed var(--border)",
              fontSize: 12.5,
              color: "var(--text-dim)",
              maxWidth: 580,
              marginInline: "auto",
            }}
          >
            Mengalami kendala teknis saat ujian? Hubungi <b>Pengawas / Administrator Ujian</b> untuk melakukan verifikasi dan reset sesi jika memenuhi syarat ujian susulan.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
          📝 Ujian Saya
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
          {step === "pin" ? "Masukkan PIN ujian untuk memulai sesi baru." : "Baca petunjuk ujian sebelum memulai."}
        </p>
      </div>

      {/* Step 1: PIN Entry */}
      {step === "pin" && (
        <div className="card" style={{ padding: "48px 32px" }}>
          <div className="pin-entry-section">
            {/* Lock Icon */}
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--c-mint-100), var(--c-sage-400))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 24px rgba(35, 83, 71, 0.15)"
            }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--c-forest-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 8px" }}>
                Masukkan PIN Ujian
              </h2>
              <p className="muted" style={{ fontSize: 14, margin: 0, maxWidth: 400 }}>
                Dapatkan PIN dari admin/panitia penyelenggara ujian CAT Anda untuk memulai sesi ujian.
              </p>
            </div>

            {/* PIN Digit Inputs */}
            <div className="pin-input-group" onPaste={handlePinPaste}>
              {pinValues.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  className={`pin-digit-input ${pinError ? "pin-error" : ""}`}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Error Message */}
            {pinError && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                color: "var(--bad)", fontSize: 13.5, fontWeight: 600,
                background: "var(--bad-bg)", padding: "10px 18px",
                borderRadius: "var(--radius-md)", border: "1px solid var(--bad-border)"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{pinError}</span>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ padding: "14px 48px", fontWeight: 700, fontSize: 15, marginTop: 4 }}
              onClick={verifyPin}
              disabled={pinVerifying || pinValues.some(v => !v)}
            >
              {pinVerifying ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderColor: "#fff", borderTopColor: "transparent" }} />
                  Memverifikasi…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Verifikasi PIN
                </>
              )}
            </button>

            <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
              Hubungi admin jika Anda belum menerima PIN ujian
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Instructions */}
      {step === "instructions" && (
        <>
          {/* Exam Info Card */}
          <div className="card" style={{ borderLeft: "4px solid var(--c-forest-600)" }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>
                  {config.namaUjian || DEFAULT_CONFIG.namaUjian}
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>Baca seluruh petunjuk sebelum memulai ujian</p>
              </div>
              <div style={{
                padding: "8px 14px", borderRadius: "var(--radius-md)",
                background: "var(--good-bg)", border: "1px solid var(--good-border)",
                color: "var(--good-text)", fontWeight: 700, fontSize: 13
              }}>
                ✓ PIN Terverifikasi
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div className="question-comp-item">
                <span style={{ fontWeight: 600 }}>Total Soal</span>
                <span style={{ fontWeight: 800 }}>{TOTAL_SOAL}</span>
              </div>
              <div className="question-comp-item">
                <span style={{ fontWeight: 600 }}>Durasi</span>
                <span style={{ fontWeight: 800 }}>{config.durasiTotalMenit || TOTAL_DURASI_MENIT} menit</span>
              </div>
              <div className="question-comp-item">
                <span style={{ fontWeight: 600 }}>Bagian</span>
                <span style={{ fontWeight: 800 }}>3 Kategori</span>
              </div>
              <div className="question-comp-item">
                <span style={{ fontWeight: 600 }}>Sistem</span>
                <span style={{ fontWeight: 800 }}>CAT</span>
              </div>
            </div>
          </div>

          {/* Composition Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {KATEGORI_URUT.map((k) => {
              const kat = config.kategori?.[k] || DEFAULT_CONFIG.kategori[k];
              return (
                <div key={k} className="card" style={{ textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", margin: "0 auto 12px",
                    background: k === "TWK" ? "#DBEAFE" : k === "TIU" ? "#F3E8FF" : "#FEF3C7",
                    color: k === "TWK" ? "#2563EB" : k === "TIU" ? "#9333EA" : "#D97706",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: 16
                  }}>
                    {k}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-dark-900)", marginBottom: 4 }}>
                    {KATEGORI_LABEL[k]}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
                    <div>{kat.jumlahSoal} soal • Passing Grade: <b>{kat.passingGrade}</b></div>
                    <div>Tersedia: <b style={{ color: bankTersedia[k] >= kat.jumlahSoal ? "var(--good)" : "var(--bad)" }}>{bankTersedia[k]}</b> soal</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="instructions-card">
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 18px" }}>
              📋 Petunjuk Pengerjaan Ujian
            </h3>
            <ul className="instructions-list">
              {[
                "Ujian berlangsung selama " + (config.durasiTotalMenit || TOTAL_DURASI_MENIT) + " menit. Timer mulai berjalan segera setelah Anda menekan tombol Mulai Ujian.",
                "Ujian terdiri dari 3 bagian: TWK, TIU, dan TKP yang dikerjakan secara berurutan.",
                "Setiap soal hanya memiliki SATU jawaban yang benar. Klik pada opsi untuk menjawab.",
                "Anda dapat menandai soal sebagai 'Ragu-ragu' untuk ditinjau kembali nanti.",
                "Navigasi antar soal menggunakan tombol Sebelumnya/Berikutnya atau klik nomor di panel kanan.",
                "DILARANG membuka tab/aplikasi lain selama ujian. Pelanggaran akan dicatat oleh sistem.",
                "Jawaban disimpan otomatis setiap kali Anda memilih opsi.",
                "Ujian akan otomatis diakhiri saat waktu habis.",
              ].map((text, i) => (
                <li key={i}>
                  <span className="inst-num">{i + 1}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Agreement & Start */}
          <div className="card" style={{ textAlign: "center", padding: "28px 32px" }}>
            {error && (
              <div style={{
                marginBottom: 16, padding: "12px 18px", borderRadius: "var(--radius-md)",
                background: "var(--bad-bg)", border: "1px solid var(--bad-border)",
                color: "var(--bad-text)", fontSize: 13.5, fontWeight: 600, textAlign: "left"
              }}>
                ⚠️ {error}
              </div>
            )}

            <label style={{
              display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
              textAlign: "left", margin: "0 0 20px", fontSize: 14
            }}>
              <input
                type="checkbox"
                checked={setujuPetunjuk}
                onChange={(e) => setSetujuPetunjuk(e.target.checked)}
                style={{ width: "auto", marginTop: 3, accentColor: "var(--c-forest-600)", cursor: "pointer" }}
              />
              <span style={{ fontWeight: 600, color: "var(--c-dark-900)" }}>
                Saya telah membaca dan memahami seluruh petunjuk di atas. Saya siap memulai ujian dan memahami bahwa timer akan langsung berjalan.
              </span>
            </label>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setStep("pin")} disabled={starting}>
                &larr; Kembali
              </button>
              <button
                className="btn btn-primary"
                style={{ padding: "14px 40px", fontWeight: 700, fontSize: 15 }}
                onClick={mulaiUjian}
                disabled={!setujuPetunjuk || starting}
              >
                {starting ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderColor: "#fff", borderTopColor: "transparent" }} />
                    Menyiapkan Soal…
                  </>
                ) : (
                  "🚀 Mulai Ujian Sekarang"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
