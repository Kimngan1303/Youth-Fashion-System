import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, 'docs', 'e2e-screenshots');

async function runE2E() {
  console.log('🚀 Starting Playwright E2E Test Suite...');
  const browser = await chromium.launch({ headless: true });

  const managerUser = {
    id: 1,
    employeeId: 1,
    full_name: 'Quản Lý Youth Fashion',
    email: 'mana@gmail.com',
    role: 'MANAGER',
    employee_role: 'MANAGER',
    user_type: 'EMPLOYEE',
  };

  const customerUser = {
    id: 1,
    customerId: 1,
    customer_id: 1,
    full_name: 'Quản Lý Youth Fashion',
    email: 'customer.test@example.com',
    phone: '0987777777',
    role: 'CUSTOMER',
    user_type: 'CUSTOMER',
  };

  // 1. Context Customer
  const customerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const customerPage = await customerContext.newPage();

  // Set customer auth into localStorage
  await customerPage.goto('http://localhost:3000');
  await customerPage.evaluate((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', 'mock_token');
  }, customerUser);

  // 1. Customer Orders Page & Tabs
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '01_customer_orders_tabs.png'), fullPage: false });
  console.log('📸 Captured 01_customer_orders_tabs.png');

  // 2. Context Manager
  const managerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const managerPage = await managerContext.newPage();

  await managerPage.goto('http://localhost:3000');
  await managerPage.evaluate((user) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', 'mock_token');
  }, managerUser);

  // 2. Manager Orders Page & Tabs
  await managerPage.goto('http://localhost:3000/manager/orders');
  await managerPage.waitForTimeout(2000);
  await managerPage.screenshot({ path: path.join(screenshotsDir, '02_manager_order_tabs.png'), fullPage: false });
  console.log('📸 Captured 02_manager_order_tabs.png');

  // 3. Manager - Delivery Failed & Retry tab
  const failedTab = await managerPage.$('.order-tab-btn.tab-failed');
  if (failedTab) {
    await failedTab.click();
    await managerPage.waitForTimeout(1000);
  }
  await managerPage.screenshot({ path: path.join(screenshotsDir, '03_delivery_failed_and_retry.png'), fullPage: false });
  console.log('📸 Captured 03_delivery_failed_and_retry.png');

  // 4. Customer - Delivered order with "Đã nhận được hàng" button
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  const deliveredTab = await customerPage.$('.status-tab.tab-delivered');
  if (deliveredTab) {
    await deliveredTab.click();
    await customerPage.waitForTimeout(1000);
  }
  await customerPage.screenshot({ path: path.join(screenshotsDir, '04_customer_received_button.png'), fullPage: false });
  console.log('📸 Captured 04_customer_received_button.png');

  // 5. Manager - Completed action
  await managerPage.goto('http://localhost:3000/manager/orders');
  await managerPage.waitForTimeout(2000);
  const completedTab = await managerPage.$('.order-tab-btn.tab-completed');
  if (completedTab) {
    await completedTab.click();
    await managerPage.waitForTimeout(1000);
  }
  await managerPage.screenshot({ path: path.join(screenshotsDir, '05_manager_completed_action.png'), fullPage: false });
  console.log('📸 Captured 05_manager_completed_action.png');

  // 6. Customer - Shop-cancelled PayOS order with Refund Request Modal
  await customerPage.goto('http://localhost:3000/profile?tab=orders');
  await customerPage.waitForTimeout(2000);
  const cancelledTab = await customerPage.$('.status-tab.tab-cancelled');
  if (cancelledTab) {
    await cancelledTab.click();
    await customerPage.waitForTimeout(1000);
  }
  const refundBtn = await customerPage.$('.btn-purple-outline');
  if (refundBtn) {
    await refundBtn.click();
    await customerPage.waitForTimeout(1000);
  }
  await customerPage.screenshot({ path: path.join(screenshotsDir, '06_payos_refund_request.png'), fullPage: false });
  console.log('📸 Captured 06_payos_refund_request.png');

  // 7. Customer - Notification Page & Clean Deletion
  await customerPage.goto('http://localhost:3000/notifications');
  await customerPage.waitForTimeout(2000);
  await customerPage.screenshot({ path: path.join(screenshotsDir, '07_notification_deleted_clean.png'), fullPage: false });
  console.log('📸 Captured 07_notification_deleted_clean.png');

  await browser.close();
  console.log('✅ All 7 Playwright E2E screenshots successfully generated in docs/e2e-screenshots/');
}

runE2E().catch((err) => {
  console.error('❌ E2E failed:', err);
  process.exit(1);
});
