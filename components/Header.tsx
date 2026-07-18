'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

interface HeaderProps {
  onSearch?: (query: string) => void
}

export default function Header({ onSearch }: HeaderProps) {
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-bg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div>
            <div className="font-bold text-lg">A4<span className="text-primary">CLUB</span></div>
            <div className="text-xs text-muted font-semibold tracking-wider">PREMIUM</div>
          </div>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="flex items-center gap-3 bg-white border border-border rounded-lg px-4 py-2">
            <span className="text-lg">🔍</span>
            <input
              type="text"
              placeholder="Busque por temas, kits, fontes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm font-medium placeholder:text-muted"
            />
            <span className="text-lg text-muted">⚙️</span>
          </div>
        </form>

        {/* User Menu */}
        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center relative">
              🔔
              <span className="absolute -top-1 -right-1 bg-pink text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink to-primary flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold">Olá, {user?.email?.split('@')[0]}!</div>
              <div className="text-xs text-primary font-semibold">{user?.plano || 'Free'}</div>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-lg"
            >
              ▼
            </button>
          </div>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-border rounded-lg shadow-lg p-2 min-w-48">
              <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-bg rounded transition">
                👤 Minha Conta
              </Link>
              <Link href="/downloads" className="block px-4 py-2 text-sm hover:bg-bg rounded transition">
                📥 Meus Downloads
              </Link>
              <Link href="/favorites" className="block px-4 py-2 text-sm hover:bg-bg rounded transition">
                ❤️ Favoritos
              </Link>
              {user?.plano && (
                <Link href="/plan" className="block px-4 py-2 text-sm hover:bg-bg rounded transition">
                  👑 Meu Plano
                </Link>
              )}
              <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-bg rounded transition">
                ⚙️ Admin
              </Link>
              <hr className="my-2" />
              <button
                onClick={() => {
                  logout()
                  window.location.href = '/login'
                }}
                className="w-full text-left px-4 py-2 text-sm text-pink hover:bg-bg rounded transition"
              >
                🚪 Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
