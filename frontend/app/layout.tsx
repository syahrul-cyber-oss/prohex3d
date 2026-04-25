import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProHex3D",
  description: "Web AI untuk mengubah foto menjadi model 3D.",
  keywords: [
    "ProHex3D",
    "AI 3D",
    "Image to 3D",
    "Photo to 3D",
    "GLB Generator",
  ],
  authors: [
    {
      name: "Z7",
    },
  ],
  creator: "Z7",
  publisher: "ProHex3D",
  openGraph: {
    title: "ProHex3D",
    description: "Upload foto dan ubah menjadi model 3D.",
    type: "website",
    siteName: "ProHex3D",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}