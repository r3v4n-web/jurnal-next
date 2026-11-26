'use client';

const BARIS_1 = ['Semangat', 'prakerin,'];
const BARIS_2 = ['jangan', 'lupa', 'isi', 'jurnal.'];

// Bulatan cahaya besar yang melayang pelan di latar.
const ORBS = [
  { l: '8%', t: '18%', s: 220, d: 0, c: '#e8a33d' },
  { l: '70%', t: '12%', s: 180, d: 2, c: '#f7c966' },
  { l: '85%', t: '60%', s: 260, d: 4, c: '#b4600f' },
  { l: '30%', t: '72%', s: 200, d: 1, c: '#e8a33d' },
  { l: '55%', t: '40%', s: 120, d: 3, c: '#f7c966' },
];

// Butiran debu kecil yang naik dari bawah.
const DUST = Array.from({ length: 16 }, (_, i) => ({
  l: `${(i * 37 + 7) % 100}%`,
  s: 3 + (i % 4) * 2,
  dur: 9 + (i % 5) * 2.5,
  delay: (i * 0.9) % 8,
}));

export default function Landing({ go, leaving }) {
  const kata = (w, i, extra = '') => (
    <span key={w + i} className={'w ' + extra} style={{ '--i': i }}>{w}</span>
  );

  return (
    <section id="landing" className={leaving ? 'leaving' : ''}>
      <div className="lbg" />
      <div className="lshade" />
      {ORBS.map((o, i) => (
        <span key={i} className="orb" style={{ left: o.l, top: o.t, width: o.s, height: o.s, background: o.c, animationDelay: `${o.d}s` }} />
      ))}
      {DUST.map((d, i) => (
        <span key={i} className="dust" style={{ left: d.l, width: d.s, height: d.s, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
      ))}

      <div className="nav">
        <div className="logo"><i></i>Jurnal Prakerin</div>
        <div className="navr">
          <a data-go="login" onClick={() => go('login')}>Login</a>
          <button className="pill" data-go="daftar" onClick={() => go('daftar')}>Sign in</button>
        </div>
      </div>

      <div className="hero">
        <h1>
          {BARIS_1.map((w, i) => kata(w, i))}
          <br />
          {BARIS_2.map((w, i) => kata(w, i + BARIS_1.length, i === BARIS_2.length - 1 ? 'hl' : ''))}
        </h1>
        <p>Absen dulu, lalu tulis kegiatan hari ini. Kalau rajin dicatat, laporan akhir jadi lebih gampang.</p>
        <div className="row">
          <button className="pill" data-go="login" onClick={() => go('login')}>Login</button>
          <button className="pill line" data-go="daftar" onClick={() => go('daftar')}>Sign in</button>
        </div>
      </div>
    </section>
  );
}
