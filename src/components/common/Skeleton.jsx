export default function Skeleton({
  width,
  height,
  rounded = 'rounded-lg',
  className = '',
}) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded} ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 animate-pulse rounded h-4"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 ${className}`}>
      <Skeleton width="40%" height="1.25rem" className="mb-3" />
      <SkeletonText lines={2} />
      <Skeleton width="30%" height="2rem" className="mt-4" rounded="rounded-xl" />
    </div>
  )
}
