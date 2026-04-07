import { useState } from 'react'
import { ChevronDown, CheckCircle2, Circle, Clock } from 'lucide-react'
import { mockCurriculum } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import ProgressBar from '@/components/common/ProgressBar'

const statusConfig = {
  completed: { color: 'bg-green-500', badgeVariant: 'success', label: '완료' },
  in_progress: { color: 'bg-student-500', badgeVariant: 'student', label: '진행 중' },
  upcoming: { color: 'bg-gray-300', badgeVariant: 'default', label: '예정' },
}

function TaskStatusIcon({ progress }) {
  if (progress === 100) return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
  if (progress > 0) return <Clock className="w-4 h-4 text-student-500 shrink-0" />
  return <Circle className="w-4 h-4 text-gray-300 shrink-0" />
}

function PhaseDetail({ phase }) {
  const config = statusConfig[phase.status]
  const completedTasks = phase.tasks.filter((t) => t.progress === 100).length

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-body font-bold text-gray-900">{phase.title}</h3>
          <p className="text-caption text-gray-500">{phase.description}</p>
        </div>
        <div className="flex items-center gap-3 text-caption text-gray-400 mt-1 sm:mt-0 shrink-0">
          <span>{phase.start_date} ~ {phase.end_date}</span>
          <Badge variant={config.badgeVariant}>{completedTasks}/{phase.tasks.length} 완료</Badge>
        </div>
      </div>

      <ul className="space-y-3">
        {phase.tasks.map((task, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <TaskStatusIcon progress={task.progress} />
            <span className={`text-body-sm w-36 shrink-0 ${task.progress === 100 ? 'text-gray-400' : 'text-gray-700'}`}>
              {task.name}
            </span>
            <div className="flex-1">
              <ProgressBar
                value={task.progress}
                color={
                  task.progress === 100
                    ? 'bg-green-500'
                    : task.progress > 0
                    ? 'bg-student-500'
                    : 'bg-gray-300'
                }
                size="sm"
              />
            </div>
            <span className="text-caption text-gray-400 w-10 text-right shrink-0">{task.progress}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  const inProgressPhase = mockCurriculum.find((c) => c.status === 'in_progress')
  const [selectedPhaseId, setSelectedPhaseId] = useState(inProgressPhase?.id ?? null)

  const completedPhases = mockCurriculum.filter((c) => c.status === 'completed').length
  const totalPhases = mockCurriculum.length
  const overallProgress = Math.round(
    mockCurriculum.reduce((sum, c) => sum + c.progress, 0) / totalPhases
  )

  const togglePhase = (id) => {
    setSelectedPhaseId((prev) => (prev === id ? null : id))
  }

  const selectedPhase = mockCurriculum.find((c) => c.id === selectedPhaseId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-bold text-gray-900">커리큘럼 로드맵</h1>
          <p className="text-body-sm text-gray-500 mt-1">6개월 과정 · {completedPhases}/{totalPhases} 단계 완료</p>
        </div>
        <Badge variant="student">{overallProgress}% 달성</Badge>
      </div>

      <Card>
        <ProgressBar
          value={overallProgress}
          color="bg-student-500"
          label="전체 진행률"
          className="mb-6"
        />

        {/* Desktop */}
        <div className="hidden md:block">
          <div className="flex gap-3">
            {mockCurriculum.map((phase) => {
              const config = statusConfig[phase.status]
              const isSelected = selectedPhaseId === phase.id
              return (
                <div
                  key={phase.id}
                  onClick={() => togglePhase(phase.id)}
                  className={`flex-1 rounded-xl border-2 p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-student-500 bg-student-50 shadow-lg ring-2 ring-student-200'
                      : phase.status === 'in_progress'
                      ? 'border-student-500 bg-student-50 shadow-md hover:shadow-lg'
                      : phase.status === 'completed'
                      ? 'border-green-300 bg-green-50 hover:shadow-md'
                      : 'border-gray-200 bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-caption font-bold ${config.color}`}
                    >
                      {phase.phase}
                    </span>
                    <Badge variant={config.badgeVariant}>{config.label}</Badge>
                  </div>
                  <h3 className="text-body-sm font-semibold text-gray-900 mb-1">
                    {phase.title}
                  </h3>
                  <ProgressBar
                    value={phase.progress}
                    color={
                      phase.status === 'in_progress'
                        ? 'bg-student-500'
                        : phase.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }
                    size="sm"
                  />
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 mx-auto mt-2 transition-transform ${
                      isSelected ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              )
            })}
          </div>

          {selectedPhase && <PhaseDetail phase={selectedPhase} />}
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-3 md:hidden">
          {mockCurriculum.map((phase) => {
            const config = statusConfig[phase.status]
            const isSelected = selectedPhaseId === phase.id
            return (
              <div key={phase.id}>
                <div
                  onClick={() => togglePhase(phase.id)}
                  className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-student-500 bg-student-50 shadow-lg ring-2 ring-student-200'
                      : phase.status === 'in_progress'
                      ? 'border-student-500 bg-student-50 shadow-md'
                      : phase.status === 'completed'
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-caption font-bold ${config.color}`}
                      >
                        {phase.phase}
                      </span>
                      <h3 className="text-body font-semibold text-gray-900">
                        {phase.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.badgeVariant}>{config.label}</Badge>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                  <ProgressBar
                    value={phase.progress}
                    color={
                      phase.status === 'in_progress'
                        ? 'bg-student-500'
                        : phase.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }
                    size="sm"
                  />
                </div>

                {isSelected && <PhaseDetail phase={phase} />}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
