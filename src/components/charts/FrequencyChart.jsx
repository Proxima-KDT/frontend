import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

export default function FrequencyChart({ data, className = '' }) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" barSize={16}>
          <XAxis type="number" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis
            type="category"
            dataKey="topic"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
          <Bar dataKey="count" fill="#7C3AED" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
