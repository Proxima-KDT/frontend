import axiosInstance from './axiosInstance'

export const problemsApi = {
  getList: () =>
    axiosInstance.get('/api/problems').then((r) => r.data),

  getDetail: (id) =>
    axiosInstance.get(`/api/problems/${id}`).then((r) => r.data),

  submit: (id, answer) =>
    axiosInstance.post(`/api/problems/${id}/submit`, { answer }).then((r) => r.data),

  getEvaluation: (id) =>
    axiosInstance.get(`/api/problems/${id}/evaluation`).then((r) => r.data),
}
