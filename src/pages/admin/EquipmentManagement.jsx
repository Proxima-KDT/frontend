import { useState, useEffect } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
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

export default function EquipmentManagement() {
  const { showToast } = useToast();
  const [equipment, setEquipment] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    serial: '',
    category: 'laptop',
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
    { key: 'serial', label: '시리얼' },
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
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEquipment(row);
          }}
        >
          이력
        </Button>
      ),
    },
  ];

  const mockHistory = [
    { date: '2026-04-01', action: '대여', user: '김민준', note: '' },
    { date: '2026-03-20', action: '반납', user: '이서윤', note: '' },
    { date: '2026-03-01', action: '대여', user: '이서윤', note: '' },
    {
      date: '2026-02-15',
      action: '수리 완료',
      user: '관리자',
      note: '배터리 교체',
    },
    {
      date: '2026-02-10',
      action: '수리 접수',
      user: '관리자',
      note: '배터리 팽창',
    },
    {
      date: '2026-01-05',
      action: '등록',
      user: '관리자',
      note: '신규 장비 등록',
    },
  ];

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
            value={addForm.serial}
            onChange={(e) =>
              setAddForm((p) => ({ ...p, serial: e.target.value }))
            }
          />
          <Select
            label="분류"
            options={[
              { value: 'laptop', label: '노트북' },
              { value: 'monitor', label: '모니터' },
              { value: 'tablet', label: '태블릿' },
              { value: 'peripheral', label: '주변기기' },
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
                    setAddForm({ name: '', serial: '', category: 'laptop' });
                    setShowAddModal(false);
                    showToast({
                      type: 'success',
                      message: '장비가 등록되었습니다.',
                    });
                  })
                  .catch(() =>
                    showToast({
                      message: '등록에 실패했습니다.',
                      type: 'error',
                    }),
                  );
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
                  {selectedEquipment.serial}
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
            <div className="space-y-4">
              {equipHistory.length === 0 ? (
                <p className="text-body-sm text-gray-400">이력이 없습니다.</p>
              ) : (
                equipHistory.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-admin-500 mt-1.5" />
                      {i < equipHistory.length - 1 && (
                        <div className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-body-sm font-medium text-gray-900">
                        {h.action}
                      </p>
                      <p className="text-caption text-gray-500">
                        {h.user} · {h.date}
                      </p>
                      {h.note && (
                        <p className="text-caption text-gray-400 mt-0.5">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
