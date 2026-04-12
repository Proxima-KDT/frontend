import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  FolderOpen,
  BookOpen,
  MapPin,
  Phone,
  KeyRound,
  Copy,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';

function generatePassword() {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pw = '';
  for (let i = 0; i < 10; i += 1) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

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
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import SkillRadarChart from '@/components/charts/SkillRadarChart';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [notesSaving, setNotesSaving] = useState(false);
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
      const detail = err?.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
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
      .then(([studentData, attendanceData]) => {
        setStudent(studentData);
        setNotes(studentData.notes || '');
        setWeeklyAttendance(attendanceData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveNotes = useCallback(() => {
    setNotesSaving(true);
    adminApi.updateNotes(id, notes).finally(() => setNotesSaving(false));
  }, [id, notes]);

  if (loading || !student)
    return <div className="p-8 text-gray-400">로딩 중...</div>;

  const skillData = Object.entries(student.skills || {}).map(
    ([key, score]) => ({
      key,
      label: SKILL_LABELS[key] ?? key,
      radarLabel: RADAR_LABELS[key] ?? key,
      score: score ?? 0,
      fullMark: 100,
    }),
  );

  const radarData = skillData.map((item) => ({
    subject: item.radarLabel,
    score: item.score,
    fullMark: 100,
  }));

  const statusColors = {
    present: 'bg-success-500',
    late: 'bg-warning-500',
    absent: 'bg-error-500',
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

      {/* 학생 정보 헤더 */}
      <Card className="rounded-3xl border border-[#dfdbd4] bg-[#f8f7f4] shadow-none">
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#ddd8cf] bg-[#d8e1e7]">
            {student.avatar_url ? (
              <img
                src={student.avatar_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#4f6070]">
                {student.name?.charAt(0) ?? '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <h1 className="text-h2 font-bold text-gray-900">
                {student.name}
              </h1>
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
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#9b968d]" /> {student.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-[#9b968d]" /> 등록일:{' '}
                {student.enrolled_at}
              </span>
              {student.course_name && (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#9b968d]" /> {student.course_name}
                  {student.cohort_number != null && ` · ${student.cohort_number}기`}
                </span>
              )}
              {student.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#9b968d]" /> {student.phone}
                </span>
              )}
              {student.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#9b968d]" /> {student.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 비밀번호 재발급 모달 */}
      <Modal
        isOpen={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        title="비밀번호 재발급"
        persistent
      >
        <div className="flex flex-col gap-4">
          <p className="text-body-sm text-gray-600">
            {student.name} 학생의 새 비밀번호를 설정합니다.
            변경 후 학생에게 반드시 전달해 주세요.
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
                  className="text-caption text-primary-500 hover:underline inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> 복사
                </button>
              )}
            </div>
          </div>
          {pwResetDone && (
            <div className="rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-body-sm text-success-700">
              비밀번호가 변경되었습니다. 모달을 닫기 전에 새 비밀번호를 학생에게 전달해 주세요.
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

      {/* 스킬 분석 */}
      <Card className="mb-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-5">스킬 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex justify-center">
            <SkillRadarChart data={radarData} color="#8B5CF6" />
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 상담 노트 */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">상담 노트</h2>
            <button
              onClick={handleSaveNotes}
              disabled={notesSaving}
              className="text-caption text-admin-600 hover:text-admin-700 font-medium disabled:opacity-50"
            >
              {notesSaving ? '저장 중...' : '저장'}
            </button>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="학생에 대한 메모를 작성하세요..."
          />
        </Card>

        {/* 이번 주 출석 */}
        <Card className="flex flex-col">
          <h2 className="text-h3 font-semibold text-gray-900 mb-6">
            이번 주 출석
          </h2>
          <div className="grid grid-cols-7 gap-3 flex-1">
            {[
              '\uc77c',
              '\uc6d4',
              '\ud654',
              '\uc218',
              '\ubaa9',
              '\uae08',
              '\ud1a0',
            ].map((d, idx) => {
              const day = weeklyAttendance.find(
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
                      day?.status ? statusColors[day.status] : 'bg-gray-300'
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
              <div className="w-3 h-3 rounded-full bg-warning-500" /> 지각
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error-500" /> 결석
            </span>
          </div>
        </Card>
      </div>

      {/* 이력서 / 포트폴리오 */}
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
                      file.type === 'resume' ? 'bg-admin-50' : 'bg-student-50'
                    }`}
                  >
                    {file.type === 'resume' ? (
                      <FileText className="w-5 h-5 text-admin-500" />
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
                    className="text-body-sm text-admin-600 hover:text-admin-700 font-medium"
                  >
                    보기
                  </a>
                  <a
                    href={file.url}
                    download
                    className="text-body-sm text-gray-500 hover:text-gray-700 font-medium"
                  >
                    다운로드
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-gray-400">등록된 파일이 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
