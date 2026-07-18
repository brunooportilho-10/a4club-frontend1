'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (href: string) => pathname === href

  const navItems = [
    { href: '/', label: 'Início', icon: '🏠' },
    { href: '/explore', label: 'Explorar', icon: '🧭' },
    { href: '/categories', label: 'Categorias', icon: '📁' },
    { href: '/new', label: 'Novidades', icon: '✨', badge: 'NOVO' },
    { href: '/favorites', label: 'Favoritos', icon: '🤍' },
    { href: '/downloads', label: 'Downloads', icon: '⬇️' },
  ]

  return (
    <aside className="w-64 bg-sidebar text-white/75 h-screen sticky top-0 overflow-y-auto flex flex-col p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 pb-6 border-b border-sidebar-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center text-white font-bold text-lg">
          A
        </div>
        <div>
          <div className="font-bold text-base text-white">A4<span className="text-primary">CLUB</span></div>
          <div className="text-xs text-white/50 font-semibold tracking-wider">PREMIUM</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 mb-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-primary to-primary-2 text-white shadow-lg'
                : 'hover:bg-sidebar-2 hover:text-white'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-semibold text-sm">{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Plan Card */}
      <div className="bg-sidebar-2 border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-pink flex items-center justify-center text-lg flex-shrink-0">
            👑
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Plano Premium</div>
            <div className="text-xs text-white/50">Mensal</div>
          </div>
        </div>
        <div className="text-xs text-white/60 mb-3">
          Próxima cobrança:<br />
          <span className="font-semibold text-white">10/08/2026</span>
        </div>
        <button className="w-full bg-sidebar text-white/75 hover:text-white text-xs font-semibold py-2 rounded-lg transition">
          Gerenciar Assinatura
        </button>
      </div>

      {/* Promo */}
      <div className="bg-gradient-to-br from-primary to-pink rounded-lg p-4 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <div className="font-bold text-white text-sm mb-2">Indique e ganhe!</div>
          <p className="text-white/90 text-xs mb-3 leading-relaxed">
            Convide amigos e ganhe 30 dias grátis.
          </p>
          <button className="w-full bg-white text-primary font-bold text-xs py-2 rounded-lg transition hover:shadow-lg">
            Indicar agora
          </button>
        </div>
        <div className="absolute -right-3 -bottom-2 text-4xl opacity-50">🎁</div>
      </div>

      {/* Help */}
      <div className="mt-auto pt-4 border-t border-sidebar-2 flex gap-3 text-xs">
        <div className="text-lg">🎧</div>
        <div>
          <div className="font-semibold text-white">Precisa de ajuda?</div>
          <div className="text-white/60">Fale com nosso suporte</div>
        </div>
      </div>
    </aside>
  )
}
