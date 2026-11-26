"use client";
import { useState } from "react";
import EntryDialog from "./EntryDialog";
import Modal from "./Modal";
import { load, save, todayStr, mins, fmtDate, FULL_STORAGE_MSG } from "@/lib/storage";

const short = { weekday: "short", day: "numeric", month: "short", year: "numeric" };

export default function JurnalPage({ user }) {
  const key = "pj_entries_" + user;
  const [list, setList] = useState(() => load(key, []));
  const [editing, setEditing] = useState(null);
  const [askDel, setAskDel] = useState(null);
  const [big, setBig] = useState(null);

  const rows = [...list].sort((a, b) => (a.date + a.in).localeCompare(b.date + b.in));
  const total = rows.reduce((s, e) => s + mins(e.in, e.out), 0);
  const days = new Set(rows.map((e) => e.date)).size;
  const hours = (Math.round(total / 6) / 10).toString().replace(".", ",");

  function persist(next) {
    setList(next);
    if (!save(key, next)) alert(FULL_STORAGE_MSG);
  }

  function openNew() {
    // Jam masuk/pulang diisi otomatis dari absen hari ini bila ada
    const t = load("pj_abs_" + user, []).find((a) => a.date === todayStr());
    setEditing({ date: todayStr(), in: t?.in || "08:00", out: t?.out || "16:00", act: "", photo: null });
  }

  function onSave(f) {
    if (f.id) persist(list.map((x) => (x.id === f.id ? f : x)));
    else persist([...list, { ...f, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }]);
    setEditing(null);
  }

  return (
    <section>
      <div className="stats">
        <div><b>{days}</b><small>hari tercatat</small></div>
        <div><b>{hours}</b><small>jam kerja</small></div>
      </div>
      <div className="bar">
        <h2>Kegiatan prakerin</h2>
        <button className="btn primary" onClick={openNew}>Tambah kegiatan</button>
      </div>

      <div className="tablewrap">
        <table className="jt">
          <thead>
            <tr><th>No</th><th>Tanggal</th><th>Jam masuk</th><th>Jam pulang</th><th>Durasi</th><th>Kegiatan</th><th>Foto</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td className="empty" colSpan={8}>Belum ada kegiatan. Tekan “Tambah kegiatan” untuk mencatat hari pertamamu.</td></tr>
            )}
            {rows.map((e, i) => {
              const d = mins(e.in, e.out);
              return (
                <tr key={e.id}>
                  <td>{i + 1}</td>
                  <td>{fmtDate(e.date, short)}</td>
                  <td>{e.in}</td>
                  <td>{e.out}</td>
                  <td>{Math.floor(d / 60)} j {d % 60} m</td>
                  <td>{e.act}</td>
                  <td>{e.photo ? <img className="ph" src={e.photo} alt="Foto kegiatan" onClick={() => setBig(e.photo)} /> : "-"}</td>
                  <td>
                    <div className="acts">
                      {askDel === e.id ? (
                        <>
                          <span className="ask">Yakin?</span>
                          <button className="btn sm danger" onClick={() => { persist(list.filter((x) => x.id !== e.id)); setAskDel(null); }}>Ya</button>
                          <button className="btn sm" onClick={() => setAskDel(null)}>Tidak</button>
                        </>
                      ) : (
                        <>
                          <button className="btn sm" onClick={() => setEditing(e)}>Edit</button>
                          <button className="btn sm danger" onClick={() => setAskDel(e.id)}>Hapus</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && <EntryDialog initial={editing} onSave={onSave} onClose={() => setEditing(null)} />}
      {big && (
        <Modal onClose={() => setBig(null)}>
          <img className="bigImg" src={big} alt="Foto diperbesar" />
          <div className="foot"><button className="btn" onClick={() => setBig(null)}>Tutup</button></div>
        </Modal>
      )}
    </section>
  );
}
