'use client';
import { useState } from 'react';
import { initials, shrink } from '@/lib/utils';

export default function Profil({ user, P, A, J, onSaveProfile, onPhoto, onChangePassword }) {
  const [f, setF] = useState({
    name: user.name, nis: P.nis, kelas: P.kelas, tempat: P.tempat,
    pemb: P.pemb, mulai: P.mulai, selesai: P.selesai,
  });
  const [pw, setPw] = useState({ old: '', n1: '', n2: '' });
  const [msg, setMsg] = useState('');
  const [pmsg, setPmsg] = useState('');
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const flash = (setter, text) => { setter(text); setTimeout(() => setter(''), 3000); };

  async function saveProfile(e) {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    setBusy(true);
    const err = await onSaveProfile({ ...f, name, nis: f.nis.trim(), kelas: f.kelas.trim(), tempat: f.tempat.trim(), pemb: f.pemb.trim() });
    setBusy(false);
    flash(setMsg, err || 'Profil tersimpan.');
  }

  async function changePass(e) {
    e.preventDefault();
    if (pw.n1 !== pw.n2) return flash(setPmsg, 'Kata sandi baru tidak sama.');
    setBusy(true);
    const err = await onChangePassword(pw.old, pw.n1);
    setBusy(false);
    if (!err) setPw({ old: '', n1: '', n2: '' });
    flash(setPmsg, err || 'Kata sandi diganti.');
  }

  async function changePhoto(e) {
    const file = e.target.files[0];
    if (file) await onPhoto(await shrink(file, 240, 0.8));
  }

  return (
    <div id="pProfil">
      <div className="panel prof">
        <div className="head"><h3>Profil saya</h3></div>
        <div className="pavatar">
          <span className="bigav" id="bigav">{P.photo ? <img src={P.photo} alt="" /> : initials(user.name || user.email)}</span>
          <div>
            <div className="pname" id="pname">{user.name}</div>
            <div className="pemail" id="pemail">{user.email}</div>
            <label className="btn ghost sm filebtn" htmlFor="pFoto">Ganti foto</label>
            <input type="file" id="pFoto" accept="image/*" className="hide" onChange={changePhoto} />
          </div>
        </div>
        <div className="stats">
          <div><b id="sHadir">{A.filter((a) => !a.libur).length}</b><span>Hadir</span></div>
          <div><b id="sLibur">{A.filter((a) => a.libur).length}</b><span>Libur</span></div>
          <div><b id="sJurnal">{J.length}</b><span>Jurnal</span></div>
        </div>
      </div>

      <div className="panel">
        <form id="fProf" onSubmit={saveProfile}>
          <h3>Data diri</h3>
          <div className="g2">
            <div><label>Nama lengkap</label><input id="fName" required value={f.name} onChange={up('name')} /></div>
            <div><label>Email</label><input id="fEmail" disabled value={user.email} readOnly /></div>
            <div><label>NIS</label><input id="fNis" value={f.nis} onChange={up('nis')} /></div>
            <div><label>Kelas / jurusan</label><input id="fKelas" placeholder="Contoh: XII TKJ 1" value={f.kelas} onChange={up('kelas')} /></div>
            <div><label>Tempat prakerin</label><input id="fTempat" value={f.tempat} onChange={up('tempat')} /></div>
            <div><label>Pembimbing lapangan</label><input id="fPemb" value={f.pemb} onChange={up('pemb')} /></div>
            <div><label>Tanggal mulai</label><input type="date" id="fMulai" value={f.mulai} onChange={up('mulai')} /></div>
            <div><label>Tanggal selesai</label><input type="date" id="fSelesai" value={f.selesai} onChange={up('selesai')} /></div>
          </div>
          <div className="mact" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <button className="btn" type="submit" disabled={busy}>Simpan profil</button>
            <span className="note" id="pMsg">{msg}</span>
          </div>
        </form>
      </div>

      <div className="panel">
        <form id="fPass" onSubmit={changePass}>
          <h3>Ganti kata sandi</h3>
          <div className="g2">
            <div><label>Kata sandi lama</label><input type="password" id="pOld" required value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></div>
            <div></div>
            <div><label>Kata sandi baru (min. 6 karakter)</label><input type="password" id="pNew" minLength={6} required value={pw.n1} onChange={(e) => setPw({ ...pw, n1: e.target.value })} /></div>
            <div><label>Ulangi kata sandi baru</label><input type="password" id="pNew2" required value={pw.n2} onChange={(e) => setPw({ ...pw, n2: e.target.value })} /></div>
          </div>
          <div className="mact" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
            <button className="btn" type="submit" disabled={busy}>Ganti kata sandi</button>
            <span className="note" id="ppMsg">{pmsg}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
