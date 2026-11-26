"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toDataUrl } from "@/lib/storage";

// Kamera langsung (getUserMedia). Pasang videoRef ke <video autoPlay playsInline muted />
export default function useCamera(autoStart = true) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const tokRef = useRef(0);
  const [status, setStatus] = useState("idle"); // idle | loading | live | error
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    tokRef.current++;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const tok = tokRef.current;
    setStatus("loading");
    setError("");
    try {
      let st;
      try {
        st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      } catch (e1) {
        if (e1?.name === "NotAllowedError") throw e1;
        st = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (tok !== tokRef.current) {
        st.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = st;
      if (videoRef.current) {
        videoRef.current.srcObject = st;
        videoRef.current.play().catch(() => {});
      }
      setStatus("live");
    } catch (e) {
      if (tok !== tokRef.current) return;
      const n = e?.name;
      setError(
        n === "NotAllowedError"
          ? "Izin kamera ditolak atau diblokir. Izinkan kamera lewat ikon gembok di address bar, lalu coba lagi."
          : n === "NotFoundError"
          ? "Kamera tidak ditemukan di perangkat ini."
          : "Kamera tidak bisa dibuka. Pastikan halaman dibuka lewat HTTPS atau localhost."
      );
      setStatus("error");
    }
  }, [stop]);

  // Ambil foto dari video yang sedang tampil. Mengembalikan null bila belum siap.
  const capture = useCallback((maxW = 360) => {
    const v = videoRef.current;
    if (!streamRef.current || !v || !v.videoWidth) return null;
    return toDataUrl(v, v.videoWidth, v.videoHeight, maxW);
  }, []);

  useEffect(() => {
    if (autoStart) start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, status, error, start, stop, capture };
}
