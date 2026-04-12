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

        // ?댁쟾 ?쒖텧 湲곕줉 濡쒕뱶 (comprehensive???쒖쇅)
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
                  // DB??is_correct ???吏곸젒 怨꾩궛 (?곗씠??遺덉씪移?諛⑹?)
                  // selected_answer??0-based, correctIdx??0-based (answer - 1)
                  isCorrect: correctIdx !== null && sub.selected_answer === correctIdx,
                };
              });
              setResults(loadedResults);

              // 留덉?留됱쑝濡???덈뜕 臾몄젣 ?ㅼ쓬?쇰줈 ?먮룞 ?대룞
              const solvedIds = new Set(loadedResults.map((r) => r.problemId));
              let lastSolvedIdx = -1;
              for (let i = 0; i < problemsData.length; i++) {
                if (solvedIds.has(problemsData[i].id)) lastSolvedIdx = i;
              }

              const nextIdx = lastSolvedIdx + 1;
              if (nextIdx < problemsData.length) {
                // ?꾩쭅 ????臾몄젣媛 ?덉쑝硫?洹?臾몄젣濡??대룞
                setCurrentIndex(nextIdx);
              } else {
                // 紐⑤몢 ??덉쑝硫?留덉?留?臾몄젣瑜????쒖떆 ?곹깭濡?                const lastResult = loadedResults.find(
                  (r) => r.problemId === problemsData[lastSolvedIdx].id,
                );
                setCurrentIndex(lastSolvedIdx);
                setSelectedAnswer(lastResult?.selected ?? null);
                setIsSubmitted(true);
              }
            }
          } catch {
            // ?쒖텧 湲곕줉 濡쒕뱶 ?ㅽ뙣??議곗슜??泥섎━
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
        <p className="text-h3 text-gray-500">臾몄젣瑜?李얠쓣 ???놁뒿?덈떎</p>
      </div>
    );
  }

  const currentProblem = problems[currentIndex];
  const totalProblems = problems.length;

  // 紐⑤뱺 臾몄젣瑜??대? ??덉쑝硫?蹂듭뒿 紐⑤뱶
  const isReviewMode = !isComprehensive && results.length === totalProblems && totalProblems > 0;

  const progressPercent = isReviewMode
    ? 100
    : ((currentIndex + (isSubmitted ? 1 : 0)) / totalProblems) * 100;

  // ?쒖닠??臾몄젣 ?뺤씤 ??setResults媛 鍮꾨룞湲곕씪 handleNext ?섏〈 湲덉?.
  // updatedResults瑜?吏곸젒 怨꾩궛???꾨즺/?대룞 泥섎━.
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
      // 留덉?留?臾몄젣 ??essay ?ы븿 ?꾩껜 ?쒖텧 (essay??selected_answer: null, 諛깆뿏?쒖뿉???먮룞 ?뺣떟 泥섎━)
      const answers = updatedResults
        .map((r) => ({ problem_id: r.problemId, selected_answer: r.selected }));
      try {
        await quizApi.submit(conceptId, answers);
      } catch {
        showToast({ type: 'error', message: '寃곌낵 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.' });
      }
      setIsFinished(true);
    } else {
      // ?ㅼ쓬 臾몄젣濡??대룞
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

    // 利됱떆 DB?????+ ????곹깭 ?쒖떆
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
      // ?댁쫰 ?꾨즺 ???꾩껜 ?듭븞 DB ???(吏꾨룄 異붿쟻)
      const answers = results.map((r) => ({
        problem_id: r.problemId,
        selected_answer: r.selected,
      }));
      try {
        await quizApi.submit(conceptId, answers);
      } catch (error) {
        showToast({
          type: 'error',
          message: '寃곌낵 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅽ듃?뚰겕瑜??뺤씤?댁＜?몄슂.',
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

  // 蹂듭뒿 紐⑤뱶?먯꽌 踰덊샇 踰꾪듉 ?대┃ ???대떦 臾몄젣濡??대룞
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

  // ?ㅻ줈 媛????꾩옱源뚯?????????  const handleBackAndSave = async () => {
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
          message: '?????μ뿉 ?ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.',
        });
      }
    }
    navigate(`/student/problems/${subjectId}`);
  };

  // essay 臾몄젣 ?쒖쇅?섍퀬 媛앷??앸쭔 梨꾩젏
  const mcResults = results.filter((r) => !r.isEssay);
  const correctCount = mcResults.filter((r) => r.isCorrect).length;
  const mcTotal = problems.filter((p) => p.choices && p.choices.length > 0).length;
  const title = isComprehensive ? `${subjectTitle} 醫낇빀 臾몄젣` : conceptTitle;

  // 寃곌낵 ?붾㈃
  if (isFinished) {
    const scorePercent = mcTotal > 0 ? Math.round((correctCount / mcTotal) * 100) : 100;
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate(`/student/problems/${subjectId}`)}
          className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {subjectTitle} 媛쒕뀗 紐⑸줉?쇰줈
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
            {title} ?꾨즺!
          </h2>
          <p className="text-body text-gray-500 mb-6">
            媛앷???{mcTotal}臾몄젣 以?' '}
            <span className="font-bold text-gray-900">{correctCount}臾몄젣</span>{' '}
            ?뺣떟
            {totalProblems - mcTotal > 0 && (
              <span className="text-caption text-gray-400 ml-2">
                (媛쒕뀗 ?뺤씤 {totalProblems - mcTotal}臾몄젣 蹂꾨룄)
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
              {scorePercent}??            </div>
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

          {/* 臾몄젣蹂?寃곌낵 ?붿빟 */}
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
              ?ㅼ떆 ?湲?            </Button>
            <Button
              onClick={() => navigate(`/student/problems/${subjectId}`)}
              className="bg-[#4e5a61] hover:bg-[#424d53]"
            >
              媛쒕뀗 紐⑸줉?쇰줈
            </Button>
          </div>
        </Card>

        {/* ?ㅻ떟 ?댁꽕 ??essay 臾몄젣 ?쒖쇅 */}
        {results.some((r) => !r.isCorrect && !r.isEssay) && (
          <Card>
            <h3 className="text-h3 font-bold text-gray-900 mb-4">?ㅻ떟 ?댁꽕</h3>
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
                        ???? {prob.choices[r.selected]}
                      </p>
                      <p className="text-caption mb-2 text-[#4f6475]">
                        ?뺣떟: {prob.choices[r.correct]}
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

  // 臾몄젣 ?湲??붾㈃
  return (
    <div className="space-y-6">
      <button
        onClick={handleBackAndSave}
        className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {subjectTitle} 媛쒕뀗 紐⑸줉?쇰줈
      </button>

      {/* 吏꾪뻾 ?곹솴 ?ㅻ뜑 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-h2 font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <span className="text-caption text-gray-400 flex items-center gap-1">
                <Save className="w-3 h-3 animate-pulse" />
                ???以?..
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-caption flex items-center gap-1 text-[#6f8391]">
                <CheckCircle2 className="w-3 h-3" />
                ??λ맖
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-caption text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                ????ㅽ뙣
              </span>
            )}
            {isReviewMode && (
              <Badge variant="success" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                蹂듭뒿 紐⑤뱶
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

      {/* 臾몄젣 移대뱶 */}
      <Card>
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-caption font-medium text-[#4f6475]">
              臾몄젣 {currentIndex + 1}
            </span>
            {(!currentProblem.choices || currentProblem.choices.length === 0) && (
              <span className="rounded bg-[#f4ecd7] px-1.5 py-0.5 text-[10px] font-medium text-[#7a6330]">
                媛쒕뀗 ?뺤씤
              </span>
            )}
          </div>
          <h2 className="text-body font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
            {currentProblem.question}
          </h2>
        </div>

        {/* 媛앷??? choices ?덉쓣 ??*/}
        {currentProblem.choices && currentProblem.choices.length > 0 ? (
          <>
            <div className="space-y-3">
              {currentProblem.choices.map((choice, idx) => {
                let borderClass = 'border-gray-200 hover:border-gray-300';
                let bgClass = '';

                if (isSubmitted) {
                  const correctIdx = currentProblem.answer - 1; // DB??1-based
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
                <h4 className="mb-1 text-body-sm font-semibold text-[#4f6475]">?댁꽕</h4>
                <p className="text-caption text-[#5f7483]">{currentProblem.explanation}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#ebe5cf] bg-[#faf6e8] p-4">
              <p className="text-caption flex items-center gap-1.5 text-[#7a6330]">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                ??臾몄젣??媛쒕뀗 ?댄빐 ?뺤씤 臾몄젣?낅땲?? ?꾨옒 ?댁꽕???쎄퀬 媛쒕뀗???뺣━?대낫?몄슂.
              </p>
            </div>
            <div className="rounded-xl border border-[#e3edf3] bg-[#f4f8fb] p-4">
              <h4 className="mb-1 text-body-sm font-semibold text-[#4f6475]">?듭떖 媛쒕뀗</h4>
              <p className="text-caption leading-relaxed whitespace-pre-wrap text-[#5f7483]">
                {currentProblem.explanation ||
                  '??媛쒕뀗??????ㅼ뒪濡??뺣━?대낫?몄슂. 媛뺤쓽 ?먮즺???명듃瑜?李멸퀬?섎㈃ ?꾩????⑸땲??'}
              </p>
            </div>
          </div>
        )}

        {/* 踰꾪듉 ?곸뿭 */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            disabled={currentIndex === 0}
            onClick={() => handleNavigate(currentIndex - 1)}
            icon={ChevronLeft}
          >
            ?댁쟾
          </Button>

          {isReviewMode ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleRetry} icon={RotateCcw}>
                ?ㅼ떆 ?湲?              </Button>
              {currentIndex + 1 < totalProblems && (
                <Button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  className="bg-[#4e5a61] hover:bg-[#424d53]"
                  icon={ChevronRight}
                >
                  ?ㅼ쓬
                </Button>
              )}
            </div>
          ) : !currentProblem.choices || currentProblem.choices.length === 0 ? (
            /* ?쒖닠?? results??異붽? ???ㅼ쓬?쇰줈 */
            <Button
              onClick={handleEssayConfirm}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
              icon={currentIndex + 1 >= totalProblems ? Trophy : ChevronRight}
            >
              {currentIndex + 1 >= totalProblems ? '寃곌낵 蹂닿린' : '?뺤씤?덉뼱??}
            </Button>
          ) : !isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
            >
              ?뺣떟 ?뺤씤
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#4e5a61] hover:bg-[#424d53] active:bg-[#384248]"
              icon={currentIndex + 1 >= totalProblems ? Trophy : ChevronRight}
            >
              {currentIndex + 1 >= totalProblems ? '寃곌낵 蹂닿린' : '?ㅼ쓬 臾몄젣'}
            </Button>
          )}
        </div>
      </Card>

      {/* 臾몄젣 踰덊샇 ?ㅻ퉬寃뚯씠??*/}
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
