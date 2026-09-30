"use client";

import { useState, useRef, useEffect } from "react";
import { compressImageFile } from "@/lib/imageUtils";

const MATH_SYMBOLS = [
  "±", "×", "÷", "≠", "≤", "≥", "≈", "√", "∛", "∞",
  "½", "⅓", "¼", "¾", "⅔", "°", "‰", "%", "π", "∑",
  "∫", "∆", "µ", "α", "β", "γ", "θ", "λ", "σ", "ω",
  "→", "←", "↔", "⇒", "⇔", "∈", "∉", "⊂", "⊃", "∪", "∩"
];

export default function WordToolbarEditor({
  value = "",
  onChange,
  placeholder = "Tulis teks pertanyaan atau pembahasan di sini...",
  minHeight = 140,
  label = "",
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showSymbols, setShowSymbols] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Sync value when changed externally if not focused
  useEffect(() => {
    if (editorRef.current && !isFocused) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value, isFocused]);

  function execCmd(command, valueArg = null) {
    if (typeof document !== "undefined") {
      document.execCommand(command, false, valueArg);
      if (editorRef.current) {
        onChange?.(editorRef.current.innerHTML);
      }
    }
  }

  function handleInput() {
    if (editorRef.current) {
      onChange?.(editorRef.current.innerHTML);
    }
  }

  function insertSymbol(sym) {
    if (editorRef.current) {
      editorRef.current.focus();
      execCmd("insertText", sym);
    }
    setShowSymbols(false);
  }

  function insertHtmlAtCursor(html) {
    if (editorRef.current) {
      editorRef.current.focus();
      // Use execCommand insertHTML for standard rich-text undo stack
      document.execCommand("insertHTML", false, html);
      onChange?.(editorRef.current.innerHTML);
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
      const imgHtml = `<p><img src="${dataUrl}" alt="Ilustrasi Soal" style="max-width:100%; max-height:280px; border-radius:8px; border:1px solid #cbd5e1; margin:8px 0; object-fit:contain; display:block;" /></p><p></p>`;
      insertHtmlAtCursor(imgHtml);
      setShowImageModal(false);
    } catch (err) {
      alert("Gagal memproses gambar: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleInsertFromUrl() {
    if (!imageUrlInput.trim()) return;
    const imgHtml = `<p><img src="${imageUrlInput.trim()}" alt="Ilustrasi Soal" style="max-width:100%; max-height:280px; border-radius:8px; border:1px solid #cbd5e1; margin:8px 0; object-fit:contain; display:block;" /></p><p></p>`;
    insertHtmlAtCursor(imgHtml);
    setImageUrlInput("");
    setShowImageModal(false);
  }

  // Intercept Paste for automatic image insertion (Ctrl+V screenshot/clipboard)
  async function handlePaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          try {
            const dataUrl = await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 });
            const imgHtml = `<p><img src="${dataUrl}" alt="Gambar Tempel" style="max-width:100%; max-height:280px; border-radius:8px; border:1px solid #cbd5e1; margin:8px 0; object-fit:contain; display:block;" /></p><p></p>`;
            insertHtmlAtCursor(imgHtml);
          } catch (err) {
            console.error("Gagal paste gambar:", err);
          }
        }
        return;
      }
    }
  }

  return (
    <div className="word-editor-container" style={{
      border: isFocused ? "1.5px solid var(--c-forest-600)" : "1.5px solid var(--border)",
      borderRadius: "var(--radius-md)",
      background: "var(--surface)",
      transition: "border-color 0.15s ease",
      overflow: "hidden",
    }}>
      {/* Ribbon / Toolbar Microsoft Word style */}
      <div className="word-toolbar" style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 3,
        padding: "6px 8px",
        background: "var(--c-neutral-100)",
        borderBottom: "1px solid var(--border)",
        userSelect: "none",
      }}>
        {/* Undo / Redo */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("undo")}
          title="Urungkan (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("redo")}
          title="Ulangi (Ctrl+Y)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </button>

        <span className="word-tb-divider" />

        {/* Text Style: Bold, Italic, Underline, Strikethrough */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("bold")}
          title="Tebal (Ctrl+B)"
          style={{ fontWeight: 800 }}
        >
          B
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("italic")}
          title="Miring (Ctrl+I)"
          style={{ fontStyle: "italic", fontFamily: "serif" }}
        >
          I
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("underline")}
          title="Garis Bawah (Ctrl+U)"
          style={{ textDecoration: "underline" }}
        >
          U
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("strikeThrough")}
          title="Coret"
          style={{ textDecoration: "line-through" }}
        >
          S
        </button>

        <span className="word-tb-divider" />

        {/* Subscript & Superscript (x2, x^2) */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("subscript")}
          title="Subskrip (x₂)"
        >
          x<sub>2</sub>
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("superscript")}
          title="Superskrip / Pangkat (x²)"
        >
          x<sup>2</sup>
        </button>

        <span className="word-tb-divider" />

        {/* Alignment */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("justifyLeft")}
          title="Rata Kiri"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("justifyCenter")}
          title="Rata Tengah"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("justifyRight")}
          title="Rata Kanan"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </button>

        <span className="word-tb-divider" />

        {/* Lists */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("insertUnorderedList")}
          title="Daftar Poin (Bullet List)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/></svg>
        </button>
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("insertOrderedList")}
          title="Daftar Nomor (Numbered List)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/></svg>
        </button>

        <span className="word-tb-divider" />

        {/* Image Inserter Button */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="word-tb-btn"
            onClick={() => setShowImageModal(!showImageModal)}
            title="Sisipkan Gambar / Diagram / Pola Figural"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 700,
              color: "var(--c-forest-700)",
              background: showImageModal ? "var(--c-mint-100)" : "transparent",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>+ Gambar</span>
          </button>

          {showImageModal && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 100,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "var(--radius-md)",
              padding: 12,
              width: 290,
              marginTop: 4,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--c-dark-900)" }}>
                Sisipkan Gambar Soal
              </div>

              {/* Opsi 1: Upload File */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>
                  1. Unggah dari Komputer (PNG, JPG, WebP)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelected}
                  disabled={isUploading}
                  style={{ fontSize: 12, width: "100%" }}
                />
                {isUploading && (
                  <span style={{ fontSize: 11, color: "var(--c-forest-600)", fontWeight: 600, marginTop: 3, display: "block" }}>
                    Mengompres & memproses gambar...
                  </span>
                )}
              </div>

              <div style={{ height: 1, background: "var(--border)" }} />

              {/* Opsi 2: URL */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)", marginBottom: 4, display: "block" }}>
                  2. Atau Masukkan URL Gambar
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://..."
                    style={{ fontSize: 12, padding: "5px 8px", flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleInsertFromUrl}
                    style={{ fontSize: 11.5, padding: "4px 8px", fontWeight: 700 }}
                  >
                    Sisipkan
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 11, color: "var(--text-dim)", background: "var(--c-neutral-100)", padding: "6px 8px", borderRadius: 4 }}>
                💡 <em>Tip: Anda juga bisa menempelkan langsung (Ctrl+V) screenshot gambar ke editor!</em>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowImageModal(false)}
                style={{ fontSize: 11, padding: "3px 6px" }}
              >
                Tutup
              </button>
            </div>
          )}
        </div>

        <span className="word-tb-divider" />

        {/* Math & Greek Symbols Menu */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className="word-tb-btn"
            onClick={() => setShowSymbols(!showSymbols)}
            title="Sisipkan Simbol Matematika / Huruf Yunani (±, √, π, θ, dll)"
            style={{ display: "flex", alignItems: "center", gap: 3, fontWeight: 700, color: "var(--c-forest-700)" }}
          >
            <span>Ω Simbol</span>
            <span style={{ fontSize: 9 }}>▼</span>
          </button>

          {showSymbols && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 100,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              borderRadius: "var(--radius-md)",
              padding: 8,
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: 4,
              width: 250,
              marginTop: 4,
            }}>
              {MATH_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => insertSymbol(sym)}
                  style={{
                    background: "var(--c-neutral-100)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: "6px 2px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-mint-100)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--c-neutral-100)"; }}
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="word-tb-divider" />

        {/* Clear formatting */}
        <button
          type="button"
          className="word-tb-btn"
          onClick={() => execCmd("removeFormat")}
          title="Hapus Pemformatan"
          style={{ fontSize: 11, color: "var(--text-dim)" }}
        >
          Bersihkan Format
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="word-editor-body"
        style={{
          minHeight,
          padding: "12px 16px",
          outline: "none",
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "var(--text)",
          overflowY: "auto",
          maxHeight: 400,
        }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
