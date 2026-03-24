interface BadgeProps { label: string; variant?: 'success' | 'warning' | 'danger' | 'info' | 'default' }

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-700',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  )
}

export function statusBadgeVariant(status: string): BadgeProps['variant'] {
  const map: Record<string, BadgeProps['variant']> = {
    on_time: 'success', approved: 'success', active: 'success', paid: 'success',
    late: 'warning', pending: 'warning', draft: 'warning', open: 'info',
    absent: 'danger', rejected: 'danger', cancelled: 'danger', closed: 'danger',
    full: 'default', paused: 'default', confirmed: 'info',
  }
  return map[status] ?? 'default'
}
