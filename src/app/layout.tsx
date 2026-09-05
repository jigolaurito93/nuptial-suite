import type { Metadata } from "next";
import "@fontsource-variable/outfit";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "@fontsource/cormorant-garamond/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kennett & Bea — Save the Date",
  description:
    "You are invited to celebrate the wedding of Kennett Ramos and Bea Alibutud.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
