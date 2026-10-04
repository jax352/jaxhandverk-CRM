import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jax Handverk · CRM",
  description: "Viðskiptavinir, vörukaup og eftirfylgni Jax Handverks.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="is">
      <body className="antialiased">{children}</body>
    </html>
  );
}
