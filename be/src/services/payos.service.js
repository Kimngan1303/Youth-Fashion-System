import crypto from 'crypto';

const PAYOS_API_URL = 'https://api-merchant.payos.vn/v2/payment-requests';

/**
 * Helper tạo chữ ký số HMAC-SHA256 theo chuẩn PayOS
 * Sắp xếp các khóa theo bảng chữ cái alphabet trước khi hash
 */
export const createSignature = (data, checksumKey) => {
  if (!checksumKey) return '';
  const sortedKeys = Object.keys(data).sort();
  const signString = sortedKeys
    .map((key) => `${key}=${data[key] !== null && data[key] !== undefined ? data[key] : ''}`)
    .join('&');

  return crypto
    .createHmac('sha256', checksumKey)
    .update(signString)
    .digest('hex');
};

/**
 * Kiểm tra tính hợp lệ của Webhook gửi từ PayOS
 */
export const verifyWebhookSignature = (webhookData, signature, checksumKey) => {
  if (!checksumKey || !signature) return false;
  const calculated = createSignature(webhookData, checksumKey);
  return calculated === signature;
};

/**
 * Tạo link thanh toán PayOS
 * @param {Object} params { orderCode, amount, description, items, returnUrl, cancelUrl }
 */
export const createPaymentLink = async ({
  orderCode,
  amount,
  description,
  items = [],
  returnUrl,
  cancelUrl,
}) => {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();

  // Đảm bảo description không quá 25 ký tự theo quy định ngân hàng của PayOS
  const safeDescription = (description || `Don hang #${orderCode}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25);

  // Nếu người dùng chưa điền đầy đủ cấu hình trong be/.env, kích hoạt chế độ Demo Simulation
  if (!clientId || !apiKey || !checksumKey) {
    console.warn('⚠️ [PayOS] Chưa cấu hình PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY trong be/.env');
    console.warn('💡 [PayOS] Kích hoạt chế độ mô phỏng thanh toán thử nghiệm.');
    
    return {
      isSimulation: true,
      orderCode,
      amount,
      checkoutUrl: `${returnUrl}&simulated=true`,
      paymentLinkId: `sim_${orderCode}`,
      status: 'PENDING',
      message: 'Chế độ mô phỏng thử nghiệm do chưa có API Key PayOS thật.',
    };
  }

  // Dữ liệu tạo chữ ký gửi lên PayOS
  const dataToSign = {
    amount: Math.round(Number(amount)),
    cancelUrl,
    description: safeDescription,
    orderCode: Number(orderCode),
    returnUrl,
  };

  const signature = createSignature(dataToSign, checksumKey);

  const payload = {
    ...dataToSign,
    items: items.map((item) => ({
      name: String(item.name || item.product_name || 'San pham').slice(0, 50),
      quantity: Number(item.quantity || 1),
      price: Math.round(Number(item.price || item.unit_price || 0)),
    })),
    signature,
  };

  try {
    const response = await fetch(PAYOS_API_URL, {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.code === '00' && result.data) {
      return {
        isSimulation: false,
        checkoutUrl: result.data.checkoutUrl,
        paymentLinkId: result.data.paymentLinkId,
        orderCode: result.data.orderCode,
        qrCode: result.data.qrCode,
        status: result.data.status,
      };
    } else {
      console.error('❌ [PayOS API Error]:', result);
      throw new Error(result.desc || 'Không thể tạo liên kết thanh toán PayOS');
    }
  } catch (error) {
    console.error('❌ [PayOS Request Failed]:', error.message);
    throw error;
  }
};

/**
 * Truy vấn trạng thái thanh toán từ PayOS
 */
export const getPaymentInformation = async (orderCode) => {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();

  if (!clientId || !apiKey) {
    // Mô phỏng thành công nếu đang ở môi trường test
    return {
      status: 'PAID',
      isSimulation: true,
      orderCode,
    };
  }

  try {
    const response = await fetch(`${PAYOS_API_URL}/${orderCode}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
    });

    const result = await response.json();
    if (result.code === '00' && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('❌ [PayOS Status Query Failed]:', error.message);
    return null;
  }
};

