import type { ReactNode } from 'react'

// Script inline que corre durante el parsing del HTML, antes del primer pintado.
// Lee el theme guardado en sessionStorage y lo aplica en <html> inmediatamente.
// Esto elimina el flash — cuando el browser pinta el primer frame, :root[data-theme]
// ya está activo. El mismo mecanismo que usan next-themes, Mantine y Chakra UI.
const THEME_SCRIPT = `(function(){try{var t=sessionStorage.getItem('telar:pd-theme');if(t)document.documentElement.setAttribute('data-theme',JSON.parse(t))}catch(e){}})();`

export default function ProfileDemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      {children}
    </>
  )
}
