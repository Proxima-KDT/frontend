import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { mockProblems, mockContributions } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Tabs from '@/components/common/Tabs'
import ContributionGraph from '@/components/charts/ContributionGraph'

const difficultyBadgeMap = {
  '하': 'difficulty-low',
  '중': 'difficulty-mid',
  '상': 'difficulty-high',
}

const tabs = [
  { key: 'all', label: '전체', count: mockProblems.length },
  { key: '하', label: '하', count: mockProblems.filter((p) => p.difficulty === '하').length },
  { key: '중', label: '중', count: mockProblems.filter((p) => p.difficulty === '중').length },
  { key: '상', label: '상', count: mockProblems.filter((p) => p.difficulty === '상').length },
]

export default function ProblemList() {
  const [activeTab, setActiveTab] = useState('all')

  const filteredProblems =
    activeTab === 'all'
      ? mockProblems
      : mockProblems.filter((p) => p.difficulty === activeTab)

  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-gray-900">데일리 문제</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProblems.map((problem) => (
          <Card key={problem.id} hoverable>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-body font-semibold text-gray-900 truncate">
                  {problem.title}
                </h3>
                <p className="text-caption text-gray-400 mt-1">{problem.date}</p>
              </div>
              <div className="shrink-0 ml-3">
                {problem.submitted ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-caption font-medium">제출완료</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-caption font-medium">미제출</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge variant={difficultyBadgeMap[problem.difficulty]}>
                {problem.difficulty}
              </Badge>
              {problem.tags.map((tag) => (
                <Badge key={tag} variant="info">
                  {tag}
                </Badge>
              ))}
            </div>

            {problem.submitted && problem.score !== null && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <span className="text-caption text-gray-500">점수</span>
                <span
                  className={`text-body-sm font-bold ${
                    problem.score >= 90
                      ? 'text-green-600'
                      : problem.score >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {problem.score}점
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-h3 font-bold text-gray-900 mb-4">문제 풀이 기록</h2>
        <ContributionGraph data={mockContributions} />
      </Card>
    </div>
  )
}
