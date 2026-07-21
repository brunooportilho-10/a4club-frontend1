'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function CadastroPage() {
  const router = useRouter()
  const { user, register, isLoading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [localError, setLocalError] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    useAuth.getState().hydrate()
    if (user && !sucesso) {
      router.push('/')
    }
  }, [user, router, sucesso])

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (password !== confirmar) {
      setLocalError('As senhas não coincidem')
      return
    }
    if (password.length < 6) {
      setLocalError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    try {
      await register(email, password)
      setSucesso(true)
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao criar a conta')
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mx-auto mb-5">
            ✅
          </div>
          <h1 className="text-xl font-bold mb-2">Conta criada com sucesso!</h1>
          <p className="text-sm text-muted mb-6">
            Seu cadastro foi feito. Agora é só aguardar a liberação do
            administrador do A4 CLUB para começar a baixar os arquivos.
          </p>
          <button
            onClick={() => router.push('/')}
            className="grad-btn text-white font-bold py-3 px-6 rounded-lg"
          >
            Ir para o clube
          </button>
        </div>
      </div>
    )
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
            Faça parte do <span className="text-primary-2">clube</span> e tenha acesso a <span className="text-pink">tudo</span>
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
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-4xl font-bold mb-2">
            Criar <span className="text-primary">conta</span>
          </h2>
          <p className="text-muted mb-8">Cadastre-se para acessar o A4 CLUB</p>

          <form onSubmit={handleCadastro} className="space-y-5">
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
              </label>
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <span className="text-lg">🔒</span>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm font-semibold mb-2">
                <span>Confirmar senha</span>
              </label>
              <div className="flex items-center gap-3 border border-border rounded-lg px-4 py-3 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
                <span className="text-lg">🔒</span>
                <input
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
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
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-8">
            Já tem uma conta?{' '}
            <a href="/login" className="text-primary font-bold hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
