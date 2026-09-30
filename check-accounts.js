const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://xrukzkjfmzhmvbnggwkq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydWt6a2pmbXpobXZibmdnd2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODgwNzEsImV4cCI6MjEwNTc2NDA3MX0.WU2pwgE1BWxsv6iiL0_lH1Z5BdCYbs5q-26HTmUDZmU"
);

async function testAccounts() {
  console.log("=== CEK AKUN ADMIN ===");
  const testEmails = [
    "admin@cat.bkn.go.id",
    "admin@admin.com",
    "admin@gmail.com",
    "hanabancin354@gmail.com"
  ];

  for (const email of testEmails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: "password"
    });
    console.log(email, "=>", error ? error.message : "LOGIN SUCCESS! User ID: " + data.user?.id);
  }
}

testAccounts().catch(console.error);
