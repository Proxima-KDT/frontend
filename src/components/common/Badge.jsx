const variants = {
  default: 'bg-primary-100 text-primary-700',
  success: 'bg-success-50 text-green-700',
  warning: 'bg-warning-50 text-amber-700',
  error: 'bg-error-50 text-red-700',
  info: 'bg-info-50 text-blue-700',
  /** Ethereal / attendance-friendly (cream + sage, terracotta, gold) */
  'soft-success': 'bg-[#e8f0e9] text-[#3d6b4f]',
  'soft-error': 'bg-[#f3e8e8] text-[#944848]',
  'soft-warning': 'bg-[#faf4e8] text-[#9a6220]',
  'soft-amber': 'bg-[#f8f2e0] text-[#7a6120]',
  'soft-info': 'bg-[#e8eef5] text-[#3d5a6e]',
  'difficulty-low': 'bg-green-100 text-green-700',
  'difficulty-mid': 'bg-amber-100 text-amber-700',
  'difficulty-high': 'bg-red-100 text-red-700',
  student: 'bg-student-50 text-student-600',
  teacher: 'bg-teacher-50 text-teacher-600',
  admin: 'bg-admin-50 text-admin-600',
}

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full px-3 py-1
        text-caption font-medium
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
