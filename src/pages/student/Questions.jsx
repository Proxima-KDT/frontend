import { mockQuestions } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import QuestionForm from '@/components/forms/QuestionForm'
import { HelpCircle, Eye, EyeOff } from 'lucide-react'

export default function Questions() {
  const handleSubmitQuestion = ({ content, isAnonymous }) => {
    // 실제 구현 시 API 호출
    console.log('질문 제출:', { content, isAnonymous })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 font-bold text-gray-900">익명 질문</h1>
        <p className="text-body-sm text-gray-500 mt-1">
          궁금한 점을 질문하세요. 강사가 AI 요약으로 확인합니다.
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
      <div>
        <h2 className="text-h3 font-semibold text-gray-900 mb-3">내 질문 이력</h2>
        {mockQuestions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-body-sm text-gray-400">질문 이력이 없습니다.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {mockQuestions.map((q) => (
              <Card key={q.id}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
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
                  <div className="flex items-center gap-2 text-caption text-gray-400">
                    {!q.is_anonymous && q.author && (
                      <>
                        <span>{q.author}</span>
                        <span>&middot;</span>
                      </>
                    )}
                    <span>{q.created_at}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
