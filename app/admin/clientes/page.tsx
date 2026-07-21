'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import api, { admin } from '@/lib/api'

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

export default function AdminClientesPage() {
  const { token } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [prazoSelecionado, setPrazoSelecionado] = useState<Record<string, number>>({})
  const [atualizandoUid, setAtualizandoUid] = useState('')

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
              return (
                <div
                  key={u.uid}
                  className="border border-border rounded-xl px-4 py-4"
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
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
