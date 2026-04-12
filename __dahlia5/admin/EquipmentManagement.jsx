import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wrench,
  History,
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
  available: '???媛??,
  borrowed: '??ъ쨷',
  maintenance: '?섎━以?,
  retired: '?먭린',
};

const statusLabelEn = {
  available: 'Available',
  borrowed: 'In use',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

const ACTION_CONFIG = {
  borrow: {
    label: '???,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    Icon: ArrowDownCircle,
  },
  maintenance: {
    label: '?섎━',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    Icon: Wrench,
  },
  status_change: {
    label: '?곹깭 蹂寃?,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    Icon: null,
  },
};

const FILTER_TABS = [
  { key: 'all', labelKo: '?꾩껜', labelEn: 'All' },
  { key: 'available', labelKo: '???媛??, labelEn: 'Available' },
  { key: 'borrowed', labelKo: '??ъ쨷', labelEn: 'In use' },
  { key: 'maintenance', labelKo: '?섎━以?, labelEn: 'Maintenance' },
  { key: 'retired', labelKo: '?먭린', labelEn: 'Retired' },
  { key: 'pending', labelKo: '?뱀씤 ?湲?, labelEn: 'Pending' },
];

/** 遺꾨쪟蹂?湲곕낯 ?몃꽕??(API??image_url ?놁쓣 ?? */
const CATEGORY_THUMB = {
  ?명듃遺?
    'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
  紐⑤땲??
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80',
  ?쒕툝由?
    'https://images.unsplash.com/photo-1587033411391-5d9e51cce126?auto=format&fit=crop&w=400&q=80',
  二쇰?湲곌린:
    'https://images.unsplash.com/photo-1613141412501-9012977f1969?auto=format&fit=crop&w=400&q=80',
};

const equipmentThumbs = [
  { key: 'macbook', src: CATEGORY_THUMB.?명듃遺?},
  { key: '留λ턿', src: CATEGORY_THUMB.?명듃遺?},
  { key: 'monitor', src: CATEGORY_THUMB.紐⑤땲??},
  { key: '紐⑤땲??, src: CATEGORY_THUMB.紐⑤땲??},
  { key: 'ipad', src: CATEGORY_THUMB.?쒕툝由?},
  { key: 'tablet', src: CATEGORY_THUMB.?쒕툝由?},
  { key: 'mouse', src: CATEGORY_THUMB.二쇰?湲곌린 },
  { key: '留덉슦??, src: CATEGORY_THUMB.二쇰?湲곌린 },
  {
    key: '?ㅻ낫??,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Computer_keyboard.svg/640px-Computer_keyboard.svg.png',
  },
  {
    key: 'wacom',
    src: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=400&q=80',
  },
];

const categoryPillClass = {
  ?명듃遺? 'bg-[#e8f1fa] text-[#3d5a7a]',
  紐⑤땲?? 'bg-[#e4f0ee] text-[#2d5c55]',
  ?쒕툝由? 'bg-[#e8eef5] text-[#4a6282]',
  二쇰?湲곌린: 'bg-[#f5f0e4] text-[#7a6120]',
};

function getEquipmentThumb(item) {
  if (!item) return CATEGORY_THUMB.?명듃遺?
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
  if (!d) return '??;
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
  if (mins < 1) return '1遺?誘몃쭔';
  if (mins < 60) return `${mins}遺?;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}?쒓컙 ${m}遺? : `${h}?쒓컙`;
}

function exportEquipmentCsv(rows) {
  const headers = [
    'name',
    'serial_no',
    'category',
    'status_ko',
    'borrower',
  ];
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
      <span className="block text-[0.72rem] font-semibold text-[#5c5e66]">{ko}</span>
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
    category: '?명듃遺?,
  });
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipHistory, setEquipHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const openAdd = () => setShowAddModal(true);
    window.addEventListener('admin-equipment-open-add', openAdd);
    return () => window.removeEventListener('admin-equipment-open-add', openAdd);
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
        showToast({ type: 'success', message: '??ш? ?뱀씤?섏뿀?듬땲??' });
      })
      .catch(() =>
        showToast({ message: '?뱀씤???ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
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
          showToast({ type: 'info', message: '??ш? 諛섎젮?섏뿀?듬땲??' });
        })
        .catch(() =>
          showToast({ message: '諛섎젮???ㅽ뙣?덉뒿?덈떎.', type: 'error' }),
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
      label: <ThBilingual en="Student" ko="?숈깮" />,
      render: (val) => <span className="font-medium text-gray-900">{val}</span>,
    },
    {
      key: 'equipment_name',
      label: <ThBilingual en="Equipment" ko="?λ퉬" />,
    },
    {
      key: 'request_date',
      label: <ThBilingual en="Requested" ko="?좎껌?? />,
    },
    {
      key: 'reason',
      label: <ThBilingual en="Reason" ko="?ъ쑀" />,
      render: (val) => (
        <span className="text-gray-500 max-w-[200px] truncate block">
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: <ThBilingual en="Actions" ko="泥섎━" />,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApprove(row.id)}
          >
            ?뱀씤 쨌 Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRejectModal(row)}
          >
            諛섎젮 쨌 Reject
          </Button>
        </div>
      ),
    },
  ];

  const columns = [
    {
      key: 'name',
      label: <ThBilingual en="Equipment name" ko="?λ퉬紐? />,
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
            <span
              className={`min-w-0 truncate font-semibold text-[#1a1c21]`}
            >
              {val}
            </span>
          </div>
        );
      },
    },
    {
      key: 'serial_no',
      label: <ThBilingual en="Serial number" ko="?쒕━?? />,
      render: (val) => (
        <span className="font-mono text-[0.8rem] text-[#4b5563]">{val}</span>
      ),
    },
    {
      key: 'category',
      label: <ThBilingual en="Category" ko="遺꾨쪟" />,
      render: (val) => (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wide ${
            categoryPillClass[val] || 'bg-[#f0f1f4] text-[#5c5f6a]'
          }`}
        >
          {(val || '??).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: <ThBilingual en="Status" ko="?곹깭" />,
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
              {statusLabel[val]} 쨌 {statusLabelEn[val]}
            </span>
          </div>
        );
      },
    },
    {
      key: 'borrower',
      label: <ThBilingual en="Primary user" ko="?ъ슜?? />,
      render: (val) => val || <span className="text-gray-400">??쨌 Internal</span>,
    },
    {
      key: 'actions',
      label: <ThBilingual en="Actions" ko="?묒뾽" />,
      width: '72px',
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenHistory(row);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:border-[#d1d5db] hover:bg-[#f9fafb]"
          title="?대젰 쨌 History"
        >
          <History className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const kpiCards = [
    {
      key: 'total',
      value: counts.all,
      labelKo: '?꾩껜 ?λ퉬',
      labelEn: 'Total equipment',
      icon: Package,
      iconBg: 'bg-[#eef0f3]',
      iconColor: 'text-[#5c6470]',
    },
    {
      key: 'avail',
      value: counts.available,
      labelKo: '???媛??,
      labelEn: 'Available',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      key: 'use',
      value: counts.borrowed,
      labelKo: '??ъ쨷',
      labelEn: 'In use',
      icon: Activity,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      key: 'maint',
      value: counts.maintenance,
      labelKo: '?섎━以?,
      labelEn: 'Maintenance',
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ];

  return (
    <div className="rounded-3xl border border-[#ebe4d8]/80 bg-[#fdfbf7] px-4 py-6 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="min-h-0 text-[#1a1c21]">
      {/* ?곷떒 ?대컮 (寃??쨌 ?뚮┝ ?곸뿭) */}
      <div className="mb-4">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="?λ퉬 寃??쨌 Search equipment??
            className="w-full rounded-full border border-[#e5e7eb] bg-white py-2.5 pl-10 pr-4 text-sm text-[#374151] shadow-sm outline-none transition focus:border-[#2d2d2d] focus:ring-1 focus:ring-[#2d2d2d]"
          />
        </div>
      </div>

      {/* ?덉뼱濡?*/}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className={`text-[1.75rem] font-bold tracking-tight text-[#121926] sm:text-[2rem]`}
          >
            ??ъ슜 ?λ퉬 ?꾪솴
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2 text-caption text-[#6b7280] shadow-sm">
          <Globe className="h-4 w-4 text-[#9ca3af]" />
          <span>
            ?뱀씤 ?湲?' '}
            <span className="font-semibold text-[#121926]">{requests.length}</span>嫄?쨌 Pending{' '}
            <span className="font-semibold text-[#121926]">{requests.length}</span>
          </span>
        </div>
      </div>

      {/* KPI 移대뱶 */}
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
              <p className="mt-1 text-sm font-medium text-[#374151]">{k.labelKo}</p>
              <p className="text-caption text-[#9ca3af]">{k.labelEn}</p>
            </div>
          );
        })}
      </div>

      {/* ?꾪꽣 + ??*/}
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
                    {tab.labelEn} 쨌 {count}
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
                message: '怨좉툒 ?꾪꽣??以鍮?以묒엯?덈떎. 쨌 Advanced filters coming soon.',
              })
            }
            className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#faf9f6] px-4 py-2 text-[0.8rem] font-medium text-[#4b5563] transition hover:bg-[#f3f1ec]"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#9ca3af]" />
            怨좉툒 ?꾪꽣 쨌 Advanced
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
                    '蹂대궡湲곕뒗 ?λ퉬 紐⑸줉 ??뿉?쒕쭔 ?ъ슜?????덉뒿?덈떎. 쨌 Export is only available on equipment tabs.',
                });
                return;
              }
              exportEquipmentCsv(filtered);
              showToast({
                type: 'success',
                message: 'CSV ?뚯씪濡???ν뻽?듬땲?? 쨌 Exported to CSV.',
              });
            }}
          >
            蹂대궡湲?쨌 Export
          </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {filter === 'pending' ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#121926]">
                  ?뱀씤 ?湲?쨌 Pending approval
                </h2>
                <Badge variant="warning">
                  {requests.length}嫄?쨌 {requests.length} requests
                </Badge>
              </div>
              {requests.length > 0 ? (
                <Table columns={requestColumns} data={requests} />
              ) : (
                <div className="py-12 text-center">
                  <CheckCircle className="mx-auto mb-2 h-12 w-12 text-emerald-500" />
                  <p className="text-body-sm text-[#6b7280]">
                    泥섎━ ?湲?以묒씤 ?붿껌???놁뒿?덈떎. 쨌 No pending requests.
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
                    {(page - 1) * pageSize + 1}??                    {Math.min(page * pageSize, filtered.length)} ?쒖떆 쨌 Showing{' '}
                    {(page - 1) * pageSize + 1}??Math.min(page * pageSize, filtered.length)} of{' '}
                    {filtered.length.toLocaleString()} entries
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="?댁쟾 ?섏씠吏"
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
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push('??);
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === '?? ? (
                          <span
                            key={`e-${idx}`}
                            className="px-1 text-caption text-[#b4aea4]"
                          >
                            ??                          </span>
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
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] transition hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="?ㅼ쓬 ?섏씠吏"
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
          ?λ퉬 ?깅줉 쨌 Add
        </Button>
      </div>

      {/* ?λ퉬 ?깅줉 紐⑤떖 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="?λ퉬 ?깅줉 쨌 Register equipment"
        persistent
      >
        <div className="space-y-4">
          <Input
            label="?λ퉬紐?쨌 Equipment name"
            placeholder="?λ퉬紐낆쓣 ?낅젰?섏꽭??
            value={addForm.name}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="?쒕━??踰덊샇 쨌 Serial number"
            placeholder="?쒕━??踰덊샇瑜??낅젰?섏꽭??
            value={addForm.serial_no}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, serial_no: e.target.value }))
            }
          />
          <Select
            label="遺꾨쪟 쨌 Category"
            options={[
              { value: '?명듃遺?, label: '?명듃遺?쨌 Laptop' },
              { value: '紐⑤땲??, label: '紐⑤땲??쨌 Monitor' },
              { value: '?쒕툝由?, label: '?쒕툝由?쨌 Tablet' },
              { value: '二쇰?湲곌린', label: '二쇰?湲곌린 쨌 Peripheral' },
            ]}
            value={addForm.category}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, category: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              痍⑥냼 쨌 Cancel
            </Button>
            <Button
              onClick={() => {
                adminApi
                  .createEquipment(addForm)
                  .then((created) => {
                    setEquipment((prev) => [...prev, created]);
                    setAddForm({ name: '', serial_no: '', category: '?명듃遺? });
                    setShowAddModal(false);
                    showToast({
                      type: 'success',
                      message: '?λ퉬媛 ?깅줉?섏뿀?듬땲??',
                    });
                  })
                  .catch((err) => {
                    const msg =
                      err?.response?.data?.detail || '?깅줉???ㅽ뙣?덉뒿?덈떎.';
                    showToast({ message: msg, type: 'error' });
                  });
              }}
            >
              ?깅줉 쨌 Register
            </Button>
          </div>
        </div>
      </Modal>

      {/* 諛섎젮 紐⑤떖 */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="???諛섎젮 쨌 Reject request"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-700">
            <span className="font-medium">{rejectModal?.student_name}</span>??' '}
            <span className="font-medium">{rejectModal?.equipment_name}</span>{' '}
            ????붿껌??諛섎젮?⑸땲?? 쨌 You are rejecting this borrow request.
          </p>
          <Textarea
            label="諛섎젮 ?ъ쑀 쨌 Reason"
            placeholder="諛섎젮 ?ъ쑀瑜??낅젰?섏꽭??
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>
              痍⑥냼 쨌 Cancel
            </Button>
            <Button variant="danger" onClick={handleReject}>
              諛섎젮 쨌 Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* ?λ퉬 ?대젰 Drawer */}
      <Drawer
        isOpen={!!selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
        title={
          selectedEquipment?.name ? (
            <span>
              {selectedEquipment.name}{' '}
              <span className="text-caption font-normal text-[#9ca3af]">
                쨌 History
              </span>
            </span>
          ) : (
            '?λ퉬 ?대젰 쨌 Equipment history'
          )
        }
      >
        {selectedEquipment && (
          <div>
            <div className="mb-6 space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">?쒕━??쨌 Serial</span>
                <span className="font-mono text-gray-900">
                  {selectedEquipment.serial_no}
                </span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">遺꾨쪟 쨌 Category</span>
                <span className="text-gray-900">
                  {selectedEquipment.category}
                </span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">?곹깭 쨌 Status</span>
                <Badge variant={statusVariant[selectedEquipment.status]}>
                  {statusLabel[selectedEquipment.status]} 쨌{' '}
                  {statusLabelEn[selectedEquipment.status]}
                </Badge>
              </div>
              {selectedEquipment.borrower && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-gray-500">?ъ슜??쨌 User</span>
                  <span className="text-gray-900">
                    {selectedEquipment.borrower}
                  </span>
                </div>
              )}
            </div>

            <h3 className="mb-3 text-body font-semibold text-gray-900">
              ?ъ슜 ?대젰 쨌 Usage log
            </h3>
            <div className="space-y-3">
              {equipHistory.length === 0 ? (
                <p className="text-body-sm text-gray-400">
                  ?대젰???놁뒿?덈떎. 쨌 No history.
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
                          {session.user_name || '?????놁쓬'}
                        </span>
                        {session.action === 'borrow' &&
                          (session.is_active ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-caption font-medium text-blue-600">
                              ??ъ쨷 쨌 Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-caption font-medium text-green-600">
                              諛섎궔 ?꾨즺 쨌 Returned
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
                              ???쨌 Out
                            </span>
                            <span className="font-medium text-gray-700">
                              {formatDT(session.borrow_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 text-green-400" />
                            <span className="w-10 shrink-0 text-gray-400">
                              諛섎궔 쨌 In
                            </span>
                            <span
                              className={`font-medium ${session.return_at ? 'text-gray-700' : 'text-blue-500'}`}
                            >
                              {session.return_at
                                ? formatDT(session.return_at)
                                : '諛섎궔 ??쨌 Not returned'}
                            </span>
                          </div>
                          {duration && (
                            <div className="mt-1 flex items-center gap-2 border-t border-gray-200 pt-0.5">
                              <span className="ml-5 text-gray-400">
                                ?ъ슜 ?쒓컙 쨌 Duration
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
                          <span className="text-gray-400">?쇱떆 쨌 Time</span>
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
