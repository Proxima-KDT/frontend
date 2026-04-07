import { Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/common/Avatar'

export default function Header({ title, onMenuToggle }) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        {title ? (
          <h1 className="text-body font-semibold text-gray-900">{title}</h1>
        ) : (
          <span className="text-body font-bold text-primary-500">EduPilot</span>
        )}
      </div>
      <Avatar name={user?.name} size="sm" />
    </header>
  )
}
