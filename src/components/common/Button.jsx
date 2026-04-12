import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
  /** 크림·차콜 톤 수강생 화면(대시보드 등)과 맞춘 CTA */
  warm: 'bg-[#3d3d3d] text-white hover:bg-[#323232] active:bg-[#282828]',
  secondary: 'bg-white text-primary-500 border border-primary-200 hover:bg-primary-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  danger: 'bg-error-500 text-white hover:bg-error-600 active:bg-error-700',
}

const sizes = {
  sm: 'h-9 px-4 text-body-sm',
  md: 'h-11 px-6 text-body-sm',
  lg: 'h-13 px-8 text-body',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false,
  type = 'button',
  className = '',
  onClick,
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        rounded-xl transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5" />
      ) : null}
      {children}
    </button>
  )
}
