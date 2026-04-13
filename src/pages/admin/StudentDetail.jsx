import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, UserCircle, KeyRound, Copy } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';
import Modal from '@/components/common/Modal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import Skeleton from '@/components/common/Skeleton';
import StudentProfileView from '@/components/common/StudentProfileView';

// admin API의 skills 키(언더스코어)를 StudentProfileView의 subject(한글)로 변환
const SKILL_KEY_TO_SUBJECT = {
  출결: '출결',
  AI_말하기: 'AI 말하기',
  AI_면접: 'AI 면접',
  포트폴리오: '포트폴리오',
  프로젝트_과제_시험: '프로젝트·과제·시험',
};

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
      <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
      <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
    </div>
  );
}

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
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
    adminApi
      .getStudent(id)
      .then((s) => {
        setStudent(s);
        setNotes(s.notes || '');
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

  // admin API 반환값 → StudentProfileView props 형태로 매핑
  const profile = {
    name: student.name,
    email: student.email,
    avatar_url: student.avatar_url,
    overall_score: student.overall_score,
    tier: student.tier,
    course_name: student.course_name,
    cohort_number: student.cohort_number,
    course_start_date: student.course_start_date,
    course_end_date: student.course_end_date,
    teacher_name: student.teacher_name,
    mentor_name: student.mentor_name,
    daily_start_time: student.daily_start_time,
    daily_end_time: student.daily_end_time,
  };

  const skillScores = Object.entries(student.skills || {}).map(([key, score]) => ({
    subject: SKILL_KEY_TO_SUBJECT[key] || key,
    score: score ?? 0,
  }));

  const files = student.files || [];

  return (
    <div className="space-y-0">
      {/* 뒤로가기 + 비밀번호 재발급 버튼 */}
      <div className="px-4 py-4 sm:px-6 md:px-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 text-body-sm text-[#7c766d] hover:text-[#2f333a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          수강생 목록
        </button>
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

      {/* 비밀번호 재발급 모달 */}
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

      {/* 프로필 뷰 (MyPage 레이아웃 그대로, readOnly) */}
      <StudentProfileView
        profile={profile}
        skillScores={skillScores}
        files={files}
        readOnly={true}
      />

      {/* 관리자 메모 섹션 */}
      <div className="px-4 pb-8 sm:px-6 md:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="mt-6 rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] p-6 sm:p-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[1.5rem] font-semibold text-[#2f333a]">
                관리자 메모
              </p>
              <Button
                size="sm"
                onClick={handleSaveNotes}
                loading={notesSaving}
                className="!rounded-full !bg-[#5f6972] !px-4 !text-white hover:!bg-[#4f5961]"
              >
                저장
              </Button>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="상담 관찰 내용, 행동 특성, 다음 목표를 기록하세요."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
