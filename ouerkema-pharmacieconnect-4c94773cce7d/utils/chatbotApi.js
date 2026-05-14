import axios from 'axios';
import { CHATBOT_API_CONFIG } from '../config/api';

const CHATBOT_API_BASE_URL = CHATBOT_API_CONFIG.baseURL;

export const askFirstAidAssistant = async (query, topK = 5) => {
  const normalizedQuery = `${query || ''}`.trim();

  if (normalizedQuery.length < 3) {
    throw new Error('Please describe the first-aid situation with a little more detail.');
  }

  const response = await axios.post(
    `${CHATBOT_API_BASE_URL}${CHATBOT_API_CONFIG.endpoints.answer}`,
    {
      query: normalizedQuery,
      top_k: topK,
    },
    {
      timeout: CHATBOT_API_CONFIG.timeout,
    }
  );

  return {
    query: response.data?.query || normalizedQuery,
    answer: response.data?.answer || '',
    confidence: Number(response.data?.confidence ?? 0),
    answerMode: response.data?.answer_mode || null,
    topicPrediction: response.data?.topic_prediction || null,
    retrievedEvidence: Array.isArray(response.data?.retrieved_evidence)
      ? response.data.retrieved_evidence
      : [],
  };
};

export const getChatbotServiceUrl = () => CHATBOT_API_BASE_URL;
