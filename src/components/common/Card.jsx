export default function Card({
  children,
  hoverable = false,
  onClick,
  padding = 'p-6',
  className = '',
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white/92 border border-[#ebe8e3] rounded-2xl shadow-[0_14px_32px_rgba(45,42,38,0.08)]
        ${padding}
        ${hoverable ? 'hover:shadow-[0_18px_36px_rgba(45,42,38,0.12)] hover:-translate-y-0.5 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}
