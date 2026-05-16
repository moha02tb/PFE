import axios from 'axios';
import { CHATBOT_API_CONFIG } from '../config/api';

const CHATBOT_API_BASE_URL = CHATBOT_API_CONFIG.baseURL;
export const CHATBOT_MIN_QUERY_LENGTH = 3;

const createChatbotError = (message, code, cause) => {
  const error = new Error(message);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
};

const clampTopK = (topK) => {
  const parsed = Number(topK);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(Math.round(parsed), 1), 20);
};

export const normalizeChatbotAnswer = (data, fallbackQuery) => ({
  query: data?.query || fallbackQuery,
  answer: data?.answer || '',
  confidence: Number(data?.confidence ?? 0),
  answerMode: data?.answer_mode || null,
  topicPrediction: data?.topic_prediction || null,
  retrievedEvidence: Array.isArray(data?.retrieved_evidence) ? data.retrieved_evidence : [],
});

export const askFirstAidAssistant = async(query, topK = 5) => {
  const normalizedQuery = `${query || ''}`.trim();

  if (normalizedQuery.length < CHATBOT_MIN_QUERY_LENGTH) {
    throw createChatbotError(
      'Please describe the first-aid situation with a little more detail.',
      'CHATBOT_QUERY_TOO_SHORT'
    );
  }

  const response = await axios.post(
    `${CHATBOT_API_BASE_URL}${CHATBOT_API_CONFIG.endpoints.answer}`,
    {
      query: normalizedQuery,
      top_k: clampTopK(topK),
    },
    {
      timeout: CHATBOT_API_CONFIG.timeout,
    }
  );

  return normalizeChatbotAnswer(response.data, normalizedQuery);
};

export const getChatbotReadiness = async() => {
  const response = await axios.get(`${CHATBOT_API_BASE_URL}${CHATBOT_API_CONFIG.endpoints.ready}`, {
    timeout: CHATBOT_API_CONFIG.timeout,
  });

  return response.data || {};
};

export const getChatbotServiceUrl = () => CHATBOT_API_BASE_URL;
