"use client";
import { useState } from "react";
import AbsenPage from "./AbsenPage";
import JurnalPage from "./JurnalPage";
import { load } from "@/lib/storage";

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("absen");
  const [nama] = useState(() => load("pj_users", {})[user]?.nama || user);

  return (
    <>
      <header className="top">
        <div>
          <strong>Jurnal Prakerin</strong>
          <span>{nama}</span>
        </div>
        <button className="btn sm" onClick={onLogout}>Keluar</button>
      </header>
      <main>
        <nav className="nav">
          <button aria-selected={tab === "absen"} onClick={() => setTab("absen")}>Absen masuk / pulang</button>
          <button aria-selected={tab === "jurnal"} onClick={() => setTab("jurnal")}>Isi jurnal</button>
        </nav>
        {/* Hanya satu halaman yang dipasang, jadi kamera otomatis mati saat pindah tab */}
        {tab === "absen" ? <AbsenPage user={user} /> : <JurnalPage user={user} />}
      </main>
    </>
  );
}
