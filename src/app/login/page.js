"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CatLogo from "@/components/CatLogo";
import { StudentExamIllustration } from "@/components/Illustrations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const urlError = searchParams.get("error");
  const initialAlert = urlError === "verifikasi_gagal"
    ? "Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan coba masuk kembali."
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // If identifier doesn't have @, treat as username/NIK
    const emailToUse = identifier.includes("@") ? identifier.trim() : `${identifier.trim().toLowerCase()}@cat.bkn.go.id`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password
    });

    setLoading(false);

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Email/Akun belum dikonfirmasi. Periksa pesan verifikasi Anda.");
      } else if (authError.message.toLowerCase().includes("invalid login credentials")) {
        setError("No. Peserta/Email atau kata sandi tidak sesuai. Silakan periksa kembali.");
      } else {
        setError(authError.message);
      }
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-split-shell">
      <div className="auth-split-card">
        {/* Left Side: Branding & Illustration */}
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

        {/* Right Side: Login Form */}
        <div className="auth-right-form">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--c-dark-900)",
              margin: "0 0 6px"
            }}>
              Masuk ke Akun
            </h1>
            <p style={{
              fontSize: 13.5,
              color: "var(--text-dim)",
              margin: 0
            }}>
              Silakan login untuk melanjutkan ke sistem CAT
            </p>
          </div>

          {(error || initialAlert) && (
            <div className="auth-alert auth-alert-error" style={{ marginBottom: 18 }}>
              <span>⚠️</span>
              <span>{error || initialAlert}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="login-id" style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 6px" }}>
                <span>No. Peserta / NIK</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: 12, color: "var(--text-dim)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="login-id"
                  type="text"
                  required
                  placeholder="Masukkan No. Peserta / Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <label htmlFor="login-password" style={{ margin: 0 }}>Kata Sandi</label>
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: 12, color: "var(--text-dim)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Masukkan password"
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
                  <span className="spinner" /> Memverifikasi Akun…
                </>
              ) : (
                "Login"
              )}
            </button>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "6px 0",
              color: "var(--text-dim)",
              fontSize: 12.5
            }}>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span>atau</span>
              <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          </form>

          <div style={{
            textAlign: "center",
            marginTop: 22,
            fontSize: 12.5,
            color: "var(--text-dim)"
          }}>
            Butuh bantuan?{" "}
            <a href="mailto:panitia@cat.bkn.go.id" style={{ fontWeight: 600, color: "var(--c-forest-600)" }}>
              Hubungi panitia ujian
            </a>
          </div>

          <div style={{
            textAlign: "center",
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px dashed var(--border)",
            fontSize: 12.5,
            color: "var(--text-dim)"
          }}>
            Peserta baru?{" "}
            <Link href="/register" style={{ fontWeight: 700, color: "var(--c-forest-600)" }}>
              Daftar Akun Peserta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-split-shell"><p className="muted">Memuat halaman login…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
