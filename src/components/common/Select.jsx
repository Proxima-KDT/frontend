import { ChevronDown } from 'lucide-react'

export default function Select({
  label,
  options = [],
  value,
  onChange,
  error,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-body-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full h-11 rounded-xl border bg-white
            px-4 py-2 pr-10
            text-body text-gray-900 appearance-none
            transition-colors duration-150 outline-none
            ${error
              ? 'border-error-500 ring-2 ring-error-100'
              : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-caption text-error-500">{error}</p>
      )}
    </div>
  )
}
