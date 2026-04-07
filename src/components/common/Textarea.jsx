export default function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  rows = 4,
  maxLength,
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
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        className={`
          w-full rounded-xl border bg-white
          px-4 py-3 text-body text-gray-900
          placeholder:text-gray-400 resize-none
          transition-colors duration-150 outline-none
          ${error
            ? 'border-error-500 ring-2 ring-error-100'
            : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
          }
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        `}
      />
      <div className="flex justify-between">
        {error && <p className="text-caption text-error-500">{error}</p>}
        {maxLength && (
          <p className="text-caption text-gray-400 ml-auto">
            {(value || '').length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
