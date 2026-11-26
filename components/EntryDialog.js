"use client";
import { useRef, useState } from "react";
import Modal from "./Modal";
import CameraDialog from "./CameraDialog";
import { fileToDataUrl } from "@/lib/storage";

export default function EntryDialog({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState("");
  const [cam, setCam] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function submit(e) {
    e.preventDefault();
    if (!f.date || !f.in || !f.out || !f.act.trim()) {
      return setErr("Lengkapi tanggal, jam masuk, jam pulang, dan kegiatan.");
    }
    onSave({ ...f, act: f.act.trim() });
  }

  async function onFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      setF({ ...f, photo: await fileToDataUrl(file, 480, 0.65) });
    } catch (x) {
      setErr(x.message);
    }
  }

  return (
    <>
      <Modal onClose={onClose}>
        <form onSubmit={submit} noValidate>
          <h2>{f.id ? "Edit kegiatan" : "Tambah kegiatan"}</h2>
          <label htmlFor="eDate">Tanggal prakerin</label>
          <input id="eDate" type="date" value={f.date} onChange={set("date")} />
          <div className="row">
            <div><label htmlFor="eIn">Jam masuk</label><input id="eIn" type="time" value={f.in} onChange={set("in")} /></div>
            <div><label htmlFor="eOut">Jam pulang</label><input id="eOut" type="time" value={f.out} onChange={set("out")} /></div>
          </div>
          <label htmlFor="eAct">Kegiatan prakerin</label>
          <textarea id="eAct" placeholder="Contoh: Memasang kabel jaringan di ruang server" value={f.act} onChange={set("act")} />
          <label>Foto kegiatan</label>
          <div className="photoRow">
            {f.photo && <img src={f.photo} alt="Foto kegiatan" />}
            <div className="photoBtns">
              <button className="btn sm" type="button" onClick={() => setCam(true)}>Ambil foto</button>
              <button className="btn sm" type="button" onClick={() => fileRef.current?.click()}>Pilih dari galeri</button>
              {f.photo && <button className="btn sm danger" type="button" onClick={() => setF({ ...f, photo: null })}>Hapus foto</button>}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <p className="err" role="alert">{err}</p>
          <div className="foot">
            <button className="btn" type="button" onClick={onClose}>Batal</button>
            <button className="btn primary" type="submit">Simpan</button>
          </div>
        </form>
      </Modal>
      {cam && (
        <CameraDialog
          onClose={() => setCam(false)}
          onUse={(p) => { setF({ ...f, photo: p }); setCam(false); }}
        />
      )}
    </>
  );
}
