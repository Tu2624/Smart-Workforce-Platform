import React from 'react'
import { motion } from 'framer-motion'

export const LoginIllustration = () => (
  <motion.svg
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    initial="hidden"
    animate="visible"
  >
    <motion.circle
      cx="100"
      cy="100"
      r="80"
      stroke="white"
      strokeWidth="2"
      strokeDasharray="5 5"
      initial={{ rotate: 0, opacity: 0.2 }}
      animate={{ rotate: 360, opacity: 0.5 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.rect
      x="60"
      y="70"
      width="80"
      height="60"
      rx="8"
      stroke="white"
      strokeWidth="4"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
    <motion.path
      d="M80 100H120"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.5, duration: 1 }}
    />
    <motion.path
      d="M80 115H105"
      stroke="white"
      strokeWidth="4"
      strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ delay: 0.7, duration: 1 }}
    />
    <motion.circle
      cx="140"
      cy="60"
      r="15"
      fill="white"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ delay: 1, duration: 0.5 }}
    />
  </motion.svg>
)

export const RegisterIllustration = () => (
  <motion.svg
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    {/* Abstract Background Shapes */}
    <motion.path
      d="M50 250C100 200 200 300 350 200"
      stroke="rgba(255,255,255,0.1)"
      strokeWidth="20"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, ease: "easeInOut" }}
    />

    {/* Team Collaboration Symbols */}
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <rect x="150" y="100" width="100" height="120" rx="12" fill="rgba(255,255,255,0.05)" stroke="white" strokeWidth="2" />
      <motion.circle 
        cx="200" cy="80" r="30" 
        stroke="white" strokeWidth="4"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path 
        d="M170 140H230" stroke="white" strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 1 }}
      />
      <motion.path 
        d="M170 165H210" stroke="white" strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 1 }}
      />
    </motion.g>

    {/* Floating Data Bubbles */}
    {[
      { x: 100, y: 120, r: 20, d: 2 },
      { x: 300, y: 150, r: 15, d: 2.5 },
      { x: 280, y: 80, r: 25, d: 3 },
    ].map((b, i) => (
      <motion.circle
        key={i}
        cx={b.x} cy={b.y} r={b.r}
        fill="rgba(255,255,255,0.1)"
        stroke="white"
        strokeWidth="1"
        animate={{ 
          y: [b.y, b.y - 20, b.y],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </motion.svg>
)
