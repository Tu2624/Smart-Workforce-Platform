import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="relative min-h-screen w-full flex bg-slate-950 font-sans overflow-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[650px] h-[650px] bg-cyan-600/[0.12] blur-[140px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[550px] h-[550px] bg-blue-600/[0.10] blur-[120px] rounded-full" />
        <div className="absolute top-[40%] left-[30%] w-[450px] h-[450px] bg-purple-600/[0.08] blur-[100px] rounded-full" />
        <div className="absolute bottom-[5%] right-[5%] w-[280px] h-[280px] bg-cyan-500/[0.05] blur-[80px] rounded-full" />
      </div>

      <div className={`relative z-10 flex flex-1 w-full min-h-screen ${className}`}>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
