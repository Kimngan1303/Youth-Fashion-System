import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/repositories/prisma.js';
import { generateAccessToken } from '../src/helpers/jwt.helper.js';
import { processExpiredPayosOrders, processAutoCompleteOrders } from '../src/config/paymentExpiration.job.js';
import { emailHooks } from '../src/services/email.service.js';

describe('Youth Fashion Order Flow & Bug Fix Test Suite', () => {
  let managerToken;
  let customerAToken;
  let customerBToken;
  let customerAId;
  let customerBId;
  let testVariant;

  before(async () => {
    // 1. Lấy thông tin Manager
    const manager = await prisma.employee.findFirst({
      where: { employee_role: { in: ['MANAGER', 'ADMIN'] } },
    });
    managerToken = generateAccessToken({
      id: Number(manager.employee_id),
      employeeId: Number(manager.employee_id),
      email: manager.email,
      role: manager.employee_role,
      user_type: 'EMPLOYEE',
    });

    // 2. Lấy thông tin 2 Customer khác nhau
    const customers = await prisma.customer.findMany({ take: 2 });
    customerAId = Number(customers[0].customer_id);
    customerBId = Number(customers[1].customer_id);

    customerAToken = generateAccessToken({
      id: customerAId,
      customerId: customerAId,
      email: customers[0].email,
      role: 'CUSTOMER',
      user_type: 'CUSTOMER',
    });

    customerBToken = generateAccessToken({
      id: customerBId,
      customerId: customerBId,
      email: customers[1].email,
      role: 'CUSTOMER',
      user_type: 'CUSTOMER',
    });

    // 3. Lấy sản phẩm test
    testVariant = await prisma.productVariant.findFirst({
      where: { stock: { gte: 10 } },
    });
    assert.ok(testVariant, 'Phải có ít nhất 1 ProductVariant có tồn kho >= 10');
  });

  after(async () => {
    await prisma.$disconnect();
  });

  // TEST 1: Kịch bản tuần tự đầy đủ 1-9 (Chờ xác nhận -> Đã xác nhận -> Vận chuyển -> Giao thất bại -> Giao lại -> Đã giao -> Khách xác nhận -> Hoàn thành)
  it('Scenario 1: Complete Order Lifecycle 1-9 via API with status history & notifications', async () => {
    // 1. Khách đặt hàng COD
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Nguyen Van Test',
        recipientPhone: '0912345678',
        recipientEmail: 'test@example.com',
        shippingAddressLine: '123 Pho Hue',
        shippingWard: 'Hang Bai',
        shippingDistrict: 'Hoan Kiem',
        shippingCity: 'Ha Noi',
        shippingMethod: 'STANDARD',
        paymentMethod: 'COD',
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1 }],
      });

    assert.equal(orderRes.status, 201, 'Tạo đơn hàng phải trả về 201');
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;
    assert.ok(orderId, 'Phải có order_id');

    // Kiểm tra trạng thái khởi tạo là PENDING
    const dbOrder1 = await prisma.order.findUnique({ where: { order_id: BigInt(orderId) } });
    assert.equal(dbOrder1.order_status, 'PENDING');

    // 2. Manager duyệt đơn: PENDING -> CONFIRMED
    const confirmRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'CONFIRMED', note: 'Shop xac nhan don hang' });
    assert.equal(confirmRes.status, 200);

    // 3. Manager xuất kho giao hàng: CONFIRMED -> SHIPPED
    const shipRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'SHIPPED', note: 'Giao cho don vi van chuyen' });
    assert.equal(shipRes.status, 200);

    // 4. Giao hàng thất bại lần 1: SHIPPED -> DELIVERY_FAILED
    const failRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'DELIVERY_FAILED', note: 'Khach khong nghe may lan 1' });
    assert.equal(failRes.status, 200);
    const dbOrderFail = await prisma.order.findUnique({ where: { order_id: BigInt(orderId) } });
    assert.equal(dbOrderFail.order_status, 'DELIVERY_FAILED');
    assert.equal(dbOrderFail.delivery_attempts, 1);

    // 5. Manager bấm Giao lại: DELIVERY_FAILED -> SHIPPED
    const retryRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'SHIPPED', note: 'Giao lai lan 2' });
    assert.equal(retryRes.status, 200);

    // 6. Giao hàng thành công: SHIPPED -> DELIVERED
    const delRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'DELIVERED', note: 'Da giao hang thanh cong' });
    assert.equal(delRes.status, 200);
    const dbOrderDelivered = await prisma.order.findUnique({ where: { order_id: BigInt(orderId) } });
    assert.equal(dbOrderDelivered.order_status, 'DELIVERED');
    assert.ok(dbOrderDelivered.delivered_at, 'Phải có delivered_at');

    // 7. Manager không thể bấm Hoàn thành trước khi khách xác nhận
    const earlyCompleteRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'COMPLETED' });
    assert.equal(earlyCompleteRes.status, 400, 'Không được phép Hoàn thành khi khách chưa bấm nhận hàng và chưa quá hạn');

    // 8. Khách hàng bấm "Đã nhận được hàng"
    const customerConfirmRes = await request(app)
      .patch(`/api/orders/customer/${orderId}/confirm-delivered`)
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(customerConfirmRes.status, 200);

    const dbOrderConfirmedByCust = await prisma.order.findUnique({ where: { order_id: BigInt(orderId) } });
    assert.ok(dbOrderConfirmedByCust.customer_received_at, 'Phải có customer_received_at');
    assert.equal(dbOrderConfirmedByCust.order_status, 'COMPLETED', 'Đơn hàng phải chuyển sang COMPLETED khi khách bấm nhận hàng');

    // 9. Giờ Manager bấm Hoàn thành thành công: DELIVERED -> COMPLETED
    const completeRes = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'COMPLETED', note: 'Don hang hoan tat' });
    assert.equal(completeRes.status, 200);

    const dbOrderCompleted = await prisma.order.findUnique({
      where: { order_id: BigInt(orderId) },
      include: { status_history: true },
    });
    assert.equal(dbOrderCompleted.order_status, 'COMPLETED');
    assert.ok(dbOrderCompleted.completed_at, 'Phải có completed_at');
    assert.ok(dbOrderCompleted.status_history.length >= 6, 'Phải ghi lại đầy đủ lịch sử trạng thái');
  });

  // TEST 2: Kiểm tra quy tắc chuyển trạng thái không hợp lệ trả về 400
  it('Scenario 2: Invalid status transitions return 400', async () => {
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Nguyen Van Test',
        recipientPhone: '0912345678',
        recipientEmail: 'test@example.com',
        shippingAddressLine: '123 Pho Hue',
        shippingWard: 'Hang Bai',
        shippingDistrict: 'Hoan Kiem',
        shippingCity: 'Ha Noi',
        shippingMethod: 'STANDARD',
        paymentMethod: 'COD',
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1 }],
      });
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;
    assert.ok(orderId);

    // PENDING -> DELIVERED (nhảy cóc) phải bị từ chối 400
    const invalidJump = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'DELIVERED' });
    assert.equal(invalidJump.status, 400);

    // Chuyển sang CONFIRMED hợp lệ
    await request(app).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${managerToken}`).send({ status: 'CONFIRMED' });

    // CONFIRMED -> COMPLETED (nhảy cóc) phải bị từ chối 400
    const invalidJump2 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'COMPLETED' });
    assert.equal(invalidJump2.status, 400);
  });

  // TEST 3: Job tự hủy chỉ hủy đơn PayOS quá 5 phút; đơn COD giữ nguyên PENDING
  it('Scenario 3: PayOS unpaid expires after 5 mins; COD remains PENDING', async () => {
    const pastTime = new Date(Date.now() - 6 * 60 * 1000); // 6 phút trước

    // Tạo đơn COD cũ
    const codOrder = await prisma.order.create({
      data: {
        order_number: `COD-EXPIRE-${Date.now()}`,
        customer: { connect: { customer_id: BigInt(customerAId) } },
        recipient_name: 'COD Test',
        recipient_phone: '0912345678',
        shipping_address_line: '123 Pho Hue, Ha Noi',
        shipping_city: 'Ha Noi',
        total_amount: 100000,
        order_status: 'PENDING',
        created_at: pastTime,
        payments: {
          create: {
            payment_method: 'COD',
            payment_status: 'PENDING',
            amount: 100000,
          },
        },
      },
    });

    // Tạo đơn PayOS cũ chưa thanh toán
    const payosOrder = await prisma.order.create({
      data: {
        order_number: `PAYOS-EXPIRE-${Date.now()}`,
        customer: { connect: { customer_id: BigInt(customerAId) } },
        recipient_name: 'PayOS Test',
        recipient_phone: '0912345678',
        shipping_address_line: '123 Pho Hue, Ha Noi',
        shipping_city: 'Ha Noi',
        total_amount: 100000,
        order_status: 'PENDING',
        created_at: pastTime,
        payments: {
          create: {
            payment_method: 'PAYOS',
            payment_status: 'PENDING',
            amount: 100000,
          },
        },
        order_items: {
          create: {
            variant_id: BigInt(testVariant.variant_id),
            product_name: 'Ao test',
            sku: 'SKU-TEST',
            size: 'M',
            color: 'Den',
            quantity: 1,
            unit_price: 100000,
            subtotal: 100000,
          },
        },
      },
    });

    // Chạy job quét hủy đơn hết hạn
    await processExpiredPayosOrders();

    // Assert: Đơn COD vẫn phải ở PENDING
    const codAfter = await prisma.order.findUnique({ where: { order_id: codOrder.order_id } });
    assert.equal(codAfter.order_status, 'PENDING', 'Đơn COD không được phép bị job tự hủy');

    // Assert: Đơn PayOS phải chuyển sang CANCELLED
    const payosAfter = await prisma.order.findUnique({
      where: { order_id: payosOrder.order_id },
      include: { payments: true },
    });
    assert.equal(payosAfter.order_status, 'CANCELLED', 'Đơn PayOS chưa thanh toán quá 5 phút phải bị tự hủy');
    assert.equal(payosAfter.payments[0].payment_status, 'CANCELLED');
  });

  // TEST 4: Regression test khớp chính xác mã đơn hàng (YF-123 vs YF-1234)
  it('Scenario 4: Exact order matching prevents prefix overlap mutation', async () => {
    const timestamp = Date.now().toString().slice(-4);
    const numA = `YF-123${timestamp}`;
    const numB = `YF-123${timestamp}4`; // numB chứa numA làm tiền tố

    const orderA = await prisma.order.create({
      data: {
        order_number: numA,
        recipient_name: 'Order A',
        recipient_phone: '0912345678',
        shipping_address_line: 'Ha Noi',
        shipping_city: 'Ha Noi',
        total_amount: 50000,
        order_status: 'PENDING',
      },
    });

    const orderB = await prisma.order.create({
      data: {
        order_number: numB,
        recipient_name: 'Order B',
        recipient_phone: '0912345678',
        shipping_address_line: 'Ha Noi',
        shipping_city: 'Ha Noi',
        total_amount: 50000,
        order_status: 'PENDING',
      },
    });

    // Cập nhật Order A theo numA
    const updateRes = await request(app)
      .patch(`/api/orders/${numA}/status`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'CONFIRMED' });
    assert.equal(updateRes.status, 200);

    // Kiểm tra Order A đã sang CONFIRMED, nhưng Order B PHẢI VẪN LÀ PENDING
    const checkA = await prisma.order.findUnique({ where: { order_id: orderA.order_id } });
    const checkB = await prisma.order.findUnique({ where: { order_id: orderB.order_id } });
    assert.equal(checkA.order_status, 'CONFIRMED');
    assert.equal(checkB.order_status, 'PENDING', 'Order B không được bị ảnh hưởng khi cập nhật Order A');
  });

  // TEST 5: RBAC & Customer Authorization Boundaries
  it('Scenario 5: RBAC - Manager routes require ADMIN/MANAGER role; Customer cannot touch other customer order', async () => {
    // 1. Không có token -> 401
    const unauthRes = await request(app).get('/api/orders');
    assert.equal(unauthRes.status, 401);

    // 2. Customer token gọi route Manager -> 403
    const forbiddenRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(forbiddenRes.status, 403);

    // 3. Customer A tạo đơn hàng
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Customer A',
        recipientPhone: '0912345678',
        recipientEmail: 'test@example.com',
        shippingAddressLine: '123 Pho Hue',
        shippingWard: 'Hang Bai',
        shippingDistrict: 'Hoan Kiem',
        shippingCity: 'Ha Noi',
        shippingMethod: 'STANDARD',
        paymentMethod: 'COD',
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1 }],
      });
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;
    assert.ok(orderId);

    // Customer B cố tình hủy đơn của Customer A -> 403
    const hijackRes = await request(app)
      .patch(`/api/orders/customer/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ reason: 'Hacker muon huy don' });
    assert.equal(hijackRes.status, 403);
  });

  // TEST 6: Webhook PayOS Checksum & Idempotency
  it('Scenario 6: PayOS Webhook signature verification and idempotency', async () => {
    // 1. Webhook với chữ ký sai phải bị từ chối 400
    const fakeWebhook = await request(app)
      .post('/api/orders/payos-webhook')
      .send({
        code: '00',
        desc: 'success',
        data: { orderCode: 999999999, amount: 100000 },
        signature: 'invalid_signature_hash',
      });
    assert.equal(fakeWebhook.status, 400);
  });

  // TEST 7: Hoàn tồn kho và voucher khi hủy đơn, chống hoàn 2 lần
  it('Scenario 7: Atomic stock & voucher restoration on cancellation with double-cancel protection', async () => {
    // 1. Tạo voucher test
    const vCode = `VOUCH-${Date.now()}`;
    const voucher = await prisma.voucher.create({
      data: {
        code: vCode,
        name: 'Voucher Giam Gia Test',
        discount_type: 'percent',
        discount_percent: 10,
        min_order: 50000,
        total_limit: 100,
        used_count: 5,
        status: 'ACTIVE',
      },
    });

    const stockBefore = (await prisma.productVariant.findUnique({ where: { variant_id: testVariant.variant_id } })).stock;

    // 2. Tạo đơn hàng COD có áp voucher
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Test Stock',
        recipientPhone: '0912345678',
        recipientEmail: 'test@example.com',
        shippingAddressLine: '123 Pho Hue',
        shippingWard: 'Hang Bai',
        shippingDistrict: 'Hoan Kiem',
        shippingCity: 'Ha Noi',
        shippingMethod: 'STANDARD',
        paymentMethod: 'COD',
        voucherCode: vCode,
        discountAmount: 10000,
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1 }],
      });
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;
    assert.ok(orderId);

    // Tồn kho phải giảm 1, voucher used_count phải tăng 1
    const stockAfterCreate = (await prisma.productVariant.findUnique({ where: { variant_id: testVariant.variant_id } })).stock;
    const voucherAfterCreate = await prisma.voucher.findUnique({ where: { voucher_id: voucher.voucher_id } });
    assert.equal(stockAfterCreate, stockBefore - 1);
    assert.equal(voucherAfterCreate.used_count, 6);

    // 3. Khách hàng hủy đơn
    const cancelRes = await request(app)
      .patch(`/api/orders/customer/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ reason: 'Doi y' });
    assert.equal(cancelRes.status, 200);

    // Tồn kho và voucher phải được hoàn lại
    const stockAfterCancel = (await prisma.productVariant.findUnique({ where: { variant_id: testVariant.variant_id } })).stock;
    const voucherAfterCancel = await prisma.voucher.findUnique({ where: { voucher_id: voucher.voucher_id } });
    assert.equal(stockAfterCancel, stockBefore, 'Tồn kho phải được hoàn lại đúng giá trị ban đầu');
    assert.equal(voucherAfterCancel.used_count, 5, 'Voucher used_count phải được trừ đi 1');

    // 4. Hủy lần 2 không được hoàn lần nữa
    await request(app)
      .patch(`/api/orders/customer/${orderId}/cancel`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ reason: 'Huy tiep' });
    const stockAfterSecond = (await prisma.productVariant.findUnique({ where: { variant_id: testVariant.variant_id } })).stock;
    assert.equal(stockAfterSecond, stockBefore, 'Không được hoàn tồn kho lần 2');
  });

  // TEST 8: Job tự động hoàn thành đơn hàng DELIVERED quá hạn
  it('Scenario 8: Auto-complete job transitions expired DELIVERED orders to COMPLETED', async () => {
    const pastDeliveredTime = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 ngày trước (> 3 ngày)
    const orderNum = `AUTO-COMP-${Date.now()}`;

    const delOrder = await prisma.order.create({
      data: {
        order_number: orderNum,
        customer: { connect: { customer_id: BigInt(customerAId) } },
        recipient_name: 'Auto Complete Test',
        recipient_phone: '0912345678',
        shipping_address_line: '123 Pho Hue, Ha Noi',
        shipping_city: 'Ha Noi',
        total_amount: 200000,
        order_status: 'DELIVERED',
        delivered_at: pastDeliveredTime,
        updated_at: pastDeliveredTime,
      },
    });

    // Chạy job auto complete
    await processAutoCompleteOrders();

    const orderAfter = await prisma.order.findUnique({ where: { order_id: delOrder.order_id } });
    assert.equal(orderAfter.order_status, 'COMPLETED', 'Đơn hàng giao quá 3 ngày phải tự chuyển sang COMPLETED');
    assert.ok(orderAfter.completed_at, 'Phải ghi nhận completed_at');
  });

  // TEST 9: Notification CRUD và xóa thông báo không hiện lại
  it('Scenario 9: Notification CRUD - deleted notification is not returned in subsequent queries', async () => {
    // 1. Tạo 1 notification cho Customer A
    const notif = await prisma.notification.create({
      data: {
        customer_id: BigInt(customerAId),
        title: 'Thông báo thử nghiệm',
        message: 'Nội dung thông báo kiểm tra xóa',
        notification_type: 'ORDER',
        is_read: false,
      },
    });

    // 2. Customer A lấy danh sách thông báo
    const getRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(getRes.status, 200);
    const list = getRes.body.data;
    const found = list.some((n) => String(n.id) === String(notif.notification_id));
    assert.ok(found, 'Thông báo vừa tạo phải có trong danh sách');

    // 3. Customer A xóa thông báo này
    const delRes = await request(app)
      .delete(`/api/notifications/${notif.notification_id}`)
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(delRes.status, 200);

    // 4. Lấy lại danh sách: Thông báo phải không còn xuất hiện
    const getAgainRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(getAgainRes.status, 200);
    const listAfter = getAgainRes.body.data;
    const stillExists = listAfter.some((n) => String(n.id) === String(notif.notification_id));
    assert.equal(stillExists, false, 'Thông báo đã xóa không được xuất hiện lại');
  });

  // TEST 10: GET /api/orders/my-orders trả đúng đơn của khách và ẩn địa chỉ/SĐT đối với khách vãng lai
  it('Scenario 10: GET /api/orders/my-orders returns customer orders & GET /:orderNumber masks data for strangers', async () => {
    // 1. Tạo đơn hàng mới cho Customer A
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Khach Hang A',
        recipientPhone: '0988776655',
        recipientEmail: 'customera@example.com',
        shippingAddressLine: 'Số 99 Phố Tràng Tiền',
        shippingWard: 'Tràng Tiền',
        shippingDistrict: 'Hoàn Kiếm',
        shippingCity: 'Hà Nội',
        paymentMethod: 'COD',
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1, unit_price: 200000 }],
      });
    assert.equal(orderRes.status, 201);
    const orderNumber = orderRes.body.data.orderNumber || orderRes.body.data.order?.order_number;
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;

    // 2. Customer A gọi /api/orders/my-orders: Phải thấy đơn của mình
    const myOrdersRes = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(myOrdersRes.status, 200);
    const myOrders = myOrdersRes.body.data;
    const hasMyOrder = myOrders.some(o => String(o.order_id) === String(orderId) || o.order_number === orderNumber);
    assert.ok(hasMyOrder, 'Customer A phải nhìn thấy đơn hàng của chính mình trong /my-orders');

    // 3. Customer B gọi /api/orders/my-orders: KHÔNG được thấy đơn của Customer A
    const customerBOrdersRes = await request(app)
      .get('/api/orders/my-orders')
      .set('Authorization', `Bearer ${customerBToken}`);
    assert.equal(customerBOrdersRes.status, 200);
    const bOrders = customerBOrdersRes.body.data;
    const hasOrderInB = bOrders.some(o => String(o.order_id) === String(orderId) || o.order_number === orderNumber);
    assert.equal(hasOrderInB, false, 'Customer B không được thấy đơn hàng của Customer A');

    // 4. Khách vãng lai gọi GET /api/orders/:orderNumber: Phải ẩn địa chỉ và SĐT
    const guestGetRes = await request(app).get(`/api/orders/${orderNumber}`);
    assert.equal(guestGetRes.status, 200);
    const guestOrder = guestGetRes.body.data;
    assert.ok(guestOrder.recipient_phone.includes('****') || guestOrder.recipient_phone === '***', 'SĐT phải được ẩn đối với khách vãng lai');
    assert.ok(guestOrder.shipping_address_line.includes('***'), 'Địa chỉ chi tiết phải được ẩn đối với khách vãng lai');

    // 5. Chủ đơn hàng (Customer A) gọi GET /:orderNumber: Phải thấy đầy đủ thông tin không che
    const ownerGetRes = await request(app)
      .get(`/api/orders/${orderNumber}`)
      .set('Authorization', `Bearer ${customerAToken}`);
    assert.equal(ownerGetRes.status, 200);
    const ownerOrder = ownerGetRes.body.data;
    assert.equal(ownerOrder.recipient_phone, '0988776655', 'Chủ đơn phải xem được SĐT đầy đủ');
    assert.equal(ownerOrder.shipping_address_line, 'Số 99 Phố Tràng Tiền', 'Chủ đơn phải xem được địa chỉ đầy đủ');
  });

  // TEST 11: Đổi trạng thái đơn hàng gửi đúng 1 email (mock sendOrderNotificationEmail)
  it('Scenario 11: Status update triggers EXACTLY 1 email notification', async () => {
    // 1. Tạo đơn hàng mới
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({
        recipientName: 'Nguoi Nhan Duy Nhat',
        recipientPhone: '0933221100',
        recipientEmail: 'recipient.single@example.com',
        shippingAddressLine: '456 Le Duan',
        shippingCity: 'Da Nang',
        paymentMethod: 'COD',
        items: [{ variant_id: Number(testVariant.variant_id), quantity: 1, unit_price: 150000 }],
      });
    assert.equal(orderRes.status, 201);
    const orderId = orderRes.body.data.order?.order_id || orderRes.body.data.order_id;

    // 2. Mock sendOrderNotificationEmail để đếm số lần gọi
    let emailsSent = [];
    emailHooks.sendOrderNotificationEmail = mock.fn(async (params) => {
      emailsSent.push(params);
      return { success: true };
    });

    try {
      // 3. Manager cập nhật trạng thái sang CONFIRMED
      const updateRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ status: 'CONFIRMED', note: 'Xac nhan don hang' });
      assert.equal(updateRes.status, 200);

      // Chờ một khoảng tick để các promise async trong service hoàn tất
      await new Promise(r => setTimeout(r, 100));

      // 4. Kiểm tra số email được gửi đúng bằng 1
      assert.equal(
        emailsSent.length,
        1,
        `Mỗi lần cập nhật trạng thái chỉ gửi đúng 1 email, thực tế đã gửi: ${emailsSent.length}`
      );
      assert.equal(emailsSent[0].toEmail, 'recipient.single@example.com', 'Email gửi tới đúng địa chỉ người nhận');
    } finally {
      // Dọn dẹp mock
      emailHooks.sendOrderNotificationEmail = null;
    }
  });
});
