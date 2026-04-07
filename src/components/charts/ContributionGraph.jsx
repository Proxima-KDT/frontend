import { useMemo } from 'react'

const colors = ['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600']

export default function ContributionGraph({ data = [], className = '' }) {
  const weeks = useMemo(() => {
    const result = []
    let week = []
    data.forEach((day, i) => {
      const dayOfWeek = new Date(day.date).getDay()
      if (i === 0) {
        for (let j = 0; j < dayOfWeek; j++) {
          week.push(null)
        }
      }
      week.push(day)
      if (dayOfWeek === 6 || i === data.length - 1) {
        result.push(week)
        week = []
      }
    })
    return result
  }, [data])

  const months = useMemo(() => {
    const monthLabels = []
    let currentMonth = null
    weeks.forEach((week, i) => {
      const firstDay = week.find((d) => d !== null)
      if (firstDay) {
        const month = new Date(firstDay.date).getMonth()
        if (month !== currentMonth) {
          currentMonth = month
          monthLabels.push({ index: i, label: `${month + 1}월` })
        }
      }
    })
    return monthLabels
  }, [weeks])

  return (
    <div className={className}>
      {/* 월 라벨 */}
      <div className="flex mb-1 ml-8">
        {months.map((m) => (
          <span
            key={m.index}
            className="text-caption text-gray-400"
            style={{ marginLeft: `${m.index * 13}px`, position: 'absolute' }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-[3px] overflow-x-auto pt-6">
        {/* 요일 라벨 */}
        <div className="flex flex-col gap-[3px] mr-1 shrink-0">
          {['', '월', '', '수', '', '금', ''].map((d, i) => (
            <span key={i} className="text-caption text-gray-400 h-[11px] leading-[11px]">
              {d}
            </span>
          ))}
        </div>

        {/* 그리드 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[11px] h-[11px] rounded-sm ${
                  day === null
                    ? 'bg-transparent'
                    : colors[Math.min(day.count, 3)]
                }`}
                title={day ? `${day.date}: ${day.count}건` : ''}
              />
            ))}
            {/* 빈 칸 채우기 */}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`empty-${i}`} className="w-[11px] h-[11px]" />
            ))}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-caption text-gray-400 mr-1">적음</span>
        {colors.map((c, i) => (
          <div key={i} className={`w-[11px] h-[11px] rounded-sm ${c}`} />
        ))}
        <span className="text-caption text-gray-400 ml-1">많음</span>
      </div>
    </div>
  )
}
