import axiosInstance from './axiosInstance'

export const voiceApi = {
  analyze: (data) =>
    axiosInstance.post('/api/voice-feedback/analyze', data).then((r) => r.data),

  getHistory: () =>
    axiosInstance.get('/api/voice-feedback/history').then((r) => r.data),
}
