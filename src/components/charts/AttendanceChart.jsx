import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function AttendanceChart({ data, className = '' }) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          />
          <Bar dataKey="출석" fill="#22C55E" radius={[4, 4, 0, 0]} />
          <Bar dataKey="지각" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="결석" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
