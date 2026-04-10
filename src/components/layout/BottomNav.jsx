import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as Icons from 'lucide-react';

const mobileMenus = {
  student: [
    { key: 'mypage', label: '마이', icon: 'User', path: '/student' },
    {
      key: 'dashboard',
      label: '홈',
      icon: 'LayoutDashboard',
      path: '/student/dashboard',
    },
    {
      key: 'problems',
      label: '문제',
      icon: 'FileText',
      path: '/student/problems',
    },
    {
      key: 'attendance',
      label: '출석',
      icon: 'Calendar',
      path: '/student/attendance',
    },
    {
      key: 'counseling-booking',
      label: '면담',
      icon: 'CalendarClock',
      path: '/student/counseling-booking',
    },
  ],
  teacher: [
    {
      key: 'dashboard',
      label: '홈',
      icon: 'LayoutDashboard',
      path: '/teacher',
    },
    {
      key: 'questions',
      label: '질문',
      icon: 'HelpCircle',
      path: '/teacher/questions',
    },
    {
      key: 'counseling',
      label: '상담',
      icon: 'Headphones',
      path: '/teacher/counseling',
    },
    {
      key: 'problems',
      label: '문제',
      icon: 'FileEdit',
      path: '/teacher/problems',
    },
  ],
  admin: [
    { key: 'dashboard', label: '수강생', icon: 'Users', path: '/admin' },
    {
      key: 'equipment',
      label: '장비',
      icon: 'Monitor',
      path: '/admin/equipment',
    },
    {
      key: 'room-reservation',
      label: '시설예약',
      icon: 'CalendarRange',
      path: '/admin/room-reservation',
    },
    {
      key: 'counseling-schedule',
      label: '상담',
      icon: 'CalendarClock',
      path: '/admin/counseling-schedule',
    },
  ],
};

export default function BottomNav() {
  const { role } = useAuth();
  const items = mobileMenus[role] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = Icons[item.icon] || Icons.Circle;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.path === `/${role}`}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 px-3 py-1
                text-caption transition-colors
                ${isActive ? 'text-primary-500' : 'text-gray-400'}
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
