-- =====================================================================
--  JURNAL PRAKERIN - SKEMA DATABASE SUPABASE
--  Cara pakai: Supabase Dashboard > SQL Editor > New query > tempel > Run.
--  Aman dijalankan ulang (memakai "if not exists", "or replace", dan
--  "drop ... if exists").
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------

-- Profil siswa (satu baris per akun di auth.users).
create table if not exists public.profil (
  id               uuid primary key references auth.users (id) on delete cascade,
  nama_lengkap     text not null,
  email            text,
  role             text not null default 'siswa'
                     check (role in ('siswa', 'pembimbing', 'admin')),
  nis              text,
  kelas            text,
  tempat_prakerin  text,
  pembimbing       text,
  tanggal_mulai    date,
  tanggal_selesai  date,
  foto             text,                       -- path file di bucket foto-profil
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Absensi harian: maksimal satu baris per siswa per tanggal.
create table if not exists public.absensi (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tanggal      date not null,
  jam_datang   time,
  jam_pulang   time,
  foto_datang  text,                           -- path file di bucket foto-absen
  foto_pulang  text,
  libur        boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint absensi_satu_per_hari unique (user_id, tanggal),
  constraint absensi_libur_kosong check (
    not libur or (jam_datang is null and jam_pulang is null
                  and foto_datang is null and foto_pulang is null)
  ),
  constraint absensi_pulang_butuh_datang check (
    jam_pulang is null or jam_datang is not null
  )
);

-- Jurnal kegiatan harian: maksimal satu baris per siswa per tanggal.
create table if not exists public.jurnal (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tanggal     date not null,
  jam_datang  time,
  jam_pulang  time,
  kegiatan    text not null check (length(trim(kegiatan)) > 0),
  foto        text,                            -- path file di bucket foto-jurnal
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint jurnal_satu_per_hari unique (user_id, tanggal)
);

create index if not exists absensi_tanggal_idx on public.absensi (tanggal desc);
create index if not exists jurnal_tanggal_idx  on public.jurnal  (tanggal desc);


-- ---------------------------------------------------------------------
-- 2. FUNGSI DAN TRIGGER
-- ---------------------------------------------------------------------

-- Mengisi kolom updated_at otomatis setiap kali baris diubah.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profil_updated_at  on public.profil;
drop trigger if exists absensi_updated_at on public.absensi;
drop trigger if exists jurnal_updated_at  on public.jurnal;

create trigger profil_updated_at  before update on public.profil
  for each row execute function public.set_updated_at();
create trigger absensi_updated_at before update on public.absensi
  for each row execute function public.set_updated_at();
create trigger jurnal_updated_at  before update on public.jurnal
  for each row execute function public.set_updated_at();

-- Membuat baris profil otomatis saat siswa mendaftar.
-- Nama diambil dari metadata pendaftaran: { nama_lengkap: '...' }.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profil (id, nama_lengkap, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nama_lengkap'), ''),
             split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Menjaga kolom email di profil tetap sama dengan email akun.
create or replace function public.sync_profil_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profil set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profil_email();

-- Apakah pengguna saat ini guru pembimbing atau admin?
-- security definer supaya bisa membaca profil tanpa memicu rekursi RLS.
create or replace function public.is_pembimbing()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profil
    where id = auth.uid() and role in ('pembimbing', 'admin')
  );
$$;


-- ---------------------------------------------------------------------
-- 3. ABSEN DENGAN JAM SERVER (opsional, disarankan)
--    Jam diambil dari server (WIB), jadi tidak bisa diubah-ubah dari browser.
--    Dipanggil dari Next.js: supabase.rpc('absen_datang', { p_foto: path })
-- ---------------------------------------------------------------------

create or replace function public.absen_datang(p_foto text default null)
returns public.absensi
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wib   timestamp := now() at time zone 'Asia/Jakarta';
  hasil public.absensi;
begin
  insert into public.absensi as a (user_id, tanggal, jam_datang, foto_datang)
  values (auth.uid(), wib::date, wib::time(0), p_foto)
  on conflict (user_id, tanggal) do update
    set jam_datang = excluded.jam_datang,
        foto_datang = excluded.foto_datang
    where a.jam_datang is null and a.libur = false
  returning * into hasil;

  if hasil.id is null then
    raise exception 'Kamu sudah absen datang hari ini, atau hari ini ditandai libur.';
  end if;
  return hasil;
end;
$$;

create or replace function public.absen_pulang(p_foto text default null)
returns public.absensi
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wib   timestamp := now() at time zone 'Asia/Jakarta';
  hasil public.absensi;
begin
  update public.absensi
     set jam_pulang = wib::time(0),
         foto_pulang = p_foto
   where user_id = auth.uid()
     and tanggal = wib::date
     and jam_datang is not null
     and jam_pulang is null
     and libur = false
  returning * into hasil;

  if not found then
    raise exception 'Absen datang dulu, atau kamu sudah absen pulang hari ini.';
  end if;
  return hasil;
end;
$$;

create or replace function public.tandai_libur()
returns public.absensi
language plpgsql
security invoker
set search_path = ''
as $$
declare
  wib   timestamp := now() at time zone 'Asia/Jakarta';
  hasil public.absensi;
begin
  insert into public.absensi (user_id, tanggal, libur)
  values (auth.uid(), wib::date, true)
  on conflict (user_id, tanggal) do nothing
  returning * into hasil;

  if hasil.id is null then
    raise exception 'Hari ini sudah ada catatan absen.';
  end if;
  return hasil;
end;
$$;

revoke execute on function public.absen_datang(text) from public, anon;
revoke execute on function public.absen_pulang(text) from public, anon;
revoke execute on function public.tandai_libur()     from public, anon;
grant  execute on function public.absen_datang(text) to authenticated;
grant  execute on function public.absen_pulang(text) to authenticated;
grant  execute on function public.tandai_libur()     to authenticated;


-- ---------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Siswa hanya bisa melihat dan mengubah datanya sendiri.
--    Pembimbing dan admin bisa melihat data semua siswa (hanya baca).
-- ---------------------------------------------------------------------

alter table public.profil  enable row level security;
alter table public.absensi enable row level security;
alter table public.jurnal  enable row level security;

revoke all on public.profil, public.absensi, public.jurnal from anon;

-- profil
drop policy if exists "profil: baca sendiri atau pembimbing" on public.profil;
drop policy if exists "profil: ubah sendiri"                 on public.profil;

create policy "profil: baca sendiri atau pembimbing" on public.profil
  for select to authenticated
  using (id = auth.uid() or public.is_pembimbing());

create policy "profil: ubah sendiri" on public.profil
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Siswa hanya boleh mengubah kolom data diri. Kolom role, email, dan id
-- tidak bisa diubah dari aplikasi (mengangkat pembimbing dilakukan lewat SQL).
revoke insert, update, delete on public.profil from authenticated;
grant update (nama_lengkap, nis, kelas, tempat_prakerin, pembimbing,
              tanggal_mulai, tanggal_selesai, foto)
  on public.profil to authenticated;

-- absensi
drop policy if exists "absensi: baca" on public.absensi;
drop policy if exists "absensi: tambah sendiri" on public.absensi;
drop policy if exists "absensi: ubah sendiri" on public.absensi;
drop policy if exists "absensi: hapus sendiri" on public.absensi;

create policy "absensi: baca" on public.absensi
  for select to authenticated
  using (user_id = auth.uid() or public.is_pembimbing());
create policy "absensi: tambah sendiri" on public.absensi
  for insert to authenticated
  with check (user_id = auth.uid());
create policy "absensi: ubah sendiri" on public.absensi
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "absensi: hapus sendiri" on public.absensi
  for delete to authenticated
  using (user_id = auth.uid());

-- jurnal
drop policy if exists "jurnal: baca" on public.jurnal;
drop policy if exists "jurnal: tambah sendiri" on public.jurnal;
drop policy if exists "jurnal: ubah sendiri" on public.jurnal;
drop policy if exists "jurnal: hapus sendiri" on public.jurnal;

create policy "jurnal: baca" on public.jurnal
  for select to authenticated
  using (user_id = auth.uid() or public.is_pembimbing());
create policy "jurnal: tambah sendiri" on public.jurnal
  for insert to authenticated
  with check (user_id = auth.uid());
create policy "jurnal: ubah sendiri" on public.jurnal
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "jurnal: hapus sendiri" on public.jurnal
  for delete to authenticated
  using (user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 5. STORAGE UNTUK FOTO
--    Bucket bersifat privat. Path file: {user_id}/{nama-file}.jpg
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('foto-absen',  'foto-absen',  false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('foto-jurnal', 'foto-jurnal', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('foto-profil', 'foto-profil', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "foto: unggah ke folder sendiri" on storage.objects;
drop policy if exists "foto: baca sendiri atau pembimbing" on storage.objects;
drop policy if exists "foto: ubah milik sendiri" on storage.objects;
drop policy if exists "foto: hapus milik sendiri" on storage.objects;

create policy "foto: unggah ke folder sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('foto-absen', 'foto-jurnal', 'foto-profil')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "foto: baca sendiri atau pembimbing" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('foto-absen', 'foto-jurnal', 'foto-profil')
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_pembimbing())
  );

create policy "foto: ubah milik sendiri" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('foto-absen', 'foto-jurnal', 'foto-profil')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('foto-absen', 'foto-jurnal', 'foto-profil')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "foto: hapus milik sendiri" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('foto-absen', 'foto-jurnal', 'foto-profil')
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- 6. REKAP UNTUK PEMBIMBING
--    Memakai security_invoker, jadi aturan RLS tetap berlaku:
--    siswa hanya melihat dirinya, pembimbing melihat semua siswa.
-- ---------------------------------------------------------------------

create or replace view public.rekap_siswa
with (security_invoker = true) as
select
  p.id as user_id,
  p.nama_lengkap,
  p.nis,
  p.kelas,
  p.tempat_prakerin,
  (select count(*) from public.absensi a where a.user_id = p.id and not a.libur) as hadir,
  (select count(*) from public.absensi a where a.user_id = p.id and a.libur)     as libur,
  (select count(*) from public.jurnal  j where j.user_id = p.id)                 as jurnal
from public.profil p
where p.role = 'siswa';

revoke all on public.rekap_siswa from anon;
grant select on public.rekap_siswa to authenticated;


-- ---------------------------------------------------------------------
-- 7. MENGANGKAT GURU PEMBIMBING (jalankan manual, ganti emailnya)
-- ---------------------------------------------------------------------
-- update public.profil set role = 'pembimbing' where email = 'guru@sekolah.sch.id';
