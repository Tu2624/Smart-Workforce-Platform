import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  glass?: boolean
  interactive?: boolean
  delay?: number
}

const Card: React.FC<CardProps> = ({ children, className = '', glass: _glass, interactive = false, delay = 0, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: [0.25, 0, 0, 1] }}
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-glass ${interactive ? 'hover:border-white/[0.14] transition-colors duration-200 cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card
