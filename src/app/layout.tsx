import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FisioGest - Gestión de Fisioterapia',
  description: 'Sistema de gestión para fisioterapeutas independientes',
  other: {
    'color-scheme': 'light only',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" style={{ colorScheme: 'light' }}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
