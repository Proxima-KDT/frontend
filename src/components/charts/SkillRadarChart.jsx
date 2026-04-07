import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

export default function SkillRadarChart({ data, color = '#3B82F6', size = 'full' }) {
  const height = size === 'mini' ? 200 : 300

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={size === 'mini' ? 70 : 110}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fontSize: size === 'mini' ? 10 : 12, fill: '#6B7280' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: 10, fill: '#9CA3AF' }}
          tickCount={5}
        />
        <Radar
          name="역량"
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
