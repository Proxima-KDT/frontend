import axiosInstance from './axiosInstance'

export const subjectsApi = {
  getList: () =>
    axiosInstance.get('/api/subjects').then((r) => r.data),

  getDetail: (subjectId) =>
    axiosInstance.get(`/api/subjects/${subjectId}`).then((r) => r.data),

  getProgress: (subjectId) =>
    axiosInstance.get(`/api/subjects/${subjectId}/progress`).then((r) => r.data),

  getConceptProblems: (subjectId, conceptId) =>
    axiosInstance.get(`/api/subjects/${subjectId}/concepts/${conceptId}/problems`).then((r) => r.data),
}
