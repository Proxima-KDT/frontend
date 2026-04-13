import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle,
  Headphones,
  FileAudio,
  MessageSquare,
  Sparkles,
  User,
  Users,
  Play,
  ChevronDown,
  ChevronUp,
  NotebookPen,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '@/api/admin';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';

const steps = [
  { key: 'upload', label: '파일 업로드', icon: Upload },
  { key: 'separation', label: '음성 변환', icon: Headphones },
  { key: 'stt', label: 'STT 처리', icon: MessageSquare },
  { key: 'summary', label: 'AI 요약', icon: Sparkles },
];

export default function AdminCounseling() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  // 아코디언: recordId → 열림 여부
  const [openNotes, setOpenNotes] = useState({});
  // 메모 편집 중 텍스트: recordId → string
  const [noteTexts, setNoteTexts] = useState({});
  // 저장 중 상태: recordId → bool
  const [noteSaving, setNoteSaving] = useState({});
  const [recordPage, setRecordPage] = useState(1);
  const recordPageSize = 5;
  const fileInputRef = useRef(null);

  useEffect(() => {
    adminApi
      .getCounselingRecords()
      .then((data) => setRecords(data))
      .catch(() =>
        showToast({
          message: '면담 이력을 불러오지 못했습니다.',
          type: 'error',
        }),
      )
      .finally(() => setRecordsLoading(false));

    adminApi
      .getStudents()
      .then((data) => setStudents(data))
      .catch(() => {});
  }, []);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // 과정별 학생 그룹핑 (course_name 기준)
  const studentsByCourse = students.reduce((acc, s) => {
    const key = s.course_name || '과정 미배정';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const validateAndStart = (file) => {
    if (!file) return;
    if (!selectedStudentId) {
      showToast({ message: '먼저 학생을 선택해주세요.', type: 'error' });
      return;
    }
    const allowed = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/x-m4a',
      'audio/webm',
    ];
    const isAudio =
      allowed.includes(file.type) ||
      file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i);
    if (!isAudio) {
      showToast({
        message: 'MP3, WAV, M4A 형식의 오디오 파일만 업로드 가능합니다.',
        type: 'error',
      });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast({
        message: '파일 크기는 최대 100MB까지 업로드 가능합니다.',
        type: 'error',
      });
      return;
    }
    startUpload(file);
  };

  const handleFileChange = (e) => {
    validateAndStart(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedStudentId) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!selectedStudentId) {
      showToast({ message: '먼저 학생을 선택해주세요.', type: 'error' });
      return;
    }
    const file = e.dataTransfer.files?.[0];
    validateAndStart(file);
  };

  const startUpload = (file) => {
    setProcessing(true);
    setUploadResult(null);
    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= 2) clearInterval(interval);
    }, 1500);
    const formData = new FormData();
    formData.append('file', file);
    adminApi
      .uploadCounselingAudio(formData, selectedStudent.name)
      .then((result) => {
        clearInterval(interval);
        setCurrentStep(3);
        setUploadResult(result);
        setRecords((prev) => [result, ...prev]);
        setTimeout(() => {
          setProcessing(false);
          setShowResult(true);
        }, 500);
        showToast({ message: '면담 기록이 저장되었습니다.', type: 'success' });
      })
      .catch(() => {
        clearInterval(interval);
        setProcessing(false);
        setCurrentStep(-1);
        showToast({
          message: '업로드 중 오류가 발생했습니다. 다시 시도해주세요.',
          type: 'error',
        });
      });
  };

  const handleDropzoneClick = () => {
    if (!selectedStudentId) {
      showToast({ message: '먼저 학생을 선택해주세요.', type: 'error' });
      return;
    }
    fileInputRef.current?.click();
  };

  const toggleNote = (id, currentNote) => {
    setOpenNotes((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (next[id] && noteTexts[id] === undefined) {
        setNoteTexts((t) => ({ ...t, [id]: currentNote || '' }));
      }
      return next;
    });
  };

  const handleSaveNote = (id) => {
    setNoteSaving((prev) => ({ ...prev, [id]: true }));
    adminApi
      .updateCounselingNote(id, noteTexts[id] ?? '')
      .then(() => {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, note: noteTexts[id] } : r)),
        );
        showToast({ message: '메모가 저장되었습니다.', type: 'success' });
      })
      .catch(() =>
        showToast({ message: '메모 저장에 실패했습니다.', type: 'error' }),
      )
      .finally(() => setNoteSaving((prev) => ({ ...prev, [id]: false })));
  };

  const handleReset = () => {
    setShowResult(false);
    setCurrentStep(-1);
    setUploadResult(null);
    setSelectedStudentId('');
  };

  return (
    <div className="rounded-3xl bg-[#F9F8F6] px-4 py-6 sm:px-6 md:-mx-2 md:px-8 md:py-8">
      <h1 className="text-h1 font-bold text-gray-900 mb-6">면담 기록</h1>

      {/* 업로드 영역 */}
      <Card className="mb-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">
          음성 파일 업로드
        </h2>

        {!processing && !showResult && (
          <>
            {/* 학생 선택 */}
            <div className="mb-4">
              <label className="block text-body-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                면담 학생 선택 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-body-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#c5a88a] bg-white"
              >
                <option value="">학생을 선택하세요</option>
                {Object.entries(studentsByCourse).map(
                  ([courseName, courseStudents]) => (
                    <optgroup key={courseName} label={`📚 ${courseName}`}>
                      {courseStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.cohort_number ? ` (${s.cohort_number}기)` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ),
                )}
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.webm,.ogg,audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={handleDropzoneClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                !selectedStudentId
                  ? 'border-[#e0dcd6] cursor-not-allowed bg-[#faf9f7]'
                  : isDragOver
                    ? 'border-[#c5a88a] bg-[#f7efe5] cursor-copy'
                    : 'border-[#d4cfc9] cursor-pointer hover:border-[#c5a88a] hover:bg-[#f8f5f0]'
              }`}
            >
              <FileAudio
                className={`w-12 h-12 mx-auto mb-3 ${
                  isDragOver
                    ? 'text-[#a07850]'
                    : selectedStudentId
                      ? 'text-[#c4bdb5]'
                      : 'text-[#d8d3cd]'
                }`}
              />
              <p
                className={`text-body font-medium mb-1 ${
                  isDragOver
                    ? 'text-[#3a2e22]'
                    : selectedStudentId
                      ? 'text-gray-700'
                      : 'text-gray-400'
                }`}
              >
                {isDragOver
                  ? '파일을 여기에 놓으세요'
                  : selectedStudentId
                    ? '음성 파일을 드래그하거나 클릭하세요'
                    : '학생을 먼저 선택하세요'}
              </p>
              <p className="text-caption text-gray-400">
                MP3, WAV, M4A (최대 100MB)
              </p>
            </div>
          </>
        )}

        {/* 처리 단계 표시 */}
        {(processing || showResult) && (
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      i <= currentStep
                        ? 'bg-[#c5a88a] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }
                  `}
                  >
                    {i < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-caption mt-1 ${
                      i <= currentStep
                        ? 'text-[#a07850] font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      i < currentStep ? 'bg-[#c5a88a]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 처리 중 안내 */}
        {processing && (
          <p className="text-body-sm text-gray-500 text-center mt-2">
            AI가 음성을 분석 중입니다. 잠시만 기다려주세요…
          </p>
        )}

        {/* 결과 */}
        {showResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-body-sm text-gray-500 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium text-gray-700">
                {uploadResult?.student_name}
              </span>
              <span>·</span>
              <span>{uploadResult?.date}</span>
              {uploadResult?.duration && (
                <>
                  <span>·</span>
                  <span>{uploadResult.duration}</span>
                </>
              )}
            </div>

            {uploadResult?.speakers?.length > 0 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {uploadResult.speakers.map((s, i) => (
                    <Badge key={i} variant="default">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-body font-semibold text-gray-900 mb-2">
                대화 요약
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-body-sm text-gray-700 whitespace-pre-wrap">
                  {uploadResult?.summary || '요약이 없습니다.'}
                </p>
              </div>
            </div>

            {uploadResult?.action_items?.length > 0 && (
              <div>
                <h3 className="text-body font-semibold text-gray-900 mb-2">
                  후속 조치
                </h3>
                <div className="space-y-2">
                  {uploadResult.action_items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-body-sm text-gray-700"
                    >
                      <div className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center shrink-0">
                        <span className="text-caption text-gray-400">
                          {i + 1}
                        </span>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult?.audio_url && (
              <div>
                <h3 className="text-body font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <Play className="w-4 h-4" />
                  원본 녹음
                </h3>
                <audio
                  controls
                  src={uploadResult.audio_url}
                  className="w-full h-10 rounded-lg"
                />
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={handleReset}>
              새 파일 업로드
            </Button>
          </div>
        )}
      </Card>

      {/* 면담 이력 */}
      <h2 className="text-h3 font-semibold text-gray-900 mb-4">면담 이력</h2>
      <div className="space-y-4">
        {recordsLoading ? (
          <p className="text-body-sm text-gray-400">로딩 중...</p>
        ) : records.length === 0 ? (
          <p className="text-body-sm text-gray-400">면담 이력이 없습니다.</p>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(records.length / recordPageSize));
            const pagedRecords = records.slice((recordPage - 1) * recordPageSize, recordPage * recordPageSize);
            return (
              <>
                {pagedRecords.map((record) => (
            <Card key={record.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-body font-semibold text-gray-900">
                      {record.student_name || '—'}
                    </h3>
                    {record.course_name && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                        {record.course_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-caption text-gray-500 mt-0.5">
                    <span>{record.date}</span>
                    {record.duration && <span>{record.duration}</span>}
                  </div>
                </div>
                <Badge variant="default">완료</Badge>
              </div>

              {record.speakers?.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {record.speakers.map((s, i) => (
                      <span key={i} className="text-caption text-gray-500">
                        {s}
                        {i < record.speakers.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-body-sm text-gray-700 mb-3">
                {record.summary || '요약 없음'}
              </p>

              {record.action_items?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {record.action_items.map((item, i) => (
                    <Badge key={i} variant="info">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {record.audio_url && (
                <audio
                  controls
                  src={record.audio_url}
                  className="w-full h-10 rounded-lg mt-1"
                />
              )}

              {/* 관리자 메모 아코디언 */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  onClick={() => toggleNote(record.id, record.note)}
                  className="flex items-center gap-1.5 text-body-sm font-medium text-gray-500 hover:text-[#a07850] transition-colors w-full text-left"
                >
                  <NotebookPen className="w-4 h-4 shrink-0" />
                  <span className="flex-1">
                    {record.note ? '메모 보기/수정' : '메모 추가'}
                  </span>
                  {openNotes[record.id] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {openNotes[record.id] && (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={noteTexts[record.id] ?? record.note ?? ''}
                      onChange={(e) =>
                        setNoteTexts((prev) => ({
                          ...prev,
                          [record.id]: e.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="이 면담에 대한 메모를 입력하세요..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-body-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#c5a88a] bg-gray-50"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="warm"
                        onClick={() => handleSaveNote(record.id)}
                        loading={noteSaving[record.id]}
                        className="flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        저장
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
                ))}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-[#e8e4dc] pt-4">
                    <span className="text-caption text-[#8a847a]">
                      {(recordPage - 1) * recordPageSize + 1}–{Math.min(recordPage * recordPageSize, records.length)} / {records.length}건
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={recordPage <= 1}
                        onClick={() => setRecordPage((p) => Math.max(1, p - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - recordPage) <= 1)
                        .reduce((acc, p, idx, arr) => {
                          if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((p, idx) =>
                          p === '…' ? (
                            <span key={`e-${idx}`} className="px-1 text-caption text-[#b4aea4]">…</span>
                          ) : (
                            <button
                              type="button"
                              key={p}
                              onClick={() => setRecordPage(p)}
                              className={`flex h-8 min-w-8 items-center justify-center rounded-full text-sm font-medium transition ${
                                p === recordPage ? 'bg-[#2d2d2d] text-white shadow-sm' : 'text-[#5c5852] hover:bg-[#f5f3ef]'
                              }`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                      <button
                        type="button"
                        disabled={recordPage >= totalPages}
                        onClick={() => setRecordPage((p) => Math.min(totalPages, p + 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#5c5852] hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>
    </div>
  );
}
