import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

export default async function AdminLayout({ children }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("role, nama")
      .eq("id", user.id)
      .single();
    profile = p;
    if (profile?.role && profile.role !== "admin") {
      redirect("/peserta");
    }
  }

  if (!user && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const adminName = profile?.nama || (user ? user.email?.split("@")[0] : "Admin");
  const adminEmail = user?.email || "admin@cat.bkn.go.id";

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main-wrap">
        <AdminTopbar userProfile={{ email: adminEmail, nama: adminName }} />
        {!user && (
          <div style={{
            background: "#FFFBEB",
            borderBottom: "1px solid #FDE68A",
            padding: "10px 24px",
            fontSize: 13,
            color: "#92400E",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ color: "#B45309", flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                <strong>Mode Pengembang:</strong> Anda membuka panel admin tanpa login. Database Supabase menerapkan <em>Row Level Security (RLS)</em> sehingga data peserta & hasil ujian hanya dapat dibaca oleh akun yang sudah login sebagai <strong>role: 'admin'</strong>.
              </span>
            </div>
            <a href="/login" style={{
              background: "#92400E",
              color: "#FFF",
              padding: "4px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none"
            }}>
              Masuk Akun Admin →
            </a>
          </div>
        )}
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
