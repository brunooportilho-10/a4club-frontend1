'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { ProductCard, CategoryCard, DownloadItem } from '@/components/Cards'
import { useAuth } from '@/lib/auth'
import { catalog } from '@/lib/api'

interface Arquivo {
  id: string
  nome: string
  extensao: string
  tamanho: string
  pasta?: string
}

interface Pasta {
  id: string
  nome: string
  caminho: string
}

export default function HomePage() {
  const router = useRouter()
  const { user, hydrate } = useAuth()
  const [loading, setLoading] = useState(true)
  const [categorias, setCategorias] = useState<Pasta[]>([])
  const [novidades, setNovidades] = useState<Arquivo[]>([])

  useEffect(() => {
    hydrate()
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchHome = async () => {
      try {
        const response = await catalog.home()
        setCategorias(response.data.categorias || [])
        setNovidades(response.data.novidades || [])
      } catch (error) {
        console.error('Erro ao carregar home:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHome()
  }, [user, router])

  const handleSearch = (query: string) => {
    router.push(`/explore?q=${encodeURIComponent(query)}`)
  }

  const handleProductClick = (id: string) => {
    router.push(`/file/${id}`)
  }

  const stats = [
    { icon: '📁', label: 'Arquivos disponíveis', value: '12.458' },
    { icon: '❤️', label: 'Favoritos', value: '156' },
    { icon: '⬇️', label: 'Downloads', value: '892' },
    { icon: '⭐', label: 'Avaliação média', value: '4,9' },
  ]

  const mockDownloads = [
    { name: 'Ursinho Baloeiro', size: 'ZIP • 45 MB', date: 'Hoje às 10:23', icon: '🎈' },
    { name: 'Dinossauro Aquarela', size: 'ZIP • 38 MB', date: 'Ontem às 15:42', icon: '🦕' },
    { name: 'Astronauta Rosa', size: 'ZIP • 52 MB', date: '24/06/2026', icon: '👩‍🚀' },
  ]

  const iconMap: { [key: string]: string } = {
    'Caixinhas': '🎁',
    'Kit Festa': '🏰',
    'Topos de Bolo': '🎂',
    'Maternidade': '🧸',
    'Tags e Rótulos': '🏷️',
    'Papéis Digitais': '🎨',
    'Fontes': '🔤',
    'Mockups': '☕',
  }

  const emojiMap: { [key: string]: string } = {
    'Kit Safari Baby': '🦁',
    'Stitch Aquarela': '🩵',
    'Bailarina Encantada': '🩰',
    'Fazendinha Baby': '🐮',
    'Arco-íris Boho': '🌈',
  }

  if (!user || loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onSearch={handleSearch} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Olá, {user.email?.split('@')[0]}! 👋</h1>
            <p className="text-muted text-lg">
              Que bom ter você aqui! Prepare-se para criar projetos incríveis.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm flex items-center gap-4"
              >
                <div className="text-3xl">{stat.icon}</div>
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner */}
          <div className="grad-primary rounded-2xl p-6 md:p-8 text-white mb-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">🌟</div>
              <div>
                <h2 className="font-bold text-2xl mb-2">Novidades da semana!</h2>
                <p className="opacity-90">
                  25 novos temas adicionados para você criar sem limites.
                </p>
              </div>
            </div>
            <button className="bg-white text-primary font-bold px-6 py-3 rounded-lg whitespace-nowrap hover:shadow-lg transition">
              Ver novidades
            </button>
          </div>

          {/* Categories */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Categorias em destaque</h2>
              <a href="/categories" className="text-primary font-semibold hover:underline">
                Ver todas
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {categorias.slice(0, 8).map((cat) => (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  name={cat.nome}
                  icon={iconMap[cat.nome] || '📁'}
                  count={`${Math.floor(Math.random() * 3000) + 1000} itens`}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </div>

          {/* New Releases */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Lançamentos em destaque</h2>
              <a href="/new" className="text-primary font-semibold hover:underline">
                Ver todas
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
              {novidades.slice(0, 5).map((arq, i) => (
                <ProductCard
                  key={arq.id}
                  id={arq.id}
                  name={arq.nome}
                  icon={emojiMap[arq.nome] || '📦'}
                  downloads={Math.floor(Math.random() * 400) + 100}
                  isNew={i < 3}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </div>

          {/* Recent Downloads */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Seus últimos downloads</h2>
              <a href="/downloads" className="text-primary font-semibold hover:underline">
                Ver todas
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDownloads.map((dl, i) => (
                <DownloadItem
                  key={i}
                  name={dl.name}
                  size={dl.size}
                  date={dl.date}
                  icon={dl.icon}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
