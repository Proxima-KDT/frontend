import axiosInstance from './axiosInstance';

/**
 * 통합 AI 에이전트 API 래퍼.
 *
 * 두 가지 경로:
 * - Path A (Direct SDK): /chat, /summary — 단일 턴 Function Calling
 * - Path B (LangGraph):  /workflow/{name}, /workflow/resume/{thread_id}
 *
 * JWT 는 axiosInstance 의 인터셉터가 자동으로 Authorization 헤더에 첨부한다.
 */
export const aiAgentApi = {
  /** 단일 턴 Q&A. role 은 JWT 에서 서버가 자동 판별. */
  chat: (message, history = null) =>
    axiosInstance
      .post('/api/ai-agent/chat', { message, history })
      .then((r) => r.data),

  /** 사이드 패널 카드 로드 (AI 호출 없이 role 별 고정 쿼리). */
  summary: () =>
    axiosInstance.get('/api/ai-agent/summary').then((r) => r.data),

  /** LangGraph workflow 실행.
   * @param {string} name 'teacher_daily_briefing' | 'admin_weekly_report' | 'proactive_risk_alert'
   * @param {object} params workflow 파라미터 (선택)
   */
  runWorkflow: (name, params = {}) =>
    axiosInstance
      .post(`/api/ai-agent/workflow/${name}`, { params })
      .then((r) => r.data),

  /** interrupt 된 workflow 를 승인/거절로 재개.
   * proactive_risk_alert human-in-the-loop 전용.
   */
  resumeWorkflow: (threadId, approved, edits = null) =>
    axiosInstance
      .post(`/api/ai-agent/workflow/resume/${threadId}`, { approved, edits })
      .then((r) => r.data),
};
