import axiosInstance from './axiosInstance';

export const voiceApi = {
  analyze: (data) =>
    axiosInstance.post('/api/voice-feedback/analyze', data).then((r) => r.data),

  getHistory: () =>
    axiosInstance.get('/api/voice-feedback/history').then((r) => r.data),

  getRandomTopic: (category, difficulty) => {
    const params = {};
    if (category && category !== '전체') params.category = category;
    if (difficulty) params.difficulty = difficulty;
    return axiosInstance
      .get('/api/voice-feedback/random-topic', { params })
      .then((r) => r.data);
  },
};
