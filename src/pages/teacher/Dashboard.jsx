import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, Bell, Search } from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';
import {
  displaySkillFromRaw,
  SKILL_BAR_BG_CLASSES,
} from '@/utils/skillDisplay';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedCourseId, selectedCourse } = useCourse();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    teacherApi
      .getStudents(selectedCourseId)
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

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
      color: 'text-[#4e5f6e]',
      bg: 'bg-[#e8eef2]',
    },
    {
      label: '평균 출석률',
      value: `${avgAttendance}%`,
      icon: Calendar,
      color: 'text-[#4a6b52]',
      bg: 'bg-[#e6ede5]',
    },
    {
      label: '집중 관리 대상',
      value: students.filter((s) => (s.attendance_rate ?? 0) < 80).length,
      icon: TrendingUp,
      color: 'text-[#8a6d3a]',
      bg: 'bg-[#f0e8d8]',
    },
  ];
  const recentStudents = [...students].slice(0, 6);
  const focusStudent =
    students.find((s) => (s.attendance_rate ?? 0) < 80) ?? students[0] ?? null;
  const skillEntries = Object.entries(focusStudent?.skills || {}).map(
    ([rawKey, score]) => ({
      label: displaySkillFromRaw(rawKey),
      score: Number(score) || 0,
    }),
  );
  const radarChartData = skillEntries.map(({ label, score }) => ({
    subject: label,
    score,
    fullMark: 100,
  }));

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[2.2rem] font-semibold leading-tight text-[#2d3138]">
              수강생 현황
            </h1>
            <p className="mt-1 text-[0.95rem] font-medium tracking-tight text-[#8b8478]">
              Student Roster Overview
            </p>
            <p className="text-sm text-[#7a756c]">
              개별 학습 진행도와 출결을 한 화면에서 확인합니다.
            </p>
            {selectedCourse && (
              <>
                <p className="mt-1 text-sm text-[#7a756c]">
                  {selectedCourse.track_type === 'main' ? '[메인] ' : '[서브] '}
                  {selectedCourse.name}
                  {selectedCourse.classroom
                    ? ` · ${selectedCourse.classroom}`
                    : ''}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-[#a39c92]">
                  {selectedCourse.start_date && selectedCourse.end_date
                    ? `${selectedCourse.start_date} ~ ${selectedCourse.end_date}${selectedCourse.cohort_number != null ? ` · ${selectedCourse.cohort_number}기` : ''}`
                    : selectedCourse.duration_months
                      ? `${selectedCourse.duration_months}개월 과정`
                      : null}
                </p>
              </>
            )}
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
                <p className={`text-[1.6rem] font-semibold text-[#2f3f54]`}>
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
            <div className="mb-4 flex items-center justify-end">
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
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
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
                  <p className={`text-[1.4rem] text-[#2f333a]`}>
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
                data={radarChartData}
                variant="editorial"
                color="#4a4845"
                size="sm"
              />
              <div className="mt-3 space-y-2">
                {skillEntries.map(({ label, score }, idx) => (
                  <ProgressBar
                    key={`${label}-${idx}`}
                    value={score}
                    label={label}
                    color={SKILL_BAR_BG_CLASSES[idx % SKILL_BAR_BG_CLASSES.length]}
                    size="sm"
                    labelClassName="text-[0.72rem] font-semibold tracking-tight text-[#3d3a36] whitespace-normal break-keep leading-snug pr-1"
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
