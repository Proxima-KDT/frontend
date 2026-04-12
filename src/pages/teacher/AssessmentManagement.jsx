import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCcw,
  AlertTriangle,
  FileText,
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
  const hhmm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (d.toDateString() === todayStr) return `오늘 ${hhmm}`;
  if (d.toDateString() === yesterdayStr) return `어제 ${hhmm}`;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}월 ${day}일 ${hhmm}`;
}

const STATUS_CONFIG = {
  pending: {
    label: '미제출',
    classes: 'bg-gray-100 text-gray-500',
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
  const phaseColor = PHASE_COLORS[(activePhase - 1) % 6];

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

  const handleDownloadFile = (assessment, student) => {
    teacherApi
      .getAssessmentFiles(assessment.id, student.studentId)
      .then(({ files }) => {
        if (!files?.length) {
          showToast({ message: '다운로드할 파일이 없습니다.', type: 'info' });
          return;
        }
        files.forEach((f) => window.open(f.url, '_blank'));
      })
      .catch(() =>
        showToast({ message: '파일 다운로드에 실패했습니다.', type: 'error' }),
      );
  };

  const handleConfirmGrade = () => {
    const { assessment, student } = aiModal;
    teacherApi
      .gradeAssessmentSubmission(assessment.id, student.studentId, {
        score: aiResult.score,
        feedback: aiResult.feedback,
        rubric_scores: aiResult.rubricScores,
        passed: aiResult.passed,
      })
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
        showToast({ message: '채점이 확정되었습니다.', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '채점 확정에 실패했습니다.', type: 'error' }),
      );
  };

  // 서브 과정은 능력단위평가가 없어 안내 카드만 렌더링
  if (isSubCourse) {
    return (
      <div>
        <h1 className="text-h1 font-bold text-gray-900 mb-6">
          능력단위평가 관리
        </h1>
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-gray-400" />
            </div>
            <h2 className="text-h3 font-bold text-gray-800 mb-2">
              서브 과정은 능력단위평가가 없습니다
            </h2>
            <p className="text-body-sm text-gray-500 max-w-sm">
              현재 선택된{' '}
              <span className="font-semibold text-gray-700">
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
      <h1 className="text-h1 font-bold text-gray-900 mb-6">
        능력단위평가 관리
      </h1>

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
          {/* 평가 정보 카드 */}
          <Card>
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${phaseColor.bg} flex items-center justify-center shrink-0`}
              >
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-h3 font-bold text-gray-900">
                    {current.title}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${phaseColor.light} ${phaseColor.text}`}
                  >
                    {current.phaseTitle}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{current.subject}</p>
                <p className="text-caption text-gray-500">
                  제출 기간: {current.period.start} ~ {current.period.end} ·
                  합격 기준: {current.passScore}점 이상
                </p>
              </div>
            </div>
            {/* 루브릭 미리보기 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                채점 기준 (루브릭)
              </p>
              <div className="flex flex-wrap gap-2">
                {current.rubric.map((r) => (
                  <span
                    key={r.item}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${phaseColor.light} ${phaseColor.text}`}
                  >
                    {r.item} ({r.maxScore}점)
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* 제출 통계 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: '제출 완료',
                value: current.studentSubmissions.filter(
                  (s) => s.status !== 'pending',
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#586067]',
                textColor: 'text-[#374151]',
              },
              {
                label: '채점 완료',
                value: current.studentSubmissions.filter(
                  (s) => s.status === 'graded',
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#6f8791]',
                textColor: 'text-[#374151]',
              },
              {
                label: '합격',
                value: current.studentSubmissions.filter(
                  (s) => s.passed === true,
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#8c7632]',
                textColor: 'text-[#8a6a28]',
              },
            ].map((stat) => (
              <Card key={stat.label} padding="p-3">
                <p className="text-caption text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-h3 font-bold ${stat.textColor}`}>
                  {stat.value}
                  <span className="text-caption text-gray-400 font-normal">
                    /{stat.total}
                  </span>
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
              </Card>
            ))}
          </div>

          {/* 학생별 제출 현황 */}
          <Card>
            <p className="text-sm font-semibold text-gray-700 mb-3">
              학생별 제출 현황
            </p>
            <div className="space-y-2">
              {current.studentSubmissions.map((student) => {
                const statusCfg = STATUS_CONFIG[student.status];
                return (
                  <div
                    key={student.studentId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full ${phaseColor.light} flex items-center justify-center shrink-0`}
                    >
                      <span className={`text-xs font-bold ${phaseColor.text}`}>
                        {student.studentName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {student.studentName}
                      </p>
                      {formatSubmittedAt(student.submittedAt) && (
                        <p className="text-caption text-gray-400 mt-0.5">
                          제출 {formatSubmittedAt(student.submittedAt)}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusCfg.classes}`}
                    >
                      {statusCfg.label}
                    </span>
                    {student.score !== null && (
                      <span
                        className={`font-bold text-sm shrink-0 ${student.passed ? 'text-green-600' : 'text-error-500'}`}
                      >
                        {student.score}점 {student.passed ? '✓' : '✗'}
                      </span>
                    )}
                    {student.status !== 'pending' && (
                      <div className="relative group shrink-0">
                        <button
                          onClick={() =>
                            student.files?.length > 0
                              ? handleDownloadFile(current, student)
                              : undefined
                          }
                          disabled={!student.files?.length}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.files?.length > 0
                              ? 'hover:bg-white text-gray-500 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={
                            student.files?.length > 0
                              ? '제출 파일 다운로드'
                              : '파일 미첨부'
                          }
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {!student.files?.length && (
                          <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-700 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            파일 미첨부
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-1.5 shrink-0">
                      {student.status === 'submitted' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
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
                            onClick={() => handleOpenAiModal(current, student)}
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
                            onClick={() => handleOpenAiModal(current, student)}
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700">
                  AI 채점 결과는 참고용입니다. 반드시 검토 후 확정하세요.
                </p>
              </div>
            )}

            {/* 제출 파일 — signed URL 기준으로 렌더링 */}
            {signedFiles.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  제출 파일
                </p>
                <div className="space-y-1.5">
                  {signedFiles.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {f.name}
                      </span>
                      <button
                        className="p-1 rounded hover:bg-gray-200 cursor-pointer shrink-0"
                        onClick={() => window.open(f.url, '_blank')}
                        title="파일 열기"
                      >
                        <Download className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!aiResult ? (
              /* AI 채점 시작 전 */
              <div className="space-y-3">
                <div className={`p-3 rounded-xl ${phaseColor.light}`}>
                  <p className={`text-sm font-semibold ${phaseColor.text}`}>
                    {aiModal.assessment.title}
                  </p>
                  <p className="text-caption text-gray-600 mt-1">
                    루브릭 {aiModal.assessment.rubric.length}개 항목 기준으로
                    자동 채점합니다.
                  </p>
                </div>
                <Button
                  variant="primary"
                  fullWidth
                  icon={Sparkles}
                  onClick={handleRunAi}
                  loading={aiLoading}
                >
                  {aiLoading ? 'AI 채점 중...' : 'AI 채점 시작'}
                </Button>
                {aiLoading && (
                  <div>
                    <p className="text-caption text-gray-500 mb-2 text-center">
                      코드를 분석하고 루브릭을 적용하는 중...
                    </p>
                    <ProgressBar
                      value={72}
                      color="bg-primary-500"
                      showValue={false}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* AI 채점 결과 */
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-sm font-semibold text-green-700">
                    {aiModal.mode === 'manual' ? '직접 채점' : 'AI 채점 완료'}
                  </p>
                  <p className="text-caption text-gray-600 mt-0.5">
                    점수와 피드백을 검토하고 수정한 뒤 확정하세요.
                  </p>
                </div>

                {/* 루브릭 점수 (수정 가능) */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    루브릭 채점
                  </p>
                  <div className="space-y-2">
                    {aiResult.rubricScores.map((r) => (
                      <div key={r.item} className="flex items-center gap-3">
                        <span className="flex-1 text-sm text-gray-700">
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
                            className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-caption text-gray-400">
                            /{r.maxScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="font-semibold text-gray-700">총점</span>
                    <div className="flex items-center gap-2">
                      <span className="text-h3 font-bold text-primary-600">
                        {aiResult.score}점
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${aiResult.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {aiResult.passed ? '합격' : '불합격'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI 피드백 (수정 가능) */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    AI 피드백
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

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleConfirmGrade}
                >
                  채점 확정
                </Button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
