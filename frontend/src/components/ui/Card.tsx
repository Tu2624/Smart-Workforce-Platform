import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  glass?: boolean
  delay?: number
}

const Card: React.FC<CardProps> = ({ children, className = '', glass = true, delay = 0, ...props }) => {
  const glassStyles = 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl'
  const normalStyles = 'bg-white border border-slate-200 shadow-xl'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
      className={`rounded-3xl p-8 lg:p-10 transition-shadow duration-300 ${glass ? glassStyles : normalStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default Card
