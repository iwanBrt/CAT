"use client";

export default function MengerjakanLayout({ children }) {
  return (
    <>
      <style>{`
        /* Override the parent shell to hide sidebar/topbar when in exam mode */
        .admin-shell > .admin-sidebar,
        .admin-shell > .admin-main-wrap > .admin-topbar {
          display: none !important;
        }
        .admin-shell {
          display: block !important;
        }
        .admin-shell > .admin-main-wrap {
          margin-left: 0 !important;
        }
        .admin-shell > .admin-main-wrap > .admin-content-area {
          padding: 0 !important;
          max-width: 100% !important;
        }
      `}</style>
      {children}
    </>
  );
}
