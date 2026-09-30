    -- ============================================================
    -- SKEMA DATABASE: Simulasi CAT CPNS/PPPK
    -- Jalankan seluruh isi file ini di Supabase Dashboard -> SQL Editor -> Run
    -- ============================================================

    -- 1. PROFIL PENGGUNA (role: peserta / admin) -------------------
    create table if not exists public.profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      nama text,
      role text not null default 'peserta' check (role in ('peserta','admin')),
      created_at timestamptz not null default now()
    );

    -- Otomatis buat baris profil setiap ada user baru daftar
    create or replace function public.handle_new_user()
    returns trigger as $$
    begin
      insert into public.profiles (id, nama, role)
      values (new.id, coalesce(new.raw_user_meta_data->>'nama', new.email), 'peserta');
      return new;
    end;
    $$ language plpgsql security definer;

    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();

    -- Fungsi cek admin (security definer supaya tidak kena rekursi RLS)
    create or replace function public.is_admin()
    returns boolean as $$
      select exists(
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
      );
    $$ language sql security definer stable;

    -- 2. BANK SOAL --------------------------------------------------
    create table if not exists public.soal (
      id uuid primary key default gen_random_uuid(),
      kategori text not null check (kategori in ('TWK','TIU','TKP')),
      teks text not null,
      opsi jsonb not null,        -- array string, contoh: ["opsi A","opsi B",...]
      kunci int,                  -- index jawaban benar (untuk TWK/TIU)
      bobot jsonb,                -- array angka 1-5 sepanjang opsi (untuk TKP)
      aktif boolean not null default true,
      created_at timestamptz not null default now()
    );

    -- 3. PENGATURAN UJIAN --------------------------------------------
    create table if not exists public.config (
      id text primary key default 'default',
      nama_ujian text not null default 'Simulasi SKD CPNS/PPPK',
      kategori jsonb not null,
      pin_ujian text not null default '123456'
    );
    alter table public.config add column if not exists pin_ujian text default '123456';

    insert into public.config (id, nama_ujian, kategori)
    values ('default', 'Simulasi SKD CPNS/PPPK', '{
      "TWK": {"jumlahSoal":30, "durasiMenit":30, "passingGrade":65, "skorBenar":5},
      "TIU": {"jumlahSoal":35, "durasiMenit":35, "passingGrade":80, "skorBenar":5},
      "TKP": {"jumlahSoal":45, "durasiMenit":45, "passingGrade":166, "skorBenar":0}
    }'::jsonb)
    on conflict (id) do nothing;

    -- 4. SESI UJIAN AKTIF (per peserta, privat) -----------------------
    create table if not exists public.sesi_aktif (
      user_id uuid primary key references auth.users(id) on delete cascade,
      data jsonb not null,
      updated_at timestamptz not null default now()
    );

    -- 5. HASIL UJIAN ---------------------------------------------------
    create table if not exists public.hasil (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id) on delete cascade,
      waktu_mulai timestamptz,
      waktu_selesai timestamptz default now(),
      per_kategori jsonb not null,
      jawaban jsonb,
      skor_total int not null,
      lulus boolean not null,
      created_at timestamptz not null default now()
    );

    -- ============================================================
    -- ROW LEVEL SECURITY
    -- ============================================================
    alter table public.profiles enable row level security;
    alter table public.soal enable row level security;
    alter table public.config enable row level security;
    alter table public.sesi_aktif enable row level security;
    alter table public.hasil enable row level security;

    -- profiles: lihat profil sendiri, atau semua profil kalau admin (buat dashboard)
    drop policy if exists profiles_select on public.profiles;
    create policy profiles_select on public.profiles
      for select using (id = auth.uid() or public.is_admin());

    drop policy if exists profiles_update_own on public.profiles;
    create policy profiles_update_own on public.profiles
      for update using (id = auth.uid());

    -- soal: semua user login boleh baca, hanya admin boleh tulis/ubah/hapus
    drop policy if exists soal_select on public.soal;
    create policy soal_select on public.soal
      for select using (auth.uid() is not null);

    drop policy if exists soal_write_admin on public.soal;
    create policy soal_write_admin on public.soal
      for all using (public.is_admin()) with check (public.is_admin());

    -- config: semua user login boleh baca, hanya admin boleh tulis
    drop policy if exists config_select on public.config;
    create policy config_select on public.config
      for select using (auth.uid() is not null);

    drop policy if exists config_write_admin on public.config;
    create policy config_write_admin on public.config
      for all using (public.is_admin()) with check (public.is_admin());

    -- sesi_aktif: hanya pemilik sesi yang boleh baca/tulis sesinya sendiri
    drop policy if exists sesi_own on public.sesi_aktif;
    create policy sesi_own on public.sesi_aktif
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());

    -- hasil: peserta lihat hasil sendiri, admin lihat semua; insert hanya untuk diri sendiri
    drop policy if exists hasil_select on public.hasil;
    create policy hasil_select on public.hasil
      for select using (user_id = auth.uid() or public.is_admin());

    drop policy if exists hasil_insert_own on public.hasil;
    create policy hasil_insert_own on public.hasil
      for insert with check (user_id = auth.uid());

    -- ============================================================
    -- CATATAN: menjadikan seseorang admin
    -- Jalankan (ganti email sesuai akun yang mau dijadikan admin):
    --
    --   update public.profiles set role = 'admin'
    --   where id = (select id from auth.users where email = 'admin@contoh.com');
    -- ============================================================
