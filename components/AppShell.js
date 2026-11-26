'use client';
import { useCallback, useEffect, useState } from 'react';
import AbsenPage from './AbsenPage';
import JurnalForm from './JurnalForm';
import RiwayatJurnal from './RiwayatJurnal';
import Profil from './Profil';
import { IconClock, IconList, IconPen, IconUser } from './Icons';
import * as db from '@/lib/data';
import { initials } from '@/lib/utils';

const NAV = [
  ['absen', 'Absensi', IconClock],
  ['form', 'Tambah jurnal', IconPen],
  ['jurnal', 'Riwayat jurnal', IconList],
  ['profil', 'Profil', IconUser],
];

export default function AppShell({ user, onLogout }) {
  const uid = user.id;
  const [data, setData] = useState(null); // { P, A, J }
  const [loadErr, setLoadErr] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState('absen');
  const [editId, setEditId] = useState(null);
  const [qRaw, setQRaw] = useState('');
  const q = qRaw.trim().toLowerCase();

  const reload = useCallback(async () => {
    try { setData(await db.loadAll(uid)); setLoadErr(''); }
    catch (e) { setLoadErr(e.message || 'Gagal memuat data.'); }
  }, [uid]);

  useEffect(() => { reload(); }, [reload]);

  // Bungkus aksi: mengembalikan pesan error (string) atau '' kalau berhasil, lalu muat ulang data.
  const act = (fn, { after, toastError } = {}) => async (...args) => {
    let e = '';
    try { e = (await fn(...args)) || ''; } catch (x) { e = x.message || 'Terjadi kesalahan.'; }
    if (e && toastError) { setToast(e); setTimeout(() => setToast(''), 4000); }
    if (!e) { await reload(); if (after) after(); }
    return e;
  };

  const go = (p) => { setPage(p); window.scrollTo(0, 0); };
  const openForm = (id) => { setEditId(id || null); go('form'); };

  if (!data) {
    return (
      <div className="setup">
        {loadErr ? (
          <>
            <h2>Data gagal dimuat</h2>
            <p>{loadErr}</p>
            <p>Pastikan <b>schema.sql</b> sudah dijalankan di Supabase.</p>
            <button className="btn" onClick={reload}>Coba lagi</button>{' '}
            <button className="btn ghost" onClick={onLogout}>Keluar</button>
          </>
        ) : <p>Memuat data...</p>}
      </div>
    );
  }

  const { P, A, J } = data;
  const me = { name: P.nama, email: user.email };
  const avatar = P.photo ? <img src={P.photo} alt="" /> : initials(P.nama || user.email);
  const sub = [P.kelas, P.tempat].filter(Boolean).join(' · ') || 'Siswa Prakerin';

  return (
    <section id="app">
      <aside className="sb">
        <div className="sbtop">
          <span className="sbav" id="sbav">{avatar}</span>
          <div className="sbinfo">
            <div className="sbname" id="sbname">{me.name}</div>
            <div className="sbsub" id="sbsub">{sub}</div>
          </div>
        </div>
        <nav id="side">
          {NAV.map(([k, label, Icon]) => (
            <button key={k} data-p={k} className={page === k ? 'on' : ''} onClick={() => (k === 'form' ? openForm() : go(k))}>
              <Icon />{label}
            </button>
          ))}
        </nav>
        <div className="sbfoot"><button className="btn" id="out" onClick={onLogout}>Keluar</button></div>
      </aside>

      <div className="mainc">
        <div className="bar">
          <div className="search">
            <input id="q" type="search" placeholder="Cari tanggal atau kegiatan" value={qRaw}
              onChange={(e) => setQRaw(e.target.value)} />
          </div>
          <div className="barr">
            <a id="topAdd" onClick={() => openForm()}>+ Tambah jurnal</a>
            <span className="av" id="topAv" style={{ cursor: 'pointer' }} title="Profil" onClick={() => go('profil')}>{avatar}</span>
          </div>
        </div>
        <main className="content">
          {page === 'absen' && (
            <AbsenPage
              A={A} q={q}
              onAbsen={act((kind, photo) => db.absen(uid, kind, photo))}
              onLibur={act(() => db.tandaiLibur(), { toastError: true })}
              onDelete={act((row) => db.hapusAbsen(row), { toastError: true })}
            />
          )}
          {page === 'form' && (
            <JurnalForm
              key={editId || 'baru'} journals={J} editing={J.find((j) => j.id === editId)}
              onSave={act((f, editing) => db.simpanJurnal(uid, f, editing), { after: () => go('jurnal') })}
              onCancel={() => go('jurnal')}
            />
          )}
          {page === 'jurnal' && (
            <RiwayatJurnal J={J} q={q} openForm={openForm}
              onDelete={act((j) => db.hapusJurnal(j), { toastError: true })} />
          )}
          {page === 'profil' && (
            <Profil
              user={me} P={P} A={A} J={J}
              onSaveProfile={act((f) => db.simpanProfil(uid, f))}
              onPhoto={act((url) => db.gantiFotoProfil(uid, url, P.fotoPath), { toastError: true })}
              onChangePassword={(lama, baru) => db.gantiSandi(user.email, lama, baru)}
            />
          )}
        </main>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
