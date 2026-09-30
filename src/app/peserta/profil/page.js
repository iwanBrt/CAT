
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [namaInput, setNamaInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [stats, setStats] = useState({ total: 0, lulus: 0, tertinggi: 0 });

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) { router.push("/login"); return; }
        if (ignore) return;
        setUser(authUser);

        const { data: prof } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();
        if (!ignore && prof) {
          setProfile(prof);
          setNamaInput(prof.nama || "");
        }

        const { data: hasil } = await supabase
          .from("hasil")
          .select("skor_total, lulus")
          .eq("user_id", authUser.id);
        
        if (!ignore && hasil && hasil.length > 0) {
          setStats({
            total: hasil.length,
            lulus: hasil.filter(h => h.lulus).length,
            tertinggi: Math.max(...hasil.map(h => h.skor_total || 0))
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const handleSave = async () => {
    if (!namaInput.trim()) return;
    setSaving(true);
    setSuccess("");

    const { error } = await supabase
      .from("profiles")
      .update({ nama: namaInput.trim() })
      .eq("id", user.id);

    if (!error) {
      setProfile(prev => ({ ...prev, nama: namaInput.trim() }));
      setEditing(false);
      setSuccess("Profil berhasil diperbarui!");
      setTimeout(() => setSuccess(""), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: "var(--c-forest-600)", borderTopColor: "transparent", margin: "0 auto 16px" }} />
        <p className="muted" style={{ fontWeight: 600 }}>Memuat profil…</p>
      </div>
    );
  }

  const initials = (profile?.nama || "P").charAt(0).toUpperCase();
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 4px" }}>👤 Profil Saya</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>Kelola informasi akun Anda</p>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          padding: "12px 18px", borderRadius: "var(--radius-md)",
          background: "var(--good-bg)", border: "1px solid var(--good-border)",
          color: "var(--good-text)", fontSize: 13.5, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Avatar & Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--c-forest-600), var(--c-sage-400))",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 800, flexShrink: 0,
              boxShadow: "0 6px 20px rgba(35, 83, 71, 0.2)"
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--c-dark-900)", marginBottom: 4 }}>
                {profile?.nama || "Peserta"}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-dim)" }}>{user?.email}</div>
              <div style={{
                marginTop: 8, display: "inline-flex", padding: "4px 12px",
                borderRadius: 999, fontSize: 11.5, fontWeight: 700,
                background: "var(--c-mint-100)", color: "var(--c-forest-600)",
                border: "1px solid var(--c-sage-400)", textTransform: "uppercase"
              }}>
                {profile?.role || "peserta"}
              </div>
            </div>
          </div>

          {/* Info Fields */}
          <div className="profile-card-grid">
            <div className="profile-field">
              <label>Nama Lengkap</label>
              {editing ? (
                <input
                  type="text"
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  style={{
                    padding: "10px 14px", borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--c-forest-600)", fontSize: 15, fontWeight: 600,
                    outline: "none", fontFamily: "inherit"
                  }}
                  autoFocus
                />
              ) : (
                <div className="field-value">{profile?.nama || "-"}</div>
              )}
            </div>
            <div className="profile-field">
              <label>Email</label>
              <div className="field-value">{user?.email || "-"}</div>
            </div>
            <div className="profile-field">
              <label>Role</label>
              <div className="field-value" style={{ textTransform: "capitalize" }}>{profile?.role || "peserta"}</div>
            </div>
            <div className="profile-field">
              <label>Bergabung Sejak</label>
              <div className="field-value">{joinDate}</div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            {editing ? (
              <>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? "Menyimpan…" : "Simpan Perubahan"}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setNamaInput(profile?.nama || ""); }} style={{ flex: 1 }}>
                  Batal
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setEditing(true)} style={{ flex: 1 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Profil
              </button>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-dark-900)", margin: "0 0 20px" }}>
            Statistik Ujian
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
              borderRadius: "var(--radius-md)", background: "var(--bg)", border: "1px solid var(--border)"
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "var(--radius-md)",
                background: "#E0F2FE", color: "#0284C7",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--c-dark-900)", lineHeight: 1 }}>{stats.total}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontWeight: 600 }}>Total Ujian Selesai</div>
              </div>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
              borderRadius: "var(--radius-md)", background: "var(--bg)", border: "1px solid var(--border)"
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "var(--radius-md)",
                background: "var(--good-bg)", color: "var(--good)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--good)", lineHeight: 1 }}>{stats.lulus}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontWeight: 600 }}>Lulus Passing Grade</div>
              </div>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
              borderRadius: "var(--radius-md)", background: "var(--bg)", border: "1px solid var(--border)"
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "var(--radius-md)",
                background: "#F3E8FF", color: "#9333EA",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#9333EA", lineHeight: 1 }}>{stats.tertinggi}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", fontWeight: 600 }}>Skor Tertinggi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
