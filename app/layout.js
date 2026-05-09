import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "HUKUK·AI — Türk Hukuku Yapay Zeka Asistanı",
  description:
    "RAG tabanlı, Anayasa ve 11 temel Türk kanununu kapsayan yapay zeka destekli hukuk asistanı. GİTEK Yapay Zeka Etkinliği projesi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
