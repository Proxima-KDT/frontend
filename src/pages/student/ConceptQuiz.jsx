import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Save,
  AlertCircle,
} from 'lucide-react';
import { subjectsApi } from '@/api/subjects';
import { quizApi } from '@/api/quiz';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import ProgressBar from '@/components/common/ProgressBar';
import Skeleton from '@/components/common/Skeleton';

export default function ConceptQuiz() {
  const { subjectId, conceptId } = useParams();
  const navigate = useNavigate();

  const isComprehensive = conceptId === 'comprehensive';
  const { showToast } = useToast();

  const [subjectTitle, setSubjectTitle] = useState('');
  const [conceptTitle, setConceptTitle] = useState('');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [subjectData, problemsData] = await Promise.all([
          subjectsApi.getDetail(subjectId),
          subjectsApi.getConceptProblems(subjectId, conceptId),
        ]);

        if (cancelled) return;

        setSubjectTitle(subjectData.title ?? '');
        if (!isComprehensive) {
          const concept = subjectData.concepts?.find((c) => c.id === conceptId);
          setConceptTitle(concept?.title ?? '');
        }
        setProblems(problemsData);

        // 이전 제출 기록 로드 (comprehensive는 제외)
        if (!isComprehensive) {
          try {
            const submissionsData = await quizApi.getPreviousSubmissions(conceptId);
            if (cancelled) return;
            if (submissionsData.submissions?.length > 0) {
              const loadedResults = submissionsData.submissions.map((sub) => {
                const problem = problemsData.find((p) => p.id === sub.problem_id);
                const correctIdx = problem ? problem.answer - 1 : null;
                return {
                  problemId: sub.problem_id,
                  selected: sub.selected_answer,
                  correct: correctIdx,
                  // DB의 is_correct 대신 직접 계산 (데이터 불일치 방지)
                  // selected_answer는 0-based, correctIdx도 0-based (answer - 1)
                  isCorrect: correctIdx !== null && sub.selected_answer === correctIdx,
                };
              });
              setResults(loadedResults);

              // 마지막으로 풀었던 문제 다음으로 자동 이동
              const solvedIds = new Set(loadedResults.map((r) => r.problemId));
              let lastSolvedIdx = -1;
              for (let i = 0; i < problemsData.length; i++) {
                if (solvedIds.has(problemsData[i].id)) lastSolvedIdx = i;
              }

              const nextIdx = lastSolvedIdx + 1;
              if (nextIdx < problemsData.length) {
                // 아직 안 푼 문제가 있으면 그 문제로 이동
                setCurrentIndex(nextIdx);
              } else {
                // 모두 풀었으면 마지막 문제를 답 표시 상태로
                const lastResult = loadedResults.find(
                  (r) => r.problemId === problemsData[lastSolvedIdx].id,
                );
                setCurrentIndex(lastSolvedIdx);
                setSelectedAnswer(lastResult?.selected ?? null);
                setIsSubmitted(true);
              }
            }
          } catch {
            // 제출 기록 로드 실패는 조용히 처리
          }
        }
      } catch {
        if (!cancelled) setProblems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [subjectId, conceptId, isComprehensive]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="150px" height="20px" rounded="rounded-lg" />
        <Skeleton width="100%" height="300px" rounded="rounded-2xl" />
      </div>
    );
  }

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-h3 text-gray-500">문제를 찾을 수 없습니다</p>
      </div>
    );
  }

  const currentProblem = problems[currentIndex];
  const totalProblems = problems.length;

  // 모든 문제를 이미 풀었으면 복습 모드
  const isReviewMode = !isComprehensive && results.length === totalProblems && totalProblems > 0;

  const progressPercent = isReviewMode
    ? 100
    : ((currentIndex + (isSubmitted ? 1 : 0)) / totalProblems) * 100;

  // 서술형 문제 확인 — setResults가 비동기라 handleNext 의존 금지.
  // updatedResults를 직접 계산해 완료/이동 처리.
  const handleEssayConfirm = async () => {
    const newEntry = {
      problemId: currentProblem.id,
      selected: null,
      correct: null,
      isCorrect: true,
      isEssay: true,
    };

    const updatedResults = (() => {
      const idx = results.findIndex((r) => r.problemId === currentProblem.id);
      if (idx !== -1) {
        const copy = [...results];
        copy[idx] = newEntry;
        return copy;
      }
      return [...results, newEntry];
    })();

    setResults(updatedResults);

    if (currentIndex + 1 >= totalProblems) {
      // 마지막 문제 — essay 포함 전체 제출 (essay는 selected_answer: null, 백엔드에서 자동 정답 처리)
      const answers = updatedResults
        .map((r) => ({ problem_id: r.problemId, selected_answer: r.selected }));
      try {
        await quizApi.submit(conceptId, answers);
      } catch {
        showToast({ type: 'error', message: '결과 저장에 실패했습니다.' });
      }
      setIsFinished(true);
    } else {
      // 다음 문제로 이동
      const nextIndex = currentIndex + 1;
      const nextResult = updatedResults.find(
        (r) => r.problemId === problems[nextIndex].id,
      );
      setCurrentIndex(nextIndex);
      if (nextResult) {
        setSelectedAnswer(nextResult.selected);
        setIsSubmitted(true);
      } else {
        setSelectedAnswer(null);
        setIsSubmitted(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    setIsSubmitted(true);
    const correctIdx = currentProblem.answer - 1;
    const newEntry = {
      problemId: currentProblem.id,
      selected: selectedAnswer,
      correct: correctIdx,
      isCorrect: selectedAnswer === correctIdx,
    };
    setResults((prev) => {
      const idx = prev.findIndex((r) => r.problemId === currentProblem.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = newEntry;
        return updated;
      }
      return [...prev, newEntry];
    });

    // 즉시 DB에 저장 + 저장 상태 표시
    setSaveStatus('saving');
    try {
      await quizApi.submit(conceptId, [
        { problem_id: currentProblem.id, selected_answer: selectedAnswer },
      ]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 >= totalProblems) {
      // 퀴즈 완료 — 전체 답안 DB 저장 (진도 추적)
      const answers = results.map((r) => ({
        problem_id: r.problemId,
        selected_answer: r.selected,
      }));
      try {
        await quizApi.submit(conceptId, answers);
      } catch (error) {
        showToast({
          type: 'error',
          message: '결과 저장에 실패했습니다. 네트워크를 확인해주세요.',
        });
      }
      setIsFinished(true);
      return;
    }
    const nextIndex = currentIndex + 1;
    const nextResult = results.find(
      (r) => r.problemId === problems[nextIndex].id,
    );
    setCurrentIndex(nextIndex);
    if (nextResult) {
      setSelectedAnswer(nextResult.selected);
      setIsSubmitted(true);
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsSubmitted(false);
    setResults([]);
    setIsFinished(false);
  };

  // 복습 모드에서 번호 버튼 클릭 시 해당 문제로 이동
  const handleNavigate = (idx) => {
    const result = results.find((r) => r.problemId === problems[idx].id);
    setCurrentIndex(idx);
    if (result) {
      setSelectedAnswer(result.selected);
      setIsSubmitted(true);
    } else {
      setSelectedAnswer(null);
      setIsSubmitted(false);
    }
  };

  // 뒤로 갈 때 현재까지의 풀이 저장
  const handleBackAndSave = async () => {
    if (results.length > 0) {
      try {
        const answers = results.map((r) => ({
          problem_id: r.problemId,
          selected_answer: r.selected,
        }));
        await quizApi.submit(conceptId, answers);
      } catch (error) {
        console.error('Failed to save progress:', error);
        showToast({
          type: 'warning',
          message: '풀이 저장에 실패했습니다. 다시 시도해주세요.',
        });
      }
    }
    navigate(`/student/problems/${subjectId}`);
  };

  // essay 문제 제외하고 객관식만 채점
  const mcResults = results.filter((r) => !r.isEssay);
  const correctCount = mcResults.filter((r) => r.isCorrect).length;
  const mcTotal = problems.filter((p) => p.choices && p.choices.length > 0).length;
  const title = isComprehensive ? `${subjectTitle} 종합 문제` : conceptTitle;

  // 결과 화면
  if (isFinished) {
    const scorePercent = mcTotal > 0 ? Math.round((correctCount / mcTotal) * 100) : 100;
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(`/student/problems/${subjectId}`)}
          className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {subjectTitle} 개념 목록으로
        </button>

        <Card className="text-center py-10">
          <div
            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
              scorePercent >= 80
                ? 'bg-[#e9eff3]'
                : scorePercent >= 60
                  ? 'bg-amber-100'
                  : 'bg-red-100'
            }`}
          >
            <Trophy
              className={`w-10 h-10 ${
                scorePercent >= 80
                  ? 'text-[#4f6475]'
                  : scorePercent >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            />
          </div>
          <h2 className="text-h2 font-bold text-gray-900 mb-2">
            {title} 완료!
          </h2>
          <p className="text-body text-gray-500 mb-6">
            객관식 {mcTotal}문제 중{' '}
            <span className="font-bold text-gray-900">{correctCount}문제</span>{' '}
            정답
            {totalProblems - mcTotal > 0 && (
              <span className="text-caption text-gray-400 ml-2">
                (개념 확인 {totalProblems - mcTotal}문제 별도)
              </span>
            )}
          </p>

          <div className="max-w-xs mx-auto mb-8">
            <div
              className={`text-4xl font-bold mb-2 ${
                scorePercent >= 80
                  ? 'text-[#4f6475]'
                  : scorePercent >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {scorePercent}점
            </div>
            <ProgressBar
              value={scorePercent}
              color={
                scorePercent >= 80
                  ? 'bg-[#6f8391]'
                  : scorePercent >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
              }
              showValue={false}
            />
          </div>

          {/* 문제별 결과 요약 */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex flex-wrap justify-center gap-2">
              {results.map((r, idx) => (
                <div
                  key={r.problemId}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-body-sm font-semibold ${
                    r.isCorrect
                      ? 'bg-[#e9eff3] text-[#4f6475]'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={handleRetry} icon={RotateCcw}>
              다시 풀기
            </Button>
            <Button
              onClick={() => navigate(`/student/problems/${subjectId}`)}
              className="bg-[#4e5a61] hover:bg-[#424d53]"
            >
              개념 목록으로
            </Button>
          </div>
        </Card>

        {/* 오답 해설 — essay 문제 제외 */}
        {results.some((r) => !r.isCorrect && !r.isEssay) && (
          <Card>
            <h3 className="text-h3 font-bold text-gray-900 mb-4">오답 해설</h3>
            <div className="space-y-4">
              {results
                .filter((r) => !r.isCorrect && !r.isEssay)
                .map((r, idx) => {
                  const prob = problems.find((p) => p.id === r.problemId);
                  return (
                    <div key={r.problemId} className="p-4 bg-red-50 rounded-xl">
                      <p className="text-body-sm font-semibold text-gray-900 mb-2">
                        Q. {prob.question}
                      </p>
                      <p className="text-caption text-red-600 mb-1">
                        내 답: {prob.choices[r.selected]}
                      </p>
                      <p className="text-caption mb-2 text-[#4f6475]">
                        정답: {prob.choices[r.correct]}
                      </p>
                      <p className="text-caption text-gray-600">
                        {prob.explanation}
                      </p>
                    </div>
                  );
                })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // 문제 풀기 화면
  return (
    <div className="space-y-6">
      <button
        onClick={handleBackAndSave}
        className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {subjectTitle} 개념 목록으로
      </button>

      {/* 진행 상황 헤더 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-h2 font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-caption text-gray-400 flex items-center gap-1">
                <Save className="w-3 h-3 animate-pulse" />
                저장 중...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-caption flex items-center gap-1 text-[#6f8391]">
                <CheckCircle2 className="w-3 h-3" />
                저장됨
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-caption text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                저장 실패
              </span>
            )}
            {isReviewMode && (
              <Badge variant="success" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                복습 모드
              </Badge>
            )}
            <Badge variant="info">
              {currentIndex + 1} / {totalProblems}
            </Badge>
          </div>
        </div>
        <ProgressBar
          value={progressPercent}
          color={isReviewMode ? 'bg-[#6f8391]' : 'bg-[#4e5a61]'}
          size="sm"
          showValue={false}
        />
      </div>

      {/* 문제 카드 */}
      <Card>
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-caption font-medium text-[#4f6475]">
              문제 {currentIndex + 1}
            </span>
            {(!currentProblem.choices || currentProblem.choices.length === 0) && (
              <span className="rounded bg-[#f4ecd7] px-1.5 py-0.5 text-[10px] font-medium text-[#7a6330]">
                개념 확인
              </span>
            )}
          </div>
          <h2 className="text-body font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
            {currentProblem.question}
          </h2>
        </div>

        {/* 객관식: choices 있을 때 */}
        {currentProblem.choices && currentProblem.choices.length > 0 ? (
          <>
            <div className="space-y-3">
              {currentProblem.choices.map((choice, idx) => {
                let borderClass = 'border-gray-200 hover:border-gray-300';
                let bgClass = '';

                if (isSubmitted) {
                  const correctIdx = currentProblem.answer - 1; // DB는 1-based
                  if (idx === correctIdx) {
                    borderClass = 'border-[#6f8391]';
                    bgClass = 'bg-[#f4f8fb]';
                  } else if (idx === selectedAnswer && idx !== correctIdx) {
                    borderClass = 'border-red-500';
                    bgClass = 'bg-red-50';
                  } else {
                    borderClass = 'border-gray-100';
                    bgClass = 'opacity-50';
                  }
                } else if (selectedAnswer === idx) {
                  borderClass = 'border-[#4e5a61]';
                  bgClass = 'bg-[#f4f8fb]';
                }

                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 transition-all ${borderClass} ${bgClass} ${
                      isSubmitted ? 'pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSubmitted ? (
                        idx === currentProblem.answer - 1 ? (
                          <CheckCircle2 className="h-5 w-5 text-[#6f8391]" />
                        ) : idx === selectedAnswer ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                        )
                      ) : (
                        <input
                          type="radio"
                          name="answer"
                          value={idx}
                          checked={selectedAnswer === idx}
                          onChange={() => setSelectedAnswer(idx)}
                          className="mt-0.5 accent-[#4e5a61]"
                        />
                      )}
                    </div>
                    <span className="text-body-sm text-gray-700">{choice}</span>
                  </label>
                );
              })}
            </div>

            {isSubmitted && currentProblem.explanation && (
              <div className="mt-6 rounded-xl border border-[#e3edf3] bg-[#f4f8fb] p-4">
                <h4 className="mb-1 text-body-sm font-semibold text-[#4f6475]">해설</h4>
                <p className="text-caption text-[#5f7483]">{currentProblem.explanation}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#ebe5cf] bg-[#faf6e8] p-4">
              <p className="text-caption flex items-center gap-1.5 text-[#7a6330]">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                이 문제는 개념 이해 확인 문제입니다. 아래 해설을 읽고 개념을 정리해보세요.
              </p>
            </div>
            <div className="rounded-xl border border-[#e3edf3] bg-[#f4f8fb] p-4">
              <h4 className="mb-1 text-body-sm font-semibold text-[#4f6475]">핵심 개념</h4>
              <p className="text-caption leading-relaxed whitespace-pre-wrap text-[#5f7483]">
                {currentProblem.explanation ||
                  '이 개념에 대해 스스로 정리해보세요. 강의 자료나 노트를 참고하면 도움이 됩니다.'}
              </p>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            disabled={currentIndex === 0}
            onClick={() => handleNavigate(currentIndex - 1)}
            icon={ChevronLeft}
          >
            이전
          </Button>

          {isReviewMode ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRetry} icon={RotateCcw}>
                다시 풀기
              </Button>
              {currentIndex + 1 < totalProblems && (
                <Button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="bg-[#4e5a61] hover:bg-[#424d53]"
                  icon={ChevronRight}
                >
                  다음
                </Button>
              )}
            </div>
          ) : !currentProblem.choices || currentProblem.choices.length === 0 ? (
            /* 서술형: results에 추가 후 다음으로 */
            <Button
              onClick={handleEssayConfirm}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
              icon={currentIndex + 1 >= totalProblems ? Trophy : ChevronRight}
            >
              {currentIndex + 1 >= totalProblems ? '결과 보기' : '확인했어요'}
            </Button>
          ) : !isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
            >
              정답 확인
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
              icon={currentIndex + 1 >= totalProblems ? Trophy : ChevronRight}
            >
              {currentIndex + 1 >= totalProblems ? '결과 보기' : '다음 문제'}
            </Button>
          )}
        </div>
      </Card>

      {/* 문제 번호 네비게이션 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {problems.map((prob, idx) => {
          const result = results.find((r) => r.problemId === prob.id);
          const isEssayProb = !prob.choices || prob.choices.length === 0;
          let colorClass = 'bg-gray-100 text-gray-500';

          if (idx === currentIndex) {
            if (isEssayProb) {
              colorClass = 'bg-blue-100 text-blue-700 ring-2 ring-blue-400';
            } else if (isSubmitted) {
              const isCorrectNow = selectedAnswer === prob.answer - 1;
              colorClass = isCorrectNow
                ? 'bg-[#dfe9ef] text-[#3f5568] ring-2 ring-[#6f8391]'
                : 'bg-red-200 text-red-800 ring-2 ring-red-500';
            } else {
              colorClass = 'bg-[#e9eff3] text-[#4f6475] ring-2 ring-[#6f8391]';
            }
          } else if (result) {
            colorClass = result.isEssay
              ? 'bg-[#f4ecd7] text-[#7a6330]'
              : result.isCorrect
                ? 'bg-[#e9eff3] text-[#4f6475]'
                : 'bg-red-100 text-red-700';
          }

          return (
            <button
              key={idx}
              onClick={() => isReviewMode && handleNavigate(idx)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-body-sm font-semibold transition-colors ${colorClass} ${
                isReviewMode ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
