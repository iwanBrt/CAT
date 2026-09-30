import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SOAL_DEMO_BKN } from "@/lib/dataSoalBkn";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Pastikan config default ada
    await supabase.from("config").upsert({
      id: "default",
      nama_ujian: "Simulasi SKD CPNS/PPPK",
      pin_ujian: "123456",
      kategori: {
        TWK: { jumlahSoal: 30, durasiMenit: 30, passingGrade: 65, skorBenar: 5 },
        TIU: { jumlahSoal: 35, durasiMenit: 35, passingGrade: 80, skorBenar: 5 },
        TKP: { jumlahSoal: 45, durasiMenit: 45, passingGrade: 166, skorBenar: 0 },
      },
    });

    // 2. Format soal sesuai schema Supabase (kategori, teks, opsi, kunci, bobot, aktif)
    const payload = SOAL_DEMO_BKN.map((item) => {
      const row = {
        kategori: item.kategori,
        teks: item.teks,
        opsi: item.opsi,
        aktif: true,
      };
      if (item.kategori === "TKP") {
        row.bobot = item.bobot;
        row.kunci = null;
      } else {
        row.kunci = item.kunci;
        row.bobot = null;
      }
      return row;
    });

    // 3. Insert in chunks
    const CHUNK = 25;
    let inserted = 0;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const batch = payload.slice(i, i + CHUNK);
      const { error } = await supabase.from("soal").insert(batch);
      if (error) {
        // If anon key insert fails due to RLS, return error message
        return NextResponse.json({ success: false, error: error.message, inserted }, { status: 400 });
      }
      inserted += batch.length;
    }

    return NextResponse.json({ success: true, inserted, total: payload.length });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
