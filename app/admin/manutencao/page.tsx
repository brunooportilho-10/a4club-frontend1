'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'

export default function AdminManutencaoPage() {
  const { token } = useAuth()
  const [erro, setErro] = useState('')
  const [mensagemOk, setMensagemOk] = useState('')
  const [recalculando, setRecalculando] = useState(false)
  const [resetando, setResetando] = useState(false)
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')

  async function recalcularPastas() {
    setRecalculando(true)
    setErro('')
    setMensagemOk('')
    try {
      const r = await api.post('/admin/backfill-colecoes', {})
      setMensagemOk(
        `Recalculado: ${r.data.totalArquivos} arquivos, ${r.data.categorias} categorias, ${r.data.colecoes} coleções, ${r.data.pastas ?? 0} pastas.`
      )
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao recalcular as pastas')
    } finally {
      setRecalculando(false)
    }
  }

  async function confirmarReset() {
    setResetando(true)
    setErro('')
    setMensagemOk('')
    try {
      const r = await api.post('/admin/reset', { confirmar: 'LIMPAR TUDO' })
      setMensagemOk(
        `Catálogo limpo: ${r.data.apagadosFirestore} registros e ${r.data.apagadosR2} arquivos removidos.`
      )
      setMostrarConfirmReset(false)
      setTextoConfirm('')
    } catch (e: any) {
      setErro(e.response?.data?.erro || 'Erro ao limpar o catálogo')
    } finally {
      setResetando(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          🔧 <span className="text-primary">Manutenção</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Ferramentas de organização e limpeza do catálogo
        </p>
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

      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="font-bold text-lg mb-2">🔧 Recalcular pastas</h2>
        <p className="text-sm text-muted mb-4">
          Se arquivos foram importados antes de uma correção de categorização,
          use este botão para recalcular categorias e pastas — sem precisar
          reimportar nada do Drive.
        </p>
        <button
          onClick={recalcularPastas}
          disabled={recalculando}
          className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold disabled:opacity-40"
        >
          {recalculando ? 'Recalculando...' : '🔧 Recalcular pastas'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-pink/30 p-6">
        <h2 className="font-bold text-lg text-pink mb-2">⚠️ Zona de risco</h2>
        <p className="text-sm text-muted mb-4">
          Apaga TODOS os arquivos importados (Firestore + Cloudflare R2) para
          recomeçar a importação do zero.
        </p>
        {!mostrarConfirmReset ? (
          <button
            onClick={() => setMostrarConfirmReset(true)}
            className="px-4 py-2 rounded-lg border border-pink text-pink text-sm font-bold"
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
    </>
  )
}
