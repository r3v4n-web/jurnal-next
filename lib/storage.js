// Penyimpanan di localStorage, dengan cadangan di memori kalau localStorage tidak tersedia.
const mem = {};

export function get(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return key in mem ? mem[key] : fallback;
  }
}

export function set(key, value) {
  mem[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function del(key) {
  delete mem[key];
  try { localStorage.removeItem(key); } catch {}
}
