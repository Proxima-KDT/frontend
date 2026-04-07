import { mockEquipment, mockStudentUser } from '@/data/mockData'
import Card from '@/components/common/Card'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { Monitor, Laptop, Tablet, Keyboard } from 'lucide-react'

const CURRENT_USER_ID = mockStudentUser.id

export default function Equipment() {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { label: '대여 가능', variant: 'success' }
      case 'borrowed':
        return { label: '대여중', variant: 'info' }
      case 'maintenance':
        return { label: '수리중', variant: 'warning' }
      case 'retired':
        return { label: '폐기', variant: 'default' }
      default:
        return { label: status, variant: 'default' }
    }
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case '노트북':
        return Laptop
      case '모니터':
        return Monitor
      case '태블릿':
        return Tablet
      default:
        return Keyboard
    }
  }

  const renderActionButton = (item) => {
    const isMine = item.borrower_id === CURRENT_USER_ID

    switch (item.status) {
      case 'available':
        return (
          <Button size="sm" fullWidth>
            대여 신청
          </Button>
        )
      case 'borrowed':
        if (isMine) {
          return (
            <Button variant="secondary" size="sm" fullWidth>
              반납
            </Button>
          )
        }
        return (
          <Button size="sm" fullWidth disabled>
            대여중
          </Button>
        )
      case 'maintenance':
        return (
          <Button size="sm" fullWidth disabled>
            수리중
          </Button>
        )
      case 'retired':
        return (
          <Button size="sm" fullWidth disabled>
            폐기
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-h2 font-bold text-gray-900">장비 대여</h1>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockEquipment.map((item) => {
          const { label: statusLabel, variant: statusVariant } = getStatusBadge(item.status)
          const CategoryIcon = getCategoryIcon(item.category)

          return (
            <Card key={item.id}>
              <div className="space-y-3">
                {/* Icon & Name */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <CategoryIcon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-body font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-caption text-gray-400 mt-0.5">
                      {item.serial}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default">{item.category}</Badge>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>

                {/* Borrower Info (if borrowed) */}
                {item.status === 'borrowed' && item.borrower && (
                  <p className="text-caption text-gray-500">
                    대여자: {item.borrower}
                    {item.borrowed_date && (
                      <span className="ml-1">({item.borrowed_date}~)</span>
                    )}
                  </p>
                )}

                {/* Action Button */}
                {renderActionButton(item)}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
