'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import { admin } from '@/lib/api'

interface Drive {
  id: string
  name: string
}

interface JobStatus {
  id: string
  status: string
  totalArquivos: number
  concluidos: number
  erros: number
  percentualConcluido: number
  logs: Array<{ nivel: string; mensagem: string; criadoEm: string }>
}

interface Stats {
  stats: Array<{ status: string; _count: number; _sum: { tamanho: string } }>
  importacaoEmAndamento: JobStatus | null
}

export default function AdminPage() {
  const router = useRouter()
  const { user, hydrate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [drives, setDrives] = useState<Drive[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selectedDrive, setSelectedDrive] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        const [drivesRes, statsRes] = await Promise.all([
          admin.drives(),
          admin.stats(),
        ])
        setDrives(drivesRes.data.drives || [])
        setStats(statsRes.data)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  // Poll job status
  useEffect(() => {
    if (!jobId) return

    const interval = setInterval(async () => {
      try {
        const res = await admin.jobStatus(jobId)
        setJobStatus(res.data)

        if (res.data.status === 'CONCLUIDO' || res.data.status === 'ERRO') {
          clearInterval(interval)
          setImporting(false)
        }
      } catch (error) {
        console.error('Erro ao atualizar job:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId])

  const handleImport = async () => {
    if (!selectedDrive) {
      alert('Selecione um Shared Drive')
      return
    }

    setImporting(true)
    try {
      const drive = drives.find((d) => d.id === selectedDrive)
      const res = await admin.importar(selectedDrive, drive?.name || 'Shared Drive')
      setJobId(res.data.jobId)
    } catch (error) {
      console.error('Erro ao iniciar importação:', error)
      setImporting(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted text-lg mb-8">
            Gerenciar importações de Google Drive
          </p>

          {/* Importação */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold mb-6">Importar Shared Drive</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Selecione o Shared Drive</label>
                <select
                  value={selectedDrive}
                  onChange={(e) => setSelectedDrive(e.target.value)}
                  disabled={importing}
                  className="w-full border border-border rounded-lg px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">-- Selecione --</option>
                  {drives.map((drive) => (
                    <option key={drive.id} value={drive.id}>
                      {drive.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">&nbsp;</label>
                <button
                  onClick={handleImport}
                  disabled={importing || !selectedDrive}
                  className="w-full grad-btn text-white font-bold py-3 rounded-lg transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importando...' : '📥 Importar Agora'}
                </button>
              </div>
            </div>

            {importing && jobStatus && (
              <div className="bg-bg rounded-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {jobStatus.status === 'MAPEANDO' && '📍 Mapeando Drive...'}
                      {jobStatus.status === 'BAIXANDO' && '⬇️ Baixando arquivos...'}
                      {jobStatus.status === 'CONCLUIDO' && '✅ Importação concluída!'}
                      {jobStatus.status === 'ERRO' && '❌ Erro na importação'}
                    </span>
                    <span className="text-sm text-muted">
                      {jobStatus.percentualConcluido}%
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-primary-2 h-full transition-all"
                      style={{ width: `${jobStatus.percentualConcluido}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-muted">
                    {jobStatus.concluidos} de {jobStatus.totalArquivos} arquivos
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 h-64 overflow-y-auto text-xs font-mono">
                  {jobStatus.logs.map((log, i) => (
                    <div key={i} className="mb-1">
                      <span
                        className={
                          log.nivel === 'ERRO'
                            ? 'text-pink'
                            : log.nivel === 'AVISO'
                            ? 'text-amber'
                            : 'text-green'
                        }
                      >
                        [{log.nivel}]
                      </span>{' '}
                      {log.mensagem}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Estatísticas</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.stats.map((stat, i) => (
                  <div key={i} className="bg-bg rounded-lg p-4">
                    <div className="text-sm text-muted mb-2">
                      {stat.status === 'CONCLUIDO' && '✅ Concluído'}
                      {stat.status === 'PENDENTE' && '⏳ Pendente'}
                      {stat.status === 'ERRO' && '❌ Erro'}
                      {stat.status === 'IGNORADO' && '⊘ Ignorado'}
                    </div>
                    <div className="text-2xl font-bold">{stat._count}</div>
                    <div className="text-xs text-muted mt-1">
                      {stat._sum.tamanho}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
