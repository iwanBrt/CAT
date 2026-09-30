import "./globals.css";

export const metadata = {
  title: "Simulasi CAT CPNS/PPPK",
  description: "Aplikasi simulasi ujian CAT untuk CPNS/PPPK (SKD)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
