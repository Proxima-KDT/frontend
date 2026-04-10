import axiosInstance from './axiosInstance';

export const questionsApi = {
  getList: () => axiosInstance.get('/api/questions').then((r) => r.data),

  create: (content, isAnonymous) =>
    axiosInstance
      .post('/api/questions', { content, is_anonymous: isAnonymous })
      .then((r) => r.data),

  update: (id, content) =>
    axiosInstance.patch(`/api/questions/${id}`, { content }).then((r) => r.data),

  delete: (id) =>
    axiosInstance.delete(`/api/questions/${id}`).then((r) => r.data),

  answer: (id, answer) =>
    axiosInstance
      .post(`/api/questions/${id}/answer`, { answer })
      .then((r) => r.data),
};
