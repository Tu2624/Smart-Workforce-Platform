import React from 'react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="relative min-h-screen w-full flex bg-slate-900 font-sans overflow-hidden">
      {/* Background Mesh Gradients - Shared across auth pages */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0], x: [-20, 20, -20] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-full h-full max-w-[800px] max-h-[800px] bg-indigo-600/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -45, 0], x: [20, -20, 20] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-full h-full max-w-[800px] max-h-[800px] bg-blue-600/10 blur-[120px] rounded-full"
        />
      </div>

      {/* Main Content Area */}
      <div className={`relative z-10 flex flex-1 w-full min-h-screen ${className}`}>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
