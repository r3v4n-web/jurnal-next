'use client';
import { useRef, useState } from 'react';
import { fmt, shrink, todayWIB } from '@/lib/utils';

export default function JurnalForm({ journals, editing, onSave, onCancel }) {
  const j = editing || { date: todayWIB(), in: '', out: '', act: '', photo: '' };
  const [f, setF] = useState({
    date: j.date,
    in: j.in,
    out: j.out,
    act: j.act.startsWith('(belum') ? '' : j.act,
    photo: j.photo || '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  let dur = '';
  if (f.in && f.out) {
    const m = +f.out.slice(0, 2) * 60 + +f.out.slice(3) - (+f.in.slice(0, 2) * 60 + +f.in.slice(3));
    if (m > 0) dur = `Lama kerja: ${Math.floor(m / 60)} jam${m % 60 ? ' ' + (m % 60) + ' menit' : ''}`;
  }

  async function pick(e) {
    const file = e.target.files[0];
    if (file) setF({ ...f, photo: await shrink(file, 640, 0.7) });
  }

  function removePhoto() {
    if (fileRef.current) fileRef.current.value = '';
    setF({ ...f, photo: '' });
  }

  async function submit(e) {
    e.preventDefault();
    if (journals.some((x) => x.date === f.date && x.id !== (editing && editing.id))) {
      return setErr('Jurnal untuk tanggal ini sudah ada. Edit saja yang lama.');
    }
    setBusy(true);
    setErr('');
    const msg = await onSave({ ...f, act: f.act.trim() }, editing);
    if (msg) { setErr(msg); setBusy(false); }
  }

  return (
    <div id="pForm" className="panel">
      <form id="fJ" onSubmit={submit}>
        <div className="jhead">
          <div>
            <h3 id="mTitle">{editing ? 'Edit jurnal' : 'Tambah jurnal'}</h3>
            <p>Tulis kegiatan prakerinmu dengan jelas, lalu lampirkan foto sebagai bukti.</p>
          </div>
          <span className="jday" id="jDay">{f.date ? fmt(f.date) : ''}</span>
        </div>
        <div className="jgrid">
          <div className="jl">
            <div className="fsec">
              <h4>Waktu</h4>
              <div className="t3">
                <div className="tbox"><span>Tanggal</span><input type="date" id="jDate" required value={f.date} onChange={up('date')} /></div>
                <div className="tbox"><span>Jam datang</span><input type="time" id="jIn" value={f.in} onChange={up('in')} /></div>
                <div className="tbox"><span>Jam pulang</span><input type="time" id="jOut" value={f.out} onChange={up('out')} /></div>
              </div>
              <div className="dur" id="jDur">{dur}</div>
            </div>
            <div className="fsec">
              <h4>Kegiatan</h4>
              <textarea id="jAct" required value={f.act} onChange={up('act')}
                placeholder="Contoh: Memasang kabel jaringan di ruang server dan mengecek koneksi tiap komputer." />
              <div className="dur">Tulis apa yang dikerjakan, alat atau aplikasi yang dipakai, dan hasilnya.</div>
            </div>
          </div>
          <div className="fsec jr">
            <h4 className="h4row">Foto kegiatan<button type="button" className="btn ghost sm" id="rmPhoto" onClick={removePhoto}>Hapus foto</button></h4>
            <label className="dz" htmlFor="jFile">
              <span className="plus">+</span><b>Pilih foto</b><small>JPG atau PNG, ukuran dikecilkan otomatis</small>
              <img id="prev" src={f.photo || undefined} className={f.photo ? '' : 'hide'} alt="Pratinjau foto" />
            </label>
            <input type="file" id="jFile" ref={fileRef} accept="image/*" className="hide" onChange={pick} />
            <div className="dur">Foto boleh dari kamera atau galeri.</div>
          </div>
        </div>
        <div className="jfoot">
          <div className="err" id="jErr">{err}</div>
          <div className="jbtns">
            <button type="button" className="btn ghost" id="cancel" onClick={onCancel}>Batal</button>
            <button className="btn fsave" type="submit" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan jurnal'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}
