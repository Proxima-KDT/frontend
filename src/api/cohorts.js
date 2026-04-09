import axiosInstance from '@/api/axiosInstance';

export const cohortsApi = {
  /** 회원가입 화면용 — 활성 코호트 목록 (로그인 불필요) */
  getOptions: () =>
    axiosInstance.get('/api/cohorts/options').then((r) => r.data),

  /** 회원가입 화면용 — 멘토(관리자) 목록 (로그인 불필요) */
  getMentors: () =>
    axiosInstance.get('/api/cohorts/mentors').then((r) => r.data),
};
