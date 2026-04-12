import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wrench,
  Pencil,
  Trash2,
  History,
  ImagePlus,
  X,
  Download,
  Search,
  Package,
  Activity,
  AlertTriangle,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Table from '@/components/common/Table';
import Modal from '@/components/common/Modal';
import Drawer from '@/components/common/Drawer';
import Textarea from '@/components/common/Textarea';
import { useToast } from '@/context/ToastContext';

const statusVariant = {
  available: 'success',
  borrowed: 'info',
  maintenance: 'warning',
  retired: 'default',
};

const statusLabel = {
  available: '대여 가능',
  borrowed: '대여중',
  maintenance: '수리중',
  retired: '폐기',
};

const statusLabelEn = {
  available: 'Available',
  borrowed: 'In use',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

const ACTION_CONFIG = {
  borrow: {
    label: '대여',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    Icon: ArrowDownCircle,
  },
  maintenance: {
    label: '수리',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    Icon: Wrench,
  },
  status_change: {
    label: '상태 변경',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    Icon: null,
  },
};

const FILTER_TABS = [
  { key: 'all', labelKo: '전체', labelEn: 'All' },
  { key: 'available', labelKo: '대여 가능', labelEn: 'Available' },
  { key: 'borrowed', labelKo: '대여중', labelEn: 'In use' },
  { key: 'maintenance', labelKo: '수리중', labelEn: 'Maintenance' },
  { key: 'retired', labelKo: '폐기', labelEn: 'Retired' },
  { key: 'pending', labelKo: '승인 대기', labelEn: 'Pending' },
];

/** 분류별 기본 썸네일 (API에 image_url 없을 때) */
const CATEGORY_THUMB = {
  노트북:
    'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
  모니터:
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
  태블릿:
    'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=400&q=80',
  주변기기:
    'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=400&q=80',
};

const equipmentThumbs = [
  { key: 'macbook', src: CATEGORY_THUMB.노트북 },
  { key: '맥북', src: CATEGORY_THUMB.노트북 },
  { key: 'monitor', src: CATEGORY_THUMB.모니터 },
  { key: '모니터', src: CATEGORY_THUMB.모니터 },
  { key: 'ipad', src: CATEGORY_THUMB.태블릿 },
  { key: 'tablet', src: CATEGORY_THUMB.태블릿 },
  { key: 'mouse', src: CATEGORY_THUMB.주변기기 },
  { key: '마우스', src: CATEGORY_THUMB.주변기기 },
  {
    key: '키보드',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Computer_keyboard.svg/640px-Computer_keyboard.svg.png',
  },
  {
    key: 'wacom',
    src: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=400&q=80',
  },
];

const categoryPillClass = {
  노트북: 'bg-[#e8f1fa] text-[#3d5a7a]',
  모니터: 'bg-[#e4f0ee] text-[#2d5c55]',
  태블릿: 'bg-[#e8eef5] text-[#4a6282]',
  주변기기: 'bg-[#f5f0e4] text-[#7a6120]',
};

function getEquipmentThumb(item) {
  if (!item) return CATEGORY_THUMB.노트북;
  if (item.image_url) return item.image_url;
  const cat = item.category;
  if (cat && CATEGORY_THUMB[cat]) return CATEGORY_THUMB[cat];
  const txt = `${item.name || ''} ${item.serial_no || ''}`.toLowerCase();
  for (const t of equipmentThumbs) {
    if (txt.includes(t.key.toLowerCase())) return t.src;
  }
  return 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=400&q=80';
}

function handleThumbError(e) {
  const fallbackSrc = e.currentTarget.dataset.fallback;
  if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
    e.currentTarget.src = fallbackSrc;
    return;
  }
  e.currentTarget.onerror = null;
  e.currentTarget.src =
    'https://dummyimage.com/400x400/efede7/9c988e&text=No+Image';
}

function parseSupabaseDT(isoStr) {
  if (!isoStr) return null;
  const normalized = isoStr.replace(' ', 'T').replace(/\+00$/, '+00:00');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function formatDT(isoStr) {
  const d = parseSupabaseDT(isoStr);
  if (!d) return '—';
  return d.toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function calcDuration(borrowAt, returnAt) {
  const b = parseSupabaseDT(borrowAt);
  const r = parseSupabaseDT(returnAt);
  if (!b || !r) return null;
  const diff = r - b;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '1분 미만';
  if (mins < 60) return `${mins}분`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

function exportEquipmentCsv(rows) {
  const headers = ['name', 'serial_no', 'category', 'status_ko', 'borrower'];
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${(r.name || '').replace(/"/g, '""')}"`,
        `"${(r.serial_no || '').replace(/"/g, '""')}"`,
        `"${(r.category || '').replace(/"/g, '""')}"`,
        r.status,
        `"${(r.borrower || '').replace(/"/g, '""')}"`,
      ].join(','),
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `equipment-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ThBilingual({ en, ko }) {
  return (
    <span className="block leading-tight">
      <span className="block text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#9a9ca3]">
        {en}
      </span>
      <span className="block text-[0.72rem] font-semibold text-[#5c5e66]">
        {ko}
      </span>
    </span>
  );
}

export default function EquipmentManagement() {
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    serial_no: '',
    category: '노트북',
  });
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipHistory, setEquipHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 이미지 상태 (등록용)
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addImageFile, setAddImageFile] = useState(null);

  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    serial_no: '',
    category: '노트북',
    image_url: '',
  });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  // 삭제 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const openAdd = () => setShowAddModal(true);
    window.addEventListener('admin-equipment-open-add', openAdd);
    return () =>
      window.removeEventListener('admin-equipment-open-add', openAdd);
  }, []);

  useEffect(() => {
    adminApi
      .getEquipment()
      .then((data) => setEquipment(data))
      .catch(() => {});
    adminApi
      .getEquipmentRequests()
      .then((data) => setRequests(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  const handleApprove = (id) => {
    adminApi
      .approveEquipmentRequest(id)
      .then(() => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        showToast({ type: 'success', message: '대여가 승인되었습니다.' });
      })
      .catch(() =>
        showToast({ message: '승인에 실패했습니다.', type: 'error' }),
      );
  };

  const handleReject = () => {
    if (rejectModal) {
      adminApi
        .rejectEquipmentRequest(rejectModal.id, rejectReason)
        .then(() => {
          setRequests((prev) => prev.filter((r) => r.id !== rejectModal.id));
          setRejectModal(null);
          setRejectReason('');
          showToast({ type: 'info', message: '대여가 반려되었습니다.' });
        })
        .catch(() =>
          showToast({ message: '반려에 실패했습니다.', type: 'error' }),
        );
    }
  };

  const handleOpenHistory = (equip) => {
    setSelectedEquipment(equip);
    adminApi
      .getEquipmentHistory(equip.id)
      .then((data) => setEquipHistory(data))
      .catch(() => setEquipHistory([]));
  };

  const handleOpenEdit = (equip) => {
    setEditTarget(equip);
    setEditForm({
      name: equip.name,
      serial_no: equip.serial_no,
      category: equip.category || '노트북',
      image_url: equip.image_url || '',
    });
    setEditImagePreview(equip.image_url || null);
    setEditImageFile(null);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    try {
      let updatedImageUrl = editForm.image_url;
      if (editImageFile) {
        const fd = new FormData();
        fd.append('file', editImageFile);
        const res = await adminApi.uploadEquipmentImage(editTarget.id, fd);
        updatedImageUrl = res.image_url;
      }
      const updated = await adminApi.updateEquipment(editTarget.id, {
        name: editForm.name,
        serial_no: editForm.serial_no,
        category: editForm.category,
        image_url: updatedImageUrl || undefined,
      });
      setEquipment((prev) =>
        prev.map((e) => (e.id === editTarget.id ? { ...e, ...updated } : e)),
      );
      setShowEditModal(false);
      setEditTarget(null);
      showToast({ type: 'success', message: '장비 정보가 수정되었습니다.' });
    } catch (err) {
      const msg = err?.response?.data?.detail || '수정에 실패했습니다.';
      showToast({ message: msg, type: 'error' });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    adminApi
      .deleteEquipment(deleteTarget.id)
      .then(() => {
        setEquipment((prev) => prev.filter((e) => e.id !== deleteTarget.id));
        setShowDeleteModal(false);
        setDeleteTarget(null);
        showToast({ type: 'success', message: '장비가 삭제되었습니다.' });
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail || '삭제에 실패했습니다.';
        showToast({ message: msg, type: 'error' });
      });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAddImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const counts = useMemo(
    () => ({
      all: equipment.length,
      available: equipment.filter((e) => e.status === 'available').length,
      borrowed: equipment.filter((e) => e.status === 'borrowed').length,
      maintenance: equipment.filter((e) => e.status === 'maintenance').length,
      retired: equipment.filter((e) => e.status === 'retired').length,
    }),
    [equipment],
  );

  const filteredByStatus =
    filter === 'all'
      ? equipment
      : filter === 'pending'
        ? []
        : equipment.filter((e) => e.status === filter);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredByStatus;
    return filteredByStatus.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.serial_no || '').toLowerCase().includes(q),
    );
  }, [filteredByStatus, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );

  const requestColumns = [
    {
      key: 'student_name',
      label: <ThBilingual en="Student" ko="학생" />,
      render: (val) => <span className="font-medium text-gray-900">{val}</span>,
    },
    {
      key: 'equipment_name',
      label: <ThBilingual en="Equipment" ko="장비" />,
    },
    {
      key: 'request_date',
      label: <ThBilingual en="Requested" ko="신청일" />,
    },
    {
      key: 'reason',
      label: <ThBilingual en="Reason" ko="사유" />,
      render: (val) => (
        <span className="text-gray-500 max-w-[200px] truncate block">
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: <ThBilingual en="Actions" ko="처리" />,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApprove(row.id)}
          >
            승인 · Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRejectModal(row)}
          >
            반려 · Reject
          </Button>
        </div>
      ),
    },
  ];

  const columns = [
    {
      key: 'name',
      label: <ThBilingual en="Equipment name" ko="장비명" />,
      render: (val, row) => {
        const thumb = getEquipmentThumb(row);
        const fallback =
          (row.category && CATEGORY_THUMB[row.category]) ||
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=400&q=80';
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e2e4e8] bg-[#f4f5f7]">
              <img
                src={thumb}
                alt=""
                className="h-full w-full object-cover"
                onError={handleThumbError}
                data-fallback={fallback}
              />
            </div>
            <span className={`min-w-0 truncate font-semibold text-[#1a1c21]`}>
              {val}
            </span>
          </div>
        );
      },
    },
    {
      key: 'serial_no',
      label: <ThBilingual en="Serial number" ko="시리얼" />,
      render: (val) => (
        <span className="font-mono text-[0.8rem] text-[#4b5563]">{val}</span>
      ),
    },
    {
      key: 'category',
      label: <ThBilingual en="Category" ko="분류" />,
      render: (val) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide ${
            categoryPillClass[val] || 'bg-[#f0f1f4] text-[#5c5f6a]'
          }`}
        >
          {(val || '—').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: <ThBilingual en="Status" ko="상태" />,
      render: (val) => {
        const dot =
          val === 'available'
            ? 'bg-emerald-500'
            : val === 'borrowed'
              ? 'bg-amber-500'
              : val === 'maintenance'
                ? 'bg-red-500'
                : 'bg-gray-400';
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
            <span className="text-body-sm text-[#374151]">
              {statusLabel[val]} · {statusLabelEn[val]}
            </span>
          </div>
        );
      },
    },
    {
      key: 'borrower',
      label: <ThBilingual en="Primary user" ko="사용자" />,
      render: (val) =>
        val || <span className="text-gray-400">— · Internal</span>,
    },
    {
      key: 'actions',
      label: <ThBilingual en="Actions" ko="작업" />,
      width: '72px',
      render: (_, row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleOpenHistory(row)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#d1d5db] hover:bg-[#f9fafb]"
            title="이력 · History"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => row.status !== 'borrowed' && handleOpenEdit(row)}
            disabled={row.status === 'borrowed'}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white transition-colors ${
              row.status === 'borrowed'
                ? 'text-gray-200 cursor-not-allowed'
                : 'text-[#6b7280] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600'
            }`}
            title={
              row.status === 'borrowed'
                ? '대여 중인 장비는 편집할 수 없습니다'
                : '편집 · Edit'
            }
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(row);
              setShowDeleteModal(true);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
            title="삭제 · Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const kpiCards = [
    {
      key: 'total',
      value: counts.all,
      labelKo: '전체 장비',
      labelEn: 'Total equipment',
      icon: Package,
      iconBg: 'bg-[#eef0f3]',
      iconColor: 'text-[#5c6470]',
    },
    {
      key: 'avail',
      value: counts.available,
      labelKo: '대여 가능',
      labelEn: 'Available',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      key: 'use',
      value: counts.borrowed,
      labelKo: '대여중',
      labelEn: 'In use',
      icon: Activity,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      key: 'maint',
      value: counts.maintenance,
      labelKo: '수리중',
      labelEn: 'Maintenance',
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="rounded-3xl border border-[#ebe4d8]/80 bg-[#fdfbf7] px-4 py-6 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="min-h-0 text-[#1a1c21]">
        {/* 상단 툴바 (검색 · 알림 영역) */}
        <div className="mb-4">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="장비 검색 · Search equipment…"
              className="w-full rounded-full border border-[#e5e7eb] bg-white py-2.5 pl-10 pr-4 text-sm text-[#374151] shadow-sm outline-none transition focus:border-[#2d2d2d] focus:ring-1 focus:ring-[#2d2d2d]"
            />
          </div>
        </div>

        {/* 히어로 */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className={`text-[1.75rem] font-bold tracking-tight text-[#121926] sm:text-[2rem]`}
            >
              대여용 장비 현황
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-caption text-[#6b7280] shadow-sm">
            <Globe className="h-4 w-4 text-[#9ca3af]" />
            <span>
              승인 대기{' '}
              <span className="font-semibold text-[#121926]">
                {requests.length}
              </span>
              건 · Pending{' '}
              <span className="font-semibold text-[#121926]">
                {requests.length}
              </span>
            </span>
          </div>
        </div>

        {/* KPI 카드 */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.key}
                className="rounded-3xl border border-[#e8e4dc] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${k.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${k.iconColor}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold text-[#121926]`}>
                  {k.value.toLocaleString()}
                </p>
                <p className="mt-1 text-sm font-medium text-[#374151]">
                  {k.labelKo}
                </p>
                <p className="text-caption text-[#9ca3af]">{k.labelEn}</p>
              </div>
            );
          })}
        </div>

        {/* 필터 + 표 */}
        <div className="overflow-hidden rounded-3xl border border-[#e4dfd4] bg-white shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 border-b border-[#efe9df] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => {
                const count =
                  tab.key === 'all'
                    ? counts.all
                    : tab.key === 'pending'
                      ? requests.length
                      : counts[tab.key];
                const active = filter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilter(tab.key)}
                    className={`rounded-full px-4 py-2 text-left text-[0.8rem] font-medium transition ${
                      active
                        ? 'bg-[#2d2d2d] text-white shadow-sm'
                        : 'border border-[#e5e7eb] bg-[#fafafa] text-[#4b5563] hover:bg-[#f3f4f6]'
                    }`}
                  >
                    <span className="block leading-tight">{tab.labelKo}</span>
                    <span
                      className={`block text-[0.65rem] ${active ? 'text-white/80' : 'text-[#9ca3af]'}`}
                    >
                      {tab.labelEn} · {count}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  showToast({
                    type: 'info',
                    message:
                      '고급 필터는 준비 중입니다. · Advanced filters coming soon.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#faf9f6] px-4 py-2 text-[0.8rem] font-medium text-[#4b5563] transition hover:bg-[#f3f1ec]"
              >
                <SlidersHorizontal className="h-4 w-4 text-[#9ca3af]" />
                고급 필터 · Advanced
              </button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={() => {
                  if (filter === 'pending') {
                    showToast({
                      type: 'info',
                      message:
                        '보내기는 장비 목록 탭에서만 사용할 수 있습니다. · Export is only available on equipment tabs.',
                    });
                    return;
                  }
                  exportEquipmentCsv(filtered);
                  showToast({
                    type: 'success',
                    message: 'CSV 파일로 저장했습니다. · Exported to CSV.',
                  });
                }}
              >
                보내기 · Export
              </Button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {filter === 'pending' ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#121926]">
                    승인 대기 · Pending approval
                  </h2>
                  <Badge variant="warning">
                    {requests.length}건 · {requests.length} requests
                  </Badge>
                </div>
                {requests.length > 0 ? (
                  <Table columns={requestColumns} data={requests} />
                ) : (
                  <div className="py-12 text-center">
                    <CheckCircle className="mx-auto mb-2 h-12 w-12 text-emerald-500" />
                    <p className="text-body-sm text-[#6b7280]">
                      처리 대기 중인 요청이 없습니다. · No pending requests.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <Table
                  columns={columns}
                  data={paginated}
                  onRowClick={handleOpenHistory}
                  className="border-0 bg-transparent"
                />
                {filtered.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3 border-t border-[#efe9df] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-caption text-[#8a847a]">
                      {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, filtered.length)} 표시 ·
                      Showing {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, filtered.length)} of{' '}
                      {filtered.length.toLocaleString()} entries
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="이전 페이지"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - page) <= 1,
                        )
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === '…' ? (
                            <span
                              key={`e-${idx}`}
                              className="px-1 text-caption text-[#b4aea4]"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              type="button"
                              key={p}
                              onClick={() => setPage(p)}
                              className={`flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                                p === page
                                  ? 'bg-[#2d2d2d] text-white shadow-sm'
                                  : 'text-[#5c5852] hover:bg-[#f5f3ef]'
                              }`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                        aria-label="다음 페이지"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end sm:hidden">
          <Button icon={Plus} size="sm" onClick={() => setShowAddModal(true)}>
            장비 등록 · Add
          </Button>
        </div>

        {/* 장비 등록 모달 */}
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="장비 등록 · Register equipment"
          persistent
        >
          <div className="space-y-4">
            <Input
              label="장비명 · Equipment name"
              placeholder="장비명을 입력하세요"
              value={addForm.name}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Input
              label="시리얼 번호 · Serial number"
              placeholder="시리얼 번호를 입력하세요"
              value={addForm.serial_no}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, serial_no: e.target.value }))
              }
            />
            <Select
              label="분류 · Category"
              options={[
                { value: '노트북', label: '노트북 · Laptop' },
                { value: '모니터', label: '모니터 · Monitor' },
                { value: '태블릿', label: '태블릿 · Tablet' },
                { value: '주변기기', label: '주변기기 · Peripheral' },
              ]}
              value={addForm.category}
              onChange={(e) =>
                setAddForm((p) => ({ ...p, category: e.target.value }))
              }
            />
            {/* 사진 업로드 */}
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-1.5">
                사진 (선택) · Photo (optional)
              </label>
              <div className="flex items-center gap-3">
                {addImagePreview ? (
                  <div className="relative">
                    <img
                      src={addImagePreview}
                      alt="preview"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setAddImagePreview(null);
                        setAddImageFile(null);
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#2d2d2d] hover:bg-[#faf9f6] transition-colors">
                    <ImagePlus size={20} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">사진 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddImageChange}
                    />
                  </label>
                )}
                <p className="text-caption text-gray-400">
                  JPG, PNG, WebP 지원
                  <br />
                  권장 크기: 200×200px
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                취소 · Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const created = await adminApi.createEquipment({
                      name: addForm.name,
                      serial_no: addForm.serial_no,
                      category: addForm.category,
                    });
                    let finalEquip = created;
                    if (addImageFile) {
                      const fd = new FormData();
                      fd.append('file', addImageFile);
                      const imgRes = await adminApi.uploadEquipmentImage(
                        created.id,
                        fd,
                      );
                      finalEquip = { ...created, image_url: imgRes.image_url };
                    }
                    setEquipment((prev) => [...prev, finalEquip]);
                    setAddForm({ name: '', serial_no: '', category: '노트북' });
                    setAddImageFile(null);
                    setAddImagePreview(null);
                    setShowAddModal(false);
                    showToast({
                      type: 'success',
                      message: '장비가 등록되었습니다.',
                    });
                  } catch (err) {
                    const msg =
                      err?.response?.data?.detail || '등록에 실패했습니다.';
                    showToast({ message: msg, type: 'error' });
                  }
                }}
              >
                등록 · Register
              </Button>
            </div>
          </div>
        </Modal>

        {/* 반려 모달 */}
        <Modal
          isOpen={!!rejectModal}
          onClose={() => setRejectModal(null)}
          title="대여 반려 · Reject request"
        >
          <div className="space-y-4">
            <p className="text-body-sm text-gray-700">
              <span className="font-medium">{rejectModal?.student_name}</span>의{' '}
              <span className="font-medium">{rejectModal?.equipment_name}</span>{' '}
              대여 요청을 반려합니다. · You are rejecting this borrow request.
            </p>
            <Textarea
              label="반려 사유 · Reason"
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRejectModal(null)}>
                취소 · Cancel
              </Button>
              <Button variant="danger" onClick={handleReject}>
                반려 · Reject
              </Button>
            </div>
          </div>
        </Modal>

        {/* 장비 편집 모달 */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditTarget(null);
          }}
          title="장비 편집 · Edit equipment"
          persistent
        >
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-gray-700 mb-1.5">
                사진 · Photo
              </label>
              <div className="flex items-center gap-3">
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview}
                      alt="preview"
                      className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setEditImagePreview(null);
                        setEditImageFile(null);
                        setEditForm((p) => ({ ...p, image_url: '' }));
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#2d2d2d] hover:bg-[#faf9f6] transition-colors">
                    <ImagePlus size={20} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400">사진 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditImageChange}
                    />
                  </label>
                )}
                <p className="text-caption text-gray-400">
                  JPG, PNG, WebP 지원
                  <br />
                  권장 크기: 200×200px
                </p>
              </div>
            </div>
            <Input
              label="장비명 · Equipment name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name: e.target.value }))
              }
            />
            <Input
              label="시리얼 번호 · Serial number"
              value={editForm.serial_no}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, serial_no: e.target.value }))
              }
            />
            <Select
              label="분류 · Category"
              options={[
                { value: '노트북', label: '노트북 · Laptop' },
                { value: '모니터', label: '모니터 · Monitor' },
                { value: '태블릿', label: '태블릿 · Tablet' },
                { value: '주변기기', label: '주변기기 · Peripheral' },
              ]}
              value={editForm.category}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, category: e.target.value }))
              }
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setEditTarget(null);
                }}
              >
                취소 · Cancel
              </Button>
              <Button onClick={handleEditSubmit}>저장 · Save</Button>
            </div>
          </div>
        </Modal>

        {/* 장비 삭제 확인 모달 */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          title="장비 삭제 · Delete equipment"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-[#fdf2f2] rounded-xl border border-[#f0d4d4]">
              <Trash2 size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-body-sm font-medium text-red-700">
                  정말 삭제하시겠습니까?
                </p>
                <p className="text-caption text-red-500 mt-0.5">
                  <span className="font-semibold">{deleteTarget?.name}</span>{' '}
                  장비가 영구적으로 삭제됩니다.
                </p>
              </div>
            </div>
            {deleteTarget?.status === 'borrowed' && (
              <p className="text-caption text-orange-600 bg-orange-50 p-2 rounded-lg">
                ⚠️ 대여 중인 장비는 삭제할 수 없습니다.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                취소 · Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deleteTarget?.status === 'borrowed'}
              >
                삭제 · Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* 장비 이력 Drawer */}
        <Drawer
          isOpen={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          title={
            selectedEquipment?.name ? (
              <span>
                {selectedEquipment.name}{' '}
                <span className="text-caption font-normal text-[#9ca3af]">
                  · History
                </span>
              </span>
            ) : (
              '장비 이력 · Equipment history'
            )
          }
        >
          {selectedEquipment && (
            <div>
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">시리얼 · Serial</span>
                  <span className="font-mono text-gray-900">
                    {selectedEquipment.serial_no}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">분류 · Category</span>
                  <span className="text-gray-900">
                    {selectedEquipment.category}
                  </span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">상태 · Status</span>
                  <Badge variant={statusVariant[selectedEquipment.status]}>
                    {statusLabel[selectedEquipment.status]} ·{' '}
                    {statusLabelEn[selectedEquipment.status]}
                  </Badge>
                </div>
                {selectedEquipment.borrower && (
                  <div className="flex justify-between text-body-sm">
                    <span className="text-gray-500">사용자 · User</span>
                    <span className="text-gray-900">
                      {selectedEquipment.borrower}
                    </span>
                  </div>
                )}
              </div>

              <h3 className="mb-3 text-body font-semibold text-gray-900">
                사용 이력 · Usage log
              </h3>
              <div className="space-y-3">
                {equipHistory.length === 0 ? (
                  <p className="text-body-sm text-gray-400">
                    이력이 없습니다. · No history.
                  </p>
                ) : (
                  equipHistory.map((session, i) => {
                    const cfg =
                      ACTION_CONFIG[session.action] ||
                      ACTION_CONFIG.status_change;
                    const duration =
                      session.action === 'borrow'
                        ? calcDuration(session.borrow_at, session.return_at)
                        : null;
                    return (
                      <div
                        key={i}
                        className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`text-body-sm font-semibold ${cfg.color}`}
                          >
                            {session.user_name || '알 수 없음'}
                          </span>
                          {session.action === 'borrow' &&
                            (session.is_active ? (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-caption font-medium text-blue-600">
                                대여중 · Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-caption font-medium text-green-600">
                                반납 완료 · Returned
                              </span>
                            ))}
                          {session.action !== 'borrow' && (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-caption font-medium text-orange-500">
                              {cfg.label}
                            </span>
                          )}
                        </div>

                        {session.action === 'borrow' && (
                          <div className="space-y-1 text-caption text-gray-600">
                            <div className="flex items-center gap-2">
                              <ArrowDownCircle className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                              <span className="w-10 shrink-0 text-gray-400">
                                대여 · Out
                              </span>
                              <span className="font-medium text-gray-700">
                                {formatDT(session.borrow_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 text-green-400" />
                              <span className="w-10 shrink-0 text-gray-400">
                                반납 · In
                              </span>
                              <span
                                className={`font-medium ${session.return_at ? 'text-gray-700' : 'text-blue-500'}`}
                              >
                                {session.return_at
                                  ? formatDT(session.return_at)
                                  : '반납 전 · Not returned'}
                              </span>
                            </div>
                            {duration && (
                              <div className="mt-1 flex items-center gap-2 border-t border-gray-200 pt-0.5">
                                <span className="ml-5 text-gray-400">
                                  사용 시간 · Duration
                                </span>
                                <span className="font-medium text-gray-700">
                                  {duration}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {session.action !== 'borrow' && (
                          <div className="flex items-center gap-2 text-caption text-gray-600">
                            <span className="text-gray-400">일시 · Time</span>
                            <span className="font-medium text-gray-700">
                              {formatDT(session.borrow_at)}
                            </span>
                          </div>
                        )}

                        {session.note && (
                          <p className="mt-1.5 border-l-2 border-gray-300 pl-1 text-caption text-gray-500">
                            {session.note}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </div>
  );
}
