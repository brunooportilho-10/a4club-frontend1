import type { Metadata } from 'next'
import { ReactNode } from 'react'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'A4 CLUB - Biblioteca Premium de Arquivos',
  description: 'Acesso ilimitado a arquivos criativos: kits, fontes, mockups e muito mais.',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%237C4DFF'>A</text></svg>" />
      </head>
      <body className="bg-bg text-text">
        {children}
      </body>
    </html>
  )
}
