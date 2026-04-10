import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  FileText,
  FolderOpen,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';
import Skeleton from '@/components/common/Skeleton';

const SKILL_LABELS = {
  출결: '출결',
  AI_말하기: 'AI 말하기',
  AI_면접: 'AI 면접',
  포트폴리오: '포트폴리오',
  프로젝트_과제_시험: '프로젝트/과제/시험',
};

const RADAR_LABELS = {
  출결: '출결',
  AI_말하기: 'AI말하기',
  AI_면접: 'AI면접',
  포트폴리오: '포트폴리오',
  프로젝트_과제_시험: '프로젝트',
};

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

const STATUS_CONFIG = {
  present: { color: 'bg-success-500', label: '출석' },
  late: { color: 'bg-warning-500', label: '지각' },
  absent: { color: 'bg-error-500', label: '결석' },
  early_leave: { color: 'bg-warning-300', label: '조퇴' },
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton width="180px" height="20px" rounded="rounded" />
      <Skeleton width="100%" height="130px" rounded="rounded-2xl" />
      <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton width="100%" height="220px" rounded="rounded-2xl" />
        <Skeleton width="100%" height="220px" rounded="rounded-2xl" />
      </div>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teacherApi.getStudent(id),
      teacherApi.getStudentWeeklyAttendance(id),
    ])
      .then(([s, att]) => {
        setStudent(s);
        setNotes(s.notes || '');
        setWeekAttendance(att || []);
      })
      .catch(() =>
        showToast({
          message: '학생 정보를 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = useCallback(async () => {
    setNotesSaving(true);
    try {
      await teacherApi.updateNotes(id, notes);
      showToast({ message: '노트가 저장되었습니다.', type: 'success' });
    } catch {
      showToast({ message: '저장에 실패했습니다.', type: 'error' });
    } finally {
      setNotesSaving(false);
    }
  }, [id, notes, showToast]);

  if (loading) return <LoadingSkeleton />;

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <UserCircle className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-body-md">학생 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const skillData = Object.entries(student.skills || {}).map(
    ([key, score]) => ({
      key,
      label: SKILL_LABELS[key] || key,
      radarLabel: RADAR_LABELS[key] || key,
      score: score ?? 0,
      fullMark: 100,
    }),
  );

  const radarData = skillData.map((item) => ({
    subject: item.radarLabel,
    score: item.score,
    fullMark: 100,
  }));

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-5">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/teacher')}
        className="flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        수강생 현황으로 돌아가기
      </button>

      {/* ── 학생 정보 헤더 ────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-5">
          {/* 아바타 */}
          <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {student.name?.charAt(0) ?? '?'}
                </span>
              </div>
            )}
          </div>

          {/* 이름 + 메타 + 지표 */}
          <div className="flex-1 min-w-0">
            {/* 이름 */}
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-h2 font-bold text-gray-900">
                {student.name}
              </h1>
            </div>

            {/* 이메일 · 등록일 · 최근 활동 */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-gray-500 mb-4">
              {student.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {student.email}
                </span>
              )}
              {student.enrolled_at && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  등록일 {student.enrolled_at}
                </span>
              )}
              {student.last_active && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  최근 활동 {student.last_active}
                </span>
              )}
            </div>

            {/* 핵심 지표 칩 */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-body-sm font-semibold text-blue-700">
                  출석률 {student.attendance_rate ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 스킬 분석 ─────────────────────────────────── */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-5">스킬 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center">
            <SkillRadarChart data={radarData} color="#3B82F6" />
          </div>
          <div className="flex flex-col gap-3">
            {skillData.map((skill, idx) => (
              <ProgressBar
                key={skill.key}
                value={skill.score}
                label={skill.label}
                color={SKILL_COLORS[idx]}
                size="md"
              />
            ))}
          </div>
        </div>
      </Card>

      {/* ── 상담 노트 + 이번 주 출석 ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 상담 노트 */}
        <Card className="flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">상담 노트</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveNotes}
              disabled={notesSaving}
            >
              {notesSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={7}
            placeholder="학생에 대한 메모를 작성하세요..."
          />
        </Card>

        {/* 이번 주 출석 */}
        <Card className="flex flex-col">
          <h2 className="text-h3 font-semibold text-gray-900 mb-5">
            이번 주 출석
          </h2>
          <div className="grid grid-cols-7 gap-2 flex-1">
            {DAY_NAMES.map((dayName, idx) => {
              const record = weekAttendance.find(
                (a) => new Date(a.date).getDay() === idx,
              );
              const isToday = record?.date === todayStr;
              const statusCfg = record?.status
                ? STATUS_CONFIG[record.status]
                : null;

              return (
                <div
                  key={dayName}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`text-caption font-medium ${
                      isToday ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    {dayName}
                  </span>
                  <span
                    className={`text-body-sm font-semibold ${
                      isToday ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {record ? new Date(record.date).getDate() : '-'}
                  </span>
                  <div
                    title={statusCfg?.label ?? '기록 없음'}
                    className={`w-5 h-5 rounded-full transition-all ${
                      statusCfg
                        ? statusCfg.color
                        : 'bg-gray-100 border border-gray-200'
                    } ${isToday ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}
                  />
                  {statusCfg && (
                    <span className="hidden md:block text-caption text-gray-400 leading-none">
                      {statusCfg.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
            {Object.entries(STATUS_CONFIG).map(([, cfg]) => (
              <span
                key={cfg.label}
                className="flex items-center gap-1.5 text-caption text-gray-500"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                {cfg.label}
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 이력서 / 포트폴리오 ───────────────────────── */}
      <Card>
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">
          이력서 / 포트폴리오
        </h2>
        {student.files && student.files.length > 0 ? (
          <div className="space-y-2.5">
            {student.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      file.type === 'resume' ? 'bg-blue-50' : 'bg-purple-50'
                    }`}
                  >
                    {file.type === 'resume' ? (
                      <FileText className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-caption text-gray-400">
                      {file.type === 'resume' ? '이력서' : '포트폴리오'} ·{' '}
                      {file.uploaded_at} 업로드
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    보기
                  </a>
                  <a
                    href={file.url}
                    download
                    className="text-body-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    다운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-gray-300">
            <FolderOpen className="w-10 h-10 mb-2" />
            <p className="text-body-sm text-gray-400">
              등록된 파일이 없습니다.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
