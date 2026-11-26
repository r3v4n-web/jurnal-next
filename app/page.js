'use client';
import { useEffect, useState } from 'react';
import Landing from '@/components/Landing';
import Auth from '@/components/Auth';
import AppShell from '@/components/AppShell';
import { supabase, supabaseReady } from '@/lib/supabase';

export default function Home() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('landing'); // landing | login | daftar
  const [leaving, setLeaving] = useState(false);

  // Pindah halaman dengan animasi keluar dulu, baru tampilkan halaman berikutnya.
  function go(next) {
    if (leaving || next === view) return;
    setLeaving(true);
    setTimeout(() => { setView(next); setLeaving(false); }, 420);
  }

  // Efek riak saat tombol ditekan.
  useEffect(() => {
    const onDown = (e) => {
      const b = e.target.closest && e.target.closest('.btn, .pill');
      if (!b || b.disabled) return;
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2;
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 650);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // Pulihkan sesi login dan ikuti perubahannya (login, logout, token diperbarui).
  useEffect(() => {
    if (!supabaseReady) { setReady(true); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setReady(true); }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (alive) setSession(s);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  if (!ready) return null;

  if (!supabaseReady) {
    return (
      <div className="setup">
        <h2>Supabase belum diatur</h2>
        <p>Isi <b>NEXT_PUBLIC_SUPABASE_URL</b> dan <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> di file <b>.env.local</b>, lalu jalankan ulang <b>npm run dev</b>.</p>
      </div>
    );
  }

  if (session) {
    return (
      <AppShell
        key={session.user.id}
        user={session.user}
        onLogout={async () => { await supabase.auth.signOut(); setView('landing'); setLeaving(false); }}
      />
    );
  }
  if (view === 'landing') return <Landing go={go} leaving={leaving} />;
  return <Auth key={view} mode={view} go={go} leaving={leaving} />;
}
