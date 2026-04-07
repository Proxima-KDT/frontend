export default function MatchScoreBar({ score = 0, className = '' }) {
  const getColor = () => {
    if (score >= 80) return 'bg-success-500'
    if (score >= 60) return 'bg-student-500'
    if (score >= 40) return 'bg-warning-500'
    return 'bg-error-500'
  }

  const getTextColor = () => {
    if (score >= 80) return 'text-success-500'
    if (score >= 60) return 'text-student-500'
    if (score >= 40) return 'text-warning-500'
    return 'text-error-500'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-gray-200 rounded-full">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColor()}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-body-sm font-semibold min-w-[3rem] text-right ${getTextColor()}`}>
        {score}%
      </span>
    </div>
  )
}
