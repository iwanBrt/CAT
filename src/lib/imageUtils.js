/**
 * Utility untuk kompresi, optimasi, dan parsing gambar soal ujian CAT
 */

/**
 * Mengompres dan mengubah ukuran file gambar di browser (Canvas API)
 * Menghasilkan Data URL (WebP/JPEG) yang ringan dan tajam (<60KB untuk figural/diagram)
 * @param {File|Blob} file 
 * @param {Object} options { maxWidth, maxHeight, quality }
 * @returns {Promise<string>} Data URL base64
 */
export function compressImageFile(file, options = {}) {
  const { maxWidth = 800, maxHeight = 800, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("File tidak ditemukan"));

    // Jika file adalah SVG, baca langsung sebagai Data URL agar ketajaman vektor tetap 100%
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // Background putih untuk transparansi PNG/WebP agar tidak hitam jika di-convert
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Prioritaskan WebP, fallback ke JPEG
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            return resolve(webpData);
          }
        } catch {}

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Gagal membaca file gambar"));
      img.src = event.target.result;
    };
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Cek apakah string merupakan URL gambar atau Data URL gambar
 */
export function isDirectImageUrl(str) {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  if (s.startsWith("data:image/")) return true;
  if (/^https?:\/\/.*\.(png|jpg|jpeg|webp|svg|gif)(\?.*)?$/i.test(s)) return true;
  return false;
}

/**
 * Cek apakah string mengandung elemen HTML gambar <img>
 */
export function containsImageHtml(str) {
  if (!str || typeof str !== "string") return false;
  return /<img[^>]+src=[^>]+>/i.test(str);
}

/**
 * Ekstrak URL gambar pertama dari teks HTML
 */
export function extractFirstImageUrl(str) {
  if (!str || typeof str !== "string") return null;
  if (isDirectImageUrl(str)) return str.trim();
  const match = str.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Ekstrak teks bersih tanpa tag HTML dan tanpa data gambar
 */
export function extractCleanText(str) {
  if (str === null || str === undefined) return "";
  const s = typeof str === "string" ? str : String(str);
  if (isDirectImageUrl(s)) return "";
  return s.replace(/<[^>]*>?/gm, "").trim();
}
