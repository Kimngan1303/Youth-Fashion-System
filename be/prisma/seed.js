import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang khởi tạo tài khoản Manager & Admin trong DB ---');

  const defaultPassword = '123456';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 1. Tạo hoặc cập nhật tài khoản Manager
  const manager = await prisma.employee.upsert({
    where: { email: 'mana@gmail.com' },
    update: {
      password_hash: hashedPassword,
      employee_role: 'MANAGER',
      status: 'ACTIVE',
    },
    create: {
      employee_code: 'EMP_MANA_01',
      full_name: 'Quản Lý Youth Fashion',
      email: 'mana@gmail.com',
      phone: '0988777666',
      password_hash: hashedPassword,
      employee_role: 'MANAGER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Đã tạo/cập nhật tài khoản Manager: ${manager.email} (Pass: ${defaultPassword})`);

  // 2. Tạo hoặc cập nhật tài khoản Admin
  const admin = await prisma.employee.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password_hash: hashedPassword,
      employee_role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      employee_code: 'EMP_ADMIN_01',
      full_name: 'Admin Youth Fashion',
      email: 'admin@gmail.com',
      phone: '0999888777',
      password_hash: hashedPassword,
      employee_role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Đã tạo/cập nhật tài khoản Admin: ${admin.email} (Pass: ${defaultPassword})`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
