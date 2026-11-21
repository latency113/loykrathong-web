import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ลอยกระทงออนไลน์",
  description:
    "อธิษฐาน แต่งกระทง 3D และปล่อยลงแม่น้ำออนไลน์ ลอยเคียงข้างกระทงของคนอื่น",
  openGraph: {
    title: "ลอยกระทงออนไลน์",
    description: "แต่งกระทง 3D ของคุณ แล้วปล่อยลงแม่น้ำแห่งคำอธิษฐาน",
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
