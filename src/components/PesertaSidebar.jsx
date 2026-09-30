"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CatLogo from "./CatLogo";

export default function PesertaSidebar({ namaUser = "Peserta", emailUser = "" }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navItems = [
    {
      href: "/peserta",
      label: "Dashboard",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      exact: true,
    },
    {
      href: "/peserta/ujian",
      label: "Ujian Saya",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      href: "/peserta/riwayat",
      label: "Riwayat Ujian",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      href: "/peserta/hasil",
      label: "Hasil Ujian",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
    {
      href: "/peserta/profil",
      label: "Profil",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: "/peserta/bantuan",
      label: "Bantuan",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  const initials = namaUser?.charAt(0)?.toUpperCase() || "P";

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="sidebar-brand-box">
        <CatLogo size={32} showText={false} />
        <div>
          <div className="sidebar-brand-title">CAT</div>
          <div className="sidebar-brand-sub">Computer Assisted Test</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-item-link ${isActive ? "active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          className="nav-item-link"
          onClick={handleLogout}
          style={{ marginTop: "auto", color: "var(--bad)", border: "none", background: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: "var(--c-forest-600)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14
          }}>
            {initials}
          </div>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div className="sidebar-footer-title" style={{ margin: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {namaUser}
            </div>
            <div className="sidebar-footer-sub" style={{ margin: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {emailUser || "peserta@cat.bkn.go.id"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
