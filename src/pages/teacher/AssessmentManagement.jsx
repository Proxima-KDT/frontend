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
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
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
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(null);

  useEffect(() => {
    teacherApi
      .getAssessments()
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
  }, []);
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

  return (
    <div className="rounded-3xl bg-[#efede8] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#dbd8d1] pb-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.15em] text-[#8d877e]">
            Ethereal Instructor
          </p>
          <h1 className="font-['Playfair_Display',Georgia,serif] text-[2rem] text-[#2a2a2a]">
            능력단위평가 관리
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7e7a74]">
          <span className="px-2 py-1">Dashboard</span>
          <span className="rounded-full border border-[#bab7b0] bg-[#e8e5de] px-3 py-1">Evaluations</span>
          <span className="px-2 py-1">Analytics</span>
          <span className="px-2 py-1">Resources</span>
          <Search className="h-4 w-4" />
          <Bell className="h-4 w-4" />
          <Button variant="primary" size="sm" className="rounded-full !bg-[#69717a] !text-white hover:!bg-[#535a62]">
            Create Evaluation
          </Button>
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
            <Card className="rounded-3xl border border-[#e1ded8] bg-[#f3f1ec]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#8c867d]">
                Evaluation Module
              </p>
              <h2 className="mt-2 font-['Playfair_Display',Georgia,serif] text-[2.55rem] leading-[1.1] text-[#1f2f43]">
                {current.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#65625d]">
                {current.subject || 'Assessing fundamental programming competencies and practical structures.'}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#dfddd7] bg-[#f8f7f4] px-4 py-3 text-sm text-[#5f6369]">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a80]">Due Date</p>
                  <p className="font-semibold text-[#2f3237]">{current.period.end || '-'}</p>
                </div>
                <div className="rounded-2xl border border-[#dfddd7] bg-[#f8f7f4] px-4 py-3 text-sm text-[#5f6369]">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a80]">AI Processing</p>
                  <p className="font-semibold text-[#2f3237]">Active</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-3xl border border-[#27272a] bg-[#1d1c1f] text-white">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-['Playfair_Display',Georgia,serif] text-[1.4rem]">Grading Rubric</h3>
                <CircleHelp className="h-4 w-4 text-white/60" />
              </div>
              <div className="space-y-2.5">
                {current.rubric.map((r) => (
                  <div key={r.item} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#f4f4f5]">{r.item}</p>
                      <span className="text-[10px] text-[#c6c6ce]">{r.maxScore}%</span>
                    </div>
                    <p className="text-[10px] text-[#a7a7b0]">Criterion-based evaluation detail</p>
                  </div>
                ))}
              </div>
              <Button variant="secondary" fullWidth className="mt-4 !rounded-xl !border-white/30 !bg-white/90 !text-[#2a2a2a] hover:!bg-white">
                Edit Weightage
              </Button>
            </Card>
          </div>

          {/* 제출 통계 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <Card className="rounded-3xl border border-[#e1ded8] bg-[#f8f7f4]">
              <p className="mb-3 font-['Playfair_Display',Georgia,serif] text-[1.7rem] text-[#30343a]">Submission Insights</p>
              <div className="space-y-3">
            {[
              {
                label: 'Submission Rate',
                value: current.studentSubmissions.filter(
                  (s) => s.status !== 'pending',
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#586067]',
                textColor: 'text-[#374151]',
              },
              {
                label: 'Grading Progress',
                value: current.studentSubmissions.filter(
                  (s) => s.status === 'graded',
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#6f8791]',
                textColor: 'text-[#374151]',
              },
              {
                label: 'Predicted Pass Rate',
                value: current.studentSubmissions.filter(
                  (s) => s.passed === true,
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-[#8c7632]',
                textColor: 'text-[#8a6a28]',
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-[#77726a]">
                  <p>{stat.label}</p>
                  <p>{stat.value}/{stat.total}</p>
                </div>
                <p className={`text-h3 font-bold ${stat.textColor}`}>
                  {stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0}%
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
            <Card className="rounded-3xl border border-[#e2ddcf] bg-[#f1ebd9]">
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#917c3b]">
                AI Observation
              </p>
              <p className="text-sm leading-relaxed text-[#60594d]">
                학생들이 특정 핵심 항목에서 반복적으로 점수가 낮아 루브릭 예시 답안을 추가하면 전체 평균이 개선될 가능성이 높습니다.
              </p>
            </Card>
          </div>

          {/* 학생별 제출 현황 */}
          <Card className="rounded-3xl border border-[#e1ded8] bg-[#f8f7f4]">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-['Playfair_Display',Georgia,serif] text-[1.55rem] text-[#31353b]">
                Recent Submissions
              </p>
              <p className="text-xs font-semibold text-[#656b74]">View All Students +</p>
            </div>
            <p className="mb-3 text-sm text-[#6f716d]">
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
                      <button
                        onClick={() => handleDownloadFile(current, student)}
                        className="p-1.5 rounded-lg hover:bg-white text-gray-500 cursor-pointer transition-colors shrink-0"
                        title="제출 파일 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
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
