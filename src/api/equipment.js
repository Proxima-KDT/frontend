import axiosInstance from './axiosInstance';

export const equipmentApi = {
  getList: (category = '') =>
    axiosInstance
      .get('/api/equipment', { params: category ? { category } : {} })
      .then((r) => r.data),

  getMyRequests: () =>
    axiosInstance.get('/api/equipment/my-requests').then((r) => r.data),

  borrow: (id, reason) =>
    axiosInstance
      .post(`/api/equipment/${id}/borrow`, { reason })
      .then((r) => r.data),

  return: (id) =>
    axiosInstance.post(`/api/equipment/${id}/return`).then((r) => r.data),
};
