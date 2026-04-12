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
  ?명듃遺? {
    icon: Laptop,
    bg: 'bg-[#eef2f4]',
    iconColor: 'text-[#6f8391]',
    activeBorder: 'border-[#cfd9df]',
  },
  紐⑤땲?? {
    icon: Monitor,
    bg: 'bg-[#f1efe9]',
    iconColor: 'text-[#7c7468]',
    activeBorder: 'border-[#d9d2c6]',
  },
  ?쒕툝由? {
    icon: Tablet,
    bg: 'bg-[#f3f0e6]',
    iconColor: 'text-[#8a7442]',
    activeBorder: 'border-[#dfd4bd]',
  },
  二쇰?湲곌린: {
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
    { key: 'all', label: '?꾩껜', count: equipment.length },
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
          '????좎껌???묒닔?섏뿀?듬땲?? 愿由ъ옄 ?뱀씤 ????ш? ?뺤젙?⑸땲??',
      });
    } catch {
      showToast({ type: 'error', message: '????좎껌???ㅽ뙣?덉뒿?덈떎.' });
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
      showToast({ type: 'success', message: '諛섎궔???꾨즺?섏뿀?듬땲??' });
    } catch {
      showToast({ type: 'error', message: '諛섎궔 泥섎━???ㅽ뙣?덉뒿?덈떎.' });
    } finally {
      setActionLoading(false);
      closeModal();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { label: '???媛??, variant: 'success' };
      case 'borrowed':
        return { label: '??ъ쨷', variant: 'info' };
      case 'maintenance':
        return { label: '?섎━以?, variant: 'warning' };
      case 'retired':
        return { label: '?먭린', variant: 'default' };
      default:
        return { label: status, variant: 'default' };
    }
  };

  const renderActionButton = (item) => {
    const isMine = item.borrower_id === user?.id;
    // ?닿? ?좎껌 以묒씤 ?λ퉬 (愿由ъ옄 ?뱀씤 ?湲?
    if (item.status === 'available' && pendingEquipmentIds.has(item.id)) {
      return (
        <Button size="sm" fullWidth disabled>
          ?좎껌以?        </Button>
      );
    }
    switch (item.status) {
      case 'available':
        return (
          <Button size="sm" fullWidth onClick={() => openBorrowModal(item)}>
            ????좎껌
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
            諛섎궔
          </Button>
        ) : (
          <Button size="sm" fullWidth disabled>
            ??ъ쨷
          </Button>
        );
      case 'maintenance':
        return (
          <Button size="sm" fullWidth disabled>
            ?섎━以?          </Button>
        );
      case 'retired':
        return (
          <Button size="sm" fullWidth disabled>
            ?먭린
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
      <h1 className="text-[2.1rem] font-semibold tracking-tight text-[#2c2b28]">?λ퉬 ???/h1>

      {/* 移댄뀒怨좊━ ?붿빟 移대뱶 */}
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
                    珥?{total}媛?쨌 媛??{available}媛?                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 移댄뀒怨좊━ ???꾪꽣 */}
      <Tabs
        tabs={categoryTabs}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      {/* ?λ퉬 移대뱶 洹몃━??*/}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[#9c988e] text-body-sm">
          ?대떦 移댄뀒怨좊━???λ퉬媛 ?놁뒿?덈떎.
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

                  {/* 怨좎젙 ?믪씠 - ??ъ옄 ?놁쓣 ???щ갚 ?좎? */}
                  <p className="text-caption text-[#9c988e] h-4">
                    {item.status === 'borrowed' && item.borrower_name && (
                      <>
                        ??ъ옄: {item.borrower_name}
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

      {/* ????좎껌 紐⑤떖 */}
      <Modal
        isOpen={modal.type === 'borrow'}
        onClose={closeModal}
        title="?λ퉬 ????좎껌"
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
                {modal.item.serial_no} 쨌 {modal.item.category}
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[#6b6560] mb-1">
                ?좎껌 ?ъ쑀{' '}
                <span className="text-[#9c988e] font-normal">(?좏깮)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="???紐⑹쟻??媛꾨왂???묒꽦?댁＜?몄슂"
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
                痍⑥냼
              </Button>
              <Button fullWidth loading={actionLoading} onClick={handleBorrow}>
                ?좎껌?섍린
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 諛섎궔 ?뺤씤 紐⑤떖 */}
      <Modal
        isOpen={modal.type === 'return'}
        onClose={closeModal}
        title="?λ퉬 諛섎궔"
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
                {modal.item.serial_no} 쨌 {modal.item.category}
              </p>
            </div>

            <p className="text-body-sm text-[#6b6560]">
              ?대떦 ?λ퉬瑜?諛섎궔?섍쿋?듬땲源?
            </p>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={closeModal}
                disabled={actionLoading}
              >
                痍⑥냼
              </Button>
              <Button
                variant="danger"
                fullWidth
                loading={actionLoading}
                onClick={handleReturn}
              >
                諛섎궔?섍린
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
