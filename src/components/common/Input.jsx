export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  icon: Icon,
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
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full h-11 rounded-xl border bg-white
            ${Icon ? 'pl-10' : 'px-4'} pr-4 py-3
            text-body text-gray-900 placeholder:text-gray-400
            transition-colors duration-150 outline-none
            ${error
              ? 'border-error-500 ring-2 ring-error-100'
              : 'border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-caption text-error-500">{error}</p>
      )}
    </div>
  )
}
