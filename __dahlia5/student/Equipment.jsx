import { useState, useEffect } from 'react';
import { equipmentApi } from '@/api/equipment';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
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

const equipmentThumbs = [
  {
    key: 'macbook',
    src: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    key: '留λ턿',
    src: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    key: 'monitor',
    src: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: '紐⑤땲??,
    src: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'ipad',
    src: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'tablet',
    src: 'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: 'mouse',
    src: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: '留덉슦??,
    src: 'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=900&q=80',
  },
  {
    key: '?ㅻ낫??,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Computer_keyboard.svg/1280px-Computer_keyboard.svg.png',
  },
  {
    key: 'wacom',
    src: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
  },
];

function getEquipmentThumb(item) {
  const txt = `${item.name || ''} ${item.serial_no || ''}`.toLowerCase();
  for (const t of equipmentThumbs) {
    if (txt.includes(t.key.toLowerCase())) return t.src;
  }
  return 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=80';
}

function handleThumbError(e) {
  const fallbackSrc = e.currentTarget.dataset.fallback;
  if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
    e.currentTarget.src = fallbackSrc;
    return;
  }
  e.currentTarget.onerror = null;
  e.currentTarget.src =
    'https://dummyimage.com/1200x800/efede7/9c988e&text=No+Image';
}

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
        return {
          label: '???媛??,
          className: 'bg-[#e9eff3] text-[#4f6475] border border-[#dbe6ed]',
        };
      case 'borrowed':
        return {
          label: '??ъ쨷',
          className: 'bg-[#f4ecd7] text-[#7a6330] border border-[#ebdfbf]',
        };
      case 'maintenance':
        return {
          label: '?섎━以?,
          className: 'bg-[#efede7] text-[#8d877e] border border-[#e0dbd1]',
        };
      case 'retired':
        return {
          label: '?먭린',
          className: 'bg-[#efede7] text-[#8d877e] border border-[#e0dbd1]',
        };
      default:
        return {
          label: status,
          className: 'bg-[#efede7] text-[#8d877e] border border-[#e0dbd1]',
        };
    }
  };

  const renderActionButton = (item) => {
    const isMine = item.borrower_id === user?.id;
    // ?닿? ?좎껌 以묒씤 ?λ퉬 (愿由ъ옄 ?뱀씤 ?湲?
    if (item.status === 'available' && pendingEquipmentIds.has(item.id)) {
      return (
        <Button size="sm" fullWidth disabled className="!bg-[#eceae4] !text-[#9c988e]">
          ?좎껌以?
        </Button>
      );
    }
    switch (item.status) {
      case 'available':
        return (
          <Button size="sm" fullWidth className="!bg-[#4e5a61] hover:!bg-[#424d53] active:!bg-[#384248]" onClick={() => openBorrowModal(item)}>
            ????좎껌
          </Button>
        );
      case 'borrowed':
        return isMine ? (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            className="!border-[#cfc8bc] !bg-white !text-[#5c5852] hover:!bg-[#f7f6f2]"
            onClick={() => openReturnModal(item)}
          >
            諛섎궔
          </Button>
        ) : (
          <Button size="sm" fullWidth disabled className="!bg-[#efe7d6] !text-[#7a6330]">
            ??ъ쨷
          </Button>
        );
      case 'maintenance':
        return (
          <Button size="sm" fullWidth disabled className="!bg-[#eceae4] !text-[#9c988e]">
            ?섎━以?
          </Button>
        );
      case 'retired':
        return (
          <Button size="sm" fullWidth disabled className="!bg-[#eceae4] !text-[#9c988e]">
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
      <header>
        <h1 className={`text-[2.1rem] font-semibold text-[#2c2b28]`}>
          ?λ퉬 ???
        </h1>
        <p className="mt-1 text-sm text-[#8a847a]">
          ?꾩슂???λ퉬瑜??뺤씤?섍퀬 ??щ? ?좎껌?섏꽭??
        </p>
      </header>

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
              className={`cursor-pointer rounded-2xl border-[#eceae4] bg-white transition-all duration-150 ${isActive ? `ring-2 ring-offset-1 ${meta.activeBorder} border-transparent` : ''}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-gray-900">
                    {cat}
                  </p>
                  <p className="text-caption text-gray-500">
                    珥?{total}媛?쨌 媛??{available}媛?
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 移댄뀒怨좊━ ???꾪꽣 */}
      <div className="inline-flex flex-wrap gap-1 rounded-full border border-[#eceae4] bg-[#fbfaf7] p-1">
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveCategory(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              activeCategory === tab.key
                ? 'bg-white text-[#2c2b28] shadow-sm'
                : 'text-[#8a847a] hover:text-[#5c5852]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ?λ퉬 移대뱶 洹몃━??*/}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-body-sm">
          ?대떦 移댄뀒怨좊━???λ퉬媛 ?놁뒿?덈떎.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const { label: statusLabel, className: statusClassName } =
              getStatusBadge(item.status);
            const meta = categoryMeta[item.category] || {
              icon: Keyboard,
              bg: 'bg-gray-50',
              iconColor: 'text-gray-500',
            };
            const CategoryIcon = meta.icon;

            return (
              <Card key={item.id} className="rounded-2xl border-[#eceae4] bg-white shadow-[0_2px_20px_rgba(60,52,40,0.05)]">
                <div className="space-y-3">
                  <div className="h-32 w-full overflow-hidden rounded-xl bg-gray-50">
                    <img
                      src={getEquipmentThumb(item)}
                      data-fallback="https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"
                      alt={item.name}
                      onError={handleThumbError}
                      className={`h-full w-full ${
                        item.name?.includes('?ㅻ낫??)
                          ? 'object-contain p-3'
                          : 'object-cover'
                      }`}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center`}
                    >
                      <CategoryIcon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body font-semibold text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-caption text-gray-400 mt-0.5">
                        {item.serial_no}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center rounded-full border border-[#e0dbd1] bg-[#f7f5f0] px-2.5 py-1 text-xs font-semibold text-[#7f786d]">
                      {item.category}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* 怨좎젙 ?믪씠 - ??ъ옄 ?놁쓣 ???щ갚 ?좎? */}
                  <p className="text-caption text-gray-500 h-4">
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
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-gray-900">
                {modal.item.name}
              </p>
              <p className="text-caption text-gray-500">
                {modal.item.serial_no} 쨌 {modal.item.category}
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-1">
                ?좎껌 ?ъ쑀{' '}
                <span className="text-gray-400 font-normal">(?좏깮)</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="???紐⑹쟻??媛꾨왂???묒꽦?댁＜?몄슂"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-body-sm outline-none resize-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
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
      >
        {modal.item && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-1">
              <p className="text-body-sm font-semibold text-gray-900">
                {modal.item.name}
              </p>
              <p className="text-caption text-gray-500">
                {modal.item.serial_no} 쨌 {modal.item.category}
              </p>
            </div>

            <p className="text-body-sm text-gray-700">
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
