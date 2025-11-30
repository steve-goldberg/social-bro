import type { Metadata } from 'next';
import { Inter, Doto } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const doto = Doto({
  variable: '--font-doto',
  subsets: ['latin'],
  weight: '500',
});

export const metadata: Metadata = {
  title: 'Social Bro - Content Discovery Platform',
  description: 'Discover and explore content across YouTube, TikTok, Instagram, and more',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${doto.variable} antialiased`}>{children}</body>
    </html>
  );
}
