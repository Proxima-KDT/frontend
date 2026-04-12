import { useState, useEffect } from 'react';
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
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addImageFile, setAddImageFile] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [equipHistory, setEquipHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 편집 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', serial_no: '', category: '노트북', image_url: '' });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);

  // 삭제 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
      // 1) 새 파일이 있으면 먼저 업로드
      if (editImageFile) {
        const fd = new FormData();
        fd.append('file', editImageFile);
        const res = await adminApi.uploadEquipmentImage(editTarget.id, fd);
        updatedImageUrl = res.image_url;
      }
      // 2) 장비 정보 업데이트
      const updated = await adminApi.updateEquipment(editTarget.id, {
        name: editForm.name,
        serial_no: editForm.serial_no,
        category: editForm.category,
        image_url: updatedImageUrl || undefined,
      });
      setEquipment((prev) => prev.map((e) => (e.id === editTarget.id ? { ...e, ...updated } : e)));
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

  // 이미지 파일 선택 핸들러 (편집용)
  const handleEditImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // 이미지 파일 선택 핸들러 (등록용)
  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAddImagePreview(ev.target.result);
    reader.readAsDataURL(file);
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
      key: 'image_url',
      label: '',
      render: (val, row) => {
        if (val) {
          return <img src={val} alt={row.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />;
        }
        const iconMap = { '노트북': '💻', '모니터': '🖥️', '태블릿': '📱', '주변기기': '🖱️' };
        return (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">
            {iconMap[row.category] || '📦'}
          </div>
        );
      },
    },
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
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenHistory(row)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="이력"
          >
            <History size={15} />
          </button>
          <button
            onClick={() => row.status !== 'borrowed' && handleOpenEdit(row)}
            disabled={row.status === 'borrowed'}
            className={`p-1.5 rounded-lg transition-colors ${
              row.status === 'borrowed'
                ? 'text-gray-200 cursor-not-allowed'
                : 'hover:bg-blue-50 text-gray-400 hover:text-blue-600'
            }`}
            title={row.status === 'borrowed' ? '대여 중인 장비는 편집할 수 없습니다' : '편집'}
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => { setDeleteTarget(row); setShowDeleteModal(true); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="삭제"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-3xl border border-[#ebe4d8]/80 bg-[#fdfbf7] px-4 py-6 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset] sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-h1 font-bold text-[#121926]">장비 관리</h1>
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
            <h2 className="text-h3 font-semibold text-[#121926]">승인 대기</h2>
            <Badge variant="warning">{requests.length}건</Badge>
          </div>
          {requests.length > 0 ? (
            <Table columns={requestColumns} data={requests} />
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-body-sm text-[#6b7280]">
                처리 대기 중인 요청이 없습니다
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card padding="p-0">
          <Table columns={columns} data={filtered} />
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
          {/* 사진 업로드 */}
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">사진 (선택)</label>
            <div className="flex items-center gap-3">
              {addImagePreview ? (
                <div className="relative">
                  <img src={addImagePreview} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                  <button
                    onClick={() => { setAddImagePreview(null); setAddImageFile(null); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-admin-400 hover:bg-admin-50 transition-colors">
                  <ImagePlus size={20} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">사진 추가</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAddImageChange} />
                </label>
              )}
              <p className="text-caption text-gray-400">JPG, PNG, WebP 지원<br/>권장 크기: 200×200px</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              취소
            </Button>
            <Button
              onClick={async () => {
                try {
                  const created = await adminApi.createEquipment({ name: addForm.name, serial_no: addForm.serial_no, category: addForm.category });
                  let finalEquip = created;
                  if (addImageFile) {
                    const fd = new FormData();
                    fd.append('file', addImageFile);
                    const imgRes = await adminApi.uploadEquipmentImage(created.id, fd);
                    finalEquip = { ...created, image_url: imgRes.image_url };
                  }
                  setEquipment((prev) => [...prev, finalEquip]);
                  setAddForm({ name: '', serial_no: '', category: '노트북' });
                  setAddImageFile(null);
                  setAddImagePreview(null);
                  setShowAddModal(false);
                  showToast({ type: 'success', message: '장비가 등록되었습니다.' });
                } catch (err) {
                  const msg = err?.response?.data?.detail || '등록에 실패했습니다.';
                  showToast({ message: msg, type: 'error' });
                }
              }}
            >
              등록
            </Button>
          </div>
        </div>
      </Modal>

      {/* 장비 편집 모달 */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditTarget(null); }}
        title="장비 편집"
        persistent
      >
        <div className="space-y-4">
          {/* 사진 업로드 */}
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-1.5">사진</label>
            <div className="flex items-center gap-3">
              {editImagePreview ? (
                <div className="relative">
                  <img src={editImagePreview} alt="preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                  <button
                    onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditForm((p) => ({ ...p, image_url: '' })); }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-admin-400 hover:bg-admin-50 transition-colors">
                  <ImagePlus size={20} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">사진 추가</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditImageChange} />
                </label>
              )}
              <p className="text-caption text-gray-400">JPG, PNG, WebP 지원<br/>권장 크기: 200×200px</p>
            </div>
          </div>
          <Input
            label="장비명"
            value={editForm.name}
            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="시리얼 번호"
            value={editForm.serial_no}
            onChange={(e) => setEditForm((p) => ({ ...p, serial_no: e.target.value }))}
          />
          <Select
            label="분류"
            options={[
              { value: '노트북', label: '노트북' },
              { value: '모니터', label: '모니터' },
              { value: '태블릿', label: '태블릿' },
              { value: '주변기기', label: '주변기기' },
            ]}
            value={editForm.category}
            onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditTarget(null); }}>
              취소
            </Button>
            <Button onClick={handleEditSubmit}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* 장비 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
        title="장비 삭제"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-[#fdf2f2] rounded-xl border border-[#f0d4d4]">
            <Trash2 size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-body-sm font-medium text-red-700">정말 삭제하시겠습니까?</p>
              <p className="text-caption text-red-500 mt-0.5">
                <span className="font-semibold">{deleteTarget?.name}</span> 장비가 영구적으로 삭제됩니다.
              </p>
            </div>
          </div>
          {deleteTarget?.status === 'borrowed' && (
            <p className="text-caption text-orange-600 bg-orange-50 p-2 rounded-lg">
              ⚠️ 대여 중인 장비는 삭제할 수 없습니다.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleteTarget?.status === 'borrowed'}
            >
              삭제
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

            <h3 className="text-body font-semibold text-[#121926] mb-3">
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
