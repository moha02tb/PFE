jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../config/api', () => ({
  CHATBOT_API_CONFIG: {
    baseURL: 'http://test-chatbot',
    timeout: 2000,
    endpoints: {
      answer: '/answer',
      ready: '/ready',
    },
  },
}));

import axios from 'axios';
import {
  askFirstAidAssistant,
  CHATBOT_MIN_QUERY_LENGTH,
  getChatbotReadiness,
  normalizeChatbotAnswer,
} from '../utils/chatbotApi';

describe('chatbot API helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trims the query, clamps top_k, and normalizes the answer response', async() => {
    axios.post.mockResolvedValueOnce({
      data: {
        query: 'Someone is choking',
        answer: 'Call local emergency services and start choking first aid.',
        confidence: '0.82',
        answer_mode: 'extractive',
        topic_prediction: 'choking',
        retrieved_evidence: [{ topic: 'choking', score: 0.91 }],
      },
    });

    const result = await askFirstAidAssistant('  Someone is choking  ', 99);

    expect(axios.post).toHaveBeenCalledWith(
      'http://test-chatbot/answer',
      {
        query: 'Someone is choking',
        top_k: 20,
      },
      { timeout: 2000 }
    );
    expect(result).toEqual({
      query: 'Someone is choking',
      answer: 'Call local emergency services and start choking first aid.',
      confidence: 0.82,
      answerMode: 'extractive',
      topicPrediction: 'choking',
      retrievedEvidence: [{ topic: 'choking', score: 0.91 }],
    });
  });

  it('rejects very short prompts before calling the service', async() => {
    await expect(askFirstAidAssistant('x'.repeat(CHATBOT_MIN_QUERY_LENGTH - 1))).rejects.toMatchObject(
      { code: 'CHATBOT_QUERY_TOO_SHORT' }
    );

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('keeps normalized answer fields stable when the service omits optional fields', () => {
    expect(normalizeChatbotAnswer({}, 'fallback query')).toEqual({
      query: 'fallback query',
      answer: '',
      confidence: 0,
      answerMode: null,
      topicPrediction: null,
      retrievedEvidence: [],
    });
  });

  it('reads chatbot readiness from the ready endpoint', async() => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'ready',
        documents: 409,
        active_retrieval_mode: 'bm25_plus_dense',
      },
    });

    await expect(getChatbotReadiness()).resolves.toEqual({
      status: 'ready',
      documents: 409,
      active_retrieval_mode: 'bm25_plus_dense',
    });
    expect(axios.get).toHaveBeenCalledWith('http://test-chatbot/ready', { timeout: 2000 });
  });
});
