// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import SplashScreenWrapper from '@/components/splash/SplashScreenWrapper';

export const metadata: Metadata = {
  title: 'MovieVerse',
  description: 'Cinematic movies platform with smooth transitions',
  metadataBase: new URL('http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white antialiased">
        <SplashScreenWrapper />
        {children}
      </body>
    </html>
  );
}
