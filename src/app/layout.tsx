import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iBud — AI E2E Platform",
  description: "Plain-English e2e tests, executed and healed by AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line bg-bg/80 backdrop-blur sticky top-0 z-40">
          <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="font-semibold text-[15px] tracking-tight hover:text-dim transition-colors"
            >
              iBud
            </Link>
            <nav className="flex items-center gap-5">
              <a
                href="http://localhost:4848"
                target="_blank"
                rel="noreferrer"
                className="text-[13px] text-dim hover:text-ink transition-colors"
              >
                Browser viewport ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-10 flex-1">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-6 h-12 flex items-center justify-between">
            <span className="text-[12px] text-faint">
              agent-browser · claude opus
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
