"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminTopbar({ userProfile }) {
  const router = useRouter();
  const supabase = createClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifList, setNotifList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Load recent notif (latest hasil + sesi_aktif count)
  useEffect(() => {
    async function loadNotif() {
      const [{ data: hasil }, { data: sesi }] = await Promise.all([
        supabase.from("hasil").select("id, user_id, skor_total, lulus, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("sesi_aktif").select("user_id"),
      ]);

      const notifs = [];
      if (sesi && sesi.length > 0) {
        notifs.push({
          id: "sesi",
          title: `${sesi.length} Peserta Sedang Ujian`,
          desc: "Sesi aktif berlangsung saat ini",
          time: "Sekarang",
          color: "#16A34A",
        });
      }
      (hasil || []).slice(0, 4).forEach(h => {
        notifs.push({
          id: h.id,
          title: h.lulus ? "Peserta Lulus SKD" : "Ujian Selesai",
          desc: `Skor: ${h.skor_total} / 550 — ${h.lulus ? "LULUS" : "Tidak Lulus"}`,
          time: formatRelative(h.created_at),
          color: h.lulus ? "#16A34A" : "#6B7280",
        });
      });

      setNotifList(notifs);
      setUnreadCount(notifs.length);
    }
    loadNotif();
  }, []);

  function formatRelative(ts) {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return "baru saja";
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/admin/peserta?q=${encodeURIComponent(search.trim())}`);
    setSearch("");
  }

  const initials = (userProfile?.nama || userProfile?.email || "AD")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="admin-topbar">
      {/* Search Form */}
      <form onSubmit={handleSearchSubmit} className="admin-search-box">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Cari peserta atau ID... (Enter)"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </form>

      {/* Right Actions */}
      <div className="admin-top-right">
        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <div
            className="notif-bell-btn"
            title="Notifikasi"
            onClick={() => { setNotifOpen(!notifOpen); setDropdownOpen(false); setUnreadCount(0); }}
            style={{ cursor: "pointer" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notif-badge-dot">{Math.min(unreadCount, 9)}</span>
            )}
          </div>

          {notifOpen && (
            <div style={{
              position: "absolute", right: 0, top: 48,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)",
              width: 300, zIndex: 60, overflow: "hidden"
            }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 800, fontSize: 13, color: "var(--c-dark-900)" }}>
                Notifikasi
              </div>
              {notifList.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-dim)", fontSize: 13 }}>
                  Tidak ada notifikasi baru
                </div>
              ) : (
                <div>
                  {notifList.map(n => (
                    <div key={n.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--c-dark-900)" }}>{n.title}</div>
                        <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 1 }}>{n.desc}</div>
                        <div style={{ fontSize: 10.5, color: n.color, marginTop: 2, fontWeight: 600 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ padding: "8px 14px", textAlign: "center" }}>
                    <a
                      href="/admin/ujian"
                      style={{ fontSize: 12.5, fontWeight: 600, color: "var(--c-forest-600)" }}
                      onClick={() => setNotifOpen(false)}
                    >
                      Lihat Semua Aktivitas →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: "relative" }}>
          <div
            className="admin-profile-pill"
            onClick={() => { setDropdownOpen(!dropdownOpen); setNotifOpen(false); }}
          >
            <div className="admin-avatar-circle">
              {initials}
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--c-dark-900)" }}>
              {userProfile?.nama || "Admin"}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-dim)" }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {dropdownOpen && (
            <div style={{
              position: "absolute", right: 0, top: 48,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)",
              padding: "6px", width: 200, zIndex: 60,
            }}>
              <div style={{ padding: "10px 12px", fontSize: 12, borderBottom: "1px solid var(--border)", color: "var(--text-dim)", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: "var(--c-dark-900)", marginBottom: 2 }}>{userProfile?.nama || "Admin"}</div>
                <div>{userProfile?.email || "admin@cat.bkn.go.id"}</div>
              </div>
              <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--text)", textDecoration: "none", borderRadius: 6, fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                Dashboard
              </a>
              <a href="/admin/pengaturan" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "var(--text)", textDecoration: "none", borderRadius: 6, fontWeight: 600 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /></svg>
                Pengaturan
              </a>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 4 }}>
                <button
                  type="button"
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", fontSize: 13, color: "#DC2626", background: "none", border: "none", width: "100%", cursor: "pointer", borderRadius: 6, fontWeight: 700 }}
                  onClick={handleLogout}
                  onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                  Keluar Akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close overlays when clicking outside */}
      {(dropdownOpen || notifOpen) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          onClick={() => { setDropdownOpen(false); setNotifOpen(false); }}
        />
      )}
    </header>
  );
}
