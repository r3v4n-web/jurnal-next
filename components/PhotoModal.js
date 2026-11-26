'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { shrink } from '@/lib/utils';

// Jendela foto absen: kamera langsung, dengan cadangan pilih file.
export default function PhotoModal({ kind, onClose, onSubmit }) {
  const vid = useRef(null);
  const stream = useRef(null);
  const token = useRef(0);
  const [state, setState] = useState('loading'); // loading | live | fail
  const [msg, setMsg] = useState('Membuka kamera...');
  const [photo, setPhoto] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const stop = useCallback(() => {
    if (stream.current) stream.current.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (vid.current) vid.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    const my = ++token.current;
    setPhoto('');
    setErr('');
    setState('loading');
    setMsg('Membuka kamera...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState('fail');
      setMsg('Browser ini tidak mendukung kamera langsung. Pilih foto dari file.');
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 } },
        audio: false,
      });
      if (my !== token.current) { s.getTracks().forEach((t) => t.stop()); return; }
      stream.current = s;
      vid.current.srcObject = s;
      await vid.current.play().catch(() => {});
      setState('live');
    } catch {
      if (my !== token.current) return;
      setState('fail');
      setMsg('Kamera tidak bisa dibuka (izin ditolak atau kamera tidak ada). Pilih foto dari file.');
    }
  }, []);

  useEffect(() => {
    start();
    return () => { token.current++; stop(); };
  }, [start, stop]);

  function shot() {
    const v = vid.current;
    if (!v || !v.videoWidth) return;
    const k = Math.min(1, 480 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement('canvas');
    c.width = v.videoWidth * k;
    c.height = v.videoHeight * k;
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    stop();
    setPhoto(c.toDataURL('image/jpeg', 0.7));
    setErr('');
  }

  async function pickFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    stop();
    token.current++;
    setPhoto(await shrink(f, 480, 0.65));
    setErr('');
  }

  async function ok() {
    if (!photo) return setErr('Ambil foto dulu sebelum mengirim absen.');
    setBusy(true);
    const e = await onSubmit(photo);
    if (e) { setErr(e); setBusy(false); }
  }

  function close() { token.current++; stop(); onClose(); }

  const framed = typeof window !== 'undefined' && window.top !== window.self;

  return (
    <div className="modal" id="pm">
      <div className="mbox">
        <h3 id="pmT">{kind === 'in' ? 'Foto absen datang' : 'Foto absen pulang'}</h3>
        <p className="sub">Hadapkan wajah ke kamera, lalu ambil foto sebagai bukti kehadiran.</p>
        <div className="cam">
          <video id="pmVid" ref={vid} autoPlay playsInline muted className={state === 'live' && !photo ? '' : 'hide'} />
          {photo && <img id="pmImg" src={photo} alt="Pratinjau foto absen" />}
          {!photo && state !== 'live' && (
            <div className="camph" id="camPh">
              {msg}
              {state === 'fail' && framed && (
                <a className="btn sm" href={window.location.href} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
                  Buka di tab baru
                </a>
              )}
            </div>
          )}
        </div>
        <div className="camrow">
          {photo ? (
            <button type="button" className="btn ghost" id="pmRetake" onClick={start}>Ulangi</button>
          ) : (
            <button type="button" className="btn" id="pmShot" disabled={state !== 'live'} onClick={shot}>Ambil foto</button>
          )}
          <label className="btn ghost" htmlFor="pmFile">Pilih dari file</label>
        </div>
        <input type="file" id="pmFile" accept="image/*" capture="user" className="hide" onChange={pickFile} />
        <div className="err" id="pmErr">{err}</div>
        <div className="mact">
          <button className="btn ghost" id="pmCancel" type="button" onClick={close}>Batal</button>
          <button className="btn" id="pmOk" type="button" disabled={busy} onClick={ok}>{busy ? 'Mengirim...' : 'Kirim absen'}</button>
        </div>
      </div>
    </div>
  );
}
