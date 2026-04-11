import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Web Speech API 기반 STT 훅.
 *
 * - Chrome / Edge 지원. Safari 는 일부 제한, Firefox 는 미지원.
 * - HTTPS 환경(또는 localhost)에서만 마이크 권한 요청이 동작한다.
 * - 미지원 브라우저에서는 { isSupported: false } 를 반환하므로
 *   UI 에서 버튼을 비활성화 처리할 것.
 *
 * @param {{ lang?: string, continuous?: boolean, interimResults?: boolean }} options
 */
export function useSpeechRecognition({
  lang = 'ko-KR',
  continuous = false,
  interimResults = true,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // SSR 대비 window 가드
  const isSupported =
    typeof window !== 'undefined' &&
    (typeof window.SpeechRecognition !== 'undefined' ||
      typeof window.webkitSpeechRecognition !== 'undefined');

  useEffect(() => {
    if (!isSupported) return undefined;

    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SRClass();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // interim 과 final 을 모두 누적해 사용자가 즉시 확인 가능
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onerror = (event) => {
      setError(event?.error || 'unknown_error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    };
  }, [isSupported, lang, continuous, interimResults]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      setError(e?.message || 'start_failed');
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* noop */
    }
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    start,
    stop,
    reset,
  };
}
