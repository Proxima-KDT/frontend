import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import Skeleton from '@/components/common/Skeleton';
import StudentProfileView from '@/components/common/StudentProfileView';

// teacher API의 skills 키(언더스코어)를 StudentProfileView의 subject(한글)로 변환
const SKILL_KEY_TO_SUBJECT = {
  출결: '출결',
  AI_말하기: 'AI 말하기',
  AI_면접: 'AI 면접',
  포트폴리오: '포트폴리오',
  프로젝트_과제_시험: '프로젝트·과제·시험',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton width="180px" height="20px" rounded="rounded" />
      <Skeleton width="100%" height="200px" rounded="rounded-2xl" />
      <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [student, setStudent] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi
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

  // teacher API 반환값 → StudentProfileView props 형태로 매핑
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
      {/* 뒤로가기 버튼 */}
      <div className="px-4 py-4 sm:px-6 md:px-8">
        <button
          onClick={() => navigate('/teacher')}
          className="flex items-center gap-1.5 text-body-sm text-[#7c766d] hover:text-[#2f333a] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          수강생 목록
        </button>
      </div>

      {/* 프로필 뷰 (MyPage 레이아웃 그대로, readOnly) */}
      <StudentProfileView
        profile={profile}
        skillScores={skillScores}
        files={files}
        readOnly={true}
      />

      {/* 강사 메모 섹션 */}
      <div className="px-4 pb-8 sm:px-6 md:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="mt-6 rounded-3xl border border-[#dfdbd4] bg-[#f2f1ee] p-6 sm:p-7">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[1.5rem] font-semibold text-[#2f333a]">
                강사 메모
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
            <div className="mt-4 border-t border-[#e0ddd6] pt-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8b8478]">
                Session History
              </p>
              <p className="mt-2 text-sm text-[#58534c]">
                • 최근 메모가 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
