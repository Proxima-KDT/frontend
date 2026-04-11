import { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Wrench,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tabs from '@/components/common/Tabs';
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

// Supabase created_at는 "2026-04-10 01:45:39.588932+00" 형식 — 정식 ISO 8601이 아니라
// new Date()가 Invalid Date를 반환하므로 T와 +00:00으로 정규화
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

export default function EquipmentManagement() {
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState('all');
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

  const requestColumns = [
    {
      key: 'student_name',
      label: '학생',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>,
    },
    { key: 'equipment_name', label: '장비' },
    { key: 'request_date', label: '신청일' },
    {
      key: 'reason',
      label: '사유',
      render: (val) => (
        <span className="text-gray-500 max-w-[200px] truncate block">
          {val}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '처리',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleApprove(row.id)}
          >
            승인
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setRejectModal(row)}
          >
            반려
          </Button>
        </div>
      ),
    },
  ];

  const filtered =
    filter === 'all' ? equipment : equipment.filter((e) => e.status === filter);

  const counts = {
    all: equipment.length,
    available: equipment.filter((e) => e.status === 'available').length,
    borrowed: equipment.filter((e) => e.status === 'borrowed').length,
    maintenance: equipment.filter((e) => e.status === 'maintenance').length,
    retired: equipment.filter((e) => e.status === 'retired').length,
  };

  const columns = [
    {
      key: 'name',
      label: '장비명',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>,
    },
    { key: 'serial_no', label: '시리얼' },
    {
      key: 'category',
      label: '분류',
      render: (val) => <Badge variant="default">{val}</Badge>,
    },
    {
      key: 'status',
      label: '상태',
      render: (val) => (
        <Badge variant={statusVariant[val]}>{statusLabel[val]}</Badge>
      ),
    },
    {
      key: 'borrower',
      label: '사용자',
      render: (val) => val || <span className="text-gray-400">-</span>,
    },
  ];

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
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
          { key: 'pending', label: '승인 대기', count: requests.length },
        ]}
        activeTab={filter}
        onChange={setFilter}
        className="mb-4"
      />

      {filter === 'pending' ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 font-semibold text-gray-900">승인 대기</h2>
            <Badge variant="warning">{requests.length}건</Badge>
          </div>
          {requests.length > 0 ? (
            <Table columns={requestColumns} data={requests} />
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-2" />
              <p className="text-body-sm text-gray-500">
                처리 대기 중인 요청이 없습니다
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="p-0">
          <Table
            columns={columns}
            data={filtered}
            onRowClick={handleOpenHistory}
          />
        </Card>
      )}

      {/* 장비 등록 모달 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="장비 등록"
        persistent
      >
        <div className="space-y-4">
          <Input
            label="장비명"
            placeholder="장비명을 입력하세요"
            value={addForm.name}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, name: e.target.value }))
            }
          />
          <Input
            label="시리얼 번호"
            placeholder="시리얼 번호를 입력하세요"
            value={addForm.serial_no}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, serial_no: e.target.value }))
            }
          />
          <Select
            label="분류"
            options={[
              { value: '노트북', label: '노트북' },
              { value: '모니터', label: '모니터' },
              { value: '태블릿', label: '태블릿' },
              { value: '주변기기', label: '주변기기' },
            ]}
            value={addForm.category}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, category: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button
              onClick={() => {
                adminApi
                  .createEquipment(addForm)
                  .then((created) => {
                    setEquipment((prev) => [...prev, created]);
                    setAddForm({ name: '', serial_no: '', category: '노트북' });
                    setShowAddModal(false);
                    showToast({
                      type: 'success',
                      message: '장비가 등록되었습니다.',
                    });
                  })
                  .catch((err) => {
                    const msg =
                      err?.response?.data?.detail || '등록에 실패했습니다.';
                    showToast({ message: msg, type: 'error' });
                  });
              }}
            >
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 반려 모달 */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="대여 반려"
      >
        <div className="space-y-4">
          <p className="text-body-sm text-gray-700">
            <span className="font-medium">{rejectModal?.student_name}</span>의{' '}
            <span className="font-medium">{rejectModal?.equipment_name}</span>{' '}
            대여 요청을 반려합니다.
          </p>
          <Textarea
            label="반려 사유"
            placeholder="반려 사유를 입력하세요"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleReject}>
              반려
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
                <span className="text-gray-900">
                  {selectedEquipment.serial_no}
                </span>
              </div>
              <div className="flex justify-between text-body-sm">
                <span className="text-gray-500">분류</span>
                <span className="text-gray-900">
                  {selectedEquipment.category}
                </span>
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
                  <span className="text-gray-900">
                    {selectedEquipment.borrower}
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-body font-semibold text-gray-900 mb-3">
              사용 이력
            </h3>
            <div className="space-y-3">
              {equipHistory.length === 0 ? (
                <p className="text-body-sm text-gray-400">이력이 없습니다.</p>
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
                      {/* 헤더: 이름 + 상태 뱃지 */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-body-sm font-semibold ${cfg.color}`}
                        >
                          {session.user_name || '알 수 없음'}
                        </span>
                        {session.action === 'borrow' &&
                          (session.is_active ? (
                            <span className="text-caption font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                              대여중
                            </span>
                          ) : (
                            <span className="text-caption font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              반납 완료
                            </span>
                          ))}
                        {session.action !== 'borrow' && (
                          <span className="text-caption font-medium text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                            {cfg.label}
                          </span>
                        )}
                      </div>

                      {/* 대여/반납 시간 */}
                      {session.action === 'borrow' && (
                        <div className="space-y-1 text-caption text-gray-600">
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="w-10 shrink-0 text-gray-400">
                              대여
                            </span>
                            <span className="font-medium text-gray-700">
                              {formatDT(session.borrow_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            <span className="w-10 shrink-0 text-gray-400">
                              반납
                            </span>
                            <span
                              className={`font-medium ${session.return_at ? 'text-gray-700' : 'text-blue-500'}`}
                            >
                              {session.return_at
                                ? formatDT(session.return_at)
                                : '반납 전'}
                            </span>
                          </div>
                          {duration && (
                            <div className="flex items-center gap-2 pt-0.5 border-t border-gray-200 mt-1">
                              <span className="text-gray-400 ml-5">
                                사용 시간
                              </span>
                              <span className="font-medium text-gray-700">
                                {duration}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 수리/기타 단일 이벤트 */}
                      {session.action !== 'borrow' && (
                        <div className="text-caption text-gray-600 flex items-center gap-2">
                          <span className="text-gray-400">일시</span>
                          <span className="font-medium text-gray-700">
                            {formatDT(session.borrow_at)}
                          </span>
                        </div>
                      )}

                      {session.note && (
                        <p className="text-caption text-gray-500 mt-1.5 pl-1 border-l-2 border-gray-300">
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
  );
}
