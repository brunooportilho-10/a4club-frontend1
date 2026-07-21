'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import api, { admin } from '@/lib/api'

interface Pasta {
  id: string
  nome: string
  tipo: string
  dono?: string | null
}

interface Job {
  id: string
  pastaNome?: string
  status: string
  total?: number
  processados?: number
  importados?: number
  pulados?: number
  erros?: number
  mensagem?: string
  errosLog?: string[]
  iniciadoEm?: string
}

interface Stats {
  totalArquivos: number
  totalUsuarios: number
  importacaoAtiva?: string | null
  espacoUsadoBytes?: number
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://a4club-backend-novo-production.up.railway.app'

function espacoLegivel(bytes?: number) {
  if (!bytes) return '0 MB'
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) return gb.toFixed(2) + ' GB'
  const mb = bytes / (1024 * 1024)
  return mb.toFixed(1) + ' MB'
}

const R2_GB_GRATIS = 10
const R2_USD_POR_GB = 0.015
const COTACAO_USD_BRL = 5.09

function custoEstimadoR2(bytes?: number) {
  const gbTotal = (bytes || 0) / (1024 * 1024 * 1024)
  const gbCobrados = Math.max(0, gbTotal - R2_GB_GRATIS)
  const usd = gbCobrados * R2_USD_POR_GB
  return {
    dentroDoGratis: gbCobrados <= 0,
    gbTotal,
    gbCobrados,
    usd,
    brl: usd * COTACAO_USD_BRL,
  }
}

export default function AdminImportacaoPage() {
  const router = useRouter()
  const { token } = useAuth()
  const [driveConectado, setDriveConectado] = useState<boolean | null>(null)
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [historico, setHistorico] = useState<Job[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    useAuth.getState().hydrate()
  }, [])

  const carregarTudo = useCallback(async () => {
    setErro('')
    try {
      const st = await api.get('/admin/drive/status')
      setDriveConectado(!!st.data.conectado)
      if (st.data.conectado) {
        const dr = await admin.drives()
        setPastas(dr.data.pastas || [])
      }
      const s = await admin.stats()
      setStats(s.data)
      const js = await admin.jobs()
      setHistorico(js.data.jobs || [])
      if (s.data.importacaoAtiva) {
        acompanharJob(s.data.importacaoAtiva)
      }
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao carregar dados do servidor')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    carregarTudo()
  }, [token, carregarTudo])

  function acompanharJob(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    const buscar = async () => {
      try {
        const r = await admin.jobStatus(jobId)
        const j: Job = r.data.job
        setJob(j)
        if (['concluido', 'erro', 'cancelado', 'interrompido'].includes(j.status)) {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          const s = await admin.stats()
          setStats(s.data)
          const js = await admin.jobs()
          setHistorico(js.data.jobs || [])
        }
      } catch (e) {
        /* mantem o poll */
      }
    }
    buscar()
    pollRef.current = setInterval(buscar, 2500)
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function sincronizar(pasta: Pasta) {
    setErro('')
    try {
      const r = await admin.importar(pasta.id, pasta.nome)
      acompanharJob(r.data.jobId)
    } catch (e: any) {
      const jid = e.response?.data?.jobId
      if (jid) {
        acompanharJob(jid)
      } else {
        setErro(e.response?.data?.erro || 'Erro ao iniciar sincronizacao')
      }
    }
  }

  async function pausar() {
    if (!job) return
    try { await admin.jobPause(job.id) } catch (e) { /* status vem no poll */ }
  }

  async function retomar() {
    if (!job) return
    try { await admin.jobResume(job.id) } catch (e) { /* status vem no poll */ }
  }

  const progresso =
    job && job.total ? Math.round(((job.processados || 0) / job.total) * 100) : 0

  const rodando = job && ['iniciando', 'listando', 'executando', 'pausado'].includes(job.status)

  const statusLabel: Record<string, string> = {
    iniciando: 'Iniciando...',
    listando: 'Varrendo pastas do Drive...',
    executando: 'Importando...',
    pausado: 'Pausado',
    concluido: 'Concluído',
    erro: 'Erro',
    cancelado: 'Cancelado',
    interrompido: 'Interrompido',
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Painel <span className="text-primary">Admin</span>
          </h1>
          <p className="text-muted text-sm mt-1">
            Importação de arquivos do Google Drive para o A4 CLUB
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="text-sm font-semibold text-primary hover:underline"
        >
          ← Voltar ao catálogo
        </button>
      </div>

      {erro && (
        <div className="bg-pink/10 border border-pink text-pink px-4 py-3 rounded-lg text-sm mb-6">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="text-3xl font-bold text-primary">
            {stats ? stats.totalArquivos : '—'}
          </div>
          <div className="text-sm text-muted mt-1">Arquivos no clube</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="text-3xl font-bold text-primary">
            {stats ? espacoLegivel(stats.espacoUsadoBytes) : '—'}
          </div>
          <div className="text-sm text-muted mt-1">Espaço usado (R2)</div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5">
          <div className="text-3xl font-bold">
            {driveConectado === null ? '—' : driveConectado ? '🟢' : '🔴'}
          </div>
          <div className="text-sm text-muted mt-1">Google Drive</div>
        </div>
      </div>

      {stats && (() => {
        const c = custoEstimadoR2(stats.espacoUsadoBytes)
        return (
          <div className="bg-white rounded-2xl border border-border p-5 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <div className="font-semibold text-sm">
                💰 Custo estimado do armazenamento (Cloudflare R2)
              </div>
              {c.dentroDoGratis ? (
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                  🟢 Dentro do plano grátis
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-amber/10 text-amber text-base font-bold">
                  ≈ R$ {c.brl.toFixed(2)} / mês
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <span>📦 {c.gbTotal.toFixed(2)} GB armazenados</span>
              <span>🎁 {Math.min(c.gbTotal, R2_GB_GRATIS).toFixed(2)} GB grátis</span>
              <span>💳 {c.gbCobrados.toFixed(2)} GB cobrados</span>
              <span>💵 US$ {R2_USD_POR_GB.toFixed(3)}/GB</span>
            </div>
            <div className="text-[11px] text-muted mt-2">
              Cloudflare libera {R2_GB_GRATIS} GB grátis por mês; acima disso cobra US$ {R2_USD_POR_GB.toFixed(3)}/GB.
              Estimativa aproximada (cotação ≈ R$ {COTACAO_USD_BRL.toFixed(2)}, varia diariamente) — não é a fatura exata.
            </div>
          </div>
        )
      })()}

      {job && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-bold">
                {job.pastaNome || 'Importação'} —{' '}
                <span className="text-primary">
                  {statusLabel[job.status] || job.status}
                </span>
              </div>
              {job.mensagem && (
                <div className="text-sm text-muted mt-1">{job.mensagem}</div>
              )}
            </div>
            {rodando && (
              <div className="flex gap-2">
                {job.status === 'pausado' ? (
                  <button
                    onClick={retomar}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
                  >
                    ▶ Retomar
                  </button>
                ) : (
                  <button
                    onClick={pausar}
                    className="px-4 py-2 rounded-lg border border-border text-sm font-semibold"
                  >
                    ⏸ Pausar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-3 bg-bg rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: progresso + '%' }}
            />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <span>
              {job.processados || 0} / {job.total || '?'} processados ({progresso}%)
            </span>
            <span className="text-green-600">✔ {job.importados || 0} importados</span>
            <span>↷ {job.pulados || 0} pulados</span>
            {(job.erros || 0) > 0 && (
              <span className="text-pink">✖ {job.erros} erros</span>
            )}
          </div>

          {job.errosLog && job.errosLog.length > 0 && (
            <details className="mt-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold">
                Ver erros ({job.errosLog.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {job.errosLog.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {driveConectado === false && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-8 text-center">
          <div className="text-lg font-bold mb-2">Google Drive não conectado</div>
          <p className="text-sm text-muted mb-4">
            Conecte o Drive para importar os arquivos de arte.
          </p>
          <a
            href={BACKEND_URL + '/auth/google'}
            className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-bold"
          >
            Conectar Google Drive
          </a>
        </div>
      )}

      {driveConectado && (
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Pastas do Drive</h2>
            <button
              onClick={carregarTudo}
              className="text-sm text-primary font-semibold hover:underline"
            >
              ↻ Atualizar lista
            </button>
          </div>
          {carregando ? (
            <div className="text-muted text-sm">Carregando...</div>
          ) : pastas.length === 0 ? (
            <div className="text-muted text-sm">
              Nenhuma pasta encontrada no Drive.
            </div>
          ) : (
            <div className="space-y-2">
              {pastas.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border border-border rounded-lg px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">📁 {p.nome}</div>
                    <div className="text-xs text-muted">
                      {p.tipo === 'compartilhada'
                        ? 'Compartilhada' + (p.dono ? ' por ' + p.dono : '')
                        : p.tipo === 'shared_drive'
                        ? 'Drive compartilhado'
                        : 'Meu Drive'}
                    </div>
                  </div>
                  <button
                    onClick={() => sincronizar(p)}
                    disabled={!!rodando}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ⟳ Sincronizar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {historico.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-bold text-lg mb-4">Últimas importações</h2>
          <div className="space-y-2 text-sm">
            {historico.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between border-b border-border pb-2 last:border-0"
              >
                <div>
                  <span className="font-semibold">{h.pastaNome}</span>{' '}
                  <span className="text-muted">
                    — {statusLabel[h.status] || h.status}
                  </span>
                </div>
                <div className="text-muted text-xs">
                  ✔ {h.importados || 0} · ↷ {h.pulados || 0} · ✖ {h.erros || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
