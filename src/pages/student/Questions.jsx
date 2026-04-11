import { useState, useEffect } from 'react';
import { questionsApi } from '@/api/questions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import QuestionForm from '@/components/forms/QuestionForm';
import {
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
  Trash2,
} from 'lucide-react';

export default function Questions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openAnswerId, setOpenAnswerId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    questionsApi
      .getList()
      .then(setQuestions)
      .catch(() => {});
  }, []);

  const myQuestions = questions.filter((q) => q.user_id === user?.id);

  const handleSubmitQuestion = async ({ content, isAnonymous }) => {
    try {
      const newQ = await questionsApi.create(content, isAnonymous);
      setQuestions((prev) => [newQ, ...prev]);
      showToast({ type: 'success', message: '질문이 등록되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '질문 등록에 실패했습니다.' });
    }
  };

  const toggleAnswer = (id) => {
    setOpenAnswerId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async () => {
    const id = deleteConfirmId;
    if (!id) return;
    setDeleteConfirmId(null);
    setDeletingId(id);
    try {
      await questionsApi.delete(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      showToast({ type: 'success', message: '질문이 삭제되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '삭제에 실패했습니다.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 font-bold text-gray-900">질문</h1>
          <p className="text-body-sm text-gray-500 mt-1">
            궁금한 점을 질문하세요.
          </p>
        </div>

        {/* Question Form */}
        <Card>
          <h2 className="text-h3 font-semibold text-gray-900 mb-3">
            <HelpCircle className="mr-1.5 inline-block h-5 w-5 -mt-0.5 text-[#6f8391]" />
            질문 작성
          </h2>
          <QuestionForm onSubmit={handleSubmitQuestion} />
        </Card>

        {/* My Question History */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-h3 font-semibold text-gray-900">
              내 질문 이력
            </h2>
            <span className="text-caption text-gray-400">
              총 {myQuestions.length}건
            </span>
          </div>

          {myQuestions.length === 0 ? (
            <p className="text-body-sm text-gray-400 text-center py-8">
              질문 이력이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {myQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-100 overflow-hidden"
                >
                  {/* 질문 행 */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-body-sm text-gray-800 leading-relaxed flex-1">
                        {q.content}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {q.is_anonymous ? (
                          <Badge variant="default">
                            <EyeOff className="w-3 h-3 mr-1 inline-block -mt-0.5" />
                            익명
                          </Badge>
                        ) : (
                          <Badge variant="info">
                            <Eye className="w-3 h-3 mr-1 inline-block -mt-0.5" />
                            실명
                          </Badge>
                        )}
                        {!q.answer && (
                          <button
                            onClick={() => setDeleteConfirmId(q.id)}
                            disabled={deletingId === q.id}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="질문 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-caption text-gray-400">
                        {!q.is_anonymous && q.author && (
                          <>
                            <span>{q.author}</span>
                            <span>&middot;</span>
                          </>
                        )}
                        <span>{q.created_at}</span>
                      </div>

                      {q.answer ? (
                        <button
                          onClick={() => toggleAnswer(q.id)}
                          className="flex items-center gap-1.5 text-caption font-medium text-[#4f6475] transition-colors hover:text-[#3f5568]"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          답변 확인
                          {openAnswerId === q.id ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-caption text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          답변 대기중
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 답변 영역 (아코디언) */}
                  {q.answer && openAnswerId === q.id && (
                    <div className="border-t border-[#e3edf3] bg-[#f4f8fb] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-[#6f8391]" />
                        <span className="text-caption font-semibold text-[#4f6475]">
                          강사 답변
                        </span>
                        {q.answered_at && (
                          <span className="text-caption text-[#8aa0b1]">
                            &middot; {q.answered_at}
                          </span>
                        )}
                      </div>
                      <p className="text-body-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {q.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="질문 삭제"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-700">
            이 질문을 삭제하시겠습니까? 삭제된 질문은 복구할 수 없습니다.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
