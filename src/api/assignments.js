import axiosInstance from './axiosInstance'

export const assignmentsApi = {
  getList: () =>
    axiosInstance.get('/api/assignments').then((r) => r.data),

  submit: (id, formData) =>
    axiosInstance.post(`/api/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),

  getFeedback: (id) =>
    axiosInstance.get(`/api/assignments/${id}/feedback`).then((r) => r.data),

  deleteFile: (id, filePath) =>
    axiosInstance
      .delete(`/api/assignments/${id}/files`, { data: { file_path: filePath } })
      .then((r) => r.data),
}
