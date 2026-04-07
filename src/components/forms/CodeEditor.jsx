export default function CodeEditor({
  value = '',
  onChange,
  language = 'python',
  readOnly = false,
  placeholder = '코드를 입력하세요...',
  className = '',
}) {
  const lines = (value || placeholder).split('\n')

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <span className="text-caption text-gray-400">{language}</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
      </div>
      <div className="flex bg-gray-900">
        {/* 줄 번호 */}
        <div className="flex flex-col items-end py-4 px-3 bg-gray-900 border-r border-gray-800 select-none">
          {lines.map((_, i) => (
            <span key={i} className="text-caption text-gray-600 leading-6 font-mono">
              {i + 1}
            </span>
          ))}
        </div>
        {/* 코드 영역 */}
        <textarea
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          className={`
            flex-1 bg-gray-900 text-gray-100 font-mono text-body-sm
            p-4 leading-6 resize-none outline-none min-h-[200px]
            placeholder:text-gray-600
            ${readOnly ? 'cursor-default' : ''}
          `}
        />
      </div>
    </div>
  )
}
