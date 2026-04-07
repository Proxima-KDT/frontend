import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { studentMenuItems, teacherMenuItems, adminMenuItems } from '@/data/mockData'
import Avatar from '@/components/common/Avatar'
import * as Icons from 'lucide-react'

const menuMap = {
  student: studentMenuItems,
  teacher: teacherMenuItems,
  admin: adminMenuItems,
}

const accentColors = {
  student: 'bg-student-500',
  teacher: 'bg-teacher-500',
  admin: 'bg-admin-500',
}

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const items = menuMap[role] || []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-primary-900 text-white z-40
        flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* 로고 */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Icons.GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-body font-bold tracking-tight">EduPilot</span>
        )}
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item, idx) => {
          const Icon = Icons[item.icon] || Icons.Circle
          const prevGroup = idx > 0 ? items[idx - 1].group : null
          const showGroupHeader = !collapsed && item.group && item.group !== prevGroup
          return (
            <div key={item.key}>
              {showGroupHeader && (
                <p className="px-5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  {item.group}
                </p>
              )}
              <NavLink
                to={item.path}
                end={item.path === `/${role}`}
                className={({ isActive }) => `
                  relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg
                  text-body-sm font-medium transition-colors duration-150
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }
                  ${collapsed ? 'justify-center px-0 mx-1' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r ${accentColors[role]}`} />
                    )}
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            </div>
          )
        })}
      </nav>

      {/* 프로필 */}
      <div className={`border-t border-white/10 p-4 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar name={user?.name} size="sm" className="bg-white/20 text-white" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-caption text-white/50 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="로그아웃"
            >
              <Icons.LogOut className="w-4 h-4 text-white/70" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
