"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CatLogo from "@/components/CatLogo";
import { StudentExamIllustration } from "@/components/Illustrations";

export default function RegisterPage() {
  const supabase = createClient();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { nama: nama.trim() },
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setDone(true);
  }

  async function handleResendEmail() {
    setResending(true);
    setResendStatus("");
    const redirectUrl = typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    setResending(false);
    if (error) {
      setResendStatus(`Gagal kirim ulang: ${error.message}`);
    } else {
      setResendStatus("Email konfirmasi baru berhasil dikirim!");
    }
  }

  return (
    <div className="auth-split-shell">
      <div className="auth-split-card">
        {/* Sisi Kiri: Sama persis dengan tampilan Login */}
        <div className="auth-left-branding">
          <div>
            <CatLogo size={44} showText={true} subtitle="Computer Assisted Test" />
            <p style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--c-forest-700)",
              marginTop: 14,
              marginBottom: 0
            }}>
              Ujian Lebih Mudah, Hasil Lebih Akurat
            </p>
          </div>

          <div style={{ margin: "24px 0" }}>
            <StudentExamIllustration height={220} />
          </div>

          <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5 }}>
            Sistem Computer Assisted Test terintegrasi dengan pengawasan real-time, standar keamanan tinggi, dan akuntabilitas nasional.
          </div>
        </div>

        {/* Sisi Kanan: Form Registrasi */}
        <div className="auth-right-form">
          {done ? (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "var(--c-mint-100)",
                  color: "var(--c-forest-600)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 8px" }}>
                Cek Email Kamu
              </h1>
              <p style={{ fontSize: 13.5, color: "var(--text-dim)", margin: "0 0 18px", lineHeight: 1.5 }}>
                Tautan konfirmasi telah dikirim ke <b>{email}</b>. Silakan klik tautan di email untuk mengaktifkan akunmu.
              </p>

              <div className="auth-alert auth-alert-info" style={{ textAlign: "left", marginBottom: 16 }}>
                <span>💡</span>
                <span style={{ fontSize: 12.5 }}>
                  Tidak menemukan email? Cek folder <b>Spam / Promosi</b>. Jika opsi konfirmasi email dinonaktifkan di Supabase, Anda dapat langsung masuk.
                </span>
              </div>

              {resendStatus && (
                <p style={{
                  fontSize: 13,
                  marginBottom: 14,
                  color: resendStatus.includes("Gagal") ? "var(--bad)" : "var(--good)",
                  fontWeight: 600
                }}>
                  {resendStatus}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  {resending ? "Mengirim ulang…" : "Kirim ulang email konfirmasi"}
                </button>

                <Link href="/login" className="btn btn-primary" style={{ width: "100%", padding: 12 }}>
                  Pergi ke Halaman Masuk
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h1 style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--c-dark-900)",
                  margin: "0 0 6px"
                }}>
                  Daftar Akun Baru
                </h1>
                <p style={{
                  fontSize: 13.5,
                  color: "var(--text-dim)",
                  margin: 0
                }}>
                  Silakan lengkapi data untuk membuat akun CAT
                </p>
              </div>

              {error && (
                <div className="auth-alert auth-alert-error" style={{ marginBottom: 18 }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label htmlFor="reg-nama" style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 6px" }}>
                    <span>Nama Lengkap</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, color: "var(--text-dim)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      id="reg-nama"
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 6px" }}>
                    <span>Alamat Email</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, color: "var(--text-dim)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: 42 }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 6px" }}>
                    <span>Kata Sandi</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: 12, color: "var(--text-dim)" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 10,
                        background: "none",
                        border: "none",
                        color: "var(--text-dim)",
                        cursor: "pointer",
                        padding: 4
                      }}
                      aria-label="Lihat kata sandi"
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="7" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%", marginTop: 8 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Sedang Mendaftar…
                    </>
                  ) : (
                    "Daftar Sekarang"
                  )}
                </button>
              </form>

              <div style={{
                textAlign: "center",
                marginTop: 22,
                fontSize: 13,
                color: "var(--text-dim)"
              }}>
                Sudah punya akun?{" "}
                <Link href="/login" style={{ fontWeight: 700, color: "var(--c-forest-600)" }}>
                  Masuk di sini
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
