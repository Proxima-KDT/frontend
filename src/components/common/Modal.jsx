import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal 공통 컴포넌트
 *
 * persistent={true}  : 폼 작성 모달 — 배경 클릭/ESC로 닫히지 않음 (흔들림 피드백)
 * persistent={false} : 확인/안내 모달 — 배경 클릭/ESC로 닫힘 (기본값)
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-[480px]',
  persistent = false,
}) {
  const [shaking, setShaking] = useState(false);
  const shakeTimer = useRef(null);

  const triggerShake = () => {
    if (shaking) return;
    setShaking(true);
    shakeTimer.current = setTimeout(() => setShaking(false), 420);
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;
      if (persistent) {
        triggerShake();
      } else {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
      clearTimeout(shakeTimer.current);
    };
  }, [isOpen, onClose, persistent]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (persistent) {
      triggerShake();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={`relative bg-white rounded-2xl shadow-md w-full ${maxWidth} ${
          shaking
            ? 'animate-[modal-shake_400ms_ease-in-out]'
            : 'animate-scale-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          {title && (
            <h2 className="text-h3 font-semibold text-gray-900">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ml-auto"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
