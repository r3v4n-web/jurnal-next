"use client";
import { useEffect, useRef } from "react";

// <dialog> modal: terbuka saat dipasang, tertutup saat dilepas. Esc memanggil onClose.
export default function Modal({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose}>
      {children}
    </dialog>
  );
}
