import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PDF Utility Studio",
  description: "Merge PDFs, convert to images or PowerPoint — all in your browser.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}