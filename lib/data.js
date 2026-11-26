import { supabase } from './supabase';

const t5 = (t) => (t ? t.slice(0, 5) : '');

async function toBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

// Unggah foto (data URL) ke bucket privat, di folder milik pengguna. Mengembalikan path file.
export async function uploadPhoto(bucket, uid, dataUrl, name) {
  const path = `${uid}/${name || Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, await toBlob(dataUrl), { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  return path;
}

export async function removePhotos(bucket, paths) {
  const list = paths.filter(Boolean);
  if (list.length) await supabase.storage.from(bucket).remove(list);
}

// Bucket privat, jadi foto ditampilkan lewat tautan sementara (1 jam).
async function sign(bucket, paths) {
  const list = [...new Set(paths.filter(Boolean))];
  if (!list.length) return {};
  const { data } = await supabase.storage.from(bucket).createSignedUrls(list, 3600);
  const map = {};
  (data || []).forEach((x) => { if (x.signedUrl) map[x.path] = x.signedUrl; });
  return map;
}

// Muat profil, absensi, dan jurnal milik pengguna, lalu ubah ke bentuk yang dipakai komponen.
export async function loadAll(uid) {
  const [pr, ab, ju] = await Promise.all([
    supabase.from('profil').select('*').eq('id', uid).single(),
    supabase.from('absensi').select('*').eq('user_id', uid).order('tanggal', { ascending: false }),
    supabase.from('jurnal').select('*').eq('user_id', uid).order('tanggal', { ascending: false }),
  ]);
  const err = pr.error || ab.error || ju.error;
  if (err) throw err;

  const [sAbsen, sJurnal, sProfil] = await Promise.all([
    sign('foto-absen', ab.data.flatMap((a) => [a.foto_datang, a.foto_pulang])),
    sign('foto-jurnal', ju.data.map((j) => j.foto)),
    sign('foto-profil', [pr.data.foto]),
  ]);

  const p = pr.data;
  return {
    P: {
      nama: p.nama_lengkap, nis: p.nis || '', kelas: p.kelas || '', tempat: p.tempat_prakerin || '',
      pemb: p.pembimbing || '', mulai: p.tanggal_mulai || '', selesai: p.tanggal_selesai || '',
      photo: p.foto ? sProfil[p.foto] : '', fotoPath: p.foto || '',
    },
    A: ab.data.map((a) => ({
      id: a.id, date: a.tanggal, in: t5(a.jam_datang), out: t5(a.jam_pulang), libur: a.libur,
      inPhoto: a.foto_datang ? sAbsen[a.foto_datang] : '', outPhoto: a.foto_pulang ? sAbsen[a.foto_pulang] : '',
      inPath: a.foto_datang || '', outPath: a.foto_pulang || '',
    })),
    J: ju.data.map((j) => ({
      id: j.id, date: j.tanggal, in: t5(j.jam_datang), out: t5(j.jam_pulang), act: j.kegiatan,
      photo: j.foto ? sJurnal[j.foto] : '', photoPath: j.foto || '',
    })),
  };
}

// ---- Absensi (jam diambil dari server lewat fungsi database) ----

export async function absen(uid, kind, dataUrl) {
  const path = await uploadPhoto('foto-absen', uid, dataUrl);
  const { error } = await supabase.rpc(kind === 'in' ? 'absen_datang' : 'absen_pulang', { p_foto: path });
  if (error) { await removePhotos('foto-absen', [path]); return error.message; }
  return '';
}

export async function tandaiLibur() {
  const { error } = await supabase.rpc('tandai_libur');
  return error ? error.message : '';
}

export async function hapusAbsen(row) {
  const { error } = await supabase.from('absensi').delete().eq('id', row.id);
  if (error) return error.message;
  await removePhotos('foto-absen', [row.inPath, row.outPath]);
  return '';
}

// ---- Jurnal ----

export async function simpanJurnal(uid, f, editing) {
  let foto = editing ? editing.photoPath || null : null;
  let hapusLama = null;
  let baru = null;
  if (f.photo && f.photo.startsWith('data:')) {
    baru = await uploadPhoto('foto-jurnal', uid, f.photo);
    if (foto) hapusLama = foto;
    foto = baru;
  } else if (!f.photo && foto) {
    hapusLama = foto;
    foto = null;
  }
  const row = { tanggal: f.date, jam_datang: f.in || null, jam_pulang: f.out || null, kegiatan: f.act, foto };
  const q = editing
    ? supabase.from('jurnal').update(row).eq('id', editing.id)
    : supabase.from('jurnal').insert(row);
  const { error } = await q;
  if (error) {
    if (baru) await removePhotos('foto-jurnal', [baru]);
    return error.code === '23505' ? 'Jurnal untuk tanggal ini sudah ada. Edit saja yang lama.' : error.message;
  }
  if (hapusLama) await removePhotos('foto-jurnal', [hapusLama]);
  return '';
}

export async function hapusJurnal(j) {
  const { error } = await supabase.from('jurnal').delete().eq('id', j.id);
  if (error) return error.message;
  await removePhotos('foto-jurnal', [j.photoPath]);
  return '';
}

// ---- Profil dan akun ----

export async function simpanProfil(uid, f) {
  const { error } = await supabase.from('profil').update({
    nama_lengkap: f.name, nis: f.nis || null, kelas: f.kelas || null, tempat_prakerin: f.tempat || null,
    pembimbing: f.pemb || null, tanggal_mulai: f.mulai || null, tanggal_selesai: f.selesai || null,
  }).eq('id', uid);
  return error ? error.message : '';
}

export async function gantiFotoProfil(uid, dataUrl, lama) {
  const path = await uploadPhoto('foto-profil', uid, dataUrl, 'avatar-' + Date.now());
  const { error } = await supabase.from('profil').update({ foto: path }).eq('id', uid);
  if (error) { await removePhotos('foto-profil', [path]); return error.message; }
  if (lama) await removePhotos('foto-profil', [lama]);
  return '';
}

export async function gantiSandi(email, lama, baru) {
  const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: lama });
  if (e1) return 'Kata sandi lama salah.';
  const { error } = await supabase.auth.updateUser({ password: baru });
  return error ? error.message : '';
}
