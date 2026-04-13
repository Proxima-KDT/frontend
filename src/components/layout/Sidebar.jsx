import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import {
  studentMenuItems,
  teacherMenuItems,
  adminMenuItems,
} from '@/data/mockData';
import { UserCircle } from 'lucide-react';
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
  student: 'bg-[#f3f1ea]',
  teacher: 'bg-[linear-gradient(180deg,#3f4147_0%,#2f3137_42%,#26282e_100%)]',
  admin:
    'bg-[radial-gradient(900px_450px_at_16%_15%,rgba(255,214,170,0.18),rgba(255,214,170,0.04)_38%,transparent_68%),linear-gradient(180deg,#6c4b3f_0%,#5f4338_46%,#584035_100%)]',
};

export default function Sidebar({ collapsed = false, onToggle }) {
  const { user, role, logout } = useAuth();
  const { courses, selectedCourseId, setSelectedCourseId, selectedCourse } =
    useCourse();
  const navigate = useNavigate();
  const location = useLocation();
  const items = menuMap[role] || [];
  const isStudentLightTheme = role === 'student';
  const isTeacherTheme = role === 'teacher';
  const isAdminNavy = role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 서브 과정은 "능력단위평가"가 없으므로 해당 메뉴 비활성화
  // - teacher: 선택된 과정의 track_type으로 판별
  // - student: 본인 과정의 track_type을 profile API에서 받아온 값으로 판별
  const isSubCourse =
    role === 'student'
      ? user?.course_track_type === 'sub'
      : selectedCourse?.track_type === 'sub';

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        flex flex-col transition-all duration-300
        ${isAdminNavy ? 'bg-[#121926] text-[#e8edf4]' : `${sidebarBgByRole[role] || sidebarBgByRole.student} ${isTeacherTheme ? 'text-[#f3f4f6]' : isStudentLightTheme ? 'text-[#4f463d]' : 'text-[#f8f3ea]'}`}
        ${collapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* 로고 */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className={`flex items-center gap-3 px-4 h-16 border-b ${isStudentLightTheme ? 'border-[#ebe8e1]' : 'border-white/10'} ${collapsed ? 'justify-center' : ''}`}
      >
        <div
          className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${isAdminNavy || isTeacherTheme ? 'bg-white/12' : 'bg-[#ece9e3]'}`}
        >
          <Icons.Sparkles
            className={`w-4 h-4 ${isAdminNavy || isTeacherTheme ? 'text-[#e5e7eb]' : 'text-[#8a847a]'}`}
          />
        </div>
        {!collapsed && !isAdminNavy && (
          <div className="leading-tight">
            <p
              className={`text-[0.95rem] italic font-semibold ${isTeacherTheme ? 'text-[#f9fafb]' : 'text-[#4a4640]'}`}
            >
              Korea IT Academy
            </p>
            <p
              className={`text-[0.62rem] tracking-[0.12em] ${isTeacherTheme ? 'text-[#d1d5db]/75' : 'text-[#a8a29e]'}`}
            >
              학습 포털
            </p>
          </div>
        )}
        {!collapsed && isAdminNavy && (
          <div className="min-w-0 text-left leading-tight">
            <p className="text-[0.95rem] font-semibold italic tracking-tight text-[#fdf8f3]">
              Korea IT Academy
            </p>
            <p className="text-[0.62rem] tracking-[0.12em] text-[#e8d8cc]/85">
              운영 포털
            </p>
          </div>
        )}
      </button>

      {/* 강사 전용: 담당 과정 드롭다운 */}
      {role === 'teacher' && !collapsed && courses.length > 0 && (
        <div className="px-4 pt-3 pb-3 border-b border-white/10">
          <label className="mb-2 block text-[0.92rem] font-medium text-white/90">
            담당 과정
          </label>
          <select
            value={selectedCourseId || ''}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full bg-white/10 text-white text-[0.92rem] font-medium rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:border-white/30 cursor-pointer"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id} className="text-gray-900">
                {c.track_type === 'main' ? '[메인] ' : '[서브] '}
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((item, idx) => {
          const Icon = Icons[item.icon] || Icons.Circle;
          const prevGroup = idx > 0 ? items[idx - 1].group : null;
          const showGroupHeader =
            !collapsed && item.group && item.group !== prevGroup;
          const isAssessmentMenu =
            item.path === '/teacher/assessments' ||
            item.path === '/student/assessments';
          const isDisabled = isAssessmentMenu && isSubCourse;
          return (
            <div key={item.key}>
              {showGroupHeader && (
                <p
                  className={`px-5 pt-4 pb-1 text-[0.72rem] font-semibold tracking-[0.12em] uppercase ${
                    isAdminNavy
                      ? 'text-[#8a96a3]'
                      : isTeacherTheme
                        ? 'text-[#9ca3af]'
                        : isStudentLightTheme
                          ? 'text-[#aca79b]'
                          : 'text-[#fff4e6] drop-shadow-[0_1px_4px_rgba(0,0,0,0.22)]'
                  }`}
                >
                  {item.group}
                </p>
              )}
              {isDisabled ? (
                <div
                  title="서브 과정은 능력단위평가가 없습니다"
                  className={`
                    group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl
                    text-[0.92rem] font-medium cursor-not-allowed
                    ${
                      isTeacherTheme
                        ? 'text-white/25'
                        : isStudentLightTheme
                          ? 'text-[#b9b4ab] bg-[#ebe8e2]/40'
                          : 'text-[#f7eee2]/40'
                    }
                    ${collapsed ? 'justify-center px-0 mx-1' : ''}
                  `}
                >
                  <Icon className="w-[1rem] h-[1rem] shrink-0 opacity-50" />
                  {!collapsed && (
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path}
                  end={item.path === `/${role}`}
                  className={({ isActive }) => `
                  group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl
                  text-[0.92rem] font-medium transition-colors duration-150
                  ${
                    isAdminNavy
                      ? isActive
                        ? 'bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
                        : 'text-[#c5cfd8] hover:bg-white/8 hover:text-[#e8edf4]'
                      : isActive
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
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={`min-w-0 truncate transition-transform duration-200 group-hover:translate-x-0.5 ${
                              item.ai && isStudentLightTheme
                                ? 'font-semibold text-[#2a2620]'
                                : item.ai && isTeacherTheme
                                  ? 'font-semibold text-[#f9fafb]'
                                  : ''
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.ai &&
                            !collapsed &&
                            (isStudentLightTheme ||
                              isTeacherTheme ||
                              isAdminNavy) && (
                              <span
                                className="student-menu-ai-badge relative ml-0.5 inline-flex shrink-0 items-center gap-1 overflow-hidden rounded-full border border-amber-200/95 bg-gradient-to-r from-[#6d28d9] via-[#c026d3] to-[#ea580c] px-2 py-0.5"
                                title="AI 기능"
                              >
                                <Icons.Sparkles
                                  className="relative z-[1] h-3.5 w-3.5 shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.95)]"
                                  aria-hidden
                                />
                                <span className="relative z-[1] pr-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.12em] text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
                                  AI
                                </span>
                                <span
                                  className="student-menu-glint pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-transparent via-white to-transparent opacity-95"
                                  aria-hidden
                                />
                              </span>
                            )}
                          {item.ai &&
                            !collapsed &&
                            !isStudentLightTheme &&
                            !isTeacherTheme &&
                            !isAdminNavy && (
                              <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md bg-gradient-to-r from-violet-500 to-blue-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm shadow-violet-500/40 animate-pulse">
                                AI
                              </span>
                            )}
                        </div>
                      )}
                      {collapsed &&
                        item.ai &&
                        (isStudentLightTheme ||
                          isTeacherTheme ||
                          isAdminNavy) && (
                          <span
                            className="student-menu-ai-dot pointer-events-none absolute right-1.5 top-2 h-2 w-2 rounded-full bg-gradient-to-br from-amber-300 to-fuchsia-500 ring-2 ring-white/90 shadow-[0_0_10px_rgba(251,191,36,0.95)]"
                            aria-hidden
                          />
                        )}
                      {collapsed &&
                        item.ai &&
                        !isStudentLightTheme &&
                        !isTeacherTheme &&
                        !isAdminNavy && (
                          <span
                            className="pointer-events-none absolute -top-0.5 -right-0.5 h-2 w-2 animate-pulse rounded-full bg-violet-400 shadow-sm shadow-violet-400/60"
                            aria-hidden
                          />
                        )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          );
        })}
      </nav>

      {/* 프로필 */}
      <div
        className={`border-t ${isStudentLightTheme ? 'border-[#ebe8e1]' : 'border-white/10'} p-4 ${collapsed ? 'px-2' : ''}`}
      >
        <div className={`${collapsed ? 'justify-center' : ''}`}>
          <div
            className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
          >
            <UserCircle
              className={`w-7 h-7 shrink-0 ${isStudentLightTheme ? 'text-[#8a847a]' : 'text-white/60'}`}
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className={`text-body-sm font-medium truncate ${isStudentLightTheme ? 'text-[#374151]' : 'text-white'}`}
                >
                  {user?.name}
                </p>
                <p
                  className={`text-caption truncate ${isStudentLightTheme ? 'text-[#6b7280]' : isAdminNavy ? 'text-[#8fa3b8]' : 'text-[#f3e5d2]/70'}`}
                >
                  {user?.email}
                </p>
                {isAdminNavy && (
                  <p className="text-[0.65rem] text-[#6b7c8f] mt-0.5 truncate">
                    관리자 · Administrator
                  </p>
                )}
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isStudentLightTheme ? 'hover:bg-white/35' : 'hover:bg-white/10'}`}
                title="로그아웃"
              >
                <Icons.LogOut
                  className={`w-4 h-4 ${isStudentLightTheme ? 'text-[#6b7280]' : 'text-white/70'}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
