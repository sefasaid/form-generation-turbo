'use client';
import './global.css';
import { Toaster } from 'sonner'
import { Manrope } from 'next/font/google'
import { useEffect, useState } from 'react';
import { createContext } from 'react';
import SideImage from './components/side-image';
//eslint-disable-next-line
export const SideImageContext = createContext<{ sideImage: string, setSideImage: (sideImage: string) => void }>({ sideImage: '', setSideImage: () => { } });
const manrope = Manrope({
  subsets: ['latin'],
})
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [sideImage, setSideImage] = useState<string>('');
  useEffect(() => {
    setSideImage(Math.random().toString());
  }, []);
  return (
    <html lang="en" className={manrope.className}>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 relative dark">
        <Toaster />
        <main className="flex items-center justify-center min-h-screen h-auto md:h-screen">
          <SideImageContext.Provider value={{ sideImage: sideImage || '', setSideImage }}>
            <div className='flex flex-col md:flex-row items-center justify-center h-full w-full'>
              <div className="w-full h-full flex flex-col justify-center bg-white dark:bg-card-dark items-center min-h-screen md:min-h-0">
                {children}
              </div>
              {sideImage && <SideImage randomImage={sideImage} />}
            </div>
          </SideImageContext.Provider>
        </main>
      </body>
    </html >
  );
}
