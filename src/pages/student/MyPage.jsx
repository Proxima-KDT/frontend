import { Lock, Footprints, Flame, Crown, Trophy } from 'lucide-react'
import {
  mockSkillScores,
  mockBadges,
  mockContributions,
  mockCareerPrediction,
} from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import SkillRadarChart from '@/components/charts/SkillRadarChart'
import ContributionGraph from '@/components/charts/ContributionGraph'

const iconMap = {
  Footprints,
  Flame,
  Crown,
  Trophy,
}

export default function MyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-h1 font-bold text-gray-900">마이페이지</h1>

      {/* Row 1: 스킬 레이더 + 취업 예측 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-h3 font-bold text-gray-900 mb-4">역량 분석</h2>
          <SkillRadarChart data={mockSkillScores} color="#3B82F6" />
        </Card>

        <Card>
          <h2 className="text-h3 font-bold text-gray-900 mb-4">취업 예측</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-student-50 border-4 border-student-500 flex items-center justify-center">
              <span className="text-h2 font-bold text-student-600">
                {mockCareerPrediction.probability}%
              </span>
            </div>
            <div>
              <p className="text-body font-semibold text-gray-900">
                취업 성공 확률
              </p>
              <p className="text-body-sm text-gray-500">
                추천 분야: {mockCareerPrediction.recommended_field}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-caption font-medium text-gray-500 mb-1">예상 평균 연봉</p>
              <p className="text-h3 font-bold text-gray-900">
                {mockCareerPrediction.avg_salary.toLocaleString()}만원
              </p>
            </div>

            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">강점</p>
              <div className="flex flex-wrap gap-2">
                {mockCareerPrediction.strengths.map((s) => (
                  <Badge key={s} variant="success">{s}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-body-sm font-semibold text-gray-700 mb-2">개선 필요</p>
              <div className="flex flex-wrap gap-2">
                {mockCareerPrediction.improvements.map((i) => (
                  <Badge key={i} variant="warning">{i}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: 뱃지 컬렉션 */}
      <Card>
        <h2 className="text-h3 font-bold text-gray-900 mb-4">뱃지 컬렉션</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockBadges.map((badge) => {
            const IconComponent = iconMap[badge.icon]
            return (
              <div
                key={badge.id}
                className={`relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all ${
                  badge.earned
                    ? 'border-student-200 bg-student-50'
                    : 'border-gray-200 bg-gray-50 grayscale opacity-60'
                }`}
              >
                {!badge.earned && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    badge.earned ? 'bg-student-500 text-white' : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-6 h-6" />}
                </div>
                <h3 className="text-body-sm font-semibold text-gray-900 mb-1">
                  {badge.name}
                </h3>
                <p className="text-caption text-gray-500 mb-2">
                  {badge.description}
                </p>
                {badge.earned && badge.earned_date && (
                  <p className="text-caption text-student-500 font-medium">
                    {badge.earned_date}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Row 3: 학습 활동 */}
      <Card>
        <h2 className="text-h3 font-bold text-gray-900 mb-4">학습 활동</h2>
        <ContributionGraph data={mockContributions} />
      </Card>
    </div>
  )
}
