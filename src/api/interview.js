import axiosInstance from './axiosInstance'

export const interviewApi = {
  getOptions: () =>
    axiosInstance.get('/api/interview/options').then((r) => r.data),

  start: (data) =>
    axiosInstance.post('/api/interview/start', data).then((r) => r.data),

  answer: (data) =>
    axiosInstance.post('/api/interview/answer', data).then((r) => r.data),

  end: (data) =>
    axiosInstance.post('/api/interview/end', data).then((r) => r.data),
}
