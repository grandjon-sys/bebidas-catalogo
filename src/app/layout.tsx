import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '🍺 Catálogo de Bebidas',
  description: 'Reserve suas bebidas favoritas!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}