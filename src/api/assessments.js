import axiosInstance from './axiosInstance'

export const assessmentsApi = {
  getList: () =>
    axiosInstance.get('/api/assessments').then((r) => r.data),

  submit: (id, formData) =>
    axiosInstance.post(`/api/assessments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
}
