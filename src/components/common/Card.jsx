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
        bg-white border border-gray-200 rounded-2xl shadow-sm
        ${padding}
        ${hoverable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  )
}
