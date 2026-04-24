import React from 'react'

interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', lines = 1 }) => {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`animate-pulse bg-slate-700/50 rounded-lg h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'} ${className}`} />
        ))}
      </div>
    )
  }
  return <div className={`animate-pulse bg-slate-700/50 rounded-lg ${className}`} />
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-800/50 rounded-2xl p-5 space-y-3 ${className}`}>
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-3 w-2/3" />
  </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-px">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 px-6 py-4 bg-slate-800/20">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)
