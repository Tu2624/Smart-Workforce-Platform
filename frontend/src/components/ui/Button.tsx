import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary:   'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white hover:shadow-glow-cyan hover:brightness-110 focus-visible:ring-cyan-500 shadow-md',
    secondary: 'bg-white/[0.06] backdrop-blur-sm text-slate-200 hover:bg-white/[0.10] border border-white/[0.12] focus-visible:ring-slate-500',
    danger:    'bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-500 shadow-md shadow-red-500/20',
    ghost:     'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] focus-visible:ring-slate-500',
    glass:     'bg-white/[0.06] backdrop-blur-md border border-white/[0.15] text-slate-200 hover:bg-white/[0.10] focus-visible:ring-white/50',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-sm gap-2',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props as any}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  )
}

export default Button
