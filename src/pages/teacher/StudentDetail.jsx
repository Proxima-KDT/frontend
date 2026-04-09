import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Calendar as CalendarIcon,
  Clock,
  FileText,
  FolderOpen,
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

const SKILL_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
];

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
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = useCallback(async () => {
    setNotesSaving(true);
    try {
      await teacherApi.updateNotes(id, notes);
      showToast({ message: '?�트가 ?�?�되?�습?�다.', type: 'success' });
    } catch {
      showToast({ message: '?�?�에 ?�패?�습?�다.', type: 'error' });
    } finally {
      setNotesSaving(false);
    }
  }, [id, notes, showToast]);

  if (loading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!student)
    return <p className="text-gray-500">?�생 ?�보�?불러?????�습?�다.</p>;

  const skillData = Object.entries(student.skills || {}).map(
    ([subject, score]) => ({
      subject,
      score,
      fullMark: 100,
    }),
  );

  const radarData = skillData.map((item) => ({
    ...item,
    subject:
      item.subject === '?�로?�트.과제.?�험' ? '?�로?�트..' : item.subject,
  }));

  const statusColors = {
    present: 'bg-success-500',
    late: 'bg-warning-500',
    absent: 'bg-error-500',
    early_leave: 'bg-warning-300',
  };

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div>
      <button
        onClick={() => navigate('/teacher')}
        className="flex items-center gap-1 text-body-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        ?�강???�황?�로 ?�아가�?{' '}
      </button>

      {/* ?�생 ?�보 ?�더 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-24 h-28 rounded-2xl overflow-hidden border-2 border-white shadow-md">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-student-400 to-student-600 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {student.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-h2 font-bold text-gray-900">
                {student.name}
              </h1>
              {student.is_at_risk && <Badge variant="error">?�험</Badge>}
            </div>
            <div className="flex flex-wrap gap-4 text-body-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {student.email}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> ?�록??{' '}
                {student.enrolled_at}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> 최근 ?�동: {student.last_active}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ??�� 분석 */}
      <Card className="mb-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-6">??�� 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex justify-center items-center">
            <SkillRadarChart data={radarData} color="#3B82F6" />
          </div>
          <div className="flex flex-col justify-center gap-4">
            {skillData.map((skill, idx) => (
              <ProgressBar
                key={skill.subject}
                value={skill.score}
                label={skill.subject}
                color={SKILL_COLORS[idx]}
                size="md"
              />
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ?�담 ?�트 */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">?�담 ?�트</h2>
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
            rows={6}
            placeholder="?�생???�??메모�??�성?�세??.."
          />
        </Card>

        {/* ?�번 �?출석 */}
        <Card className="flex flex-col">
          <h2 className="text-h3 font-semibold text-gray-900 mb-6">
            ?�번 �?출석
          </h2>
          <div className="grid grid-cols-7 gap-3 flex-1">
            {DAY_NAMES.map((d, idx) => {
              const day = weekAttendance.find(
                (a) => new Date(a.date).getDay() === idx,
              );
              return (
                <div key={d} className="flex flex-col items-center">
                  <span className="text-body-sm text-gray-500 font-medium mb-3">
                    {d}
                  </span>
                  <span className="text-body-sm text-gray-700 font-semibold mb-2">
                    {day ? new Date(day.date).getDate() : '-'}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full ${
                      day?.status
                        ? statusColors[day.status] || 'bg-gray-300'
                        : 'bg-gray-300'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-6 pt-4 border-t border-gray-200 text-body-sm text-gray-600">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success-500" /> 출석
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning-500" /> 지�?{' '}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error-500" /> 결석
            </span>
          </div>
        </Card>
      </div>

      {/* ?�력??/ ?�트?�리??*/}
      <Card className="mt-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">
          이력서 / 포트폴리오
        </h2>
        {student.files && student.files.length > 0 ? (
          <div className="space-y-3">
            {student.files.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      file.type === 'resume' ? 'bg-teacher-50' : 'bg-student-50'
                    }`}
                  >
                    {file.type === 'resume' ? (
                      <FileText className="w-5 h-5 text-teacher-500" />
                    ) : (
                      <FolderOpen className="w-5 h-5 text-student-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-caption text-gray-400">
                      {file.uploaded_at} 업로드
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-teacher-600 hover:text-teacher-700 font-medium"
                  >
                    보기
                  </a>
                  <a
                    href={file.url}
                    download
                    className="text-body-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    ?�운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-gray-400">?�록???�일???�습?�다.</p>
        )}
      </Card>
    </div>
  );
}
