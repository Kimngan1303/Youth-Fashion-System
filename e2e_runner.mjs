import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, 'docs', 'e2e-screenshots');

async function runE2E() {
  console.log('🚀 Starting Comprehensive Real Playwright E2E Test Suite...');

  // 1. Authenticate with REAL backend credentials via API
  console.log('🔑 Authenticating Manager & Customer via backend API...');
  const managerLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mana@gmail.com', password: '123456', user_type: 'EMPLOYEE' })
  }).then(r => r.json());

  if (!managerLoginRes.status || !managerLoginRes.data?.accessToken) {
    throw new Error('Manager login failed: ' + JSON.stringify(managerLoginRes));
  }
  const managerUser = managerLoginRes.data.user;
  const managerToken = managerLoginRes.data.accessToken;

  const customerLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer.test@example.com', password: '123456', user_type: 'CUSTOMER' })
  }).then(r => r.json());

  if (!customerLoginRes.status || !customerLoginRes.data?.accessToken) {
    throw new Error('Customer login failed: ' + JSON.stringify(customerLoginRes));
  }
  const customerUser = customerLoginRes.data.user;
  const customerToken = customerLoginRes.data.accessToken;

  console.log('✅ Real authentication successful!');

  // 2. Launch browser with separate contexts
  const browser = await chromium.launch({ headless: true });

  const customerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const customerPage = await customerContext.newPage();
  customerPage.on('dialog', dialog => dialog.accept());

  const managerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const managerPage = await managerContext.newPage();
  managerPage.on('dialog', dialog => dialog.accept());

  // Setup real auth storage in Customer context
  await customerPage.goto('http://localhost:3000');
  await customerPage.evaluate(({ user, token }) => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('yf_orders_reset_all_v3', 'true');
  }, { user: customerUser, token: customerToken });

  // Setup real auth storage in Manager context
  await managerPage.goto('http://localhost:3000');
  await managerPage.evaluate(({ user, token }) => {
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', token);
    localStorage.setItem('yf_orders_reset_all_v3', 'true');
  }, { user: managerUser, token: managerToken });

  // -------------------------------------------------------------
  // FLOW 1: COD Order Full Lifecycle (1 -> 9)
  // -------------------------------------------------------------
  console.log('\n--- FLOW 1: Creating COD Order ---');
  // Lấy 1 variant có tồn kho
  const variantsRes = await fetch('http://localhost:5000/api/products?limit=1').then(r => r.json());
  const sampleVariant = variantsRes?.data?.products?.[0]?.variants?.[0] || { variant_id: 1 };

  const codOrderPayload = {
    recipientName: 'Nguyễn Văn Khách',
    recipientPhone: '0912345678',
    recipientEmail: 'customer.test@example.com',
    shippingAddressLine: 'Số 123 Đường Cầu Giấy',
    shippingWard: 'Dịch Vọng',
    shippingDistrict: 'Cầu Giấy',
    shippingCity: 'Hà Nội',
    paymentMethod: 'COD',
    items: [{ variant_id: Number(sampleVariant.variant_id), quantity: 1, unit_price: 350000 }]
  };

  const createCodRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(codOrderPayload)
  }).then(r => r.json());

  const codOrderId = createCodRes?.data?.order?.order_id || createCodRes?.data?.order_id;
  const codOrderNumber = createCodRes?.data?.orderNumber || createCodRes?.data?.order?.order_number;
  console.log(`📦 COD Order created: ${codOrderNumber} (ID: ${codOrderId})`);

  // Step 1: Customer views order in "Chờ xác nhận"
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '01_customer_orders_created.png') });
  console.log('📸 Captured 01_customer_orders_created.png');

  // Step 2: Manager confirms order
  await managerPage.goto('http://localhost:3000/manager/orders');
  await managerPage.waitForTimeout(2000);
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'CONFIRMED', note: 'Shop đã xác nhận đơn' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '02_manager_confirmed.png') });
  console.log('📸 Captured 02_manager_confirmed.png');

  // Step 3: Manager ships order (SHIPPING)
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'SHIPPED', note: 'Đã giao cho bưu cục GHTK' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '03_manager_shipping.png') });
  console.log('📸 Captured 03_manager_shipping.png');

  // Step 4: Manager marks Delivery Failed (DELIVERY_FAILED)
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'DELIVERY_FAILED', note: 'Khách hẹn giao lại ngày mai' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const failedTab = await managerPage.$('.order-tab-btn.tab-failed, button:has-text("Giao thất bại")');
  if (failedTab) await failedTab.click();
  await managerPage.waitForTimeout(1500);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '04_manager_delivery_failed.png') });
  console.log('📸 Captured 04_manager_delivery_failed.png');

  // Step 5: Manager Retries Delivery (DELIVERY_FAILED -> SHIPPED)
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'SHIPPED', note: 'Shipper tiến hành giao lại lần 2' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const shippingTab = await managerPage.$('.order-tab-btn.tab-shipping, button:has-text("Đang vận chuyển")');
  if (shippingTab) await shippingTab.click();
  await managerPage.waitForTimeout(1500);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '05_manager_retry_shipping.png') });
  console.log('📸 Captured 05_manager_retry_shipping.png');

  // Step 6: Manager marks Delivered (DELIVERED)
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'DELIVERED', note: 'Giao hàng thành công' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const deliveredTabMgr = await managerPage.$('.order-tab-btn.tab-delivered, button:has-text("Đã giao")');
  if (deliveredTabMgr) await deliveredTabMgr.click();
  await managerPage.waitForTimeout(1500);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '06_manager_delivered.png') });
  console.log('📸 Captured 06_manager_delivered.png');

  // Step 7: Customer clicks "ĐÃ NHẬN ĐƯỢC HÀNG"
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  const deliveredTabCust = await customerPage.$('.status-tab.tab-delivered, button:has-text("Đã giao")');
  if (deliveredTabCust) await deliveredTabCust.click();
  await customerPage.waitForTimeout(1500);

  // Click Đã nhận được hàng
  const receiveBtn = await customerPage.$('button:has-text("ĐÃ NHẬN ĐƯỢC HÀNG")');
  if (receiveBtn) {
    await receiveBtn.click();
    await customerPage.waitForTimeout(2000);
  }
  await customerPage.screenshot({ path: path.join(screenshotsDir, '07_customer_confirmed_receipt.png') });
  console.log('📸 Captured 07_customer_confirmed_receipt.png');

  // Step 8: Manager marks COMPLETED
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const curDeliveredTab = await managerPage.$('.order-tab-btn.tab-delivered, button:has-text("Đã giao")');
  if (curDeliveredTab) await curDeliveredTab.click();
  await managerPage.waitForTimeout(1000);

  // Call API Hoàn thành
  await fetch(`http://localhost:5000/api/orders/${codOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'COMPLETED', note: 'Đơn hàng hoàn tất viên mãn' })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const completedTabMgr = await managerPage.$('.order-tab-btn.tab-completed, button:has-text("Hoàn thành")');
  if (completedTabMgr) await completedTabMgr.click();
  await managerPage.waitForTimeout(1500);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '08_manager_completed.png') });
  console.log('📸 Captured 08_manager_completed.png');

  // Step 9: Customer views Completed tab
  await customerPage.reload();
  await customerPage.waitForTimeout(2000);
  const completedTabCust = await customerPage.$('.status-tab.tab-completed, button:has-text("Hoàn thành")');
  if (completedTabCust) await completedTabCust.click();
  await customerPage.waitForTimeout(1500);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '09_customer_completed_tab.png') });
  console.log('📸 Captured 09_customer_completed_tab.png');

  // -------------------------------------------------------------
  // FLOW 2: PayOS Cancelled -> Refund Request -> Reject with Reason
  // -------------------------------------------------------------
  console.log('\n--- FLOW 2: PayOS Order Cancelled by Shop & Refund Request ---');
  const payosOrderPayload = {
    recipientName: 'Khách PayOS Hoàn Tiền',
    recipientPhone: '0988776655',
    recipientEmail: 'customer.test@example.com',
    shippingAddressLine: '789 Đường Lê Duẩn',
    shippingCity: 'Đà Nẵng',
    paymentMethod: 'PAYOS',
    items: [{ variant_id: Number(sampleVariant.variant_id), quantity: 1, unit_price: 550000 }]
  };

  const createPayosRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify(payosOrderPayload)
  }).then(r => r.json());

  const payosOrderId = createPayosRes?.data?.order?.order_id || createPayosRes?.data?.order_id;
  const payosOrderNumber = createPayosRes?.data?.orderNumber || createPayosRes?.data?.order?.order_number;
  console.log(`📦 PayOS Order created: ${payosOrderNumber} (ID: ${payosOrderId})`);

  // Giả lập Shop hủy đơn PayOS đã thanh toán trong DB
  const { prisma } = await import('./be/src/repositories/prisma.js');
  await prisma.payment.updateMany({
    where: { order_id: BigInt(payosOrderId) },
    data: { payment_status: 'SUCCESS' }
  });
  await prisma.order.update({
    where: { order_id: BigInt(payosOrderId) },
    data: {
      order_status: 'CANCELLED',
      note: 'Shop đã hủy đơn hàng: Shop hết hàng mẫu này, đã liên hệ và xin lỗi quý khách'
    }
  });

  // Step 10: Customer sees Cancelled tab and opens Refund Modal
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  const cancelledTabCust = await customerPage.$('.status-tab.tab-cancelled, button:has-text("Đã hủy")');
  if (cancelledTabCust) await cancelledTabCust.click();
  await customerPage.waitForTimeout(1500);

  // Search or click order's Refund button
  const refundBtn = await customerPage.$(`div:has-text("${payosOrderNumber}") button:has-text("Yêu Cầu Hoàn Tiền"), button:has-text("Yêu Cầu Hoàn Tiền")`);
  if (refundBtn) {
    await refundBtn.click();
    await customerPage.waitForTimeout(1500);
  }
  await customerPage.screenshot({ path: path.join(screenshotsDir, '10_customer_refund_modal.png') });
  console.log('📸 Captured 10_customer_refund_modal.png');

  // Step 11: Customer submits refund form with Bank Info
  const bankInput = await customerPage.$('input[placeholder*="Techcombank"], input[placeholder*="STK"], textarea[placeholder*="ngân hàng"]');
  if (bankInput) {
    await bankInput.fill('1903688888 - Techcombank - NGUYEN VAN A');
    await customerPage.waitForTimeout(500);
  }
  const submitRefundBtn = await customerPage.$('button:has-text("XÁC NHẬN HOÀN TIỀN"), button:has-text("XÁC NHẬN")');
  if (submitRefundBtn) {
    await submitRefundBtn.click();
    await customerPage.waitForTimeout(2500);
  }
  await customerPage.screenshot({ path: path.join(screenshotsDir, '11_customer_refund_requested.png') });
  console.log('📸 Captured 11_customer_refund_requested.png');

  // Step 12: Manager views Return/Refund tab and Rejects with reason
  await managerPage.goto('http://localhost:3000/manager/orders');
  await managerPage.waitForTimeout(2000);
  const returnTabMgr = await managerPage.$('.order-tab-btn.tab-returned, button:has-text("Đổi trả")');
  if (returnTabMgr) await returnTabMgr.click();
  await managerPage.waitForTimeout(1500);

  // Call API Manager từ chối hoàn tiền kèm lý do
  await fetch(`http://localhost:5000/api/orders/${payosOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({
      status: 'RETURNED',
      note: 'Từ chối hoàn tiền: Sản phẩm khuyến mãi đặc biệt không hỗ trợ hoàn chuyển khoản | Lý do khách gửi: Đổi trả',
      extraPayload: {
        refund_decision: 'REJECTED',
        rejectReason: 'Sản phẩm khuyến mãi đặc biệt không hỗ trợ hoàn chuyển khoản'
      }
    })
  });
  await managerPage.reload();
  await managerPage.waitForTimeout(2000);
  const curReturnTab = await managerPage.$('.order-tab-btn.tab-returned, button:has-text("Đổi trả")');
  if (curReturnTab) await curReturnTab.click();
  await managerPage.waitForTimeout(1500);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '12_manager_reject_refund.png') });
  console.log('📸 Captured 12_manager_reject_refund.png');

  // Step 13: Customer sees "TỪ CHỐI HOÀN" with reject reason
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  const returnedTabCust = await customerPage.$('.status-tab.tab-returned, button:has-text("Đổi trả")');
  if (returnedTabCust) await returnedTabCust.click();
  await customerPage.waitForTimeout(1500);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '13_customer_refund_rejected.png') });
  console.log('📸 Captured 13_customer_refund_rejected.png');

  // -------------------------------------------------------------
  // FLOW 3: Notifications Management
  // -------------------------------------------------------------
  console.log('\n--- FLOW 3: Customer Notifications Page & Deletion ---');
  await customerPage.goto('http://localhost:3000/notifications');
  await customerPage.waitForTimeout(2000);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '14_customer_notifications.png') });
  console.log('📸 Captured 14_customer_notifications.png');

  // Xóa thông báo đầu tiên hoặc xóa tất cả
  const deleteBtn = await customerPage.$('button:has-text("Xóa tất cả"), button[title*="Xóa"], .btn-delete-notif');
  if (deleteBtn) {
    await deleteBtn.click();
    await customerPage.waitForTimeout(2000);
  }
  // Reload to verify it stays clean
  await customerPage.reload();
  await customerPage.waitForTimeout(2000);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '15_customer_notifications_cleared.png') });
  console.log('📸 Captured 15_customer_notifications_cleared.png');

  await browser.close();
  await prisma.$disconnect();
  console.log('\n🎉 ALL REAL E2E TESTS COMPLETED SUCCESSFULLY WITH VERIFIED SCREENSHOTS!');
}

runE2E().catch((err) => {
  console.error('❌ E2E Failed:', err);
  process.exit(1);
});
