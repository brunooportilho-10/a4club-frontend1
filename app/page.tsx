'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api, { catalog } from '@/lib/api'

interface Arquivo {
  id: string
  nome: string
  categoria?: string
  extensao?: string
  tamanho?: number
  importadoEm?: string
}

interface Categoria {
  nome: string
  total: number
}

interface Subpasta {
  nome: string
  caminho: string
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

const IMG_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
const PDF_EXTS = ['pdf']

function ehImagem(ext?: string) {
  return !!ext && IMG_EXTS.includes(ext.toLowerCase())
}
function ehPdf(ext?: string) {
  return !!ext && PDF_EXTS.includes(ext.toLowerCase())
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

  const [arquivosRecentes, setArquivosRecentes] = useState<Arquivo[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [ehAdmin, setEhAdmin] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [baixando, setBaixando] = useState<string>('')

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('')
  const [caminhoAtual, setCaminhoAtual] = useState<string>('')
  const [subpastas, setSubpastas] = useState<Subpasta[]>([])
  const [arquivosPasta, setArquivosPasta] = useState<Arquivo[]>([])
  const [carregandoPasta, setCarregandoPasta] = useState(false)

  const [busca, setBusca] = useState('')
  const [resultadoBusca, setResultadoBusca] = useState<Arquivo[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Previas: mapa id -> url assinada (sem forcar download), e lightbox aberto
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [lightbox, setLightbox] = useState<{ url: string; nome: string; tipo: 'imagem' | 'pdf' } | null>(null)
  const [carregandoPreviewId, setCarregandoPreviewId] = useState<string>('')

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
      setArquivosRecentes(r.data.arquivos || [])
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

  function navegarPara(categoria: string, caminho: string) {
    setBusca('')
    setResultadoBusca(null)
    setCategoriaAtiva(categoria)
    setCaminhoAtual(caminho)
    setCarregandoPasta(true)
    api
      .get('/api/catalogo/navegar', { params: { categoria, caminho } })
      .then((r) => {
        setSubpastas(r.data.subpastas || [])
        setArquivosPasta(r.data.arquivos || [])
      })
      .catch(() => {
        setSubpastas([])
        setArquivosPasta([])
      })
      .finally(() => setCarregandoPasta(false))
  }

  function voltarInicio() {
    setCategoriaAtiva('')
    setCaminhoAtual('')
    setSubpastas([])
    setArquivosPasta([])
    setBusca('')
    setResultadoBusca(null)
  }

  const segmentosCaminho = caminhoAtual ? caminhoAtual.split('/').filter(Boolean) : []

  function caminhoAteSegmento(indice: number) {
    return segmentosCaminho.slice(0, indice + 1).join('/')
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!busca.trim()) {
      setResultadoBusca(null)
      setBuscando(false)
      return
    }
    setCategoriaAtiva('')
    setCaminhoAtual('')
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

  async function buscarPreview(id: string): Promise<string | null> {
    if (previews[id]) return previews[id]
    try {
      const r = await api.get('/api/catalogo/arquivo/' + id + '/preview')
      const url = r.data.url
      setPreviews((prev) => ({ ...prev, [id]: url }))
      return url
    } catch (e) {
      return null
    }
  }

  // Carrega miniaturas reais para os arquivos de imagem da lista atual (em paralelo, progressivo)
  function carregarMiniaturas(lista: Arquivo[]) {
    lista
      .filter((a) => ehImagem(a.extensao) && !previews[a.id])
      .forEach((a) => {
        api
          .get('/api/catalogo/arquivo/' + a.id + '/preview')
          .then((r) => setPreviews((prev) => ({ ...prev, [a.id]: r.data.url })))
          .catch(() => {})
      })
  }

  async function abrirPreviaImagem(a: Arquivo) {
    setCarregandoPreviewId(a.id)
    const url = await buscarPreview(a.id)
    setCarregandoPreviewId('')
    if (url) setLightbox({ url, nome: a.nome, tipo: 'imagem' })
  }

  async function abrirPreviaPdf(a: Arquivo) {
    setCarregandoPreviewId(a.id)
    const url = await buscarPreview(a.id)
    setCarregandoPreviewId('')
    if (url) setLightbox({ url, nome: a.nome, tipo: 'pdf' })
  }

  async function baixar(arq: Arquivo) {
    setBaixando(arq.id)
    try {
      const r = await catalog.download(arq.id)
      if (r.data.url) {
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

  const nomeUsuario = user?.email ? user.email.split('@')[0] : ''

  const mostrandoBusca = resultadoBusca !== null
  const dentroDeCategoria = !!categoriaAtiva && !mostrandoBusca

  const listaArquivos = mostrandoBusca ? resultadoBusca : dentroDeCategoria ? arquivosPasta : arquivosRecentes

  useEffect(() => {
    carregarMiniaturas(listaArquivos)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaArquivos])

  return (
    <div className="min-h-screen bg-bg flex">
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

        <nav className="space-y-1 flex-1 overflow-y-auto">
          <button
            onClick={voltarInicio}
            className={
              'w-full text-left px-4 py-3 rounded-lg font-semibold text-sm transition ' +
              (!categoriaAtiva && !mostrandoBusca
                ? 'bg-primary text-white'
                : 'text-white/70 hover:bg-white/10')
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
              onClick={() => navegarPara(c.nome, '')}
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

      <main className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Olá, <span className="text-primary">{nomeUsuario}</span>! 👋
            </h1>
            <p className="text-muted text-sm mt-1">
              Explore os arquivos do clube e baixe o que precisar.
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

        <div className="flex items-center gap-3 bg-white border border-border rounded-xl px-5 py-4 mb-6 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition">
          <span className="text-lg">🔍</span>
          <input
            type="text"
            placeholder="Busque por nome do arquivo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm"
          />
          {busca && (
            <button onClick={() => setBusca('')} className="text-muted text-sm font-semibold">
              ✕
            </button>
          )}
        </div>

        {erro && (
          <div className="bg-pink/10 border border-pink text-pink px-4 py-3 rounded-lg text-sm mb-6">
            {erro}
          </div>
        )}

        {dentroDeCategoria && (
          <div className="flex items-center gap-2 text-sm mb-4 flex-wrap">
            <button onClick={voltarInicio} className="text-muted hover:text-primary">
              Início
            </button>
            <span className="text-muted">/</span>
            <button
              onClick={() => navegarPara(categoriaAtiva, '')}
              className={!caminhoAtual ? 'font-bold text-primary' : 'text-muted hover:text-primary'}
            >
              {categoriaAtiva}
            </button>
            {segmentosCaminho.map((seg, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-muted">/</span>
                <button
                  onClick={() => navegarPara(categoriaAtiva, caminhoAteSegmento(i))}
                  className={
                    i === segmentosCaminho.length - 1
                      ? 'font-bold text-primary'
                      : 'text-muted hover:text-primary'
                  }
                >
                  {seg}
                </button>
              </span>
            ))}
          </div>
        )}

        {!categoriaAtiva && !mostrandoBusca && categorias.length > 0 && (
          <div className="flex lg:hidden gap-2 flex-wrap mb-6">
            {categorias.map((c) => (
              <button
                key={c.nome}
                onClick={() => navegarPara(c.nome, '')}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white border-border text-muted"
              >
                {c.nome} · {c.total}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">
            {mostrandoBusca
              ? buscando
                ? 'Buscando...'
                : `Resultados para "${busca}"`
              : dentroDeCategoria
              ? segmentosCaminho[segmentosCaminho.length - 1] || categoriaAtiva
              : 'Adicionados recentemente'}
          </h2>
        </div>

        {dentroDeCategoria && !carregandoPasta && subpastas.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {subpastas.map((p) => (
              <button
                key={p.caminho}
                onClick={() => navegarPara(categoriaAtiva, p.caminho)}
                className="bg-white border border-border rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-primary/40 transition text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                  📁
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{p.nome}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {carregando || (dentroDeCategoria && carregandoPasta) || buscando ? (
          <div className="text-muted text-sm">Carregando...</div>
        ) : listaArquivos.length === 0 && (!dentroDeCategoria || subpastas.length === 0) ? (
          <div className="bg-white border border-border rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🗂️</div>
            <div className="font-bold mb-1">
              {mostrandoBusca ? 'Nenhum arquivo encontrado' : 'Nada por aqui ainda'}
            </div>
            <p className="text-sm text-muted">
              {mostrandoBusca
                ? 'Tente buscar por outro nome.'
                : 'Os arquivos aparecerão aqui após a importação.'}
            </p>
          </div>
        ) : listaArquivos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {listaArquivos.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg hover:border-primary/40 transition"
              >
                <div className="flex items-start gap-3">
                  {ehImagem(a.extensao) ? (
                    <button
                      onClick={() => abrirPreviaImagem(a)}
                      className="w-14 h-14 rounded-xl bg-bg flex-shrink-0 overflow-hidden relative group"
                      title="Ver prévia"
                    >
                      {previews[a.id] ? (
                        <img
                          src={previews[a.id]}
                          alt={a.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-2xl">
                          {icone(a.extensao)}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center text-white opacity-0 group-hover:opacity-100 text-lg">
                        🔍
                      </span>
                    </button>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-bg flex items-center justify-center text-2xl flex-shrink-0">
                      {icone(a.extensao)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate" title={a.nome}>
                      {a.nome}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {(a.extensao || '').toUpperCase()}
                      {a.tamanho ? ' · ' + tamanhoLegivel(a.tamanho) : ''}
                    </div>
                    {a.categoria && !dentroDeCategoria && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                        {a.categoria}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {ehPdf(a.extensao) && (
                    <button
                      onClick={() => abrirPreviaPdf(a)}
                      disabled={carregandoPreviewId === a.id}
                      className="px-3 py-2.5 rounded-lg border border-border text-sm font-bold disabled:opacity-50"
                      title="Ver prévia"
                    >
                      👁
                    </button>
                  )}
                  <button
                    onClick={() => baixar(a)}
                    disabled={baixando === a.id}
                    className="flex-1 grad-btn text-white text-sm font-bold py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {baixando === a.id ? 'Gerando link...' : '⬇ Baixar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </main>

      {/* Lightbox de prévia */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="font-semibold text-sm truncate">{lightbox.nome}</div>
              <button
                onClick={() => setLightbox(null)}
                className="text-muted hover:text-text text-xl leading-none px-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-bg flex items-center justify-center">
              {lightbox.tipo === 'imagem' ? (
                <img src={lightbox.url} alt={lightbox.nome} className="max-w-full max-h-[70vh] object-contain" />
              ) : (
                <iframe src={lightbox.url} className="w-full h-[70vh]" title={lightbox.nome} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
