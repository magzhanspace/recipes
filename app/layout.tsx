import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'cyrillic'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
   title: { template: '%s · Рецепты', default: 'Рецепты' },
   description: 'Домашние рецепты, меню на неделю и список покупок.',
   robots: { index: false, follow: false },
};

export const viewport: Viewport = {
   width: 'device-width',
   initialScale: 1,
   maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
   return (
      <html lang="ru" suppressHydrationWarning>
         <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
            suppressHydrationWarning
         >
            <NuqsAdapter>
               <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                  {children}
                  <Toaster />
               </ThemeProvider>
            </NuqsAdapter>
         </body>
      </html>
   );
}
