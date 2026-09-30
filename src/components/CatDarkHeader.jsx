"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CatLogo from "./CatLogo";

export default function CatDarkHeader({ namaUser = "Peserta 123456" }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="cat-dark-topbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        <CatLogo size={32} showText={true} subtitle="" light={true} />
      </div>

      <div className="user-actions">
        <div className="user-pill">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{namaUser}</span>
        </div>

        <button type="button" className="btn-logout" onClick={handleLogout} title="Keluar dari sesi ujian">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Keluar</span>
        </button>
      </div>
    </header>
  );
}
