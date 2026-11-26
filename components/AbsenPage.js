'use client';
import { useEffect, useState } from 'react';
import PhotoModal from './PhotoModal';
import { IconIn, IconOut } from './Icons';
import { fmt, hm, pad, todayWIB } from '@/lib/utils';

export default function AbsenPage({ A, q, onAbsen, onLibur, onDelete }) {
  const [now, setNow] = useState(() => new Date());
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState(null); // 'in' | 'out' | null
  const [armed, setArmed] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = todayWIB(now);
  const t = A.find((a) => a.date === today);
  const lb = t && t.libur;

  function open(kind) {
    if (lb) return setMsg('Hari ini sudah ditandai libur.');
    if (kind === 'out' && (!t || !t.in)) return setMsg('Absen datang dulu.');
    setMsg('');
    setModal(kind);
  }

  async function submit(photo) {
    const e = await onAbsen(modal, photo);
    if (!e) setModal(null);
    return e;
  }

  function libur() {
    if (t) return setMsg(t.libur ? 'Hari ini sudah ditandai libur.' : 'Kamu sudah absen hari ini.');
    setMsg('');
    onLibur();
  }

  function hapus(row) {
    if (armed !== row.date) {
      setArmed(row.date);
      setTimeout(() => setArmed((x) => (x === row.date ? null : x)), 3000);
      return;
    }
    setArmed(null);
    onDelete(row);
  }

  const rows = [...A]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((a) => !q || fmt(a.date).toLowerCase().includes(q));

  return (
    <>
      <div id="pAbsen" className="panel">
        <div className="head ahead">
          <div><h3>Absensi hari ini</h3><div className="date" id="today">{fmt(today)}</div></div>
          <div className="clock" id="clock">{hm(now)}:{pad(now.getSeconds())}</div>
        </div>
        <div className="acards">
          <div className="acard2 in">
            <div className="ac-top">
              <IconIn className="ico" />
              <div className="ac-info"><div className="ac-n">Masuk</div><div className="ac-time" id="tIn">{t && t.in ? t.in : '--:--'}</div></div>
              {t && t.inPhoto && <img className="ac-ph" id="phIn" src={t.inPhoto} alt="Foto masuk" />}
            </div>
            <div className="ac-r" id="rIn">{lb ? 'Hari ini libur' : t && t.in ? 'Sudah absen datang' : 'Belum absen datang'}</div>
            <button className="btn cbtn in" id="bIn" disabled={!!(lb || (t && t.in))} onClick={() => open('in')}>
              {t && t.in ? 'Sudah absen' : 'Absen datang'}
            </button>
          </div>
          <div className="acard2 out">
            <div className="ac-top">
              <IconOut className="ico" />
              <div className="ac-info"><div className="ac-n">Pulang</div><div className="ac-time" id="tOut">{t && t.out ? t.out : '--:--'}</div></div>
              {t && t.outPhoto && <img className="ac-ph" id="phOut" src={t.outPhoto} alt="Foto pulang" />}
            </div>
            <div className="ac-r" id="rOut">{lb ? 'Hari ini libur' : t && t.out ? 'Sudah absen pulang' : 'Belum absen pulang'}</div>
            <button className="btn cbtn out" id="bOut" disabled={!!(lb || !t || !t.in || t.out)} onClick={() => open('out')}>
              {t && t.out ? 'Sudah absen' : 'Absen pulang'}
            </button>
          </div>
        </div>
        <div className="libur">
          <div><b>Tidak masuk hari ini?</b><div className="ac-r" style={{ margin: '2px 0 0' }}>Tandai sebagai libur kalau tidak ada kegiatan prakerin.</div></div>
          <button className="btn ghost" id="bLibur" disabled={!!t} onClick={libur}>Libur hari ini</button>
        </div>
        <div className="st" id="st">{msg && <span style={{ color: 'var(--link)' }}>{msg}</span>}</div>
      </div>

      <div id="pAbsHist" className="panel">
        <div className="head"><h3>Riwayat absensi</h3></div>
        <div id="aList">
          {rows.length ? (
            <>
              <div>
                {rows.map((a) => (
                  <div className="aday" key={a.date}>
                    <div className="adh">
                      <b>{fmt(a.date)}</b>
                      <button className="btn ghost sm" data-ad={a.date} onClick={() => hapus(a)}>
                        {armed === a.date ? 'Yakin hapus?' : 'Hapus'}
                      </button>
                    </div>
                    {a.libur ? (
                      <div className="arow"><span className="lb2">Libur</span></div>
                    ) : (
                      <>
                        <div className="arow">
                          <span className="ai g"><IconIn />Masuk</span>
                          <span className="at">{a.inPhoto && <img className="th2" src={a.inPhoto} alt="Foto masuk" />}<b>{a.in || '--:--'}</b></span>
                        </div>
                        <div className="arow">
                          <span className="ai o"><IconOut />Pulang</span>
                          <span className="at">{a.outPhoto && <img className="th2" src={a.outPhoto} alt="Foto pulang" />}<b>{a.out || '--:--'}</b></span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className="tf">Total: {rows.length} catatan</div>
            </>
          ) : (
            <div className="empty">Belum ada riwayat absensi.</div>
          )}
        </div>
      </div>

      {modal && <PhotoModal kind={modal} onClose={() => setModal(null)} onSubmit={submit} />}
    </>
  );
}
