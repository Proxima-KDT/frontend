export default function ProgressBar({
  value = 0,
  color = 'bg-primary-500',
  label,
  showValue = true,
  size = 'md',
  className = '',
}) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-body-sm text-gray-700">{label}</span>}
          {showValue && (
            <span className="text-caption font-medium text-gray-500">{Math.round(value)}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heights[size]}`}>
        <div
          className={`${color} ${heights[size]} rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
