import {
  getConversationsByUserId,
  getOrCreateConversation,
  getMessagesByConversationId,
  createMessage,
} from '../repositories/conversation.repository.js';
import { prisma } from '../repositories/prisma.js';
import { BaseResponse } from '../utils/baseResponse.js';
import { chatEvents } from '../utils/chatEvents.js';

export const getConversationsController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userType = req.user?.user_type;

    if (!userId) {
      return BaseResponse.success(res, 'Chưa đăng nhập tài khoản', []);
    }

    let customer_id = null;
    let employee_id = null;

    if (userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE') {
      // Quản lý & Admin xem và tiếp nhận tất cả hội thoại của khách hàng
      employee_id = null;
    } else {
      customer_id = userId;
    }

    let list = await getConversationsByUserId({ customer_id, employee_id });

    // Nếu khách hàng thật đã đăng nhập nhưng chưa có hội thoại nào, khởi tạo 1 phòng chat với nhân viên quản lý tư vấn
    if (list.length === 0 && customer_id) {
      let staff = await prisma.employee.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { employee_id: 'asc' },
      });

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
    const { content, attachment_url, message_type, product_card } = req.body;

    if (!content && !attachment_url && !product_card) {
      return BaseResponse.error(res, 'Nội dung tin nhắn không được để trống', [], 400);
    }

    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userType = req.user?.user_type;

    if (!userId) {
      return BaseResponse.error(res, 'Vui lòng đăng nhập để gửi tin nhắn', [], 401);
    }

    let sender_customer_id = null;
    let sender_employee_id = null;

    if (userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE') {
      sender_employee_id = userId;
    } else {
      sender_customer_id = userId;
    }

    let finalContent = content;
    if (product_card) {
      finalContent = JSON.stringify({
        text: content || `Mình muốn hỏi về sản phẩm: ${product_card.name}`,
        product_card: {
          id: String(product_card.id),
          sku: product_card.sku || `YF-${product_card.id}`,
          name: product_card.name,
          price: product_card.price,
          image: product_card.image,
          description: product_card.description || '',
        },
      });
    }

    const newMsg = await createMessage({
      conversation_id,
      sender_customer_id,
      sender_employee_id,
      content: finalContent,
      attachment_url,
      message_type: attachment_url ? 'IMAGE' : 'TEXT',
    });

    const parsedContent = product_card ? (content || `Mình muốn hỏi về sản phẩm: ${product_card.name}`) : newMsg.content;

    // Phát sự kiện realtime SSE tới tất cả các client (Quản lý & Khách hàng)
    chatEvents.emit('new_message', {
      conversation_id: String(conversation_id),
      message_id: String(newMsg.message_id),
      sender_type: newMsg.sender_type,
      sender_id: String(sender_customer_id || sender_employee_id),
      sender_name: req.user?.full_name || (sender_customer_id ? 'Khách hàng' : 'Quản Lý Youth Fashion'),
      sender_email: req.user?.email || null,
      content: parsedContent,
      attachment_url: newMsg.attachment_url,
      product_card: product_card || null,
      message_type: newMsg.message_type,
      created_at: newMsg.created_at,
    });

    return BaseResponse.success(
      res,
      'Gửi tin nhắn thành công',
      {
        ...newMsg,
        content: parsedContent,
        product_card: product_card || null,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const createConversationController = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userType = req.user?.user_type;

    if (!userId) {
      return BaseResponse.error(res, 'Vui lòng đăng nhập để tạo hội thoại', [], 401);
    }

    let customer_id = null;
    let employee_id = req.body.employee_id || null;

    if (userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE') {
      employee_id = userId;
      customer_id = req.body.customer_id;
    } else {
      customer_id = userId;
    }

    if (!employee_id) {
      let staff = await prisma.employee.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { employee_id: 'asc' },
      });
      employee_id = staff ? staff.employee_id : null;
    }

    if (!customer_id || !employee_id) {
      return BaseResponse.error(res, 'Không tìm thấy thông tin khách hàng hoặc nhân viên tư vấn', [], 400);
    }

    const conversation = await getOrCreateConversation({
      customer_id,
      employee_id,
    });

    if (req.body.initial_message) {
      const initMsg = await createMessage({
        conversation_id: conversation.conversation_id,
        sender_customer_id: customer_id,
        sender_employee_id: null,
        content: req.body.initial_message,
        attachment_url: req.body.attachment_url || null,
        message_type: req.body.message_type || 'TEXT',
      });

      chatEvents.emit('new_message', {
        conversation_id: String(conversation.conversation_id),
        message_id: String(initMsg.message_id),
        sender_type: 'CUSTOMER',
        sender_id: String(customer_id),
        sender_name: req.user?.full_name || 'Khách hàng',
        sender_email: req.user?.email || null,
        content: initMsg.content,
        attachment_url: initMsg.attachment_url,
        message_type: initMsg.message_type,
        created_at: initMsg.created_at,
      });
    }

    return BaseResponse.success(res, 'Tạo hội thoại thành công', conversation, 201);
  } catch (error) {
    next(error);
  }
};

export const updateConversationStatusController = async (req, res, next) => {
  try {
    const { conversation_id } = req.params;
    const { status } = req.body;

    if (!['OPEN', 'CLOSED', 'ARCHIVED'].includes(status)) {
      return BaseResponse.error(res, 'Trạng thái không hợp lệ', [], 400);
    }

    const updated = await prisma.conversation.update({
      where: { conversation_id: BigInt(conversation_id) },
      data: { status, updated_at: new Date() },
    });

    chatEvents.emit('status_change', {
      conversation_id: String(conversation_id),
      status,
      updated_at: updated.updated_at,
    });

    return BaseResponse.success(res, 'Cập nhật trạng thái thành công', {
      conversation_id: String(conversation_id),
      status,
    });
  } catch (error) {
    next(error);
  }
};

export const streamConversationEventsController = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  const onNewMessage = (msgData) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'NEW_MESSAGE', data: msgData })}\n\n`);
    } catch (e) {}
  };

  const onStatusChange = (statusData) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'STATUS_CHANGE', data: statusData })}\n\n`);
    } catch (e) {}
  };

  chatEvents.on('new_message', onNewMessage);
  chatEvents.on('status_change', onStatusChange);

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {}
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    chatEvents.off('new_message', onNewMessage);
    chatEvents.off('status_change', onStatusChange);
  });
};
