import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-2.5 bg-slate-900/80 border text-slate-100 placeholder:text-slate-600
              rounded-xl text-sm transition-all duration-150 outline-none
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              ${error
                ? 'border-red-500/50 focus:border-red-400 focus:ring-2 focus:ring-red-500/15'
                : 'border-white/[0.10] focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15 focus:bg-slate-900'
              }
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-red-400 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
