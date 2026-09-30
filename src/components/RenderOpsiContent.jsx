"use client";

import { useState } from "react";
import { isDirectImageUrl, containsImageHtml, extractFirstImageUrl, extractCleanText } from "@/lib/imageUtils";
import CatImageLightbox from "./CatImageLightbox";

export default function RenderOpsiContent({ content, imageMaxHeight = 110, allowZoom = true }) {
  const [zoomSrc, setZoomSrc] = useState(null);

  if (!content) return <i>(Pilihan kosong)</i>;

  const str = typeof content === "string" ? content : String(content);

  // Kasus 1: Opsi hanya berupa Data URL atau Direct Image URL
  if (isDirectImageUrl(str)) {
    return (
      <div style={{ display: "inline-flex", flexDirection: "column", gap: 6, position: "relative" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={str}
            alt="Pilihan Jawaban"
            style={{
              maxHeight: imageMaxHeight,
              maxWidth: "100%",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "#FFFFFF",
              objectFit: "contain",
              display: "block",
            }}
          />
          {allowZoom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomSrc(str);
              }}
              title="Perbesar Gambar Pilihan"
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                background: "rgba(15, 23, 42, 0.75)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 4,
                padding: "3px 6px",
                cursor: "pointer",
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <span>Zoom</span>
            </button>
          )}
        </div>
        {zoomSrc && <CatImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
      </div>
    );
  }

  // Kasus 2: Opsi mengandung HTML tag <img>
  if (containsImageHtml(str)) {
    const firstImg = extractFirstImageUrl(str);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div
          className="cat-rendered-html-opsi"
          dangerouslySetInnerHTML={{ __html: str }}
          style={{ maxWidth: "100%", lineHeight: 1.5 }}
        />
        {allowZoom && firstImg && (
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setZoomSrc(firstImg);
              }}
              title="Perbesar Gambar Pilihan"
              style={{
                background: "var(--c-neutral-100)",
                color: "var(--c-dark-900)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 2,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Perbesar Gambar</span>
            </button>
          </div>
        )}
        {zoomSrc && <CatImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
      </div>
    );
  }

  // Kasus 3: Opsi teks biasa
  return <span>{str}</span>;
}
