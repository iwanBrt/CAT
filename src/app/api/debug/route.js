import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profRes, hasilRes, sesiRes, countRes] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("hasil").select("*"),
    supabase.from("sesi_aktif").select("*"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    currentUser: user ? { id: user.id, email: user.email } : null,
    profiles: {
      data: profRes.data,
      error: profRes.error ? profRes.error.message : null,
      totalCount: countRes.count,
    },
    hasil: {
      data: hasilRes.data,
      error: hasilRes.error ? hasilRes.error.message : null,
    },
    sesi_aktif: {
      data: sesiRes.data,
      error: sesiRes.error ? sesiRes.error.message : null,
    },
  });
}
