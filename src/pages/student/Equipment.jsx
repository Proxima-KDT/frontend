import { useState, useEffect } from 'react'
import { equipmentApi } from '@/api/equipment'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Tabs from '@/components/common/Tabs'
import Modal from '@/components/common/Modal'
import { Monitor, Laptop, Tablet, Keyboard } from 'lucide-react'

const categoryMeta = {
  '노트북':  { icon: Laptop,   bg: 'bg-blue-50',   iconColor: 'text-blue-500',   activeBorder: 'border-blue-200' },
  '모니터':  { icon: Monitor,  bg: 'bg-purple-50',  iconColor: 'text-purple-500', activeBorder: 'border-purple-200' },
  '태블릿':  { icon: Tablet,   bg: 'bg-teal-50',    iconColor: 'text-teal-500',   activeBorder: 'border-teal-200' },
  '주변기기': { icon: Keyboard, bg: 'bg-orange-50',  iconColor: 'text-orange-500', activeBorder: 'border-orange-200' },
}

export default function Equipment() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [equipment, setEquipment] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [modal, setModal] = useState({ type: null, item: null })
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    equipmentApi.getList().then(setEquipment).catch(() => {})
  }, [])

  const categoryTabs = [
    { key: 'all', label: '전체', count: equipment.length },
    ...Object.keys(categoryMeta).map((cat) => ({
      key: cat,
      label: cat,
      count: equipment.filter((e) => e.category === cat).length,
    })),
  ]

  const filtered = activeCategory === 'all'
    ? equipment
    : equipment.filter((e) => e.category === activeCategory)

  const openBorrowModal = (item) => {
    setReason('')
    setModal({ type: 'borrow', item })
  }

  const openReturnModal = (item) => {
    setModal({ type: 'return', item })
  }

  const closeModal = () => setModal({ type: null, item: null })

  const handleBorrow = async () => {
    setActionLoading(true)
    try {
      await equipmentApi.borrow(modal.item.id, reason)
      const today = new Date().toISOString().split('T')[0]
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === modal.item.id
            ? { ...e, status: 'borrowed', borrower: user?.name, borrower_id: user?.id, borrowed_date: today }
            : e
        )
      )
      showToast({ type: 'success', message: '대여 신청이 완료되었습니다.' })
    } catch {
      showToast({ type: 'error', message: '대여 신청에 실패했습니다.' })
    } finally {
      setActionLoading(false)
      closeModal()
    }
  }

  const handleReturn = async () => {
    setActionLoading(true)
    try {
      await equipmentApi.return(modal.item.id)
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === modal.item.id
            ? { ...e, status: 'available', borrower: null, borrower_id: null, borrowed_date: null }
            : e
        )
      )
      showToast({ type: 'success', message: '반납이 완료되었습니다.' })
    } catch {
      showToast({ type: 'error', message: '반납 처리에 실패했습니다.' })
    } finally {
      setActionLoading(false)
      closeModal()
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':   return { label: '대여 가능', variant: 'success' }
      case 'borrowed':    return { label: '대여중',    variant: 'info' }
      case 'maintenance': return { label: '수리중',    variant: 'warning' }
      case 'retired':     return { label: '폐기',      variant: 'default' }
      default:            return { label: status,      variant: 'default' }
    }
  }

  const renderActionButton = (item) => {
    const isMine = item.borrower_id === user?.id
    switch (item.status) {
      case 'available':
        return <Button size="sm" fullWidth onClick={() => openBorrowModal(item)}>대여 신청</Button>
      case 'borrowed':
        return isMine
          ? <Button variant="secondary" size="sm" fullWidth onClick={() => openReturnModal(item)}>반납</Button>
          : <Button size="sm" fullWidth disabled>대여중</Button>
      case 'maintenance':
        return <Button size="sm" fullWidth disabled>수리중</Button>
      case 'retired':
        return <Button size="sm" fullWidth disabled>폐기</Button>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-gray-900">장비 대여</h1>

      {/* 카테고리 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categoryMeta).map(([cat, meta]) => {
          const total = equipment.filter((e) => e.category === cat).length
          const available = equipment.filter((e) => e.category === cat && e.status === 'available').length
          const Icon = meta.icon
          const isActive = activeCategory === cat

          return (
            <Card
              key={cat}
              hoverable
              onClick={() => setActiveCategory(isActive ? 'all' : cat)}
              padding="p-4"
              className={`cursor-pointer transition-all duration-150 ${isActive ? `ring-2 ring-offset-1 ${meta.activeBorder} border-transparent` : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-gray-900">{cat}</p>
                  <p className="text-caption text-gray-500">총 {total}개 · 가능 {available}개</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* 카테고리 탭 필터 */}
      <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={setActiveCategory} />

      {/* 장비 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-body-sm">
          해당 카테고리의 장비가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { label: statusLabel, variant: statusVariant } = getStatusBadge(item.status)
            const meta = categoryMeta[item.category] || { icon: Keyboard, bg: 'bg-gray-50', iconColor: 'text-gray-500' }
            const CategoryIcon = meta.icon

            return (
              <Card key={item.id}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}>
                      <CategoryIcon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-caption text-gray-400 mt-0.5">{item.serial}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{item.category}</Badge>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>

                  {/* 고정 높이 - 대여자 없을 때 여백 유지 */}
                  <p className="text-caption text-gray-500 h-4">
                    {item.status === 'borrowed' && item.borrower && (
                      <>
                        대여자: {item.borrower}
                        {item.borrowed_date && <span className="ml-1">({item.borrowed_date}~)</span>}
                      </>
                    )}
                  </p>

                  {renderActionButton(item)}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* 대여 신청 모달 */}
      <Modal
        isOpen={modal.type === 'borrow'}
        onClose={closeModal}
        title="장비 대여 신청"
        maxWidth="max-w-sm"
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-gray-900">{modal.item.name}</p>
              <p className="text-caption text-gray-500">{modal.item.serial} · {modal.item.category}</p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-1">
                신청 사유 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="대여 목적을 간략히 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-body-sm outline-none resize-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={closeModal}>취소</Button>
              <Button fullWidth onClick={handleBorrow}>신청하기</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 반납 확인 모달 */}
      <Modal
        isOpen={modal.type === 'return'}
        onClose={closeModal}
        title="장비 반납"
        maxWidth="max-w-sm"
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-gray-900">{modal.item.name}</p>
              <p className="text-caption text-gray-500">{modal.item.serial} · {modal.item.category}</p>
            </div>

            <p className="text-body-sm text-gray-700">
              해당 장비를 반납하겠습니까?
            </p>

            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={closeModal}>취소</Button>
              <Button variant="danger" fullWidth onClick={handleReturn}>반납하기</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
