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
  BookOpen,
  MapPin,
  Phone,
  KeyRound,
  Copy,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
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

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i += 1) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

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

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwResetDone, setPwResetDone] = useState(false);

  const openPwModal = () => {
    setNewPassword('');
    setPwError('');
    setPwResetDone(false);
    setPwModalOpen(true);
  };

  const handlePwSave = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPwError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setPwSaving(true);
    setPwError('');
    try {
      await adminApi.updateUserPassword(id, newPassword);
      setPwResetDone(true);
      showToast({ type: 'success', message: '비밀번호가 변경되었습니다.' });
    } catch (err) {
      const detail =
        err?.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
      setPwError(detail);
    } finally {
      setPwSaving(false);
    }
  };

  const copyNewPassword = () => {
    if (!newPassword) return;
    navigator.clipboard?.writeText(newPassword).then(
      () => showToast({ type: 'success', message: '비밀번호를 복사했습니다.' }),
      () => showToast({ type: 'error', message: '복사에 실패했습니다.' }),
    );
  };

  useEffect(() => {
    Promise.all([
      adminApi.getStudent(id),
      adminApi.getStudentWeeklyAttendance(id),
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
  }, [id, showToast]);

  const handleSaveNotes = useCallback(async () => {
    setNotesSaving(true);
    try {
      await adminApi.updateNotes(id, notes);
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
  const overallScore = skillData.length
    ? (
        skillData.reduce((sum, item) => sum + item.score, 0) / skillData.length
      ).toFixed(1)
    : '0.0';
  const weekColumns = ['W1', 'W2', 'W3', 'W4', 'W5', 'TODAY'];
  const statusPalette = {
    present: 'bg-[#5d666c]',
    late: 'bg-[#e0be4f]',
    absent: 'bg-[#cfa5a2]',
    empty: 'bg-[#d9d6cf]',
  };

  return (
    <div className="space-y-5 rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-1.5 text-body-sm text-[#7c766d] hover:text-[#2f333a] transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        수강생 현황으로 돌아가기
      </button>

      <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ddd8cf] bg-[#d8e1e7]">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#4f6070]">
                {student.name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[2rem] text-[#2f333a]">{student.name}</h2>
                <Badge variant="soft-info">수강생</Badge>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={KeyRound}
                onClick={openPwModal}
              >
                비밀번호 재발급
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#6f6a61]">
              {student.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#9b968d]" />
                  {student.email}
                </span>
              )}
              {student.enrolled_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#9b968d]" />
                  등록일 {student.enrolled_at}
                </span>
              )}
              {student.last_active && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#9b968d]" />
                  최근 활동 {student.last_active}
                </span>
              )}
              {student.course_name && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#9b968d]" />
                  {student.course_name}
                  {student.cohort_number != null &&
                    ` · ${student.cohort_number}기`}
                </span>
              )}
              {student.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#9b968d]" />
                  {student.phone}
                </span>
              )}
              {student.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#9b968d]" />
                  {student.address}
                </span>
              )}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e8eef5] px-3 py-1.5 text-sm font-semibold text-[#3d5a6e]">
              <TrendingUp className="h-3.5 w-3.5" />
              출석률 {student.attendance_rate ?? 0}%
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        title="비밀번호 재발급"
        persistent
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-gray-600">
            {student.name} 학생의 새 비밀번호를 설정합니다. 변경 후 학생에게
            반드시 전달해 주세요.
          </p>
          <div className="flex flex-col gap-1.5">
            <Input
              label="새 비밀번호"
              type="text"
              placeholder="6자 이상"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPwError('');
                setPwResetDone(false);
              }}
              error={pwError}
              icon={KeyRound}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setNewPassword(generatePassword());
                  setPwError('');
                  setPwResetDone(false);
                }}
                className="text-caption text-primary-500 hover:underline"
              >
                자동 생성
              </button>
              {newPassword && (
                <button
                  type="button"
                  onClick={copyNewPassword}
                  className="inline-flex items-center gap-1 text-caption text-primary-500 hover:underline"
                >
                  <Copy className="h-3 w-3" /> 복사
                </button>
              )}
            </div>
          </div>
          {pwResetDone && (
            <div className="rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-body-sm text-success-700">
              비밀번호가 변경되었습니다. 모달을 닫기 전에 새 비밀번호를 학생에게
              전달해 주세요.
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPwModalOpen(false)}
            >
              닫기
            </Button>
            <Button
              type="button"
              onClick={handlePwSave}
              loading={pwSaving}
              disabled={pwResetDone}
            >
              {pwResetDone ? '변경 완료' : '변경 저장'}
            </Button>
          </div>
        </div>
      </Modal>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <p className="text-[1.9rem] text-[#2f333a]">Competency Hexagon</p>
          <div className="mt-3">
            <SkillRadarChart data={radarData} color="#636e76" size="sm" />
          </div>
          <div className="mt-4 border-t border-[#e3dfd8] pt-3">
            <p className="text-[0.7rem] uppercase tracking-[0.12em] text-[#8b8478]">
              종합 점수
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[2rem] font-semibold text-[#303742]">
                {overallScore}
              </span>
              <span className="text-sm text-[#7a756c]">/100</span>
              <Badge variant="soft-amber">High Potential</Badge>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_300px]">
            <div>
              <p className="text-[1.9rem] text-[#2f333a]">
                AI 관찰 인사이트 (AI Observation Insights)
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#5f5a53]">
                {student.name} 수강생은 과제 완성도는 높지만 출석 변동이 있어
                단기 루틴 코칭과 주간 피드백 체크를 병행하면 학습 지속성이
                좋아집니다.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="soft-info">Analytical Learner</Badge>
                <Badge variant="soft-success">Visual Maven</Badge>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e1ddd6] bg-white/80 p-4">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8b8478]">
                추천 경로 (Recommended Trajectory)
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[#4f4a43]">
                <li>• 고난도 과제 중심 주간 실습 확대</li>
                <li>• 1:1 피드백 세션으로 발표/면접 간극 보완</li>
                <li>• 포트폴리오 문서화 흐름 개선</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[1.8rem] text-[#2f333a]">
              Weekly Attendance Pulse
            </p>
            <div className="flex gap-3 text-[11px] text-[#7a756c]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#5d666c]" />
                출석
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#e0be4f]" />
                지각
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#cfa5a2]" />
                결석
              </span>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-4">
            {weekColumns.map((label, idx) => (
              <div key={label} className="space-y-2 text-center">
                <p className="text-[11px] font-semibold text-[#7b766c]">
                  {label}
                </p>
                {[0, 1, 2, 3, 4].map((row) => {
                  const record = weekAttendance[idx + row];
                  const status = record?.status ?? 'empty';
                  return (
                    <div
                      key={`${label}-${row}`}
                      className={`mx-auto h-6 w-6 rounded-md ${statusPalette[status] || statusPalette.empty} ${label === 'TODAY' ? 'ring-1 ring-[#727b84]' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
          <p className="text-[1.8rem] text-[#2f333a]">Archive & Artifacts</p>
          <div className="mt-4 space-y-2.5">
            {(student.files || []).slice(0, 4).map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-[#e5e1da] bg-white/85 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef0f2] text-[#57626d]">
                    {file.type === 'resume' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <FolderOpen className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#353a42]">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-[#7f7a72]">
                      {file.uploaded_at}
                    </p>
                  </div>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#5b6674]"
                >
                  보기
                </a>
              </div>
            ))}
            <button className="w-full rounded-xl border border-dashed border-[#cfc9bf] py-2 text-sm font-semibold text-[#7a756c]">
              + 새 문서 추가
            </button>
          </div>
        </Card>
      </div>

      <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] shadow-none">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[2rem] text-[#2f333a]">
            Instructor Consultation Notes
          </p>
          <Button
            size="sm"
            onClick={handleSaveNotes}
            loading={notesSaving}
            className="!rounded-full !bg-[#5f6972] !px-4 !text-white hover:!bg-[#4f5961]"
          >
            저장 (Save Entry)
          </Button>
        </div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="상담 관찰 내용, 행동 특성, 다음 목표를 기록하세요."
        />
      </Card>
    </div>
  );
}
