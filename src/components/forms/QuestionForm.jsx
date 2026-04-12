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

  return (
    <div className={className}>
      <Textarea
        colorScheme="warm"
        placeholder="궁금한 점을 질문하세요 (최소 10자 이상)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={500}
      />
      <div className="flex items-center justify-between mt-3">
        <Toggle
          colorScheme="warm"
          checked={isAnonymous}
          onChange={setIsAnonymous}
          label="익명으로 질문"
        />
        <Button
          variant="warm"
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
