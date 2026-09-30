"use client";

import { useState, useEffect } from "react";

export default function CatImageLightbox({ src, alt = "Perbesar Gambar", onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!src) return null;

  return (
    <div
      className="modal-bg"
      onClick={onClose}
      style={{
        zIndex: 9999,
        background: "rgba(15, 23, 42, 0.82)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "92vw",
          maxHeight: "90vh",
          background: "#FFFFFF",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Header Bar */}
        <div style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-dark-900)" }}>
              Perbesar Detail Gambar
            </span>
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
              (Tekan Esc atau klik di luar untuk menutup)
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ fontWeight: 700, padding: "4px 10px" }}
          >
            ✕ Tutup
          </button>
        </div>

        {/* Image Display */}
        <div style={{
          overflow: "auto",
          maxWidth: "100%",
          maxHeight: "calc(88vh - 60px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#F8FAFC",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              maxHeight: "calc(85vh - 70px)",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
}
