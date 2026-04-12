import { useState, useEffect } from 'react';
import { equipmentApi } from '@/api/equipment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import Modal from '@/components/common/Modal';
import { Monitor, Laptop, Tablet, Keyboard } from 'lucide-react';

const pageBg = '#F7F5F0';
const categoryMeta = {
  노트북: {
    icon: Laptop,
    bg: 'bg-[#eef2f4]',
    iconColor: 'text-[#6f8391]',
    activeBorder: 'border-[#cfd9df]',
  },
  모니터: {
    icon: Monitor,
    bg: 'bg-[#f1efe9]',
    iconColor: 'text-[#7c7468]',
    activeBorder: 'border-[#d9d2c6]',
  },
  태블릿: {
    icon: Tablet,
    bg: 'bg-[#f3f0e6]',
    iconColor: 'text-[#8a7442]',
    activeBorder: 'border-[#dfd4bd]',
  },
  주변기기: {
    icon: Keyboard,
    bg: 'bg-[#efede7]',
    iconColor: 'text-[#80786d]',
    activeBorder: 'border-[#d8d2c7]',
  },
};

export default function Equipment() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [pendingEquipmentIds, setPendingEquipmentIds] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('all');
  const [modal, setModal] = useState({ type: null, item: null });
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    equipmentApi
      .getList()
      .then(setEquipment)
      .catch(() => {});
    equipmentApi
      .getMyRequests()
      .then((data) =>
        setPendingEquipmentIds(new Set(data.pending_equipment_ids)),
      )
      .catch(() => {});
  }, []);

  const categoryTabs = [
    { key: 'all', label: '전체', count: equipment.length },
    ...Object.keys(categoryMeta).map((cat) => ({
      key: cat,
      label: cat,
      count: equipment.filter((e) => e.category === cat).length,
    })),
  ];

  const filtered =
    activeCategory === 'all'
      ? equipment
      : equipment.filter((e) => e.category === activeCategory);

  const openBorrowModal = (item) => {
    setReason('');
    setModal({ type: 'borrow', item });
  };

  const openReturnModal = (item) => {
    setModal({ type: 'return', item });
  };

  const closeModal = () => setModal({ type: null, item: null });

  const handleBorrow = async () => {
    setActionLoading(true);
    try {
      await equipmentApi.borrow(modal.item.id, reason);
      setPendingEquipmentIds((prev) => new Set([...prev, modal.item.id]));
      showToast({
        type: 'success',
        message:
          '대여 신청이 접수되었습니다. 관리자 승인 후 대여가 확정됩니다.',
      });
    } catch {
      showToast({ type: 'error', message: '대여 신청에 실패했습니다.' });
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      await equipmentApi.return(modal.item.id);
      setEquipment((prev) =>
        prev.map((e) =>
          e.id === modal.item.id
            ? {
                ...e,
                status: 'available',
                borrower_name: null,
                borrower_id: null,
                borrowed_at: null,
              }
            : e,
        ),
      );
      showToast({ type: 'success', message: '반납이 완료되었습니다.' });
    } catch {
      showToast({ type: 'error', message: '반납 처리에 실패했습니다.' });
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { label: '대여 가능', variant: 'success' };
      case 'borrowed':
        return { label: '대여중', variant: 'info' };
      case 'maintenance':
        return { label: '수리중', variant: 'warning' };
      case 'retired':
        return { label: '폐기', variant: 'default' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const renderActionButton = (item) => {
    const isMine = item.borrower_id === user?.id;
    // 내가 신청 중인 장비 (관리자 승인 대기)
    if (item.status === 'available' && pendingEquipmentIds.has(item.id)) {
      return (
        <Button size="sm" fullWidth disabled>
          신청중
        </Button>
      );
    }
    switch (item.status) {
      case 'available':
        return (
          <Button size="sm" fullWidth onClick={() => openBorrowModal(item)}>
            대여 신청
          </Button>
        );
      case 'borrowed':
        return isMine ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => openReturnModal(item)}
          >
            반납
          </Button>
        ) : (
          <Button size="sm" fullWidth disabled>
            대여중
          </Button>
        );
      case 'maintenance':
        return (
          <Button size="sm" fullWidth disabled>
            수리중
          </Button>
        );
      case 'retired':
        return (
          <Button size="sm" fullWidth disabled>
            폐기
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="space-y-6 rounded-3xl px-2 py-4 sm:px-4 md:-mx-2 md:px-6 md:py-8"
      style={{ backgroundColor: pageBg }}
    >
      <h1 className="text-[2.1rem] font-semibold tracking-tight text-[#2c2b28]">장비 대여</h1>

      {/* 카테고리 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(categoryMeta).map(([cat, meta]) => {
          const total = equipment.filter((e) => e.category === cat).length;
          const available = equipment.filter(
            (e) => e.category === cat && e.status === 'available',
          ).length;
          const Icon = meta.icon;
          const isActive = activeCategory === cat;

          return (
            <Card
              key={cat}
              hoverable
              onClick={() => setActiveCategory(isActive ? 'all' : cat)}
              padding="p-4"
              className={`cursor-pointer transition-all duration-150 ${isActive ? `ring-2 ring-offset-1 ${meta.activeBorder} border-transparent` : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-[#2c2b28]">
                    {cat}
                  </p>
                  <p className="text-caption text-[#9c988e]">
                    총 {total}개 · 가능 {available}개
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 카테고리 탭 필터 */}
      <Tabs
        tabs={categoryTabs}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      {/* 장비 카드 그리드 */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[#9c988e] text-body-sm">
          해당 카테고리의 장비가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { label: statusLabel, variant: statusVariant } =
              getStatusBadge(item.status);
            const meta = categoryMeta[item.category] || {
              icon: Keyboard,
              bg: 'bg-gray-50',
              iconColor: 'text-gray-500',
            };
            const CategoryIcon = meta.icon;

            return (
              <Card key={item.id}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}
                    >
                      <CategoryIcon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-[#2c2b28] truncate">
                        {item.name}
                      </h3>
                      <p className="text-caption text-[#9c988e] mt-0.5">
                        {item.serial_no}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="default">{item.category}</Badge>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>

                  {/* 고정 높이 - 대여자 없을 때 여백 유지 */}
                  <p className="text-caption text-[#9c988e] h-4">
                    {item.status === 'borrowed' && item.borrower_name && (
                      <>
                        대여자: {item.borrower_name}
                        {item.borrowed_at && (
                          <span className="ml-1">({item.borrowed_at}~)</span>
                        )}
                      </>
                    )}
                  </p>

                  {renderActionButton(item)}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 대여 신청 모달 */}
      <Modal
        isOpen={modal.type === 'borrow'}
        onClose={closeModal}
        title="장비 대여 신청"
        maxWidth="max-w-sm"
        persistent
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-[#f7f6f2] rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-[#2c2b28]">
                {modal.item.name}
              </p>
              <p className="text-caption text-[#9c988e]">
                {modal.item.serial_no} · {modal.item.category}
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[#6b6560] mb-1">
                신청 사유{' '}
                <span className="text-[#9c988e] font-normal">(선택)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="대여 목적을 간략히 작성해주세요"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[#e6e2d9] text-body-sm outline-none resize-none focus:border-[#c9a962] focus:ring-2 focus:ring-[#c9a962]/20 transition-colors bg-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={closeModal}
                disabled={actionLoading}
              >
                취소
              </Button>
              <Button fullWidth loading={actionLoading} onClick={handleBorrow}>
                신청하기
              </Button>
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
        persistent
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-[#f7f6f2] rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-[#2c2b28]">
                {modal.item.name}
              </p>
              <p className="text-caption text-[#9c988e]">
                {modal.item.serial_no} · {modal.item.category}
              </p>
            </div>

            <p className="text-body-sm text-[#6b6560]">
              해당 장비를 반납하겠습니까?
            </p>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={closeModal}
                disabled={actionLoading}
              >
                취소
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={actionLoading}
                onClick={handleReturn}
              >
                반납하기
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
