import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PesertaSidebar from "@/components/PesertaSidebar";
import AdminTopbar from "@/components/AdminTopbar";

export default async function PesertaLayout({ children }) {
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
    if (profile?.role === "admin") redirect("/admin");
  }

  if (!user && process.env.NODE_ENV === "production") {
    redirect("/login");
  }

  const displayName = profile?.nama || (user ? user.email?.split("@")[0] : "Peserta");
  const displayEmail = user?.email || "peserta@cat.bkn.go.id";

  return (
    <div className="admin-shell">
      <PesertaSidebar namaUser={displayName} emailUser={displayEmail} />
      <div className="admin-main-wrap">
        <AdminTopbar userProfile={{ email: displayEmail, nama: displayName }} />
        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
