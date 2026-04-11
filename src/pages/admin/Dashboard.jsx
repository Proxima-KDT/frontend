import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Bell, Search } from 'lucide-react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  const avgAttendance = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + (s.attendance_rate ?? 0), 0) /
          students.length,
      )
    : 0;
  const stats = [
    {
      label: '전체 학생',
      value: students.length,
      icon: Users,
      color: 'text-primary-500',
      bg: 'bg-primary-50',
    },
    {
      label: '평균 출석률',
      value: `${avgAttendance}%`,
      icon: Calendar,
      color: 'text-success-500',
      bg: 'bg-success-50',
    },
    {
      label: '집중 관리 대상',
      value: students.filter((s) => (s.attendance_rate ?? 0) < 80).length,
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];
  const editorialFont = "font-['Playfair_Display',Georgia,serif]";
  const recentStudents = [...students].slice(0, 6);
  const focusStudent =
    students.find((s) => (s.attendance_rate ?? 0) < 80) ?? students[0] ?? null;
  const focusSkills = Object.entries(focusStudent?.skills || {}).slice(0, 3);

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#8b8478]">
              Ethereal Academy
            </p>
            <h1 className={`${editorialFont} text-[2.2rem] font-semibold text-[#2d3138]`}>
              수강생 현황 (Student Roster Overview)
            </h1>
            <p className="text-sm text-[#7a756c]">
              개별 학습 진행도와 출결을 한 화면에서 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a39f96]" />
              <input
                type="text"
                placeholder="수강생 검색 (Search)"
                className="h-10 w-full rounded-full border border-[#e2dfd8] bg-[#f8f7f4] pl-9 pr-4 text-sm"
                readOnly
              />
            </div>
            <Bell className="h-4 w-4 text-[#7f7a72]" />
          </div>
        </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} opacity-90`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#7a756c]">
                  {stat.label}
                </p>
                <p className={`${editorialFont} text-[1.6rem] font-semibold text-[#2f3f54]`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${editorialFont} text-[1.55rem] text-[#2f333a]`}>
                Recent Enrollments
              </h3>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f0efeb] px-2.5 py-1 text-[11px] text-[#777267]">Sort: Name</span>
                <span className="rounded-full bg-[#f0efeb] px-2.5 py-1 text-[11px] text-[#777267]">Filter: All</span>
              </div>
            </div>
            <div className="space-y-2">
              {recentStudents.map((student) => {
                const score = Math.max(0, (student.attendance_rate ?? 0) - 8);
                return (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/admin/students/${student.id}`)}
                    className="grid w-full cursor-pointer grid-cols-[1.3fr_80px_110px_100px] items-center gap-3 rounded-xl border border-[#ebe7df] bg-white/70 px-3 py-2.5 text-left hover:bg-white"
                  >
                    <div>
                      <p className="font-semibold text-[#2f333a]">{student.name}</p>
                      <p className="text-xs text-[#8a857d]">{student.email}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#4f5967]">{student.attendance_rate ?? 0}%</p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#d6d9de]">
                        <div
                          className={`h-full rounded-full ${score < 70 ? 'bg-[#b85b5b]' : 'bg-[#59656f]'}`}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${score < 70 ? 'text-[#b85b5b]' : 'text-[#505a66]'}`}>{score}%</span>
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${score < 70 ? 'bg-[#f3e8e8] text-[#944848]' : 'bg-[#e8eef5] text-[#3d5a6e]'}`}>
                      {score < 70 ? '지원필요' : '양호'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
          <div className="space-y-4">
            <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#d8e1e7] text-lg font-semibold text-[#4f6070]">
                  {focusStudent?.name?.[0] ?? '?'}
                </div>
                <div>
                  <p className={`${editorialFont} text-[1.4rem] text-[#2f333a]`}>
                    {focusStudent?.name ?? '선택된 수강생'}
                  </p>
                  <p className="text-xs text-[#817b72]">{focusStudent?.email ?? '-'}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-[#2b2d31] bg-[#2b2c2f] text-white shadow-none">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d4b74e]">
                AI Observation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#ece7db]">
                출석률이 하락하는 수강생은 주 1회 체크인과 과제 피드백 루프를 강화하면 학습 유지율이 개선됩니다.
              </p>
            </Card>
            <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a857d]">
                Performance Matrix
              </p>
              <SkillRadarChart
                data={Object.entries(focusStudent?.skills || {}).map(([subject, score]) => ({
                  subject,
                  score,
                  fullMark: 100,
                }))}
                color="#58636d"
                size="sm"
              />
              <div className="mt-2 space-y-1">
                {focusSkills.map(([subject, score], idx) => (
                  <ProgressBar
                    key={subject}
                    value={score}
                    label={subject}
                    color={SKILL_COLORS[idx % SKILL_COLORS.length]}
                    size="sm"
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
