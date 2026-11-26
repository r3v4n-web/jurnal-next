"use client";
import { useRef, useState } from "react";
import Modal from "./Modal";
import useCamera from "@/hooks/useCamera";
import { fileToDataUrl } from "@/lib/storage";

// Ambil foto kegiatan dengan kamera langsung. onUse(dataUrl) dipanggil saat "Pakai foto".
export default function CameraDialog({ onUse, onClose }) {
  const cam = useCamera(true);
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");

  function shot() {
    if (cam.status !== "live") return fileRef.current?.click(); // cadangan: kamera perangkat
    const p = cam.capture(480);
    if (p) setPhoto(p);
    else setMsg("Kamera belum siap, coba lagi sebentar.");
  }

  async function onFile(e) {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    try {
      setPhoto(await fileToDataUrl(f, 480, 0.65));
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h2>Foto kegiatan</h2>
      <p className="msg">
        {msg || (photo ? "Pakai foto ini atau ulangi." : cam.status === "live" ? "Arahkan kamera ke kegiatanmu, lalu ambil foto." : cam.status === "loading" ? "Membuka kamera…" : cam.error + " Tekan “Ambil foto” untuk memakai kamera perangkat.")}
      </p>
      <div className={"camBox" + (cam.status === "live" || photo ? "" : " hidden")}>
        <video ref={cam.videoRef} className={photo ? "hidden" : ""} autoPlay playsInline muted />
        {photo && <img src={photo} alt="Hasil foto" />}
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <div className="foot">
        <button className="btn" type="button" onClick={onClose}>Batal</button>
        {photo ? (
          <>
            <button className="btn" type="button" onClick={() => { setPhoto(null); setMsg(""); }}>Ulangi</button>
            <button className="btn primary" type="button" onClick={() => onUse(photo)}>Pakai foto</button>
          </>
        ) : (
          <button className="btn primary" type="button" onClick={shot}>Ambil foto</button>
        )}
      </div>
    </Modal>
  );
}
