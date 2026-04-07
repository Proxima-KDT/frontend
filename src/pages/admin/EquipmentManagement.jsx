import { useState } from 'react'
import { Plus } from 'lucide-react'
import { mockEquipment } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Tabs from '@/components/common/Tabs'
import Table from '@/components/common/Table'
import Modal from '@/components/common/Modal'
import Drawer from '@/components/common/Drawer'
import { useToast } from '@/context/ToastContext'

const statusVariant = {
  available: 'success',
  borrowed: 'info',
  maintenance: 'warning',
  retired: 'default',
}

const statusLabel = {
  available: '대여 가능',
  borrowed: '대여중',
  maintenance: '수리중',
  retired: '폐기',
}

export default function EquipmentManagement() {
  const { showToast } = useToast()
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState(null)

  const filtered = filter === 'all'
    ? mockEquipment
    : mockEquipment.filter((e) => e.status === filter)

  const counts = {
    all: mockEquipment.length,
    available: mockEquipment.filter((e) => e.status === 'available').length,
    borrowed: mockEquipment.filter((e) => e.status === 'borrowed').length,
    maintenance: mockEquipment.filter((e) => e.status === 'maintenance').length,
    retired: mockEquipment.filter((e) => e.status === 'retired').length,
  }

  const columns = [
    { key: 'name', label: '장비명', render: (val) => <span className="font-medium text-gray-900">{val}</span> },
    { key: 'serial', label: '시리얼' },
    { key: 'category', label: '분류', render: (val) => <Badge variant="default">{val}</Badge> },
    {
      key: 'status',
      label: '상태',
      render: (val) => <Badge variant={statusVariant[val]}>{statusLabel[val]}</Badge>,
    },
    {
      key: 'borrower',
      label: '사용자',
      render: (val) => val || <span className="text-gray-400">-</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); setSelectedEquipment(row) }}
        >
          이력
        </Button>
      ),
    },
  ]

  const mockHistory = [
    { date: '2026-04-01', action: '대여', user: '김민준', note: '' },
    { date: '2026-03-20', action: '반납', user: '이서윤', note: '' },
    { date: '2026-03-01', action: '대여', user: '이서윤', note: '' },
    { date: '2026-02-15', action: '수리 완료', user: '관리자', note: '배터리 교체' },
    { date: '2026-02-10', action: '수리 접수', user: '관리자', note: '배터리 팽창' },
    { date: '2026-01-05', action: '등록', user: '관리자', note: '신규 장비 등록' },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-h1 font-bold text-gray-900">장비 관리</h1>
        <Button icon={Plus} size="sm" onClick={() => setShowAddModal(true)}>
          장비 등록
        </Button>
      </div>

      <Tabs
        tabs={[
          { key: 'all', label: '전체', count: counts.all },
          { key: 'available', label: '대여 가능', count: counts.available },
          { key: 'borrowed', label: '대여중', count: counts.borrowed },
          { key: 'maintenance', label: '수리중', count: counts.maintenance },
          { key: 'retired', label: '폐기', count: counts.retired },
        ]}
        activeTab={filter}
        onChange={setFilter}
        className="mb-4"
      />

      <Card padding="p-0">
        <Table columns={columns} data={filtered} onRowClick={setSelectedEquipment} />
      </Card>

      {/* 장비 등록 모달 */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="장비 등록">
        <div className="space-y-4">
          <Input label="장비명" placeholder="장비명을 입력하세요" />
          <Input label="시리얼 번호" placeholder="시리얼 번호를 입력하세요" />
          <Select
            label="분류"
            options={[
              { value: 'laptop', label: '노트북' },
              { value: 'monitor', label: '모니터' },
              { value: 'tablet', label: '태블릿' },
              { value: 'peripheral', label: '주변기기' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>취소</Button>
            <Button onClick={() => { setShowAddModal(false); showToast({ type: 'success', message: '장비가 등록되었습니다.' }) }}>
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 장비 이력 Drawer */}
      <Drawer
        isOpen={!!selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
        title={selectedEquipment?.name || '장비 이력'}
      >
        {selectedEquipment && (
          <div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">시리얼</span>
                <span className="text-gray-900">{selectedEquipment.serial}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">분류</span>
                <span className="text-gray-900">{selectedEquipment.category}</span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">상태</span>
                <Badge variant={statusVariant[selectedEquipment.status]}>
                  {statusLabel[selectedEquipment.status]}
                </Badge>
              </div>
              {selectedEquipment.borrower && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">사용자</span>
                  <span className="text-gray-900">{selectedEquipment.borrower}</span>
                </div>
              )}
            </div>

            <h3 className="text-body font-semibold text-gray-900 mb-3">사용 이력</h3>
            <div className="space-y-4">
              {mockHistory.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-admin-500 mt-1.5" />
                    {i < mockHistory.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-body-sm font-medium text-gray-900">{h.action}</p>
                    <p className="text-caption text-gray-500">{h.user} · {h.date}</p>
                    {h.note && <p className="text-caption text-gray-400 mt-0.5">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
