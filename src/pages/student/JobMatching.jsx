import { useState, useEffect, useMemo } from 'react'
import { jobsApi } from '@/api/jobs'
import Card from '@/components/common/Card'
import Skeleton from '@/components/common/Skeleton'
import { Search, MapPin, Clock, Briefcase } from 'lucide-react'

const pageBg = '#F7F5F0'
const editorial = "font-['Playfair_Display',Georgia,serif]"

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

  const scoreTone = (score) => {
    if (score >= 80) return { bar: 'bg-[#7f9078]', text: 'text-[#5e7455]' }
    if (score >= 60) return { bar: 'bg-[#6f8391]', text: 'text-[#4f6475]' }
    if (score >= 40) return { bar: 'bg-[#b79b5d]', text: 'text-[#7a6330]' }
    return { bar: 'bg-[#a33b39]', text: 'text-[#a33b39]' }
  }

  if (loading) {
    return (
      <div
        className="space-y-4 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
        style={{ backgroundColor: pageBg }}
      >
        <Skeleton width="160px" height="32px" rounded="rounded-lg" />
        {[1,2,3].map((i) => <Skeleton key={i} width="100%" height="120px" rounded="rounded-2xl" />)}
      </div>
    )
  }

  return (
    <div
      className="space-y-6 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      <h1 className={`${editorial} text-[2rem] font-semibold text-[#2c2b28]`}>채용 매칭</h1>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#a39c92]" />
        <input
          type="text"
          placeholder="회사, 포지션, 기술스택으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-xl border border-[#e0dbd1] bg-white pl-10 pr-4 text-body text-[#2c2b28] placeholder:text-[#a39c92] outline-none transition-colors focus:border-[#cfc8bc] focus:ring-2 focus:ring-[#ece7dd]"
        />
      </div>

      {/* Job Cards Grid */}
      {filteredJobs.length === 0 ? (
        <Card className="border-[#eceae4] bg-white py-12 text-center">
          <p className="text-body text-[#a39c92]">검색 결과가 없습니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} hoverable className="border-[#eceae4] bg-white">
              <div className="space-y-3">
                {/* Company & Position */}
                <div>
                  <h3 className="text-body font-semibold text-[#2c2b28]">
                    {job.company}
                  </h3>
                  <p className="mt-0.5 text-body-sm text-[#6b6560]">
                    {job.position}
                  </p>
                </div>

                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {job.tech_stack.map((tech) => (
                    <span key={tech} className="inline-flex items-center rounded-full border border-[#e0dbd1] bg-[#f7f5f0] px-3 py-1 text-caption font-medium text-[#7f786d]">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-[#8a847a]">
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
                  <p className="mb-1 text-caption text-[#8a847a]">매칭 점수</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-[#e7e3dc]">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${scoreTone(job.match_score).bar}`}
                        style={{ width: `${job.match_score}%` }}
                      />
                    </div>
                    <span className={`min-w-[3rem] text-right text-body-sm font-semibold ${scoreTone(job.match_score).text}`}>
                      {job.match_score}%
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button className="w-full rounded-xl border border-[#d8d2c7] bg-white py-2 text-sm font-semibold text-[#5c5852] transition-colors hover:bg-[#f7f6f2]">
                  상세 보기
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
