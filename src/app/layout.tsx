import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ลอยกระทงกัน",
  description:
    "อัปโหลดรูปภาพหรือเลือกกระทง เขียนคำอธิษฐาน ปล่อยลอยลงแม่น้ำ หรือลอยโคมขึ้นฟ้าออนไลน์ใต้แสงจันทร์",
  openGraph: {
    title: "ลอยกระทงกัน",
    description:
      "อัปโหลดรูปภาพหรือเลือกกระทงของคุณ แล้วปล่อยลงแม่น้ำแห่งคำอธิษฐาน หรือลอยโคมคำอธิษฐานขึ้นฟ้า",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050d1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
