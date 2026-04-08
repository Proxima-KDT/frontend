import { useState } from 'react';
import {
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCcw,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { mockTeacherAssessments } from '@/data/mockData';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import ProgressBar from '@/components/common/ProgressBar';
import { useToast } from '@/context/ToastContext';

const PHASE_COLORS = [
  { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700' },
];

const STATUS_CONFIG = {
  pending: {
    label: '미제출',
    classes: 'bg-gray-100 text-gray-500',
    Icon: Clock,
  },
  submitted: {
    label: '제출완료',
    classes: 'bg-blue-100 text-blue-700',
    Icon: CheckCircle2,
  },
  graded: {
    label: '채점완료',
    classes: 'bg-green-100 text-green-700',
    Icon: CheckCircle2,
  },
  resubmit_required: {
    label: '재제출 요청',
    classes: 'bg-orange-100 text-orange-700',
    Icon: RefreshCcw,
  },
};

export default function AssessmentManagement() {
  const { showToast } = useToast();
  const [assessments, setAssessments] = useState(mockTeacherAssessments);
  const [activePhase, setActivePhase] = useState(1);
  const [aiModal, setAiModal] = useState(null); // { assessment, student }
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const current = assessments.find((a) => a.phaseId === activePhase);
  const phaseColor = PHASE_COLORS[(activePhase - 1) % 6];

  const handleOpenAiModal = (assessment, student) => {
    setAiModal({ assessment, student });
    setAiResult(null);
    setAiLoading(false);
  };

  const handleCloseAiModal = () => {
    setAiModal(null);
    setAiResult(null);
    setAiLoading(false);
  };

  const handleRunAi = () => {
    setAiLoading(true);
    setTimeout(() => {
      const rubricScores = aiModal.assessment.rubric.map((r) => ({
        item: r.item,
        maxScore: r.maxScore,
        score: Math.floor(r.maxScore * (0.65 + Math.random() * 0.33)),
      }));
      const total = rubricScores.reduce((sum, r) => sum + r.score, 0);
      const passed = total >= aiModal.assessment.passScore;
      setAiResult({
        rubricScores,
        score: total,
        passed,
        feedback: `AI 분석 결과: ${aiModal.student.studentName} 학생의 제출물을 루브릭 기준으로 분석하였습니다. 핵심 요구사항을 전반적으로 충족하였으며 코드의 구조와 논리 흐름이 명확합니다. ${passed ? `총점 ${total}점으로 합격 기준(${aiModal.assessment.passScore}점)을 초과하였습니다.` : `총점 ${total}점으로 합격 기준(${aiModal.assessment.passScore}점)에 미달하였습니다. 일부 항목 보완 후 재제출을 권장합니다.`}`,
      });
      setAiLoading(false);
    }, 2500);
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

  const handleConfirmGrade = () => {
    const { assessment, student } = aiModal;
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
  };

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">
        능력단위평가 관리
      </h1>

      {/* Phase 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {assessments.map((a, idx) => {
          const color = PHASE_COLORS[idx % 6];
          const isActive = activePhase === a.phaseId;
          return (
            <button
              key={a.phaseId}
              onClick={() => setActivePhase(a.phaseId)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? `${color.bg} text-white shadow-sm`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                barColor: 'bg-blue-500',
                textColor: 'text-blue-600',
              },
              {
                label: '채점 완료',
                value: current.studentSubmissions.filter(
                  (s) => s.status === 'graded',
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-green-500',
                textColor: 'text-green-600',
              },
              {
                label: '합격',
                value: current.studentSubmissions.filter(
                  (s) => s.passed === true,
                ).length,
                total: current.studentSubmissions.length,
                barColor: 'bg-primary-500',
                textColor: 'text-primary-600',
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
                      {student.submittedAt && (
                        <p className="text-caption text-gray-500">
                          {student.submittedAt}
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
                    {student.files?.length > 0 && (
                      <button
                        className="p-1.5 rounded-lg hover:bg-white text-gray-500 cursor-pointer transition-colors shrink-0"
                        title="파일 다운로드"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                    <div className="flex gap-1.5 shrink-0">
                      {student.status === 'submitted' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Sparkles}
                          onClick={() => handleOpenAiModal(current, student)}
                        >
                          AI 채점
                        </Button>
                      )}
                      {student.status === 'graded' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAiModal(current, student)}
                        >
                          재채점
                        </Button>
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
          title={`AI 채점 — ${aiModal.student.studentName}`}
          maxWidth="max-w-[560px]"
        >
          <div className="space-y-4">
            {/* 경고 배너 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                AI 채점 결과는 참고용입니다. 반드시 검토 후 확정하세요.
              </p>
            </div>

            {/* 제출 파일 */}
            {aiModal.student.files.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  제출 파일
                </p>
                <div className="space-y-1.5">
                  {aiModal.student.files.map((f) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">
                        {f.name}
                      </span>
                      <span className="text-caption text-gray-400">
                        {f.size}
                      </span>
                      <button className="p-1 rounded hover:bg-gray-200 cursor-pointer">
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
                    AI 채점 완료
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
