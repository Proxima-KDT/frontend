export default function CategoryScoreBar({ categories = [], className = '' }) {
  const getColor = (score) => {
    if (score >= 80) return 'bg-success-500'
    if (score >= 60) return 'bg-student-500'
    if (score >= 40) return 'bg-warning-500'
    return 'bg-error-500'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {categories.map((cat) => (
        <div key={cat.name}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-body-sm text-gray-700">{cat.name}</span>
            <span className="text-body-sm font-semibold text-gray-900">{cat.score}점</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${getColor(cat.score)}`}
              style={{ width: `${cat.score}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
