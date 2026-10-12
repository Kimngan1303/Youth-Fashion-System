import axiosClient from './axiosClient';

export const conversationService = {
  getConversations: async () => {
    const response = await axiosClient.get('/conversations');
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await axiosClient.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId, { content, attachment_url, message_type = 'TEXT' }) => {
    const response = await axiosClient.post(`/conversations/${conversationId}/messages`, {
      content,
      attachment_url,
      message_type,
    });
    return response.data;
  },
};
