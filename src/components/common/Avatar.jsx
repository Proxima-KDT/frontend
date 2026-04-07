const sizes = {
  sm: 'w-8 h-8 text-caption',
  md: 'w-10 h-10 text-body-sm',
  lg: 'w-12 h-12 text-body',
  xl: 'w-16 h-16 text-h3',
}

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`
        rounded-full bg-primary-100 text-primary-700
        flex items-center justify-center font-semibold
        ${sizes[size]} ${className}
      `}
    >
      {initials}
    </div>
  )
}
