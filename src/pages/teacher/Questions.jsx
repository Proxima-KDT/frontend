import { useState } from 'react'
import { Sparkles, Clock } from 'lucide-react'
import { mockQuestionClusters, mockQuestions } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import FrequencyChart from '@/components/charts/FrequencyChart'

export default function TeacherQuestions() {
  const [expandedCluster, setExpandedCluster] = useState(null)
  const [summarizing, setSummarizing] = useState(false)

  const chartData = mockQuestionClusters.map((c) => ({
    topic: c.topic,
    count: c.count,
  }))

  const handleSummarize = () => {
    setSummarizing(true)
    setTimeout(() => setSummarizing(false), 2000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-h1 font-bold text-gray-900">질문 요약</h1>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-caption text-gray-400">
            <Clock className="w-4 h-4" />
            마지막 요약: 2026-04-07 14:30
          </span>
          <Button
            icon={Sparkles}
            size="sm"
            onClick={handleSummarize}
            loading={summarizing}
          >
            AI 요약
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 클러스터 카드 */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-h3 font-semibold text-gray-900">주제별 분류</h2>
          {mockQuestionClusters.map((cluster) => (
            <Card
              key={cluster.id}
              hoverable
              onClick={() => setExpandedCluster(
                expandedCluster === cluster.id ? null : cluster.id
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-body font-semibold text-gray-900">{cluster.topic}</h3>
                    <Badge variant="default">{cluster.count}건</Badge>
                  </div>
                  <p className="text-body-sm text-gray-500">{cluster.representative}</p>
                </div>
              </div>

              {/* 확장: 관련 질문 목록 */}
              {expandedCluster === cluster.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  {mockQuestions
                    .filter((q) => cluster.questions.includes(q.id) || Math.random() > 0.5)
                    .slice(0, 3)
                    .map((q) => (
                      <div key={q.id} className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 shrink-0" />
                        <div>
                          <p className="text-body-sm text-gray-700">{q.content}</p>
                          <p className="text-caption text-gray-400 mt-0.5">{q.created_at}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          ))}

          {/* 전체 질문 수 */}
          <p className="text-caption text-gray-400 text-center">
            전체 질문 {mockQuestions.length}건이 {mockQuestionClusters.length}개 주제로 분류되었습니다.
          </p>
        </div>

        {/* 빈도 차트 */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-h3 font-semibold text-gray-900 mb-4">주제별 질문 빈도</h2>
            <FrequencyChart data={chartData} />
          </Card>
        </div>
      </div>
    </div>
  )
}
