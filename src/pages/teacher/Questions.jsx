import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { questionsApi } from '@/api/questions';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Tabs from '@/components/common/Tabs';
import Drawer from '@/components/common/Drawer';
import Textarea from '@/components/common/Textarea';
import { useToast } from '@/context/ToastContext';

const PAGE_SIZE = 10;

// Supabase created_at는 "2026-04-10 11:00:00+00" 형식일 수 있으므로 정규화
function parseKoreanDT(isoStr) {
  if (!isoStr) return null;
  const normalized = isoStr.replace(' ', 'T').replace(/\+00$/, '+00:00');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

// 목록용: 상대 시간 (방금 전, N분 전, ...)
function formatDate(iso) {
  if (!iso) return '-';
  const date = parseKoreanDT(iso);
  if (!date) return '-';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// 상세용: 절대 날짜+시간 (4월 10일 오후 8:32)
function formatAbsolute(iso) {
  if (!iso) return null;
  const date = parseKoreanDT(iso);
  if (!date) return null;
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  const datePart = date.toLocaleDateString('ko-KR', {
    ...(!isThisYear && { year: 'numeric' }),
    month: 'long',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} ${timePart}`;
}

export default function TeacherQuestions() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    questionsApi
      .getList()
      .then((data) => setQuestions(data))
      .catch(() =>
        showToast({
          message: '질문 목록을 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const totalCount = questions.length;
  const unansweredCount = questions.filter((q) => !q.answer).length;
  const answeredCount = questions.filter((q) => !!q.answer).length;

  const filtered = questions.filter((q) => {
    const matchTab =
      activeTab === 'unanswered'
        ? !q.answer
        : activeTab === 'answered'
          ? !!q.answer
          : true;
    const q2 = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q2 ||
      q.content.toLowerCase().includes(q2) ||
      (!q.is_anonymous && q.author?.toLowerCase().includes(q2));
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedData = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const tabs = [
    { key: 'all', label: '전체', count: totalCount },
    { key: 'unanswered', label: '미답변', count: unansweredCount },
    { key: 'answered', label: '답변완료', count: answeredCount },
  ];

  const columns = [
    {
      key: 'content',
      label: '질문 내용',
      render: (val) => (
        <p className="line-clamp-2 text-body-sm text-gray-700">{val}</p>
      ),
    },
    {
      key: 'author',
      label: '작성자',
      render: (val, row) =>
        row.is_anonymous ? (
          <span className="text-body-sm text-gray-400 italic">익명</span>
        ) : (
          <span className="text-body-sm text-gray-700">
            {val || '이름 없음'}
          </span>
        ),
    },
    {
      key: 'created_at',
      label: '등록일시',
      render: (val) => (
        <span className="text-body-sm text-gray-500" title={val}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'answer',
      label: '상태',
      render: (val) =>
        val ? (
          <Badge variant="success">답변완료</Badge>
        ) : (
          <Badge variant="warning">미답변</Badge>
        ),
    },
  ];

  const handleRowClick = (question) => {
    setSelectedQuestion(question);
    setAnswerDraft(question.answer || '');
  };

  const handleDrawerClose = () => {
    setSelectedQuestion(null);
    setAnswerDraft('');
  };

  const handleAnswerSubmit = () => {
    if (!answerDraft.trim()) return;
    setSubmitting(true);
    questionsApi
      .answer(selectedQuestion.id, answerDraft.trim())
      .then(() => {
        const now = new Date().toISOString(); // UTC ISO 문자열 그대로 유지 (타임존 포함)
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === selectedQuestion.id
              ? { ...q, answer: answerDraft.trim(), answered_at: now }
              : q,
          ),
        );
        showToast({ message: '답변이 등록되었습니다.', type: 'success' });
        setSelectedQuestion(null);
        setAnswerDraft('');
      })
      .catch(() =>
        showToast({ message: '답변 등록에 실패했습니다.', type: 'error' }),
      )
      .finally(() => setSubmitting(false));
  };

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">수강생 질문</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card>
          <p className="text-caption text-gray-500 mb-1">전체 질문</p>
          <p className="text-h2 font-bold text-gray-900">{totalCount}건</p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">미답변</p>
          <p className="text-h2 font-bold text-warning-600">
            {unansweredCount}건
          </p>
        </Card>
        <Card>
          <p className="text-caption text-gray-500 mb-1">답변완료</p>
          <p className="text-h2 font-bold text-success-600">
            {answeredCount}건
          </p>
        </Card>
      </div>

      {/* 탭 + 테이블 */}
      <Card>
        <div className="overflow-x-auto">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            className="mb-4"
          />
        </div>

        {/* 검색창 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="질문 내용 또는 작성자 이름으로 검색"
            className="w-full pl-9 pr-4 py-2 text-body-sm border border-gray-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        </div>

        <Table
          columns={columns}
          data={pagedData}
          onRowClick={handleRowClick}
          emptyMessage={
            searchQuery
              ? `"${searchQuery}"에 해당하는 질문이 없습니다.`
              : '해당하는 질문이 없습니다.'
          }
        />

        {/* 페이지네이션 */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-caption text-gray-400">
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)} / 전체{' '}
              {filtered.length}건
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 || p === totalPages || Math.abs(p - safePage) <= 2,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '…' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-gray-400 text-body-sm"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-8 h-8 rounded-lg text-body-sm font-medium transition-colors ${
                        p === safePage
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* 질문 상세 Drawer */}
      <Drawer
        isOpen={selectedQuestion !== null}
        onClose={handleDrawerClose}
        title="질문 상세"
        width="w-[480px]"
      >
        {selectedQuestion && (
          <div className="space-y-6">
            {/* 질문 내용 */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-gray-500">
                    작성자
                  </span>
                  {selectedQuestion.is_anonymous ? (
                    <span className="text-body-sm text-gray-400 italic">
                      익명
                    </span>
                  ) : (
                    <span className="text-body-sm text-gray-700">
                      {selectedQuestion.author || '이름 없음'}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-caption text-gray-400">
                    {formatAbsolute(selectedQuestion.created_at) ??
                      formatDate(selectedQuestion.created_at)}
                  </p>
                  <p className="text-[11px] text-gray-300">
                    {formatDate(selectedQuestion.created_at)}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-body text-gray-800 whitespace-pre-wrap">
                  {selectedQuestion.content}
                </p>
              </div>
            </div>

            {/* 기존 답변 (있을 때만) */}
            {selectedQuestion.answer && (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-body-sm font-medium text-gray-500">
                    이전 답변
                  </p>
                  {selectedQuestion.answered_at && (
                    <div className="text-right">
                      <p className="text-caption text-gray-400">
                        {formatAbsolute(selectedQuestion.answered_at) ??
                          selectedQuestion.answered_at}
                      </p>
                      <p className="text-[11px] text-gray-300">
                        {formatDate(selectedQuestion.answered_at)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                  <p className="text-body-sm text-gray-700 whitespace-pre-wrap">
                    {selectedQuestion.answer}
                  </p>
                </div>
              </div>
            )}

            {/* 답변 입력 */}
            <div>
              <Textarea
                label="답변 입력"
                value={answerDraft}
                onChange={(e) => setAnswerDraft(e.target.value)}
                placeholder="수강생에게 보낼 답변을 작성하세요..."
                rows={6}
                maxLength={1000}
              />
              <Button
                className="mt-3 w-full"
                onClick={handleAnswerSubmit}
                loading={submitting}
                disabled={!answerDraft.trim()}
              >
                {selectedQuestion.answer ? '답변 수정' : '답변 등록'}
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
