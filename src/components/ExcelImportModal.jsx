"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import { KATEGORI_URUT } from "@/lib/constants";

export default function ExcelImportModal({ onClose, onImportSuccess }) {
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Function to download Excel Template
  function downloadTemplate() {
    const templateRows = [
      {
        "Kategori (TWK/TIU/TKP)": "TWK",
        "Pertanyaan / Soal": "Pancasila sebagai dasar negara Indonesia secara yuridis formal tercantum dalam...",
        "Opsi A": "Pembukaan UUD 1945 alinea ke-4",
        "Opsi B": "Batang Tubuh UUD 1945",
        "Opsi C": "Dekrit Presiden 5 Juli 1959",
        "Opsi D": "Piagam Jakarta",
        "Opsi E": "Ketetapan MPRS No. XX/MPRS/1966",
        "Kunci Jawaban (A/B/C/D/E)": "A",
        "Bobot TKP (Kosongkan jika TWK/TIU)": "",
        "Pembahasan": "Pancasila secara yuridis formal tercantum dalam alinea ke-4 Pembukaan UUD 1945."
      },
      {
        "Kategori (TWK/TIU/TKP)": "TIU",
        "Pertanyaan / Soal": "Jika 3x + 5 = 20, berapakah nilai dari 6x - 2?",
        "Opsi A": "26",
        "Opsi B": "28",
        "Opsi C": "30",
        "Opsi D": "32",
        "Opsi E": "34",
        "Kunci Jawaban (A/B/C/D/E)": "B",
        "Bobot TKP (Kosongkan jika TWK/TIU)": "",
        "Pembahasan": "3x = 15 => x = 5. Nilai 6x - 2 = 6(5) - 2 = 28."
      },
      {
        "Kategori (TWK/TIU/TKP)": "TKP",
        "Pertanyaan / Soal": "Ketika rekan kerja Anda mengalami kesulitan menyelesaikan tugas yang mendesak, sikap Anda adalah...",
        "Opsi A": "Membantunya setelah menyelesaikan tugas utama saya dengan baik",
        "Opsi B": "Membantunya langsung tanpa memikirkan tugas sendiri",
        "Opsi C": "Menyemangatinya agar bekerja lebih cepat",
        "Opsi D": "Melaporkan kepada atasan agar mendapat bantuan tim",
        "Opsi E": "Membiarkannya karena itu tanggung jawab pribadinya",
        "Kunci Jawaban (A/B/C/D/E)": "",
        "Bobot TKP (Kosongkan jika TWK/TIU)": "5, 3, 4, 2, 1",
        "Pembahasan": "Opsi A menunjukkan profesionalisme dan kerja sama tim yang bijak (skor 5)."
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    // Auto-fit column widths
    worksheet["!cols"] = [
      { wch: 22 }, // Kategori
      { wch: 50 }, // Pertanyaan
      { wch: 25 }, // A
      { wch: 25 }, // B
      { wch: 25 }, // C
      { wch: 25 }, // D
      { wch: 25 }, // E
      { wch: 25 }, // Kunci
      { wch: 32 }, // Bobot TKP
      { wch: 40 }, // Pembahasan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Format_Soal_CAT");
    XLSX.writeFile(workbook, "Template_Soal_CAT_BKN.xlsx");
  }

  // Handle file selection and parsing
  function processFile(selectedFile) {
    if (!selectedFile) return;
    setErrorMsg("");
    setFile(selectedFile);
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!jsonRows || jsonRows.length === 0) {
          setErrorMsg("File Excel kosong atau format tidak sesuai.");
          setParsing(false);
          return;
        }

        const formatted = [];
        for (let i = 0; i < jsonRows.length; i++) {
          const row = jsonRows[i];

          // Normalize keys (case insensitive / trimmed)
          const keys = Object.keys(row);
          const getVal = (pattern) => {
            const foundKey = keys.find(k => k.toLowerCase().includes(pattern.toLowerCase()));
            return foundKey ? String(row[foundKey]).trim() : "";
          };

          const kategoriRaw = getVal("kategori").toUpperCase();
          const kategori = ["TWK", "TIU", "TKP"].includes(kategoriRaw) ? kategoriRaw : "TWK";
          const teks = getVal("soal") || getVal("pertanyaan") || getVal("teks");
          
          const opsiA = getVal("opsi a") || getVal("pilihan a") || getVal("a");
          const opsiB = getVal("opsi b") || getVal("pilihan b") || getVal("b");
          const opsiC = getVal("opsi c") || getVal("pilihan c") || getVal("c");
          const opsiD = getVal("opsi d") || getVal("pilihan d") || getVal("d");
          const opsiE = getVal("opsi e") || getVal("pilihan e") || getVal("e");

          const opsiList = [opsiA, opsiB, opsiC, opsiD, opsiE].filter(o => o !== "");

          // Kunci Jawaban
          const kunciRaw = getVal("kunci").toUpperCase();
          let kunciIndex = 0;
          if (["A", "B", "C", "D", "E"].includes(kunciRaw)) {
            kunciIndex = kunciRaw.charCodeAt(0) - 65;
          } else if (!isNaN(parseInt(kunciRaw, 10))) {
            kunciIndex = Math.max(0, Math.min(opsiList.length - 1, parseInt(kunciRaw, 10)));
          }

          // Bobot TKP
          const bobotRaw = getVal("bobot");
          let bobotArray = [5, 4, 3, 2, 1];
          if (bobotRaw) {
            const parsed = bobotRaw.split(/[,;\s]+/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
            if (parsed.length >= opsiList.length) {
              bobotArray = parsed.slice(0, opsiList.length);
            }
          }

          const pembahasan = getVal("pembahasan") || getVal("penjelasan") || "";

          const isValid = teks.length > 0 && opsiList.length >= 2;

          formatted.push({
            rowNumber: i + 2,
            kategori,
            teks,
            opsi: opsiList,
            kunci: kategori === "TKP" ? null : kunciIndex,
            bobot: kategori === "TKP" ? bobotArray.slice(0, opsiList.length) : null,
            pembahasan,
            isValid,
            error: !isValid ? "Pertanyaan atau opsi tidak lengkap" : null,
          });
        }

        setParsedData(formatted);
      } catch (err) {
        console.error(err);
        setErrorMsg("Gagal membaca file Excel: " + (err.message || "Pastikan format file valid (.xlsx, .xls, atau .csv)"));
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }

  // Handle Drag & Drop
  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  // Submit to Supabase
  async function handleImportToDatabase() {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("Tidak ada soal yang valid untuk diimpor.");
      return;
    }

    setSaving(true);
    try {
      const payload = validRows.map(r => ({
        kategori: r.kategori,
        teks: r.teks,
        opsi: r.opsi,
        kunci: r.kunci,
        bobot: r.bobot,
        aktif: true,
      }));

      const { data, error } = await supabase.from("soal").insert(payload).select("id");
      if (error) throw error;

      onImportSuccess?.(validRows.length);
    } catch (err) {
      alert("Gagal mengimpor ke database: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="modal-bg">
      <div className="modal" style={{ maxWidth: 840, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div className="flex-between" style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 2px", color: "var(--c-dark-900)" }}>
              Impor Soal dari File Excel (.xlsx / .xls / .csv)
            </h2>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Unggah file spreadsheet untuk menambahkan puluhan butir soal secara instan.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={downloadTemplate}
            style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Unduh Template Excel</span>
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
          {/* Drag & Drop Zone */}
          {!parsedData.length && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: dragActive ? "2px dashed var(--c-forest-600)" : "2px dashed var(--border-strong)",
                background: dragActive ? "var(--c-mint-100)" : "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "36px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: "none" }}
                onChange={(e) => processFile(e.target.files?.[0])}
              />
              <div style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "var(--c-mint-100)",
                color: "var(--c-forest-600)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-dark-900)", marginBottom: 4 }}>
                Pilih atau Tarik Berkas Excel ke Sini
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                Mendukung format <b>.XLSX</b>, <b>.XLS</b>, atau <b>.CSV</b>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="alert-error" style={{ marginTop: 12 }}>
              {errorMsg}
            </div>
          )}

          {parsing && (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div className="spinner" style={{ width: 26, height: 26, margin: "0 auto 10px" }} />
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Menganalisis berkas Excel...</div>
            </div>
          )}

          {/* Preview Table if Data Parsed */}
          {parsedData.length > 0 && (
            <div>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="pill pill-good" style={{ fontWeight: 700 }}>✓ {validCount} Soal Siap Impor</span>
                  {invalidCount > 0 && (
                    <span className="pill pill-bad" style={{ fontWeight: 700 }}>✕ {invalidCount} Soal Bermasalah</span>
                  )}
                  <span className="muted" style={{ fontSize: 12.5 }}>File: <b>{file?.name}</b></span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setParsedData([]); setFile(null); }}
                >
                  Ganti File
                </button>
              </div>

              <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead style={{ position: "sticky", top: 0, background: "var(--c-neutral-100)", borderBottom: "1px solid var(--border)" }}>
                    <tr>
                      <th style={{ width: 45, textAlign: "center" }}>Baris</th>
                      <th style={{ width: 70 }}>Kategori</th>
                      <th>Pertanyaan & Opsi</th>
                      <th style={{ width: 90 }}>Kunci/Bobot</th>
                      <th style={{ width: 70 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, idx) => (
                      <tr key={idx} style={{ background: item.isValid ? "transparent" : "var(--bad-bg)" }}>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--text-dim)" }}>{item.rowNumber}</td>
                        <td>
                          <span className={`pill ${item.kategori === "TWK" ? "pill-primary" : item.kategori === "TIU" ? "pill-good" : "pill-warn"}`}>
                            {item.kategori}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.teks}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11.5, color: "var(--text-dim)" }}>
                            {item.opsi.map((op, oIdx) => (
                              <span key={oIdx} style={{ background: "var(--c-neutral-100)", padding: "2px 6px", borderRadius: 4 }}>
                                <b>{String.fromCharCode(65 + oIdx)}:</b> {op.slice(0, 25)}{op.length > 25 ? "…" : ""}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {item.kategori === "TKP" ? (
                            <span style={{ fontSize: 11.5, fontFamily: "monospace" }}>[{item.bobot?.join(",")}]</span>
                          ) : (
                            <span style={{ fontWeight: 800, color: "var(--c-forest-700)" }}>
                              Opsi {String.fromCharCode(65 + (item.kunci || 0))}
                            </span>
                          )}
                        </td>
                        <td>
                          {item.isValid ? (
                            <span style={{ color: "var(--good)", fontWeight: 700, fontSize: 12 }}>✓ Valid</span>
                          ) : (
                            <span style={{ color: "var(--bad)", fontWeight: 700, fontSize: 11 }}>{item.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-between" style={{ paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleImportToDatabase}
            disabled={saving || validCount === 0}
            style={{ fontWeight: 800 }}
          >
            {saving ? "Mengimpor Data..." : `Impor ${validCount} Soal ke Database`}
          </button>
        </div>
      </div>
    </div>
  );
}
