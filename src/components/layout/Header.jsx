import { Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Avatar from '@/components/common/Avatar'

export default function Header({ title, onMenuToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-[#e4d8c8] bg-[#f3f1ea] h-14 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-[#efe8dc] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        {title ? (
          <h1 className="text-body font-semibold text-gray-900">{title}</h1>
        ) : (
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2">
            <img src="/edupilot-header-logo.png" alt="Korea IT Academy" className="h-7 w-7 rounded-md bg-white p-0.5" />
            <span className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#6b7280]">Innovative experience</span>
          </button>
        )}
      </div>
      <Avatar name={user?.name} size="sm" />
    </header>
  )
}
