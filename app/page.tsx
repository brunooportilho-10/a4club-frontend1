'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api, { catalog } from '@/lib/api'

interface Arquivo {
  id: string
  nome: string
  categoria?: string
  colecao?: string | null
  extensao?: string
  tamanho?: number
  importadoEm?: string
}

interface Categoria {
  nome: string
  total: number
}

const ICONES: Record<string, string> = {
  ttf: '🔤', otf: '🔤',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️', gif: '🖼️',
  pdf: '📄',
  cdr: '🎨', ai: '🎨', eps: '🎨', svg: '🎨',
  studio3: '✂️', studio: '✂️', dxf: '✂️',
  zip: '📦', rar: '📦',
  psd: '🖌️',
}

function icone(ext?: string) {
  return (ext && ICONES[ext.toLowerCase()]) || '📁'
}

function tamanhoLegivel(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function HomePage() {
  const router = useRouter()
  const { user, token, logout } = useAuth()
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('')
  const [arquivosCategoria, setArquivosCategoria] = useState<Arquivo[]>([])
  const [carregandoCategoria, setCarregandoCategoria] = useState(false)
  const [busca, setBusca] = useState('')
  const [resultadoBusca, setResultadoBusca] = useState<Arquivo[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [ehAdmin, setEhAdmin] = useState(false)
  const [baixando, setBaixando] = useState<string>('')
  const [erro, setErro] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Hidrata a sessao e redireciona se nao logado
  useEffect(() => {
    useAuth.getState().hydrate()
    const t = setTimeout(() => {
      if (!useAuth.getState().token) router.push('/login')
    }, 1500)
    return () => clearTimeout(t)
  }, [router])

  const carregarCatalogo = useCallback(async () => {
    setErro('')
    try {
      const r = await catalog.home()
      setArquivos(r.data.arquivos || [])
      setCategorias(r.data.categorias || [])
      const me = await api.get('/api/me')
      setEhAdmin(!!me.data.admin)
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao carregar o catálogo')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    carregarCatalogo()
  }, [token, carregarCatalogo])

  // Quando uma categoria e selecionada, busca TODOS os arquivos dela no servidor
  useEffect(() => {
    if (!categoriaAtiva || !token) {
      setArquivosCategoria([])
      return
    }
    setCarregandoCategoria(true)
    api
      .get('/api/catalogo/categoria/' + encodeURIComponent(categoriaAtiva))
      .then((r) => setArquivosCategoria(r.data.arquivos || []))
      .catch(() => setArquivosCategoria([]))
      .finally(() => setCarregandoCategoria(false))
  }, [categoriaAtiva, token])

  // Busca com debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!busca.trim()) {
      setResultadoBusca(null)
      setBuscando(false)
      return
    }
    setBuscando(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await catalog.search(busca.trim().toLowerCase())
        setResultadoBusca(r.data.arquivos || [])
      } catch (e) {
        setResultadoBusca([])
      } finally {
        setBuscando(false)
      }
    }, 400)
  }, [busca])

  async function baixar(arq: Arquivo) {
    setBaixando(arq.id)
    try {
      const r = await catalog.download(arq.id)
      if (r.data.url) {
        // Link e de outro dominio (R2): abrir em nova aba funciona sempre.
        // O backend ja forca o download com o nome certo via Content-Disposition.
        window.open(r.data.url, '_blank')
      }
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao gerar o download')
    } finally {
      setBaixando('')
    }
  }

  function sair() {
    logout()
    router.push('/login')
  }

  const lista =
    resultadoBusca !== null
      ? resultadoBusca
      : categoriaAtiva
      ? arquivosCategoria
      : arquivos

  const carregandoLista = buscando || (categoriaAtiva ? carregandoCategoria : carregando)

  const nomeUsuario = user?.email ? user.email.split('@')[0] : ''

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar text-white p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <div className="font-bold text-lg">
              A4<span className="text-primary-2">CLUB</span>
            </div>
            <div className="text-[10px] text-white/50 font-semibold tracking-wider">
              ARQUIVOS PREMIUM
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <button
            onClick={() => {
              setCategoriaAtiva('')
              setBusca('')
            }}
            className={
              'w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition ' +
              (!categoriaAtiva ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10')
            }
          >
            🏠 Início
          </button>
          <div className="pt-4 pb-2 px-4 text-[10px] font-bold tracking-wider text-white/40">
            CATEGORIAS
          </div>
          {categorias.map((c) => (
            <button
              key={c.nome}
              onClick={() => setCategoriaAtiva(c.nome === categoriaAtiva ? '' : c.nome)}
              className={
                'w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center justify-between ' +
                (categoriaAtiva === c.nome
                  ? 'bg-primary text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10')
              }
            >
              <span>📂 {c.nome}</span>
              <span className="text-xs opacity-70">{c.total}</span>
            </button>
          ))}
        </nav>

        <div className="space-y-2 pt-6 border-t border-white/10">
          {ehAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10"
            >
              ⚙️ Painel Admin
            </button>
          )}
          <button
            onClick={sair}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10"
          >
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full">
        {/* Topo */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Olá, <span className="text-primary">{nomeUsuario}</span>! 👋
            </h1>
            <p className="text-muted text-sm mt-1">
              {arquivos.length > 0
                ? 'Explore os arquivos do clube e baixe o que precisar.'
                : 'Bem-vindo ao A4 CLUB.'}
            </p>
          </div>
          {ehAdmin && (
            <button
              onClick={() => router.push('/admin')}
              className="lg:hidden self-start px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
            >
              ⚙️ Admin
            </button>
          )}
        </div>

        {/* Busca */}
        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-4 mb-8 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            placeholder="Busque por nome do arquivo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="text-muted text-sm font-semibold"
            >
              ✕
            </button>
          )}
        </div>

        {erro && (
          <div className="bg-pink/10 border border-pink text-pink px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        {/* Chips de categoria (mobile) */}
        {categorias.length > 0 && (
          <div className="flex lg:hidden gap-2 flex-wrap mb-6">
            {categorias.map((c) => (
              <button
                key={c.nome}
                onClick={() => setCategoriaAtiva(c.nome === categoriaAtiva ? '' : c.nome)}
                className={
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition ' +
                  (categoriaAtiva === c.nome
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white border-border text-muted')
                }
              >
                {c.nome} · {c.total}
              </button>
            ))}
          </div>
        )}

        {/* Título da seção */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">
            {buscando
              ? 'Buscando...'
              : resultadoBusca !== null
              ? `Resultados para "${busca}"`
              : categoriaAtiva
              ? categoriaAtiva
              : 'Adicionados recentemente'}
          </h2>
          <span className="text-sm text-muted">{lista.length} arquivo(s)</span>
        </div>

        {/* Grid de arquivos */}
        {carregandoLista ? (
          <div className="text-muted text-sm">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <div className="font-bold mb-1">
              {resultadoBusca !== null
                ? 'Nenhum arquivo encontrado'
                : 'O catálogo ainda está vazio'}
            </div>
            <p className="text-sm text-muted">
              {resultadoBusca !== null
                ? 'Tente buscar por outro nome.'
                : 'Os arquivos aparecerão aqui após a primeira importação.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {lista.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:border-primary/40 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-2xl flex-shrink-0">
                    {icone(a.extensao)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" title={a.nome}>
                      {a.nome}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {(a.extensao || '').toUpperCase()}
                      {a.tamanho ? ' · ' + tamanhoLegivel(a.tamanho) : ''}
                    </div>
                    {a.categoria && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                          {a.categoria}
                        </span>
                        {a.colecao && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-bg text-muted text-[11px]">
                            {a.colecao}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => baixar(a)}
                  disabled={baixando === a.id}
                  className="w-full grad-btn text-white text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {baixando === a.id ? 'Gerando link...' : '⬇ Baixar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
