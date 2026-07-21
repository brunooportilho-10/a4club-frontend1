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

interface Usuario {
  uid: string
  email: string
  status: string
  criadoEm?: string
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

// Cloudflare R2: 10 GB gratis por mes, depois USD 0,015/GB.
// Cotacao aproximada (varia) - apenas para dar uma nocao de custo, nao eh a fatura exata.
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

export default function AdminPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [driveConectado, setDriveConectado] = useState<boolean | null>(null)
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [atualizandoUid, setAtualizandoUid] = useState<string>('')
  const [job, setJob] = useState<Job | null>(null)
  const [historico, setHistorico] = useState<Job[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagemOk, setMensagemOk] = useState('')
  const [resetando, setResetando] = useState(false)
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')
  const [recalculando, setRecalculando] = useState(false)
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
      const us = await admin.usuarios()
      setUsuarios(us.data.usuarios || [])
      if (s.data.importacaoAtiva) {
        acompanharJob(s.data.importacaoAtiva)
      }
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao carregar dados do servidor')
    } finally {
      setCarregando(false)
    }
  }, [])

  async function alterarStatusUsuario(uid: string, status: string) {
    setAtualizandoUid(uid)
    try {
      await admin.setStatusUsuario(uid, status)
      setUsuarios((prev) => prev.map((u) => (u.uid === uid ? { ...u, status } : u)))
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao atualizar assinante')
    } finally {
      setAtualizandoUid('')
    }
  }

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

  async function recalcularPastas() {
    setRecalculando(true)
    setErro('')
    setMensagemOk('')
    try {
      const r = await api.post('/admin/backfill-colecoes', {})
      setMensagemOk(
        `Recalculado: ${r.data.totalArquivos} arquivos, ${r.data.categorias} categorias, ${r.data.colecoes} coleções, ${r.data.pastas ?? 0} pastas.`
      )
      const s = await admin.stats()
      setStats(s.data)
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao recalcular as pastas')
    } finally {
      setRecalculando(false)
    }
  }

  async function confirmarReset() {
    setResetando(true)
    setErro('')
    try {
      await api.post('/admin/reset', { confirmar: 'LIMPAR TUDO' })
      setMostrarConfirmReset(false)
      setTextoConfirm('')
      setJob(null)
      await carregarTudo()
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao limpar o catálogo')
    } finally {
      setResetando(false)
    }
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
    <div className="min-h-screen bg-bg p-6 sm:p-10">
      <div className="max-w-5xl mx-auto">
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
        {mensagemOk && (
          <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg text-sm mb-6">
            {mensagemOk}
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="text-3xl font-bold text-primary">
              {stats ? stats.totalArquivos : '—'}
            </div>
            <div className="text-sm text-muted mt-1">Arquivos no clube</div>
          </div>
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="text-3xl font-bold text-primary">
              {stats ? stats.totalUsuarios : '—'}
            </div>
            <div className="text-sm text-muted mt-1">Usuários</div>
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

        {/* Custo estimado do R2 */}
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

        {/* Progresso da importação */}
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

        {/* Conexão com o Drive */}
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

        {/* Lista de pastas */}
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

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6 mb-8">
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

        {/* Assinantes */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">👥 Assinantes ({usuarios.length})</h2>
          {usuarios.length === 0 ? (
            <div className="text-muted text-sm">
              Nenhum assinante ainda. A lista aparece aqui assim que alguém fizer login.
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((u) => {
                const badge =
                  u.status === 'pago'
                    ? { emoji: '🟢', texto: 'Pago', cor: 'text-primary' }
                    : u.status === 'bloqueado'
                    ? { emoji: '🔴', texto: 'Bloqueado', cor: 'text-pink' }
                    : { emoji: '🟡', texto: 'Pendente', cor: 'text-amber' }
                return (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between border border-border rounded-lg px-4 py-3 flex-wrap gap-2"
                  >
                    <div>
                      <div className="font-semibold text-sm">{u.email}</div>
                      <div className={'text-xs font-semibold ' + badge.cor}>
                        {badge.emoji} {badge.texto}
                        {u.criadoEm ? ' · desde ' + new Date(u.criadoEm).toLocaleDateString('pt-BR') : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {u.status !== 'pago' && (
                        <button
                          onClick={() => alterarStatusUsuario(u.uid, 'pago')}
                          disabled={atualizandoUid === u.uid}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-40"
                        >
                          ✅ Marcar como pago
                        </button>
                      )}
                      {u.status !== 'bloqueado' && (
                        <button
                          onClick={() => alterarStatusUsuario(u.uid, 'bloqueado')}
                          disabled={atualizandoUid === u.uid}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
                        >
                          🚫 Bloquear
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Manutenção */}
        <div className="bg-white rounded-2xl border border-border p-6 mb-8">
          <h2 className="font-bold text-lg mb-2">🔧 Manutenção</h2>
          <p className="text-sm text-muted mb-4">
            Se arquivos foram importados antes de uma correção de categorização,
            use este botão para recalcular as pastas — sem precisar reimportar
            nada do Drive.
          </p>
          <button
            onClick={recalcularPastas}
            disabled={recalculando}
            className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold disabled:opacity-40"
          >
            {recalculando ? 'Recalculando...' : '🔧 Recalcular pastas'}
          </button>
        </div>

        {/* Zona de perigo */}
        <div className="bg-white rounded-2xl border border-pink/30 p-6">
          <h2 className="font-bold text-lg text-pink mb-2">⚠️ Zona de risco</h2>
          <p className="text-sm text-muted mb-4">
            Apaga TODOS os arquivos importados (Firestore + Cloudflare R2) para
            recomeçar a importação do zero.
          </p>
          {!mostrarConfirmReset ? (
            <button
              onClick={() => setMostrarConfirmReset(true)}
              disabled={!!rodando}
              className="px-4 py-2 rounded-lg border border-pink text-pink text-sm font-bold disabled:opacity-40"
            >
              🗑 Limpar catálogo inteiro
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm">
                Para confirmar, digite <strong>LIMPAR TUDO</strong> abaixo:
              </p>
              <input
                type="text"
                value={textoConfirm}
                onChange={(e) => setTextoConfirm(e.target.value)}
                className="border border-border rounded-lg px-4 py-2 text-sm w-full max-w-xs"
                placeholder="LIMPAR TUDO"
              />
              <div className="flex gap-2">
                <button
                  onClick={confirmarReset}
                  disabled={textoConfirm !== 'LIMPAR TUDO' || resetando}
                  className="px-4 py-2 rounded-lg bg-pink text-white text-sm font-bold disabled:opacity-40"
                >
                  {resetando ? 'Limpando...' : 'Confirmar e apagar tudo'}
                </button>
                <button
                  onClick={() => {
                    setMostrarConfirmReset(false)
                    setTextoConfirm('')
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
