import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Forma — Campaign Studio",
  description: "Turn your brand DNA into your next great campaign.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
