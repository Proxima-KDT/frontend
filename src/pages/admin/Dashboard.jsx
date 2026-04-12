import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserX, FolderOpen, Search, X } from 'lucide-react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';

const ADMIN_COLOR = '#8B5CF6';

const RADAR_MAP = {
  출결: '출결',
  AI_말하기: 'AI말하기',
  AI_면접: 'AI면접',
  포트폴리오: '포트폴리오',
  프로젝트_과제_시험: '프로젝트',
};

function HighlightText({ text, query }) {
  if (!query.trim() || !text) return <span>{text}</span>;
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    adminApi
      .getStudents()
      .then((data) => setStudents(data))
      .finally(() => setLoading(false));
  }, []);

  const lowAttendanceCount = students.filter(
    (s) => s.attendance_rate < 80,
  ).length;
  const portfolioCount = students.filter((s) =>
    s.files?.some((f) => f.type === 'portfolio'),
  ).length;

  // students 변경 시에만 radarData 전처리 — 렌더마다 재계산 방지
  const processedStudents = useMemo(
    () =>
      students.map((s) => ({
        ...s,
        radarData: Object.entries(s.skills || {}).map(([key, score]) => ({
          subject: RADAR_MAP[key] ?? key,
          score,
          fullMark: 100,
        })),
      })),
    [students],
  );

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return processedStudents;
    const q = search.trim().toLowerCase();
    return processedStudents.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q),
    );
  }, [processedStudents, search]);

  const stats = [
    {
      label: '전체 수강생',
      value: students.length,
      icon: Users,
      color: 'text-admin-500',
      bg: 'bg-admin-50',
    },
    {
      label: '출석 80% 미만',
      value: lowAttendanceCount,
      icon: UserX,
      color: 'text-warning-500',
      bg: 'bg-warning-50',
    },
    {
      label: '포트폴리오 제출',
      value: portfolioCount,
      icon: FolderOpen,
      color: 'text-success-500',
      bg: 'bg-success-50',
    },
  ];

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <h1 className="text-h1 font-bold text-gray-900 mb-6">수강생 현황</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-gray-200 bg-white text-body-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-admin-400 focus:ring-2 focus:ring-admin-100 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {search.trim() && (
            <p className="text-caption text-gray-400 mt-2 ml-1">
              <span className="text-admin-600 font-semibold">'{search.trim()}'</span> 검색 결과 —{' '}
              <span className="font-semibold text-gray-600">{filteredStudents.length}명</span>
              {filteredStudents.length === 0 && ' (결과 없음)'}
            </p>
          )}
        </div>
      )}

      {/* 수강생 카드 그리드 */}
      {filteredStudents.length === 0 ? (
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
              className="mt-3 text-body-sm text-admin-500 hover:text-admin-700 font-medium transition-colors"
            >
              검색 초기화
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => {
            const hasPortfolio = student.files?.some((f) => f.type === 'portfolio');
            const hasResume = student.files?.some((f) => f.type === 'resume');
            return (
              <Card
                key={student.id}
                hoverable
                onClick={() => navigate(`/admin/students/${student.id}`)}
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
                      <div className="w-full h-full bg-gradient-to-br from-admin-400 to-admin-600 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-body font-semibold text-gray-900 truncate">
                        <HighlightText text={student.name} query={search} />
                      </h3>
                      {hasPortfolio && <Badge variant="success">포트폴리오 있음</Badge>}
                      {hasResume && <Badge variant="info">이력서 있음</Badge>}
                    </div>
                    <ProgressBar
                      value={student.attendance_rate}
                      label="출석률"
                      color={student.attendance_rate < 80 ? 'bg-error-500' : 'bg-admin-500'}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <SkillRadarChart data={student.radarData} color={ADMIN_COLOR} size="mini" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
