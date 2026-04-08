import { useState } from 'react';
import { mockQuestions, mockStudentUser } from '@/data/mockData';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import QuestionForm from '@/components/forms/QuestionForm';
import {
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Clock,
} from 'lucide-react';

export default function Questions() {
  const [openAnswerId, setOpenAnswerId] = useState(null);
  const myQuestions = mockQuestions.filter(
    (q) => q.user_id === mockStudentUser.id,
  );

  const handleSubmitQuestion = ({ content, isAnonymous }) => {
    console.log('질문 제출:', { content, isAnonymous });
  };

  const toggleAnswer = (id) => {
    setOpenAnswerId((prev) => (prev === id ? null : id));
  };

  return (
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
          <HelpCircle className="w-5 h-5 inline-block mr-1.5 text-primary-500 -mt-0.5" />
          질문 작성
        </h2>
        <QuestionForm onSubmit={handleSubmitQuestion} />
      </Card>

      {/* My Question History */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 font-semibold text-gray-900">내 질문 이력</h2>
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
                    <div className="flex-shrink-0">
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
                        className="flex items-center gap-1.5 text-caption font-medium text-student-600 hover:text-student-700 transition-colors"
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
                  <div className="p-4 bg-student-50 border-t border-student-100">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-student-500" />
                      <span className="text-caption font-semibold text-student-700">
                        강사 답변
                      </span>
                      {q.answered_at && (
                        <span className="text-caption text-student-400">
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
  );
}
