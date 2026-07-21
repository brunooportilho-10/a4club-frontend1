'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import api, { admin, comprovantes } from '@/lib/api'

interface Usuario {
  uid: string
  email: string
  status: string
  criadoEm?: string
  validoAte?: string
  plano?: string
}

const PRAZOS = [
  { meses: 1, label: '1 mês' },
  { meses: 3, label: '3 meses' },
  { meses: 6, label: '6 meses' },
  { meses: 12, label: '12 meses' },
]

const BADGES: Record<string, { emoji: string; texto: string; cor: string }> = {
  pago: { emoji: '🟢', texto: 'Pago', cor: 'text-primary' },
  pendente: { emoji: '🟡', texto: 'Pendente', cor: 'text-amber' },
  suspenso: { emoji: '🟠', texto: 'Suspenso', cor: 'text-amber' },
  bloqueado: { emoji: '🔴', texto: 'Bloqueado', cor: 'text-pink' },
  vencido: { emoji: '⏰', texto: 'Vencido', cor: 'text-pink' },
}

function formatarData(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR')
}

// Dias restantes ate o vencimento (negativo se ja venceu)
function diasAteVencer(validoAte?: string) {
  if (!validoAte) return null
  const diffMs = new Date(validoAte).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

const DIAS_AVISO_VENCIMENTO = 7

export default function AdminClientesPage() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [prazoSelecionado, setPrazoSelecionado] = useState<Record<string, number>>({})
  const [atualizandoUid, setAtualizandoUid] = useState('')
  const [comprovantesAbertos, setComprovantesAbertos] = useState<Record<string, any[]>>({})
  const [carregandoComprovantesUid, setCarregandoComprovantesUid] = useState('')

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const us = await admin.usuarios()
      setUsuarios(us.data.usuarios || [])
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao carregar assinantes')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!token) return
    carregar()
  }, [token, carregar])

  async function ativar(uid: string) {
    const meses = prazoSelecionado[uid] || 1
    setAtualizandoUid(uid)
    try {
      await admin.setStatusUsuario(uid, 'pago', meses)
      await carregar()
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao ativar assinante')
    } finally {
      setAtualizandoUid('')
    }
  }

  async function mudarStatus(uid: string, status: string) {
    setAtualizandoUid(uid)
    try {
      await admin.setStatusUsuario(uid, status)
      await carregar()
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao atualizar assinante')
    } finally {
      setAtualizandoUid('')
    }
  }

  async function alternarComprovantes(uid: string) {
    if (comprovantesAbertos[uid]) {
      setComprovantesAbertos((prev) => {
        const novo = { ...prev }
        delete novo[uid]
        return novo
      })
      return
    }
    setCarregandoComprovantesUid(uid)
    try {
      const r = await comprovantes.doUsuario(uid)
      setComprovantesAbertos((prev) => ({ ...prev, [uid]: r.data.comprovantes || [] }))
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao carregar comprovantes')
    } finally {
      setCarregandoComprovantesUid('')
    }
  }

  async function abrirComprovante(uid: string, id: string) {
    try {
      const r = await comprovantes.url(uid, id)
      window.open(r.data.url, '_blank')
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao abrir comprovante')
    }
  }

  async function excluir(u: Usuario) {
    if (!window.confirm(`Excluir a conta de ${u.email}? Ela vai precisar se cadastrar novamente do zero. Essa ação não pode ser desfeita.`)) return
    setAtualizandoUid(u.uid)
    try {
      await admin.excluirUsuario(u.uid)
      setUsuarios((prev) => prev.filter((x) => x.uid !== u.uid))
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao excluir assinante')
    } finally {
      setAtualizandoUid('')
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          👥 <span className="text-primary">Clientes</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Gerencie o acesso e o plano de cada assinante do A4 CLUB
        </p>
      </div>

      {erro && (
        <div className="bg-pink/10 border border-pink text-pink px-4 py-3 rounded-lg text-sm mb-6">
          {erro}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-bold text-lg mb-4">Assinantes ({usuarios.length})</h2>

        {carregando ? (
          <div className="text-muted text-sm">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="text-muted text-sm">
            Nenhum assinante ainda. A lista aparece aqui assim que alguém se cadastrar.
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((u) => {
              const badge = BADGES[u.status] || BADGES.pendente
              const prazo = prazoSelecionado[u.uid] || 1
              const dias = u.status === 'pago' ? diasAteVencer(u.validoAte) : null
              const vencendoEmBreve = dias !== null && dias >= 0 && dias <= DIAS_AVISO_VENCIMENTO
              const jaVencido = u.status === 'vencido' || (dias !== null && dias < 0)

              const corCard = jaVencido
                ? 'bg-pink/5 border-pink/40'
                : vencendoEmBreve
                ? 'bg-amber/10 border-amber/50'
                : 'bg-white border-border'

              return (
                <div
                  key={u.uid}
                  className={'border rounded-xl px-4 py-4 transition ' + corCard}
                >
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                    <div>
                      <div className="font-semibold text-sm">{u.email}</div>
                      <div className={'text-xs font-semibold mt-0.5 ' + badge.cor}>
                        {badge.emoji} {badge.texto}
                        {u.criadoEm ? ' · desde ' + formatarData(u.criadoEm) : ''}
                      </div>
                      {u.status === 'pago' && u.validoAte && (
                        <div className="text-xs text-muted mt-0.5">
                          Válido até {formatarData(u.validoAte)}
                          {vencendoEmBreve ? ` · vence em ${dias} dia(s)` : ''}
                          {u.plano ? ' · plano ' + u.plano.replace('_', ' ') : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={prazo}
                      onChange={(e) =>
                        setPrazoSelecionado((prev) => ({ ...prev, [u.uid]: Number(e.target.value) }))
                      }
                      className="border border-border rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      {PRAZOS.map((p) => (
                        <option key={p.meses} value={p.meses}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => ativar(u.uid)}
                      disabled={atualizandoUid === u.uid}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-40"
                    >
                      {u.status === 'pago' ? '🔁 Renovar' : '✅ Ativar'}
                    </button>
                    {u.status !== 'suspenso' && (
                      <button
                        onClick={() => mudarStatus(u.uid, 'suspenso')}
                        disabled={atualizandoUid === u.uid}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
                      >
                        ⏸ Suspender
                      </button>
                    )}
                    {u.status !== 'bloqueado' && (
                      <button
                        onClick={() => mudarStatus(u.uid, 'bloqueado')}
                        disabled={atualizandoUid === u.uid}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
                      >
                        🚫 Bloquear
                      </button>
                    )}
                    <button
                      onClick={() => excluir(u)}
                      disabled={atualizandoUid === u.uid}
                      className="px-3 py-1.5 rounded-lg border border-pink/30 text-pink text-xs font-bold disabled:opacity-40"
                    >
                      🗑 Excluir
                    </button>
                    <button
                      onClick={() => alternarComprovantes(u.uid)}
                      disabled={carregandoComprovantesUid === u.uid}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
                    >
                      {carregandoComprovantesUid === u.uid
                        ? 'Carregando...'
                        : comprovantesAbertos[u.uid]
                        ? '📎 Ocultar comprovantes'
                        : '📎 Ver comprovantes'}
                    </button>
                  </div>

                  {comprovantesAbertos[u.uid] && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {comprovantesAbertos[u.uid].length === 0 ? (
                        <div className="text-xs text-muted">Nenhum comprovante enviado.</div>
                      ) : (
                        <div className="space-y-1.5">
                          {comprovantesAbertos[u.uid].map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => abrirComprovante(u.uid, c.id)}
                              className="flex items-center justify-between w-full text-left border border-border rounded-lg px-3 py-2 text-xs hover:border-primary/40 transition"
                            >
                              <span className="truncate">📎 {c.nome}</span>
                              <span className="text-muted flex-shrink-0 ml-2">
                                {new Date(c.enviadoEm).toLocaleDateString('pt-BR')}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
