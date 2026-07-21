'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ABAS = [
  { href: '/admin', label: '📦 Importação' },
  { href: '/admin/clientes', label: '👥 Clientes' },
  { href: '/admin/manutencao', label: '🔧 Manutenção' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-6">
        <div className="flex items-center gap-1 mb-8 border-b border-border overflow-x-auto">
          {ABAS.map((aba) => {
            const ativo = pathname === aba.href
            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={
                  'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ' +
                  (ativo
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-text')
                }
              >
                {aba.label}
              </Link>
            )
          })}
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 sm:px-10 pb-10">{children}</div>
    </div>
  )
}
