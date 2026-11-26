"use client";
import { useState } from "react";
import { load, save, hash } from "@/lib/storage";

export default function AuthForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ nama: "", user: "", pass: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const reg = mode === "reg";

  function switchMode(m) {
    setMode(m);
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();
    const u = f.user.trim().toLowerCase();
    if (!u || !f.pass) return setErr("Isi username dan kata sandi.");
    const users = load("pj_users", {});
    if (reg) {
      if (!f.nama.trim()) return setErr("Isi nama lengkap.");
      if (!/^[a-z0-9_.]{3,20}$/.test(u)) return setErr("Username 3–20 karakter: huruf, angka, titik, atau garis bawah.");
      if (f.pass.length < 6) return setErr("Kata sandi minimal 6 karakter.");
      if (users[u]) return setErr("Username sudah dipakai. Pilih yang lain.");
      users[u] = { nama: f.nama.trim(), pw: await hash(f.pass) };
      save("pj_users", users);
    } else if (!users[u] || users[u].pw !== (await hash(f.pass))) {
      return setErr("Username atau kata sandi salah.");
    }
    onLogin(u);
  }

  return (
    <div className="authWrap">
      <div className="book">
        <h1>Jurnal Prakerin</h1>
        <p className="sub">Catat kegiatan praktik kerja industri setiap hari.</p>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={!reg} onClick={() => switchMode("login")}>Masuk</button>
          <button role="tab" aria-selected={reg} onClick={() => switchMode("reg")}>Buat akun</button>
        </div>
        <form onSubmit={submit} noValidate>
          {reg && (
            <>
              <label htmlFor="nama">Nama lengkap</label>
              <input id="nama" autoComplete="name" value={f.nama} onChange={set("nama")} />
            </>
          )}
          <label htmlFor="user">Username</label>
          <input id="user" autoComplete="username" autoCapitalize="none" value={f.user} onChange={set("user")} />
          <label htmlFor="pass">Kata sandi</label>
          <input id="pass" type="password" autoComplete={reg ? "new-password" : "current-password"} value={f.pass} onChange={set("pass")} />
          <p className="err" role="alert">{err}</p>
          <button className="btn primary" type="submit">{reg ? "Buat akun" : "Masuk"}</button>
        </form>
      </div>
    </div>
  );
}
