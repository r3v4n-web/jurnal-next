# Database Supabase untuk Jurnal Prakerin

## Langkah pemasangan

1. Buat project di https://supabase.com, lalu buka **SQL Editor > New query**.
2. Tempel seluruh isi `supabase/schema.sql`, lalu klik **Run**. File ini aman dijalankan ulang.
3. Buka **Project Settings > API**, salin *Project URL* dan *anon public key*, lalu isi `.env.local` (contoh ada di `.env.local.example`).
4. Pasang pustaka: `npm install @supabase/supabase-js`
5. Opsional: di **Authentication > Providers > Email**, matikan "Confirm email" selama pengembangan supaya siswa bisa langsung login setelah mendaftar.
6. Untuk mengangkat guru pembimbing, jalankan di SQL Editor:
   ```sql
   update public.profil set role = 'pembimbing' where email = 'guru@sekolah.sch.id';
   ```

## Isi database

| Tabel / objek | Fungsi |
|---|---|
| `profil` | Data diri siswa (nama, NIS, kelas, tempat prakerin, pembimbing, tanggal mulai dan selesai, foto) dan `role` |
| `absensi` | Satu baris per siswa per tanggal: jam datang, jam pulang, foto datang, foto pulang, libur |
| `jurnal` | Satu baris per siswa per tanggal: jam datang, jam pulang, kegiatan, foto |
| `rekap_siswa` (view) | Jumlah hadir, libur, dan jurnal tiap siswa, untuk pembimbing |
| `absen_datang`, `absen_pulang`, `tandai_libur` | Fungsi absen dengan jam server (WIB) |
| Bucket `foto-absen`, `foto-jurnal`, `foto-profil` | Penyimpanan foto (privat, maksimal 2 MB, JPG/PNG/WebP) |

Keamanan (Row Level Security):

- Siswa hanya bisa melihat, menambah, mengubah, dan menghapus data miliknya sendiri.
- Pembimbing dan admin bisa melihat data semua siswa, tetapi tidak bisa mengubahnya.
- Kolom `role`, `email`, dan `id` di profil tidak bisa diubah dari aplikasi.
- Foto disimpan di folder `{user_id}/`, dan hanya pemiliknya (serta pembimbing untuk membaca) yang boleh mengaksesnya.

## Padanan dengan data di aplikasi sekarang

| Aplikasi (localStorage) | Database |
|---|---|
| `jp_users` (nama, email, sandi) | `auth.users` + `profil.nama_lengkap` |
| `jp_p_{email}` | `profil` |
| `jp_a_{email}`: `date`, `in`, `out`, `inPhoto`, `outPhoto`, `libur` | `absensi`: `tanggal`, `jam_datang`, `jam_pulang`, `foto_datang`, `foto_pulang`, `libur` |
| `jp_j_{email}`: `date`, `in`, `out`, `act`, `photo` | `jurnal`: `tanggal`, `jam_datang`, `jam_pulang`, `kegiatan`, `foto` |

Kolom foto menyimpan **path file** di Storage, bukan gambar base64.

## Contoh pemakaian di Next.js

Aplikasi di folder ini sudah memakai semua ini (lihat `lib/data.js`). Contoh di bawah hanya untuk referensi kalau Anda ingin mengembangkannya.

```js
// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

Daftar dan login (profil dibuat otomatis oleh trigger):

```js
await supabase.auth.signUp({
  email, password,
  options: { data: { nama_lengkap: nama } },
});
await supabase.auth.signInWithPassword({ email, password });
await supabase.auth.signOut();
```

Absen dengan foto (unggah foto dulu, lalu panggil fungsi):

```js
const { data: { user } } = await supabase.auth.getUser();
const path = `${user.id}/${Date.now()}.jpg`;
await supabase.storage.from('foto-absen').upload(path, blob, { contentType: 'image/jpeg' });

const { data, error } = await supabase.rpc('absen_datang', { p_foto: path });   // atau 'absen_pulang'
await supabase.rpc('tandai_libur');
```

Jurnal (tambah, ubah, hapus):

```js
await supabase.from('jurnal').insert({ tanggal, jam_datang, jam_pulang, kegiatan, foto: path });
await supabase.from('jurnal').update({ kegiatan, foto: path }).eq('id', id);
await supabase.from('jurnal').delete().eq('id', id);

const { data } = await supabase.from('jurnal').select('*').order('tanggal', { ascending: false });
```

Menampilkan foto (bucket privat, jadi pakai tautan sementara):

```js
const { data } = await supabase.storage.from('foto-jurnal').createSignedUrl(path, 3600);
// data.signedUrl dipakai di <img src=...>
```

Profil dan rekap pembimbing:

```js
await supabase.from('profil').update({ nis, kelas, tempat_prakerin }).eq('id', user.id);
const { data: rekap } = await supabase.from('rekap_siswa').select('*');   // hanya terisi penuh untuk pembimbing
```

## Catatan

- Jam di fungsi `absen_datang` dan `absen_pulang` memakai zona waktu Asia/Jakarta. Ganti `'Asia/Jakarta'` di `schema.sql` kalau Anda di WITA atau WIT.
- Siswa masih bisa mengubah jam lewat `supabase.from('absensi')` langsung. Kalau jam harus benar-benar tidak bisa diubah siswa, hapus policy `absensi: tambah sendiri` dan `absensi: ubah sendiri`, lalu ubah ketiga fungsi absen menjadi `security definer`.
- Satu siswa hanya bisa punya satu jurnal dan satu catatan absen per tanggal (sama seperti aturan di aplikasi sekarang).
