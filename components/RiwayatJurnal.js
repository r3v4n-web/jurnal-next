'use client';
import { useState } from 'react';
import { fmt, ftab, iso } from '@/lib/utils';

const FILTERS = [['all', 'Semua'], ['week', '7 hari terakhir'], ['month', 'Bulan ini']];

export default function RiwayatJurnal({ J, q, openForm, onDelete }) {
  const [filter, setFilter] = useState('all');
  const [armed, setArmed] = useState(null);

  const now = new Date();
  let rows = [...J].sort((a, b) => b.date.localeCompare(a.date));
  if (filter === 'week') {
    const c = iso(new Date(now - 6 * 864e5));
    rows = rows.filter((j) => j.date >= c);
  }
  if (filter === 'month') rows = rows.filter((j) => j.date.slice(0, 7) === iso(now).slice(0, 7));
  rows = rows.filter((j) => !q || (fmt(j.date) + ' ' + j.act).toLowerCase().includes(q));

  function hapus(j) {
    if (armed !== j.id) {
      setArmed(j.id);
      setTimeout(() => setArmed((x) => (x === j.id ? null : x)), 3000);
      return;
    }
    setArmed(null);
    onDelete(j);
  }

  return (
    <div id="pJurnal" className="panel">
      <div className="head"><h3>Riwayat jurnal</h3></div>
      <div className="chips" id="chips">
        {FILTERS.map(([k, label]) => (
          <button key={k} data-f={k} className={'btn ghost sm' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>
      <div id="list">
        {rows.length ? (
          <>
            <div className="tw">
              <table>
                <thead>
                  <tr><th>No</th><th>Tanggal</th><th>Datang</th><th>Pulang</th><th>Kegiatan</th><th>Foto</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {rows.map((j, i) => (
                    <tr key={j.id}>
                      <td data-l="No">{i + 1}</td>
                      <td data-l="Tanggal">{ftab(j.date)}</td>
                      <td data-l="Datang">{j.in || '-'}</td>
                      <td data-l="Pulang">{j.out || '-'}</td>
                      <td className="kg" data-l="Kegiatan">{j.act}</td>
                      <td data-l="Foto">{j.photo ? <img className="th" src={j.photo} alt="Foto kegiatan" /> : '-'}</td>
                      <td data-l="Aksi">
                        <button className="btn ghost sm" data-e={j.id} onClick={() => openForm(j.id)}>Edit</button>{' '}
                        <button className="btn ghost sm" data-d={j.id} onClick={() => hapus(j)}>{armed === j.id ? 'Yakin hapus?' : 'Hapus'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tf">Total: {rows.length} jurnal</div>
          </>
        ) : (
          <div className="empty">Belum ada jurnal. Tekan “Tambah jurnal” untuk memulai.</div>
        )}
      </div>
    </div>
  );
}
