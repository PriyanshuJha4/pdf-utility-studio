import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "PDF Utility Studio",
  description: "Merge PDFs, convert to images or PowerPoint — all in your browser.",
  verification: {
    google: "3Sq7h-rAUm5FcW95C0IqWuwT5dY4femon_X-VtOBt2k",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}