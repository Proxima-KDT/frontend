import { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle,
  Headphones,
  FileAudio,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { teacherApi } from '@/api/teacher';
import { useToast } from '@/context/ToastContext';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';

const steps = [
  { key: 'upload', label: '파일 업로드', icon: Upload },
  { key: 'separation', label: '화자 분리', icon: Headphones },
  { key: 'stt', label: '음성 변환', icon: MessageSquare },
  { key: 'summary', label: 'AI 요약', icon: Sparkles },
];

export default function Counseling() {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(-1);
  const [processing, setProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    teacherApi
      .getCounselingRecords()
      .then((data) => setRecords(data))
      .catch(() => {})
      .finally(() => setRecordsLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(file);
    e.target.value = '';
  };

  const startUpload = (file) => {
    setProcessing(true);
    setUploadResult(null);
    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= 3) clearInterval(interval);
    }, 1500);
    const formData = new FormData();
    formData.append('file', file);
    teacherApi
      .uploadCounselingAudio(formData)
      .then((result) => {
        clearInterval(interval);
        setCurrentStep(3);
        setUploadResult(result);
        setRecords((prev) => [result, ...prev]);
        setTimeout(() => {
          setProcessing(false);
          setShowResult(true);
        }, 500);
      })
      .catch(() => {
        clearInterval(interval);
        setProcessing(false);
        setCurrentStep(-1);
      });
  };

  const handleDropzoneClick = () => fileInputRef.current?.click();

  return (
    <div>
      <h1 className="text-h1 font-bold text-gray-900 mb-6">상담 기록</h1>

      {/* 업로드 영역 */}
      <Card className="mb-6">
        <h2 className="text-h3 font-semibold text-gray-900 mb-4">
          음성 파일 업로드
        </h2>

        {!processing && !showResult && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div
              onClick={handleDropzoneClick}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <FileAudio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-body font-medium text-gray-700 mb-1">
                음성 파일을 드래그하거나 클릭하세요
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
                        ? 'bg-teacher-500 text-white'
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
                        ? 'text-teacher-500 font-medium'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      i < currentStep ? 'bg-teacher-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* 결과 */}
        {showResult && (
          <div className="space-y-4">
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
                  실행 항목
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

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowResult(false);
                setCurrentStep(-1);
                setUploadResult(null);
              }}
            >
              새 파일 업로드
            </Button>
          </div>
        )}
      </Card>

      {/* 상담 이력 */}
      <h2 className="text-h3 font-semibold text-gray-900 mb-4">상담 이력</h2>
      <div className="space-y-4">
        {recordsLoading ? (
          <p className="text-body-sm text-gray-400">로딩 중...</p>
        ) : records.length === 0 ? (
          <p className="text-body-sm text-gray-400">상담 이력이 없습니다.</p>
        ) : (
          records.map((record) => (
            <Card key={record.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-body font-semibold text-gray-900">
                    {record.student_name}
                  </h3>
                  <div className="flex items-center gap-3 text-caption text-gray-500 mt-0.5">
                    <span>{record.date}</span>
                    <span>{record.duration}</span>
                  </div>
                </div>
                <Badge variant="default">완료</Badge>
              </div>
              <p className="text-body-sm text-gray-700 mb-3">
                {record.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {record.action_items.map((item, i) => (
                  <Badge key={i} variant="info">
                    {item}
                  </Badge>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
