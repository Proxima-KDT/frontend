import axiosInstance from './axiosInstance';

export const quizApi = {
  submit: (conceptId, answers) =>
    axiosInstance
      .post('/api/submissions/quiz', {
        concept_id: conceptId,
        answers,
      })
      .then((r) => r.data),

  getPreviousSubmissions: (conceptId) =>
    axiosInstance
      .get(`/api/submissions/concept/${conceptId}`)
      .then((r) => r.data),
};
