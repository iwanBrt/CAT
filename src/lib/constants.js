export const KATEGORI_URUT = ["TWK", "TIU", "TKP"];

export const KATEGORI_LABEL = {
  TWK: "Tes Wawasan Kebangsaan",
  TIU: "Tes Inteligensia Umum",
  TKP: "Tes Karakteristik Pribadi",
};

export const TOTAL_DURASI_MENIT = 100;
export const TOTAL_SOAL = 110;

export const MAX_SKOR = {
  TWK: 150,
  TIU: 175,
  TKP: 225,
  TOTAL: 550,
};

export const DEFAULT_CONFIG = {
  namaUjian: "Simulasi SKD CPNS/PPPK (Standar BKN)",
  durasiTotalMenit: 100,
  kategori: {
    TWK: { jumlahSoal: 30, passingGrade: 65, skorBenar: 5, rentangNomor: [1, 30] },
    TIU: { jumlahSoal: 35, passingGrade: 80, skorBenar: 5, rentangNomor: [31, 65] },
    TKP: { jumlahSoal: 45, passingGrade: 166, skorBenar: 0, rentangNomor: [66, 110] },
  },
};
