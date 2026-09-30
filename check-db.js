const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://xrukzkjfmzhmvbnggwkq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydWt6a2pmbXpobXZibmdnd2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODgwNzEsImV4cCI6MjEwNTc2NDA3MX0.WU2pwgE1BWxsv6iiL0_lH1Z5BdCYbs5q-26HTmUDZmU"
);

async function check() {
  console.log("=== CEK DATABASE SUPABASE ===");
  
  // 1. Cek profiles
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("*");
  console.log("Profiles count (via anon):", profiles?.length, "Error:", pErr?.message);
  console.log("Profiles data:", profiles);

  // 2. Cek hasil
  const { data: hasil, error: hErr } = await supabase.from("hasil").select("*");
  console.log("Hasil count (via anon):", hasil?.length, "Error:", hErr?.message);
  console.log("Hasil data:", hasil);

  // 3. Cek sesi aktif
  const { data: sesi, error: sErr } = await supabase.from("sesi_aktif").select("*");
  console.log("Sesi aktif count (via anon):", sesi?.length, "Error:", sErr?.message);
  console.log("Sesi data:", sesi);

  // 4. Cek config
  const { data: cfg, error: cErr } = await supabase.from("config").select("*");
  console.log("Config:", cfg);
}

check().catch(console.error);
