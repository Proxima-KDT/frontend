import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Calendar, Search, X } from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

// 검색어 일치 부분 하이라이팅
function HighlightText({ text, query }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { selectedCourseId, selectedCourse } = useCourse();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  // students 변경 시에만 radarData/skillData 전처리 — 렌더마다 재계산 방지
  const processedStudents = useMemo(
    () =>
      students.map((s) => {
        const skillData = Object.entries(s.skills || {}).map(
          ([subject, score]) => ({ subject, score, fullMark: 100 }),
        );
        return {
          ...s,
          skillData,
          radarData: skillData.map((item) => ({
            ...item,
            subject:
              item.subject === '프로젝트.과제.시험' ? '프로젝트..' : item.subject,
          })),
        };
      }),
    [students],
  );

  useEffect(() => {
    if (!selectedCourseId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setSearch('');
    setLoading(true);
    teacherApi
      .getStudents(selectedCourseId)
      .then(setStudents)
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return processedStudents;
    const q = search.trim().toLowerCase();
    return processedStudents.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q),
    );
  }, [processedStudents, search]);

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
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-gray-900">수강생 현황</h1>
        {selectedCourse && (
          <>
            <p className="text-body-sm text-gray-500 mt-1">
              {selectedCourse.track_type === 'main' ? '[메인] ' : '[서브] '}
              {selectedCourse.name}
              {selectedCourse.classroom ? ` · ${selectedCourse.classroom}` : ''}
            </p>
            <p className="text-caption text-gray-400 mt-0.5">
              {selectedCourse.start_date && selectedCourse.end_date
                ? `${selectedCourse.start_date} ~ ${selectedCourse.end_date}${selectedCourse.cohort_number ? ` · ${selectedCourse.cohort_number}기` : ''}`
                : selectedCourse.duration_months
                  ? `${selectedCourse.duration_months}개월 과정`
                  : null}
            </p>
          </>
        )}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-caption text-gray-500">{stat.label}</p>
                <p className="text-h3 font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 검색창 */}
      {!loading && students.length > 0 && (
        <div className="mb-5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="수강생 이름으로 검색"
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-body-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {search.trim() && (
            <p className="text-caption text-gray-400 mt-2 ml-1">
              <span className="text-primary-600 font-semibold">'{search.trim()}'</span> 검색 결과 —{' '}
              <span className="font-semibold text-gray-600">{filteredStudents.length}명</span>
              {filteredStudents.length === 0 && ' (결과 없음)'}
            </p>
          )}
        </div>
      )}

      {/* 학생 카드 그리드 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-body font-semibold text-gray-500">
            {search.trim() ? `'${search.trim()}'에 해당하는 수강생이 없습니다` : '수강생이 없습니다'}
          </p>
          {search.trim() && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-body-sm text-primary-500 hover:text-primary-700 font-medium transition-colors"
            >
              검색 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              hoverable
              onClick={() => navigate(`/teacher/students/${student.id}`)}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-20 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                  {student.avatar_url ? (
                    <img
                      src={student.avatar_url}
                      alt={student.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-student-400 to-student-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-body font-semibold text-gray-900 truncate">
                    <HighlightText text={student.name} query={search} />
                  </h3>
                  <p className="text-caption text-gray-500">
                    <HighlightText text={student.email ?? ''} query={search} />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SkillRadarChart
                  data={student.radarData}
                  color="#3B82F6"
                  size="mini"
                />
                <div className="flex flex-col justify-center gap-2">
                  {student.skillData.map((skill, idx) => (
                    <ProgressBar
                      key={skill.subject}
                      value={skill.score}
                      label={skill.subject}
                      color={SKILL_COLORS[idx]}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
