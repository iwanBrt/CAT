"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Topbar({ namaUjian, namaUser, subtitle, tabs }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-badge">CAT</div>
          <div>
            <div>{namaUjian}</div>
            <div className="muted" style={{ fontSize: 11.5, fontWeight: 500 }}>
              {subtitle || namaUser}
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-sm btn-ghost" onClick={handleLogout}>
          Keluar &rarr;
        </button>
      </header>
      {tabs && tabs.length > 0 && (
        <nav className="tabs">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={pathname === t.href ? "active" : ""}>
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
