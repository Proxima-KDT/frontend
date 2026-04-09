import { useState, useEffect, useMemo } from 'react'
import { jobsApi } from '@/api/jobs'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import MatchScoreBar from '@/components/charts/MatchScoreBar'
import Skeleton from '@/components/common/Skeleton'
import { Search, MapPin, Clock, Briefcase } from 'lucide-react'

export default function JobMatching() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    jobsApi.getList()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filteredJobs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const sorted = [...jobs].sort((a, b) => b.match_score - a.match_score)

    if (!query) return sorted

    return sorted.filter(
      (job) =>
        job.company.toLowerCase().includes(query) ||
        job.position.toLowerCase().includes(query) ||
        (job.tech_stack ?? []).some((tech) => tech.toLowerCase().includes(query)) ||
        (job.location ?? '').toLowerCase().includes(query)
    )
  }, [searchQuery, jobs])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton width="160px" height="32px" rounded="rounded-lg" />
        {[1,2,3].map((i) => <Skeleton key={i} width="100%" height="120px" rounded="rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-gray-900">채용 매칭</h1>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="회사, 포지션, 기술스택으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 rounded-xl border border-gray-200 pl-10 pr-4 text-body text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-colors bg-white"
        />
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-body text-gray-400">검색 결과가 없습니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} hoverable>
              <div className="space-y-3">
                {/* Company & Position */}
                <div>
                  <h3 className="text-body font-semibold text-gray-900">
                    {job.company}
                  </h3>
                  <p className="text-body-sm text-gray-700 mt-0.5">
                    {job.position}
                  </p>
                </div>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {job.tech_stack.map((tech) => (
                    <Badge key={tech} variant="default">
                      {tech}
                    </Badge>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{job.deadline}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {job.experience}
                  </span>
                </div>

                {/* Match Score */}
                <div>
                  <p className="text-caption text-gray-500 mb-1">매칭 점수</p>
                  <MatchScoreBar score={job.match_score} />
                </div>

                {/* Action */}
                <Button variant="secondary" size="sm" fullWidth>
                  상세 보기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
