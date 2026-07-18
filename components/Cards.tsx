'use client'

import { useState } from 'react'

export interface ProductCardProps {
  id: string
  name: string
  icon: string
  downloads: number
  isNew?: boolean
  isFavorited?: boolean
  onFavorite?: (id: string) => void
  onClick?: (id: string) => void
}

export function ProductCard({
  id,
  name,
  icon,
  downloads,
  isNew,
  isFavorited,
  onFavorite,
  onClick,
}: ProductCardProps) {
  const [fav, setFav] = useState(isFavorited || false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFav(!fav)
    if (onFavorite) onFavorite(id)
  }

  return (
    <div
      onClick={() => onClick?.(id)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:translate-y-[-3px] transition-all cursor-pointer"
    >
      {/* Thumb */}
      <div className="relative h-40 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-5xl">{icon}</div>
        {isNew && (
          <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
            NOVO
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-text truncate">{name}</h3>
          <p className="text-xs text-muted mt-1">{downloads} downloads</p>
        </div>
        <button
          onClick={handleFavorite}
          className="text-xl transition-transform hover:scale-125"
        >
          {fav ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  )
}

export interface CategoryCardProps {
  id: string
  name: string
  icon: string
  count: string
  onClick?: (id: string) => void
}

export function CategoryCard({ id, name, icon, count, onClick }: CategoryCardProps) {
  return (
    <div
      onClick={() => onClick?.(id)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer p-6 text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-sm text-text mb-1">{name}</h3>
      <p className="text-xs text-muted">{count} itens</p>
    </div>
  )
}

export interface DownloadItemProps {
  name: string
  size: string
  date: string
  icon: string
}

export function DownloadItem({ name, size, date, icon }: DownloadItemProps) {
  return (
    <div className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-text truncate">{name}</h4>
        <p className="text-xs text-muted mt-1">{size}</p>
        <p className="text-xs text-muted">{date}</p>
      </div>
      <button className="text-lg text-muted hover:text-text transition">⋮</button>
    </div>
  )
}
