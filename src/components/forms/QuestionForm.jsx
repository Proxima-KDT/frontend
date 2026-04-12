import { useState } from 'react'
import Textarea from '@/components/common/Textarea'
import Toggle from '@/components/common/Toggle'
import Button from '@/components/common/Button'
import { Send } from 'lucide-react'

export default function QuestionForm({ onSubmit, className = '' }) {
  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const canSubmit = content.trim().length >= 10

  const handleSubmit = () => {
    if (canSubmit && onSubmit) {
      onSubmit({ content, isAnonymous })
      setContent('')
    }
  }

  const remaining = 10 - content.trim().length
  const charCount = content.length

  return (
    <div className={className}>
      <Textarea
        placeholder="궁금한 점을 질문하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={500}
      />

      {/* 실시간 입력 피드백 */}
      <div className="flex items-center justify-between mt-1.5">
        <p className={`text-caption transition-colors ${
          charCount === 0
            ? 'text-gray-400'
            : !canSubmit
            ? 'text-red-500'
            : 'text-emerald-500'
        }`}>
          {charCount === 0
            ? '최소 10자 이상 입력해주세요'
            : !canSubmit
            ? `${remaining}자 더 입력해주세요`
            : '✓ 제출 가능'}
        </p>
        <span className={`text-caption ${charCount > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
          {charCount} / 500
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <Toggle
          checked={isAnonymous}
          onChange={setIsAnonymous}
          label="익명으로 질문"
        />
        <Button
          size="sm"
          icon={Send}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          질문 제출
        </Button>
      </div>
    </div>
  )
}
