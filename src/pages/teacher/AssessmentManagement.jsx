import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCcw,
  AlertTriangle,
  FileText,
  Bell,
  Search,
  CircleHelp,
  RotateCcw,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useCourse } from '@/context/CourseContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import { useToast } from '@/context/ToastContext';

const PHASE_COLORS = [
  { bg: 'bg-[#65737e]', light: 'bg-[#e2eaef]', text: 'text-[#476171]' },
  { bg: 'bg-[#78808f]', light: 'bg-[#e6e8f1]', text: 'text-[#596077]' },
  { bg: 'bg-[#768568]', light: 'bg-[#e7ecdf]', text: 'text-[#58694b]' },
  { bg: 'bg-[#9a7e4f]', light: 'bg-[#f1e8d7]', text: 'text-[#84652f]' },
  { bg: 'bg-[#8a6f6c]', light: 'bg-[#efe3e1]', text: 'text-[#785653]' },
  { bg: 'bg-[#667287]', light: 'bg-[#e3e8ef]', text: 'text-[#4f5f79]' },
];

function formatSubmittedAt(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d)) return null;
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterdayStr = new Date(now - 86400000).toDateString();
  const hhmm = d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (d.toDateString() === todayStr) return `오늘 ${hhmm}`;
  if (d.toDateString() === yesterdayStr) return `어제 ${hhmm}`;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}월 ${day}일 ${hhmm}`;
}

const STATUS_CONFIG = {
  // DB 레코드 없음 (백엔드에서 pending으로 내려옴)
  pending: {
    label: '미제출',
    classes: 'bg-[#eeece8] text-[#7a756c]',
    Icon: Clock,
  },
  // assessment_status_enum: 평가 기간 전 잠김
  locked: {
    label: '미개방',
    classes: 'bg-[#e8e6e2] text-[#a09890]',
    Icon: Clock,
  },
  // assessment_status_enum: 평가 기간 중, 미제출
  open: {
    label: '미제출',
    classes: 'bg-[#eeece8] text-[#7a756c]',
    Icon: Clock,
  },
  submitted: {
    label: '제출완료',
    classes: 'bg-[#dbe9ea] text-[#567881]',
    Icon: CheckCircle2,
  },
  graded: {
    label: '채점완료',
    classes: 'bg-[#dce8ea] text-[#4f6f78]',
    Icon: CheckCircle2,
  },
  resubmit_required: {
    label: '재제출 요청',
    classes: 'bg-[#f1e6d3] text-[#8a6a39]',
    Icon: RefreshCcw,
  },
};

// 제출 파일이 있는 상태 (다운로드 버튼 표시 조건)
const HAS_FILES_STATUS = new Set(['submitted', 'graded', 'resubmit_required']);

function normalizeAssessments(data) {
  return data.map((a) => ({
    id: a.id,
    phaseId: a.phaseId ?? a.phase_id,
    phaseTitle: a.phaseTitle ?? a.phase_title ?? '',
    title: a.title ?? '',
    subject: a.subject || '',
    period: {
      start: a.period?.start ?? a.period_start ?? '',
      end: a.period?.end ?? a.period_end ?? '',
    },
    passScore: a.passScore ?? a.pass_score ?? 60,
    rubric: a.rubric || [],
    studentSubmissions: (
      a.studentSubmissions ??
      a.student_submissions ??
      []
    ).map((s) => ({
      studentId: s.studentId ?? s.student_id,
      studentName: s.studentName ?? s.student_name,
      status: s.status || 'pending',
      submittedAt: s.submittedAt ?? s.submitted_at ?? null,
      score: s.score ?? null,
      passed: s.passed ?? null,
      feedback: s.feedback || '',
      files: s.files || [],
      rubricScores: s.rubricScores ?? s.rubric_scores ?? [],
    })),
  }));
}

export default function AssessmentManagement() {
  const { showToast } = useToast();
  const { selectedCourseId, selectedCourse } = useCourse();
  const isSubCourse = selectedCourse?.track_type === 'sub';
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(null);

  useEffect(() => {
    if (!selectedCourseId || isSubCourse) {
      setAssessments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    teacherApi
      .getAssessments(selectedCourseId)
      .then((data) => {
        const normalized = normalizeAssessments(data);
        setAssessments(normalized);
        if (normalized.length > 0) setActivePhase(normalized[0].phaseId);
      })
      .catch(() =>
        showToast({
          message: '평가 정보를 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, [selectedCourseId, isSubCourse, showToast]);
  const [aiModal, setAiModal] = useState(null); // { assessment, student, mode: 'ai'|'manual' }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [signedFiles, setSignedFiles] = useState([]);

  const current = assessments.find((a) => a.phaseId === activePhase);
  const phaseColor =
    PHASE_COLORS[Math.max(0, Number(activePhase) - 1) % 6] ?? PHASE_COLORS[0];

  const fetchSignedFiles = (assessment, student) => {
    // 항상 API에서 signed URL 조회 — files 배열에 의존하지 않음
    teacherApi
      .getAssessmentFiles(assessment.id, student.studentId)
      .then((res) => setSignedFiles(res.files || []))
      .catch(() => setSignedFiles([]));
  };

  const handleOpenAiModal = (assessment, student) => {
    setAiModal({ assessment, student, mode: 'ai' });
    setAiResult(null);
    setAiLoading(false);
    fetchSignedFiles(assessment, student);
  };

  const handleOpenManualModal = (assessment, student) => {
    const rubricScores =
      student.rubricScores?.length > 0
        ? student.rubricScores
        : assessment.rubric.map((r) => ({
            item: r.item,
            score: 0,
            maxScore: r.maxScore,
          }));
    const score = rubricScores.reduce((sum, r) => sum + (r.score || 0), 0);
    setAiModal({ assessment, student, mode: 'manual' });
    setAiResult({
      rubricScores,
      score,
      passed: score >= assessment.passScore,
      feedback: student.feedback || '',
    });
    setAiLoading(false);
    fetchSignedFiles(assessment, student);
  };

  const handleCloseAiModal = () => {
    setAiModal(null);
    setAiResult(null);
    setAiLoading(false);
    setSignedFiles([]);
  };

  const handleRunAi = () => {
    setAiLoading(true);
    teacherApi
      .aiScoreAssessment(aiModal.assessment.id, aiModal.student.studentId)
      .then((result) => {
        setAiResult({
          rubricScores: result.rubric_scores || [],
          score: result.score,
          passed: result.passed,
          feedback: result.feedback || '',
        });
      })
      .catch(() =>
        showToast({ message: 'AI 채점에 실패했습니다.', type: 'error' }),
      )
      .finally(() => setAiLoading(false));
  };

  const handleUpdateAiScore = (item, value) => {
    const updated = aiResult.rubricScores.map((r) =>
      r.item === item
        ? { ...r, score: Math.min(r.maxScore, Math.max(0, Number(value))) }
        : r,
    );
    const total = updated.reduce((sum, r) => sum + r.score, 0);
    setAiResult((prev) => ({
      ...prev,
      rubricScores: updated,
      score: total,
      passed: total >= aiModal.assessment.passScore,
    }));
  };

  // fetch → Blob → objectURL 방식 (supabase.co 크로스 오리진 URL 은 a.download 가 무시돼 새 탭으로 열리므로 blob 으로 강제)
  const forceDownload = (name, url) =>
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() =>
        showToast({
          message: `${name} 다운로드에 실패했습니다.`,
          type: 'error',
        }),
      );

  const handleDownloadFile = (assessment, student) => {
    teacherApi
      .getAssessmentFiles(assessment.id, student.studentId)
      .then(({ files }) => {
        if (!files?.length) {
          showToast({ message: '다운로드할 파일이 없습니다.', type: 'info' });
          return;
        }
        files.forEach((f) => forceDownload(f.name, f.url));
      })
      .catch(() =>
        showToast({ message: '파일 다운로드에 실패했습니다.', type: 'error' }),
      );
  };

  const handleConfirmGrade = (requireResubmit = false) => {
    const { assessment, student } = aiModal;
    const payload = requireResubmit
      ? { feedback: aiResult.feedback, require_resubmit: true }
      : {
          score: aiResult.score,
          feedback: aiResult.feedback,
          rubricScores: aiResult.rubricScores,
          passed: aiResult.passed,
        };
    teacherApi
      .gradeAssessmentSubmission(assessment.id, student.studentId, payload)
      .then(() => {
        setAssessments((prev) =>
          prev.map((a) =>
            a.phaseId !== assessment.phaseId
              ? a
              : {
                  ...a,
                  studentSubmissions: a.studentSubmissions.map((s) =>
                    s.studentId !== student.studentId
                      ? s
                      : requireResubmit
                      ? {
                          ...s,
                          status: 'resubmit_required',
                          score: null,
                          passed: null,
                          feedback: aiResult.feedback,
                          rubricScores: null,
                        }
                      : {
                          ...s,
                          status: 'graded',
                          score: aiResult.score,
                          passed: aiResult.passed,
                          feedback: aiResult.feedback,
                          rubricScores: aiResult.rubricScores,
                        },
                  ),
                },
          ),
        );
        handleCloseAiModal();
        showToast({
          message: requireResubmit
            ? '재제출을 요청했습니다.'
            : '채점이 확정되었습니다.',
          type: 'success',
        });
      })
      .catch(() =>
        showToast({
          message: requireResubmit
            ? '재제출 요청에 실패했습니다.'
            : '채점 확정에 실패했습니다.',
          type: 'error',
        }),
      );
  };

  // 서브 과정은 능력단위평가가 없어 안내 카드만 렌더링
  if (isSubCourse) {
    return (
      <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
        <h1 className="mb-6 text-[1.5rem] font-semibold text-[#2a2a2a]">
          능력단위평가 관리
        </h1>
        <Card className="rounded-2xl border border-[#e1ded8] bg-[#f7f6f2]">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eeece8]">
              <AlertTriangle className="h-6 w-6 text-[#9e9890]" />
            </div>
            <h2 className="mb-2 text-base font-bold text-[#2f333a]">
              서브 과정은 능력단위평가가 없습니다
            </h2>
            <p className="max-w-sm text-sm text-[#7c7870]">
              현재 선택된{' '}
              <span className="font-semibold text-[#2f333a]">
                {selectedCourse?.name}
              </span>
              은(는) 단기 과정으로 능력단위평가 대상이 아닙니다. 사이드바에서
              메인 과정을 선택하면 평가 관리가 가능합니다.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#dbd8d1] pb-3">
        <div>
          <h1 className="text-[1.5rem] font-semibold text-[#2a2a2a]">
            능력단위평가 관리
          </h1>
          <p className="mt-1 text-[0.8rem] font-medium tracking-wide text-[#a39c92]">
            Competency Evaluation Management
          </p>
        </div>
      </div>

      {/* Phase 탭 */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-[#f1eee8] p-1.5 pb-1">
        {assessments.map((a, idx) => {
          const color = PHASE_COLORS[idx % 6];
          const isActive = activePhase === a.phaseId;
          return (
            <button
              key={a.phaseId}
              onClick={() => setActivePhase(a.phaseId)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#232833] text-white shadow-sm'
                  : 'bg-transparent text-[#6f6a61] hover:bg-white hover:text-[#35312d]'
              }`}
            >
              Phase {a.phaseId}
            </button>
          );
        })}
      </div>

      {current && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <Card className="rounded-2xl border border-[#e1ded8] bg-[#f7f6f2]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#9e9890]">
                평가 모듈
              </p>
              <h2 className="mt-1.5 text-[1.2rem] font-bold leading-snug text-[#1f2f43]">
                {current.title}
              </h2>
              {current.subject && (
                <p className="mt-1.5 text-sm leading-relaxed text-[#7c7870]">
                  {current.subject}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="rounded-xl border border-[#e0ddd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9e9890]">
                    마감일
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2f333a]">
                    {current.period.end || '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e0ddd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9e9890]">
                    합격 기준
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2f333a]">
                    {current.passScore}점 이상
                  </p>
                </div>
                <div className="rounded-xl border border-[#e0ddd6] bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9e9890]">
                    채점 기준
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2f333a]">
                    {current.rubric.reduce((s, r) => s + (r.maxScore ?? 0), 0)}
                    점
                  </p>
                </div>
              </div>
            </Card>
            <Card className="rounded-2xl border border-[#e1ded8] bg-[#f7f6f2]">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#9e9890]">
                  채점 기준
                </p>
                <span className="text-[10px] font-semibold text-[#7c7870]">
                  총 {current.rubric.reduce((s, r) => s + (r.maxScore ?? 0), 0)}
                  점
                </span>
              </div>
              <div className="space-y-2">
                {current.rubric.map((r) => (
                  <div
                    key={r.item}
                    className="flex items-center justify-between rounded-xl border border-[#e0ddd6] bg-white px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-[#2f333a]">
                      {r.item}
                    </p>
                    <span className="text-xs font-bold text-[#59606a]">
                      {r.maxScore}점
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 제출 통계 */}
          <div className="grid grid-cols-1 gap-4">
            <Card className="rounded-2xl border border-[#e1ded8] bg-[#f7f6f2]">
              <p className="mb-4 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#9e9890]">
                제출 현황
              </p>
              <div className="space-y-3">
                {[
                  {
                    label: '제출률',
                    value: current.studentSubmissions.filter(
                      (s) => s.status !== 'pending',
                    ).length,
                    total: current.studentSubmissions.length,
                    barColor: 'bg-[#586067]',
                    textColor: 'text-[#374151]',
                  },
                  {
                    label: '채점 진행률',
                    value: current.studentSubmissions.filter(
                      (s) => s.status === 'graded',
                    ).length,
                    total: current.studentSubmissions.length,
                    barColor: 'bg-[#6f8791]',
                    textColor: 'text-[#374151]',
                  },
                  {
                    label: '예상 합격률',
                    value: current.studentSubmissions.filter(
                      (s) => s.passed === true,
                    ).length,
                    total: current.studentSubmissions.length,
                    barColor: 'bg-[#8c7632]',
                    textColor: 'text-[#8a6a28]',
                  },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <p className="font-medium text-[#5a554e]">{stat.label}</p>
                      <p className="font-semibold text-[#2f333a]">
                        {stat.value}/{stat.total}명
                      </p>
                    </div>
                    <p className={`text-h3 font-bold ${stat.textColor}`}>
                      {stat.total > 0
                        ? Math.round((stat.value / stat.total) * 100)
                        : 0}
                      %
                    </p>
                    <ProgressBar
                      value={
                        stat.total > 0
                          ? Math.round((stat.value / stat.total) * 100)
                          : 0
                      }
                      size="sm"
                      showValue={false}
                      color={stat.barColor}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* 학생별 제출 현황 */}
          <Card className="rounded-2xl border border-[#e1ded8] bg-[#f7f6f2]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#9e9890]">
                학생별 제출 현황
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#9e9890]">
                  전체 {current.studentSubmissions.length}명
                </span>
                <span className="text-[#e0ddd6]">·</span>
                <span className="font-semibold text-[#4a7a55]">
                  채점완료{' '}
                  {
                    current.studentSubmissions.filter(
                      (s) => s.status === 'graded',
                    ).length
                  }
                  명
                </span>
                <span className="text-[#e0ddd6]">·</span>
                <span className="font-semibold text-[#7c7870]">
                  미제출{' '}
                  {
                    current.studentSubmissions.filter(
                      (s) => !HAS_FILES_STATUS.has(s.status),
                    ).length
                  }
                  명
                </span>
              </div>
            </div>
            <div className="max-h-[432px] overflow-y-auto overscroll-contain rounded-xl border border-[#e8e5e0] pr-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d8d4ce] [&::-webkit-scrollbar-track]:bg-transparent">
              <div className="space-y-1.5 p-1">
                {current.studentSubmissions.map((student) => {
                  const statusCfg =
                    STATUS_CONFIG[student.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 rounded-xl bg-[#f0eee9] p-3 transition-colors hover:bg-[#eceae4]"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${phaseColor.light}`}
                      >
                        <span
                          className={`text-xs font-bold ${phaseColor.text}`}
                        >
                          {student.studentName?.[0] ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#2f333a]">
                          {student.studentName}
                        </p>
                        {formatSubmittedAt(student.submittedAt) && (
                          <p className="mt-0.5 text-xs text-[#9e9890]">
                            제출 {formatSubmittedAt(student.submittedAt)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.classes}`}
                      >
                        {statusCfg.label}
                      </span>
                      {student.score !== null && (
                        <span
                          className={`shrink-0 text-sm font-bold ${
                            student.passed ? 'text-[#4a7a55]' : 'text-[#b85b5b]'
                          }`}
                        >
                          {student.score}점 {student.passed ? '✓' : '✗'}
                        </span>
                      )}
                      {HAS_FILES_STATUS.has(student.status) && (
                        <button
                          onClick={() => handleDownloadFile(current, student)}
                          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-[#9e9890] transition-colors hover:bg-white hover:text-[#59606a]"
                          title="제출 파일 다운로드"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      <div className="flex gap-1.5 shrink-0">
                        {student.status === 'submitted' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="bg-white! text-[#59606a]! border-[#d9d2c6]! hover:bg-[#f5f1ea]!"
                              onClick={() =>
                                handleOpenManualModal(current, student)
                              }
                            >
                              직접 채점
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Sparkles}
                              className="bg-[#59606a]! text-white! hover:bg-[#444b55]!"
                              onClick={() =>
                                handleOpenAiModal(current, student)
                              }
                            >
                              AI 채점
                            </Button>
                          </>
                        )}
                        {student.status === 'graded' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenManualModal(current, student)
                              }
                            >
                              직접 재채점
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Sparkles}
                              onClick={() =>
                                handleOpenAiModal(current, student)
                              }
                            >
                              AI 재채점
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI 채점 모달 */}
      {aiModal && (
        <Modal
          isOpen={!!aiModal}
          onClose={handleCloseAiModal}
          title={`${aiModal.student.status === 'graded' ? '재채점' : '채점'} (${aiModal.mode === 'manual' ? '직접' : 'AI'}) — ${aiModal.student.studentName}`}
          maxWidth="max-w-[560px]"
          persistent
        >
          <div className="space-y-4">
            {/* 경고 배너 — AI 모드에서만 표시 */}
            {aiModal.mode === 'ai' && (
              <div className="flex gap-2 rounded-xl border border-[#dfc888] bg-[#f4ead8] p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6420]" />
                <p className="text-xs text-[#7a5a20]">
                  AI 채점 결과는 참고용입니다. 반드시 검토 후 확정하세요.
                </p>
              </div>
            )}

            {/* 제출 파일 — signed URL 기준으로 렌더링 */}
            {signedFiles.length > 0 && (
              <div>
                <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#9e9890]">
                  제출 파일
                </p>
                <div className="space-y-1.5">
                  {signedFiles.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-2 rounded-xl border border-[#e0ddd6] bg-[#f4f3f0] p-2.5"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-[#9e9890]" />
                      <span className="flex-1 truncate text-sm text-[#3a3830]">
                        {f.name}
                      </span>
                      <button
                        className="shrink-0 cursor-pointer rounded-lg p-1 hover:bg-white"
                        onClick={() => forceDownload(f.name, f.url)}
                        title="파일 다운로드"
                      >
                        <Download className="h-3.5 w-3.5 text-[#7c7870]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!aiResult ? (
              /* AI 채점 시작 전 */
              <div className="space-y-3">
                <div className={`rounded-xl p-3 ${phaseColor.light}`}>
                  <p className={`text-sm font-semibold ${phaseColor.text}`}>
                    {aiModal.assessment.title}
                  </p>
                  <p className="mt-1 text-xs text-[#7c7870]">
                    루브릭 {aiModal.assessment.rubric.length}개 항목 기준으로
                    자동 채점합니다.
                  </p>
                </div>
                <Button
                  variant="warm"
                  fullWidth
                  icon={Sparkles}
                  onClick={handleRunAi}
                  loading={aiLoading}
                >
                  {aiLoading ? 'AI 채점 중...' : 'AI 채점 시작'}
                </Button>
                {aiLoading && (
                  <div>
                    <p className="mb-2 text-center text-xs text-[#9e9890]">
                      코드를 분석하고 루브릭을 적용하는 중...
                    </p>
                    <ProgressBar
                      value={72}
                      color="bg-[#59606a]"
                      showValue={false}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* AI 채점 결과 */
              <>
                <div className="rounded-xl border border-[#b8d4b0] bg-[#e8ede5] p-3">
                  <p className="text-sm font-semibold text-[#3a5a40]">
                    {aiModal.mode === 'manual' ? '직접 채점' : 'AI 채점 완료'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7c7870]">
                    점수와 피드백을 검토하고 수정한 뒤 확정하세요.
                  </p>
                </div>

                {/* 루브릭 점수 (수정 가능) */}
                <div className="rounded-xl border border-[#e0ddd6] bg-[#f8f7f4] px-4 py-3">
                  <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#9e9890]">
                    루브릭 채점
                  </p>
                  <div className="space-y-2">
                    {aiResult.rubricScores.map((r) => (
                      <div key={r.item} className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-[#3a3830]">
                          {r.item}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={r.maxScore}
                            value={r.score}
                            onChange={(e) =>
                              handleUpdateAiScore(r.item, e.target.value)
                            }
                            className="w-16 rounded-lg border border-[#ddd9d2] bg-white px-2 py-1.5 text-center text-sm text-[#2f333a] outline-none focus:border-[#59606a] focus:ring-1 focus:ring-[#59606a]"
                          />
                          <span className="text-xs text-[#9e9890]">
                            /{r.maxScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#e0ddd6] pt-3">
                    <span className="text-sm font-semibold text-[#3a3830]">
                      총점
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold tabular-nums text-[#59606a]">
                        {aiResult.score}점
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          aiResult.passed
                            ? 'bg-[#e2ede5] text-[#3a5a40]'
                            : 'bg-[#f3e8e8] text-[#944848]'
                        }`}
                      >
                        {aiResult.passed ? '합격' : '불합격'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI 피드백 (수정 가능) */}
                <div>
                  <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#9e9890]">
                    피드백
                  </p>
                  <Textarea
                    value={aiResult.feedback}
                    onChange={(e) =>
                      setAiResult((prev) => ({
                        ...prev,
                        feedback: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    className="flex-1 bg-[#f5ede0]! text-[#8a5a2e]! border-[#d9c4a0]! hover:bg-[#ecdfc8]!"
                    icon={RotateCcw}
                    onClick={() => handleConfirmGrade(true)}
                  >
                    재제출 요청
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-[#59606a]! text-white! hover:bg-[#444b55]!"
                    onClick={() => handleConfirmGrade(false)}
                  >
                    채점 확정
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
