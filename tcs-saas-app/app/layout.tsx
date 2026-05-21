import type { Metadata } from "next";
import { Poppins, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ClientShell from "./client-shell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TCS Coffee",
  description: "Order your favourite coffee directly — no middleman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* FOUC prevention — runs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const theme = localStorage.getItem('tcs-theme');
              const mode = localStorage.getItem('tcs-mode');
              if (theme === 'dark') document.documentElement.classList.add('dark');
              if (mode === 'vibe') document.documentElement.classList.add('vibe');
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text font-sans">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
