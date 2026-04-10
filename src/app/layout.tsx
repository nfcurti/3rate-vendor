import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const outfit = localFont({
  variable: "--font-outfit",
  src: [
    {
      path: "../../public/fonts/outfit/Outfit-latin.woff2",
      style: "normal",
      weight: "100 900",
    },
    {
      path: "../../public/fonts/outfit/Outfit-latin-ext.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
});

export const metadata: Metadata = {
  title: "3rate Vendor",
  description: "Pannello venditore 3rate",
  icons: {
    icon: "/brand/logo.svg",
    shortcut: "/brand/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
