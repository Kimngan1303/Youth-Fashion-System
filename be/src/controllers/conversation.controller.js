import {
  getConversationsByUserId,
  getOrCreateConversation,
  createNewConversation,
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

    const isManager = userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE';
    let list = await getConversationsByUserId({ customer_id, employee_id, is_manager: isManager });

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
    const userRole = req.user?.role;
    const userType = req.user?.user_type;
    const isManager = userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE';

    // Đánh dấu đã đọc các tin nhắn từ đối phương khi mở cuộc trò chuyện
    try {
      if (isManager) {
        await prisma.message.updateMany({
          where: {
            conversation_id: BigInt(conversation_id),
            sender_customer_id: { not: null },
            is_read: false,
          },
          data: { is_read: true },
        });
      } else {
        await prisma.message.updateMany({
          where: {
            conversation_id: BigInt(conversation_id),
            sender_employee_id: { not: null },
            is_read: false,
          },
          data: { is_read: true },
        });
      }
    } catch (e) {}

    // Chỉ lấy đúng tin nhắn thực tế đã lưu trong CSDL
    const messages = await getMessagesByConversationId(conversation_id);

    return BaseResponse.success(res, 'Lấy danh sách tin nhắn thành công', messages);
  } catch (error) {
    next(error);
  }
};

export const markConversationReadController = async (req, res, next) => {
  try {
    const { conversation_id } = req.params;
    const userRole = req.user?.role;
    const userType = req.user?.user_type;
    const isManager = userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE';

    if (isManager) {
      await prisma.message.updateMany({
        where: {
          conversation_id: BigInt(conversation_id),
          sender_customer_id: { not: null },
          is_read: false,
        },
        data: { is_read: true },
      });
    } else {
      await prisma.message.updateMany({
        where: {
          conversation_id: BigInt(conversation_id),
          sender_employee_id: { not: null },
          is_read: false,
        },
        data: { is_read: true },
      });
    }

    return BaseResponse.success(res, 'Đánh dấu đã đọc thành công', { conversation_id });
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

    if (userRole === 'MANAGER' || userRole === 'ADMIN' ) {
      sender_employee_id = userId;
    } else {
      sender_customer_id = userId;
    }

    let finalContent = content;
    const productCards = req.body.product_cards || (product_card ? (Array.isArray(product_card) ? product_card : [product_card]) : null);

    if (productCards && productCards.length > 0) {
      finalContent = JSON.stringify({
        text: content || (productCards.length === 1 ? `Mình muốn hỏi về sản phẩm: ${productCards[0].name}` : `Mình cần tư vấn về ${productCards.length} sản phẩm đã chọn`),
        product_cards: productCards,
        product_card: productCards[0],
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

    const parsedContent = (productCards && productCards.length > 0)
      ? (content || (productCards.length === 1 ? `Mình muốn hỏi về sản phẩm: ${productCards[0].name}` : `Mình cần tư vấn về ${productCards.length} sản phẩm đã chọn`))
      : newMsg.content;

    // Lấy thông tin hội thoại để biết customer_id, employee_id và họ tên chính xác
    const conv = await prisma.conversation.findUnique({
      where: { conversation_id: BigInt(conversation_id) },
      include: {
        customer: { select: { customer_id: true, full_name: true, email: true } },
        employee: { select: { employee_id: true, full_name: true, email: true } },
      },
    });

    let senderName = req.user?.full_name;
    let senderEmail = req.user?.email || null;

    if (sender_customer_id) {
      senderName = conv?.customer?.full_name || req.user?.full_name || 'Khách hàng';
      senderEmail = conv?.customer?.email || req.user?.email || null;
    } else if (sender_employee_id) {
      senderName = conv?.employee?.full_name || req.user?.full_name || 'Quản Lý Youth Fashion';
      senderEmail = conv?.employee?.email || req.user?.email || null;
    }

    // Phát sự kiện realtime SSE tới tất cả các client (Quản lý & Khách hàng)
    chatEvents.emit('new_message', {
      conversation_id: String(conversation_id),
      message_id: String(newMsg.message_id),
      customer_id: conv?.customer_id ? String(conv.customer_id) : (sender_customer_id ? String(sender_customer_id) : ''),
      sender_type: newMsg.sender_type,
      sender_id: String(sender_customer_id || sender_employee_id),
      sender_name: senderName,
      sender_email: senderEmail,
      content: parsedContent,
      attachment_url: newMsg.attachment_url,
      product_card: productCards ? productCards[0] : null,
      product_cards: productCards || null,
      message_type: newMsg.message_type,
      created_at: newMsg.created_at,
    });

    return BaseResponse.success(
      res,
      'Gửi tin nhắn thành công',
      {
        ...newMsg,
        content: parsedContent,
        product_card: productCards ? productCards[0] : null,
        product_cards: productCards || null,
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

    // Chỉ có tài khoản CUSTOMER mới được chủ động tạo hội thoại liên hệ tư vấn
    if (userRole === 'MANAGER' || userRole === 'ADMIN' || userType === 'EMPLOYEE') {
      return BaseResponse.error(res, 'Tài khoản Quản lý / Nhân viên không được phép tạo hội thoại tư vấn', [], 403);
    }

    const customer_id = userId;
    let employee_id = req.body.employee_id || null;

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

    // Luôn tạo cuộc hội thoại mới riêng biệt cho từng sản phẩm / yêu cầu tư vấn
    const conversation = await createNewConversation({
      customer_id,
      employee_id,
    });

    const productCards = req.body.product_cards || (req.body.product_card ? (Array.isArray(req.body.product_card) ? req.body.product_card : [req.body.product_card]) : null);

    if (req.body.initial_message || productCards) {
      let finalContent = req.body.initial_message || '';
      if (productCards && productCards.length > 0) {
        finalContent = JSON.stringify({
          text: req.body.initial_message || (productCards.length === 1 ? `Mình muốn hỏi về sản phẩm: ${productCards[0].name}` : `Mình cần tư vấn về ${productCards.length} sản phẩm đã chọn`),
          product_cards: productCards,
          product_card: productCards[0],
        });
      }

      const initMsg = await createMessage({
        conversation_id: conversation.conversation_id,
        sender_customer_id: customer_id,
        sender_employee_id: null,
        content: finalContent,
        attachment_url: req.body.attachment_url || null,
        message_type: req.body.attachment_url ? 'IMAGE' : 'TEXT',
      });

      const parsedInitContent = (productCards && productCards.length > 0)
        ? (req.body.initial_message || (productCards.length === 1 ? `Mình muốn hỏi về sản phẩm: ${productCards[0].name}` : `Mình cần tư vấn về ${productCards.length} sản phẩm đã chọn`))
        : initMsg.content;

      const custInfo = await prisma.customer.findUnique({
        where: { customer_id: BigInt(customer_id) },
        select: { full_name: true, email: true },
      });

      chatEvents.emit('new_message', {
        conversation_id: String(conversation.conversation_id),
        message_id: String(initMsg.message_id),
        customer_id: String(customer_id),
        sender_type: 'CUSTOMER',
        sender_id: String(customer_id),
        sender_name: custInfo?.full_name || conversation.customer_name || req.user?.full_name || 'Khách hàng',
        sender_email: custInfo?.email || req.user?.email || null,
        content: parsedInitContent,
        attachment_url: initMsg.attachment_url,
        product_card: productCards ? productCards[0] : null,
        product_cards: productCards || null,
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
