import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import Avatar from '@/components/common/Avatar';
import Skeleton from '@/components/common/Skeleton';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedCourseId, selectedCourse } = useCourse();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
  const filteredStudents = useMemo(() => {
    let list = students.filter(
      (s) =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()),
    );
    if (filterStatus === 'ok') list = list.filter((s) => !s.is_at_risk);
    if (filterStatus === 'at_risk') list = list.filter((s) => s.is_at_risk);
    return [...list].sort((a, b) => {
      const av = sortKey === 'name' ? (a.name ?? '') : (a[sortKey] ?? 0);
      const bv = sortKey === 'name' ? (b.name ?? '') : (b[sortKey] ?? 0);
      if (typeof av === 'string')
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [students, search, sortKey, sortDir, filterStatus]);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const recentStudents = useMemo(
    () => filteredStudents.slice((page - 1) * pageSize, page * pageSize),
    [filteredStudents, page, pageSize],
  );

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
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-full border border-[#e2dfd8] bg-[#f8f7f4] pl-9 pr-4 text-sm outline-none transition focus:border-[#2d3138] focus:ring-1 focus:ring-[#2d3138]"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="rounded-2xl border border-[#e2ded7] bg-[#f8f7f4] shadow-none"
            >
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
          <Card className="rounded-3xl border border-[#e1ddd6] bg-[#f8f7f4] shadow-none">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex gap-1">
                {[
                  { key: 'all', label: '전체' },
                  { key: 'ok', label: '양호' },
                  { key: 'at_risk', label: '지원필요' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilterStatus(key);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      filterStatus === key
                        ? 'bg-[#2d3138] text-white'
                        : 'bg-[#f0efeb] text-[#777267] hover:bg-[#e8e5df]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[44px_minmax(0,1.3fr)_80px_110px_100px] items-center gap-3 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9e9890]">
              <div />
              <button
                className="flex items-center gap-0.5 transition hover:text-[#2d3138]"
                onClick={() => {
                  if (sortKey === 'name')
                    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortKey('name');
                    setSortDir('asc');
                  }
                  setPage(1);
                }}
              >
                이름
                {sortKey === 'name' &&
                  (sortDir === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
              <button
                className="flex items-center gap-0.5 transition hover:text-[#2d3138]"
                onClick={() => {
                  if (sortKey === 'attendance_rate')
                    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortKey('attendance_rate');
                    setSortDir('asc');
                  }
                  setPage(1);
                }}
              >
                출석률
                {sortKey === 'attendance_rate' &&
                  (sortDir === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
              <button
                className="flex items-center gap-0.5 transition hover:text-[#2d3138]"
                onClick={() => {
                  if (sortKey === 'submission_rate')
                    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortKey('submission_rate');
                    setSortDir('asc');
                  }
                  setPage(1);
                }}
              >
                과제 제출률
                {sortKey === 'submission_rate' &&
                  (sortDir === 'asc' ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  ))}
              </button>
              <div>상태</div>
            </div>
            <div className="space-y-2">
              {recentStudents.map((student) => {
                const submissionRate = student.submission_rate ?? 0;
                const avatarSrc =
                  student.avatar_url ?? student.avatarUrl ?? undefined;
                return (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                    className="grid w-full cursor-pointer grid-cols-[44px_minmax(0,1.3fr)_80px_110px_100px] items-center gap-3 rounded-xl border border-[#ebe7df] bg-white/70 px-3 py-2.5 text-left hover:bg-white"
                  >
                    <Avatar
                      name={student.name}
                      src={avatarSrc}
                      size="md"
                      className="shrink-0 border border-[#e8e4dc] bg-[#eef0f3] text-[#4f6070]"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#2f333a]">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-[#8a857d]">
                        {student.email}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#4f5967]">
                      {student.attendance_rate ?? 0}%
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#d6d9de]">
                        <div
                          className={`h-full rounded-full ${
                            student.is_at_risk ? 'bg-[#b85b5b]' : 'bg-[#59656f]'
                          }`}
                          style={{ width: `${Math.min(100, submissionRate)}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          student.is_at_risk
                            ? 'text-[#b85b5b]'
                            : 'text-[#505a66]'
                        }`}
                      >
                        {submissionRate}%
                      </span>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                        student.is_at_risk
                          ? 'bg-[#f3e8e8] text-[#944848]'
                          : 'bg-[#e8eef5] text-[#3d5a6e]'
                      }`}
                    >
                      {student.is_at_risk ? '지원필요' : '양호'}
                    </span>
                  </button>
                );
              })}
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-[#ebe7df] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-caption text-[#8a847a]">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, filteredStudents.length)} / 전체{' '}
                    {filteredStudents.length}명{search && ` (검색 결과)`}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="이전 페이지"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1,
                      )
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === '…' ? (
                          <span
                            key={`e-${idx}`}
                            className="px-1 text-caption text-[#b4aea4]"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setPage(p)}
                            className={`flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                              p === page
                                ? 'bg-[#2d3138] text-white shadow-sm'
                                : 'text-[#5c5852] hover:bg-[#f5f3ef]'
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="다음 페이지"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
