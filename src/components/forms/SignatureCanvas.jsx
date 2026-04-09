import { useRef, useState, useEffect, useCallback } from 'react'
import Button from '@/components/common/Button'
import { Eraser, Check, LogOut, CheckCheck } from 'lucide-react'

export default function SignatureCanvas({
  onSave,
  disabled = false,
  className = '',
  submitted = false,
  onCheckout,
  checkoutDisabled = true,
  checkoutDone = false,
  onEarlyLeave,
  earlyLeaveDone = false,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const startDrawing = useCallback((e) => {
    if (disabled || submitted) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }, [disabled, submitted, getPos])

  const draw = useCallback((e) => {
    if (!isDrawing || disabled || submitted) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setHasSignature(true)
  }, [isDrawing, disabled, submitted, getPos])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }, [])

  const handleSave = useCallback(() => {
    if (onSave && hasSignature) {
      const canvas = canvasRef.current
      onSave(canvas.toDataURL())
    }
  }, [onSave, hasSignature])

  useEffect(() => {
    const canvas = canvasRef.current
    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = 200
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 rounded-xl overflow-hidden
          ${disabled || submitted ? 'border-gray-200 bg-gray-50' : 'border-primary-200 bg-white'}
        `}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`w-full ${disabled || submitted ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        />
        {disabled && !submitted && (
          <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center">
            <p className="text-body-sm text-gray-400">이름을 입력 후 확인 버튼을 눌러주세요</p>
          </div>
        )}
        {submitted && (
          <div className="absolute inset-0 bg-green-50/60 flex items-center justify-center">
            <p className="text-body-sm text-green-600 font-medium">서명 제출 완료</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        {!submitted ? (
          <>
            <Button variant="ghost" size="sm" icon={Eraser} onClick={clear} disabled={disabled}>
              지우기
            </Button>
            <Button
              size="sm"
              icon={Check}
              onClick={handleSave}
              disabled={disabled || !hasSignature}
            >
              서명 제출
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" icon={Check} disabled className="opacity-60">
              제출 완료
            </Button>
            {!checkoutDone ? (
              <Button
                size="sm"
                icon={LogOut}
                onClick={onCheckout}
                disabled={checkoutDisabled || earlyLeaveDone}
                className={
                  checkoutDisabled || earlyLeaveDone
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }
                title={checkoutDisabled ? '17:50 이후 퇴실 가능합니다' : earlyLeaveDone ? '이미 조퇴 처리되었습니다' : '퇴실 처리'}
              >
                퇴실
              </Button>
            ) : (
              <Button size="sm" icon={CheckCheck} disabled className="bg-gray-100 text-gray-400">
                퇴실 완료
              </Button>
            )}
            {!earlyLeaveDone ? (
              <Button
                size="sm"
                icon={LogOut}
                onClick={onEarlyLeave}
                disabled={checkoutDone}
                className={
                  checkoutDone
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }
                title={checkoutDone ? '이미 퇴실 처리되었습니다' : '조퇴 처리'}
              >
                조퇴
              </Button>
            ) : (
              <Button size="sm" icon={CheckCheck} disabled className="bg-gray-100 text-gray-400">
                조퇴 완료
              </Button>
            )}
          </>
        )}
      </div>

      {submitted && checkoutDisabled && !checkoutDone && !earlyLeaveDone && (
        <p className="text-caption text-gray-400 mt-2">
          17:50 이후 퇴실 버튼이 활성화됩니다
        </p>
      )}
    </div>
  )
}
