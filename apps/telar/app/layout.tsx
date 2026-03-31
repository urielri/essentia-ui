import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from './AppProviders'

export const metadata: Metadata = {
  title: 'Telar — Demos',
  description: 'Demos de Telar: estado reactivo para React',
}

const THEME_SCRIPT = `(function(){try{var t=sessionStorage.getItem('telar:app-theme');if(t)document.documentElement.setAttribute('data-theme',JSON.parse(t))}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
