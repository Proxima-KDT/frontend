import { useState } from 'react'
import { Monitor, CheckCircle, XCircle, Package, Wrench } from 'lucide-react'
import { mockEquipment, mockEquipmentRequests } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Table from '@/components/common/Table'
import Modal from '@/components/common/Modal'
import Textarea from '@/components/common/Textarea'
import { useToast } from '@/context/ToastContext'

export default function AdminDashboard() {
  const { showToast } = useToast()
  const [requests, setRequests] = useState(mockEquipmentRequests)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const available = mockEquipment.filter((e) => e.status === 'available').length
  const borrowed = mockEquipment.filter((e) => e.status === 'borrowed').length
  const maintenance = mockEquipment.filter((e) => e.status === 'maintenance').length
  const retired = mockEquipment.filter((e) => e.status === 'retired').length

  const stats = [
    { label: '전체 장비', value: mockEquipment.length, icon: Package, color: 'text-primary-500', bg: 'bg-primary-50' },
    { label: '대여 가능', value: available, icon: Monitor, color: 'text-success-500', bg: 'bg-success-50' },
    { label: '대여중', value: borrowed, icon: CheckCircle, color: 'text-student-500', bg: 'bg-student-50' },
    { label: '수리/폐기', value: maintenance + retired, icon: Wrench, color: 'text-warning-500', bg: 'bg-warning-50' },
  ]

  const handleApprove = (id) => {
    setRequests(requests.filter((r) => r.id !== id))
    showToast({ type: 'success', message: '대여가 승인되었습니다.' })
  }

  const handleReject = () => {
    if (rejectModal) {
      setRequests(requests.filter((r) => r.id !== rejectModal.id))
      setRejectModal(null)
      setRejectReason('')
      showToast({ type: 'info', message: '대여가 반려되었습니다.' })
    }
  }

  const columns = [
    { key: 'student_name', label: '학생', render: (val) => <span className="font-medium text-gray-900">{val}</span> },
    { key: 'equipment_name', label: '장비' },
    { key: 'request_date', label: '신청일' },
    { key: 'reason', label: '사유', render: (val) => <span className="text-gray-500 max-w-[200px] truncate block">{val}</span> },
    {
      key: 'actions',
      label: '처리',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="primary" onClick={() => handleApprove(row.id)}>
            승인
          </Button>
          <Button size="sm" variant="danger" onClick={() => setRejectModal(row)}>
            반려
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-caption text-gray-500">{stat.label}</p>
                <p className="text-h3 font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 승인 대기 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-semibold text-gray-900">승인 대기</h2>
          <Badge variant="warning">{requests.length}건</Badge>
        </div>
        {requests.length > 0 ? (
          <Table columns={columns} data={requests} />
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-2" />
            <p className="text-body-sm text-gray-500">처리 대기 중인 요청이 없습니다</p>
          </div>
        )}
      </Card>

      {/* 반려 모달 */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="대여 반려">
        <div className="space-y-4">
          <p className="text-body-sm text-gray-700">
            <span className="font-medium">{rejectModal?.student_name}</span>의{' '}
            <span className="font-medium">{rejectModal?.equipment_name}</span> 대여 요청을 반려합니다.
          </p>
          <Textarea
            label="반려 사유"
            placeholder="반려 사유를 입력하세요"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>취소</Button>
            <Button variant="danger" onClick={handleReject}>반려</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
