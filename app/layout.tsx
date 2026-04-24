import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "konoffice",
  description: "A satirical voice roguelike where corporate language is combat.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
