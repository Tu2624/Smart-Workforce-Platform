import React from 'react'
import { motion } from 'framer-motion'

interface TableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto custom-scrollbar ${className}`}>
      <table className="w-full text-left border-separate border-spacing-0">
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="bg-white/[0.02] border-y border-white/[0.05] px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] first:rounded-l-xl first:border-l last:rounded-r-xl last:border-r"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.03]">
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <motion.tr
      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
      onClick={onClick}
      className={`group transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => {
  return (
    <td className={`px-6 py-4 text-sm text-slate-300 font-medium border-b border-white/[0.02] group-last:border-none ${className}`}>
      {children}
    </td>
  )
}
