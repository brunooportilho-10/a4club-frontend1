'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'

interface JobAgrupar {
  id: string
  status: string
  arquivosLidos?: number
  gruposEncontrados?: number
  arquivosMovidos?: number
  pastasCriadas?: number
  mensagem?: string
}

export default function AdminManutencaoPage() {
  const { token } = useAuth()
  const [erro, setErro] = useState('')
  const [mensagemOk, setMensagemOk] = useState('')
  const [recalculando, setRecalculando] = useState(false)
  const [jobAgrupar, setJobAgrupar] = useState<JobAgrupar | null>(null)
  const [resetando, setResetando] = useState(false)
  const [mostrarConfirmReset, setMostrarConfirmReset] = useState(false)
  const [textoConfirm, setTextoConfirm] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!token) return
    // Se ja existe um agrupamento rodando no servidor (ex: a pagina foi recarregada),
    // reconecta o acompanhamento automaticamente em vez de deixar a tela "cega".
    ;(async () => {
      try {
        const r = await api.get('/admin/jobs')
        const jobs = r.data.jobs || []
        const emAndamento = jobs.find(
          (j: any) => j.tipo === 'agrupar' && ['iniciando', 'lendo', 'movendo'].includes(j.status)
        )
        if (emAndamento) {
          setJobAgrupar(emAndamento)
          acompanharAgrupamento(emAndamento.id)
        }
      } catch (e) {
        /* silencioso - so eh uma conveniencia */
      }
    })()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [token])

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

  function acompanharAgrupamento(jobId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    const buscar = async () => {
      try {
        const r = await api.get(`/admin/job/${jobId}`)
        const j: JobAgrupar = r.data.job
        setJobAgrupar(j)
        if (['concluido', 'erro', 'interrompido'].includes(j.status)) {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
          if (j.status === 'concluido') {
            setMensagemOk(
              `Agrupamento concluído: ${j.gruposEncontrados ?? 0} pastas novas criadas, ${j.arquivosMovidos ?? 0} arquivos organizados (de ${j.arquivosLidos ?? 0} analisados).`
            )
          } else if (j.status === 'erro') {
            setErro(j.mensagem || 'Erro ao agrupar arquivos')
          } else {
            setErro('O servidor reiniciou durante o agrupamento. Clique em agrupar novamente (o que já foi organizado é mantido).')
          }
        }
      } catch (e) {
        /* mantem o poll */
      }
    }
    buscar()
    pollRef.current = setInterval(buscar, 2500)
  }

  async function agruparArquivos() {
    setErro('')
    setMensagemOk('')
    setJobAgrupar(null)
    try {
      const r = await api.post('/admin/agrupar-arquivos', {})
      acompanharAgrupamento(r.data.jobId)
    } catch (e: any) {
      if (e.response?.status === 409 && e.response?.data?.jobId) {
        // Ja tem um rodando (ex: clique duplicado, ou continuando de antes) - so reconecta
        acompanharAgrupamento(e.response.data.jobId)
        return
      }
      setErro(e.response?.data?.erro || 'Erro ao iniciar o agrupamento')
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

  const agrupando = !!jobAgrupar && ['iniciando', 'lendo', 'movendo'].includes(jobAgrupar.status)

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

      <div className="bg-white rounded-2xl border border-border p-6 mb-8">
        <h2 className="font-bold text-lg mb-2">📦 Agrupar arquivos por nome</h2>
        <p className="text-sm text-muted mb-4">
          Junta arquivos soltos que têm o mesmo nome (ex: "Bolsa.jpeg" + "Bolsa.rar")
          dentro de uma pastinha com esse nome, em vez de deixá-los espalhados na lista.
          Só agrupa quando há 2 ou mais arquivos com o mesmo nome — arquivo sozinho
          continua solto. Importações futuras já saem organizadas automaticamente;
          use este botão para reorganizar o que já foi importado antes. Roda em segundo
          plano no servidor (não trava a tela), mas se você sair desta página o
          acompanhamento do progresso se perde — o processo continua rodando mesmo assim.
        </p>
        <button
          onClick={agruparArquivos}
          disabled={agrupando}
          className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-bold disabled:opacity-40"
        >
          {agrupando ? '⏳ Agrupando...' : '📦 Agrupar arquivos por nome'}
        </button>

        {jobAgrupar && agrupando && (
          <div className="mt-4 bg-primary/5 border border-primary/30 rounded-lg px-4 py-3 text-sm">
            <div className="font-semibold mb-1">
              {jobAgrupar.status === 'lendo' && '🔍 Analisando arquivos...'}
              {jobAgrupar.status === 'movendo' && '📂 Organizando pastas...'}
              {jobAgrupar.status === 'iniciando' && '⏳ Iniciando...'}
            </div>
            <div className="text-muted text-xs">
              {jobAgrupar.mensagem}
              {jobAgrupar.status === 'movendo' && (
                <>
                  {' '}· {jobAgrupar.pastasCriadas ?? 0} pastas criadas · {jobAgrupar.arquivosMovidos ?? 0} arquivos movidos
                </>
              )}
            </div>
          </div>
        )}
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
