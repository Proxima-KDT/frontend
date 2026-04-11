export default function Table({ columns, data, onRowClick, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-[#ebe8e3] bg-white/85 ${className}`}>
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-[#ece8e1] bg-[#f8f6f1]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-4 py-3 text-left text-caption font-semibold tracking-wide text-[#7a756c]"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`
                border-b border-[#f0ece6] last:border-0
                ${onRowClick ? 'hover:bg-[#faf8f4] cursor-pointer' : ''}
                transition-colors
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-body-sm text-[#3f3b35]"
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
