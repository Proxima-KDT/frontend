const trackOn = {
  primary: 'bg-primary-500',
  /** 질문 폼 등 — 대시보드 차콜 액센트와 통일 */
  warm: 'bg-[#3d3d3d]',
}

export default function Toggle({
  checked,
  onChange,
  label,
  className = '',
  colorScheme = 'primary',
}) {
  const onClass = trackOn[colorScheme] || trackOn.primary
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer
          ${checked ? onClass : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      {label && <span className="text-body-sm text-gray-700">{label}</span>}
    </label>
  )
}
