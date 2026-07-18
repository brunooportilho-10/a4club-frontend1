'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { user, login, isLoading, error } = useAuth()
  const [email, setEmail] = useState('camila@a4digital.com.br')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    useAuth.getState().hydrate()
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(err.message || 'Erro ao fazer login')
    try {
      await login(email, password)
      router.push('/')
    } catch (err: any) {
      setLocalError(err.response?.data?.erro || 'Erro ao fazer login')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sidebar via-sidebar-2 to-primary text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <div className="font-bold text-2xl">A4<span className="text-primary-2">CLUB</span></div>
              <div className="text-xs text-white/60 font-semibold tracking-wider">ARQUIVOS PREMIUM</div>
            </div>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Acesso ilimitado a arquivos <span className="text-primary-2">criativos</span> e <span className="text-pink">exclusivos</span>
          </h1>
          <p className="text-lg text-white/80 mb-12 leading-relaxed">
            Kits, papéis digitais, fontes, artes e muito mais para facilitar o seu trabalho.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                ⬇️
              </div>
              <div>
                <div className="font-bold">Downloads ilimitados</div>
                <div className="text-sm text-white/70">Baixe quantos arquivos precisar</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                📁
              </div>
              <div>
                <div className="font-bold">Novos conteúdos toda semana</div>
                <div className="text-sm text-white/70">Sempre materiais atualizados</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">
                🔒
              </div>
              <div>
                <div className="font-bold">Acesso seguro</div>
                <div className="text-sm text-white/70">Seus arquivos sempre protegidos</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber to-pink flex items-center justify-center text-xl">
              ⭐
            </div>
            <div>
              <div className="font-bold">+ de 10.000 membros</div>
              <div className="text-sm text-white/70">já fazem parte do clube!</div>
            </div>
          </div>
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-pink border-2 border-sidebar flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <div className="w-10 h-10 rounded-full bg-primary border-2 border-sidebar flex items-center justify-center text-white font-bold text-xs">
              R
            </div>
            <div className="w-10 h-10 rounded-full bg-green border-2 border-sidebar flex items-center justify-center text-white font-bold text-xs">
              M
            </div>
            <div className="w-10 h-10 rounded-full bg-sidebar-2 border-2 border-sidebar flex items-center justify-center text-white font-bold text-xs">
              +9K
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="text-right mb-8">
            <button className="text-sm text-muted hover:text-text transition">
              🌙 Tema escuro
            </button>
          </div>

          <h2 className="text-4xl font-bold mb-2">
            Bem-vindo de <span className="text-primary">volta!</span>
          </h2>
          <p className="text-muted mb-8">Faça login para acessar sua conta</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="flex justify-between text-sm font-semibold mb-2">
                <span>E-mail</span>
              </label>
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <span className="text-lg">✉️</span>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-semibold mb-2">
                <span>Senha</span>
                <a href="#" className="text-primary font-semibold">
                  Esqueceu sua senha?
                </a>
              </label>
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <span className="text-lg">🔒</span>
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm"
                  required
                />
              </div>
            </div>

            {(error || localError) && (
              <div className="bg-pink/10 border border-pink text-pink px-4 py-3 rounded-lg text-sm">
                {error || localError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full grad-btn text-white font-bold py-3 rounded-lg transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Conectando...' : 'Entrar'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="border-t border-border"></div>
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
              <span className="bg-bg px-3 text-sm text-muted">ou</span>
            </div>
          </div>

          <button className="w-full border border-border rounded-lg py-3 text-sm font-semibold hover:bg-bg transition mb-3 flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Entrar com Google
          </button>

          <button className="w-full border border-border rounded-lg py-3 text-sm font-semibold hover:bg-bg transition flex items-center justify-center gap-2">
            <span style={{ color: '#1877F2', fontWeight: 800, fontSize: '18px' }}>f</span>
            Entrar com Facebook
          </button>

          <p className="text-center text-sm text-muted mt-8">
            Ainda não tem uma conta?{' '}
            <a href="#" className="text-primary font-bold hover:underline">
              Assine agora
            </a>
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span>🛍️</span> Pagamento seguro
          </span>
          <span className="flex items-center gap-2">
            <span>↩️</span> Cancelamento fácil
          </span>
          <span className="flex items-center gap-2">
            <span>🎧</span> Suporte dedicado
          </span>
          <span className="flex items-center gap-2">
            <span>⭐</span> Conteúdo exclusivo
          </span>
        </div>
      </div>
    </div>
  )
}
