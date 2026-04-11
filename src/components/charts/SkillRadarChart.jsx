import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList } from 'recharts'

export default function SkillRadarChart({ data, color = '#3B82F6', size = 'full', variant = 'default' }) {
  const isEditorial = variant === 'editorial'
  const height = size === 'mini' ? 220 : isEditorial ? 300 : 330
  const outerRadius = size === 'mini' ? 78 : isEditorial ? 108 : 122

  const renderScoreDot = ({ cx, cy, payload }) => {
    if (typeof cx !== 'number' || typeof cy !== 'number') return null
    const fill = isEditorial
      ? '#3d3a36'
      : payload?.isLow
        ? '#f2be3f'
        : '#4c76b5'
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isEditorial ? 4 : 5}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    )
  }

  const renderScoreLabel = ({ x, y, value, payload }) => {
    if (typeof x !== 'number' || typeof y !== 'number') return null
    const fill = isEditorial
      ? '#3d3a36'
      : payload?.isLow
        ? '#d39a1f'
        : '#355b8e'
    return (
      <text
        x={x}
        y={y - 8}
        textAnchor="middle"
        fontSize={isEditorial ? 10 : 11}
        fontWeight={700}
        fill={fill}
      >
        {Math.round(value)}
      </text>
    )
  }

  const gridStroke = isEditorial ? '#e3e0da' : '#D8DEE8'
  const tickFill = isEditorial ? '#5c5852' : '#4B5563'
  const radiusTickFill = isEditorial ? '#a8a29e' : '#94A3B8'
  const radarStroke = isEditorial ? '#3d3a36' : color
  const radarFill = isEditorial ? '#4a4845' : color

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius={outerRadius}>
        <PolarGrid stroke={gridStroke} strokeOpacity={isEditorial ? 1 : 0.9} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{
            fontSize: isEditorial ? 9 : size === 'mini' ? 10 : 12,
            fill: tickFill,
            fontWeight: isEditorial ? 600 : 600,
            fontFamily: isEditorial ? 'Inter, system-ui, sans-serif' : undefined,
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fontSize: isEditorial ? 9 : 10, fill: radiusTickFill }}
          tickCount={5}
        />
        {!isEditorial && (
          <Radar
            name="기준 역량"
            dataKey={(entry) => Math.max(0, (entry?.score ?? 0) - 12)}
            stroke="#f2be3f"
            fill="#f2be3f"
            fillOpacity={0.5}
            strokeWidth={1.5}
          />
        )}
        {isEditorial && (
          <Radar
            name="기준"
            dataKey={(entry) => Math.max(0, (entry?.score ?? 0) - 18)}
            stroke="#d6d3cd"
            fill="#d6d3cd"
            fillOpacity={0.22}
            strokeWidth={1}
          />
        )}
        <Radar
          name="역량"
          dataKey="score"
          stroke={radarStroke}
          fill={radarFill}
          fillOpacity={isEditorial ? 0.38 : 0.58}
          strokeWidth={isEditorial ? 2 : 2.6}
          dot={renderScoreDot}
        >
          <LabelList dataKey="score" content={renderScoreLabel} />
        </Radar>
      </RadarChart>
    </ResponsiveContainer>
  )
}
