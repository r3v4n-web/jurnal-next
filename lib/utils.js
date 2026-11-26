export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Tanggal hari ini menurut WIB, sama dengan yang dipakai fungsi absen di database.
export const todayWIB = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
export const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const L = (s, o) => new Date(s + 'T00:00').toLocaleDateString('id-ID', o);
export const fmt = (s) => L(s, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const ftab = (s) => L(s, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const initials = (n) =>
  n.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Perkecil gambar supaya muat di penyimpanan browser.
export function shrink(file, max, quality) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const im = new Image();
      im.onerror = reject;
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = im.width * k;
        c.height = im.height * k;
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
