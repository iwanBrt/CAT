import { KATEGORI_URUT } from "./constants";

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

export function fmtTanggal(iso) {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  } catch {
    return "-";
  }
}

/**
 * Hitung skor akhir dari satu sesi ujian.
 * sesi: { soalIds: {TWK:[],TIU:[],TKP:[]}, bankSoal: {id:{...}}, jawaban: {id: idx | {opsiIdx, ragu}} }
 * config: { TWK: {passingGrade, skorBenar}, TIU: {...}, TKP: {...} }
 */
export function hitungSkor(sesi, config) {
  const perKategori = {};
  let skorTotal = 0;
  let lulusSemua = true;

  KATEGORI_URUT.forEach((k) => {
    const ids = sesi.soalIds?.[k] || [];
    const cfg = config?.[k] || { passingGrade: 0, skorBenar: 5 };
    let skor = 0,
      benar = 0,
      salah = 0,
      kosong = 0;

    ids.forEach((id) => {
      const soal = sesi.bankSoal?.[id];
      if (!soal) return;

      const rawJwb = sesi.jawaban?.[id];
      const jwb = typeof rawJwb === "object" && rawJwb !== null ? rawJwb.opsiIdx : rawJwb;

      if (k === "TKP") {
        if (jwb === undefined || jwb === null) {
          kosong++;
        } else {
          const nilai = soal.bobot && soal.bobot[jwb] !== undefined ? Number(soal.bobot[jwb]) : 0;
          skor += nilai;
        }
      } else {
        if (jwb === undefined || jwb === null) {
          kosong++;
        } else if (Number(jwb) === Number(soal.kunci)) {
          benar++;
          skor += (cfg.skorBenar ?? 5);
        } else {
          salah++;
        }
      }
    });

    const lulus = skor >= cfg.passingGrade;
    if (!lulus) lulusSemua = false;
    perKategori[k] = { skor, benar, salah, kosong, passingGrade: cfg.passingGrade, lulus };
    skorTotal += skor;
  });

  return { perKategori, skorTotal, lulus: lulusSemua };
}
