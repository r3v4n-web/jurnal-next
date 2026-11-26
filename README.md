# Jurnal Prakerin (Next.js + Supabase)

Aplikasi absensi dan jurnal harian untuk siswa prakerin. Dibuat dengan Next.js (App Router), React, dan Supabase.

## Menjalankan

1. Buat project Supabase, lalu jalankan seluruh isi `supabase/schema.sql` di **SQL Editor**.
2. Salin `.env.local.example` menjadi `.env.local`, lalu isi:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://NAMA-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=kunci-anon-atau-publishable
   ```
3. Di Supabase: **Authentication > Providers > Email**, matikan "Confirm email" selama pengembangan.
4. Jalankan:
   ```bash
   npm install
   npm run dev
   ```
   Buka http://localhost:3000.

Kalau `.env.local` belum diisi, aplikasi menampilkan layar "Supabase belum diatur". Kalau tabel belum dibuat, muncul "Data gagal dimuat".

## Fitur

- Daftar (Sign in), Login, dan Keluar lewat Supabase Auth
- Absensi datang dan pulang dengan foto dari kamera, jam dari server (WIB), dan tombol Libur
- Riwayat absensi per hari dengan foto
- Tambah, edit, dan hapus jurnal (tanggal, jam, kegiatan, foto)
- Riwayat jurnal dengan filter dan pencarian
- Profil: data diri, foto, ganti kata sandi
- Tampilan responsif untuk HP, tablet, dan komputer

## Struktur

```
app/            layout, halaman utama, dan CSS global
components/     Landing, Auth, AppShell, AbsenPage, JurnalForm, RiwayatJurnal, Profil, PhotoModal
lib/supabase.js klien Supabase
lib/data.js     semua pembacaan dan penulisan data (tabel, fungsi absen, storage foto)
lib/utils.js    format tanggal, kompres foto
supabase/       schema.sql dan panduannya
public/bg.jpg   foto latar
```

## Catatan

- Data tiap siswa dilindungi Row Level Security: siswa hanya bisa mengakses datanya sendiri. Guru pembimbing (role `pembimbing`) bisa membaca data semua siswa lewat Supabase, tetapi aplikasi ini belum punya halaman khusus pembimbing.
- Foto disimpan di Supabase Storage (bucket privat) dan ditampilkan lewat tautan sementara 1 jam.
- Kamera hanya bisa dibuka di HTTPS atau `localhost`.
- Jangan pernah memasang kunci `service_role` atau `sb_secret_` di aplikasi ini.
