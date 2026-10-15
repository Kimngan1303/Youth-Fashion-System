import { prisma } from './prisma.js';

export const getConversationsByUserId = async ({ customer_id, employee_id }) => {
  const where = {};
  if (customer_id) {
    where.customer_id = BigInt(customer_id);
  } else if (employee_id) {
    where.employee_id = BigInt(employee_id);
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      customer: {
        select: {
          customer_id: true,
          full_name: true,
          avatar_url: true,
          email: true,
        },
      },
      employee: {
        select: {
          employee_id: true,
          full_name: true,
          employee_role: true,
          email: true,
        },
      },
      messages: {
        orderBy: { created_at: 'asc' },
      },
    },
    orderBy: { updated_at: 'desc' },
  });

  // Tải danh mục sản phẩm từ CSDL để liên kết mã hàng và mô tả
  const allProducts = await prisma.product.findMany({
    include: {
      images: { where: { is_primary: true }, take: 1 },
      variants: { take: 1 },
    },
  });

  const productMapByName = new Map();
  allProducts.forEach((p) => {
    productMapByName.set(p.product_name.toLowerCase().trim(), p);
  });

  return conversations.map((c) => {
    let attached_product = null;
    let lastMsgContent = 'Bắt đầu cuộc trò chuyện...';

    // Tìm kiếm thông tin mã hàng (ảnh, tên, mô tả, giá, sku) từ các tin nhắn
    for (const m of c.messages) {
      const text = m.message_content || '';
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.product_card) {
            attached_product = parsed.product_card;
          }
        } catch (e) {}
      }

      if (!attached_product) {
        const match = text.match(/sản phẩm "([^"]+)"/i) || text.match(/sản phẩm: ([^\n]+)/i);
        if (match && match[1]) {
          const prodName = match[1].toLowerCase().trim();
          const foundProd = productMapByName.get(prodName);
          if (foundProd) {
            attached_product = {
              id: foundProd.product_id.toString(),
              sku: foundProd.variants[0]?.sku || `YF-${foundProd.product_id}`,
              name: foundProd.product_name,
              price: foundProd.variants[0]?.price ? Number(foundProd.variants[0].price) : 0,
              image: foundProd.images[0]?.image_url || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
              description: foundProd.description || 'Thiết kế thời trang cao cấp YOUTH FASHION.',
            };
          }
        }
      }
    }

    const lastMsgObj = c.messages[c.messages.length - 1];
    if (lastMsgObj) {
      let t = lastMsgObj.message_content || '';
      if (t.startsWith('{') && t.endsWith('}')) {
        try {
          const p = JSON.parse(t);
          t = p.text || (p.product_card ? `Hỏi về sản phẩm: ${p.product_card.name}` : t);
        } catch (e) {}
      }
      lastMsgContent = t;
    }

    return {
      conversation_id: c.conversation_id.toString(),
      customer_id: c.customer_id.toString(),
      employee_id: c.employee_id.toString(),
      customer_name: c.customer.full_name,
      customer_avatar: c.customer.avatar_url,
      customer_email: c.customer.email,
      manager_name: c.employee.full_name,
      manager_role: c.employee.employee_role,
      status: c.status,
      attached_product,
      last_message: lastMsgContent,
      last_message_at: lastMsgObj?.created_at || c.created_at,
      updated_at: c.updated_at,
    };
  });
};

export const getOrCreateConversation = async ({ customer_id, employee_id }) => {
  const cId = BigInt(customer_id);
  const eId = BigInt(employee_id);

  let conv = await prisma.conversation.findUnique({
    where: {
      customer_id_employee_id: {
        customer_id: cId,
        employee_id: eId,
      },
    },
    include: {
      customer: true,
      employee: true,
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        customer_id: cId,
        employee_id: eId,
        status: 'OPEN',
      },
      include: {
        customer: true,
        employee: true,
      },
    });
  }

  return {
    conversation_id: conv.conversation_id.toString(),
    customer_id: conv.customer_id.toString(),
    employee_id: conv.employee_id.toString(),
    customer_name: conv.customer.full_name,
    manager_name: conv.employee.full_name,
    status: conv.status,
    created_at: conv.created_at,
    updated_at: conv.updated_at,
  };
};

export const getMessagesByConversationId = async (conversation_id) => {
  const messages = await prisma.message.findMany({
    where: {
      conversation_id: BigInt(conversation_id),
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  const allProducts = await prisma.product.findMany({
    include: {
      images: { where: { is_primary: true }, take: 1 },
      variants: { take: 1 },
    },
  });
  const productMapByName = new Map();
  allProducts.forEach((p) => {
    productMapByName.set(p.product_name.toLowerCase().trim(), p);
  });

  return messages.map((m) => {
    let text = m.message_content || '';
    let product_card = null;

    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        if (parsed.product_card) {
          text = parsed.text || '';
          product_card = parsed.product_card;
        }
      } catch (e) {}
    }

    if (!product_card) {
      const match = text.match(/sản phẩm "([^"]+)"/i) || text.match(/sản phẩm: ([^\n]+)/i);
      if (match && match[1]) {
        const prodName = match[1].toLowerCase().trim();
        const foundProd = productMapByName.get(prodName);
        if (foundProd) {
          product_card = {
            id: foundProd.product_id.toString(),
            sku: foundProd.variants[0]?.sku || `YF-${foundProd.product_id}`,
            name: foundProd.product_name,
            price: foundProd.variants[0]?.price ? Number(foundProd.variants[0].price) : 0,
            image: foundProd.images[0]?.image_url || 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800',
            description: foundProd.description || 'Thiết kế thời trang cao cấp YOUTH FASHION.',
          };
        }
      }
    }

    return {
      message_id: m.message_id.toString(),
      conversation_id: m.conversation_id.toString(),
      sender_customer_id: m.sender_customer_id ? m.sender_customer_id.toString() : null,
      sender_employee_id: m.sender_employee_id ? m.sender_employee_id.toString() : null,
      sender_type: m.sender_customer_id ? 'CUSTOMER' : 'EMPLOYEE',
      content: text,
      attachment_url: m.attachment_url,
      message_type: m.message_type,
      product_card,
      is_read: m.is_read,
      created_at: m.created_at,
    };
  });
};

export const createMessage = async ({
  conversation_id,
  sender_customer_id,
  sender_employee_id,
  content,
  attachment_url,
  message_type = 'TEXT',
}) => {
  const cId = BigInt(conversation_id);

  const message = await prisma.message.create({
    data: {
      conversation_id: cId,
      sender_customer_id: sender_customer_id ? BigInt(sender_customer_id) : null,
      sender_employee_id: sender_employee_id ? BigInt(sender_employee_id) : null,
      message_content: content,
      attachment_url: attachment_url || null,
      message_type,
      is_read: false,
    },
  });

  await prisma.conversation.update({
    where: { conversation_id: cId },
    data: { updated_at: new Date() },
  });

  return {
    message_id: message.message_id.toString(),
    conversation_id: message.conversation_id.toString(),
    sender_type: sender_customer_id ? 'CUSTOMER' : 'EMPLOYEE',
    content: message.message_content,
    attachment_url: message.attachment_url,
    message_type: message.message_type,
    created_at: message.created_at,
  };
};
