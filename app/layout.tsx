import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Santos Store — Periféricos, Hardware & Serviços",
  description: "Santos Store — loja gamer especializada em periféricos, hardware, upgrades e serviços técnicos.",
  icons: { icon: "/assets/logo-sg.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f7f7fb" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('sg_theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');})()`,
          }}
        />
      </head>
      <body className={inter.variable}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
