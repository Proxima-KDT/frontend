import { useState, useEffect } from 'react';
import { questionsApi } from '@/api/questions';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Table from '@/components/common/Table';
import Tabs from '@/components/common/Tabs';
import Drawer from '@/components/common/Drawer';
import Textarea from '@/components/common/Textarea';
import { useToast } from '@/context/ToastContext';

export default function TeacherQuestions() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
    if (activeTab === 'unanswered') return !q.answer;
    if (activeTab === 'answered') return !!q.answer;
    return true;
  });

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
          <span className="text-body-sm text-gray-700">{val}</span>
        ),
    },
    {
      key: 'created_at',
      label: '등록일시',
      render: (val) => (
        <span className="text-body-sm text-gray-500">{val}</span>
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
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
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
            onChange={setActiveTab}
            className="mb-4"
          />
        </div>
        <Table
          columns={columns}
          data={filtered}
          onRowClick={handleRowClick}
          emptyMessage="해당하는 질문이 없습니다."
        />
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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-body-sm font-medium text-gray-500">
                  작성자
                </span>
                {selectedQuestion.is_anonymous ? (
                  <span className="text-body-sm text-gray-400 italic">
                    익명
                  </span>
                ) : (
                  <span className="text-body-sm text-gray-700">
                    {selectedQuestion.author}
                  </span>
                )}
                <span className="text-caption text-gray-400 ml-auto">
                  {selectedQuestion.created_at}
                </span>
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
                <p className="text-body-sm font-medium text-gray-500 mb-1">
                  이전 답변{' '}
                  <span className="text-caption text-gray-400 font-normal">
                    ({selectedQuestion.answered_at})
                  </span>
                </p>
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
