import {
  getConversationsByUserId,
  getOrCreateConversation,
  getMessagesByConversationId,
  createMessage,
} from '../repositories/conversation.repository.js';
import { prisma } from '../repositories/prisma.js';
import { BaseResponse } from '../utils/baseResponse.js';

export const getConversationsController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return BaseResponse.success(res, 'Chưa đăng nhập tài khoản', []);
    }

    let customer_id = null;
    let employee_id = null;

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      employee_id = userId;
    } else {
      customer_id = userId;
    }

    let list = await getConversationsByUserId({ customer_id, employee_id });

    // Nếu khách hàng thật đã đăng nhập nhưng chưa có hội thoại nào, khởi tạo 1 phòng chat rỗng với nhân viên tư vấn
    if (list.length === 0 && customer_id) {
      let staff = await prisma.employee.findFirst({
        where: { full_name: { contains: 'Thảo Ly' } },
      });
      if (!staff) {
        staff = await prisma.employee.findFirst();
      }

      if (staff) {
        await getOrCreateConversation({
          customer_id,
          employee_id: staff.employee_id,
        });
        list = await getConversationsByUserId({ customer_id });
      }
    }

    return BaseResponse.success(res, 'Lấy danh sách hội thoại thành công', list);
  } catch (error) {
    next(error);
  }
};

export const getMessagesController = async (req, res, next) => {
  try {
    const { conversation_id } = req.params;

    // Chỉ lấy đúng tin nhắn thực tế đã lưu trong CSDL
    const messages = await getMessagesByConversationId(conversation_id);

    return BaseResponse.success(res, 'Lấy danh sách tin nhắn thành công', messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessageController = async (req, res, next) => {
  try {
    const { conversation_id } = req.params;
    const { content, attachment_url, message_type } = req.body;

    if (!content && !attachment_url) {
      return BaseResponse.error(res, 'Nội dung tin nhắn không được để trống', [], 400);
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return BaseResponse.error(res, 'Vui lòng đăng nhập để gửi tin nhắn', [], 401);
    }

    let sender_customer_id = null;
    let sender_employee_id = null;

    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      sender_employee_id = userId;
    } else {
      sender_customer_id = userId;
    }

    const newMsg = await createMessage({
      conversation_id,
      sender_customer_id,
      sender_employee_id,
      content,
      attachment_url,
      message_type: message_type || 'TEXT',
    });

    return BaseResponse.success(res, 'Gửi tin nhắn thành công', newMsg, 201);
  } catch (error) {
    next(error);
  }
};
