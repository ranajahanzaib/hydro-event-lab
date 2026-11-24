import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "HydroEventLab — Every catchment responds differently.",
  description:
    "Discover, investigate, and compare historical rainfall-runoff events across the world's catchments. An open hydrological research platform built on Caravan v1.6 and GRDC-Caravan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-hydro-bg text-hydro-text antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
