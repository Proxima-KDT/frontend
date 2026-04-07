import { useState } from 'react'
import { Plus, Sparkles, Edit3, Trash2 } from 'lucide-react'
import { mockProblems } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Textarea from '@/components/common/Textarea'
import Tabs from '@/components/common/Tabs'
import Table from '@/components/common/Table'
import Modal from '@/components/common/Modal'
import { useToast } from '@/context/ToastContext'

const difficultyVariant = { '하': 'difficulty-low', '중': 'difficulty-mid', '상': 'difficulty-high' }
const typeLabels = { code: '코드', short_answer: '서술형', multiple_choice: '객관식' }

export default function ProblemManagement() {
  const { showToast } = useToast()
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const filtered = filter === 'all'
    ? mockProblems
    : mockProblems.filter((p) => p.difficulty === filter)

  const columns = [
    { key: 'id', label: '#', width: '50px' },
    {
      key: 'title',
      label: '제목',
      render: (_, row) => (
        <span className="font-medium text-gray-900">{row.title}</span>
      ),
    },
    {
      key: 'type',
      label: '유형',
      render: (val) => <Badge variant="default">{typeLabels[val]}</Badge>,
    },
    {
      key: 'difficulty',
      label: '난이도',
      render: (val) => <Badge variant={difficultyVariant[val]}>{val}</Badge>,
    },
    {
      key: 'tags',
      label: '태그',
      render: (val) => (
        <div className="flex gap-1 flex-wrap">
          {val?.map((t) => (
            <span key={t} className="text-caption text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{t}</span>
          ))}
        </div>
      ),
    },
    { key: 'date', label: '날짜' },
    {
      key: 'actions',
      label: '관리',
      render: (_, row) => (
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
            <Edit3 className="w-4 h-4 text-gray-500" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-error-50 cursor-pointer">
            <Trash2 className="w-4 h-4 text-error-500" />
          </button>
        </div>
      ),
    },
  ]

  const handleAiGenerate = () => {
    setAiGenerating(true)
    setTimeout(() => {
      setAiGenerating(false)
      setShowAiModal(false)
      showToast({ type: 'success', message: 'AI 문제가 생성되었습니다!' })
    }, 2000)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-h1 font-bold text-gray-900">문제 관리</h1>
        <div className="flex gap-2">
          <Button icon={Sparkles} size="sm" onClick={() => setShowAiModal(true)}>
            AI 자동생성
          </Button>
          <Button variant="secondary" icon={Plus} size="sm" onClick={() => setShowAddModal(true)}>
            문제 추가
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'all', label: '전체', count: mockProblems.length },
          { key: '하', label: '하', count: mockProblems.filter((p) => p.difficulty === '하').length },
          { key: '중', label: '중', count: mockProblems.filter((p) => p.difficulty === '중').length },
          { key: '상', label: '상', count: mockProblems.filter((p) => p.difficulty === '상').length },
        ]}
        activeTab={filter}
        onChange={setFilter}
        className="mb-4"
      />

      <Card padding="p-0">
        <Table columns={columns} data={filtered} />
      </Card>

      {/* 문제 추가 모달 */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="문제 추가">
        <div className="space-y-4">
          <Input label="제목" placeholder="문제 제목을 입력하세요" />
          <Textarea label="설명" placeholder="문제 설명을 입력하세요" rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="유형"
              options={[
                { value: 'code', label: '코드' },
                { value: 'short_answer', label: '서술형' },
                { value: 'multiple_choice', label: '객관식' },
              ]}
            />
            <Select
              label="난이도"
              options={[
                { value: '하', label: '하' },
                { value: '중', label: '중' },
                { value: '상', label: '상' },
              ]}
            />
          </div>
          <Input label="태그" placeholder="쉼표로 구분하여 입력" />
          <Textarea label="정답" placeholder="정답 또는 모범 답안" rows={3} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={() => { setShowAddModal(false); showToast({ type: 'success', message: '문제가 추가되었습니다.' }) }}>
              추가
            </Button>
          </div>
        </div>
      </Modal>

      {/* AI 생성 모달 */}
      <Modal isOpen={showAiModal} onClose={() => setShowAiModal(false)} title="AI 문제 자동생성">
        <div className="space-y-4">
          <Select
            label="커리큘럼 주제"
            options={[
              { value: 'python', label: 'Python 기초' },
              { value: 'js', label: 'JavaScript & React' },
              { value: 'db', label: 'DB & SQL' },
              { value: 'algo', label: '알고리즘 & 자료구조' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="난이도"
              options={[
                { value: '하', label: '하' },
                { value: '중', label: '중' },
                { value: '상', label: '상' },
              ]}
            />
            <Select
              label="유형"
              options={[
                { value: 'code', label: '코드' },
                { value: 'short_answer', label: '서술형' },
                { value: 'multiple_choice', label: '객관식' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAiModal(false)}>취소</Button>
            <Button icon={Sparkles} onClick={handleAiGenerate} loading={aiGenerating}>
              생성하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
