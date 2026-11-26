'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function pesan(error) {
  const m = (error.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Email atau kata sandi salah.';
  if (m.includes('not confirmed')) return 'Email belum dikonfirmasi. Cek kotak masuk email Anda.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email sudah terdaftar.';
  if (m.includes('password')) return 'Kata sandi minimal 6 karakter.';
  if (m.includes('rate limit')) return 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.';
  return error.message;
}

// Setelah login atau daftar berhasil, halaman utama berpindah sendiri lewat onAuthStateChange.
export default function Auth({ mode, go, leaving }) {
  const [l, setL] = useState({ email: '', pass: '' });
  const [r, setR] = useState({ name: '', email: '', pass: '' });
  const [lErr, setLErr] = useState('');
  const [rErr, setRErr] = useState('');
  const [rOk, setROk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    setBusy(true);
    setLErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: l.email.trim().toLowerCase(), password: l.pass });
    if (error) setLErr(pesan(error));
    setBusy(false);
  }

  async function submitReg(e) {
    e.preventDefault();
    setBusy(true);
    setRErr('');
    setROk(false);
    const { data, error } = await supabase.auth.signUp({
      email: r.email.trim().toLowerCase(),
      password: r.pass,
      options: { data: { nama_lengkap: r.name.trim() } },
    });
    if (error) setRErr(pesan(error));
    else if (!data.session) { setROk(true); setRErr('Pendaftaran berhasil. Cek email untuk konfirmasi, lalu login.'); }
    setBusy(false);
  }

  return (
    <section id="auth" className={leaving ? 'leaving' : ''}>
      <button className="back" onClick={() => go('landing')}>← Kembali</button>
      <div className="authgrid">
        {mode === 'login' ? (
          <form className="acard" id="fLogin" onSubmit={submitLogin}>
            <div className="dots"><i></i><i></i></div>
            <h2>Login</h2>
            <p className="sub">Masukkan email dan kata sandi untuk masuk.</p>
            <label>Email</label>
            <input id="lEmail" type="email" required autoFocus placeholder="nama@sekolah.sch.id"
              value={l.email} onChange={(e) => setL({ ...l, email: e.target.value })} />
            <label>Kata sandi</label>
            <input id="lPass" type="password" required
              value={l.pass} onChange={(e) => setL({ ...l, pass: e.target.value })} />
            <div className="err" id="lErr">{lErr}</div>
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Memproses...' : 'Login'}</button>
            <p className="sw">Belum punya akun? <a data-go="daftar" onClick={() => go('daftar')}>Sign in</a></p>
          </form>
        ) : (
          <form className="acard" id="fReg" onSubmit={submitReg}>
            <div className="dots"><i></i><i></i></div>
            <h2>Sign in</h2>
            <p className="sub">Buat akun siswa prakerin baru.</p>
            <label>Nama lengkap</label>
            <input id="rName" required autoFocus value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
            <label>Email</label>
            <input id="rEmail" type="email" required value={r.email} onChange={(e) => setR({ ...r, email: e.target.value })} />
            <label>Kata sandi (min. 6 karakter)</label>
            <input id="rPass" type="password" minLength={6} required value={r.pass} onChange={(e) => setR({ ...r, pass: e.target.value })} />
            <div className={'err' + (rOk ? ' ok' : '')} id="rErr">{rErr}</div>
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Memproses...' : 'Sign in'}</button>
            <p className="sw">Sudah punya akun? <a data-go="login" onClick={() => go('login')}>Login</a></p>
          </form>
        )}
      </div>
    </section>
  );
}
