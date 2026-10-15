import axiosClient from './axiosClient';

/**
 * Service quản lý các cuộc hội thoại Chat Realtime cho YOUTH FASHION
 * Kết nối 100% dữ liệu thực tế từ REST API Backend & CSDL MySQL.
 * Không dùng Mock data, không fix cứng dữ liệu.
 */

// Helper tạo ký tự viết tắt từ Họ Tên (ví dụ: "Quản Lý Youth Fashion" -> "QL", "quang" -> "QU")
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'YF';
  const clean = name.trim();
  if (!clean) return 'YF';

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
};

export const conversationService = {
  /**
   * Lấy danh sách cuộc trò chuyện thật của Khách Hàng từ CSDL Backend
   */
  getConversations: async (user = null) => {
    try {
      const response = await axiosClient.get('/conversations');
      const apiList = response.data?.data || [];

      return {
        status: true,
        data: apiList.map((c) => ({
          conversation_id: String(c.conversation_id),
          customer_id: String(c.customer_id),
          employee_id: String(c.employee_id),
          title: c.title || (c.attached_product ? `Tư vấn ${c.attached_product.name}` : `Tư vấn cùng ${c.manager_name || 'Quản Lý Youth Fashion'}`),
          manager_name: c.manager_name || 'Quản Lý Youth Fashion',
          manager_role: c.manager_role === 'ADMIN' ? 'Ban Quản Trị' : 'Quản Lý Cửa Hàng',
          customer_name: c.customer_name || 'Khách hàng',
          customer_email: c.customer_email || '',
          attached_product: c.attached_product || null,
          last_message: c.last_message || 'Bắt đầu cuộc trò chuyện...',
          last_message_at: c.last_message_at || c.updated_at || new Date().toISOString(),
          unread_count: 0,
        })),
      };
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại từ Backend:', err);
      return { status: false, data: [] };
    }
  },

  /**
   * Lấy danh sách toàn bộ khách hàng cần tư vấn cho Quản Lý từ CSDL Backend
   */
  getManagerConversations: async (user = null) => {
    try {
      const response = await axiosClient.get('/conversations');
      const apiList = response.data?.data || [];

      return {
        status: true,
        data: apiList.map((c) => ({
          conversation_id: String(c.conversation_id),
          customer_id: String(c.customer_id),
          employee_id: String(c.employee_id),
          title: c.attached_product ? `Tư vấn ${c.attached_product.name}` : `Hỗ trợ khách hàng: ${c.customer_name || 'Khách Hàng'}`,
          customer_name: c.customer_name || 'Khách Hàng',
          customer_email: c.customer_email || '',
          manager_name: c.manager_name || user?.full_name || 'Quản Lý Youth Fashion',
          manager_role: c.manager_role || 'Quản lý',
          attached_product: c.attached_product || null,
          last_message: c.last_message || 'Bắt đầu cuộc trò chuyện...',
          last_message_at: c.last_message_at || c.updated_at || new Date().toISOString(),
          unread_count: 0,
        })),
      };
    } catch (err) {
      console.error('Lỗi khi tải danh sách hội thoại Quản lý:', err);
      return { status: false, data: [] };
    }
  },

  /**
   * Lấy toàn bộ lịch sử tin nhắn thật của một cuộc trò chuyện từ CSDL MySQL
   */
  getMessages: async (conversationId, user = null) => {
    if (!conversationId) return { status: true, data: [] };

    try {
      const response = await axiosClient.get(`/conversations/${conversationId}/messages`);
      const apiMessages = response.data?.data || [];

      const isManagerViewer =
        user?.user_type === 'EMPLOYEE' ||
        user?.role === 'MANAGER' ||
        user?.role === 'ADMIN' ||
        user?.employee_role === 'ADMIN' ||
        user?.employee_role === 'MANAGER';

      const mapped = apiMessages.map((m) => {
        const isCustomer = m.sender_type === 'CUSTOMER';
        let authorName = 'Quý khách';

        if (isCustomer) {
          authorName = isManagerViewer ? (m.customer_name || 'Khách Hàng') : 'Bạn';
        } else {
          authorName = isManagerViewer ? 'Bạn (Quản lý)' : (m.employee_name || 'Quản Lý Youth Fashion');
        }

        return {
          id: String(m.message_id),
          sender: m.sender_type,
          authorName,
          time: new Date(m.created_at).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          created_at: m.created_at,
          text: m.content || '',
          attachment_url: m.attachment_url || null,
          product_card: m.product_card || null,
        };
      });

      return { status: true, data: mapped };
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn từ backend:', err);
      return { status: false, data: [] };
    }
  },

  /**
   * Khách hàng gửi tin nhắn lên CSDL MySQL
   */
  sendMessage: async (
    conversationId,
    { content, attachment_url = null, message_type = 'TEXT', product_card = null },
    user = null
  ) => {
    try {
      const response = await axiosClient.post(`/conversations/${conversationId}/messages`, {
        content,
        attachment_url,
        message_type: attachment_url ? 'IMAGE' : (product_card ? 'PRODUCT' : 'TEXT'),
        product_card,
      });

      const saved = response.data?.data;
      return {
        status: true,
        data: {
          id: String(saved?.message_id || Date.now()),
          sender: 'CUSTOMER',
          authorName: user?.full_name || 'Bạn',
          text: content,
          attachment_url,
          product_card: product_card || saved?.product_card || null,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          created_at: saved?.created_at || new Date().toISOString(),
        },
      };
    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);
      throw err;
    }
  },

  /**
   * Quản lý gửi tin nhắn phản hồi khách hàng lên CSDL MySQL
   */
  managerSendMessage: async (
    conversationId,
    { content, attachment_url = null, product_card = null },
    user = null
  ) => {
    try {
      const response = await axiosClient.post(`/conversations/${conversationId}/messages`, {
        content,
        attachment_url,
        message_type: attachment_url ? 'IMAGE' : (product_card ? 'PRODUCT' : 'TEXT'),
        product_card,
      });

      const saved = response.data?.data;
      return {
        status: true,
        data: {
          id: String(saved?.message_id || Date.now()),
          sender: 'EMPLOYEE',
          authorName: user?.full_name || 'Bạn (Quản lý)',
          text: content,
          attachment_url,
          product_card: product_card || saved?.product_card || null,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          created_at: saved?.created_at || new Date().toISOString(),
        },
      };
    } catch (err) {
      console.error('Lỗi khi Quản lý gửi tin nhắn:', err);
      throw err;
    }
  },

  /**
   * Khách hàng tạo cuộc hội thoại mới với CSDL MySQL
   */
  createConversation: async ({ title, initial_message, attached_product = null }, user = null) => {
    try {
      const response = await axiosClient.post('/conversations', {
        initial_message,
        title,
      });

      return { status: true, data: response.data?.data };
    } catch (err) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', err);
      throw err;
    }
  },

  /**
   * Đăng ký lắng nghe sự kiện Server-Sent Events (SSE) realtime
   */
  subscribeToChatStream: (onMessage, onStatusChange) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${baseUrl}/conversations/stream`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NEW_MESSAGE' && onMessage) {
            onMessage(payload.data);
          } else if (payload.type === 'STATUS_CHANGE' && onStatusChange) {
            onStatusChange(payload.data);
          }
        } catch (e) {
          // ignore heartbeat or parse errors
        }
      };

      eventSource.onerror = () => {
        // SSE tự động kết nối lại
      };

      return () => {
        eventSource.close();
      };
    } catch (err) {
      console.warn('SSE stream error:', err);
      return () => {};
    }
  },
};
