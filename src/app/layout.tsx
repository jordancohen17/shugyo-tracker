import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shugyo Tracker | 修行",
  description: "A bespoke minimalist personal habit and fitness tracker inspired by traditional Japanese design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-washi text-sumi">
        {children}
      </body>
    </html>
  );
}

