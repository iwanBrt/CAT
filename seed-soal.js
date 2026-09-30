// Script untuk seed bank soal demo ke Supabase
// Jalankan: node seed-soal.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://xrukzkjfmzhmvbnggwkq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydWt6a2pmbXpobXZibmdnd2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODgwNzEsImV4cCI6MjEwNTc2NDA3MX0.WU2pwgE1BWxsv6iiL0_lH1Z5BdCYbs5q-26HTmUDZmU"
);

// ── TWK: 30 soal ────────────────────────────────────────────────────────────
const soalTWK = [
  { teks: "Pancasila sebagai dasar negara Indonesia pertama kali dirumuskan pada tanggal...", opsi: ["1 Juni 1945", "22 Juni 1945", "17 Agustus 1945", "18 Agustus 1945", "29 Mei 1945"], kunci: 0 },
  { teks: "Sila pertama Pancasila adalah...", opsi: ["Kemanusiaan yang adil dan beradab", "Persatuan Indonesia", "Ketuhanan Yang Maha Esa", "Kerakyatan yang dipimpin oleh hikmat kebijaksanaan", "Keadilan sosial bagi seluruh rakyat Indonesia"], kunci: 2 },
  { teks: "UUD 1945 pertama kali disahkan oleh...", opsi: ["MPR", "DPR", "PPKI", "BPUPKI", "Presiden Soekarno"], kunci: 2 },
  { teks: "Bhinneka Tunggal Ika berasal dari bahasa...", opsi: ["Sansekerta", "Jawa Kuno", "Kawi", "Melayu", "Bali"], kunci: 2 },
  { teks: "Semboyan negara Indonesia 'Bhinneka Tunggal Ika' artinya...", opsi: ["Bersatu kita teguh", "Berbeda-beda tetapi tetap satu", "Dari sabang sampai merauke", "Indonesia tanah air beta", "Merdeka atau mati"], kunci: 1 },
  { teks: "Hak asasi manusia di Indonesia dijamin dalam UUD 1945 pasal...", opsi: ["Pasal 27", "Pasal 28", "Pasal 29", "Pasal 30", "Pasal 31"], kunci: 1 },
  { teks: "Lagu kebangsaan Indonesia adalah...", opsi: ["Garuda Pancasila", "Indonesia Pusaka", "Indonesia Raya", "Bagimu Negeri", "Maju Tak Gentar"], kunci: 2 },
  { teks: "Presiden Indonesia yang pertama adalah...", opsi: ["Mohammad Hatta", "Soekarno", "Soeharto", "Habibie", "Megawati"], kunci: 1 },
  { teks: "Ibu kota negara Indonesia saat ini (2024) adalah...", opsi: ["Jakarta", "Nusantara", "Surabaya", "Bandung", "Yogyakarta"], kunci: 0 },
  { teks: "Proklamasi kemerdekaan Indonesia dibacakan pada tanggal...", opsi: ["1 Juni 1945", "16 Agustus 1945", "17 Agustus 1945", "18 Agustus 1945", "20 Agustus 1945"], kunci: 2 },
  { teks: "Lembaga legislatif di Indonesia terdiri dari...", opsi: ["MPR dan DPR", "DPR dan DPD", "MPR, DPR, dan DPD", "DPR, DPRD, dan BPK", "MPR dan Presiden"], kunci: 2 },
  { teks: "Warna bendera negara Indonesia adalah...", opsi: ["Merah, putih, biru", "Merah dan putih", "Hijau dan putih", "Merah, kuning, hijau", "Biru dan putih"], kunci: 1 },
  { teks: "Sistem pemerintahan Indonesia adalah...", opsi: ["Presidensial", "Parlementer", "Federal", "Monarki", "Oligarki"], kunci: 0 },
  { teks: "Badan Pemeriksa Keuangan (BPK) bertugas untuk...", opsi: ["Membuat undang-undang", "Mengadili perkara keuangan negara", "Memeriksa pengelolaan keuangan negara", "Mengelola APBN", "Mengawasi bank"], kunci: 2 },
  { teks: "Pemilihan umum di Indonesia dilaksanakan setiap...", opsi: ["3 tahun", "4 tahun", "5 tahun", "6 tahun", "7 tahun"], kunci: 2 },
  { teks: "Mahkamah Konstitusi (MK) berwenang untuk...", opsi: ["Mengadili koruptor", "Menguji undang-undang terhadap UUD", "Membuat undang-undang", "Mengadili presiden", "Membubarkan partai politik saja"], kunci: 1 },
  { teks: "Pancasila sebagai ideologi terbuka artinya...", opsi: ["Tidak dapat diubah", "Bersifat kaku dan tertutup", "Dapat menyesuaikan diri dengan perkembangan zaman tanpa mengubah nilai dasarnya", "Bebas diinterpretasi siapapun", "Hanya berlaku untuk PNS"], kunci: 2 },
  { teks: "NKRI adalah singkatan dari...", opsi: ["Negara Kesatuan Republik Indonesia", "Negara Kebangsaan Rakyat Indonesia", "Negara Kerakyatan Republik Indonesia", "Negara Keamanan Republik Indonesia", "Nasional Kesatuan Republik Indonesia"], kunci: 0 },
  { teks: "Sidang PPKI tanggal 18 Agustus 1945 menghasilkan...", opsi: ["Proklamasi kemerdekaan", "Pengesahan UUD 1945 dan penetapan Presiden", "Pembentukan TNI", "Penyusunan Pancasila", "Pembentukan kabinet pertama"], kunci: 1 },
  { teks: "Pasal 33 UUD 1945 mengatur tentang...", opsi: ["Hak asasi manusia", "Perekonomian nasional dan kesejahteraan sosial", "Pertahanan negara", "Pendidikan nasional", "Agama"], kunci: 1 },
  { teks: "Badan intelijen negara Indonesia disebut...", opsi: ["Polri", "TNI", "BIN", "BAIS", "Densus 88"], kunci: 2 },
  { teks: "Sumpah Pemuda diikrarkan pada tanggal...", opsi: ["17 Agustus 1928", "28 Oktober 1928", "20 Mei 1908", "1 Juni 1945", "28 Oktober 1945"], kunci: 1 },
  { teks: "Pancasila sebagai sumber dari segala sumber hukum di Indonesia artinya...", opsi: ["Pancasila adalah kitab hukum", "Semua peraturan tidak boleh bertentangan dengan Pancasila", "Pancasila menggantikan UUD 1945", "Hukum hanya berdasar Pancasila", "Hakim wajib hafal Pancasila"], kunci: 1 },
  { teks: "Otonomi daerah di Indonesia diatur dalam UU nomor...", opsi: ["UU No. 22 Tahun 2004", "UU No. 23 Tahun 2014", "UU No. 32 Tahun 2004", "UU No. 12 Tahun 2011", "UU No. 25 Tahun 1999"], kunci: 1 },
  { teks: "Kewajiban bela negara diatur dalam UUD 1945 pasal...", opsi: ["Pasal 27 ayat 1", "Pasal 27 ayat 3", "Pasal 30 ayat 1", "Pasal 28A", "Pasal 31"], kunci: 2 },
  { teks: "Ideologi Pancasila berbeda dengan liberalisme karena...", opsi: ["Pancasila lebih mengutamakan HAM", "Pancasila menyeimbangkan kepentingan individu dan masyarakat", "Pancasila menolak demokrasi", "Pancasila pro-kapitalisme", "Tidak ada perbedaan"], kunci: 1 },
  { teks: "Simbol negara Indonesia berupa lambang...", opsi: ["Singa emas", "Garuda Pancasila", "Pohon beringin", "Banteng", "Padi dan kapas"], kunci: 1 },
  { teks: "ASN (Aparatur Sipil Negara) wajib mengutamakan...", opsi: ["Kepentingan pribadi", "Kepentingan partai", "Kepentingan bangsa dan negara", "Kepentingan atasan", "Kepentingan daerah"], kunci: 2 },
  { teks: "Nilai-nilai yang terkandung dalam sila ke-4 Pancasila adalah...", opsi: ["Ketuhanan dan keimanan", "Musyawarah mufakat dan demokrasi", "Persatuan dan kesatuan", "Keadilan dan pemerataan", "Kemanusiaan dan toleransi"], kunci: 1 },
  { teks: "Konstitusi pertama Indonesia yang berlaku setelah kemerdekaan adalah...", opsi: ["Konstitusi RIS 1949", "UUDS 1950", "UUD 1945", "Piagam Jakarta", "Konstitusi Belanda"], kunci: 2 },
];

// ── TIU: 35 soal ────────────────────────────────────────────────────────────
const soalTIU = [
  { teks: "Jika 2x + 5 = 13, maka nilai x adalah...", opsi: ["3", "4", "5", "6", "7"], kunci: 1 },
  { teks: "Sinonim kata 'EFISIEN' adalah...", opsi: ["Boros", "Hemat", "Mahal", "Cepat", "Lambat"], kunci: 1 },
  { teks: "Antonim kata 'SOMBONG' adalah...", opsi: ["Angkuh", "Congkak", "Rendah hati", "Tinggi hati", "Arogan"], kunci: 2 },
  { teks: "Deret berikut: 2, 4, 8, 16, 32, ... Bilangan selanjutnya adalah...", opsi: ["48", "56", "64", "72", "96"], kunci: 2 },
  { teks: "Jika harga barang naik 20% menjadi Rp 120.000, harga awal barang tersebut adalah...", opsi: ["Rp 80.000", "Rp 90.000", "Rp 96.000", "Rp 100.000", "Rp 110.000"], kunci: 3 },
  { teks: "Luas persegi panjang dengan panjang 12 cm dan lebar 8 cm adalah...", opsi: ["40 cm²", "80 cm²", "96 cm²", "100 cm²", "120 cm²"], kunci: 2 },
  { teks: "A lebih tua dari B, B lebih tua dari C, D lebih muda dari C. Siapakah yang paling muda?", opsi: ["A", "B", "C", "D", "Tidak dapat ditentukan"], kunci: 3 },
  { teks: "Kata yang TIDAK berhubungan dengan yang lain: Apel, Mangga, Wortel, Jeruk, Pisang", opsi: ["Apel", "Mangga", "Wortel", "Jeruk", "Pisang"], kunci: 2 },
  { teks: "Jika 3 pekerja menyelesaikan pekerjaan dalam 12 hari, berapa hari jika dikerjakan 6 pekerja?", opsi: ["4 hari", "6 hari", "8 hari", "9 hari", "10 hari"], kunci: 1 },
  { teks: "Deret: 1, 1, 2, 3, 5, 8, 13, ... Bilangan selanjutnya adalah...", opsi: ["18", "19", "20", "21", "22"], kunci: 3 },
  { teks: "Analogi: Dokter : Rumah Sakit = Guru : ...", opsi: ["Buku", "Murid", "Sekolah", "Pelajaran", "Kelas"], kunci: 2 },
  { teks: "Jika semua A adalah B, dan semua B adalah C, maka...", opsi: ["Semua C adalah A", "Semua A adalah C", "Tidak ada hubungan A dan C", "C lebih besar dari A", "A dan C sama"], kunci: 1 },
  { teks: "Rata-rata nilai 5 siswa adalah 75. Jika seorang siswa dengan nilai 90 masuk, rata-rata baru adalah...", opsi: ["77,5", "78", "79", "80", "82"], kunci: 1 },
  { teks: "Volume kubus dengan sisi 5 cm adalah...", opsi: ["25 cm³", "75 cm³", "100 cm³", "125 cm³", "150 cm³"], kunci: 3 },
  { teks: "Sinonim kata 'AMBIGU' adalah...", opsi: ["Jelas", "Tegas", "Mendua/tidak jelas", "Pasti", "Nyata"], kunci: 2 },
  { teks: "Deret: 5, 10, 20, 40, ... Bilangan selanjutnya adalah...", opsi: ["60", "70", "75", "80", "100"], kunci: 3 },
  { teks: "Sebuah toko memberikan diskon 25% untuk barang seharga Rp 200.000. Harga yang harus dibayar adalah...", opsi: ["Rp 140.000", "Rp 150.000", "Rp 160.000", "Rp 175.000", "Rp 180.000"], kunci: 1 },
  { teks: "Analogi: Panas : Api = Dingin : ...", opsi: ["Air", "Salju", "Angin", "Hujan", "Kabut"], kunci: 1 },
  { teks: "Jika x² = 49, maka nilai x yang positif adalah...", opsi: ["6", "7", "8", "9", "10"], kunci: 1 },
  { teks: "Kata yang bermakna sama dengan 'PROAKTIF' adalah...", opsi: ["Pasif", "Reaktif", "Inisiatif", "Defensif", "Responsif"], kunci: 2 },
  { teks: "Deret: 100, 95, 85, 70, 50, ... Bilangan selanjutnya adalah...", opsi: ["15", "20", "25", "30", "35"], kunci: 2 },
  { teks: "Sebuah pekerjaan dapat diselesaikan A dalam 6 hari, B dalam 12 hari. Berapa hari jika dikerjakan bersama?", opsi: ["2 hari", "3 hari", "4 hari", "5 hari", "6 hari"], kunci: 2 },
  { teks: "Antonim kata 'KONVERGEN' adalah...", opsi: ["Memusat", "Menyatu", "Divergen/menyebar", "Paralel", "Linear"], kunci: 2 },
  { teks: "Jika P > Q dan Q > R, maka P dibandingkan R adalah...", opsi: ["P < R", "P = R", "P > R", "Tidak bisa ditentukan", "P ≤ R"], kunci: 2 },
  { teks: "Keliling lingkaran dengan diameter 14 cm (π = 22/7) adalah...", opsi: ["22 cm", "44 cm", "66 cm", "88 cm", "154 cm"], kunci: 1 },
  { teks: "Budi membeli 3 buku seharga Rp 45.000. Jika membeli 7 buku, biayanya adalah...", opsi: ["Rp 95.000", "Rp 100.000", "Rp 105.000", "Rp 110.000", "Rp 115.000"], kunci: 2 },
  { teks: "Sinonim 'KONSISTEN' adalah...", opsi: ["Berubah-ubah", "Ajeg/teguh pendirian", "Ambigu", "Fleksibel", "Dinamis"], kunci: 1 },
  { teks: "Deret: 3, 6, 12, 24, 48, ... Bilangan selanjutnya adalah...", opsi: ["72", "84", "96", "120", "144"], kunci: 2 },
  { teks: "Jika 40% dari x = 80, maka x adalah...", opsi: ["160", "180", "200", "220", "240"], kunci: 2 },
  { teks: "Analogi: Buku : Perpustakaan = Uang : ...", opsi: ["Toko", "Brankas", "Bank", "Pasar", "Dompet"], kunci: 2 },
  { teks: "Manakah yang merupakan bilangan prima?", opsi: ["15", "21", "27", "29", "33"], kunci: 3 },
  { teks: "Perjalanan 120 km ditempuh dalam 2 jam. Berapa kecepatan rata-ratanya?", opsi: ["50 km/jam", "55 km/jam", "60 km/jam", "65 km/jam", "70 km/jam"], kunci: 2 },
  { teks: "Jika semua mawar adalah bunga, dan beberapa bunga berwarna merah, maka...", opsi: ["Semua mawar berwarna merah", "Beberapa mawar mungkin berwarna merah", "Tidak ada mawar merah", "Semua bunga berwarna merah", "Mawar tidak berwarna merah"], kunci: 1 },
  { teks: "Antonim kata 'EKSPLISIT' adalah...", opsi: ["Jelas", "Tegas", "Implisit/tersirat", "Nyata", "Gamblang"], kunci: 2 },
  { teks: "Luas segitiga dengan alas 10 cm dan tinggi 6 cm adalah...", opsi: ["30 cm²", "40 cm²", "50 cm²", "60 cm²", "70 cm²"], kunci: 0 },
];

// ── TKP: 45 soal ────────────────────────────────────────────────────────────
const soalTKP = [
  { teks: "Ketika rekan kerja Anda membuat kesalahan yang berdampak pada pekerjaan tim, sikap Anda adalah...", opsi: ["Menegur di depan umum agar menjadi pelajaran", "Membiarkan saja, itu bukan urusan saya", "Membicarakannya dengan atasan tanpa sepengetahuan rekan tersebut", "Mengajak bicara secara pribadi untuk mencari solusi bersama", "Melaporkan langsung ke HRD"], bobot: [1, 2, 2, 5, 3] },
  { teks: "Anda mendapat tugas yang deadline-nya sangat ketat. Apa yang Anda lakukan?", opsi: ["Menunda dan mengerjakan besok saja", "Langsung mulai dan buat prioritas kerja", "Minta rekan membantu tanpa izin atasan", "Meminta perpanjangan deadline tanpa alasan jelas", "Mengabaikan tugas lain meski urgent"], bobot: [1, 5, 2, 3, 2] },
  { teks: "Atasan Anda meminta Anda mengerjakan sesuatu yang menurut Anda tidak etis. Anda...", opsi: ["Langsung menolak keras-keras", "Melaksanakan perintah tanpa bertanya", "Mendiskusikan kekhawatiran Anda dengan sopan ke atasan", "Lapor ke atasan yang lebih tinggi tanpa bicara ke atasan langsung", "Diam dan pura-pura tidak mengerti"], bobot: [2, 1, 5, 3, 1] },
  { teks: "Saat menghadapi konflik dengan rekan kerja, Anda biasanya...", opsi: ["Menghindari dan tidak mau bertemu", "Mengadu ke atasan segera", "Menyerang balik dengan argumen keras", "Mencari titik tengah dan berkompromi dengan empati", "Mendiamkan sampai masalah berlalu sendiri"], bobot: [2, 2, 1, 5, 3] },
  { teks: "Anda mendapat kritik tajam dari atasan di depan rekan. Reaksi Anda...", opsi: ["Marah dan membantah saat itu juga", "Diam, menerima, dan belajar dari kritik tersebut", "Menangis dan merasa tidak dihargai", "Membalas kritik dengan kritik", "Segera mengundurkan diri"], bobot: [1, 5, 2, 1, 1] },
  { teks: "Ketika ada perubahan kebijakan baru yang mengubah cara kerja Anda, sikap Anda adalah...", opsi: ["Menolak dan mempertahankan cara lama", "Menerima dan beradaptasi dengan cepat", "Mengabaikan perubahan tersebut", "Protes keras ke manajemen", "Mengikuti sambil mengeluh"], bobot: [1, 5, 1, 2, 3] },
  { teks: "Anda mendapat tugas baru yang belum pernah Anda kerjakan sebelumnya. Apa yang Anda lakukan?", opsi: ["Menolak karena di luar kemampuan", "Pelajari, cari sumber, dan kerjakan dengan semangat", "Limpahkan ke orang lain", "Kerjakan asal-asalan saja", "Tunggu sampai ada yang mengajari"], bobot: [1, 5, 1, 2, 3] },
  { teks: "Bila Anda diminta bekerja lembur tanpa upah tambahan untuk kepentingan organisasi...", opsi: ["Langsung menolak", "Bersedia jika memang demi kepentingan bersama", "Minta kompensasi dulu baru kerja", "Pura-pura sakit", "Hadir tapi tidak produktif"], bobot: [2, 5, 3, 1, 1] },
  { teks: "Ketika pekerjaan Anda sangat banyak dan waktu terbatas, Anda...", opsi: ["Panik dan tidak tahu harus mulai dari mana", "Menyusun daftar prioritas dan mulai dari yang paling penting", "Mengerjakan semua sekaligus", "Minta semua ditunda", "Pulang lebih awal dan lanjut besok"], bobot: [2, 5, 2, 1, 1] },
  { teks: "Saat Anda menemukan informasi yang bisa meningkatkan kinerja tim, Anda...", opsi: ["Menyimpannya untuk keuntungan pribadi", "Langsung berbagi dengan rekan tim", "Menunggu diminta baru dibagikan", "Tidak peduli karena bukan tugas saya", "Membagikan hanya ke rekan dekat"], bobot: [1, 5, 3, 1, 2] },
  { teks: "Anda melihat rekan kerja sedang kesulitan menyelesaikan tugasnya. Anda...", opsi: ["Biarkan saja, itu tanggung jawabnya", "Menawarkan bantuan setelah pekerjaan Anda selesai", "Segera membantu tanpa diminta jika memungkinkan", "Melaporkan ke atasan bahwa rekan tersebut tidak kompeten", "Mengambil alih tugasnya tanpa izin"], bobot: [1, 3, 5, 2, 2] },
  { teks: "Dalam rapat, ide Anda ditolak oleh tim. Reaksi Anda...", opsi: ["Marah dan keluar dari rapat", "Menerima dengan lapang dada dan dengarkan pertimbangan lain", "Diam dan tidak mau bicara lagi", "Memaksakan ide sampai diterima", "Mengabaikan keputusan rapat"], bobot: [1, 5, 2, 1, 1] },
  { teks: "Ketika Anda melakukan kesalahan dalam pekerjaan, Anda...", opsi: ["Menyembunyikan kesalahan tersebut", "Menyalahkan rekan kerja", "Segera mengakui dan mencari solusi perbaikan", "Berpura-pura tidak tahu", "Pasrah dan tidak melakukan apa-apa"], bobot: [1, 1, 5, 1, 2] },
  { teks: "Saat bekerja dalam tim, peran yang paling sering Anda ambil adalah...", opsi: ["Selalu jadi pemimpin", "Mengikuti saja apa kata mayoritas", "Beradaptasi sesuai kebutuhan tim", "Bekerja sendiri tanpa koordinasi", "Mengkritik tanpa berkontribusi"], bobot: [3, 2, 5, 1, 1] },
  { teks: "Anda diberi tanggung jawab baru yang lebih besar. Perasaan Anda...", opsi: ["Takut dan menolak", "Antusias dan siap belajar hal baru", "Biasa saja, tidak ada artinya", "Khawatir berlebihan", "Bangga tapi tidak mau berusaha lebih"], bobot: [1, 5, 2, 3, 2] },
  { teks: "Ketika layanan publik yang Anda berikan dikritik warga, respon Anda...", opsi: ["Membela diri habis-habisan", "Mendengarkan, meminta maaf, dan memperbaiki", "Mengabaikan kritik", "Menyalahkan sistem", "Marah kepada warga yang mengkritik"], bobot: [2, 5, 1, 2, 1] },
  { teks: "Anda menemukan prosedur kerja yang tidak efisien. Apa yang Anda lakukan?", opsi: ["Diam saja karena bukan wewenang saya", "Langsung mengubah prosedur sendiri tanpa izin", "Membuat analisis dan menyampaikan usulan perbaikan ke atasan", "Mengeluh ke rekan tanpa tindakan nyata", "Melanggar prosedur diam-diam"], bobot: [2, 1, 5, 2, 1] },
  { teks: "Dalam situasi krisis di tempat kerja, Anda...", opsi: ["Panik dan ikut-ikutan kebingungan", "Tenang, analisis masalah, dan ambil langkah konstruktif", "Menunggu orang lain yang berinisiatif", "Lari dari situasi", "Menyalahkan orang lain atas krisis"], bobot: [1, 5, 2, 1, 1] },
  { teks: "Anda tidak setuju dengan keputusan atasan yang sudah final. Anda...", opsi: ["Mengganggu proses implementasi", "Menyampaikan keberatan sekali dengan sopan, lalu mendukung keputusan", "Menolak melaksanakan keputusan", "Menghasut rekan untuk melawan", "Diam saja walau hati tidak setuju"], bobot: [1, 5, 1, 1, 3] },
  { teks: "Ketika menghadapi masalah kompleks, pendekatan Anda adalah...", opsi: ["Menghindari masalah", "Mengurai masalah secara sistematis dan mencari solusi bertahap", "Minta orang lain saja yang urus", "Bertindak impulsif tanpa analisis", "Menyerahkan sepenuhnya ke atasan"], bobot: [1, 5, 1, 2, 2] },
  { teks: "Rekan kerja meminta Anda menutup-nutupi kecurangan kecil mereka. Anda...", opsi: ["Langsung menurut agar tidak ribut", "Menolak dan menyarankan rekan mengakui perbuatannya", "Ikut serta dalam kecurangan", "Diam dan pura-pura tidak tahu", "Melaporkan segera tanpa bicara ke rekan terlebih dahulu"], bobot: [1, 5, 1, 2, 3] },
  { teks: "Untuk meningkatkan kompetensi kerja, Anda...", opsi: ["Menunggu pelatihan dari kantor", "Aktif mencari sumber belajar dan mengembangkan diri secara mandiri", "Merasa sudah cukup dengan kemampuan saat ini", "Belajar hanya jika diwajibkan", "Mengandalkan rekan yang lebih berpengalaman sepenuhnya"], bobot: [2, 5, 1, 2, 2] },
  { teks: "Ketika target kerja tidak tercapai, refleksi Anda adalah...", opsi: ["Menyalahkan kondisi eksternal sepenuhnya", "Evaluasi diri, cari penyebab, dan buat rencana perbaikan", "Merasa gagal total dan putus asa", "Mengabaikan dan berharap ada yang memaklumi", "Menyalahkan rekan tim"], bobot: [2, 5, 1, 2, 1] },
  { teks: "Saat bekerja, Anda lebih suka...", opsi: ["Bekerja sendiri tanpa gangguan", "Berkolaborasi dengan tim sambil berkontribusi aktif", "Menunggu instruksi rinci sebelum bergerak", "Bekerja asal selesai", "Menghindar dari tanggung jawab tambahan"], bobot: [3, 5, 2, 1, 1] },
  { teks: "Jika ada perubahan aturan yang menurut Anda tidak adil, Anda...", opsi: ["Langsung melanggar aturan tersebut", "Menyampaikan pendapat melalui jalur resmi yang tersedia", "Menghasut rekan untuk menolak", "Mengikuti sambil mengeluh terus", "Diam dan tidak melakukan apa-apa"], bobot: [1, 5, 1, 2, 2] },
  { teks: "Ketika diberi kepercayaan menjaga rahasia instansi, Anda...", opsi: ["Menyimpan rahasia dengan penuh tanggung jawab", "Menceritakan ke keluarga saja karena pasti aman", "Berbagi ke rekan dekat yang bisa dipercaya", "Menyimpan kecuali ada tekanan sosial", "Tidak peduli tentang kerahasiaan"], bobot: [5, 2, 2, 3, 1] },
  { teks: "Anda mendapatkan pujian atas hasil kerja tim. Respons Anda...", opsi: ["Mengklaim semua hasil sebagai kerja keras Anda sendiri", "Berbagi pujian dan mengakui kontribusi setiap anggota tim", "Diam saja", "Menolak pujian berlebihan karena malu", "Pamer ke semua orang"], bobot: [1, 5, 2, 3, 1] },
  { teks: "Ketika Anda diminta melayani masyarakat dengan kondisi Anda sedang tidak fit...", opsi: ["Menolak bertugas hari itu", "Tetap melayani dengan sebaik mungkin sambil menjaga profesionalisme", "Datang tapi tidak melayani dengan baik", "Meminta rekan menggantikan tanpa izin atasan", "Pulang lebih awal"], bobot: [1, 5, 2, 3, 2] },
  { teks: "Anda menemukan peluang untuk membuat inovasi di tempat kerja. Anda...", opsi: ["Menunggu diminta baru bertindak", "Merumuskan ide dan mengajukannya secara proaktif", "Takut ditolak sehingga tidak mengajukan", "Membocorkan ide ke kompetitor", "Mengklaim ide orang lain sebagai milik sendiri"], bobot: [2, 5, 3, 1, 1] },
  { teks: "Cara terbaik menangani keluhan masyarakat menurut Anda adalah...", opsi: ["Mengabaikan jika dianggap tidak penting", "Mendengarkan dengan empati dan menindaklanjuti secara konkret", "Menyuruh pengadu mengurus sendiri", "Menjanjikan penyelesaian tanpa tindakan nyata", "Melimpahkan ke bagian lain tanpa koordinasi"], bobot: [1, 5, 1, 2, 2] },
  { teks: "Dalam bekerja, integritas bagi Anda berarti...", opsi: ["Berbuat jujur hanya jika ada yang mengawasi", "Konsisten bersikap jujur dan bertanggung jawab dalam setiap situasi", "Mengikuti mayoritas agar tidak menyolok", "Jujur dalam kata namun tidak dalam tindakan", "Menjaga citra di depan atasan saja"], bobot: [2, 5, 2, 1, 2] },
  { teks: "Ketika tugas harus selesai hari ini namun ada kendala teknis, Anda...", opsi: ["Menyerah dan lapor tidak bisa diselesaikan", "Mencari solusi alternatif dan tetap berupaya menyelesaikan", "Menyalahkan tim IT atas masalah teknis", "Mengerjakan asal jadi meski kualitas buruk", "Menunda hingga kendala teratasi sendiri"], bobot: [1, 5, 2, 2, 1] },
  { teks: "Motivasi utama Anda bekerja di sektor publik/pemerintahan adalah...", opsi: ["Status dan jabatan semata", "Gaji yang stabil dan tunjangan", "Berkontribusi nyata untuk masyarakat dan negara", "Tekanan keluarga", "Tidak ada pilihan pekerjaan lain"], bobot: [2, 2, 5, 1, 1] },
  { teks: "Saat diminta membuat laporan yang membutuhkan data akurat, Anda...", opsi: ["Mengisi data perkiraan agar cepat selesai", "Memastikan data valid dan laporan akurat walau butuh waktu lebih", "Menyalin laporan rekan dengan sedikit modifikasi", "Meminta rekan mengerjakan laporan Anda", "Membuat laporan asal-asalan"], bobot: [2, 5, 1, 2, 1] },
  { teks: "Ketika ada dua tugas urgent datang bersamaan, Anda...", opsi: ["Panik dan tidak mengerjakan keduanya", "Analisis dampak masing-masing dan kerjakan yang lebih kritis dulu", "Kerjakan yang lebih mudah dulu", "Lempar ke rekan tanpa pertimbangan", "Hubungi atasan dan diskusikan prioritas"], bobot: [1, 5, 2, 1, 4] },
  { teks: "Anda diminta menghadiri pelatihan wajib di luar jam kerja. Respons Anda...", opsi: ["Menolak karena di luar jam kerja", "Hadir dengan penuh semangat untuk belajar", "Hadir tapi tidak serius mengikuti", "Meminta dispensasi tanpa alasan kuat", "Menghadiri sebagian dan pulang lebih awal"], bobot: [1, 5, 2, 2, 2] },
  { teks: "Anda melihat ada kebocoran anggaran di instansi Anda. Tindakan Anda...", opsi: ["Diam karena takut konsekuensinya", "Melaporkan melalui saluran pengaduan yang tersedia", "Ikut mengambil manfaat dari kebocoran tersebut", "Membicarakan ke teman tanpa laporan resmi", "Berpura-pura tidak melihat"], bobot: [2, 5, 1, 2, 1] },
  { teks: "Ketika bekerja dalam proyek lintas departemen, Anda...", opsi: ["Hanya fokus pada bagian Anda tanpa koordinasi", "Berkomunikasi aktif dan berkoordinasi dengan semua pihak", "Menunggu instruksi dari semua departemen sebelum bergerak", "Mendominasi proses tanpa mempertimbangkan departemen lain", "Mengikuti saja tanpa kontribusi berarti"], bobot: [2, 5, 2, 2, 1] },
  { teks: "Saat lingkungan kerja terasa tidak kondusif, Anda...", opsi: ["Mengeluh dan menyebarkan energi negatif", "Fokus pada pekerjaan dan mencari cara memperbaiki lingkungan kerja", "Absen sesering mungkin", "Menyalahkan manajemen sepenuhnya", "Tidak peduli dan terus bekerja biasa saja"], bobot: [1, 5, 1, 2, 3] },
  { teks: "Anda mendapat informasi yang bertentangan dari dua atasan berbeda. Anda...", opsi: ["Ikuti salah satu secara acak", "Meminta klarifikasi dan konfirmasi dari kedua atasan sebelum bertindak", "Tidak mengerjakan sampai ada kejelasan", "Lakukan sesuai pemahaman pribadi saja", "Lapor ke HR tentang konflik instruksi"], bobot: [1, 5, 2, 3, 3] },
  { teks: "Keberhasilan tim menurut Anda bergantung pada...", opsi: ["Pemimpin yang kuat saja", "Kontribusi dan sinergi seluruh anggota tim", "Anggota yang paling cerdas", "Keberuntungan", "Sumber daya yang melimpah"], bobot: [3, 5, 3, 1, 2] },
  { teks: "Ketika diminta melakukan presentasi mendadak tanpa persiapan, Anda...", opsi: ["Menolak karena tidak siap", "Menyanggupi dan melakukan yang terbaik dengan pengetahuan yang ada", "Berdalih sakit mendadak", "Minta orang lain saja yang presentasi", "Presentasi dengan data yang dibuat-buat"], bobot: [2, 5, 1, 2, 1] },
  { teks: "Bagaimana Anda memastikan kualitas pekerjaan Anda tetap tinggi di tengah tekanan?", opsi: ["Menurunkan standar agar cepat selesai", "Tetap menjaga standar dengan manajemen waktu yang baik", "Menyerahkan ke rekan jika terlalu tertekan", "Bekerja sampai larut malam tanpa istirahat selalu", "Kualitas diabaikan yang penting selesai tepat waktu"], bobot: [1, 5, 2, 3, 1] },
  { teks: "Anda baru bergabung di kantor baru. Cara Anda beradaptasi...", opsi: ["Menunggu diajak bergaul", "Proaktif berkenalan, memahami budaya kerja, dan menunjukkan kontribusi", "Langsung mendominasi dan merasa paling tahu", "Bekerja sendiri tanpa mau kenal rekan", "Meniru semua perilaku rekan tanpa filter"], bobot: [2, 5, 1, 1, 2] },
];

async function seed() {
  console.log("🌱 Seeding bank soal demo ke Supabase...\n");

  const allSoal = [
    ...soalTWK.map(s => ({ ...s, kategori: "TWK", aktif: true, bobot: null })),
    ...soalTIU.map(s => ({ ...s, kategori: "TIU", aktif: true, bobot: null })),
    ...soalTKP.map(s => ({ ...s, kategori: "TKP", aktif: true, kunci: null })),
  ];

  // Insert in batches of 10
  let success = 0;
  let failed = 0;
  const BATCH = 10;

  for (let i = 0; i < allSoal.length; i += BATCH) {
    const batch = allSoal.slice(i, i + BATCH);
    const { error } = await supabase.from("soal").insert(batch);
    if (error) {
      console.error(`❌ Batch ${i / BATCH + 1} gagal:`, error.message);
      failed += batch.length;
    } else {
      success += batch.length;
      process.stdout.write(`✅ ${success}/${allSoal.length} soal berhasil di-insert\r`);
    }
  }

  console.log(`\n\n📊 Hasil seeding:`);
  console.log(`  ✅ Berhasil: ${success} soal`);
  console.log(`  ❌ Gagal   : ${failed} soal`);
  console.log(`\n  TWK: ${soalTWK.length} soal`);
  console.log(`  TIU: ${soalTIU.length} soal`);
  console.log(`  TKP: ${soalTKP.length} soal`);
  console.log(`\n🎉 Bank soal siap! PIN ujian default: 123456`);
  console.log(`👉 Buka http://localhost:3000/admin/ujian untuk memverifikasi`);
}

seed().catch(console.error);
