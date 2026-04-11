import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  studentMenuItems,
  teacherMenuItems,
  adminMenuItems,
} from '@/data/mockData';
import Avatar from '@/components/common/Avatar';
import * as Icons from 'lucide-react';

const menuMap = {
  student: studentMenuItems,
  teacher: teacherMenuItems,
  admin: adminMenuItems,
};

const accentColors = {
  student: 'bg-[#d8d3c9]',
  teacher: 'bg-[#d8d3c9]',
  admin: 'bg-[#e6d0b1]',
};

const sidebarBgByRole = {
  student:
    'bg-[#f3f1ea]',
  teacher:
    'bg-[linear-gradient(180deg,#3f4147_0%,#2f3137_42%,#26282e_100%)]',
  admin:
    'bg-[radial-gradient(900px_450px_at_16%_15%,rgba(255,214,170,0.18),rgba(255,214,170,0.04)_38%,transparent_68%),linear-gradient(180deg,#6c4b3f_0%,#5f4338_46%,#584035_100%)]',
};

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const items = menuMap[role] || [];
  const isStudentLightTheme = role === 'student';
  const isTeacherTheme = role === 'teacher';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full text-[#f8f3ea] z-40
        flex flex-col transition-all duration-300
        ${sidebarBgByRole[role] || sidebarBgByRole.student}
        ${isTeacherTheme ? 'text-[#f3f4f6]' : isStudentLightTheme ? 'text-[#4f463d]' : 'text-[#f8f3ea]'}
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* 로고 */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className={`flex items-center gap-3 px-4 h-16 border-b ${isStudentLightTheme ? 'border-[#ebe8e1]' : 'border-white/10'} ${collapsed ? 'justify-center' : ''}`}
      >
        <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${isTeacherTheme ? 'bg-white/12' : 'bg-[#ece9e3]'}`}>
          <Icons.Sparkles className={`w-4 h-4 ${isTeacherTheme ? 'text-[#e5e7eb]' : 'text-[#8a847a]'}`} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className={`text-[0.95rem] italic font-semibold ${isTeacherTheme ? 'text-[#f9fafb]' : 'text-[#4a4640]'}`}>Ethereal Academy</p>
            <p className={`text-[0.62rem] tracking-[0.12em] ${isTeacherTheme ? 'text-[#d1d5db]/75' : 'text-[#a8a29e]'}`}>학습 포털</p>
          </div>
        )}
      </button>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item, idx) => {
          const Icon = Icons[item.icon] || Icons.Circle;
          const prevGroup = idx > 0 ? items[idx - 1].group : null;
          const showGroupHeader =
            !collapsed && item.group && item.group !== prevGroup;
          return (
            <div key={item.key}>
              {showGroupHeader && (
                <p className={`px-5 pt-4 pb-1 text-[0.72rem] font-semibold tracking-[0.12em] uppercase ${isTeacherTheme ? 'text-[#9ca3af]' : isStudentLightTheme ? 'text-[#aca79b]' : 'text-[#fff4e6] drop-shadow-[0_1px_4px_rgba(0,0,0,0.22)]'}`}>
                  {item.group}
                </p>
              )}
              <NavLink
                to={item.path}
                end={item.path === `/${role}`}
                className={({ isActive }) => `
                  group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl
                  text-[0.92rem] font-medium transition-colors duration-150
                  ${
                    isActive
                      ? isTeacherTheme
                        ? 'bg-white/14 text-[#f9fafb] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                        : isStudentLightTheme
                          ? 'bg-white text-[#2d2a26] shadow-[0_1px_2px_rgba(45,42,38,0.06),0_0_0_1px_rgba(235,232,225,0.95)]'
                        : 'bg-white/16 text-[#fffaf2] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]'
                      : isTeacherTheme
                        ? 'text-[#d1d5db] hover:bg-white/8 hover:text-[#f3f4f6]'
                        : isStudentLightTheme
                          ? 'text-[#6e685f] hover:bg-white/70 hover:text-[#3f352b]'
                        : 'text-[#f7eee2]/95 hover:bg-white/10 hover:text-[#fffaf2]'
                  }
                  ${collapsed ? 'justify-center px-0 mx-1' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div
                        className={`absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l ${accentColors[role]}`}
                      />
                    )}
                    <Icon className="w-[1rem] h-[1rem] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                    {!collapsed && (
                      <div className="flex items-center gap-1.5">
                        <span className="transition-transform duration-200 group-hover:translate-x-1 group-hover:scale-110">
                          {item.label}
                        </span>
                        {(item.key === 'voice-feedback' || item.key === 'mock-interview') && (
                          <Icons.Sparkles className={`w-3.5 h-3.5 opacity-95 ${isStudentLightTheme ? 'text-[#b58143]' : 'text-[#ffe7b5]'}`} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* 프로필 */}
      <div
        className={`border-t ${isStudentLightTheme ? 'border-[#ebe8e1]' : 'border-white/10'} p-4 ${collapsed ? 'px-2' : ''}`}
      >
        <div className={`${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && isStudentLightTheme && (
            <button className={`mb-3 w-full rounded-xl py-2.5 text-[0.82rem] font-semibold text-white ${isTeacherTheme ? 'bg-[#4b5563] hover:bg-[#374151]' : 'bg-[#49555d] hover:bg-[#3d474e]'}`}>
              문의하기
            </button>
          )}
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Avatar
            name={user?.name}
            size="sm"
            className={`${isStudentLightTheme ? 'bg-[#ece9e3] text-[#5c5852]' : 'bg-white/20 text-white'}`}
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className={`text-body-sm font-medium truncate ${isStudentLightTheme ? 'text-[#374151]' : 'text-white'}`}>
                {user?.name}
              </p>
              <p className={`text-caption truncate ${isStudentLightTheme ? 'text-[#6b7280]' : 'text-[#f3e5d2]/70'}`}>
                {user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isStudentLightTheme ? 'hover:bg-white/35' : 'hover:bg-white/10'}`}
              title="로그아웃"
            >
              <Icons.LogOut className={`w-4 h-4 ${isStudentLightTheme ? 'text-[#6b7280]' : 'text-white/70'}`} />
            </button>
          )}
          </div>
        </div>
      </div>
    </aside>
  );
}
