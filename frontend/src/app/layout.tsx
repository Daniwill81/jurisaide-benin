import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JurisAide Benin - Labor Law Calculator',
  description: 'Calculate employee indemnities according to Beninese labor law',
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
